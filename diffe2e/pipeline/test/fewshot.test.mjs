import test from 'node:test';
import assert from 'node:assert/strict';
import { pickFewShotTemplates, formatFewShot, buildGapPromptWithFewShot } from '../src/fewshot.mjs';

const tests = [
  { id: 'a', file: 'e2e/settings/general.spec.ts', code: "test('x', async () => {})", route: '/settings' },
  { id: 'b', file: 'e2e/accounts.spec.ts', code: "test('y', async () => {})", route: '/accounts' },
  { id: 'c', file: 'e2e/settings/tags.spec.ts', code: "test('z', async () => {})", route: '/settings/tags' },
];

test('pickFewShotTemplates: prefers same directory, then same route', () => {
  const shots = pickFewShotTemplates(tests, { file: 'e2e/settings/general.spec.ts', route: '/settings' });
  assert.equal(shots[0].id, 'a');       // same file/dir wins
  assert.ok(shots.length <= 2);
});

test('pickFewShotTemplates: is leakage-safe (only returns existing tests)', () => {
  const shots = pickFewShotTemplates(tests, { file: 'e2e/brand-new.spec.ts' });
  for (const s of shots) assert.ok(tests.some((t) => t.id === s.id));
});

test('buildGapPromptWithFewShot: embeds examples and the fixtures import rule', () => {
  const p = buildGapPromptWithFewShot({ addNodes: [], title: 't', route: '/wishlist', shots: [tests[0]] });
  assert.match(p, /example 1/);
  assert.match(p, /import \{ test, expect \} from '\.\/fixtures'/);
  assert.match(p, /\/wishlist/);
});

test('formatFewShot: empty shots produce empty string', () => {
  assert.equal(formatFewShot([]), '');
});
