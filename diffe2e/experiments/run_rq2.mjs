// RQ2 driver (two-arm) with AUTOMATIC semantic-validity proxies.
//
// For each coverage-gap commit (new route, no test), generate a Playwright test
// under TWO arms:
//   - 'diff'   : diff-constrained generation (route + changed source as context)
//   - 'nodiff' : no-diff-constraint baseline (app name only)
// and measure, per arm:
//   - executable        : the generated test runs & passes on V_new
//   - change_relevant   : its coverage touches the changed (gap) file
//   - mutation_kill     : injecting testId/visible-text mutations into the gap
//                         source makes the test FAIL (it actually verifies the
//                         new behavior; tautological asserts kill nothing)
//   - change_sensitive  : passes on V_new but FAILS on V_old (where the new
//                         feature is absent) -> it is sensitive to the change
//   - semantic_auto     : executable && change_sensitive && killed>0
// Cohen's-kappa human annotation is retained ONLY as a small validation sample
// (blinded sheet); the automatic proxies above are the primary objective metric.
import fs from 'node:fs';
import path from 'node:path';
import { WORK, OUT, checkout, readManifest, runSuite, loadCov, parseFailed, git, ensureOut } from './lib.mjs';
import { generateForGap, buildPromptNoDiff, cleanGeneratedSpec } from '../pipeline/src/generate.mjs';
import { createClient } from '../pipeline/src/llm/client.mjs';

const norm = (p) => p.replace(/^\/+/, '');
const PROBE = '--timeout=4000'; // bound failing-locator probes (else 30s default)
const findId = (cov, file) => Object.keys(cov).find((k) => k.startsWith(file + ' > ')) || '';

// Mutants of the gap source the generated test could plausibly detect:
// rename each data-testid, and append " MUT" to each visible-text token.
function mutantsForGap(code, k = 3) {
  const out = [];
  for (const m of code.matchAll(/data-testid="([^"]+)"/g)) {
    out.push({ kind: 'testid', token: m[1], code: code.replace(`data-testid="${m[1]}"`, `data-testid="${m[1]}-MUT"`) });
  }
  for (const t of [...code.matchAll(/>([A-Za-z][A-Za-z .!?]{2,40})</g)].map((m) => m[1])) {
    out.push({ kind: 'text', token: t, code: code.replace(t, `${t} MUT`) });
  }
  const seen = new Set(), res = [];
  for (const o of out) { if (seen.has(o.token)) continue; seen.add(o.token); res.push(o); if (res.length >= k) break; }
  return res;
}

// Evaluate one generated spec (already written to tests/<genFile>) on V_new
// (current checkout = gapT), plus mutation-kill and V_old differential.
function evalArm({ arm, genFile, gapRel, gapCovFile, gapCode, prevT, gapT }) {
  const run = runSuite(`cov/rq2/${gapT}_${arm}`, `tests/${genFile}`);
  const cov = loadCov(run.covDir);
  const failed = parseFailed(run.report);
  const genId = findId(cov, genFile);
  const executable = !!genId && !failed.has(genId);
  const change_relevant = (cov[genId] || []).map(norm).includes(gapCovFile);

  let mutants = 0, killed = 0, change_sensitive = false;
  if (executable) {
    const abs = path.join(WORK, gapRel);
    for (const [i, m] of mutantsForGap(gapCode).entries()) {
      fs.writeFileSync(abs, m.code);
      const r = runSuite(`cov/rq2mut/${gapT}_${arm}_${i}`, `tests/${genFile} ${PROBE}`);
      if (parseFailed(r.report).has(genId)) killed++;
      git(`checkout -- ${gapRel}`);
      mutants++;
    }
    // differential: run the same spec on V_old (feature absent -> expect fail)
    checkout(prevT);
    const old = runSuite(`cov/rq2diff/${gapT}_${arm}`, `tests/${genFile} ${PROBE}`);
    change_sensitive = parseFailed(old.report).has(genId);
    checkout(gapT);
  }
  const mutation_score = mutants ? +(killed / mutants).toFixed(4) : 0;
  const semantic_auto = executable && change_sensitive && killed > 0;
  return { arm, executable, change_relevant, mutants, killed, mutation_score, change_sensitive, semantic_auto };
}

