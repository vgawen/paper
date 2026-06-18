import test from 'node:test';
import assert from 'node:assert/strict';
import { extractDomSignals, buildSpecTemplate, generateForGap } from '../src/generate.mjs';
import { createClient, detectProvider } from '../src/llm/client.mjs';

const coupon = `export function render(root){root.innerHTML=\`<section><h1 data-testid="coupon-title">Coupon</h1><input data-testid="coupon-code"/><button data-testid="coupon-apply">Apply</button><span data-testid="coupon-msg"></span></section>\`;}`;

test('extractDomSignals finds title/input/button/msg', () => {
  const s = extractDomSignals(coupon);
  const ids = s.map((x) => x.testId);
  assert.ok(ids.includes('coupon-title'));
  assert.ok(ids.includes('coupon-code'));
  assert.ok(ids.includes('coupon-apply'));
  assert.ok(s.find((x) => x.testId === 'coupon-apply').isButton);
  assert.ok(s.find((x) => x.testId === 'coupon-code').isInput);
});

test('buildSpecTemplate produces an executable-looking spec', () => {
  const spec = buildSpecTemplate({ route: '/coupon', signals: extractDomSignals(coupon), title: 'coupon generated' });
  assert.match(spec, /page\.goto\('\/#\/coupon'\)/);
  assert.match(spec, /getByTestId\('coupon-apply'\)\.click\(\)/);
  assert.match(spec, /getByTestId\('coupon-code'\)\.fill/);
  assert.match(spec, /expect\(/);
});

test('detectProvider is stub with no keys', () => {
  assert.equal(detectProvider({}), 'stub');
  assert.equal(detectProvider({ OPENAI_API_KEY: 'x' }), 'openai');
});

test('generateForGap with stub client returns template', async () => {
  const client = createClient({});
  const { spec } = await generateForGap({ route: '/coupon', code: coupon, title: 't', client });
  assert.match(spec, /coupon-apply/);
});
