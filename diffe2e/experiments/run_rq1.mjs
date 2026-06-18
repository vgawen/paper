// RQ1 driver: replay each commit transition, compute selection metrics for
// ours + baselines against the V_new oracle, write dataset + summary.
import fs from 'node:fs';
import path from 'node:path';
import { WORK, OUT, checkout, readManifest, changedAppFiles, runSuite, loadCov, parseFailed, ensureOut, showFile, readTestSource } from './lib.mjs';
import { computeOne } from './compute.mjs';
import { changedUiSignals, selectByDomDiff } from '../pipeline/src/domdiff.mjs';

function mean(a) { return a.length ? +(a.reduce((s, x) => s + x, 0) / a.length).toFixed(4) : 0; }

function main() {
  ensureOut();
  const manifest = readManifest();
  const rows = [];

  for (let i = 1; i < manifest.length; i++) {
    const oldT = manifest[i - 1].tag, newT = manifest[i].tag;
    const meta = manifest[i];

    checkout(oldT);
    const vold = runSuite(`cov/vold/${newT}`);
    const covVold = loadCov(vold.covDir);

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

    const row = {
      tag: newT, type: meta.type, desc: meta.desc,
      changed_files: changedFiles,
      full_suite: r.metrics.ours.full_suite,
      selected_count: r.metrics.ours.selected_count,
      affected_count: r.metrics.ours.affected_count,
      affected: r.affected,
      selected: r.selected,
      failed_selected: failedSelected,
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
  fs.writeFileSync(path.join(OUT, 'rq1_summary.json'), JSON.stringify({ n: rows.length, summary }, null, 2));

  // markdown
  const hdr = '| method | Reduction | Safety | Precision |\n|---|---|---|---|';
  const body = methods.map((m) => `| ${m} | ${summary[m].Reduction} | ${summary[m].Safety} | ${summary[m].Precision} |`).join('\n');
  fs.writeFileSync(path.join(OUT, 'rq1_summary.md'),
    `# RQ1 Summary (n=${rows.length} commit transitions)\n\n${hdr}\n${body}\n`);
  console.log('\n=== RQ1 summary ===\n' + hdr + '\n' + body);
}

main();
