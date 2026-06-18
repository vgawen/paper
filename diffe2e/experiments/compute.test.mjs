import test from 'node:test';
import assert from 'node:assert/strict';
import { computeOne } from './compute.mjs';
import { staticHeuristic, randomK } from './baselines.mjs';

const cov = {
  't_cart': ['src/cart.js', 'src/util.js', 'src/main.js'],
  't_home': ['src/home.js', 'src/main.js'],
  't_orders': ['src/orders.js', 'src/util.js', 'src/main.js'],
};

test('computeOne: shared util change selects both cart and orders, safe & precise', () => {
  const r = computeOne({ covVold: cov, covVnew: cov, changedFiles: ['src/util.js'] });
  assert.deepEqual(r.selected.sort(), ['t_cart', 't_orders']);
  assert.equal(r.metrics.ours.Safety, 1);
  assert.equal(r.metrics.ours.Precision, 1);
  assert.equal(r.metrics.ours.Reduction, +(1 - 2 / 3).toFixed(4));
});

test('computeOne: retest_all is safe but imprecise (Reduction 0)', () => {
  const r = computeOne({ covVold: cov, covVnew: cov, changedFiles: ['src/util.js'] });
  assert.equal(r.metrics.retest_all.Reduction, 0);
  assert.equal(r.metrics.retest_all.Safety, 1);
});

test('static heuristic misses shared-util change (unsafe)', () => {
  // no test id contains the stem "util" -> selects nothing
  assert.deepEqual(staticHeuristic(Object.keys(cov), ['src/util.js']), []);
});

test('randomK deterministic for fixed seed', () => {
  const a = randomK(['a', 'b', 'c', 'd'], 2, 7);
  const b = randomK(['a', 'b', 'c', 'd'], 2, 7);
  assert.deepEqual(a, b);
});
