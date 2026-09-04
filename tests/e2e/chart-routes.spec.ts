import { expect, test } from '@playwright/test';

const waitForCanvasSurface = async (page: import('@playwright/test').Page) => {
  await page.waitForSelector('canvas');
  await page.waitForFunction(() => {
    const canvases = [...document.querySelectorAll('canvas')];
    return canvases.length > 0 && canvases.some(canvas => canvas.width > 0 && canvas.height > 0);
  });
};

const countMainOverlayPixels = async (page: import('@playwright/test').Page) => page.locator('canvas').evaluateAll(canvases => {
  const candidates = canvases
    .map((canvas, index) => {
      const rect = canvas.getBoundingClientRect();
      return {
        canvas,
        index,
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        area: rect.width * rect.height,
        zIndex: getComputedStyle(canvas).zIndex,
      };
    })
    .filter(item => ['10', '2100'].includes(item.zIndex) && item.width > 0 && item.height > 0)
    .sort((a, b) => b.area - a.area);
  const overlay = candidates[0];
  if (!overlay) return 0;
  const canvas = overlay.canvas as HTMLCanvasElement;
  const context = canvas.getContext('2d');
  if (!context) return 0;
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let count = 0;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] > 0) count += 1;
  }
  return count;
});

const getPanelRects = async (page: import('@playwright/test').Page) => page.getByTestId('chart-panel').evaluateAll(panels => panels.map(panel => {
  const rect = panel.getBoundingClientRect();
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}));

const countRoundedPositions = (values: number[]) => new Set(values.map(value => Math.round(value / 8))).size;

const getStoredActiveOverlays = async (page: import('@playwright/test').Page) => page.evaluate(() => {
  const state = JSON.parse(localStorage.getItem('fscandle_chart_state_v4') || '{}');
  const activeLayer = state.drawingLayers?.find((layer: { id: string }) => layer.id === state.activeDrawingLayerId);
  return activeLayer?.overlays ?? state.overlays ?? [];
});

