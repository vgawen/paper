import test from 'node:test';
import assert from 'node:assert/strict';
import { changedUiSignals, selectByDomDiff } from '../src/domdiff.mjs';

const oldCart = `root.innerHTML='<button data-testid="cart-add">Add to cart</button>';`;
const newCart = `root.innerHTML='<button data-testid="cart-add-btn">Add to cart</button>';`;

test('changedUiSignals detects removed/renamed testid', () => {
  assert.deepEqual(changedUiSignals(oldCart, newCart), ['cart-add']);
});

test('changedUiSignals empty for non-UI (logic) change', () => {
  assert.deepEqual(changedUiSignals('const UNIT=1000;', 'const UNIT=1200;'), []);
});

test('selectByDomDiff selects tests referencing a changed signal', () => {
  const sources = {
    'cart.spec.ts > t': `await page.getByTestId('cart-add').click();`,
    'home.spec.ts > t': `await page.getByTestId('home-title');`,
  };
  assert.deepEqual(selectByDomDiff(['cart-add'], sources), ['cart.spec.ts > t']);
});

test('selectByDomDiff requires a quoted literal (no bare-substring mis-fire)', () => {
  const sources = {
    // "date" appears only inside words like updateDate/validate -> must NOT match
    'noise.spec.ts > t': `await updateDate(); await validate();`,
    // genuine quoted anchor -> must match
    'real.spec.ts > t': `await page.getByTestId('date').click();`,
  };
  assert.deepEqual(selectByDomDiff(['date'], sources), ['real.spec.ts > t']);
});
