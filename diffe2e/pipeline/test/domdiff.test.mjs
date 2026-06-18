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
