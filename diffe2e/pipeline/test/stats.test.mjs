import test from 'node:test';
import assert from 'node:assert/strict';
import { cohenKappa } from '../src/stats.mjs';

test('cohenKappa perfect agreement = 1', () => {
  const k = cohenKappa([['y', 'y'], ['n', 'n'], ['y', 'y']]);
  assert.equal(k.kappa, 1);
});

test('cohenKappa chance-level ~ 0', () => {
  // 2x2 with observed == expected agreement
  const pairs = [['y', 'y'], ['y', 'n'], ['n', 'y'], ['n', 'n']];
  const k = cohenKappa(pairs);
  assert.ok(Math.abs(k.kappa) < 1e-9);
  assert.equal(k.po, 0.5);
});

test('cohenKappa empty input is safe', () => {
  const k = cohenKappa([]);
  assert.equal(k.n, 0);
  assert.equal(k.kappa, 0);
});
