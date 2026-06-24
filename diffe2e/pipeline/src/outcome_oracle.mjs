// Non-circular "affected-test" oracle (RQ1 / Safety).
//
// The classic affected oracle (oracle.mjs) is derived from coverage of the
// SAME changed-file set the selector uses, so Safety becomes nearly
// self-fulfilling. This oracle instead defines the ground-truth affected set
// PURELY from observable execution outcomes on V_old vs V_new: a test is
// affected iff its observable result (pass/fail/error + optional assertion
// fingerprint) differs between the two versions, or it was added/removed.
//
// This A_obs is what "should not be missed" — measured from reality, not from
// the selector's own signal. SafetyEmp = |Sel ∩ A_obs| / |A_obs|.

// Normalize an outcome to a canonical "status|fingerprint" signature.
// Accepts a bare status string or an object { status, fingerprint }.
export function outcomeSignature(o) {
  if (o == null) return 'absent|';
  if (typeof o === 'string') return `${o}|`;
  const status = o.status == null ? '' : String(o.status);
  const fp = o.fingerprint == null ? '' : String(o.fingerprint);
  return `${status}|${fp}`;
}

// Tests whose observable outcome changed across versions (incl. add/remove).
// resVold / resVnew: { testId: outcome }.
export function buildAffectedByOutcome({ resVold = {}, resVnew = {} }) {
  const ids = new Set([...Object.keys(resVold), ...Object.keys(resVnew)]);
  const affected = [];
  for (const id of ids) {
    const a = id in resVold ? outcomeSignature(resVold[id]) : 'absent|';
    const b = id in resVnew ? outcomeSignature(resVnew[id]) : 'absent|';
    if (a !== b) affected.push(id);
  }
  return affected;
}

// Empirical safety against the outcome-derived oracle, with a recall audit.
// Returns { SafetyEmp, misses, hit, affected_count }. Empty oracle => 1.
export function safetyEmp({ selected = [], affectedObs = [] }) {
  const sel = new Set(selected);
  const aff = [...new Set(affectedObs)];
  if (aff.length === 0) return { SafetyEmp: 1, misses: [], hit: 0, affected_count: 0 };
  const misses = aff.filter((t) => !sel.has(t));
  const hit = aff.length - misses.length;
  return {
    SafetyEmp: +(hit / aff.length).toFixed(4),
    misses,
    hit,
    affected_count: aff.length,
  };
}
