import test from 'node:test';
import assert from 'node:assert/strict';
import { isCommentOnlyChange, resolveEntityNode } from '../src/graph/attribution.mjs';

const codeOf = (...lines) => lines.join('\n');

test('isCommentOnlyChange: comment-only edit is inert', () => {
  const oldCode = codeOf('// old header', 'export function f() { return 1; }');
  const newCode = codeOf('// new header', 'export function f() { return 1; }');
  assert.equal(isCommentOnlyChange({ addedLines: [1], removedLines: [1] }, oldCode, newCode, 'x.ts'), true);
});

test('isCommentOnlyChange: block comment lines are inert', () => {
  const code = codeOf('/*', ' * explanation', ' */', 'export const x = 1;');
  assert.equal(isCommentOnlyChange({ addedLines: [2] }, '', code, 'x.ts'), true);
});

test('isCommentOnlyChange: code edit is not inert', () => {
  const oldCode = codeOf('export const x = 1;');
  const newCode = codeOf('export const x = 2;');
  assert.equal(isCommentOnlyChange({ addedLines: [1], removedLines: [1] }, oldCode, newCode, 'x.ts'), false);
});

test('isCommentOnlyChange: mixed comment + code is not inert', () => {
  const oldCode = codeOf('// note', 'export const x = 1;');
  const newCode = codeOf('// note', 'export const x = 2;');
  assert.equal(isCommentOnlyChange({ addedLines: [1, 2], removedLines: [1, 2] }, oldCode, newCode, 'x.ts'), false);
});

test('isCommentOnlyChange: a line starting with // inside a template literal is NOT a comment', () => {
  const code = codeOf('const html = `', '// this line is template text', '`;');
  assert.equal(isCommentOnlyChange({ addedLines: [2] }, '', code, 'x.ts'), false);
});

test('isCommentOnlyChange: JSX comment wrapper braces are inert', () => {
  const code = codeOf('export function App() {', '  return (', '    <div>', '      {/* note */}', '    </div>', '  );', '}');
  assert.equal(isCommentOnlyChange({ addedLines: [4] }, '', code, 'x.tsx'), true);
});

test('isCommentOnlyChange: blank lines are inert', () => {
  const code = codeOf('export const x = 1;', '', 'export const y = 2;');
  assert.equal(isCommentOnlyChange({ addedLines: [2] }, '', code, 'x.ts'), true);
});

test('isCommentOnlyChange: unsupported file types are conservative (not inert)', () => {
  const code = codeOf('<!-- note -->');
  assert.equal(isCommentOnlyChange({ addedLines: [1] }, '', code, 'x.html'), false);
});

test('isCommentOnlyChange: no hunk means inert only when text is unchanged', () => {
  assert.equal(isCommentOnlyChange({}, 'same', 'same', 'x.ts'), true);
  assert.equal(isCommentOnlyChange({}, 'old', 'new', 'x.ts'), false);
});

const G = (nodes) => ({ nodes, edges: [] });

test('resolveEntityNode: exact id wins', () => {
  const g = G([{ id: 'src/a.ts::f', kind: 'function', name: 'f', file: 'src/a.ts' }]);
  assert.deepEqual(resolveEntityNode(g, 'src/a.ts', 'function', 'f'), { id: 'src/a.ts::f', status: 'exact' });
});

test('resolveEntityNode: unique same-file name repairs a qualified-name mismatch (class method)', () => {
  const g = G([{ id: 'src/a.ts::C::m', kind: 'method', name: 'm', file: 'src/a.ts' }]);
  assert.deepEqual(resolveEntityNode(g, 'src/a.ts', 'function', 'm'), { id: 'src/a.ts::C::m', status: 'unique' });
});

test('resolveEntityNode: duplicate names are ambiguous (caller falls back)', () => {
  const g = G([
    { id: 'src/a.ts::A::m', kind: 'method', name: 'm', file: 'src/a.ts' },
    { id: 'src/a.ts::B::m', kind: 'method', name: 'm', file: 'src/a.ts' },
  ]);
  const r = resolveEntityNode(g, 'src/a.ts', 'function', 'm');
  assert.equal(r.status, 'ambiguous');
  assert.equal(r.id, null);
});

test('resolveEntityNode: a declaration absent from the old graph is missing (no fallback)', () => {
  const g = G([{ id: 'src/a.ts::old', kind: 'function', name: 'old', file: 'src/a.ts' }]);
  assert.deepEqual(resolveEntityNode(g, 'src/a.ts', 'function', 'brandNew'), { id: null, status: 'missing' });
});

test('resolveEntityNode: variables only match variable nodes', () => {
  const g = G([
    { id: 'src/a.ts::fn', kind: 'function', name: 'x', file: 'src/a.ts' },
    { id: 'src/a.ts::x', kind: 'variable', name: 'x', file: 'src/a.ts' },
  ]);
  assert.deepEqual(resolveEntityNode(g, 'src/a.ts', 'variable', 'x'), { id: 'src/a.ts::x', status: 'exact' });
});
