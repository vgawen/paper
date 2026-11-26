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

test('selectAffected: exported variable falls back to file level (static readers are incomplete)', () => {
  const graph = {
    nodes: [
      { id: 'src/a.ts::CONF', kind: 'variable', name: 'CONF', file: 'src/a.ts', isExported: true },
      { id: 'src/a.ts::onlyReader', kind: 'function', name: 'onlyReader', file: 'src/a.ts' },
      { id: 'src/a.ts::otherFn', kind: 'function', name: 'otherFn', file: 'src/a.ts' },
      { id: 'test::t_reader', kind: 'test' },
      { id: 'test::t_other', kind: 'test' },
    ],
    edges: [
      { kind: 'references', source: 'src/a.ts::onlyReader', target: 'src/a.ts::CONF' },
      { kind: 'executes', source: 'test::t_reader', target: 'src/a.ts::onlyReader' },
      { kind: 'executes', source: 'test::t_other', target: 'src/a.ts::otherFn' },
    ],
  };
  const sel = selectAffected(graph, { changedVars: new Set(['src/a.ts::CONF']) });
  // exported var -> cannot narrow -> file-level: BOTH tests of that file are selected
  assert.ok(sel.has('test::t_reader'));
  assert.ok(sel.has('test::t_other'), 'exported variable must not be narrowed to the single static reader');
});

test('selectAffected: file with dynamic access falls back to file level', () => {
  const graph = {
    nodes: [
      { id: 'src/b.ts::MAP', kind: 'variable', name: 'MAP', file: 'src/b.ts' },
      { id: 'src/b.ts::reader', kind: 'function', name: 'reader', file: 'src/b.ts' },
      { id: 'src/b.ts::dyn', kind: 'function', name: 'dyn', file: 'src/b.ts' },
      { id: 'dynaccess::src/b.ts', kind: 'marker', name: 'dynaccess', file: 'src/b.ts' },
      { id: 'test::x1', kind: 'test' }, { id: 'test::x2', kind: 'test' },
    ],
    edges: [
      { kind: 'references', source: 'src/b.ts::reader', target: 'src/b.ts::MAP' },
      { kind: 'executes', source: 'test::x1', target: 'src/b.ts::reader' },
      { kind: 'executes', source: 'test::x2', target: 'src/b.ts::dyn' },
    ],
  };
  const sel = selectAffected(graph, { changedVars: new Set(['src/b.ts::MAP']) });
  assert.ok(sel.has('test::x1') && sel.has('test::x2'), 'dynamic-access file must fall back to file level');
});

test('selectAffected: an unattributed changed file falls back to file level', () => {
  const graph = {
    nodes: [
      { id: 'src/a.ts::f', kind: 'function', name: 'f', file: 'src/a.ts' },
      { id: 'test::t1', kind: 'test' },
      { id: 'test::t2', kind: 'test' },
    ],
    edges: [
      { kind: 'executes', source: 'test::t1', target: 'src/a.ts::f' },
      { kind: 'executes', source: 'test::t2', target: 'src/b.ts::g' },
    ],
  };
  // no changedFns/Vars/Routes at all, only the file whose change could not be attributed
  const sel = selectAffected(graph, { fallbackFiles: new Set(['src/a.ts']) });
  assert.ok(sel.has('test::t1'));
  assert.ok(!sel.has('test::t2'));
});

test('selectAffected: fallbackFiles uses coversFile for module-eval-only files', () => {
  const graph = {
    nodes: [
      { id: 'src/data.json::<file>', kind: 'file', name: 'data.json', file: 'src/data.json' },
      { id: 'test::t1', kind: 'test' },
      { id: 'test::t2', kind: 'test' },
    ],
    edges: [{ kind: 'coversFile', source: 'test::t1', target: 'src/data.json::<file>' }],
  };
  // no executes/navigates edges at all; the file was only module-eval'd
  const sel = selectAffected(graph, { fallbackFiles: new Set(['src/data.json']) });
  assert.ok(sel.has('test::t1'));
  assert.ok(!sel.has('test::t2'));
});

test('selectAffected: non-exported variable in a static-only file IS narrowed', () => {
  const graph = {
    nodes: [
      { id: 'src/c.ts::ITEMS', kind: 'variable', name: 'ITEMS', file: 'src/c.ts', isExported: false },
      { id: 'src/c.ts::render', kind: 'function', name: 'render', file: 'src/c.ts' },
      { id: 'src/c.ts::unused', kind: 'function', name: 'unused', file: 'src/c.ts' },
      { id: 'test::r', kind: 'test' }, { id: 'test::u', kind: 'test' },
    ],
    edges: [
      { kind: 'references', source: 'src/c.ts::render', target: 'src/c.ts::ITEMS' },
      { kind: 'executes', source: 'test::r', target: 'src/c.ts::render' },
      { kind: 'executes', source: 'test::u', target: 'src/c.ts::unused' },
    ],
  };
  const sel = selectAffected(graph, { changedVars: new Set(['src/c.ts::ITEMS']) });
  assert.ok(sel.has('test::r'));
  assert.ok(!sel.has('test::u'), 'a provably-complete static reader set may be narrowed');
});
