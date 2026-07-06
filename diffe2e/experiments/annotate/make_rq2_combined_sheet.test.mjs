import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRq2BlindedRows } from './make_rq2_combined_sheet.mjs';

test('buildRq2BlindedRows merges multiple sources and assigns unique case ids', () => {
  const { rows, unblind, stats } = buildRq2BlindedRows([
    {
      source: 'real_actual',
      rows: [
        { route: '/a', gap_file: 'src/a.ts', spec: 'spec-a', arm: 'diff' },
        { route: '/b', gap_file: 'src/b.ts', spec: 'spec-b', arm: 'nodiff' },
      ],
    },
    {
      source: 'controlled',
      rows: [
        { route: '/c', gap_file: 'src/c.ts', spec: 'spec-c', arm: 'diff' },
      ],
    },
  ]);

  assert.equal(rows.length, 3);
  assert.equal(Object.keys(unblind).length, 3);
  assert.equal(stats.total, 3);
  assert.equal(stats.by_source.real_actual, 2);
  assert.equal(stats.by_source.controlled, 1);
  assert.deepEqual(rows.map((r) => r.case_id), ['rq2_001', 'rq2_002', 'rq2_003']);
  assert.equal(unblind.rq2_001.arm, 'diff');
  assert.equal(unblind.rq2_002.arm, 'nodiff');
});
