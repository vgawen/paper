import { test, expect } from './fixtures';

test('login greets the user after submit', async ({ page }) => {
  await page.goto('/#/login');
  await page.getByTestId('login-user').fill('bob');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('login-msg')).toHaveText('Welcome, bob');
});
