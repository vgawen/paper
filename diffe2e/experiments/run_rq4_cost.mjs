// RQ4 real cost (fair) + net-saving (评审意见 #4 / COST_MODEL.md).
//
// Reports the advisor's core criterion: is  T_select + T_run(Sel)  far below
// T_full?  Both arms use the SAME Playwright command template, same --workers,
// same coverage setting; selected specs are passed in ONE invocation; each arm
// is repeated R>=3 times -> median/IQR. T_select (mapper update + diff analyze
// + select compute) is timed SEPARATELY and folded into the ours-total.
//
// Usage:
//   node experiments/run_rq4_cost.mjs <adapter.json> "a.spec.ts,b.spec.ts" [workers] [repeats] [fullCount]
//
// adapter.json fields (see experiments/real/adapters/*.json):
//   { name, repoDir, specGlob, testOneCmd ("{spec}" placeholder), covRel }
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'out', 'real');

function loadAdapter(file) {
  const a = JSON.parse(fs.readFileSync(file, 'utf8'));
  a.repoAbs = path.resolve(path.dirname(file), a.repoDir);
  return a;
}

// One Playwright invocation. Empty specsStr => full suite. Same template /
// workers / COV for both arms. Returns elapsed ms (breaks may exit non-zero;
// timing is still valid).
function timeRun(adapter, specsStr, workers) {
  const cmd = adapter.testOneCmd.replace('{spec}', `${specsStr} --workers=${workers}`.trim());
  const t = Date.now();
  try { execSync(cmd, { cwd: adapter.repoAbs, stdio: 'pipe' }); } catch { /* expected on breaks */ }
  return Date.now() - t;
}

// Selection cost: re-run the actual selection pipeline (mapper update + diff
// analyze + select) so T_select reflects real overhead, not zero. If a project
// hook is provided we call it; otherwise we time a no-op marker of 0 and flag
// it so the report does not silently pretend selection is free.
function timeSelect(adapter) {
  if (!adapter.selectCmd) return { ms: 0, measured: false };
  const t = Date.now();
  try { execSync(adapter.selectCmd, { cwd: adapter.repoAbs, stdio: 'pipe' }); } catch { /* */ }
  return { ms: Date.now() - t, measured: true };
}

const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const quantile = (a, q) => { const s = [...a].sort((x, y) => x - y); const i = (s.length - 1) * q; const lo = Math.floor(i); return s[lo] + (s[Math.ceil(i)] - s[lo]) * (i - lo); };
const stat = (a) => ({ median: median(a), iqr: [quantile(a, 0.25), quantile(a, 0.75)], runs: a });

function main() {
  const adapterFile = process.argv[2];
  if (!adapterFile) { console.error('usage: run_rq4_cost.mjs <adapter.json> "a.spec.ts,b.spec.ts" [workers] [repeats] [fullCount]'); process.exit(1); }
  const adapter = loadAdapter(adapterFile);
  const selected = (process.argv[3] || '').split(',').map((s) => s.trim()).filter(Boolean);
  const workers = parseInt(process.argv[4] || '4', 10);
  const repeats = parseInt(process.argv[5] || '3', 10);
  const fullCount = parseInt(process.argv[6] || '0', 10);
  fs.mkdirSync(OUT, { recursive: true });

  const specPaths = selected.map((s) => path.posix.join(adapter.specGlob || 'tests', s)).join(' ');
  const full = [], sel = [], selOverhead = [];
  for (let r = 0; r < repeats; r++) {
    full.push(timeRun(adapter, '', workers));
    const t = timeSelect(adapter); selOverhead.push(t.ms);
    sel.push(timeRun(adapter, specPaths, workers));
  }
  const selectMeasured = !!adapter.selectCmd;

  const Tfull = stat(full), Trun = stat(sel), Tsel = stat(selOverhead);
  const oursTotalMedian = Trun.median + Tsel.median;
  const reduction = fullCount ? +(1 - selected.length / fullCount).toFixed(4) : null;
  const res = {
    project: adapter.name, workers, repeats,
    selected_count: selected.length, full_count: fullCount || null,
    Reduction: reduction,
    T_select_ms: { ...Tsel, measured: selectMeasured },
    T_full_ms: Tfull,
    T_run_sel_ms: Trun,
    ours_total_ms: { median: oursTotalMedian },
    TimeReduction: Tfull.median ? +(1 - Trun.median / Tfull.median).toFixed(4) : 0,
    NetSaving: Tfull.median ? +(1 - oursTotalMedian / Tfull.median).toFixed(4) : 0,
    SelectionTax: Tfull.median ? +(Tsel.median / Tfull.median).toFixed(4) : 0,
    break_even: Tfull.median ? oursTotalMedian < Tfull.median : false,
  };
  fs.writeFileSync(path.join(OUT, `${adapter.name}_rq4.json`), JSON.stringify(res, null, 2));
  console.log(`RQ4 ${adapter.name}: full med=${Tfull.median}ms  sel-run med=${Trun.median}ms  T_select med=${Tsel.median}ms${selectMeasured ? '' : ' (NOT measured: no selectCmd)'}`);
  console.log(`  TimeReduction=${(res.TimeReduction * 100).toFixed(1)}%  NetSaving=${(res.NetSaving * 100).toFixed(1)}%  SelectionTax=${(res.SelectionTax * 100).toFixed(1)}%  break_even=${res.break_even}` +
    (reduction != null ? `  Reduction(cases)=${(reduction * 100).toFixed(1)}%` : ''));
}
main();
