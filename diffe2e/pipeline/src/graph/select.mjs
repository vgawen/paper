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
  configChanged = false, allTests = [],
} = {}) {
  // 0. config / flag / env — global implicit dependency, can't be attributed finer
  if (configChanged) return new Set(allTests);

  const { readers, routeTableVars } = buildReaders(graph);

  // 1 + 2. changed functions + variables read by functions -> affected functions
  const affectedFns = new Set(changedFns);
  for (const v of changedVars) for (const fn of readers.get(v) || []) affectedFns.add(fn);

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

  // 4. file-level fallback: variables with no reader (not route table) -> tests touching their file
  const unresolvedVars = [...changedVars].filter((v) => !readers.has(v) && !routeTableVars.has(v));
  if (unresolvedVars.length) {
    const unresolvedFiles = new Set(
      unresolvedVars.map((v) => graph.nodes.find((n) => n.id === v)?.file).filter(Boolean)
    );
    const testFiles = new Map();
    for (const e of graph.edges) {
      if (e.kind !== 'executes' && e.kind !== 'navigates') continue;
      const target = graph.nodes.find((n) => n.id === e.target);
      if (!target || !target.file) continue;
      if (!testFiles.has(e.source)) testFiles.set(e.source, new Set());
      testFiles.get(e.source).add(target.file);
    }
    for (const [test, files] of testFiles) if ([...unresolvedFiles].some((f) => files.has(f))) sel.add(test);
  }

  return sel;
}
