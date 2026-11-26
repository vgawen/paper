import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { extractFile } from '../src/graph/extract.mjs';
import { Graph } from '../src/graph/graph.mjs';
import { resolve } from '../src/graph/resolve.mjs';
import { addTestEdges } from '../src/graph/testEdges.mjs';
import { semanticResolveCalls } from '../src/graph/semanticResolve.mjs';
import { svelteKitRoutes } from '../src/graph/fileRoutes.mjs';
import { buildTestCodeGraph } from '../src/graph/index.mjs';
import { discoverWorkspace, buildPaths } from '../src/graph/workspace.mjs';

test('extract: contains/imports/calls edges for a small TS file', () => {
  const code = `
import { helper } from './util';
export function render(root) {
  helper(root);
  root.innerHTML = '<b>x</b>';
}
const routes = { '/home': () => import('./home') };
`;
  const { nodes, edges } = extractFile('src/app.ts', code);

  const kinds = new Set(nodes.map((n) => n.kind));
  assert.ok(kinds.has('file'));
  assert.ok(kinds.has('function'));
  assert.ok(kinds.has('variable'));

  assert.ok(nodes.some((n) => n.kind === 'function' && n.name === 'render'));
  assert.ok(nodes.some((n) => n.kind === 'variable' && n.name === 'routes'));

  assert.ok(edges.some((e) => e.kind === 'imports' && e.target === 'src/util'));
  assert.ok(edges.some((e) => e.kind === 'calls' && e.callee === 'helper'));
  assert.ok(edges.some((e) => e.kind === 'contains'));
});

test('extract: deterministic (same input -> identical output)', () => {
  const code = "export const f = (x) => x * 2;\nexport function g(){ return f(1); }\n";
  const a = extractFile('src/x.ts', code);
  const b = extractFile('src/x.ts', code);
  assert.deepEqual(a, b);
});

test('graph: incremental update == full rebuild on a synthetic edit', () => {
  const v1 = {
    'src/util.ts': 'export const c = 1;\n',
    'src/app.ts': "import { c } from './util';\nexport function f(){ return c + 1; }\n",
  };
  const v2 = {
    'src/util.ts': 'export const c = 2;\nexport function helper(){ return 3; }\n',
    'src/app.ts': "import { c } from './util';\nexport function f(){ return c + 1; }\n", // unchanged
  };

  const full = Graph.build(Object.entries(v2).map(([path, code]) => ({ path, code })));

  const inc = Graph.build(Object.entries(v1).map(([path, code]) => ({ path, code })));
  inc.addFile('src/util.ts', v2['src/util.ts']); // only util.ts changed

  assert.ok(inc.equals(full));
  assert.ok(inc.nodes.has('src/util.ts::helper'));
});

test('resolve: cross-file call resolves to the imported exported function', () => {
  const raw = Graph.build([
    { path: 'src/util.ts', code: 'export function formatPrice(){ return 1; }\n' },
    { path: 'src/cart.ts', code: "import { formatPrice } from './util';\nexport function render(){ formatPrice(); }\n" },
  ]).toJSON();
  const r = resolve(raw);
  const call = r.edges.find((e) => e.kind === 'calls' && e.callee === 'formatPrice');
  assert.ok(call.resolved);
  assert.equal(call.target, 'src/util.ts::formatPrice');
});

test('resolve: rename with caller updated -> re-resolves to the new name', () => {
  const v1 = Graph.build([
    { path: 'src/util.ts', code: 'export function foo(){ return 1; }\n' },
    { path: 'src/app.ts', code: "import { foo } from './util';\nexport function f(){ return foo(); }\n" },
  ]);
  const v2 = Graph.build([
    { path: 'src/util.ts', code: 'export function bar(){ return 1; }\n' },
    { path: 'src/app.ts', code: "import { bar } from './util';\nexport function f(){ return bar(); }\n" },
  ]);
  const call = resolve(v2.toJSON()).edges.find((e) => e.kind === 'calls' && e.callee === 'bar');
  assert.ok(call.resolved);
  assert.equal(call.target, 'src/util.ts::bar');
});

test('resolve: rename without updating caller -> call becomes unresolved (broken ref)', () => {
  const v1 = Graph.build([
    { path: 'src/util.ts', code: 'export function foo(){ return 1; }\n' },
    { path: 'src/app.ts', code: "import { foo } from './util';\nexport function f(){ return foo(); }\n" },
  ]);
  // util renames foo->bar, app.ts unchanged (still calls foo)
  const inc = new Graph();
  inc.addFile('src/util.ts', 'export function bar(){ return 1; }\n');
  inc.addFile('src/app.ts', "import { foo } from './util';\nexport function f(){ return foo(); }\n");
  const full = Graph.build([
    { path: 'src/util.ts', code: 'export function bar(){ return 1; }\n' },
    { path: 'src/app.ts', code: "import { foo } from './util';\nexport function f(){ return foo(); }\n" },
  ]);
  assert.ok(inc.equals(full));
  const call = resolve(inc.toJSON()).edges.find((e) => e.kind === 'calls' && e.callee === 'foo');
  assert.ok(call && call.resolved === false);
});

