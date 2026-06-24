import { test, expect } from './fixtures';

// CONSUMER test (the diff-related code under test). It asserts the accumulated
// visit count is 1, which is only true if the PRODUCER test ran first in the
// same suite (shared backend state). Coverage touches only src/dashboard.js.
// If a selection drops the producer, the backend is un-primed (visits=0) and
// this test's verdict flips — that is the side-effect safety hazard.
test('dashboard shows accumulated visit count (consumer of shared state)', async ({ page }) => {
  await page.goto('/#/dashboard');
  await expect(page.getByTestId('dash-count')).toHaveText('1');
});
