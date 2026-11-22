// Verify incremental graph update == full rebuild on a real repo's git history.
// Walks the last N commits touching <srcGlob>, building full each time and
// incrementally re-extracting only changed files; asserts the two graphs agree.
//
// Usage: node experiments/verify_real_incremental.mjs <repoDir> <srcGlob> [N]
import { execSync } from 'node:child_process';
import path from 'node:path';
import { Graph } from '../pipeline/src/graph/graph.mjs';

const repoDir = process.argv[2] || 'real/mermaid-live-editor';
const srcGlob = process.argv[3] || 'src';
const N = parseInt(process.argv[4] || '8', 10);

const git = (args) => { try { return execSync(`git ${args}`, { cwd: repoDir, stdio: 'pipe' }).toString(); } catch { return ''; } };

function svelteScript(code) {
  const out = [];
  const re = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(code))) out.push(m[1]);
  return out.join('\n');
}

const filesAt = (c) => git(`ls-tree -r --name-only ${c} -- ${srcGlob}`).split('\n').map((s) => s.trim()).filter((f) => f && /\.(ts|tsx|js|jsx|mjs|cjs|svelte)$/.test(f));
const contentAt = (c, f) => { const code = git(`show ${c}:${f}`); return f.endsWith('.svelte') ? svelteScript(code) : code; };
const existsAt = (c, f) => git(`ls-tree ${c} -- ${f}`).trim() !== '';

// commits touching srcGlob, oldest first
const commits = git(`log --format=%H -- ${srcGlob}`).split('\n').map((s) => s.trim()).filter(Boolean).slice(0, N).reverse();
if (commits.length < 2) { console.error('not enough commits'); process.exit(1); }

const full = commits.map((c) => Graph.build(filesAt(c).map((f) => ({ path: f, code: contentAt(c, f) }))));

const inc = new Graph();
for (const f of filesAt(commits[0])) inc.addFile(f, contentAt(commits[0], f));
const results = [{ c: commits[0].slice(0, 7), ok: inc.equals(full[0]) }];

for (let i = 1; i < commits.length; i++) {
  const prev = commits[i - 1], cur = commits[i];
  const changed = git(`diff --name-only ${prev} ${cur} -- ${srcGlob}`).split('\n').map((s) => s.trim()).filter((f) => f && /\.(ts|tsx|js|jsx|mjs|cjs|svelte)$/.test(f));
  for (const f of changed) {
    if (existsAt(cur, f)) inc.addFile(f, contentAt(cur, f));
    else inc.removeFile(f);
  }
  results.push({ c: cur.slice(0, 7), ok: inc.equals(full[i]), changed: changed.length });
}

const allOk = results.every((r) => r.ok);
console.log(`incremental == full: ${allOk ? 'PASS' : 'FAIL'}  (${commits.length} commits, ${srcGlob})`);
for (const r of results) console.log(`  ${r.c}: ${r.changed ?? 'seed'} changed, ok=${r.ok}`);
console.log(`final graph: ${inc.nodeCount()} nodes, ${inc.edgeCount()} edges`);
