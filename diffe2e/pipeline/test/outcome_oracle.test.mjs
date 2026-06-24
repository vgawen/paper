import test from 'node:test';
import assert from 'node:assert/strict';
import {
  outcomeSignature,
  buildAffectedByOutcome,
  safetyEmp,
} from '../src/outcome_oracle.mjs';

test('outcomeSignature normalizes status and assertion fingerprint', () => {
  assert.equal(outcomeSignature('pass'), 'pass|');
  assert.equal(outcomeSignature({ status: 'fail' }), 'fail|');
  assert.equal(outcomeSignature({ status: 'pass', fingerprint: 'a:1' }), 'pass|a:1');
});

test('buildAffectedByOutcome flags tests whose outcome changed', () => {
  const resVold = { t1: 'pass', t2: 'pass', t3: 'fail' };
  const resVnew = { t1: 'pass', t2: 'fail', t3: 'fail' };
  // only t2 changed pass->fail; t1/t3 unchanged.
  assert.deepEqual(buildAffectedByOutcome({ resVold, resVnew }).sort(), ['t2']);
});

test('buildAffectedByOutcome treats assertion-fingerprint changes as affected', () => {
  const resVold = { t1: { status: 'pass', fingerprint: 'count=3' } };
  const resVnew = { t1: { status: 'pass', fingerprint: 'count=4' } };
  // both pass, but observable assertion result differs -> affected.
  assert.deepEqual(buildAffectedByOutcome({ resVold, resVnew }), ['t1']);
});

test('buildAffectedByOutcome treats added/removed tests as affected', () => {
  const resVold = { t1: 'pass' };
  const resVnew = { t1: 'pass', t2: 'pass' };
  assert.deepEqual(buildAffectedByOutcome({ resVold, resVnew }), ['t2']);
});

test('safetyEmp = 1 when selection covers all observed-affected', () => {
  const r = safetyEmp({ selected: ['t1', 't2'], affectedObs: ['t2'] });
  assert.equal(r.SafetyEmp, 1);
  assert.deepEqual(r.misses, []);
});

test('safetyEmp < 1 reports the missed affected tests (recall audit)', () => {
  const r = safetyEmp({ selected: ['t1'], affectedObs: ['t2', 't3'] });
  assert.equal(r.SafetyEmp, 0);
  assert.deepEqual(r.misses.sort(), ['t2', 't3']);
});

test('safetyEmp empty observed-affected => 1 (nothing to miss)', () => {
  const r = safetyEmp({ selected: [], affectedObs: [] });
  assert.equal(r.SafetyEmp, 1);
});
