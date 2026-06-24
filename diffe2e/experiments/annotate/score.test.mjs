import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreRows } from './score.mjs';

test('scoreRows computes validity + kappa', () => {
  const r = scoreRows([
    { annotator1_yn: 'y', annotator2_yn: 'y' },
    { annotator1_yn: 'y', annotator2_yn: 'n' },
    { annotator1_yn: 'n', annotator2_yn: 'n' },
  ]);
  assert.equal(r.n, 3);
  assert.ok(r.kappa.kappa <= 1 && r.kappa.kappa >= -1);
});

test('scoreRows uses final-column arbitration on disagreement', () => {
  const r = scoreRows([
    { annotator1_yn: 'y', annotator2_yn: 'y' },       // agree -> y
    { annotator1_yn: 'y', annotator2_yn: 'n', final: 'y' }, // arbitrated -> y
    { annotator1_yn: 'n', annotator2_yn: 'n' },       // agree -> n
  ]);
  // 2 of 3 valid
  assert.equal(r.semantic_validity, +(2 / 3).toFixed(4));
});
