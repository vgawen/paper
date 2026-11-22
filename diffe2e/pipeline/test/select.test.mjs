import test from 'node:test';
import assert from 'node:assert/strict';
import { selectAffected, detectGaps } from '../src/graph/select.mjs';
import { addStaticTestEdges } from '../src/graph/testEdges.mjs';

test('selectAffected: config change -> retest_all (global implicit dependency)', () => {
  const graph = {
    nodes: [{ id: 'test::a', kind: 'test' }, { id: 'test::b', kind: 'test' }],
    edges: [],
  };
  const sel = selectAffected(graph, { configChanged: true, allTests: ['test::a', 'test::b'] });
  assert.deepEqual([...sel].sort(), ['test::a', 'test::b']);
});

test('selectAffected: variable with no reader -> file-level fallback (conservative)', () => {
  const graph = {
    nodes: [
      { id: 'src/a.ts::x', kind: 'variable', name: 'x', file: 'src/a.ts' },
      { id: 'src/a.ts::f', kind: 'function', name: 'f', file: 'src/a.ts' },
      { id: 'test::t1', kind: 'test', file: null },
    ],
    edges: [{ kind: 'executes', source: 'test::t1', target: 'src/a.ts::f' }],
  };
  // x has no reader -> fall back to "tests touching src/a.ts"
  const sel = selectAffected(graph, { changedVars: new Set(['src/a.ts::x']) });
  assert.ok(sel.has('test::t1'));
});

test('selectAffected: route ADD selects nothing (no test visits a new route)', () => {
  const graph = {
    nodes: [
      { id: 'test::t1', kind: 'test' },
      { id: 'src/main.js::route:/cart', kind: 'route', name: '/cart', file: 'src/main.js' },
    ],
    edges: [{ kind: 'navigates', source: 'test::t1', target: 'src/main.js::route:/cart' }],
  };
  const sel = selectAffected(graph, { routeChanges: { added: ['/wishlist'], removed: [], modified: [] } });
  assert.equal(sel.size, 0); // added route -> no test visits it
});

test('detectGaps: function with no executes edge is a gap; covered one is not', () => {
  const graph = {
    nodes: [
      { id: 'src/a.ts::used', kind: 'function', name: 'used', file: 'src/a.ts' },
      { id: 'src/a.ts::unused', kind: 'function', name: 'unused', file: 'src/a.ts' },
      { id: 'src/main.ts::route:/x', kind: 'route', name: '/x', file: 'src/main.ts' },
    ],
    edges: [
      { kind: 'executes', source: 'test::t1', target: 'src/a.ts::used' },
      { kind: 'navigates', source: 'test::t1', target: 'src/main.ts::route:/x' },
    ],
  };
  const gaps = detectGaps(graph);
  const names = gaps.map((n) => n.name);
  assert.ok(names.includes('unused')); // unused function -> gap
  assert.ok(!names.includes('used'));   // covered function -> not a gap
  assert.ok(!names.includes('/x'));     // visited route -> not a gap
});

test('addStaticTestEdges: parses locators + assertions into asserts edges', () => {
  const code = "await page.getByTestId('cart-add').click();\nawait expect(page.getByTestId('cart-count')).toHaveText('1');\n";
  const g = addStaticTestEdges({ nodes: [], edges: [] }, { 'cart.spec > x': code });
  const targets = g.edges.filter((e) => e.kind === 'asserts').map((e) => e.target);
  assert.ok(targets.includes('ui:cart-add'));
  assert.ok(targets.includes('ui:cart-count'));
  assert.ok(targets.includes('ui:1'));
});
