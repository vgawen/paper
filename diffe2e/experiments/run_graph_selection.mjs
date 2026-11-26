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
import { isCommentOnlyChange, isTestPath, resolveEntityNode } from '../pipeline/src/graph/attribution.mjs';
import { parseUnifiedDiff } from '../pipeline/src/diff.mjs';
import { selectAffected, routeDiff } from '../pipeline/src/graph/select.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const WORK = path.join(here, '..', 'subject', 'work');
const OUT = path.join(here, 'out');
const git = (a) => { try { return execSync(`git ${a}`, { cwd: WORK, stdio: 'pipe' }).toString(); } catch { return ''; } };

const manifest = JSON.parse(fs.readFileSync(path.join(here, '..', 'subject', 'history', 'manifest.json'), 'utf8'));

const frozen = {};
for (const line of fs.readFileSync(path.join(OUT, 'rq1_dataset.jsonl'), 'utf8').trim().split('\n')) {
  const r = JSON.parse(line);
  frozen[r.tag] = { affected_obs: r.affected_obs || [], affected: r.affected || [], full: r.full_suite, cov: r.metrics.coverage_only, covSelected: r.selected || [] };
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
    const files = (o.files || []).map((x) => String(x).replace(/^\/+/, ''));
    ev.push({ test: o.test, files, funcs });
  }
  return ev;
}

function changedEntities(oldT, newT, graph) {
  const parsed = parseUnifiedDiff(git(`diff ${oldT} ${newT} -- app/public/src`));
  const fns = new Set();
  const vars = new Set();
  const routes = new Set();
  const fallbackFiles = new Set();
  for (const repoF of parsed.files) {
    const f = repoF.replace('app/public/', '');
    if (isTestPath(f)) continue; // spec/test changes are not application changes
    const newCode = git(`show ${newT}:${repoF}`);
    const oldCode = git(`show ${oldT}:${repoF}`);
    const added = parsed.byFile[repoF]?.added || [];
    const removed = parsed.byFile[repoF]?.removed || [];
    // JSX hits are UI-level, not function-level: they must not be treated as a
    // function whose name happens to be `undefined`.
    const ents = changedEntitiesFromCode(newCode, [...added, ...removed], f)
      .filter((e) => e.kind === 'function' || e.kind === 'variable' || e.kind === 'route');
    const commentOnly = isCommentOnlyChange({ addedLines: added, removedLines: removed }, oldCode, newCode, f);
    // No attributable entity in an EXISTING file: a genuine semantic change the
    // mapper could not name (anonymous arrow / top-level side effect) -> file
    // fallback. Comment-only files and brand-new files are inert for old tests.
    if (!ents.length) {
      if (oldCode !== '' && !commentOnly) fallbackFiles.add(f);
      continue;
    }
    for (const e of ents) {
      const r = resolveEntityNode(graph, f, e.kind, e.name);
      if (r.status === 'ambiguous') { fallbackFiles.add(f); continue; }
      if (!r.id) continue; // new declaration: no OLD test could execute it
      if (e.kind === 'variable') vars.add(r.id);
      else if (e.kind === 'route') routes.add(r.id);
      else fns.add(r.id);
    }
  }
  return { fns, vars, routes, fallbackFiles };
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
  const changed = changedEntities(o, n, graph);
  const config = changedConfigFiles(o, n);
  const allTests = graph.nodes.filter((x) => x.kind === 'test').map((x) => x.id);
  const sel = selectAffected(graph, {
    changedFns: changed.fns, changedVars: changed.vars, changedRoutes: changed.routes,
    routeChanges: routeDiff(graph, staticNew),
    configChanged: config.length > 0,
    allTests,
    fallbackFiles: changed.fallbackFiles,
  });
  const fr = frozen[n];
  const reduction = 1 - sel.size / fr.full;
  const missed = fr.affected_obs.filter((t) => !sel.has(`test::${t}`));
  const affectedSet = new Set(fr.affected);
  const hitAffected = [...affectedSet].filter((t) => sel.has(`test::${t}`)).length;
  const safety = fr.affected.length ? hitAffected / fr.affected.length : 1;
  const precision = sel.size ? hitAffected / sel.size : 1;
  const selIds = [...sel].map((x) => x.replace(/^test::/, ''));
  const covSelSet = new Set(fr.covSelected || []);
  const covEmpHit = (fr.affected_obs || []).filter((t) => covSelSet.has(t)).length;
  const aobs = fr.affected_obs || [];
  const empHit = aobs.filter((t) => sel.has(`test::${t}`)).length;
  rows.push({ tag: n, sel: sel.size, full: fr.full, reduction: +reduction.toFixed(4), cov: fr.cov,
    safety: +safety.toFixed(4), precision_cov: +precision.toFixed(4),
    aobs: aobs.length, precision_emp: aobs.length ? +(empHit / sel.size).toFixed(4) : null,
    cov_sel: covSelSet.size, cov_precision_emp: aobs.length && covSelSet.size ? +(covEmpHit / covSelSet.size).toFixed(4) : null,
    safety_emp: aobs.length ? +(empHit / aobs.length).toFixed(4) : null,
    missed: missed.length, selected: selIds.sort() });
  console.log(`${n} sel=${sel.size}/${fr.full} red=${reduction.toFixed(3)} cov=${fr.cov.Reduction.toFixed(3)} safe=${safety.toFixed(2)} prec=${precision.toFixed(2)} missed=${missed.length}${config.length ? ' [CONFIG->all]' : ''}${changed.fallbackFiles.size ? ` [FALLBACK:${[...changed.fallbackFiles].join(',')}]` : ''}`);
}

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
// non-circular recall over the transitions that actually have observed-affected tests
const obsRows = rows.filter((r) => r.missed !== undefined && frozen[r.tag] && frozen[r.tag].affected_obs.length > 0);
const safetyEmp = obsRows.length ? 1 - obsRows.reduce((s, r) => s + r.missed, 0) / obsRows.reduce((s, r) => s + frozen[r.tag].affected_obs.length, 0) : 1;
const summary = {
  n: rows.length,
  graph: {
    Reduction: +mean(rows.map((r) => r.reduction)).toFixed(4),
    Safety_cov: +mean(rows.map((r) => r.safety)).toFixed(4),
    Precision_cov: +mean(rows.map((r) => r.precision_cov)).toFixed(4),
  },
  coverage_only: {
    Reduction: +mean(rows.map((r) => r.cov.Reduction)).toFixed(4),
    Safety: +mean(rows.map((r) => r.cov.Safety)).toFixed(4),
    Precision: +mean(rows.map((r) => r.cov.Precision)).toFixed(4),
  },
  SafetyEmp: +safetyEmp.toFixed(4),
  PrecisionEmp: (() => {
    const e = rows.filter((r) => r.precision_emp !== null && r.sel > 0);
    return e.length ? +(e.reduce((a, r) => a + r.precision_emp * r.sel, 0) / e.reduce((a, r) => a + r.sel, 0)).toFixed(4) : null;
  })(),
  PrecisionEmp_transitions: rows.filter((r) => r.precision_emp !== null).length,
  CoverageOnly_PrecisionEmp: (() => {
    const e = rows.filter((r) => r.cov_precision_emp !== null && r.cov_sel > 0);
    return e.length ? +(e.reduce((a, r) => a + r.cov_precision_emp * r.cov_sel, 0) / e.reduce((a, r) => a + r.cov_sel, 0)).toFixed(4) : null;
  })(),
  recall_misses: rows.reduce((s, r) => s + r.missed, 0),
};
fs.writeFileSync(path.join(OUT, 'rq1_graph.json'), JSON.stringify({ summary, rows }, null, 2));

