import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalLocator, locatorEquivalent, extractCandidates, textHasEquivalentLocator } from '../src/locatorEquiv.mjs';

test('canonicalLocator: Playwright and CSS forms map to the same kind:value', () => {
  assert.deepEqual(canonicalLocator("page.getByTestId('cart-add')"), { kind: 'testid', value: 'cart-add' });
  assert.deepEqual(canonicalLocator(`page.locator('[data-testid="cart-add"]')`), { kind: 'testid', value: 'cart-add' });
  assert.deepEqual(canonicalLocator(`cy.get('[data-testid=cart-add]')`), { kind: 'testid', value: 'cart-add' });
});

test('locatorEquivalent: semantic equivalence beats string equality', () => {
  // same target, different API -> equivalent (exact-match would fail here)
  assert.equal(
    locatorEquivalent("page.getByTestId('cart-add')", `page.locator('[data-testid="cart-add"]')`),
    true,
  );
  assert.equal(locatorEquivalent("page.getByText('Save')", "cy.contains('Save')"), true);
  // different targets -> not equivalent
  assert.equal(locatorEquivalent("page.getByTestId('a')", "page.getByTestId('b')"), false);
});

test('extractCandidates: pulls testid/aria/text/id/class from app source', () => {
  const src = `
    <button data-testid="cart-add" aria-label="Add to cart" className="btn primary">Add to cart</button>
    <input id="user-field" name="username" placeholder="username" />
  `;
  const cands = extractCandidates(src);
  const keys = new Set(cands.map((c) => `${c.kind}:${c.value}`));
  assert.ok(keys.has('testid:cart-add'));
  assert.ok(keys.has('label:Add to cart'));
  assert.ok(keys.has('text:Add to cart'));
  assert.ok(keys.has('id:user-field'));
  assert.ok(keys.has('name:username'));
  assert.ok(keys.has('class:btn'));
});

test('textHasEquivalentLocator: compares ALL locators in a whole spec, not just the first', () => {
  const spec = `
    await page.getByTestId('title').click();
    await page.locator('[data-testid="cart-add"]').click();
  `;
  // target appears as the SECOND locator -> must still be found
  assert.equal(textHasEquivalentLocator(spec, "page.getByTestId('cart-add')"), true);
  // a locator that is NOT in the spec -> false (no false positive)
  assert.equal(textHasEquivalentLocator(spec, "page.getByTestId('nope')"), false);
});

test('textHasEquivalentLocator: falls back to exact when no locator syntax present', () => {
  assert.equal(textHasEquivalentLocator('some plain text', 'some plain text'), true);
});
