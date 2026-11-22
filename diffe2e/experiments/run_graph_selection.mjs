// RQ1 selection via the test-code graph (controlled subject).
//
// For each transition, build the graph at V_old (code + routes + executes/navigates
// test evidence), attribute the diff to changed functions/routes, and select tests
// reachable via `executes` (test -> changed function) or `navigates` (test -> changed
// route). Compare Reduction + non-circular recall (SafetyEmp) vs file-level coverage.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildTestCodeGraph } from '../pipeline/src/graph/index.mjs';
import { changedEntitiesFromCode } from '../pipeline/src/astEntities.mjs';
import { parseUnifiedDiff } from '../pipeline/src/diff.mjs';
import { nodeId } from '../pipeline/src/graph/extract.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const WORK = path.join(here, '..', 'subject', 'work');
const OUT = path.join(here, 'out');
const git = (a) => { try { return execSync(`git ${a}`, { cwd: WORK, stdio: 'pipe' }).toString(); } catch { return ''; } };

const manifest = JSON.parse(fs.readFileSync(path.join(here, '..', 'subject', 'history', 'manifest.json'), 'utf8'));

// frozen oracle + coverage_only baseline
const frozen = {};
for (const line of fs.readFileSync(path.join(OUT, 'rq1_dataset.jsonl'), 'utf8').trim().split('\n')) {
  const r = JSON.parse(line);
  frozen[r.tag] = { affected_obs: r.affected_obs || [], full: r.full_suite, cov_reduction: r.metrics.coverage_only.Reduction };
}

function filesAt(tag) {
  return git(`ls-tree -r --name-only ${tag} app/public/src`).split('\n').map((s) => s.trim()).filter(Boolean)
    .map((f) => ({ path: f.replace('app/public/', ''), code: git(`show ${tag}:${f}`) }));
}

function loadEvidence(tag) {
  const dir = path.join(WORK, 'cov', 'a2func', 'vold', tag);
  const ev = [];
  if (!fs.existsSync(dir)) return ev;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    const o = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const funcs = {};
    for (const [k, names] of Object.entries(o.funcs || {})) funcs[k.replace(/^\/+/, '')] = names;
    ev.push({ test: o.test, funcs, files: (o.files || []).map((p) => p.replace(/^\/+/, '')) });
  }
  return ev;
}

// changed function/route node ids + files with module-level variable changes
function changedEntities(oldT, newT) {
  const parsed = parseUnifiedDiff(git(`diff ${oldT} ${newT} -- app/public/src`));
  const fns = new Set();
  const vars = new Set();
  const routes = new Set();
  for (const repoF of parsed.files) {
    const f = repoF.replace('app/public/', '');
    const newCode = git(`show ${newT}:${repoF}`);
    const lines = parsed.byFile[repoF] ? [...parsed.byFile[repoF].added, ...parsed.byFile[repoF].removed] : [];
    for (const e of changedEntitiesFromCode(newCode, lines, f)) {
      if (e.kind === 'variable') { vars.add(nodeId(f, e.name)); continue; }
      if (e.kind === 'route') { routes.add(nodeId(f, `route:${e.name}`)); continue; }
      fns.add(nodeId(f, e.name));
    }
  }
  return { fns, vars, routes };
}

function selectByGraph(graph, changed) {
  // value-reference: variable -> functions that reference it
  const readers = new Map();
  const routeTableVars = new Set();
  for (const e of graph.edges) {
    if (e.kind === 'references') {
      const varNode = graph.nodes.find((n) => n.id === e.target);
      if (varNode && varNode.isRouteTable) { routeTableVars.add(e.target); continue; } // handled by route-level
      if (!readers.has(e.target)) readers.set(e.target, new Set());
      readers.get(e.target).add(e.source);
    }
  }
  const affectedFns = new Set(changed.fns);
  for (const v of changed.vars) for (const fn of readers.get(v) || []) affectedFns.add(fn);

  const sel = new Set();
  for (const e of graph.edges) {
    if (e.kind === 'executes' && affectedFns.has(e.target)) sel.add(e.source);
    if (e.kind === 'navigates' && changed.routes.has(e.target)) sel.add(e.source);
  }
  const varUnresolved = [...changed.vars].filter((v) => !readers.has(v) && !routeTableVars.has(v));
  return { sel, varUnresolved };
}

// diff routes between V_old and V_new: ADD / REMOVE / MODIFY (renders target changed)
function routeDiff(graphOld, graphNew) {
  const of = new Map(), nf = new Map();
  for (const n of graphOld.nodes) if (n.kind === 'route') {
    const r = graphOld.edges.find((e) => e.kind === 'renders' && e.source === n.id);
    of.set(n.name, r ? r.target : null);
  }
  for (const n of graphNew.nodes) if (n.kind === 'route') {
    const r = graphNew.edges.find((e) => e.kind === 'renders' && e.source === n.id);
    nf.set(n.name, r ? r.target : null);
  }
  const added = [...nf.keys()].filter((r) => !of.has(r));
  const removed = [...of.keys()].filter((r) => !nf.has(r));
  const modified = [...nf.keys()].filter((r) => of.has(r) && of.get(r) !== nf.get(r));
  return { added, removed, modified };
}

// route-level selection: only tests navigating to a REMOVED/MODIFIED route are
// affected (ADD is new, no test visits it -> 0 tests)
function selectRoutes(graph, removed, modified) {
  const sel = new Set();
  const changed = new Set([...removed, ...modified]);
  if (!changed.size) return sel;
  for (const e of graph.edges) {
    if (e.kind !== 'navigates') continue;
    const rn = graph.nodes.find((n) => n.id === e.target);
    if (rn && changed.has(rn.name)) sel.add(e.source);
  }
  return sel;
}

const rows = [];
for (let i = 1; i < manifest.length; i++) {
  const o = manifest[i - 1].tag, n = manifest[i].tag;
  const files = filesAt(o);
  const evidence = loadEvidence(n);
  const graph = buildTestCodeGraph(files, evidence);
  const changed = changedEntities(o, n);
  const { sel, varUnresolved } = selectByGraph(graph, changed);
  const { added, removed, modified } = routeDiff(graph, buildTestCodeGraph(filesAt(n), []));
  for (const t of selectRoutes(graph, removed, modified)) sel.add(t);
  const fr = frozen[n];
  const reduction = 1 - sel.size / fr.full;
  const missed = fr.affected_obs.filter((t) => !sel.has(`test::${t}`));
  rows.push({ tag: n, sel: sel.size, full: fr.full, reduction: +reduction.toFixed(4), cov: fr.cov_reduction, missed: missed.length, added: added.length, removed: removed.length, modified: modified.length });
  console.log(`${n} sel=${sel.size}/${fr.full} red=${reduction.toFixed(3)} cov=${fr.cov_reduction.toFixed(3)} missed=${missed.length} (route +${added.length}/-${removed.length}/~${modified.length})`);
}

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
console.log(`\n=== summary ===`);
console.log(`graph-selection Reduction: ${mean(rows.map((r) => r.reduction)).toFixed(4)}`);
console.log(`coverage_only Reduction  : ${mean(rows.map((r) => r.cov)).toFixed(4)}`);
console.log(`total recall misses       : ${rows.reduce((s, r) => s + r.missed, 0)}`);
