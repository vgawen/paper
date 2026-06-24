// RQ3 driver: for each break commit, classify staleness, repair the failing
// selected test, re-run, and report TargetedSetUsability before vs after.
import fs from 'node:fs';
import path from 'node:path';
import { WORK, OUT, checkout, readManifest, runSuite, parseFailed, git, ensureOut } from './lib.mjs';
import { repair, signalMap, textSegMap } from '../pipeline/src/repair.mjs';
import { classify } from '../pipeline/src/staleness.mjs';
import { targetedSetUsability } from '../pipeline/src/metrics.mjs';
import { createClient } from '../pipeline/src/llm/client.mjs';

const BREAK = new Set(['locator_break', 'assertion_break']);

// LLM repair arm: hand the broken spec + the application old/new source slices
// (NO new-version test, NO ground-truth locator) and ask for a repaired spec.
function buildRepairPrompt(origSpec, oldCode, newCode) {
  return [
    'A Playwright test below broke after a UI change in the application source.',
    'Repair ONLY the broken locators/assertions so it passes on the new version.',
    'Output ONLY the full corrected TypeScript test (import from "./fixtures").',
    '--- BROKEN TEST ---', origSpec.slice(0, 3000),
    '--- APP SOURCE (old) ---', (oldCode || '').slice(0, 3000),
    '--- APP SOURCE (new) ---', (newCode || '').slice(0, 3000),
  ].join('\n');
}

