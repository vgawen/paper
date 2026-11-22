// A2 step-2 ablation: function-level runtime coverage attribution.
//
// Replays the controlled subject's V_old per transition, captures function-level
// coverage (executed named functions per file, from the extended fixtures.ts),
// attributes the diff to functions (vs module-level variables), and compares the
// function-level selection against file-level selection + the frozen non-circular
// oracle (affected_obs from rq1_dataset.jsonl).
//
// Prereq: `node subject/history/seed.mjs` (generates subject/work with the
//         function-level fixture), Playwright + Chromium installed.
// Run:    `node experiments/run_a2_func.mjs`
import fs from 'node:fs';
import path from 'node:path';
import { WORK, OUT, checkout, readManifest, changedAppFiles, runSuite, ensureOut, git, showFile } from './lib.mjs';
import { parseUnifiedDiff } from '../pipeline/src/diff.mjs';
import { changedEntitiesFromCode } from '../pipeline/src/astEntities.mjs';

function loadCovFunc(covDir) {
  const norm = (p) => p.replace(/^\/+/, '');
  const map = {};
  if (!fs.existsSync(covDir)) return map;
  for (const f of fs.readdirSync(covDir)) {
    if (!f.endsWith('.json')) continue;
    const o = JSON.parse(fs.readFileSync(path.join(covDir, f), 'utf8'));
    const funcs = {};
    for (const [k, names] of Object.entries(o.funcs || {})) funcs[norm(k)] = names;
    map[o.test] = { files: (o.files || []).map(norm), funcs };
  }
  return map;
}

function main() {
  ensureOut();
  const manifest = readManifest();
  const frozen = {};
  for (const line of fs.readFileSync(path.join(OUT, 'rq1_dataset.jsonl'), 'utf8').trim().split('\n')) {
    const r = JSON.parse(line);
    frozen[r.tag] = { selected: r.selected, affected_obs: r.affected_obs || [], full: r.full_suite };
  }

  const rows = [];
  for (let i = 1; i < manifest.length; i++) {
    const oldT = manifest[i - 1].tag, newT = manifest[i].tag;
    checkout(oldT);
    const vold = runSuite(`cov/a2func/vold/${newT}`);
    const cov = loadCovFunc(vold.covDir);

    const changedFiles = changedAppFiles(oldT, newT);
    const fullDiff = git(`diff ${oldT} ${newT} -- app/public/src`);
    const parsed = parseUnifiedDiff(fullDiff);

    // attribute diff to functions vs module-level variables
    const funcEntities = {}; // file -> [function names]
    const varFiles = new Set(); // files with a module-level variable change (file-level fallback)
    for (const cf of changedFiles) {
      const repoF = 'app/public/' + cf;
      const newCode = showFile(newT, repoF);
      const lines = parsed.byFile[repoF] ? [...parsed.byFile[repoF].added, ...parsed.byFile[repoF].removed] : [];
      const ents = changedEntitiesFromCode(newCode, lines, cf);
      const fn = new Set();
      for (const e of ents) {
        if (e.kind === 'variable') varFiles.add(cf);
        else fn.add(e.name);
      }
      if (fn.size) funcEntities[cf] = [...fn];
    }

    const allTests = Object.keys(cov);
    const selected = new Set();
    for (const t of allTests) {
      const { files, funcs } = cov[t];
      for (const [cf, names] of Object.entries(funcEntities)) {
        if ((funcs[cf] || []).some((n) => names.includes(n))) { selected.add(t); break; }
      }
      for (const cf of varFiles) {
        if ((files || []).some((f) => f === cf)) { selected.add(t); break; }
      }
    }

    const fileLevel = new Set(allTests.filter((t) =>
      (cov[t].files || []).some((f) => changedFiles.includes(f))
    ));

    const fr = frozen[newT];
    const full = fr.full;
    const reductionFunc = 1 - selected.size / full;
    const reductionFile = 1 - fileLevel.size / full;
    const missed = fr.affected_obs.filter((a) => !selected.has(a));

    rows.push({
      tag: newT, type: manifest[i].type, changed: changedFiles,
      sel_file: fileLevel.size, sel_func: selected.size,
      red_file: +reductionFile.toFixed(4), red_func: +reductionFunc.toFixed(4),
      aobs: fr.affected_obs.length, missed,
    });
    console.log(`${newT} ${manifest[i].type.padEnd(16)} file=${fileLevel.size} func=${selected.size} red_file=${reductionFile.toFixed(3)} red_func=${reductionFunc.toFixed(3)} aobs=${fr.affected_obs.length} missed=${missed.length}`);
  }
  checkout(manifest[manifest.length - 1].tag);

  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const redFile = mean(rows.map((r) => r.red_file));
  const redFunc = mean(rows.map((r) => r.red_func));
  const totalMissed = rows.reduce((s, r) => s + r.missed.length, 0);
  const summary = {
    n: rows.length,
    reduction_file: +redFile.toFixed(4),
    reduction_func: +redFunc.toFixed(4),
    gain: +(redFunc - redFile).toFixed(4),
    total_misses: totalMissed,
    changed_transitions: rows.filter((r) => r.sel_func !== r.sel_file).map((r) => ({ tag: r.tag, type: r.type, file: r.sel_file, func: r.sel_func })),
  };
  fs.writeFileSync(path.join(OUT, 'a2_func_result.json'), JSON.stringify({ summary, rows }, null, 2));
  console.log('\n=== summary ===');
  console.log(`Reduction (file-level)      : ${summary.reduction_file}`);
  console.log(`Reduction (function-level)  : ${summary.reduction_func}`);
  console.log(`gain                        : ${summary.gain}`);
  console.log(`total recall misses (frozen affected_obs): ${summary.total_misses}`);
  console.log(`transitions where selection changed:`);
  for (const c of summary.changed_transitions) console.log(`  ${c.tag} ${c.type}: file=${c.file} -> func=${c.func}`);
}

main();
