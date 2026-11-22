// Unified entry point: build the full test-code graph from (source files + test
// evidence). Wires the pieces together:
//   raw extraction (tree-sitter) -> file-based routes -> resolve calls/renders
//   (typeChecker primary, name-based fallback) -> attach test edges.
import { Graph } from './graph.mjs';
import { resolve } from './resolve.mjs';
import { semanticResolveCalls } from './semanticResolve.mjs';
import { svelteKitRoutes } from './fileRoutes.mjs';
import { addTestEdges } from './testEdges.mjs';

export function buildTestCodeGraph(files, testEvidence = [], opts = {}) {
  // 1. raw per-file extraction (lossless tree-sitter spans)
  const raw = Graph.build(files).toJSON();

  // 2. file-based framework routes (SvelteKit)
  const sk = svelteKitRoutes(files);
  raw.nodes.push(...sk.nodes);
  raw.edges.push(...sk.edges);

  // 3. name-based resolution (calls + component refs) as the baseline
  const nameResolved = resolve(raw);

  // 4. typeChecker semantic resolution overrides where it succeeds (aliasing,
  //    barrels, re-exports, workspace paths that name-based cannot resolve)
  let sem = { resolved: [], errors: ['skipped'] };
  try { sem = semanticResolveCalls(files, opts); } catch { /* fall back to name-based */ }
  const semByCall = new Map(sem.resolved.filter((r) => r.resolved).map((r) => [`${r.source}\u0000${r.callee}`, r.target]));
  const edges = nameResolved.edges.map((e) => {
    if (e.kind === 'calls' && semByCall.has(`${e.source}\u0000${e.callee}`)) {
      return { ...e, target: semByCall.get(`${e.source}\u0000${e.callee}`), resolved: true, provenance: 'symbolic' };
    }
    return e;
  });

  // 5. attach test side (executes / navigates)
  return addTestEdges({ nodes: nameResolved.nodes, edges }, testEvidence);
}
