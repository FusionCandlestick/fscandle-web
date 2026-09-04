import { expect, test } from '@playwright/test';

/**
 * Screenshot regression for the two public routes.
 *
 * Baselines under `__screenshots__/` existed before this file did, but nothing
 * asserted against them — the release docs claimed screenshot coverage the suite
 * did not have. These are the assertions that make the baselines load-bearing.
 *
 * Canvas rendering is not bit-identical across runs (device pixel ratio,
 * antialiasing, the animated crosshair), so the comparison runs with the
 * project-wide `maxDiffPixelRatio` and after the chart has settled. Regenerate
 * intentionally-changed baselines with `npm run test:e2e:update`, and say so in
 * the pull request — a silently updated baseline is an unreviewed visual change.
 *
 * Each test emulates `prefers-reduced-motion: reduce`, which freezes the replay
 * loops and pins the homepage series section to a single style, so the shot is
 * deterministic rather than "whichever frame the 3.2s auto-morph landed on".
 */

const settleChart = async (page: import('@playwright/test').Page) => {
  await page.waitForSelector('canvas');
  await page.waitForFunction(() =>
    [...document.querySelectorAll('canvas')].some(canvas => canvas.width > 0 && canvas.height > 0),
  );
  // Park the pointer off-canvas so a hover crosshair cannot bleed into the shot.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(1200);
};

test.describe('visual regression', () => {
  test('home route chart surface matches its baseline', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await settleChart(page);
    await expect(page).toHaveScreenshot('terminal-chart.png', { fullPage: false });
  });

  test('playground workspace shell matches its baseline', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/playground');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await settleChart(page);
    await expect(page).toHaveScreenshot('fscandle-shell.png', { fullPage: false });
  });
});
