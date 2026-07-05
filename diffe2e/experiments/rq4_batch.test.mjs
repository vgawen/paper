import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyRow, summarizeBatch } from './rq4_batch.mjs';

test('classifyRow separates empty, partial, and full selected sets', () => {
  assert.equal(classifyRow({ metrics: { dual: { selected_count: 0, full_suite: 4 } } }), 'empty');
  assert.equal(classifyRow({ metrics: { dual: { selected_count: 2, full_suite: 4 } } }), 'partial');
  assert.equal(classifyRow({ metrics: { dual: { selected_count: 4, full_suite: 4 } } }), 'full');
});

test('summarizeBatch averages per-transition net saving and break-even rate', () => {
  const rows = [
    { sha: 'a', metrics: { dual: { selected_count: 0, full_suite: 4, Reduction: 1 } } },
    { sha: 'b', metrics: { dual: { selected_count: 4, full_suite: 4, Reduction: 0 } } },
    { sha: 'c', metrics: { dual: { selected_count: 4, full_suite: 4, Reduction: 0 } } },
  ];
  const costProfile = {
    project: 'fixture',
    workers: 2,
    full_count: 4,
    T_full_ms: { median: 1000 },
    T_select_ms: { median: 100, measured: true },
  };

  const summary = summarizeBatch(rows, costProfile);

  assert.equal(summary.project, 'fixture');
  assert.equal(summary.transitions, 3);
  assert.deepEqual(summary.buckets, { empty: 1, partial: 0, full: 2 });
  assert.equal(summary.meanReduction, 0.3333);
  assert.equal(summary.meanNetSaving, 0.2333);
  assert.equal(summary.medianNetSaving, -0.1);
  assert.equal(summary.breakEvenRate, 0.3333);
  assert.equal(summary.selectionMeasured, true);
  assert.match(summary.method, /batch-estimated/);
});
