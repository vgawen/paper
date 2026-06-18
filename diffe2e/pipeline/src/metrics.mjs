// RQ metrics. All inputs are arrays of test identifiers (deduped via Set).

const asSet = (a) => new Set(a);
const inter = (a, b) => { const s = asSet(b); return a.filter((x) => s.has(x)); };

// Selection metrics (RQ1). full=all tests, selected=Sel, affected=oracle.
export function selectionMetrics({ full, selected, affected }) {
  const S = asSet(full).size, sel = asSet(selected).size, aff = asSet(affected).size;
  const hit = inter([...asSet(selected)], [...asSet(affected)]).length;
  return {
    Reduction: S ? +(1 - sel / S).toFixed(4) : 0,
    Safety: aff ? +(hit / aff).toFixed(4) : 1,
    Precision: sel ? +(hit / sel).toFixed(4) : 1,
    selected_count: sel,
    affected_count: aff,
    full_suite: S,
  };
}

// SelectionChangeCoverage: fraction of changed units touched by selected tests
// that pass on V_new WITHOUT repair. changedUnits=array, coverageOf=fn(test)->units[].
export function selectionChangeCoverage({ changedUnits, selectedPassing, coverageOf }) {
  const changed = asSet(changedUnits);
  if (changed.size === 0) return 1;
  const touched = new Set();
  for (const t of selectedPassing) for (const u of coverageOf(t) || []) if (changed.has(u)) touched.add(u);
  return +(touched.size / changed.size).toFixed(4);
}

// FinalChangeCoverage: after selection+repair+generation.
export function finalChangeCoverage({ changedUnits, targetedTests, coverageOf }) {
  return selectionChangeCoverage({ changedUnits, selectedPassing: targetedTests, coverageOf });
}

// TargetedSetUsability = (selected_pass + repaired_pass) / |Sel ∩ Affected|.
// Generated tests are NOT counted in the denominator.
export function targetedSetUsability({ selectedAffected, selectedPass, repairedPass }) {
  const denom = asSet(selectedAffected).size;
  if (denom === 0) return 1;
  return +((selectedPass + repairedPass) / denom).toFixed(4);
}
