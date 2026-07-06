import test from 'node:test';
import assert from 'node:assert/strict';
import { pickUiBearingContexts } from './run_rq2_real.mjs';

test('pickUiBearingContexts filters zero-score entries and respects limit', () => {
  const rows = pickUiBearingContexts([
    { id: 'a', score: 0 },
    { id: 'b', score: 3 },
    { id: 'c', score: 1 },
    { id: 'd', score: 2 },
  ], 2);

  assert.deepEqual(rows.map((r) => r.id), ['b', 'd']);
});
