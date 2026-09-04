import { expect, test } from '@playwright/test';

/**
 * Pointer and touch gestures against the real renderer.
 *
 * The route suite covers controls and drawing; these cover the continuous
 * interactions — wheel zoom, drag pan, dragging a placed overlay, and two-finger
 * pinch — which are the paths most likely to break silently, because nothing
 * about the DOM changes when they do.
 *
 * Zoom and pan are asserted on a pixel signature of the main canvas. The chart
 * only persists state when overlays change, so `localStorage` cannot see a pan;
 * and a repaint is the observable effect anyway — if the signature moved, the
 * gesture reached the renderer.
 */

/**
 * Cheap checksum of the largest canvas, sampled on a grid.
 *
 * Sampling rather than hashing every pixel keeps this fast and makes it robust
 * to sub-pixel antialiasing noise, while still changing whenever the chart
 * actually redraws different content.
 */
const canvasSignature = (page: import('@playwright/test').Page) =>
  page.locator('canvas').evaluateAll(canvases => {
    const largest = canvases
      .map(canvas => ({ canvas, area: canvas.getBoundingClientRect().width * canvas.getBoundingClientRect().height }))
      .sort((a, b) => b.area - a.area)[0]?.canvas as HTMLCanvasElement | undefined;
    if (!largest) return '';
    const context = largest.getContext('2d');
    if (!context) return '';
    const { data } = context.getImageData(0, 0, largest.width, largest.height);
    let checksum = 0;
    for (let index = 0; index < data.length; index += 4 * 97) {
      checksum = (checksum * 31 + data[index] + data[index + 1] * 3 + data[index + 2] * 7) % 2147483647;
    }
    return String(checksum);
  });

const settle = async (page: import('@playwright/test').Page) => {
  await page.goto('/playground');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('canvas');
  await page.waitForFunction(() =>
    [...document.querySelectorAll('canvas')].some(canvas => canvas.width > 0 && canvas.height > 0),
  );
  await page.waitForTimeout(600);
};

const chartRect = (page: import('@playwright/test').Page) =>
  page.locator('canvas').evaluateAll(canvases => {
    const largest = canvases
      .map(canvas => {
        const box = canvas.getBoundingClientRect();
        return { left: box.left, top: box.top, width: box.width, height: box.height, area: box.width * box.height };
      })
      .sort((a, b) => b.area - a.area)[0];
    if (!largest) throw new Error('no canvas');
    return largest;
  });

/** Two-finger pinch. Playwright's touchscreen is single-touch, so this goes through CDP. */
async function pinch(
  page: import('@playwright/test').Page,
  centre: { x: number; y: number },
  from: number,
  to: number,
) {
  const client = await page.context().newCDPSession(page);
  const touches = (spread: number) => [
    { x: centre.x - spread, y: centre.y, id: 1 },
    { x: centre.x + spread, y: centre.y, id: 2 },
  ];
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touches(from) });
  const steps = 10;
  for (let step = 1; step <= steps; step += 1) {
    const spread = from + ((to - from) * step) / steps;
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touches(spread) });
    await page.waitForTimeout(16);
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await client.detach();
}

test.describe('pointer gestures', () => {
  test('ctrl+wheel zooms the time axis', async ({ page }) => {
    await settle(page);
    const rect = await chartRect(page);
    const centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    await page.mouse.move(centre.x, centre.y);

    // Zoom is Ctrl/Cmd + wheel, not a plain wheel: the chart-body handler pans by
    // deltaX only, so vertical scrolling deliberately does not zoom. (A plain
    // wheel still triggers a repaint, so "did nothing" is not assertable from
    // pixels — the legend re-renders — which is why only the zoom is asserted.)
    const idle = await canvasSignature(page);
    await page.keyboard.down('Control');
    for (let step = 0; step < 6; step += 1) {
      await page.mouse.wheel(0, -120);
      await page.waitForTimeout(40);
    }
    await page.keyboard.up('Control');
    await expect.poll(async () => canvasSignature(page)).not.toBe(idle);

    const zoomedIn = await canvasSignature(page);
    await page.keyboard.down('Control');
    for (let step = 0; step < 6; step += 1) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(40);
    }
    await page.keyboard.up('Control');
    await expect.poll(async () => canvasSignature(page)).not.toBe(zoomedIn);
  });

  test('drag pans the time axis', async ({ page }) => {
    await settle(page);
    const rect = await chartRect(page);
    const centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const before = await canvasSignature(page);

    await page.mouse.move(centre.x, centre.y);
    await page.mouse.down();
    await page.mouse.move(centre.x - rect.width * 0.25, centre.y, { steps: 20 });
    await page.mouse.up();

    await expect.poll(async () => canvasSignature(page)).not.toBe(before);
  });

  test('a placed overlay can be dragged to a new position', async ({ page }) => {
    await settle(page);
    // A rectangle: a two-point overlay with a body you can grab anywhere inside.
    await page.locator('[data-sidebar-drawing-tool="rectangle"]').click();

    const rect = await chartRect(page);
    const at = (fx: number, fy: number) => ({
      x: rect.left + rect.width * fx,
      y: rect.top + rect.height * fy,
    });
    const start = at(0.3, 0.4);
    const end = at(0.6, 0.6);
    await page.mouse.click(start.x, start.y);
    await page.mouse.click(end.x, end.y);

    const points = () =>
      page.evaluate(() => {
        const state = JSON.parse(localStorage.getItem('fscandle_chart_state_v4') || '{}');
        const layer = state.drawingLayers?.find((item: { id: string }) => item.id === state.activeDrawingLayerId);
        return (layer?.overlays ?? [])[0]?.points ?? [];
      });
    await expect.poll(async () => (await points()).length).toBe(2);
    const before = await points();

    // Grab the middle of the line — away from either handle — and move it.
    const middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    await page.mouse.move(middle.x, middle.y);
    await page.mouse.down();
    await page.mouse.move(middle.x + 80, middle.y - 60, { steps: 20 });
    await page.mouse.up();

    await expect
      .poll(async () => JSON.stringify(await points()))
      .not.toBe(JSON.stringify(before));
  });

  test('pinch zooms on a touch device', async ({ page, browserName }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-mobile', 'touch gestures need the mobile profile');
    void browserName;
    await settle(page);
    const rect = await chartRect(page);
    const centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const before = await canvasSignature(page);

    await pinch(page, centre, 40, 160);

    await expect.poll(async () => canvasSignature(page)).not.toBe(before);
  });
});

// Pane-divider drag had a browser-level regression test here that drove the
// second pane on the old homepage chart. The redesigned routes no longer expose
// a multi-pane chart, so the divider geometry and the drag-to-weight conversion
// are covered by `tests/unit/paneLayoutModel.test.ts` and the interaction
// controller unit tests instead. Restore an e2e case here once a route ships a
// stacked pane again.