test('route: route table extracts route nodes + renders edges', () => {
  const code = "const routes = { '/cart': () => import('./cart.js'), '/home': () => import('./home.js') };\n";
  const { nodes, edges } = extractFile('src/main.js', code);
  const routeNodes = nodes.filter((n) => n.kind === 'route');
  assert.deepEqual(routeNodes.map((n) => n.name).sort(), ['/cart', '/home']);
  const renders = edges.filter((e) => e.kind === 'renders');
  assert.equal(renders.length, 2);
  assert.ok(renders.some((e) => e.target === 'src/cart.js::<file>'));
  assert.ok(renders.some((e) => e.target === 'src/home.js::<file>'));
});

test('testEdges: attaches executes + navigates edges from coverage evidence', () => {
  const raw = Graph.build([
    { path: 'src/main.js', code: "const routes = { '/cart': () => import('./cart.js') };\n" },
    { path: 'src/cart.js', code: 'export function render(){};\n' },
  ]).toJSON();
  const evidence = [{ test: 'cart.spec > x', funcs: { 'src/main.js': ['/cart', 'render'], 'src/cart.js': ['render'] } }];
  const g = addTestEdges(raw, evidence);
  assert.ok(g.nodes.some((n) => n.kind === 'test' && n.name === 'cart.spec > x'));
  assert.ok(g.edges.some((e) => e.kind === 'executes' && e.target === 'src/cart.js::render'));
  assert.ok(g.edges.some((e) => e.kind === 'navigates' && e.target === 'src/main.js::route:/cart'));
});

test('semanticResolve: resolves aliased imports where name-based fails', () => {
  const files = [
    { path: 'src/util.ts', code: 'export function formatPrice(c){ return c; }\n' },
    { path: 'src/cart.ts', code: "import { formatPrice as fmt } from './util';\nexport function render(){ fmt(1); }\n" },
  ];
  // typeChecker follows the alias `fmt` -> formatPrice
  const sem = semanticResolveCalls(files);
  const call = sem.resolved.find((e) => e.callee === 'fmt');
  assert.ok(call && call.resolved);
  assert.equal(call.target, 'src/util.ts::formatPrice');

  // name-based cannot (it looks up 'fmt', which has no declaration)
  const nb = resolve(Graph.build(files).toJSON()).edges.find((e) => e.kind === 'calls' && e.callee === 'fmt');
  assert.ok(nb && nb.resolved === false);
});

test('semanticResolve: resolves re-exports (barrel file)', () => {
  const files = [
    { path: 'src/util.ts', code: 'export function formatPrice(c){ return c; }\n' },
    { path: 'src/index.ts', code: "export { formatPrice } from './util';\n" },
    { path: 'src/cart.ts', code: "import { formatPrice } from './index';\nexport function render(){ formatPrice(1); }\n" },
  ];
  const sem = semanticResolveCalls(files);
  const call = sem.resolved.find((e) => e.callee === 'formatPrice');
  assert.ok(call && call.resolved);
  assert.equal(call.target, 'src/util.ts::formatPrice'); // resolves THROUGH the barrel to the real decl
});

test('route: React Router config { path, element:<X/> } -> route + component ref', () => {
  const code = "const routes = [{ path: '/checkout', element: <PaymentForm /> }];\n";
  const { nodes, edges } = extractFile('src/router.tsx', code);
  const route = nodes.find((n) => n.kind === 'route');
  assert.ok(route && route.name === '/checkout');
  const renders = edges.find((e) => e.kind === 'renders');
  assert.ok(renders && renders.target === 'component:PaymentForm');
});

test('route: React Router Component/component identifiers', () => {
  const code = "export const routes = [{ path: '/a', Component: PageA }, { path: '/b', component: PageB }];\n";
  const { nodes, edges } = extractFile('src/router.tsx', code);
  assert.deepEqual(nodes.filter((n) => n.kind === 'route').map((n) => n.name).sort(), ['/a', '/b']);
  const targets = edges.filter((e) => e.kind === 'renders').map((e) => e.target).sort();
  assert.deepEqual(targets, ['component:PageA', 'component:PageB']);
});

test('route: React Router JSX <Route path element> -> route + component', () => {
  const code = '<Routes><Route path="/checkout" element={<PaymentForm />} /><Route path="/settings" element={<Settings />}><Route path="general" element={<GeneralSettings />} /></Route></Routes>';
  const { nodes, edges } = extractFile('src/App.tsx', code);
  assert.deepEqual(nodes.filter((n) => n.kind === 'route').map((n) => n.name), ['/checkout', '/settings', 'general']);
  assert.ok(edges.some((e) => e.kind === 'renders' && e.target === 'component:PaymentForm'));
  assert.ok(edges.some((e) => e.kind === 'renders' && e.target === 'component:Settings'));
});

