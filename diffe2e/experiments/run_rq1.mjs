// RQ1 driver: replay each commit transition, compute selection metrics for
// ours + baselines against the V_new oracle, write dataset + summary.
import fs from 'node:fs';
import path from 'node:path';
import { WORK, OUT, checkout, readManifest, changedAppFiles, runSuite, loadCov, parseFailed, ensureOut, showFile, readTestSource } from './lib.mjs';
import { computeOne } from './compute.mjs';
import { changedUiSignals, selectByDomDiff } from '../pipeline/src/domdiff.mjs';
import { buildAffectedByOutcome, safetyEmp } from '../pipeline/src/outcome_oracle.mjs';

function mean(a) { return a.length ? +(a.reduce((s, x) => s + x, 0) / a.length).toFixed(4) : 0; }

// Build a per-test outcome map (pass/fail/absent) from a coverage map (which
// tests ran) and a failed-set. Coverage presence == the test executed.
function outcomeMap(cov, failedSet) {
  const m = {};
  for (const id of Object.keys(cov)) m[id] = failedSet.has(id) ? 'fail' : 'pass';
  return m;
}

function main() {
  ensureOut();
  const manifest = readManifest();
  const rows = [];
  const safetyMisses = [];

  for (let i = 1; i < manifest.length; i++) {
    const oldT = manifest[i - 1].tag, newT = manifest[i].tag;
    const meta = manifest[i];

    checkout(oldT);
    const vold = runSuite(`cov/vold/${newT}`);
    const covVold = loadCov(vold.covDir);
    // capture V_old outcomes BEFORE V_new overwrites the shared report file.
    const voldFailed = parseFailed(vold.report);

    const changedFiles = changedAppFiles(oldT, newT);

    // UI-signal: aggregate DOM-signal diff across changed files (old vs new)
    const oldAll = changedFiles.map((f) => showFile(oldT, `app/public/${f}`)).join('\n');
    const newAll = changedFiles.map((f) => showFile(newT, `app/public/${f}`)).join('\n');
    const signals = changedUiSignals(oldAll, newAll);

    checkout(newT);
    const vnew = runSuite(`cov/vnew/${newT}`);
    const covVnew = loadCov(vnew.covDir);
    const failed = parseFailed(vnew.report);

    // map each test id -> its spec source (1 test per spec file in this subject)
    const testSources = {};
    for (const id of new Set([...Object.keys(covVold), ...Object.keys(covVnew)])) {
      testSources[id] = readTestSource(id.split(' > ')[0]);
    }
    const uiSelected = selectByDomDiff(signals, testSources);

    const r = computeOne({ covVold, covVnew, changedFiles, uiSelected });
    const failedSelected = r.selected.filter((t) => failed.has(t));

    // --- Non-circular recall check (SAFETY.md §4): A_obs is derived from the
    //     OBSERVED outcome difference V_old vs V_new, NOT from coverage. This
    //     breaks the self-fulfilling loop of the coverage-based oracle. ---
    const affectedObs = buildAffectedByOutcome({
      resVold: outcomeMap(covVold, voldFailed),
      resVnew: outcomeMap(covVnew, failed),
    });
    const safeOurs = safetyEmp({ selected: r.selected, affectedObs });
    const safeCov = safetyEmp({ selected: r.methods.coverage_only, affectedObs });
    if (safeOurs.misses.length) {
      safetyMisses.push({ tag: newT, type: meta.type, missed: safeOurs.misses, affected_obs: affectedObs, changed_files: changedFiles });
    }

    const row = {
      tag: newT, type: meta.type, desc: meta.desc,
      changed_files: changedFiles,
      full_suite: r.metrics.ours.full_suite,
      selected_count: r.metrics.ours.selected_count,
      affected_count: r.metrics.ours.affected_count,
      affected: r.affected,
      selected: r.selected,
      failed_selected: failedSelected,
      // non-circular recall: oracle from observed outcome diff, not coverage.
      affected_obs: affectedObs,
      safety_emp_ours: safeOurs.SafetyEmp,
      safety_emp_coverage_only: safeCov.SafetyEmp,
      safety_emp_misses: safeOurs.misses,
      ui_signals: signals,
      ui_selected: uiSelected,
      metrics: {
        ours: r.metrics.ours,
        coverage_only: r.metrics.coverage_only,
        uidiff_only: r.metrics.uidiff_only,
        dual: r.metrics.dual,
        retest_all: r.metrics.retest_all,
        random_k: r.metrics.random_k,
        static_heuristic: r.metrics.static_heuristic,
      },
    };
    rows.push(row);
    console.log(`${newT} [${meta.type}] changed=${JSON.stringify(changedFiles)} ` +
      `cov=${r.metrics.coverage_only.selected_count} ui=${r.metrics.uidiff_only.selected_count} ` +
      `dual=${row.selected_count}/${row.full_suite} Safe=${r.metrics.ours.Safety} Prec=${r.metrics.ours.Precision} failSel=${failedSelected.length}`);
  }

  // restore work to latest
  checkout(manifest[manifest.length - 1].tag);

  fs.writeFileSync(path.join(OUT, 'rq1_dataset.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');

  // summary: mean metrics per method
  const methods = ['ours', 'coverage_only', 'uidiff_only', 'dual', 'retest_all', 'random_k', 'static_heuristic'];
  const summary = {};
  for (const m of methods) {
    summary[m] = {
      Reduction: mean(rows.map((r) => r.metrics[m].Reduction)),
      Safety: mean(rows.map((r) => r.metrics[m].Safety)),
      Precision: mean(rows.map((r) => r.metrics[m].Precision)),
    };
  }
  // non-circular recall summary (SAFETY.md §4): mean SafetyEmp over transitions
  // that actually have observed-affected tests, plus the recall-miss audit.
  const obsRows = rows.filter((r) => (r.affected_obs || []).length > 0);
  const safetyEmpSummary = {
    transitions_with_observed_affected: obsRows.length,
    SafetyEmp_ours: mean(obsRows.map((r) => r.safety_emp_ours)),
    SafetyEmp_coverage_only: mean(obsRows.map((r) => r.safety_emp_coverage_only)),
    total_misses: safetyMisses.reduce((s, m) => s + m.missed.length, 0),
  };
  fs.writeFileSync(path.join(OUT, 'rq1_summary.json'), JSON.stringify({ n: rows.length, summary, safety_emp: safetyEmpSummary }, null, 2));
  fs.writeFileSync(path.join(OUT, 'safety_misses.json'), JSON.stringify(safetyMisses, null, 2));

  // markdown
  const hdr = '| method | Reduction | Safety | Precision |\n|---|---|---|---|';
  const body = methods.map((m) => `| ${m} | ${summary[m].Reduction} | ${summary[m].Safety} | ${summary[m].Precision} |`).join('\n');
  const safetyBlock = `\n## Non-circular recall (SafetyEmp, outcome-diff oracle)\n\n` +
    `- transitions with observed-affected tests: ${safetyEmpSummary.transitions_with_observed_affected}\n` +
    `- SafetyEmp (ours/dual): **${safetyEmpSummary.SafetyEmp_ours}**\n` +
    `- SafetyEmp (coverage-only arm): ${safetyEmpSummary.SafetyEmp_coverage_only}\n` +
    `- total recall misses (see safety_misses.json): ${safetyEmpSummary.total_misses}\n`;
  fs.writeFileSync(path.join(OUT, 'rq1_summary.md'),
    `# RQ1 Summary (n=${rows.length} commit transitions)\n\n${hdr}\n${body}\n${safetyBlock}`);
  console.log('\n=== RQ1 summary ===\n' + hdr + '\n' + body);
  console.log(`\n=== Non-circular recall ===\nSafetyEmp(ours)=${safetyEmpSummary.SafetyEmp_ours} ` +
    `SafetyEmp(coverage_only)=${safetyEmpSummary.SafetyEmp_coverage_only} ` +
    `misses=${safetyEmpSummary.total_misses} over ${safetyEmpSummary.transitions_with_observed_affected} transitions`);
}

main();
