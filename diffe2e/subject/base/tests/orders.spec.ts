import { test, expect } from './fixtures';

test('orders lists prior orders with totals', async ({ page }) => {
  await page.goto('/#/orders');
  await expect(page.getByTestId('orders-title')).toHaveText('Orders');
  await expect(page.getByTestId('orders-list')).toContainText('A1: $15.00');
});
