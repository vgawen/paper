import test from 'node:test';
import assert from 'node:assert/strict';
import { extractFile } from '../src/graph/extract.mjs';
import { Graph } from '../src/graph/graph.mjs';
import { resolve } from '../src/graph/resolve.mjs';

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
