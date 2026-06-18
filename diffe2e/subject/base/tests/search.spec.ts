import { test, expect } from './fixtures';

test('search filters items by query', async ({ page }) => {
  await page.goto('/#/search');
  await expect(page.getByTestId('search-title')).toHaveText('Search');
  await page.getByTestId('search-input').fill('a');
  await page.getByTestId('search-go').click();
  await expect(page.getByTestId('search-results')).toContainText('banana');
});
