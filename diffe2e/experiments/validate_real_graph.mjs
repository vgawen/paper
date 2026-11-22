// Validate the test-code graph builder on a real repo: build the static graph
// (K layer + routes) over a source tree, report node/edge counts, extracted
// routes, and call-resolution accuracy. No test execution — source only.
//
// Usage: node experiments/validate_real_graph.mjs <repoDir> <srcGlob>
import fs from 'node:fs';
import path from 'node:path';
import { buildTestCodeGraph } from '../pipeline/src/graph/index.mjs';

const repoDir = process.argv[2] || 'real/mermaid-live-editor';
const srcGlob = process.argv[3] || 'src';
const root = path.join(repoDir, srcGlob);

// extract the <script> block from a Svelte SFC (quick-and-dirty, validation only)
function svelteScript(code) {
  const out = [];
  const re = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(code))) out.push(m[1]);
  return out.join('\n');
}

const files = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!e.name.startsWith('.')) walk(p); continue; }
    if (!/\.(ts|tsx|js|jsx|mjs|cjs|svelte)$/.test(e.name)) continue;
    const rel = path.relative(repoDir, p); // repo-relative (src/foo.ts)
    let code = fs.readFileSync(p, 'utf8');
    if (e.name.endsWith('.svelte')) code = svelteScript(code);
    files.push({ path: rel, code });
  }
};
walk(root);

console.log(`files: ${files.length} (under ${srcGlob})`);
const t0 = Date.now();
const g = buildTestCodeGraph(files);
console.log(`build time: ${Date.now() - t0}ms`);

const nk = {}; for (const n of g.nodes) nk[n.kind] = (nk[n.kind] || 0) + 1;
const ek = {}; for (const e of g.edges) ek[e.kind] = (ek[e.kind] || 0) + 1;
console.log(`nodes: ${g.nodes.length} ${JSON.stringify(nk)}`);
console.log(`edges: ${g.edges.length} ${JSON.stringify(ek)}`);

const routes = g.nodes.filter((n) => n.kind === 'route').map((n) => n.name);
console.log(`routes (${routes.length}): ${routes.join(', ')}`);

const resolved = g.edges.filter((e) => e.kind === 'calls' && e.resolved);
const unresolved = g.edges.filter((e) => e.kind === 'calls' && !e.resolved);
console.log(`calls: resolved=${resolved.length} unresolved=${unresolved.length}`);
