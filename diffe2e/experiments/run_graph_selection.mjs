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
  const routes = new Set();
  const varFiles = new Set();
  for (const repoF of parsed.files) {
    const f = repoF.replace('app/public/', '');
    const newCode = git(`show ${newT}:${repoF}`);
    const lines = parsed.byFile[repoF] ? [...parsed.byFile[repoF].added, ...parsed.byFile[repoF].removed] : [];
    for (const e of changedEntitiesFromCode(newCode, lines, f)) {
      if (e.kind === 'variable') { varFiles.add(f); continue; } // module-level -> file-level fallback
      if (e.kind === 'route') { routes.add(nodeId(f, `route:${e.name}`)); continue; }
      fns.add(nodeId(f, e.name));
    }
  }
  return { fns, routes, varFiles };
}

function selectByGraph(graph, evidence, changed) {
  const sel = new Set();
  for (const e of graph.edges) {
    if (e.kind === 'executes' && changed.fns.has(e.target)) sel.add(e.source);
    if (e.kind === 'navigates' && changed.routes.has(e.target)) sel.add(e.source);
  }
  // module-level variable changes: fall back to file-level coverage
  if (changed.varFiles.size) {
    for (const ev of evidence) {
      if (ev.files.some((f) => changed.varFiles.has(f))) sel.add(`test::${ev.test}`);
    }
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
  const sel = selectByGraph(graph, evidence, changed);
  const fr = frozen[n];
  const reduction = 1 - sel.size / fr.full;
  const missed = fr.affected_obs.filter((t) => !sel.has(`test::${t}`));
  rows.push({ tag: n, sel: sel.size, full: fr.full, reduction: +reduction.toFixed(4), cov: fr.cov_reduction, missed: missed.length, changedFns: changed.fns.size, changedRoutes: changed.routes.size, varFiles: changed.varFiles.size });
  console.log(`${n} sel=${sel.size}/${fr.full} red=${reduction.toFixed(3)} cov=${fr.cov_reduction.toFixed(3)} missed=${missed.length} (fns=${changed.fns.size}, routes=${changed.routes.size}, vars=${changed.varFiles.size})`);
}

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
console.log(`\n=== summary ===`);
console.log(`graph-selection Reduction: ${mean(rows.map((r) => r.reduction)).toFixed(4)}`);
console.log(`coverage_only Reduction  : ${mean(rows.map((r) => r.cov)).toFixed(4)}`);
console.log(`total recall misses       : ${rows.reduce((s, r) => s + r.missed, 0)}`);