async function main() {
  ensureOut();
  const manifest = readManifest();
  const client = createClient();
  const rows = [];
  const toAnnotate = [];

  for (let i = 1; i < manifest.length; i++) {
    if (manifest[i].type !== 'new_feature_gap') continue;
    const prevT = manifest[i - 1].tag, gapT = manifest[i].tag;

    checkout(gapT);
    const added = git(`diff --diff-filter=A ${prevT} ${gapT} -- app/public/src`)
      .split('\n').filter((l) => l.startsWith('+++ b/')).map((l) => l.slice(6))
      .filter((f) => f.includes('app/public/src/'));
    const gapPath = added[0];
    if (!gapPath) continue;
    const stem = path.basename(gapPath).replace(/\.js$/, '');
    const route = '/' + stem;
    const gapRel = gapPath; // app/public/src/<stem>.js
    const gapCovFile = 'src/' + gapPath.split('app/public/src/')[1];
    const gapCode = fs.readFileSync(path.join(WORK, gapPath), 'utf8');

    // generate both arms; keep both spec files until all metrics are computed
    const title = `generated ${route} smoke`;
    const { spec } = await generateForGap({ route, code: gapCode, title, client });
    const diffFile = `_gen_${stem}.spec.ts`;
    fs.writeFileSync(path.join(WORK, 'tests', diffFile), spec);

    const nodiffSpec = cleanGeneratedSpec(await client.complete(buildPromptNoDiff({ appName: 'demo-app' }), { fallback: spec }));
    const ndFile = `_gen_nodiff_${stem}.spec.ts`;
    fs.writeFileSync(path.join(WORK, 'tests', ndFile), nodiffSpec);

    const base = { gapRel, gapCovFile, gapCode, prevT, gapT };
    const dm = evalArm({ arm: 'diff', genFile: diffFile, ...base });
    const nm = evalArm({ arm: 'nodiff', genFile: ndFile, ...base });
    rows.push({ tag: gapT, route, gap_file: gapCovFile, ...dm });
    rows.push({ tag: gapT, route, gap_file: gapCovFile, ...nm });
    for (const m of [dm, nm]) {
      console.log(`${gapT} ${route} [${m.arm}]: exec=${m.executable} rel=${m.change_relevant} ` +
        `mutKill=${m.killed}/${m.mutants} sensitive=${m.change_sensitive} semanticAuto=${m.semantic_auto}`);
    }

    toAnnotate.push({ tag: gapT, route, gap_file: gapCovFile, arm: 'diff', spec });
    toAnnotate.push({ tag: gapT, route, gap_file: gapCovFile, arm: 'nodiff', spec: nodiffSpec });

    fs.rmSync(path.join(WORK, 'tests', diffFile), { force: true });
    fs.rmSync(path.join(WORK, 'tests', ndFile), { force: true });
  }

  checkout(manifest[manifest.length - 1].tag);

  // per-arm summary
  const byArm = (arm) => rows.filter((r) => r.arm === arm);
  const rate = (arr, k) => arr.length ? +(arr.filter((r) => r[k]).length / arr.length).toFixed(4) : 0;
  const meanScore = (arr) => arr.length ? +(arr.reduce((s, r) => s + r.mutation_score, 0) / arr.length).toFixed(4) : 0;
  const summary = {};
  for (const arm of ['diff', 'nodiff']) {
    const a = byArm(arm);
    summary[arm] = {
      n: a.length, execRate: rate(a, 'executable'), relRate: rate(a, 'change_relevant'),
      mutKillMean: meanScore(a), changeSensRate: rate(a, 'change_sensitive'), semanticAutoRate: rate(a, 'semantic_auto'),
    };
  }
  fs.writeFileSync(path.join(OUT, 'rq2_results.json'),
    JSON.stringify({ provider: client.provider, summary, rows }, null, 2));

  // blinded annotation sheet + unblinding key (small human-validation sample)
  let s = 1234; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const blinded = toAnnotate.map((r, i) => ({ case_id: `c${i}`, ...r })).sort(() => rnd() - 0.5);
  fs.writeFileSync(path.join(OUT, 'rq2_to_annotate.jsonl'),
    blinded.map((r) => JSON.stringify({ case_id: r.case_id, route: r.route, gap_file: r.gap_file, spec: r.spec })).join('\n') + '\n');
  fs.writeFileSync(path.join(OUT, 'rq2_unblind.json'),
    JSON.stringify(Object.fromEntries(blinded.map((r) => [r.case_id, r.arm])), null, 2));

  const md = [
    `# RQ2: Two-arm Gap Generation + automatic semantic validity (provider=${client.provider})`, '',
    '| arm | n | executable | change-relevant | mutation-kill (mean) | change-sensitive | semantic-valid (auto) |',
    '|---|---|---|---|---|---|---|',
    ...['diff', 'nodiff'].map((arm) => {
      const x = summary[arm];
      return `| ${arm} | ${x.n} | ${x.execRate} | ${x.relRate} | ${x.mutKillMean} | ${x.changeSensRate} | ${x.semanticAutoRate} |`;
    }),
    '',
    '- **automatic semantic validity** = executable ∧ change-sensitive (pass V_new, fail V_old) ∧ kills ≥1 injected new-behavior mutant. Objective, no human needed.',
    '- mutation-kill (mean) = mean over specs of killed/injected mutants on the gap source (testId renames + visible-text edits).',
    '- core claim: the diff-constrained arm should reach higher change-relevant / mutation-kill / semantic-valid than the no-diff baseline (differences emerge under a real LLM; stub returns the same template for both).',
    '- human Cohen\'s κ retained as a small validation sample only: blinded `rq2_to_annotate.jsonl` + key `rq2_unblind.json`.',
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'rq2_results.md'), md + '\n');
  console.log('\n' + md);
}

main();
