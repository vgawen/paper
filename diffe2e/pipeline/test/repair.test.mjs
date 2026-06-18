import test from 'node:test';
import assert from 'node:assert/strict';
import { signalMap, repairLocators, textSegMap, repairAssertions, repair } from '../src/repair.mjs';
import { classify, STRUCTURAL_ONLY, EXPECTATION_CHANGE, SUSPECTED_REGRESSION } from '../src/staleness.mjs';

const cartOld = `root.innerHTML='<button data-testid="cart-add">Add to cart</button>';`;
const cartNew = `root.innerHTML='<button data-testid="cart-add-btn">Add to cart</button>';`;

test('signalMap maps renamed testid by tag+text', () => {
  assert.deepEqual(signalMap(cartOld, cartNew), { 'cart-add': 'cart-add-btn' });
});

test('repairLocators rewrites the locator in a spec', () => {
  const { text, edits } = repairLocators(`await page.getByTestId('cart-add').click();`, { 'cart-add': 'cart-add-btn' });
  assert.match(text, /getByTestId\('cart-add-btn'\)/);
  assert.equal(edits[0].kind, 'locator');
});

const loginOld = "msg.textContent = user.value ? `Welcome, ${user.value}` : 'Username required';";
const loginNew = "msg.textContent = user.value ? `Hi, ${user.value}` : 'Username required';";

test('textSegMap detects Welcome,->Hi,', () => {
  assert.deepEqual(textSegMap(loginOld, loginNew), { 'Welcome,': 'Hi,' });
});

test('repairAssertions updates expected text', () => {
  const { text } = repairAssertions(`await expect(x).toHaveText('Welcome, bob');`, { 'Welcome,': 'Hi,' });
  assert.match(text, /toHaveText\('Hi, bob'\)/);
});

test('repair composes locator + assertion repair', () => {
  const spec = `getByTestId('cart-add'); toHaveText('Welcome, bob');`;
  const { text } = repair(spec, cartOld + '\n' + loginOld, cartNew + '\n' + loginNew);
  assert.match(text, /cart-add-btn/);
  assert.match(text, /Hi, bob/);
});

test('classify: locator change => STRUCTURAL_ONLY', () => {
  assert.equal(classify({ sigMap: { 'cart-add': 'cart-add-btn' }, referencedIds: ['cart-add'] }), STRUCTURAL_ONLY);
});
test('classify: only text change => EXPECTATION_CHANGE', () => {
  assert.equal(classify({ segMap: { 'Welcome,': 'Hi,' } }), EXPECTATION_CHANGE);
});
test('classify: no signal => SUSPECTED_REGRESSION', () => {
  assert.equal(classify({}), SUSPECTED_REGRESSION);
});
