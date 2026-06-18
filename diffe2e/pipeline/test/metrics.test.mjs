import test from 'node:test';
import assert from 'node:assert/strict';
import {
  selectionMetrics,
  selectionChangeCoverage,
  targetedSetUsability,
} from '../src/metrics.mjs';

test('selectionMetrics computes Reduction/Safety/Precision', () => {
  const m = selectionMetrics({ full: ['a', 'b', 'c', 'd'], selected: ['a'], affected: ['a'] });
  assert.equal(m.Reduction, 0.75);
  assert.equal(m.Safety, 1);
  assert.equal(m.Precision, 1);
});

test('selectionMetrics handles under-selection (missed affected)', () => {
  const m = selectionMetrics({ full: ['a', 'b', 'c', 'd'], selected: ['a'], affected: ['a', 'b'] });
  assert.equal(m.Safety, 0.5);
  assert.equal(m.Precision, 1);
});

test('selectionMetrics empty affected => Safety 1', () => {
  const m = selectionMetrics({ full: ['a', 'b'], selected: [], affected: [] });
  assert.equal(m.Safety, 1);
  assert.equal(m.Reduction, 1);
});

test('selectionChangeCoverage measures touched changed units', () => {
  const cov = { t1: ['src/cart.js'], t2: ['src/home.js'] };
  const v = selectionChangeCoverage({
    changedUnits: ['src/cart.js', 'src/home.js'],
    selectedPassing: ['t1'],
    coverageOf: (t) => cov[t],
  });
  assert.equal(v, 0.5);
});

test('targetedSetUsability counts selected+repaired over selected-affected', () => {
  const u = targetedSetUsability({ selectedAffected: ['a', 'b', 'c', 'd'], selectedPass: 2, repairedPass: 1 });
  assert.equal(u, 0.75);
});
