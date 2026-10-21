import { expect, test } from '@playwright/test';
import { openFresh } from './helpers';

test('showcase code switches preserve controls and selected examples', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const [id, label, snippet] of [
    ['showcase-series', 'Styles', "style: 'area'"],
    ['showcase-indicators', 'Overview', "chart.createIndicator('MACD'"],
    ['showcase-compare', 'Overview', "chart.setPriceScaleMode('log')"],
    ['showcase-drawing', 'Tools', "chart.setDrawingMode('fibonacci')"],
  ]) {
    const section = page.locator(`#${id}`);
    await section.scrollIntoViewIfNeeded();
    if (testInfo.project.name.includes('mobile')) {
      await section.getByRole('button', { name: 'Code', exact: true }).click();
      await expect(section.locator('pre:visible')).toContainText(snippet);
      await section.getByRole('button', { name: label, exact: true }).click();
      await expect(section.locator('pre:visible')).toHaveCount(0);
    } else {
      await expect(section.locator('pre:visible')).toContainText(snippet);
    }
  }
  const drawing = page.locator('#showcase-drawing');
  await drawing.getByRole('button', { name: 'Channel, 3 points', exact: true }).click();
  await expect(drawing.getByRole('button', { name: 'Channel, 3 points', exact: true })).toHaveAttribute('aria-pressed', 'true');
  if (testInfo.project.name.includes('mobile')) await drawing.getByRole('button', { name: 'Code', exact: true }).click();
  await expect(drawing.locator('pre:visible')).toContainText("chart.setDrawingMode('channel:parallel')");
});

test('symbol rows keep nested actions separate from selection and support the keyboard', async ({ page }) => {
  await openFresh(page);
  const input = page.getByPlaceholder('Symbol', { exact: true });
  await input.click();
  await page.getByTestId('watchlist-symbol-NVDA').getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(input).toHaveValue('SPY');
  await expect(page.getByTestId('watchlist-symbol-NVDA')).toHaveCount(0);
  await page.getByTestId('symbol-search-result-NVDA').getByRole('button', { name: 'Add to watchlist', exact: true }).click();
  await expect(page.getByTestId('watchlist-symbol-NVDA')).toBeVisible();
  await expect(input).toHaveValue('SPY');
  await page.getByTestId('watchlist-symbol-NVDA').getByTitle('Add NVDA as compare line').click();
  await expect(input).toHaveValue('SPY');
  await expect(page.getByTestId('symbol-search-result-NVDA').getByTitle('Remove NVDA comparison')).toBeVisible();
  await page.getByTestId('symbol-search-result-BTC').press('Space');
  await expect(input).toHaveValue('BTC');
  await input.click();
  await page.getByTestId('watchlist-symbol-QQQ').press('Enter');
  await expect(input).toHaveValue('QQQ');
});
