import type { Page } from '@playwright/test';

/** Wait until at least one chart canvas has been sized, i.e. the renderer has painted. */
export async function waitForCanvas(page: Page) {
  await page.waitForSelector('canvas');
  await page.waitForFunction(() =>
    [...document.querySelectorAll('canvas')].some(canvas => canvas.width > 0 && canvas.height > 0),
  );
}

/** Open a route with no persisted chart state and wait for the chart to paint. */
export async function openFresh(page: Page, path = '/playground') {
  await page.goto(path);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForCanvas(page);
}

/** Viewport box of the largest canvas -- the main plot. */
export const chartRect = (page: Page) =>
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

/**
 * Cheap checksum of the largest canvas, sampled on a grid. Sampling keeps it fast
 * and robust to antialiasing noise while still changing whenever the chart
 * redraws different content.
 */
export const canvasSignature = (page: Page) =>
  page.locator('canvas').evaluateAll(canvases => {
    const largest = canvases
      .map(canvas => ({ canvas, area: canvas.getBoundingClientRect().width * canvas.getBoundingClientRect().height }))
      .sort((a, b) => b.area - a.area)[0]?.canvas as HTMLCanvasElement | undefined;
    const context = largest?.getContext('2d');
    if (!largest || !context) return '';
    const { data } = context.getImageData(0, 0, largest.width, largest.height);
    let checksum = 0;
    for (let index = 0; index < data.length; index += 4 * 97) {
      checksum = (checksum * 31 + data[index] + data[index + 1] * 3 + data[index + 2] * 7) % 2147483647;
    }
    return String(checksum);
  });
