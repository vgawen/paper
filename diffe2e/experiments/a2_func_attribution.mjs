// A2 step-1 ablation (function-level diff attribution), reproducible verification.
//
// For each controlled-subject transition, run changedEntities (line->entity) on
// the real git diff and report which changed files have EMPTY entities (i.e. would
// be dropped from Δ by function-level diff attribution). Then recompute the mean
// Reduction from the frozen dataset, treating EMPTY-entity transitions as selected=0.
//
// Prereq: `node subject/history/seed.mjs` (generates subject/work git history).
// Run:    `node experiments/a2_func_attribution.mjs`
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseUnifiedDiff } from '../pipeline/src/diff.mjs';
import { changedEntitiesFromCode } from '../pipeline/src/astEntities.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..');
const WORK = path.join(ROOT, 'subject', 'work');
const git = (args) => { try { return execSync(`git ${args}`, { cwd: WORK, stdio: 'pipe' }).toString(); } catch { return ''; } };
const show = (tag, p) => { try { return git(`show ${tag}:${p}`); } catch { return ''; } };

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'subject', 'history', 'manifest.json'), 'utf8'));

// changed files (src/*.js namespace) + EMPTY-entity flags, per transition
const dropped = new Set();
console.log('transition | changed src files -> changedEntities (EMPTY = dropped)');
for (let i = 1; i < manifest.length; i++) {
  const o = manifest[i - 1].tag, n = manifest[i].tag;
  const diff = git(`diff ${o} ${n} -- app/public/src`);
  const parsed = parseUnifiedDiff(diff);
  const files = parsed.files
    .filter((f) => f.includes('app/public/src/'))
    .map((f) => 'src/' + f.split('app/public/src/')[1]);
  const details = [];
  for (const srcF of files) {
    const repoF = 'app/public/' + srcF;
    const newCode = show(n, repoF);
    const lines = parsed.byFile[repoF] ? [...parsed.byFile[repoF].added, ...parsed.byFile[repoF].removed] : [];
    const ents = changedEntitiesFromCode(newCode, lines, srcF);
    if (!ents.length) dropped.add(n);
    details.push(`${srcF}=${ents.length ? '[' + ents.map((e) => e.name).join(',') + ']' : 'EMPTY'}`);
  }
  console.log(`${n.padEnd(4)} ${manifest[i].type.padEnd(16)} ${(files.join(',') || '(none)').padEnd(24)} ${details.join(' ; ') || '(no src change)'}`);
}

// recompute mean Reduction from frozen dataset (dropped -> selected=0 -> Reduction=1.0)
const rows = fs.readFileSync(path.join(ROOT, 'experiments', 'out', 'rq1_dataset.jsonl'), 'utf8')
  .trim().split('\n').map((l) => JSON.parse(l));
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const before = mean(rows.map((r) => r.metrics.ours.Reduction));
const after = mean(rows.map((r) => (dropped.has(r.tag) ? 1.0 : r.metrics.ours.Reduction)));

console.log('\n=== summary ===');
console.log(`dropped (EMPTY entities): [${[...dropped].sort().join(', ')}]`);
console.log(`Reduction before: ${before.toFixed(4)}`);
console.log(`Reduction after : ${after.toFixed(4)}`);
console.log(`gain: +${(after - before).toFixed(4)}`);
