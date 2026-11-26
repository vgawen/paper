// Attribution completeness helpers (H2 / H2' in the paper).
//
// A changed file may yield NO function/variable/route entity from the line->entity
// mapper. Two very different cases hide behind that empty result:
//
//   (a) comment / blank-only noise -> semantically inert, selecting 0 is correct;
//   (b) code the mapper could not attribute -> anonymous arrows / JSX handlers /
//       `export default () => ...` / top-level side effects / unsupported syntax.
//       Selecting 0 here would silently violate recall, so the caller MUST fall
//       back to file-level selection for that file.
//
// This module decides (a) vs (b) without guessing from the line's first character
// alone: the TypeScript scanner is used to prove that every non-whitespace
// character of every changed line lies inside comment trivia. A line inside a
// template literal that happens to start with `//` is therefore NOT a comment.
import { createRequire } from 'node:module';
import { nodeId } from './extract.mjs';
const require = createRequire(import.meta.url);
const ts = require('typescript');

// Resolve a changed entity (file, kind, name) to a node in the OLD graph.
//
// `changedEntitiesFromCode` returns bare declaration names, while graph node ids
// use qualified names (`file::Class::method`, `file::outer::inner`). Exact id first,
// then a UNIQUE same-file/same-name node. A unique name match repairs the
// qualified-name mismatch without guessing; multiple candidates are ambiguous and
// the caller must fall back to file level.
//
// status:
//   exact / unique -> id
//   ambiguous      -> id=null, caller falls back to file level
//   missing        -> id=null, the declaration did not exist in the old graph
//                     (new file / new function). No OLD test could have executed it,
//                     so selecting 0 for it is safe; the caller does not fall back.
export function resolveEntityNode(graph, file, kind, name) {
  const exactId = nodeId(file, kind === 'route' ? `route:${name}` : name);
  if (graph.nodes.some((n) => n.id === exactId)) return { id: exactId, status: 'exact' };
  const want = kind === 'variable' ? new Set(['variable']) : new Set(['function', 'method']);
  const cands = graph.nodes.filter((n) => n.file === file && n.name === name && want.has(n.kind));
  if (cands.length === 1) return { id: cands[0].id, status: 'unique' };
  if (cands.length > 1) return { id: null, status: 'ambiguous', candidates: cands.map((n) => n.id) };
  return { id: null, status: 'missing' };
}

// Test code is not an application change: a modified spec/test file must not enter
// Δ for RQ1 selection (nor trigger a file-level fallback). Mirrors the filter used by
// the ReproBreak e2e harness.
export function isTestPath(file) {
  return /(\.spec\.|\.test\.|(^|\/)(tests?|e2e|cypress|__tests__)\/)/i.test(file);
}

const COMMENT_KINDS = new Set([
  ts.SyntaxKind.SingleLineCommentTrivia,
  ts.SyntaxKind.MultiLineCommentTrivia,
  ts.SyntaxKind.ConflictMarkerTrivia,
]);

function commentRanges(code) {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, /* skipTrivia */ false, ts.LanguageVariant.Standard, code);
  const ranges = [];
  for (let tok = scanner.scan(); tok !== ts.SyntaxKind.EndOfFileToken; tok = scanner.scan()) {
    if (COMMENT_KINDS.has(tok)) ranges.push([scanner.getTokenPos(), scanner.getTextPos()]);
  }
  return ranges;
}

function lineStartOffsets(code) {
  const starts = [0];
  for (let i = 0; i < code.length; i++) if (code[i] === '\n') starts.push(i + 1);
  return starts;
}

// `{` / `}` are allowed when they wrap a JSX comment (`{/* ... */}`), i.e. they are
// directly adjacent to a comment range; otherwise a JS/TS block needs its braces.
function adjacentToComment(pos, ranges) {
  return ranges.some(([a, b]) => pos + 1 === a || pos === b);
}

function lineIsComment(code, lineNo, ranges, starts) {
  if (lineNo < 1 || lineNo > starts.length) return false; // out-of-range -> conservative
  const start = starts[lineNo - 1];
  const nl = code.indexOf('\n', start);
  const end = nl === -1 ? code.length : nl;
  for (let p = start; p < end; p++) {
    const ch = code[p];
    if (ch === ' ' || ch === '\t' || ch === '\r') continue;
    if (ranges.some(([a, b]) => p >= a && p < b)) continue;            // inside comment trivia
    if ((ch === '{' || ch === '}') && adjacentToComment(p, ranges)) continue; // JSX comment braces
    return false;
  }
  return true; // blank line, or every non-whitespace char was comment trivia
}

// True iff every changed line (added lines in newCode, removed lines in oldCode) is
// blank or lies entirely inside comment trivia. Conservative: unsupported file
// types, out-of-range lines, or an empty diff over differing text return false.
export function isCommentOnlyChange({ addedLines = [], removedLines = [] } = {}, oldCode = '', newCode = '', fileName = 'x.ts') {
  if (!/\.(t|j)sx?$/.test(fileName)) return false;
  const items = [];
  for (const n of addedLines) items.push([newCode, n]);
  for (const n of removedLines) items.push([oldCode, n]);
  if (!items.length) return oldCode === newCode; // no hunk: inert only if unchanged
  const cache = new Map();
  for (const [code, n] of items) {
    if (!cache.has(code)) cache.set(code, { ranges: commentRanges(code), starts: lineStartOffsets(code) });
    const { ranges, starts } = cache.get(code);
    if (!lineIsComment(code, n, ranges, starts)) return false;
  }
  return true;
}
