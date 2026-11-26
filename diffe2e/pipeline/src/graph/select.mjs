// Graph-driven test selection (RQ1): four-layer attribution + config fallback.
//
//   1. function-level `executes` (dynamic coverage)
//   2. value-reference `references` (variable -> reading function)
//   3. route-level (ADD -> 0, REMOVE/MODIFY -> tests navigating to it)
//   4. file-level fallback (variables with no statically-identifiable reader)
//   0. config/flag/env changes -> retest_all (global implicit dependency)
import { nodeId } from './extract.mjs';

// variable id -> functions that reference it (route-table variables excluded:
// they are handled by route-level, not value-reference)
export function buildReaders(graph) {
  const readers = new Map();
  const routeTableVars = new Set();
  for (const e of graph.edges) {
    if (e.kind !== 'references') continue;
    const varNode = graph.nodes.find((n) => n.id === e.target);
    if (varNode && varNode.isRouteTable) { routeTableVars.add(e.target); continue; }
    if (!readers.has(e.target)) readers.set(e.target, new Set());
    readers.get(e.target).add(e.source);
  }
  return { readers, routeTableVars };
}

// diff routes between V_old and V_new: { added, removed, modified } route names
export function routeDiff(graphOld, graphNew) {
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

export function selectAffected(graph, {
  changedFns = new Set(), changedVars = new Set(), changedRoutes = new Set(),
  routeChanges = { added: [], removed: [], modified: [] },
  configChanged = false, allTests = [], fallbackFiles = new Set(),
} = {}) {
  // 0. config / flag / env — global implicit dependency, can't be attributed finer
  if (configChanged) return new Set(allTests);

  const { readers, routeTableVars } = buildReaders(graph);

  // 1 + 2. changed functions + variables read by functions -> affected functions
  const affectedFns = new Set(changedFns);
  const unsafeVars = new Set(); // narrowed only by an incomplete static edge -> file-level fallback
  for (const v of changedVars) {
    if (!readers.has(v) || !isSafelyNarrowable(graph, v)) { unsafeVars.add(v); continue; }
    for (const fn of readers.get(v)) affectedFns.add(fn);
  }

  const sel = new Set();
  for (const e of graph.edges) {
    if (e.kind === 'executes' && affectedFns.has(e.target)) sel.add(e.source);
    if (e.kind === 'navigates' && changedRoutes.has(e.target)) sel.add(e.source);
  }

  // 3. route-level: REMOVE/MODIFY -> tests navigating to that route (ADD -> none)
  const changedRouteNames = new Set([...routeChanges.removed, ...routeChanges.modified]);
  if (changedRouteNames.size) {
    for (const e of graph.edges) {
      if (e.kind !== 'navigates') continue;
      const rn = graph.nodes.find((n) => n.id === e.target);
      if (rn && changedRouteNames.has(rn.name)) sel.add(e.source);
    }
  }

  // 4. file-level fallback: variables that cannot be narrowed safely (no reader, or
  // a reader set that is not provably complete: exported / dynamic-access file),
  // plus whole files whose change could not be attributed to any entity at all
  // (anonymous arrows / top-level side effects / unsupported syntax). The caller
  // excludes comment-only files, so an empty entity list here means a real risk.
  const unresolvedVars = [...changedVars].filter((v) => unsafeVars.has(v) && !routeTableVars.has(v));
  const fallbackFileSet = new Set(fallbackFiles);
  for (const v of unresolvedVars) {
    const f = graph.nodes.find((n) => n.id === v)?.file;
    if (f) fallbackFileSet.add(f);
  }
  if (fallbackFileSet.size) {
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));
    const testFiles = new Map();
    const addFile = (test, file) => {
      if (!file) return;
      if (!testFiles.has(test)) testFiles.set(test, new Set());
      testFiles.get(test).add(file);
    };
    for (const e of graph.edges) {
      // coversFile is true file-level coverage (including module-eval-only files);
      // executes/navigates are a fallback for graphs that predate the file edge.
      if (e.kind === 'coversFile' || e.kind === 'executes' || e.kind === 'navigates') {
        addFile(e.source, byId.get(e.target)?.file);
      }
    }
    for (const [test, files] of testFiles) if ([...fallbackFileSet].some((f) => files.has(f))) sel.add(test);
  }

  return sel;
}

// RQ2 gap detection: code entities (functions/routes) with no incoming `executes`
// edge — i.e. no test actually exercises them. Finer than file-level coverageGap
// (which only flags whole files with zero coverage): it also catches unused
// functions inside an otherwise-covered file, and new routes with no test.
export function detectGaps(graph, { kinds = ['function', 'method', 'route'] } = {}) {
  const covered = new Set();
  for (const e of graph.edges) {
    if (e.kind === 'executes' || e.kind === 'navigates') covered.add(e.target);
  }
  return graph.nodes.filter((n) => kinds.includes(n.kind) && !covered.has(n.id));
}

// A changed variable can only be narrowed by static `references` when that
// narrowing is PROVABLY complete. It is NOT when the variable is exported (another
// module may read it through an edge we did not extract) or when the file has
// dynamic property access (`obj[name]`, `window[...]`, string-keyed lookup), which
// can read a variable without a syntactic identifier reference. In those cases the
// caller must fall back to file-level selection, or recall is no longer guaranteed.
export function isSafelyNarrowable(graph, varId) {
  const v = graph.nodes.find((n) => n.id === varId);
  if (!v) return false;
  if (v.isExported) return false;
  const file = v.file;
  const dyn = graph.nodes.find((n) => n.id === `dynaccess::${file}`);
  return !dyn; // no dynamic-access marker recorded for this file
}
