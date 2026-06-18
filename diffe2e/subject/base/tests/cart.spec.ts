import { test, expect } from './fixtures';

test('cart adds an item and updates count and total', async ({ page }) => {
  await page.goto('/#/cart');
  await expect(page.getByTestId('cart-title')).toHaveText('Your Cart');
  await page.getByTestId('cart-add').click();
  await expect(page.getByTestId('cart-count')).toHaveText('1');
  await expect(page.getByTestId('cart-total')).toHaveText('$10.00');
});
