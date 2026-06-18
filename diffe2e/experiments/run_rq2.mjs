// RQ2 driver: for each coverage-gap commit (new route, no test), generate a
// Playwright test, run it, and measure executable-rate + change-relevant-rate.
// Semantic validity needs a human/LLM judge -> emitted to rq2_to_annotate.jsonl.
import fs from 'node:fs';
import path from 'node:path';
import { WORK, OUT, checkout, readManifest, runSuite, loadCov, parseFailed, git, ensureOut } from './lib.mjs';
import { generateForGap } from '../pipeline/src/generate.mjs';
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

    rows.push({ tag: gapT, route, gap_file: gapCovFile, signals: signals.length, executable, change_relevant: changeRelevant });
    toAnnotate.push({ tag: gapT, route, gap_file: gapCovFile, spec });
    console.log(`${gapT} ${route}: executable=${executable} change_relevant=${changeRelevant} (signals=${signals.length})`);

    fs.rmSync(specAbs, { force: true });
  }

  checkout(manifest[manifest.length - 1].tag);

  const n = rows.length;
  const execRate = n ? +(rows.filter((r) => r.executable).length / n).toFixed(4) : 0;
  const relRate = n ? +(rows.filter((r) => r.change_relevant).length / n).toFixed(4) : 0;
  fs.writeFileSync(path.join(OUT, 'rq2_results.json'), JSON.stringify({ provider: client.provider, n, execRate, relRate, rows }, null, 2));
  fs.writeFileSync(path.join(OUT, 'rq2_to_annotate.jsonl'), toAnnotate.map((x) => JSON.stringify(x)).join('\n') + '\n');

  const md = [
    `# RQ2: Gap Generation (provider=${client.provider}, n=${n} gaps)`, '',
    `- executable-rate: ${execRate}`,
    `- change-relevant-rate: ${relRate}`,
    `- semantic-validity: NA (needs human/LLM judge; candidates in rq2_to_annotate.jsonl)`, '',
    '| tag | route | gap_file | executable | change_relevant |', '|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.tag} | ${r.route} | ${r.gap_file} | ${r.executable} | ${r.change_relevant} |`),
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'rq2_results.md'), md + '\n');
  console.log('\n' + md);
}

main();
