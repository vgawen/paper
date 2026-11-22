import test from 'node:test';
import assert from 'node:assert/strict';
import { extractFile } from '../src/graph/extract.mjs';
import { Graph } from '../src/graph/graph.mjs';

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
