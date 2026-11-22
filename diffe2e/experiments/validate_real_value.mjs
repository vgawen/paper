// Demonstrate the graph's precision layers on a real repo (static, no test run):
//   - route -> component mapping (route-level attribution)
//   - value-reference edges: variables read by FEW functions (vs file-level = all functions in file)
import fs from 'node:fs';
import path from 'node:path';
import { Graph } from '../pipeline/src/graph/graph.mjs';
import { discoverWorkspace, collectSrc, buildPaths } from '../pipeline/src/graph/workspace.mjs';

const repoDir = process.argv[2] || 'real/actual';
const srcGlob = process.argv[3] || 'packages/desktop-client/src';

function svelteScript(code) {
  const out = [];
  const re = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g;
  let m; while ((m = re.exec(code))) out.push(m[1]);
  return out.join('\n');
}

const files = collectSrc(repoDir, srcGlob);
// include workspace packages too (for cross-package references)
const pkgs = discoverWorkspace(repoDir);
for (const p of pkgs) if (p.src !== srcGlob) files.push(...collectSrc(repoDir, p.src));

const graph = Graph.build(files.map((f) => ({ path: f.path, code: f.path.endsWith('.svelte') ? svelteScript(f.code) : f.code }))).toJSON();

// routes -> components
const routes = graph.nodes.filter((n) => n.kind === 'route');
const renders = graph.edges.filter((e) => e.kind === 'renders');
console.log(`files=${files.length}  nodes=${graph.nodes.length}  edges=${graph.edges.length}`);
console.log(`routes=${routes.length}  renders=${renders.length}`);
console.log('routes -> component:');
for (const r of routes) {
  const rd = renders.find((e) => e.source === r.id);
  console.log(`  ${r.name} -> ${rd ? rd.target.split('/').pop().replace('::', '::') : '(none)'}`);
}

// value-reference: variables -> functions that read them
const refs = graph.edges.filter((e) => e.kind === 'references');
console.log(`\nvalue-reference edges (function -> variable): ${refs.length}`);
const readersOf = new Map(); // variable id -> set of function ids
for (const e of refs) { if (!readersOf.has(e.target)) readersOf.set(e.target, new Set()); readersOf.get(e.target).add(e.source); }

// find variables with FEW readers in files with MANY functions (where value-reference beats file-level)
const fnByFile = new Map();
for (const n of graph.nodes) if (n.kind === 'function' || n.kind === 'method') {
  if (!fnByFile.has(n.file)) fnByFile.set(n.file, 0);
  fnByFile.set(n.file, fnByFile.get(n.file) + 1);
}
const winners = [];
for (const [varId, readers] of readersOf) {
  const v = graph.nodes.find((n) => n.id === varId);
  if (!v) continue;
  const fileFns = fnByFile.get(v.file) || 0;
  if (fileFns >= 5 && readers.size < fileFns) {
    winners.push({ file: v.file, var: v.name, readers: readers.size, fileFns });
  }
}
winners.sort((a, b) => a.readers - b.readers);
console.log(`\nvalue-reference beats file-level (variable read by ${winners.length ? 'few' : 'no'} functions vs file has many):`);
for (const w of winners.slice(0, 15)) {
  console.log(`  ${w.file.split('/').pop()}::${w.var}  read-by=${w.readers}/${w.fileFns} functions`);
}