function rq1Rows() {
  return fs.readFileSync(path.join(OUT, 'rq1_dataset.jsonl'), 'utf8')
    .trim().split('\n').map((l) => JSON.parse(l));
}
const refIds = (spec) => [...spec.matchAll(/getByTestId\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);

function specPassed(report, specFile, title) {
  const failed = parseFailed(report);
  return !failed.has(`${specFile} > ${title}`);
}

async function main() {
  ensureOut();
  const manifest = readManifest();
  const dataset = rq1Rows();
  const byTag = Object.fromEntries(dataset.map((r) => [r.tag, r]));
  const client = createClient();
  const rows = [];

  for (let i = 1; i < manifest.length; i++) {
    const m = manifest[i];
    if (!BREAK.has(m.type)) continue;
    const prevT = manifest[i - 1].tag, newT = m.tag;
    const row = byTag[newT];
    const changed = row.changed_files.filter((f) => f.startsWith('src/') && f !== 'src/main.js');
    const stem = path.basename(changed[0]).replace(/\.js$/, '');
    const srcPath = `app/public/src/${stem}.js`;
    const specRel = `tests/${stem}.spec.ts`;

    const oldCode = git(`show ${prevT}:${srcPath}`);
    checkout(newT);
    const newCode = git(`show ${newT}:${srcPath}`);
    const origSpec = git(`show ${newT}:${specRel}`);

    const sm = signalMap(oldCode, newCode);
    const tm = textSegMap(oldCode, newCode);
    const klass = classify({ sigMap: sm, segMap: tm, referencedIds: refIds(origSpec) });

    // title from spec
    const title = (origSpec.match(/test\(['"]([^'"]+)['"]/) || [])[1] || '';
    const selectedAffected = row.selected.filter((t) => row.affected.includes(t));

    // before repair (spec as-is on newT)
    const before = runSuite(`cov/rep/${newT}_before`, specRel);
    const beforePass = specPassed(before.report, `${stem}.spec.ts`, title);

    // rule arm: apply deterministic repair
    const rep = repair(origSpec, oldCode, newCode);
    fs.writeFileSync(path.join(WORK, specRel), rep.text);
    const after = runSuite(`cov/rep/${newT}_after`, specRel);
    const afterPass = specPassed(after.report, `${stem}.spec.ts`, title);
    git(`checkout -- ${specRel}`);

    // LLM arm: only when a real provider is configured (stub returns fallback
    // = the broken spec, so it stays at before_pass and never inflates results).
    let afterPassLlm = null;
    if (client.provider !== 'stub') {
      const llmSpec = await client.complete(buildRepairPrompt(origSpec, oldCode, newCode), { fallback: origSpec });
      fs.writeFileSync(path.join(WORK, specRel), llmSpec || origSpec);
      const afterLlm = runSuite(`cov/rep/${newT}_after_llm`, specRel);
      afterPassLlm = specPassed(afterLlm.report, `${stem}.spec.ts`, title);
      git(`checkout -- ${specRel}`);
    }

    const usaBefore = targetedSetUsability({ selectedAffected, selectedPass: beforePass ? 1 : 0, repairedPass: 0 });
    const usaAfter = targetedSetUsability({
      selectedAffected,
      selectedPass: beforePass ? 1 : 0,
      repairedPass: !beforePass && afterPass ? 1 : 0,
    });

    rows.push({ tag: newT, type: m.type, target: `${stem}.spec.ts`, staleness: klass, edits: rep.edits,
      before_pass: beforePass, after_pass: afterPass, after_pass_llm: afterPassLlm,
      usability_before: usaBefore, usability_after: usaAfter });
    console.log(`${newT} [${m.type}] ${stem}.spec staleness=${klass} before=${beforePass} after(rule)=${afterPass}` +
      (afterPassLlm === null ? '' : ` after(llm)=${afterPassLlm}`) +
      ` usability ${usaBefore}->${usaAfter} edits=${JSON.stringify(rep.edits)}`);
  }

  checkout(manifest[manifest.length - 1].tag);

  const n = rows.length;
  const repaired = rows.filter((r) => !r.before_pass && r.after_pass).length;
  const repairRateRule = n ? +(repaired / n).toFixed(4) : 0;
  // LLM arm only counted on transitions actually exercised by the LLM
  const llmRows = rows.filter((r) => r.after_pass_llm !== null);
  const repairedLlm = llmRows.filter((r) => !r.before_pass && r.after_pass_llm).length;
  const repairRateLlm = llmRows.length ? +(repairedLlm / llmRows.length).toFixed(4) : null;

  // staleness-classification annotation sheet (model label vs two human labels);
  // score later via cohenKappa over the (human1,human2) pairs and model agreement.
  const stCsv = ['tag,target,model_label,human1,human2',
    ...rows.map((r) => `${r.tag},${r.target},${r.staleness},,`)].join('\n');
  fs.writeFileSync(path.join(OUT, 'rq3_staleness_to_annotate.csv'), stCsv + '\n');

  const md = [
    `# RQ3: Repair of Broken Selected Tests (provider=${client.provider}, n=${n})`, '',
    `- repair success-rate (rule): ${repairRateRule} (${repaired}/${n})`,
    `- repair success-rate (LLM): ${repairRateLlm === null ? 'NA (stub; set an API key)' : `${repairRateLlm} (${repairedLlm}/${llmRows.length})`}`,
    `- mean TargetedSetUsability: before ${avg(rows, 'usability_before')} -> after ${avg(rows, 'usability_after')}`,
    `- staleness-classification kappa: pending human labels (see out/rq3_staleness_to_annotate.csv)`,
    '',
    '| tag | type | target | staleness | before | after(rule) | after(llm) | usability_before | usability_after |',
    '|---|---|---|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.tag} | ${r.type} | ${r.target} | ${r.staleness} | ${r.before_pass} | ${r.after_pass} | ${r.after_pass_llm === null ? 'NA' : r.after_pass_llm} | ${r.usability_before} | ${r.usability_after} |`),
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'rq3_results.md'), md + '\n');
  fs.writeFileSync(path.join(OUT, 'rq3_results.json'),
    JSON.stringify({ provider: client.provider, n, repaired, repair_rate_rule: repairRateRule,
      repair_rate_llm: repairRateLlm, llm_n: llmRows.length, rows }, null, 2));
  console.log('\n' + md);
}
function avg(rows, k) { return rows.length ? +(rows.reduce((s, r) => s + r[k], 0) / rows.length).toFixed(4) : 0; }

main();
