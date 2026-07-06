import test from 'node:test';
import assert from 'node:assert/strict';
import { applyClassificationUnblind, applyRq2Unblind, scoreClassificationRows, scoreRows } from './score.mjs';

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

test('scoreClassificationRows reports human agreement and model-vs-human agreement', () => {
  const r = scoreClassificationRows([
    { model_label: 'STRUCTURAL_ONLY', human1: 'STRUCTURAL_ONLY', human2: 'STRUCTURAL_ONLY' },
    { model_label: 'EXPECTATION_CHANGE', human1: 'STRUCTURAL_ONLY', human2: 'EXPECTATION_CHANGE', final: 'EXPECTATION_CHANGE' },
    { model_label: 'STRUCTURAL_ONLY', human1: 'SUSPECTED_REGRESSION', human2: 'SUSPECTED_REGRESSION' },
  ]);

  assert.equal(r.n, 3);
  assert.equal(r.model_accuracy, +(2 / 3).toFixed(4));
  assert.ok(r.human_kappa.kappa <= 1 && r.human_kappa.kappa >= -1);
  assert.ok(r.model_kappa.kappa <= 1 && r.model_kappa.kappa >= -1);
});

test('applyClassificationUnblind hydrates model labels for blinded rq3 rows', () => {
  const rows = [
    { case_id: 'rb001', human1: 'STRUCTURAL_ONLY', human2: 'STRUCTURAL_ONLY' },
    { case_id: 'rb002', human1: 'STRUCTURAL_ONLY', human2: 'EXPECTATION_CHANGE', final: 'EXPECTATION_CHANGE' },
  ];
  const hydrated = applyClassificationUnblind(rows, {
    rb001: { model_label: 'STRUCTURAL_ONLY' },
    rb002: { model_label: 'EXPECTATION_CHANGE' },
  });

  assert.equal(hydrated[0].model_label, 'STRUCTURAL_ONLY');
  assert.equal(hydrated[1].model_label, 'EXPECTATION_CHANGE');
  const r = scoreClassificationRows(hydrated);
  assert.equal(r.n, 2);
  assert.equal(r.model_accuracy, 1);
});

test('applyRq2Unblind normalizes string and object-valued arm keys', () => {
  const rows = [
    { case_id: 'rq2_001', annotator1_yn: 'y', annotator2_yn: 'y' },
    { case_id: 'rq2_002', annotator1_yn: 'n', annotator2_yn: 'n' },
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
