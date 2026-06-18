// Map changed line numbers in a TS/TSX file to the enclosing function / JSX entities.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const ts = require('typescript');

// Returns entities (functions / arrow-bound consts / JSX elements) whose source
// span contains any of the changed lines; innermost-first is preserved by depth.
export function changedEntitiesFromCode(code, changedLines, fileName = 'x.tsx') {
  const sf = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const changed = new Set(changedLines);
  const hits = [];
  function lineOf(pos) { return sf.getLineAndCharacterOfPosition(pos).line + 1; }
  function spanContainsChange(node) {
    const a = lineOf(node.getStart()), b = lineOf(node.getEnd());
    for (const l of changed) if (l >= a && l <= b) return true;
    return false;
  }
  function nameOf(node) {
    if (ts.isFunctionDeclaration(node) && node.name) return node.name.getText();
    if (ts.isVariableDeclaration(node) && node.name) return node.name.getText();
    if (ts.isMethodDeclaration(node) && node.name) return node.name.getText();
    return null;
  }
  function visit(node, depth) {
    if ((ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node) ||
         ts.isMethodDeclaration(node) || ts.isVariableDeclaration(node)) && spanContainsChange(node)) {
      const nm = nameOf(node) || (node.parent && ts.isVariableDeclaration(node.parent) ? node.parent.name.getText() : null);
      if (nm) hits.push({ kind: 'function', name: nm, depth, line: lineOf(node.getStart()) });
    }
    if (ts.isJsxElement(node) && spanContainsChange(node)) {
      hits.push({ kind: 'jsx', tag: node.openingElement.tagName.getText(), depth, line: lineOf(node.getStart()) });
    }
    ts.forEachChild(node, (c) => visit(c, depth + 1));
  }
  visit(sf, 0);
  // innermost (deepest) first
  return hits.sort((a, b) => b.depth - a.depth);
}

export const changedEntities = (file, changedLines) =>
  changedEntitiesFromCode(fs.readFileSync(file, 'utf8'), changedLines, file);
