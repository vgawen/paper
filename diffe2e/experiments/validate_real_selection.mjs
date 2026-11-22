// Runtime selector validation on a real repo: build the graph with function-level
// coverage (executes), and show that function-level + value-reference selection is
// finer than file-level for concrete changes (variables read by few functions).
import fs from 'node:fs';
import path from 'node:path';
import { Graph } from '../pipeline/src/graph/graph.mjs';
import { addTestEdges } from '../pipeline/src/graph/testEdges.mjs';
import { buildReaders } from '../pipeline/src/graph/select.mjs';
import { discoverWorkspace, collectSrc } from '../pipeline/src/graph/workspace.mjs';
import { mapLeafRelToRepoRel, srcLeaf } from '../pipeline/src/covinject.mjs';

const repoDir = process.argv[2] || 'real/actual';
const srcGlob = process.argv[3] || 'packages/desktop-client/src';
const covDir = process.argv[4] || 'real/actual/packages/desktop-client/cov_pertest';
const leaf = srcLeaf(srcGlob);

function svelteScript(code) {
  const out = [];
  const re = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g;
  let m; while ((m = re.exec(code))) out.push(m[1]);
  return out.join('\n');
}

// 1. static graph (code + routes + references)
const files = collectSrc(repoDir, srcGlob);
const pkgs = discoverWorkspace(repoDir);
for (const p of pkgs) if (p.src !== srcGlob) files.push(...collectSrc(repoDir, p.src));
const raw = Graph.build(files.map((f) => ({ path: f.path, code: f.path.endsWith('.svelte') ? svelteScript(f.code) : f.code }))).toJSON();

// 2. test evidence from function-level coverage (leaf-relative -> repo-relative)
const evidence = [];
for (const f of fs.readdirSync(covDir)) {
  if (!f.endsWith('.json')) continue;
  const o = JSON.parse(fs.readFileSync(path.join(covDir, f), 'utf8'));
  const funcs = {};
  for (const [k, names] of Object.entries(o.funcs || {})) funcs[mapLeafRelToRepoRel(k, srcGlob)] = names;
  evidence.push({ test: o.test, funcs });
}

const graph = addTestEdges(raw, evidence);
const { readers } = buildReaders(graph);

// test -> set of files it touches (file-level coverage)
const testFiles = new Map();
for (const e of graph.edges) {
  if (e.kind !== 'executes') continue;
  const target = graph.nodes.find((n) => n.id === e.target);
  if (!target || !target.file) continue;
  if (!testFiles.has(e.source)) testFiles.set(e.source, new Set());
  testFiles.get(e.source).add(target.file);
}

// tests executing a given function id
function testsExecuting(fnId) {
  const s = new Set();
  for (const e of graph.edges) if (e.kind === 'executes' && e.target === fnId) s.add(e.source);
  return s;
}

console.log(`tests=${evidence.length}  nodes=${graph.nodes.length}  edges=${graph.edges.length}  references=${graph.edges.filter((e) => e.kind === 'references').length}`);

// 3. value-reference beats file-level: variables read by FEW functions, in files with MANY functions
const fnByFile = new Map();
for (const n of graph.nodes) if (n.kind === 'function' || n.kind === 'method') {
  fnByFile.set(n.file, (fnByFile.get(n.file) || 0) + 1);
}

const rows = [];
for (const [varId, fnIds] of readers) {
  const v = graph.nodes.find((n) => n.id === varId);
  if (!v || !v.file) continue;
  const fileFns = fnByFile.get(v.file) || 0;
  if (fileFns < 3) continue; // only meaningful in files with several functions
  const valueRefTests = new Set();
  for (const fn of fnIds) for (const t of testsExecuting(fn)) valueRefTests.add(t);
  const fileLevelTests = new Set();
  for (const [t, files] of testFiles) if (files.has(v.file)) fileLevelTests.add(t);
  if (fileLevelTests.size >= 2 && valueRefTests.size < fileLevelTests.size) {
    rows.push({ var: `${v.file.split('/').pop()}::${v.name}`, readers: fnIds.size, fileFns, valueRef: valueRefTests.size, fileLevel: fileLevelTests.size });
  }
}
rows.sort((a, b) => (b.fileLevel - b.valueRef) - (a.fileLevel - a.valueRef));

console.log(`\nvalue-reference vs file-level (tests selected for a variable change):`);
console.log(`${'variable'.padEnd(42)} ${'readers'.padStart(7)} ${'fileFns'.padStart(8)} ${'valueRef'.padStart(8)} ${'fileLevel'.padStart(9)}`);
for (const r of rows.slice(0, 20)) {
  console.log(`  ${r.var.padEnd(40)} ${String(r.readers).padStart(7)} ${String(r.fileFns).padStart(8)} ${String(r.valueRef).padStart(8)} ${String(r.fileLevel).padStart(9)}`);
}
