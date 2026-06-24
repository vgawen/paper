import test from 'node:test';
import assert from 'node:assert/strict';
import { toRepoRel, selectByGenericCoverage } from '../src/covpath.mjs';

test('toRepoRel strips repo root and leading slash', () => {
  assert.equal(toRepoRel('/abs/repo/src/App.tsx', '/abs/repo'), 'src/App.tsx');
  assert.equal(toRepoRel('file:///abs/repo/src/a.ts', '/abs/repo'), 'src/a.ts');
  assert.equal(toRepoRel('src/a.ts', '/abs/repo'), 'src/a.ts');
});

test('selectByGenericCoverage selects tests touching a changed file', () => {
  const cov = { t1: ['src/cart.tsx', 'src/util.ts'], t2: ['src/home.tsx'] };
  const sel = selectByGenericCoverage(cov, ['src/cart.tsx']);
  assert.deepEqual(sel.sort(), ['t1']);
});
