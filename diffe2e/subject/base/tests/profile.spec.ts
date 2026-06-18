import { test, expect } from './fixtures';

test('profile edits the name', async ({ page }) => {
  await page.goto('/#/profile');
  await expect(page.getByTestId('profile-name')).toHaveText('Guest');
  await page.getByTestId('profile-edit').click();
  await expect(page.getByTestId('profile-name')).toHaveText('Alice');
});
