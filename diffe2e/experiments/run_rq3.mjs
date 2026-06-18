// RQ3 driver: for each break commit, classify staleness, repair the failing
// selected test, re-run, and report TargetedSetUsability before vs after.
import fs from 'node:fs';
import path from 'node:path';
import { WORK, OUT, checkout, readManifest, runSuite, parseFailed, git, ensureOut } from './lib.mjs';
import { repair, signalMap, textSegMap } from '../pipeline/src/repair.mjs';
import { classify } from '../pipeline/src/staleness.mjs';
import { targetedSetUsability } from '../pipeline/src/metrics.mjs';

const BREAK = new Set(['locator_break', 'assertion_break']);

function rq1Rows() {
  return fs.readFileSync(path.join(OUT, 'rq1_dataset.jsonl'), 'utf8')
    .trim().split('\n').map((l) => JSON.parse(l));
}
const refIds = (spec) => [...spec.matchAll(/getByTestId\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);

function specPassed(report, specFile, title) {
  const failed = parseFailed(report);
  return !failed.has(`${specFile} > ${title}`);
}

function main() {
  ensureOut();
  const manifest = readManifest();
  const dataset = rq1Rows();
  const byTag = Object.fromEntries(dataset.map((r) => [r.tag, r]));
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

    // apply repair
    const rep = repair(origSpec, oldCode, newCode);
    fs.writeFileSync(path.join(WORK, specRel), rep.text);
    const after = runSuite(`cov/rep/${newT}_after`, specRel);
    const afterPass = specPassed(after.report, `${stem}.spec.ts`, title);

    // restore original spec in work tree
    git(`checkout -- ${specRel}`);

    const usaBefore = targetedSetUsability({ selectedAffected, selectedPass: beforePass ? 1 : 0, repairedPass: 0 });
    const usaAfter = targetedSetUsability({
      selectedAffected,
      selectedPass: beforePass ? 1 : 0,
      repairedPass: !beforePass && afterPass ? 1 : 0,
    });

    rows.push({ tag: newT, type: m.type, target: `${stem}.spec.ts`, staleness: klass, edits: rep.edits,
      before_pass: beforePass, after_pass: afterPass, usability_before: usaBefore, usability_after: usaAfter });
    console.log(`${newT} [${m.type}] ${stem}.spec staleness=${klass} before=${beforePass} after=${afterPass} ` +
      `usability ${usaBefore}->${usaAfter} edits=${JSON.stringify(rep.edits)}`);
  }

  checkout(manifest[manifest.length - 1].tag);

  const n = rows.length;
  const repaired = rows.filter((r) => !r.before_pass && r.after_pass).length;
  const md = [
    `# RQ3: Repair of Broken Selected Tests (n=${n})`, '',
    `- repair success-rate: ${n ? +(repaired / n).toFixed(4) : 0} (${repaired}/${n})`,
    `- mean TargetedSetUsability: before ${avg(rows, 'usability_before')} -> after ${avg(rows, 'usability_after')}`,
    `- ReproBreak external dataset: SKIPPED (no REPRO_BREAK_URL/credentials configured; adapter ready in realproj/)`,
    '',
    '| tag | type | target | staleness | before | after | usability_before | usability_after |',
    '|---|---|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.tag} | ${r.type} | ${r.target} | ${r.staleness} | ${r.before_pass} | ${r.after_pass} | ${r.usability_before} | ${r.usability_after} |`),
  ].join('\n');
  fs.writeFileSync(path.join(OUT, 'rq3_results.md'), md + '\n');
  fs.writeFileSync(path.join(OUT, 'rq3_results.json'), JSON.stringify({ n, repaired, rows }, null, 2));
  console.log('\n' + md);
}
function avg(rows, k) { return rows.length ? +(rows.reduce((s, r) => s + r[k], 0) / rows.length).toFixed(4) : 0; }

main();
