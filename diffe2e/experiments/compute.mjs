// Pure per-commit computation: given V_old/V_new coverage maps + changed files,
// compute selection (ours) + baselines + their metrics against the oracle.
import { selectByCoverage } from '../pipeline/src/selector.mjs';
import { buildAffected } from '../pipeline/src/oracle.mjs';
import { selectionMetrics } from '../pipeline/src/metrics.mjs';
import { retestAll, randomK, staticHeuristic } from './baselines.mjs';

export function computeOne({ covVold, covVnew, changedFiles, uiSelected = [], seed = 42 }) {
  const allTests = [...new Set([...Object.keys(covVold), ...Object.keys(covVnew)])];
  const affected = buildAffected(covVnew, changedFiles); // oracle (V_new only)

  const coverage_only = selectByCoverage(covVold, changedFiles); // selection (V_old only)
  const uidiff_only = uiSelected.filter((t) => allTests.includes(t));
  const dual = [...new Set([...coverage_only, ...uidiff_only])];

  const methods = {
    ours: dual,
    coverage_only,
    uidiff_only,
    dual,
    retest_all: retestAll(allTests),
    random_k: randomK(allTests, dual.length, seed),
    static_heuristic: staticHeuristic(allTests, changedFiles),
  };

  const metrics = {};
  for (const [name, sel] of Object.entries(methods)) {
    metrics[name] = selectionMetrics({ full: allTests, selected: sel, affected });
  }
  return { allTests, changedFiles, affected, selected: methods.ours, methods, metrics };
}
