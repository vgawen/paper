// RQ1 selection via the test-code graph (controlled subject).
//
// For each transition: build the graph at V_old (code + routes + executes/navigates),
// attribute the diff (functions / variables / routes / config), and select affected
// tests via the four-layer selector + config fallback (see select.mjs). Compare
// Reduction + non-circular recall (SafetyEmp) vs file-level coverage.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildTestCodeGraph } from '../pipeline/src/graph/index.mjs';
import { changedEntitiesFromCode } from '../pipeline/src/astEntities.mjs';
import { parseUnifiedDiff } from '../pipeline/src/diff.mjs';
import { nodeId } from '../pipeline/src/graph/extract.mjs';
import { selectAffected, routeDiff } from '../pipeline/src/graph/select.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const WORK = path.join(here, '..', 'subject', 'work');
const OUT = path.join(here, 'out');
const git = (a) => { try { return execSync(`git ${a}`, { cwd: WORK, stdio: 'pipe' }).toString(); } catch { return ''; } };

const manifest = JSON.parse(fs.readFileSync(path.join(here, '..', 'subject', 'history', 'manifest.json'), 'utf8'));

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
    ev.push({ test: o.test, funcs });
  }
  return ev;
}

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

// non-app, non-test file changes (config / env / build) -> global implicit dependency
function changedConfigFiles(oldT, newT) {
  return git(`diff --name-only ${oldT} ${newT}`).split('\n').map((s) => s.trim()).filter(Boolean)
    .filter((f) => !f.startsWith('app/public/src/') && !f.startsWith('tests/'));
}

const rows = [];
for (let i = 1; i < manifest.length; i++) {
  const o = manifest[i - 1].tag, n = manifest[i].tag;
  const graph = buildTestCodeGraph(filesAt(o), loadEvidence(n));
  const staticNew = buildTestCodeGraph(filesAt(n), []);
  const changed = changedEntities(o, n);
  const config = changedConfigFiles(o, n);
  const allTests = graph.nodes.filter((x) => x.kind === 'test').map((x) => x.id);
  const sel = selectAffected(graph, {
    changedFns: changed.fns, changedVars: changed.vars, changedRoutes: changed.routes,
    routeChanges: routeDiff(graph, staticNew),
    configChanged: config.length > 0,
    allTests,
  });
  const fr = frozen[n];
  const reduction = 1 - sel.size / fr.full;
  const missed = fr.affected_obs.filter((t) => !sel.has(`test::${t}`));
  rows.push({ tag: n, sel: sel.size, full: fr.full, reduction: +reduction.toFixed(4), cov: fr.cov_reduction, missed: missed.length });
  console.log(`${n} sel=${sel.size}/${fr.full} red=${reduction.toFixed(3)} cov=${fr.cov_reduction.toFixed(3)} missed=${missed.length}${config.length ? ' [CONFIG->all]' : ''}`);
}

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
console.log(`\n=== summary ===`);
console.log(`graph-selection Reduction: ${mean(rows.map((r) => r.reduction)).toFixed(4)}`);
console.log(`coverage_only Reduction  : ${mean(rows.map((r) => r.cov)).toFixed(4)}`);
console.log(`total recall misses       : ${rows.reduce((s, r) => s + r.missed, 0)}`);
