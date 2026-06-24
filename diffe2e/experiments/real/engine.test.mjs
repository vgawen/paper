import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTransition } from './engine.mjs';

test('computeTransition: dual = coverage ∪ uidiff, metrics vs oracle', () => {
  const r = computeTransition({
    covVold: { t1: ['src/cart.tsx'], t2: ['src/home.tsx'] },
    covVnew: { t1: ['src/cart.tsx'], t2: ['src/home.tsx'] },
    changed: ['src/cart.tsx'],
    uiSelected: ['t2'],
  });
  assert.equal(r.metrics.coverage_only.selected_count, 1); // t1
  assert.deepEqual(r.methods.dual.sort(), ['t1', 't2']);
  assert.equal(r.metrics.dual.Safety, 1); // oracle from covVnew∩changed = [t1] ⊆ dual
});

test('computeTransition: coverage misses a UI-only break, uidiff catches it', () => {
  // cart.tsx changed; t1 still records cart in V_old cov, but suppose a renamed
  // locator means coverage_only alone is the safe trunk while uidiff adds t3.
  const r = computeTransition({
    covVold: { t1: ['src/cart.tsx'], t2: ['src/home.tsx'], t3: ['src/home.tsx'] },
    covVnew: { t1: ['src/cart.tsx'], t2: ['src/home.tsx'], t3: ['src/home.tsx'] },
    changed: ['src/cart.tsx'],
    uiSelected: ['t3'],
  });
  assert.deepEqual(r.methods.coverage_only, ['t1']);
  assert.deepEqual(r.methods.dual.sort(), ['t1', 't3']);
  assert.equal(r.metrics.dual.Safety, 1);
});
