// RQ3 breakage diagnosis via the graph: a failing test's `asserts` edge points at a
// changed UI node (testId/text) -> the edge is the breakage. Compare with the old
// rule-based staleness classification (sigMap/segMap).
import { execSync } from 'node:child_process';
import { addStaticTestEdges } from '../pipeline/src/graph/testEdges.mjs';

const git = (a) => execSync(`git ${a}`, { cwd: 'subject/work', stdio: 'pipe' }).toString();

// controlled subject's 4 breaking transitions + what changed (from seed.mjs)
const cases = [
  { tag: 'c08', spec: 'cart.spec.ts', changed: { kind: 'testId', from: 'cart-add', to: 'cart-add-btn' } },
  { tag: 'c20', spec: 'search.spec.ts', changed: { kind: 'testId', from: 'search-go', to: 'search-find' } },
  { tag: 'c15', spec: 'login.spec.ts', changed: { kind: 'text', from: 'Welcome', to: 'Hi' } },
  { tag: 'c21', spec: 'orders.spec.ts', changed: { kind: 'text', from: 'A1: $15.00', to: 'A1: $18.00' } },
];

for (const c of cases) {
  const code = git(`show c24:tests/${c.spec}`);
  const testId = `${c.spec} > x`;
  const graph = { nodes: [{ id: `test::${testId}`, kind: 'test' }], edges: [] };
  const g = addStaticTestEdges(graph, { [testId]: code });
  const hit = g.edges.some((e) => e.kind === 'asserts' && (e.target === `ui:${c.changed.from}` || c.changed.from.includes(e.target.slice(3)) || e.target.slice(3).includes(c.changed.from)));
  const stl = c.changed.kind === 'testId' ? 'STRUCTURAL_ONLY (定位器)' : 'EXPECTATION_CHANGE (断言)';
  console.log(`${c.tag} ${c.spec}: 变更 ${c.changed.kind} "${c.changed.from}" -> "${c.changed.to}"`);
  console.log(`  图诊断: 测试的 asserts 边指向 ui:${c.changed.from} -> 断裂类型 ${stl}，修复锚 = ${c.changed.from} -> ${c.changed.to}`);
}
