// Pure per-commit computation: given V_old/V_new coverage maps + changed files,
// compute selection (ours) + baselines + their metrics against the oracle.
import { selectByCoverage } from '../pipeline/src/selector.mjs';
import { buildAffected } from '../pipeline/src/oracle.mjs';
import { selectionMetrics } from '../pipeline/src/metrics.mjs';
import { retestAll, randomK, staticHeuristic } from './baselines.mjs';

export function computeOne({ covVold, covVnew, changedFiles, seed = 42 }) {
  const allTests = [...new Set([...Object.keys(covVold), ...Object.keys(covVnew)])];
  const affected = buildAffected(covVnew, changedFiles); // oracle (V_new only)

  const ours = selectByCoverage(covVold, changedFiles); // selection (V_old only)

  const methods = {
    ours,
    retest_all: retestAll(allTests),
    random_k: randomK(allTests, ours.length, seed),
    static_heuristic: staticHeuristic(allTests, changedFiles),
  };

  const metrics = {};
  for (const [name, sel] of Object.entries(methods)) {
    metrics[name] = selectionMetrics({ full: allTests, selected: sel, affected });
  }
  return { allTests, changedFiles, affected, selected: ours, methods, metrics };
}
