// Gate 2: Semantic UI Diff from real JSX (the C1 contribution, static side).
//
// Parses .tsx files with the TypeScript compiler API, extracts a list of
// semantic UI nodes (interactive/visible elements with their stable signal:
// tag, text, onClick handler, testid, role-ish attrs), then diffs two
// versions into ADD / MODIFY / REMOVE with field-level changes.
//
// Usage:
//   node uidiff.mjs extract <file.tsx>
//   node uidiff.mjs diff <old.tsx> <new.tsx>

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

// resolve the repo's local typescript
const require = createRequire(path.join(process.cwd(), 'cand_coverage', 'package.json'));
const ts = require('typescript');

const INTERESTING = new Set(['button', 'a', 'input', 'select', 'textarea', 'form', 'label']);

function jsxName(node) {
  const t = node.tagName ?? node.openingElement?.tagName;
  return t ? t.getText() : '';
}

function attrText(attr) {
  if (!attr.initializer) return true; // boolean attr
  const init = attr.initializer;
  if (ts.isStringLiteral(init)) return init.text;
  if (ts.isJsxExpression(init) && init.expression) return init.expression.getText();
  return init.getText();
}

function collectAttrs(opening) {
  const out = {};
  for (const p of opening.attributes.properties) {
    if (ts.isJsxAttribute(p)) out[p.name.getText()] = attrText(p);
  }
  return out;
}

function directText(node) {
  // immediate JSX text children (trimmed), ignoring nested elements
  let txt = '';
  const children = node.children || [];
  for (const c of children) {
    if (ts.isJsxText(c)) txt += c.text;
    else if (ts.isJsxExpression(c) && c.expression) txt += `{${c.expression.getText()}}`;
  }
  return txt.replace(/\s+/g, ' ').trim();
}

function extract(file) {
  const code = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const nodes = [];
  function visit(node) {
    if (ts.isJsxElement(node)) {
      const tag = jsxName(node).toLowerCase();
      if (INTERESTING.has(tag)) {
        const a = collectAttrs(node.openingElement);
        const line = sf.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        nodes.push({
          tag,
          text: directText(node),
          onClick: a.onClick || null,
          onSubmit: a.onSubmit || null,
          testId: a['data-testid'] || a['data-test-id'] || null,
          ariaLabel: a['aria-label'] || null,
          role: a.role || null,
          href: a.href || null,
          name: a.name || null,
          line,
        });
      }
    } else if (ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText().toLowerCase();
      if (INTERESTING.has(tag)) {
        const a = collectAttrs(node);
        const line = sf.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        nodes.push({
          tag, text: '', onClick: a.onClick || null, onSubmit: a.onSubmit || null,
          testId: a['data-testid'] || null, ariaLabel: a['aria-label'] || null,
          role: a.role || null, href: a.href || null, name: a.name || null, line,
        });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return nodes;
}

// stable identity key for matching nodes across versions:
// prefer testId, else aria-label, else tag+text, else tag+onClick
function keyOf(n) {
  if (n.testId) return `testid:${n.testId}`;
  if (n.ariaLabel) return `aria:${n.ariaLabel}`;
  if (n.text) return `${n.tag}:text:${n.text}`;
  if (n.onClick) return `${n.tag}:onClick:${n.onClick}`;
  return `${n.tag}@${n.line}`;
}

function diffFields(o, n) {
  const fields = ['text', 'onClick', 'onSubmit', 'testId', 'ariaLabel', 'role', 'href', 'name'];
  const changes = {};
  for (const f of fields) if ((o[f] || null) !== (n[f] || null)) changes[f] = { from: o[f] || null, to: n[f] || null };
  return changes;
}

function semanticDiff(oldFile, newFile) {
  const oldN = extract(oldFile), newN = extract(newFile);
  const oldMap = new Map(oldN.map((n) => [keyOf(n), n]));
  const newMap = new Map(newN.map((n) => [keyOf(n), n]));

  const result = { ADD: [], REMOVE: [], MODIFY: [] };

  // first pass: exact-key matches
  for (const [k, n] of newMap) {
    if (oldMap.has(k)) {
      const ch = diffFields(oldMap.get(k), n);
      if (Object.keys(ch).length) result.MODIFY.push({ key: k, line: n.line, changes: ch });
      oldMap.delete(k);
      newMap.delete(k);
    }
  }
  // second pass: match leftovers by structural similarity (same tag + same onClick OR same testId)
  for (const [nk, n] of [...newMap]) {
    let matchKey = null;
    for (const [ok, o] of oldMap) {
      const sameHandler = o.onClick && o.onClick === n.onClick;
      const sameTag = o.tag === n.tag;
      if (sameTag && (sameHandler || (o.testId && o.testId === n.testId))) { matchKey = ok; break; }
    }
    if (matchKey) {
      const o = oldMap.get(matchKey);
      const ch = diffFields(o, n);
      result.MODIFY.push({ key: nk, matchedOld: matchKey, line: n.line, changes: ch });
      oldMap.delete(matchKey); newMap.delete(nk);
    }
  }
  for (const [, n] of newMap) result.ADD.push({ key: keyOf(n), node: n });
  for (const [, o] of oldMap) result.REMOVE.push({ key: keyOf(o), node: o });
  return result;
}

const cmd = process.argv[2];
if (cmd === 'extract') {
  console.log(JSON.stringify(extract(process.argv[3]), null, 2));
} else if (cmd === 'diff') {
  console.log(JSON.stringify(semanticDiff(process.argv[3], process.argv[4]), null, 2));
} else {
  console.error('usage: node uidiff.mjs extract <file> | diff <old> <new>');
  process.exit(2);
}
