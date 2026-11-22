// Stage 4 demo: build the full test-code graph for the controlled subject at c24,
// and run three queries that the graph is supposed to answer:
//   1. which tests visit a route (route → renders → component → contains → function → executes → test)
//   2. which app functions have no test (coverage gaps)
//   3. completeness: every test's executes edges vs the functions its spec actually calls.
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Graph } from '../pipeline/src/graph/graph.mjs';
import { addTestEdges } from '../pipeline/src/graph/testEdges.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const WORK = path.join(here, '..', 'subject', 'work');
const git = (args) => { try { return execSync(`git ${args}`, { cwd: WORK, stdio: 'pipe' }).toString(); } catch { return ''; } };
const TAG = 'c24';

// --- static graph (map app/public/src/*.js -> src/*.js, the coverage namespace)
const norm = (f) => f.replace(/^app\/public\//, '');
const files = git(`ls-tree -r --name-only ${TAG} app/public/src`).split('\n').map((s) => s.trim()).filter(Boolean);
const raw = Graph.build(files.map((f) => ({ path: norm(f), code: git(`show ${TAG}:${f}`) }))).toJSON();

// --- test evidence (executes/navigates) from the A2 function-level coverage
const covDir = path.join(WORK, 'cov', 'a2func', 'vold', TAG);
const evidence = [];
for (const f of fs.readdirSync(covDir)) {
  if (!f.endsWith('.json')) continue;
  const o = JSON.parse(fs.readFileSync(path.join(covDir, f), 'utf8'));
  const funcs = {};
  for (const [k, names] of Object.entries(o.funcs || {})) funcs[k.replace(/^\/+/, '')] = names;
  evidence.push({ test: o.test, funcs });
}

const g = addTestEdges(raw, evidence);
const nodes = new Map(g.nodes.map((n) => [n.id, n]));
const bySource = new Map(); // source -> edges
for (const e of g.edges) { if (!bySource.has(e.source)) bySource.set(e.source, []); bySource.get(e.source).push(e); }

// --- query 1: which tests visit /cart?
const routeId = 'src/main.js::route:/cart';
const compFile = g.edges.find((e) => e.kind === 'renders' && e.source === routeId)?.target;
const funcs = (bySource.get(compFile) || []).filter((e) => e.kind === 'contains').map((e) => e.target);
const tests = new Set();
for (const fn of funcs) {
  for (const e of g.edges) if (e.kind === 'executes' && e.target === fn) tests.add(e.source);
}
console.log('=== Q1: tests visiting /cart ===');
for (const t of tests) console.log('  ' + t.replace('test::', ''));

// --- query 2: coverage gaps (app functions with no incoming executes edge)
const executed = new Set(g.edges.filter((e) => e.kind === 'executes').map((e) => e.target));
const gaps = g.nodes.filter((n) => (n.kind === 'function' || n.kind === 'method') && !executed.has(n.id));
console.log('\n=== Q2: app functions with no test (gaps) ===');
for (const n of gaps) console.log(`  ${n.file}::${n.name}`);

// --- query 3: completeness — every named function each spec calls is covered
console.log('\n=== Q3: per-test executes edges (test -> function) ===');
for (const t of g.nodes.filter((n) => n.kind === 'test')) {
  const exec = g.edges.filter((e) => e.kind === 'executes' && e.source === t.id).map((e) => nodes.get(e.target)?.name).join(', ');
  const nav = g.edges.filter((e) => e.kind === 'navigates' && e.source === t.id).map((e) => nodes.get(e.target)?.name).join(', ');
  console.log(`  ${t.name}\n     executes: ${exec}\n     navigates: ${nav}`);
}

console.log(`\ngraph: ${g.nodes.length} nodes, ${g.edges.length} edges`);