test('extract: oversized/broken file degrades to file-only node (no crash)', () => {
  const { nodes, edges } = extractFile('src/big.tsx', 'x'.repeat(200000));
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].kind, 'file');
  assert.equal(edges.length, 0);
});

test('extract: value-reference edge (function -> module-level variable it reads)', () => {
  const code = "const ORDERS = [1,2];\nexport function render(){ return ORDERS.map(x=>x); }\nexport function calc(){ return 0; }\n";
  const { edges } = extractFile('src/orders.ts', code);
  const refs = edges.filter((e) => e.kind === 'references');
  assert.ok(refs.some((e) => e.source === 'src/orders.ts::render' && e.target === 'src/orders.ts::ORDERS'));
  // calc() does not reference ORDERS -> a change to ORDERS won't select calc's tests
  assert.ok(!refs.some((e) => e.source === 'src/orders.ts::calc'));
});

test('extract: route table variable is marked isRouteTable', () => {
  const code = "const routes = { '/cart': () => import('./cart.js') };\n";
  const { nodes } = extractFile('src/main.js', code);
  const routesVar = nodes.find((n) => n.kind === 'variable' && n.name === 'routes');
  assert.ok(routesVar && routesVar.isRouteTable);
});

test('workspace: discovers packages + builds paths mapping', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ws-'));
  fs.mkdirSync(path.join(tmp, 'packages', 'pkg-a', 'src'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'packages', 'pkg-a', 'package.json'), JSON.stringify({ name: '@scope/a', exports: { './x': './src/x.ts' } }));
  fs.writeFileSync(path.join(tmp, 'packages', 'pkg-a', 'src', 'x.ts'), 'export const x = 1;\n');
  const pkgs = discoverWorkspace(tmp);
  assert.equal(pkgs.length, 1);
  assert.equal(pkgs[0].name, '@scope/a');
  assert.equal(pkgs[0].src, 'packages/pkg-a/src');
  const paths = buildPaths(pkgs);
  assert.deepEqual(paths['@scope/a/*'], ['packages/pkg-a/src/*']);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('svelteKitRoutes: file-based +page.svelte -> route with dynamic segments', () => {
  const files = [
    { path: 'src/routes/+page.svelte', code: '' },
    { path: 'src/routes/about/+page.svelte', code: '' },
    { path: 'src/routes/blog/[slug]/+page.svelte', code: '' },
  ];
  const { nodes, edges } = svelteKitRoutes(files);
  assert.deepEqual(nodes.map((n) => n.name).sort(), ['/', '/about', '/blog/:slug']);
  assert.equal(edges.length, 3);
  assert.ok(edges.some((e) => e.kind === 'renders' && e.target === 'src/routes/blog/[slug]/+page.svelte::<file>'));
});

test('buildTestCodeGraph: unifies code + route + test layers', () => {
  const files = [
    { path: 'src/util.ts', code: 'export function formatPrice(c){ return c; }\n' },
    { path: 'src/cart.ts', code: "import { formatPrice } from './util';\nexport function render(){ return formatPrice(1); }\n" },
    { path: 'src/main.ts', code: "const routes = { '/cart': () => import('./cart') };\n" },
  ];
  const evidence = [{ test: 'cart.spec > x', funcs: { 'src/main.ts': ['/cart', 'render'], 'src/cart.ts': ['render'], 'src/util.ts': ['formatPrice'] } }];
  const g = buildTestCodeGraph(files, evidence);
  const kinds = new Set(g.nodes.map((n) => n.kind));
  assert.ok(kinds.has('test'));
  assert.ok(kinds.has('route'));
  assert.ok(kinds.has('function'));
  // the chain route:/cart -> renders -> cart file -> contains -> render -> executes -> test
  const renders = g.edges.find((e) => e.kind === 'renders');
  assert.ok(renders);
  assert.ok(g.edges.some((e) => e.kind === 'executes' && e.target === 'src/cart.ts::render'));
  assert.ok(g.edges.some((e) => e.kind === 'calls' && e.resolved && e.target === 'src/util.ts::formatPrice'));
});

test('addTestEdges: records true file-level coverage (coversFile) for fallback', () => {
  const g = addTestEdges({
    nodes: [
      { id: 'src/a.ts::<file>', kind: 'file', name: 'a.ts', file: 'src/a.ts' },
      { id: 'src/a.ts::f', kind: 'function', name: 'f', file: 'src/a.ts' },
    ],
    edges: [],
  }, [{ test: 't', files: ['src/a.ts'], funcs: { 'src/a.ts': ['f'] } }]);
  assert.ok(g.edges.some((e) => e.kind === 'coversFile' && e.target === 'src/a.ts::<file>'));
  assert.ok(g.edges.some((e) => e.kind === 'executes' && e.target === 'src/a.ts::f'));
});
