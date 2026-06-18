import { test, expect } from './fixtures';

test('home shows welcome title', async ({ page }) => {
  await page.goto('/#/home');
  await expect(page.getByTestId('home-title')).toHaveText('Welcome Home');
});