console.log(`\n=== summary (mean over ${rows.length} transitions) ===`);
console.log('| method | Reduction | Safety_cov | Precision_cov | Precision_emp |');
console.log('|---|---|---|---|---|');
console.log(`| graph-selection | ${summary.graph.Reduction} | ${summary.graph.Safety_cov} | ${summary.graph.Precision_cov} | ${summary.PrecisionEmp} (n=${summary.PrecisionEmp_transitions}) |`);
console.log(`| coverage_only   | ${summary.coverage_only.Reduction} | ${summary.coverage_only.Safety} | ${summary.coverage_only.Precision} | ${summary.CoverageOnly_PrecisionEmp} (n=${summary.PrecisionEmp_transitions}) |`);
console.log(`\nSafetyEmp (非循环 oracle，真实召回): ${summary.SafetyEmp}  (漏选 ${summary.recall_misses})`);
console.log(`Precision_emp (仅 ${summary.PrecisionEmp_transitions} 个 A_obs≠∅ 过渡): ${summary.PrecisionEmp}`);
console.log('注：覆盖 oracle 的 Safety 与选择器同源（自证循环）。graph 的覆盖 Safety 降到 ' + summary.graph.Safety_cov +
  ' 是因为它正确地不选"覆盖了变更文件但结果没变"的测试（如加路由），这正是 §3.4 要破除的循环。');
