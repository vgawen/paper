// Verify Milestone-1: incremental graph update == full rebuild.
//
// Walks the controlled subject's git history (subject/work, c00..c24):
//   - full rebuild at every tag;
//   - incremental: build c00, then apply each diff by re-extracting ONLY the
//     changed files (remove+add for deleted, add for added/modified);
//   - assert the two graphs are identical at every tag.
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Graph } from '../pipeline/src/graph/graph.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const WORK = path.join(here, '..', 'subject', 'work');
const SRC = 'app/public/src';
const git = (args) => { try { return execSync(`git ${args}`, { cwd: WORK, stdio: 'pipe' }).toString(); } catch { return ''; } };

const filesAt = (tag) => git(`ls-tree -r --name-only ${tag} ${SRC}`).split('\n').map((s) => s.trim()).filter(Boolean);
const contentAt = (tag, f) => git(`show ${tag}:${f}`);
const existsAt = (tag, f) => git(`ls-tree ${tag} -- ${f}`).trim() !== '';
const changedFiles = (a, b) => git(`diff --name-only ${a} ${b} -- ${SRC}`).split('\n').map((s) => s.trim()).filter(Boolean);

const tags = git('tag').split('\n').map((s) => s.trim()).filter(Boolean)
  .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));

if (tags.length < 2) {
  console.error('no tags in subject/work — run `node subject/history/seed.mjs` first');
  process.exit(1);
}

// full rebuild at every tag
const full = tags.map((t) => Graph.build(filesAt(t).map((f) => ({ path: f, code: contentAt(t, f) }))));

// incremental
const inc = new Graph();
for (const f of filesAt(tags[0])) inc.addFile(f, contentAt(tags[0], f));
const results = [{ tag: tags[0], ok: inc.equals(full[0]), changed: filesAt(tags[0]).length }];

for (let i = 1; i < tags.length; i++) {
  const prev = tags[i - 1], cur = tags[i];
  const changed = changedFiles(prev, cur);
  for (const f of changed) {
    if (existsAt(cur, f)) inc.addFile(f, contentAt(cur, f));
    else inc.removeFile(f);
  }
  results.push({ tag: cur, ok: inc.equals(full[i]), changed: changed.length });
}

const allOk = results.every((r) => r.ok);
console.log(`incremental == full rebuild: ${allOk ? 'PASS' : 'FAIL'}  (${tags.length} commits)`);
if (!allOk) {
  for (const r of results) if (!r.ok) console.log(`  MISMATCH at ${r.tag} (${r.changed} changed files)`);
}
console.log(`final graph: ${inc.nodeCount()} nodes, ${inc.edgeCount()} edges`);
for (const r of results) {
  if (r.changed) console.log(`  ${r.tag}: ${r.changed} changed file(s), ok=${r.ok}`);
}
