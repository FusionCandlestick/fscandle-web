import { expect, test } from '@playwright/test';
import { openFresh } from './helpers';

test.beforeEach(async ({ page }) => openFresh(page));
const openLibrary = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: /^Indicators/ }).click();
  return page.getByRole('dialog', { name: 'Indicators & Strategies' });
};
const saved = (page: import('@playwright/test').Page) => page.evaluate(() => JSON.parse(localStorage.getItem('fscandle_workspace_state_v2') ?? '{}').panelIndicators?.[0] ?? []);

test('search, favorites and packages work without a sidebar', async ({ page }) => {
  const dialog = await openLibrary(page);
  await expect(dialog.getByRole('navigation').getByRole('button')).toHaveCount(3);
  await expect(dialog).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  const bounds = await dialog.boundingBox();
  const category = await dialog.getByRole('button', { name: 'Popular Packages', exact: true }).boundingBox();
  expect(category!.x + category!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width);
  await expect(dialog.getByRole('button', { name: 'Favorites 5', exact: true })).toBeVisible();
  await dialog.screenshot({ path: `test-results/indicator-library-${test.info().project.name}.png` });
  await dialog.getByRole('button', { name: 'Favorites 5', exact: true }).click();
  await expect(dialog.getByRole('button', { name: /^Add / })).toHaveCount(5);
  await dialog.getByRole('button', { name: 'Unfavorite MA', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Favorites 4', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Popular Packages', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Search indicators' }).fill('volatility');
  await expect(dialog.getByRole('button', { name: /^Add / })).toHaveCount(1);
  await dialog.getByRole('button', { name: 'Add Volatility & reversion', exact: true }).click();
  await expect.poll(async () => (await saved(page)).map((item: {name: string}) => item.name)).toEqual(['BOLL', 'RSI', 'ATR']);
  await page.reload();
  const reopened = await openLibrary(page);
  await expect(reopened.getByRole('button', { name: 'Favorites 4', exact: true })).toBeVisible();
  await expect.poll(async () => (await saved(page)).length).toBe(3);
});

test('compiled plugins render and survive refresh', async ({ page }) => {
  const dialog = await openLibrary(page);
  await dialog.getByRole('button', { name: 'Custom Formulas', exact: true }).click();
  await expect(dialog.locator('textarea')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Add CANDLE_RANGE', exact: true }).click();
  await expect(dialog.getByRole('status')).toHaveText('Added Candle range');
  await expect.poll(async () => (await saved(page))[0]?.name).toBe('CANDLE_RANGE');
  await dialog.getByRole('button', { name: 'Close indicators' }).click();
  await expect(page.getByText('CANDLE_RANGE', { exact: false }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText('CANDLE_RANGE', { exact: false }).first()).toBeVisible();
  const id = (await saved(page))[0].id;
  await page.locator(`.fscandle-legend-del-ind[data-id="${id}"]`).click();
  await expect.poll(async () => (await saved(page)).length).toBe(0);
  await page.reload();
  await expect(page.getByText('CANDLE_RANGE', { exact: false })).toHaveCount(0);
});

test('crosshair horizontal line tracks the pointer in each pane', async ({ page }, info) => {
  test.skip(info.project.name.includes('mobile'), 'Touch devices do not have a hover crosshair.');
  const dialog = await openLibrary(page);
  await dialog.getByRole('button', { name: 'Add RSI', exact: true }).click();
  await dialog.getByRole('button', { name: 'Close indicators' }).click();
  const overlays = page.locator('canvas');
  const boxes = await overlays.evaluateAll(canvases => canvases.map(canvas => {
    const box = canvas.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height, z: getComputedStyle(canvas).zIndex };
  }).filter(box => ['10', '2100'].includes(box.z) && box.height > 60 && box.width > 200));
  expect(boxes.length).toBeGreaterThanOrEqual(2);
  for (const box of boxes) {
    const pointerY = Math.floor(box.y + box.height * 0.6);
    await page.mouse.move(box.x + box.width * 0.45, pointerY);
    await expect.poll(() => overlays.evaluateAll((canvases, target) => {
      const canvas = canvases.find(canvas => {
        const rect = canvas.getBoundingClientRect();
        return Math.abs(rect.y - target.top) < 1 && ['10', '2100'].includes(getComputedStyle(canvas).zIndex) && rect.height > 60;
      });
      if (!(canvas instanceof HTMLCanvasElement)) return 0;
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (!ctx) return 0;
      const y = Math.round((target.y - rect.y) * canvas.height / rect.height);
      const pixels = ctx.getImageData(0, Math.max(0, y - 2), canvas.width, 5).data;
      let count = 0;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) count++;
      return count / canvas.width;
    }, { top: box.y, y: pointerY })).toBeGreaterThan(0.2);
  }
  await page.screenshot({ path: 'test-results/crosshair-panes.png' });
});

test('indicators are added only to the active split panel', async ({ page }) => {
  await page.getByTitle('Chart Settings').click();
  await page.locator('[data-layout-mode="split-horizontal"]').click();
  await page.getByTitle('Chart Settings').click();
  await page.getByRole('button', { name: 'P2', exact: true }).click();
  const dialog = await openLibrary(page);
  await dialog.getByRole('button', { name: 'Add RSI', exact: true }).click();
  await dialog.getByRole('button', { name: 'Close indicators' }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('fscandle_workspace_state_v2') ?? '{}').panelIndicators.map((list: unknown[]) => list.length))).toEqual([0, 1, 0, 0]);
  await expect(page.getByTestId('chart-panel').nth(0).getByText('RSI', { exact: false })).toHaveCount(0);
  await expect(page.getByTestId('chart-panel').nth(1).getByText('RSI', { exact: false }).first()).toBeVisible();
});