test.describe('chart routes', () => {
  test('home route renders a nonblank chart and crosshair surface', async ({ page }) => {
    await page.goto('/');
    await waitForCanvasSurface(page);
    await page.mouse.move(720, 420);
    await expect.poll(() => page.locator('canvas').count()).toBeGreaterThan(0);
  });

  test('playground route exposes the workspace shell controls', async ({ page }, testInfo) => {
    await page.goto('/playground');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByPlaceholder('Symbol', { exact: true })).toHaveValue('SPY');
    await waitForCanvasSurface(page);
    await page.getByTitle('Chart Style').selectOption('area');
    await page.getByTitle('Chart Settings').click();
    await expect(page.getByTestId('settings-menu')).toBeVisible();
    await page.getByTitle('Toggle Theme').click();
    if (testInfo.project.name.includes('desktop')) {
      await page.locator('[data-sidebar-drawing-tool="line:trend"]').click();
      await expect(page.getByTestId('sidebar-line-menu').locator('[data-sidebar-drawing-tool="line:horizontal"]')).toBeVisible();
      await page.locator('[data-sidebar-drawing-tool="wave:three"]').click();
      await page.getByTestId('sidebar-wave-menu').locator('[data-sidebar-drawing-tool="wave:abcd"]').click();
    }
    await page.locator('[data-sidebar-drawing-tool="annotation:text"]').click();
    await expect(page.getByTestId('sidebar-annotation-menu').locator('[data-sidebar-drawing-tool="annotation:image"]')).toBeVisible();
    await page.getByTitle('Line Color & Width').click();
    await expect(page.getByTestId('drawing-style-controls')).toBeVisible();
    await page.getByTitle('Chart Settings').click();
    await expect(page.getByTestId('settings-menu').getByText('Watermark')).toBeVisible();
    await expect(page.getByTestId('layout-menu')).toBeVisible();
    await expect(page.locator('[data-layout-mode="split-horizontal"]')).toBeVisible();
    await expect.poll(() => page.locator('canvas').count()).toBeGreaterThan(0);
  });

  test('playground symbol picker combines search results and watchlist', async ({ page }) => {
    await page.goto('/playground');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForCanvasSurface(page);

    await page.getByPlaceholder('Symbol', { exact: true }).click();
    await expect(page.getByTestId('symbol-picker-menu')).toBeVisible();
    await expect.poll(() => page.locator('[data-testid^="symbol-search-result-"]').count()).toBe(4);
    await expect(page.getByTestId('watchlist-symbol-SPY')).toBeVisible();

    // The search column selects a symbol.
    await page.getByTestId('symbol-search-result-BTC').getByText('BTC', { exact: true }).click();
    await expect(page.getByPlaceholder('Symbol', { exact: true })).toHaveValue('BTC');

    // The watchlist column selects a symbol too.
    await page.getByPlaceholder('Symbol', { exact: true }).click();
    await page.getByTestId('watchlist-symbol-QQQ').getByText('QQQ', { exact: true }).click();
    await expect(page.getByPlaceholder('Symbol', { exact: true })).toHaveValue('QQQ');
  });

  test('playground watchlist targets the active panel', async ({ page }) => {
    await page.goto('/playground');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForCanvasSurface(page);

    await page.getByTitle('Chart Settings').click();
    await page.locator('[data-layout-mode="split-horizontal"]').click();
    await expect.poll(async () => (await getPanelRects(page)).length).toBe(2);

    // The compact settings menu intentionally remains open after a layout
    // change so consecutive layout choices remain actionable. Dismiss it
    // before interacting with the newly exposed chart panel.
    await page.keyboard.press('Escape');
    await page.locator('[data-testid="chart-panel"]').nth(1).click();
    await expect(page.locator('[data-testid="chart-panel"][data-active-panel="true"]').nth(0)).toContainText('P2');

    await page.getByPlaceholder('Symbol', { exact: true }).click();
    await page.getByTestId('watchlist-symbol-NVDA').click();

    await expect(page.getByPlaceholder('Symbol', { exact: true })).toHaveValue('NVDA');
    await expect(page.locator('[data-testid="chart-panel"][data-active-panel="true"]').nth(0)).toContainText('P2 · NVDA');
  });

  test('playground compare series lives in the symbol picker and is single-panel only', async ({ page }) => {
    await page.goto('/playground');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForCanvasSurface(page);

    // Compare lines are added from the symbol picker, one per row.
    await page.getByPlaceholder('Symbol', { exact: true }).click();
    await page.getByTestId('symbol-search-result-NVDA').getByTitle(/Add NVDA as compare line/).click();
    await expect(page.getByTestId('symbol-search-result-NVDA').getByTitle(/Remove NVDA comparison/)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTitle('Remove comparison for NVDA')).toBeVisible();

    // Comparison is a single-panel feature: splitting the layout retires it.
    await page.getByTitle('Chart Settings').click();
    await page.locator('[data-layout-mode="split-horizontal"]').click();
    await page.keyboard.press('Escape');
    await expect(page.getByTitle('Remove comparison for NVDA')).toBeHidden();
  });

  test('playground custom popovers dismiss when clicking elsewhere', async ({ page }) => {
    await page.goto('/playground');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForCanvasSurface(page);

    await page.getByTitle('Chart Settings').click();
    await expect(page.getByTestId('settings-menu')).toBeVisible();
    // Click the chart well clear of the settings popover (which sits on the
    // right on the compact layout) to dismiss it.
    const panel = (await page.getByTestId('chart-panel').first().boundingBox())!;
    await page.mouse.click(panel.x + 24, panel.y + panel.height - 24);
    await expect(page.getByTestId('settings-menu')).toBeHidden();

    await page.getByPlaceholder('Symbol', { exact: true }).click();
    await expect(page.getByTestId('symbol-picker-menu')).toBeVisible();
    // Below the picker rather than at the centre of the chart: on the compact
    // layout the picker covers most of the panel, so a centre click would land
    // on the popover this is meant to dismiss.
    const picker = (await page.getByTestId('symbol-picker-menu').boundingBox())!;
    await page.mouse.click(picker.x + 12, picker.y + picker.height + 24);
    await expect(page.getByTestId('symbol-picker-menu')).toBeHidden();
  });

  test('playground settings controls and split layouts are actionable', async ({ page }) => {
    await page.goto('/playground');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForCanvasSurface(page);

    await page.getByTitle('Chart Settings').click();
    await expect(page.getByTestId('settings-menu')).toBeVisible();

    await page.getByTitle('Invert Price Axis').click();
    await page.getByTestId('settings-menu').getByRole('button', { name: 'Watermark' }).click();
    await expect.poll(async () => page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('fscandle_chart_state_v4') || '{}');
      return state.options?.watermark?.visible;
    })).toBe(false);

    const exportDownload = page.waitForEvent('download');
    await page.getByTitle('Export Drawings JSON').click();
    await expect((await exportDownload).suggestedFilename()).toMatch(/fscandle-drawings-\d+\.json/);

    await page.keyboard.press('Escape');
    const screenshotDownload = page.waitForEvent('download');
    await page.getByTitle('Screenshot').click();
    await expect((await screenshotDownload).suggestedFilename()).toMatch(/playground-style-spy\.png/i);

    await page.getByTitle('Fullscreen').click();
    await expect.poll(async () => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
    await page.getByTitle('Fullscreen').click();
    await expect.poll(async () => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);

    await page.getByTitle('Chart Settings').click();
    await expect(page.getByTestId('layout-menu')).toBeVisible();
    await page.locator('[data-layout-mode="split-horizontal"]').click();
    await expect.poll(async () => (await getPanelRects(page)).length).toBe(2);
    await expect.poll(async () => {
      const rects = await getPanelRects(page);
      return countRoundedPositions(rects.map(rect => rect.y)) === 1 && countRoundedPositions(rects.map(rect => rect.x)) === 2;
    }).toBe(true);

    await page.locator('[data-layout-mode="split-vertical"]').click();
    await expect.poll(async () => (await getPanelRects(page)).length).toBe(2);
    await expect.poll(async () => {
      const rects = await getPanelRects(page);
      return countRoundedPositions(rects.map(rect => rect.y)) === 2 && countRoundedPositions(rects.map(rect => rect.x)) === 1;
    }).toBe(true);

    await page.locator('[data-layout-mode="quad-horizontal"]').click();
    await expect.poll(async () => (await getPanelRects(page)).length).toBe(4);
    await expect.poll(async () => {
      const rects = await getPanelRects(page);
      return countRoundedPositions(rects.map(rect => rect.y)) === 1 && countRoundedPositions(rects.map(rect => rect.x)) === 4;
    }).toBe(true);

    await page.locator('[data-layout-mode="quad-vertical"]').click();
    await expect.poll(async () => (await getPanelRects(page)).length).toBe(4);
    await expect.poll(async () => {
      const rects = await getPanelRects(page);
      return countRoundedPositions(rects.map(rect => rect.y)) === 4 && countRoundedPositions(rects.map(rect => rect.x)) === 1;
    }).toBe(true);

    await page.locator('[data-layout-mode="quad-grid"]').click();
    await expect.poll(async () => (await getPanelRects(page)).length).toBe(4);
    await expect.poll(async () => {
      const rects = await getPanelRects(page);
      return countRoundedPositions(rects.map(rect => rect.y)) === 2 && countRoundedPositions(rects.map(rect => rect.x)) === 2;
    }).toBe(true);
  });

  test('playground drawing tools render immediately and undo cleanly', async ({ page }) => {
    await page.goto('/playground');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForCanvasSurface(page);

    await page.locator('[data-sidebar-drawing-tool="line:trend"]').click();
    await page.getByTestId('sidebar-line-menu').locator('[data-sidebar-drawing-tool="line:trend"]').click();

    const chartRect = await page.locator('canvas').evaluateAll(canvases => {
      const largest = canvases
        .map(canvas => {
          const rect = canvas.getBoundingClientRect();
          return { left: rect.left, top: rect.top, width: rect.width, height: rect.height, area: rect.width * rect.height };
        })
        .sort((a, b) => b.area - a.area)[0];
      if (!largest) throw new Error('No canvas found');
      return largest;
    });

    await page.mouse.click(chartRect.left + chartRect.width * 0.25, chartRect.top + chartRect.height * 0.35);
    await page.mouse.click(chartRect.left + chartRect.width * 0.55, chartRect.top + chartRect.height * 0.55);

    await expect.poll(async () => page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('fscandle_chart_state_v4') || '{}');
      const activeLayer = state.drawingLayers?.find((layer: { id: string }) => layer.id === state.activeDrawingLayerId);
      const overlays = activeLayer?.overlays ?? state.overlays ?? [];
      return overlays?.[0]?.points?.length ?? 0;
    })).toBe(2);
    await expect.poll(async () => page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('fscandle_chart_state_v4') || '{}');
      const activeLayer = state.drawingLayers?.find((layer: { id: string }) => layer.id === state.activeDrawingLayerId);
      const overlays = activeLayer?.overlays ?? state.overlays ?? [];
      return overlays?.[0]?.type ?? '';
    })).toBe('line');
    await expect.poll(async () => countMainOverlayPixels(page)).toBeGreaterThan(0);

    await page.mouse.move(chartRect.left + chartRect.width * 0.75, chartRect.top + chartRect.height * 0.25);
    await expect.poll(async () => countMainOverlayPixels(page)).toBeGreaterThan(0);

    await page.getByTitle('Undo').click();
    await expect.poll(async () => (await getStoredActiveOverlays(page)).length).toBe(0);
    await expect.poll(async () => countMainOverlayPixels(page)).toBe(0);

    await page.locator('[data-sidebar-drawing-tool="wave:three"]').click();
    await page.getByTestId('sidebar-wave-menu').locator('[data-sidebar-drawing-tool="wave:abcd"]').click();
    await page.mouse.click(chartRect.left + chartRect.width * 0.22, chartRect.top + chartRect.height * 0.56);
    await page.mouse.click(chartRect.left + chartRect.width * 0.36, chartRect.top + chartRect.height * 0.34);
    await page.mouse.click(chartRect.left + chartRect.width * 0.51, chartRect.top + chartRect.height * 0.62);
    await page.mouse.click(chartRect.left + chartRect.width * 0.67, chartRect.top + chartRect.height * 0.38);
    await expect.poll(async () => (await getStoredActiveOverlays(page))[0]?.type ?? '').toBe('wave');
    await expect.poll(async () => (await getStoredActiveOverlays(page))[0]?.wave?.kind ?? '').toBe('abcd');
    await expect.poll(async () => (await getStoredActiveOverlays(page))[0]?.points?.length ?? 0).toBe(4);
    await expect.poll(async () => countMainOverlayPixels(page)).toBeGreaterThan(0);

    // Drawing layers now live inside the settings menu.
    await page.getByTitle('Chart Settings').click();
    await expect(page.getByTestId('settings-menu')).toBeVisible();
    await page.getByTestId('create-drawing-layer').click();
    await expect.poll(async () => page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('fscandle_chart_state_v4') || '{}');
      return state.drawingLayers?.length ?? 0;
    })).toBe(2);
    await expect.poll(async () => page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('fscandle_chart_state_v4') || '{}');
      const activeLayer = state.drawingLayers?.find((layer: { id: string }) => layer.id === state.activeDrawingLayerId);
      return activeLayer?.overlays?.length ?? -1;
    })).toBe(0);

    await page.getByTestId('drawing-layer-layer_default').click();
    await expect.poll(async () => page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('fscandle_chart_state_v4') || '{}');
      return state.activeDrawingLayerId ?? '';
    })).toBe('layer_default');
    await expect.poll(async () => page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('fscandle_chart_state_v4') || '{}');
      const activeLayer = state.drawingLayers?.find((layer: { id: string }) => layer.id === state.activeDrawingLayerId);
      return activeLayer?.overlays?.length ?? 0;
    })).toBe(1);

    await page.keyboard.press('Escape');
    await page.getByTitle('Clear Current Layer').click();
    await expect.poll(async () => page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('fscandle_chart_state_v4') || '{}');
      const defaultLayer = state.drawingLayers?.find((layer: { id: string }) => layer.id === 'layer_default');
      return defaultLayer?.overlays?.length ?? -1;
    })).toBe(0);
  });
});
