import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { computeC1Selection } from './select_c1_dynamic.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', 'real', 'cand_coverage');
const fixture = path.join(root, 'src', 'App.tsx');

test('computeC1Selection selects only the test referencing the changed Red button', {
  skip: fs.existsSync(fixture) ? false : 'real/cand_coverage is gitignored; see REPRODUCE.md'
}, () => {
  const result = computeC1Selection({ root });

  assert.equal(result.full_count, 3);
  assert.deepEqual(result.selected, ['App.test.ts::red']);
  assert.equal(result.metrics.Reduction, 0.6667);
  assert.equal(result.metrics.Precision, 1);
});
