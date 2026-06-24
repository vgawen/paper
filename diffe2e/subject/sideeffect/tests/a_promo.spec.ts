import { test, expect } from './fixtures';

// PRODUCER test (runs first; "a_" sorts before "b_"). Its side effect: records
// one visit in the shared backend. Coverage touches only src/promo.js.
test('promo records a visit (producer side effect)', async ({ page }) => {
  await page.goto('/#/promo');
  await expect(page.getByTestId('promo-title')).toHaveText('Promo');
});
