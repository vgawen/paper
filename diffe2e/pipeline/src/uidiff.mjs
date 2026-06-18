// Semantic UI Diff from JSX/TSX via the TypeScript compiler API.
// Extracts interactive/visible nodes and diffs two versions into ADD/MODIFY/REMOVE.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const ts = require('typescript');

const INTERESTING = new Set(['button', 'a', 'input', 'select', 'textarea', 'form', 'label']);

function attrValue(attr) {
  if (!attr.initializer) return true;
  const init = attr.initializer;
  if (ts.isStringLiteral(init)) return init.text;
  if (ts.isJsxExpression(init) && init.expression) return init.expression.getText();
  return init.getText();
}

function collectAttrs(opening) {
  const out = {};
  for (const p of opening.attributes.properties) if (ts.isJsxAttribute(p)) out[p.name.getText()] = attrValue(p);
  return out;
}

function directText(node) {
  let txt = '';
  for (const c of node.children || []) {
    if (ts.isJsxText(c)) txt += c.text;
    else if (ts.isJsxExpression(c) && c.expression) txt += `{${c.expression.getText()}}`;
  }
  return txt.replace(/\s+/g, ' ').trim();
}

function nodeFrom(tag, a, line, text) {
  return {
    tag, text: text || '', onClick: a.onClick || null, onSubmit: a.onSubmit || null,
    testId: a['data-testid'] || a['data-test-id'] || null, ariaLabel: a['aria-label'] || null,
    role: a.role || null, href: a.href || null, name: a.name || null, line,
  };
}

export function extractFromCode(code, fileName = 'x.tsx') {
  const sf = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const nodes = [];
  function visit(node) {
    if (ts.isJsxElement(node)) {
      const tag = node.openingElement.tagName.getText().toLowerCase();
      if (INTERESTING.has(tag)) {
        const line = sf.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        nodes.push(nodeFrom(tag, collectAttrs(node.openingElement), line, directText(node)));
      }
    } else if (ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText().toLowerCase();
      if (INTERESTING.has(tag)) {
        const line = sf.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        nodes.push(nodeFrom(tag, collectAttrs(node), line, ''));
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return nodes;
}

export const extract = (file) => extractFromCode(fs.readFileSync(file, 'utf8'), file);

function keyOf(n) {
  if (n.testId) return `testid:${n.testId}`;
  if (n.ariaLabel) return `aria:${n.ariaLabel}`;
  if (n.text) return `${n.tag}:text:${n.text}`;
  if (n.onClick) return `${n.tag}:onClick:${n.onClick}`;
  return `${n.tag}@${n.line}`;
}

const FIELDS = ['text', 'onClick', 'onSubmit', 'testId', 'ariaLabel', 'role', 'href', 'name'];
function diffFields(o, n) {
  const ch = {};
  for (const f of FIELDS) if ((o[f] || null) !== (n[f] || null)) ch[f] = { from: o[f] || null, to: n[f] || null };
  return ch;
}

export function semanticDiffNodes(oldN, newN) {
  const oldMap = new Map(oldN.map((n) => [keyOf(n), n]));
  const newMap = new Map(newN.map((n) => [keyOf(n), n]));
  const result = { ADD: [], REMOVE: [], MODIFY: [] };
  for (const [k, n] of [...newMap]) {
    if (oldMap.has(k)) {
      const ch = diffFields(oldMap.get(k), n);
      if (Object.keys(ch).length) result.MODIFY.push({ key: k, line: n.line, changes: ch });
      oldMap.delete(k); newMap.delete(k);
    }
  }
  for (const [nk, n] of [...newMap]) {
    let match = null;
    for (const [ok, o] of oldMap) {
      const sameHandler = o.onClick && o.onClick === n.onClick;
      if (o.tag === n.tag && (sameHandler || (o.testId && o.testId === n.testId))) { match = ok; break; }
    }
    if (match) {
      result.MODIFY.push({ key: nk, matchedOld: match, line: n.line, changes: diffFields(oldMap.get(match), n) });
      oldMap.delete(match); newMap.delete(nk);
    }
  }
  for (const [, n] of newMap) result.ADD.push({ key: keyOf(n), node: n });
  for (const [, o] of oldMap) result.REMOVE.push({ key: keyOf(o), node: o });
  return result;
}

export const semanticDiff = (oldFile, newFile) => semanticDiffNodes(extract(oldFile), extract(newFile));
