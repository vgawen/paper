import test from 'node:test';
import assert from 'node:assert/strict';
import { applyClassificationUnblind, applyRq2Unblind, scoreClassificationRows, scoreRq2Rows } from './score.mjs';

test('scoreRq2Rows computes validity + kappa from prelabel and human2', () => {
  const r = scoreRq2Rows([
    { case_id: 'a', prelabel: 'y', annotator2_yn: 'y' },
    { case_id: 'b', prelabel: 'y', annotator2_yn: 'n', final: 'y' },
    { case_id: 'c', prelabel: 'n', annotator2_yn: 'n' },
  ]);
  assert.equal(r.n, 3);
  assert.ok(r.kappa.kappa <= 1 && r.kappa.kappa >= -1);
  assert.equal(r.confusion.y.y, 1);
  assert.equal(r.confusion.n.n, 1);
  assert.equal(r.confusion.y.n, 1);
});

test('scoreRq2Rows uses final-column arbitration on disagreement', () => {
  const r = scoreRq2Rows([
    { case_id: 'a', prelabel: 'y', annotator2_yn: 'y' },       // agree -> y
    { case_id: 'b', prelabel: 'y', annotator2_yn: 'n', final: 'y' }, // arbitrated -> y
    { case_id: 'c', prelabel: 'n', annotator2_yn: 'n' },       // agree -> n
  ]);
  // 2 of 3 valid
  assert.equal(r.semantic_validity, +(2 / 3).toFixed(4));
});

test('scoreClassificationRows reports Po + confusion and never reports kappa', () => {
  const r = scoreClassificationRows([
    { case_id: 'a', prelabel: 'STRUCTURAL_ONLY', human2: 'STRUCTURAL_ONLY' },
    { case_id: 'b', prelabel: 'STRUCTURAL_ONLY', human2: 'EXPECTATION_CHANGE', final: 'EXPECTATION_CHANGE' },
    { case_id: 'c', prelabel: 'STRUCTURAL_ONLY', human2: 'SUSPECTED_REGRESSION' },
  ]);

  assert.equal(r.n, 3);
  assert.equal(r.po, +(1 / 3).toFixed(4));
  assert.deepEqual(r.confusion.STRUCTURAL_ONLY, {
    STRUCTURAL_ONLY: 1,
    EXPECTATION_CHANGE: 1,
    SUSPECTED_REGRESSION: 1,
  });
  assert.equal(r.disagreements.length, 2);
  assert.equal(r.kappa, null);
  assert.equal(r.kappa_reported, false);
  assert.ok(r.kappa_reason.includes('不报 κ'));
});

test('applyClassificationUnblind hydrates model labels for blinded rq3 rows', () => {
  const rows = [
    { case_id: 'rb001', prelabel: 'STRUCTURAL_ONLY', human2: 'STRUCTURAL_ONLY' },
    { case_id: 'rb002', prelabel: 'STRUCTURAL_ONLY', human2: 'EXPECTATION_CHANGE', final: 'EXPECTATION_CHANGE' },
  ];
  const hydrated = applyClassificationUnblind(rows, {
    rb001: { model_label: 'STRUCTURAL_ONLY' },
    rb002: { model_label: 'EXPECTATION_CHANGE' },
  });

  assert.equal(hydrated[0].model_label, 'STRUCTURAL_ONLY');
  assert.equal(hydrated[1].model_label, 'EXPECTATION_CHANGE');
  const r = scoreClassificationRows(hydrated);
  assert.equal(r.n, 2);
  assert.equal(r.po, 0.5);
  assert.equal(r.kappa, null);
});

test('applyRq2Unblind normalizes string and object-valued arm keys', () => {
  const rows = [
    { case_id: 'rq2_001', prelabel: 'y', annotator2_yn: 'y' },
    { case_id: 'rq2_002', prelabel: 'n', annotator2_yn: 'n' },
  ];
  const byArm = applyRq2Unblind(rows, {
    rq2_001: 'diff',
    rq2_002: { arm: 'nodiff' },
  });

  assert.equal(byArm.diff.n, 1);
  assert.equal(byArm.diff.semantic_validity, 1);
  assert.equal(byArm.nodiff.n, 1);
  assert.equal(byArm.nodiff.semantic_validity, 0);
});
