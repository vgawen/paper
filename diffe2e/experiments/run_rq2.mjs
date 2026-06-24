// RQ2 driver (two-arm): for each coverage-gap commit (new route, no test),
// generate a Playwright test under TWO arms and measure executable-rate +
// change-relevant-rate per arm:
//   - 'diff'   : diff-constrained generation (route + changed source as context)
//   - 'nodiff' : no-diff-constraint baseline (app name only)
// Semantic validity needs a human/LLM judge -> both arms emitted (blinded) to
// rq2_to_annotate.jsonl, with the arm kept ONLY in rq2_unblind.json.
import fs from 'node:fs';
import path from 'node:path';
import { WORK, OUT, checkout, readManifest, runSuite, loadCov, parseFailed, git, ensureOut } from './lib.mjs';
import { generateForGap, buildPromptNoDiff } from '../pipeline/src/generate.mjs';
import { createClient } from '../pipeline/src/llm/client.mjs';

const norm = (p) => p.replace(/^\/+/, '');

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
    const gapCovFile = 'src/' + gapPath.split('app/public/src/')[1];
    const code = fs.readFileSync(path.join(WORK, gapPath), 'utf8');

    // --- arm: diff-constrained ---
    const title = `generated ${route} smoke`;
    const { spec, signals } = await generateForGap({ route, code, title, client });
    const specFile = `_gen_${stem}.spec.ts`;
    const specAbs = path.join(WORK, 'tests', specFile);
    fs.writeFileSync(specAbs, spec);
    const run = runSuite(`cov/gen/${gapT}`);
    const cov = loadCov(run.covDir);
    const failed = parseFailed(run.report);
    const genId = `${specFile} > ${title}`;
    const executable = !failed.has(genId) && Object.keys(cov).some((k) => k === genId);
    const genCov = (cov[genId] || []).map(norm);
    const changeRelevant = genCov.includes(gapCovFile);
    rows.push({ tag: gapT, route, gap_file: gapCovFile, arm: 'diff', signals: signals.length, executable, change_relevant: changeRelevant });
    console.log(`${gapT} ${route} [diff]:   executable=${executable} change_relevant=${changeRelevant} (signals=${signals.length})`);
    fs.rmSync(specAbs, { force: true });

    // --- arm: no-diff baseline (stub returns fallback=diff spec; real LLM
    //     produces its own, deliberately uninformed of the change) ---
    const nodiffPrompt = buildPromptNoDiff({ appName: 'demo-app' });
    const nodiffSpec = await client.complete(nodiffPrompt, { fallback: spec });
    const ndFile = `_gen_nodiff_${stem}.spec.ts`;
    const ndAbs = path.join(WORK, 'tests', ndFile);
    fs.writeFileSync(ndAbs, nodiffSpec);
    const ndRun = runSuite(`cov/gen/${gapT}_nodiff`);
    const ndCov = loadCov(ndRun.covDir);
    const ndFailed = parseFailed(ndRun.report);
    const ndId = Object.keys(ndCov)[0] || '';
    const ndExec = !!ndId && !ndFailed.has(ndId);
    const ndRel = (ndCov[ndId] || []).map(norm).includes(gapCovFile);
    rows.push({ tag: gapT, route, gap_file: gapCovFile, arm: 'nodiff', executable: ndExec, change_relevant: ndRel });
    console.log(`${gapT} ${route} [nodiff]: executable=${ndExec} change_relevant=${ndRel}`);
    fs.rmSync(ndAbs, { force: true });

    // both arms emitted for blinded human annotation, WITH the generated spec.
    toAnnotate.push({ tag: gapT, route, gap_file: gapCovFile, arm: 'diff', spec });
    toAnnotate.push({ tag: gapT, route, gap_file: gapCovFile, arm: 'nodiff', spec: nodiffSpec });
  }

  checkout(manifest[manifest.length - 1].tag);

  // --- per-arm summary ---
  const byArm = (arm) => rows.filter((r) => r.arm === arm);
  const rate = (arr, k) => arr.length ? +(arr.filter((r) => r[k]).length / arr.length).toFixed(4) : 0;
  const summary = {};
  for (const arm of ['diff', 'nodiff']) {
    const a = byArm(arm);
    summary[arm] = { n: a.length, execRate: rate(a, 'executable'), relRate: rate(a, 'change_relevant') };
  }
  fs.writeFileSync(path.join(OUT, 'rq2_results.json'),
    JSON.stringify({ provider: client.provider, summary, rows }, null, 2));

  // --- blinded annotation sheet + unblinding key (seeded stable shuffle) ---
  let s = 1234; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const blinded = toAnnotate.map((r, i) => ({ case_id: `c${i}`, ...r })).sort(() => rnd() - 0.5);
  fs.writeFileSync(path.join(OUT, 'rq2_to_annotate.jsonl'),
    blinded.map((r) => JSON.stringify({ case_id: r.case_id, route: r.route, gap_file: r.gap_file, spec: r.spec })).join('\n') + '\n');
  fs.writeFileSync(path.join(OUT, 'rq2_unblind.json'),
    JSON.stringify(Object.fromEntries(blinded.map((r) => [r.case_id, r.arm])), null, 2));

  const md = [
    `# RQ2: Two-arm Gap Generation (provider=${client.provider})`, '',
    '| arm | n | executable-rate | change-relevant-rate |', '|---|---|---|---|',
    ...['diff', 'nodiff'].map((arm) => `| ${arm} | ${summary[arm].n} | ${summary[arm].execRate} | ${summary[arm].relRate} |`),
    '',
    `- semantic-validity: NA (needs human/LLM judge; blinded candidates in rq2_to_annotate.jsonl, key in rq2_unblind.json)`,
    `- core claim: the diff-constrained arm should reach a higher change-relevant-rate than the no-diff baseline.`,
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'rq2_results.md'), md + '\n');
  console.log('\n' + md);
}

main();
