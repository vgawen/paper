// Usage: node experiments/real/run_rq1_real.mjs <adapter.json> [maxTransitions]
// Replays the last N commit transitions that touch source, runs the suite with
// per-test coverage on V_old and V_new, derives an affected oracle from V_new,
// and computes coverage_only / uidiff_only / dual selection metrics per transition.
//
// Stability gate (only stable transitions enter the main result):
//   - install must succeed on BOTH ends, else skip(install_failed_*).
//   - BOTH ends must produce non-empty coverage, else skip(empty_cov_*).
//   - the V_old test set must largely survive into V_new (>=50%), else
//     skip(unstable_testset). NOTE: V_new tests FAILING (the break itself) is
//     EXPECTED and is NOT a skip reason; only missing coverage (infra) is.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadAdapter, gitIn, checkoutSha, changedSrcFiles, runSuiteLive, loadCovLive, computeTransition, installLive,
} from './engine.mjs';
import { extractFromCode, semanticDiffNodes } from '../../pipeline/src/uidiff.mjs';
import { changedUiSignals, selectByDomDiff } from '../../pipeline/src/domdiff.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, '..', 'out', 'real');

function skip(skips, prev, sha, reason) { skips.push({ prev, sha, reason }); console.log(`SKIP ${sha.slice(0, 8)}: ${reason}`); }

const safeShow = (repo, ref, f) => { try { return gitIn(repo, `show ${ref}:${f}`); } catch { return ''; } };

// Collect UI signals (testId / visible text) that were removed or modified
// between the two commits. JSX/TSX uses the Semantic UI Diff; other source
// falls back to the vanilla DOM-signal diff.
function uiSignalSelect(adapter, prev, sha, changed) {
  const sigs = [];
  for (const f of changed) {
    const oldC = safeShow(adapter.repoAbs, prev, f), newC = safeShow(adapter.repoAbs, sha, f);
    if (/\.(t|j)sx$/.test(f)) {
      try {
        const d = semanticDiffNodes(extractFromCode(oldC, f), extractFromCode(newC, f));
        for (const e of [...d.REMOVE, ...d.MODIFY]) {
          const node = e.node || null;
          if (node?.testId) sigs.push(node.testId);
          if (node?.text) sigs.push(node.text);
          // MODIFY entries carry .changes with from/to of locator-anchoring fields
          for (const field of ['testId', 'text', 'ariaLabel', 'href', 'name']) {
            const ch = e.changes?.[field];
            if (ch && ch.from) sigs.push(ch.from);
          }
        }
      } catch { /* parser miss -> skip this file's UI signal */ }
    } else {
      sigs.push(...changedUiSignals(oldC, newC));
    }
  }
  return [...new Set(sigs.filter(Boolean))];
}

async function main() {
  const adapterFile = process.argv[2];
  if (!adapterFile) { console.error('usage: run_rq1_real.mjs <adapter.json> [maxTransitions]'); process.exit(1); }
  const maxN = parseInt(process.argv[3] || '15', 10);
  const adapter = loadAdapter(adapterFile);
  fs.mkdirSync(OUT, { recursive: true });

  // pick commits that touched srcGlob, newest first, then chronological pairs
  const log = gitIn(adapter.repoAbs, `log --format=%H -n 400 -- ${adapter.srcGlob}`).trim().split('\n').filter(Boolean);
  const shas = log.slice(0, maxN + 1).reverse(); // oldest..newest
  const rows = [];
  const skips = [];
  for (let i = 1; i < shas.length; i++) {
    const prev = shas[i - 1], sha = shas[i];
    const changed = changedSrcFiles(adapter.repoAbs, prev, sha, adapter.srcGlob);
    if (!changed.length) continue;

    // --- V_old: checkout, install (best-effort), full suite w/ coverage ---
    checkoutSha(adapter.repoAbs, prev);
    if (!installLive(adapter)) { skip(skips, prev, sha, 'install_failed_vold'); continue; }
    const voldRun = runSuiteLive(adapter);
    const voldCov = loadCovLive(adapter, voldRun.covAbs);
    const ui = uiSignalSelect(adapter, prev, sha, changed);

    // --- V_new: checkout, install, full suite w/ coverage ---
    checkoutSha(adapter.repoAbs, sha);
    if (!installLive(adapter)) { skip(skips, prev, sha, 'install_failed_vnew'); continue; }
    const vnewRun = runSuiteLive(adapter);
    const vnewCov = loadCovLive(adapter, vnewRun.covAbs);

    // --- stability gate ---
    const voldTests = Object.keys(voldCov), vnewTests = Object.keys(vnewCov);
    if (voldTests.length === 0) { skip(skips, prev, sha, 'empty_cov_vold'); continue; }
    if (vnewTests.length === 0) { skip(skips, prev, sha, 'empty_cov_vnew'); continue; }
    const survived = voldTests.filter((t) => vnewTests.includes(t)).length;
    if (survived / voldTests.length < 0.5) { skip(skips, prev, sha, `unstable_testset(${survived}/${voldTests.length})`); continue; }

    // map UI signals to tests by source reference (read spec sources at sha)
    const testSources = {};
    for (const id of new Set([...voldTests, ...vnewTests])) {
      const specFile = id.split(' > ')[0];
      testSources[id] = safeShow(adapter.repoAbs, sha, path.posix.join(adapter.specGlob, specFile)) || '';
    }
    const uiSelected = selectByDomDiff(ui, testSources);

    const r = computeTransition({ covVold: voldCov, covVnew: vnewCov, changed, uiSelected });
    rows.push({ prev, sha, changed, ui_signals: ui, vold_tests: voldTests.length, vnew_tests: vnewTests.length,
      metrics: r.metrics, selected: r.methods.dual, affected: r.affected });
    console.log(`${sha.slice(0, 8)} changed=${changed.length} cov=${r.metrics.coverage_only.selected_count} ui=${r.metrics.uidiff_only.selected_count} dual Safe=${r.metrics.dual.Safety} Prec=${r.metrics.dual.Precision}`);
  }

  const base = path.join(OUT, adapter.name);
  fs.writeFileSync(`${base}_rq1.jsonl`, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  fs.writeFileSync(`${base}_rq1_skips.json`, JSON.stringify(skips, null, 2));
  console.log(`\nincluded ${rows.length} stable transitions; skipped ${skips.length} (see ${adapter.name}_rq1_skips.json)`);
  const mean = (k, m) => rows.length ? +(rows.reduce((s, r) => s + r.metrics[m][k], 0) / rows.length).toFixed(4) : 0;
  const summary = {};
  for (const m of ['coverage_only', 'uidiff_only', 'dual']) summary[m] = { Reduction: mean('Reduction', m), Safety: mean('Safety', m), Precision: mean('Precision', m) };
  fs.writeFileSync(`${base}_rq1.json`, JSON.stringify({ project: adapter.name, n: rows.length, summary }, null, 2));
  const md = [`# RQ1 real: ${adapter.name} (n=${rows.length})`, '', '| method | Reduction | Safety | Precision |', '|---|---|---|---|',
    ...Object.entries(summary).map(([m, s]) => `| ${m} | ${s.Reduction} | ${s.Safety} | ${s.Precision} |`)].join('\n');
  fs.writeFileSync(`${base}_rq1.md`, md + '\n');
  console.log('\n' + md);
}
main();
