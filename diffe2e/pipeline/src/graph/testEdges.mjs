// Attach test nodes + test→code evidence edges to a static graph.
//
// The static K/routes graph is code→code; this adds the test side, turning it
// into a true test-code graph. Evidence is the function-level CDP coverage:
//   testEvidence = [{ test, funcs: { file: [functionName, ...] } }]
// where a `functionName` may be a real function (→ `executes` edge) or the
// name V8 infers for a route arrow (→ `navigates` edge, test visits a route).
import { nodeId } from './extract.mjs';

export function addTestEdges(rawGraph, testEvidence) {
  const nodes = [...rawGraph.nodes];
  const edges = [...rawGraph.edges];

  const fnByFile = new Map();    // `${file}\u0000${name}` -> node id (function/method)
  const routeByFile = new Map(); // `${file}\u0000${name}` -> route node id
  for (const n of rawGraph.nodes) {
    if (n.kind === 'function' || n.kind === 'method') fnByFile.set(`${n.file}\u0000${n.name}`, n.id);
    else if (n.kind === 'route') routeByFile.set(`${n.file}\u0000${n.name}`, n.id);
  }

  for (const te of testEvidence) {
    const testId = `test::${te.test}`;
    if (!nodes.some((n) => n.id === testId)) {
      nodes.push({ id: testId, kind: 'test', name: te.test, qualifiedName: te.test, file: null, startLine: 0, endLine: 0 });
    }
    for (const [file, names] of Object.entries(te.funcs || {})) {
      for (const name of names) {
        const fnTarget = fnByFile.get(`${file}\u0000${name}`);
        if (fnTarget) { edges.push({ source: testId, target: fnTarget, kind: 'executes', provenance: 'dynamic', line: 0 }); continue; }
        const routeTarget = routeByFile.get(`${file}\u0000${name}`);
        if (routeTarget) { edges.push({ source: testId, target: routeTarget, kind: 'navigates', provenance: 'dynamic', line: 0 }); }
        // names not in the static graph (DOM APIs etc.) are intentionally skipped
      }
    }
  }

  return { nodes, edges };
}

// Static test→UI evidence edges: parse a test's locators (getByTestId/getByText/…)
// and assertions (toHaveText/toContainText/…) into `asserts` edges (test -> ui node).
// Used for RQ3 breakage diagnosis: a failing test whose edge points at a changed UI
// node tells you WHICH locator/assertion broke and why.
export function addStaticTestEdges(graph, testSources) {
  const nodes = [...graph.nodes];
  const edges = [...graph.edges];
  for (const [testId, code] of Object.entries(testSources)) {
    const refs = new Set();
    for (const m of code.matchAll(/getBy(?:TestId|Text|Role|Label)\(['"]([^'"]+)['"]/g)) refs.add('ui:' + m[1]);
    for (const m of code.matchAll(/to(?:HaveText|ContainText)\(['"]([^'"]+)['"]/g)) refs.add('ui:' + m[1]);
    for (const ui of refs) edges.push({ source: `test::${testId}`, target: ui, kind: 'asserts', provenance: 'symbolic', line: 0 });
  }
  return { nodes, edges };
}
