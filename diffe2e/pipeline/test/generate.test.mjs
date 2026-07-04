import test from 'node:test';
import assert from 'node:assert/strict';
import { extractDomSignals, buildSpecTemplate, generateForGap, buildPromptNoDiff, cleanGeneratedSpec } from '../src/generate.mjs';
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

test('cleanGeneratedSpec extracts fenced TypeScript and uses coverage fixtures', () => {
  const raw = [
    'Here is the test:',
    '```typescript',
    "import { test, expect } from '@playwright/test';",
    '',
    "test('x', async ({ page }) => {",
    "  await page.goto('/#/coupon');",
    '});',
    '```',
  ].join('\n');
  const spec = cleanGeneratedSpec(raw);
  assert.ok(!spec.includes('```'));
  assert.ok(!spec.includes('Here is the test'));
  assert.match(spec, /from '\.\/fixtures'/);
  assert.match(spec, /page\.goto\('\/#\/coupon'\)/);
});

test('real provider failure throws instead of falling back silently', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: { message: 'Insufficient Balance', code: 'invalid_request_error' },
  }), { status: 402, headers: { 'content-type': 'application/json' } });
  try {
    const client = createClient({ DEEPSEEK_API_KEY: 'sk-test' });
    await assert.rejects(
      client.complete('prompt', { fallback: 'local fallback' }),
      /deepseek API request failed.*402.*Insufficient Balance/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('real provider empty response throws instead of falling back silently', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ choices: [] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
  try {
    const client = createClient({ DEEPSEEK_API_KEY: 'sk-test' });
    await assert.rejects(
      client.complete('prompt', { fallback: 'local fallback' }),
      /deepseek API returned empty completion/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('buildPromptNoDiff omits diff/route constraints', () => {
  const p = buildPromptNoDiff({ appName: 'demo' });
  assert.ok(!/diff|changed|route /i.test(p) || /no specific change/i.test(p));
  assert.ok(p.length > 0);
});
