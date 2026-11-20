// Shared helpers for building the blind-annotation context (Plan B).
//
// Inputs are ALWAYS application-source diffs (test files excluded) plus the
// OLD test file. The NEW test file is read only to derive an assertion-level
// diff whose locator arguments are redacted; it must never be emitted raw.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const CACHE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'cache', 'http');

// Caps are high enough that the real cases are emitted in full; the truncation
// helper stays for pathological diffs.
export const MAX_DIFF_LINES_RQ2 = 10000;
export const MAX_DIFF_LINES_RQ3 = 10000;

export function git(repo, args, opts = {}) {
  return execFileSync('git', args, {
    cwd: repo,
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    ...opts,
  });
}

export function gitShow(repo, ref, file) {
  try {
    return git(repo, ['show', `${ref}:${file}`]);
  } catch {
    return null;
  }
}

export function gitDiff(repo, from, to, paths, unified = 3) {
  if (!paths.length) return '';
  try {
    return git(repo, ['diff', '--no-color', '--no-ext-diff', `-U${unified}`, from, to, '--', ...paths]);
  } catch {
    return null;
  }
}

export function changedFiles(repo, from, to) {
  try {
    return git(repo, ['diff', '--name-only', from, to]).split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    return null;
  }
}

// Same guard as realproj/reprobreak_e2e.mjs, plus .e2e. / .cy. conventions.
export function isTestPath(f, testFile) {
  return f === testFile
    || /(\.spec\.|\.test\.|\.e2e\.|\.cy\.|(^|\/)(tests?|e2e|cypress|__tests__)\/)/i.test(f);
}

export const APP_DIFF_EXT = /\.(t|j)sx?$|\.vue$|\.svelte$|\.html?$|\.css$|\.scss$|\.less$|\.json$/i;
export const LOCKFILE = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|npm-shrinkwrap\.json)$/i;

// ---------------------------------------------------------------------------
// old test block extraction
// ---------------------------------------------------------------------------

function skipString(text, i) {
  const q = text[i];
  i++;
  while (i < text.length) {
    if (text[i] === '\\') { i += 2; continue; }
    if (text[i] === q) return i + 1;
    i++;
  }
  return i;
}

function findMatchingParen(text, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < text.length;) {
    const c = text[i];
    if (c === '"' || c === "'" || c === '`') { i = skipString(text, i); continue; }
    if (c === '/' && text[i + 1] === '/') {
      const nl = text.indexOf('\n', i + 2);
      if (nl < 0) return -1;
      i = nl + 1;
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      if (end < 0) return -1;
      i = end + 2;
      continue;
    }
    if (c === '(') depth++;
    else if (c === ')') {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}

const TEST_CALL = /(^|[^\w$.])(it|test)(\.(only|skip|fixme|todo))?\s*\(/;

// Extract the complete `it(...)` / `test(...)` block that encloses `lineNo`
// (1-based) from the full old test file. Falls back to a +/-150 line window and
// says so, rather than pretending the window is the whole block.
export function extractTestBlock(text, lineNo) {
  const lines = text.split('\n');
  const lineStarts = [];
  let acc = 0;
  for (const l of lines) { lineStarts.push(acc); acc += l.length + 1; }

  let startLine = -1;
  let callOpen = -1;
  for (let i = 0; i < Math.min(lineNo, lines.length); i++) {
    const m = TEST_CALL.exec(lines[i]);
    if (!m) continue;
    startLine = i;
    const openRel = lines[i].indexOf('(', m.index + m[0].length - 1);
    if (openRel >= 0) callOpen = lineStarts[i] + openRel;
  }

  if (startLine >= 0 && callOpen >= 0) {
    const close = findMatchingParen(text, callOpen);
    if (close >= 0) {
      const block = text.slice(lineStarts[startLine], close + 1);
      return {
        text: block,
        method: 'block',
        start_line: startLine + 1,
        end_line: lineNoFromOffset(lineStarts, close + 1),
        line_count: block.split('\n').length,
      };
    }
  }

  const from = Math.max(0, lineNo - 1 - 150);
  const to = Math.min(lines.length, lineNo + 150);
  const block = lines.slice(from, to).join('\n');
  return {
    text: block,
    method: 'window',
    start_line: from + 1,
    end_line: to,
    line_count: block.split('\n').length,
  };
}

function lineNoFromOffset(starts, offset) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (starts[mid] <= offset) lo = mid; else hi = mid - 1;
  }
  return lo + 1;
}

// ---------------------------------------------------------------------------
// assertion-level test diff + locator redaction
// ---------------------------------------------------------------------------

export const ASSERTION_RE = /\b(expect|assert|should|shouldBe|shouldHave|toBe|toEqual|toContain|toHave|toMatch|toExist|toThrow|toReturn)\b/;

const LOCATOR_CALL_RE = /(?:^|[^\w$])((?:cy|page|browser|screen|driver|document|element|expect)\s*(?:\.\s*[A-Za-z_$][\w$]*)*\.\s*(?:locator|get|contains|find|getByTestId|getByText|getByRole|getByLabel|getByPlaceholder|getByAltText|getByTitle|querySelector|querySelectorAll|findElement|waitForSelector|element|elements)\s*)\(/g;
const DOLLAR_CALL_RE = /(?:^|[^\w$])((?:\$|\$\$)\s*)\(/g;
// Chained addressing calls after a locator, e.g. cy.get(...).find('.x').
const CHAIN_PATH_RE = /\.\s*(find|get|closest|children|parent|siblings|prev|next|eq)\s*\(/g;

// --- scheme-1 redaction: mask mechanical paths, keep semantic anchors -------
//
// Author decision (2026-11-08): the redaction target is the *addressing path*,
// not the semantic anchor. A string that says WHAT the assertion targets is
// kept; a string that only says HOW to find it is replaced by
// <LOCATOR_REDACTED>. Consequently the semantic part of the new locator is
// visible to the annotator by design.
//
//   mask: CSS selectors, id/class, data-testid / data-* values, nth()/first()/
//         last() indexes, xpath, page.$-style selector strings, and path
//         fragments inside the new locator.
//   keep: getByRole role + accessible name, getByText / getByLabel /
//         getByPlaceholder / getByAltText / getByTitle text, filter({hasText})
//         text, assertion expected values and matchers outside locator calls.
//   mixed expression (e.g. getByRole('button', { name: 'Snippet' })): keep role
//         and name, mask the rest.

function topLevelParts(s) {
  const parts = [];
  let depth = 0;
  let start = 0;
  const text = String(s || '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'" || c === '`') { i = skipString(text, i) - 1; continue; }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if (c === ',' && depth === 0) { parts.push(text.slice(start, i)); start = i + 1; }
  }
  parts.push(text.slice(start));
  return parts;
}

function stringSpans(s) {
  const spans = [];
  const text = String(s || '');
  for (let i = 0; i < text.length; i++) {
    const q = text[i];
    if (q !== '"' && q !== "'" && q !== '`') continue;
    const start = i;
    i++;
    while (i < text.length) {
      if (text[i] === '\\') { i += 2; continue; }
      if (text[i] === q) break;
      i++;
    }
    spans.push({ start, end: i, quote: q, value: text.slice(start + 1, i) });
  }
  return spans;
}

function maskSpans(s, spans) {
  let out = String(s || '');
  for (const sp of spans.slice().sort((a, b) => b.start - a.start)) {
    // Keep the quotes so the expression stays readable; the content is masked.
    out = out.slice(0, sp.start) + sp.quote + '<LOCATOR_REDACTED>' + sp.quote + out.slice(sp.end + 1);
  }
  return out;
}

function maskAllStrings(s) {
  return maskSpans(s, stringSpans(s));
}

function literalOf(s) {
  // Use the string scanner (not a naive regex) so selectors that themselves
  // contain quotes, e.g. [data-x="y"], are captured whole.
  const sp = stringSpans(s)[0];
  return sp ? sp.value : null;
}

function apiNameOf(callPart) {
  const m = /\.\s*([A-Za-z_$][\w$]*)\s*$/.exec(callPart);
  if (m) return m[1];
  const d = /(\$+)\s*$/.exec(callPart);
  return d ? d[1] : '';
}

// Mechanical APIs whose first argument is an addressing path.
const FIRST_ARG_IS_PATH = new Set([
  'locator', 'get', 'find', 'getByTestId', 'querySelector', 'querySelectorAll',
  'waitForSelector', 'element', 'elements', '$', '$$', 'findElement',
]);
// Text-based APIs whose first argument is a semantic anchor.
const FIRST_ARG_IS_TEXT = new Set([
  'getByText', 'getByLabel', 'getByPlaceholder', 'getByAltText', 'getByTitle',
]);

function redactArgs(api, args) {
  const parts = topLevelParts(args);
  if (api === 'contains') {
    // Cypress: contains(text) keeps text; contains(selector, text) masks path.
    if (parts.length >= 2) return [maskAllStrings(parts[0]), ...parts.slice(1)].join(',');
    return args;
  }
  if (api === 'getByRole' || FIRST_ARG_IS_TEXT.has(api)) {
    // Keep role / name / text (semantic anchors); options are left untouched.
    return args;
  }
  if (FIRST_ARG_IS_PATH.has(api)) {
    const masked = maskAllStrings(parts[0]);
    return [masked, ...parts.slice(1)].join(',');
  }
  return args;
}

// Replace mechanical addressing arguments with <LOCATOR_REDACTED>; keep API
// names and semantic anchors (role / name / text) intact.
export function redactLocatorCalls(line) {
  let text = String(line);
  const matches = [];
  for (const re of [LOCATOR_CALL_RE, DOLLAR_CALL_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) matches.push({ index: m.index, openRel: m[0].length - 1 });
  }
  // Edit argument lists from right to left so earlier indices stay valid.
  matches.sort((a, b) => b.index - a.index);
  for (const hit of matches) {
    const open = hit.index + hit.openRel;
    const close = findMatchingParen(text, open);
    if (close < 0) continue;
    const callPart = text.slice(hit.index + (hit.index ? 1 : 0), open);
    const args = text.slice(open + 1, close);
    const api = apiNameOf(callPart);
    const newArgs = redactArgs(api, args);
    text = text.slice(0, open + 1) + newArgs + text.slice(close);
  }
  // Chained addressing calls (e.g. cy.get(...).find('.x')) need their own pass:
  // the base-call regex only matches calls rooted at cy/page/....
  const chainMatches = [];
  CHAIN_PATH_RE.lastIndex = 0;
  let cm;
  while ((cm = CHAIN_PATH_RE.exec(text))) {
    chainMatches.push({ index: cm.index, openRel: cm[0].length - 1, api: cm[1] });
  }
  chainMatches.sort((a, b) => b.index - a.index);
  for (const hit of chainMatches) {
    const open = hit.index + hit.openRel;
    const close = findMatchingParen(text, open);
    if (close < 0) continue;
    const args = text.slice(open + 1, close);
    if (hit.api === 'eq') {
      text = text.slice(0, open + 1) + '<LOCATOR_REDACTED>' + text.slice(close);
      continue;
    }
    const parts = topLevelParts(args);
    text = text.slice(0, open + 1)
      + [maskAllStrings(parts[0]), ...parts.slice(1)].join(',')
      + text.slice(close);
  }
  // nth()/first()/last() are index addressing; mask the whole chained call.
  text = text.replace(/\.\s*(?:nth|first|last)\s*\([^()]*\)/g, '.<LOCATOR_REDACTED>');
  return text;
}

// When a -/+ pair differs only inside the locator, redacting both sides to the
// same descriptor would make the two lines identical and hide the fact that the
// locator changed.  Mark the added side as <LOCATOR_CHANGED>: the reader sees
// "the locator changed" without seeing what it became.  Assertion values,
// matchers and role/name text outside locator calls are never touched.
const LOCATOR_MARKER_RE = /<LOCATOR_REDACTED>/;
const LOCATOR_MARKER_GLOBAL = /<LOCATOR_REDACTED>/g;

export function markLocatorChanged(lines) {
  const out = lines.slice();
  for (let i = 0; i < out.length;) {
    if (!out[i].startsWith('-') || out[i].startsWith('---')) { i++; continue; }
    let j = i;
    while (j < out.length && out[j].startsWith('-') && !out[j].startsWith('---')) j++;
    let k = j;
    while (k < out.length && out[k].startsWith('+') && !out[k].startsWith('+++')) k++;
    const n = Math.min(j - i, k - j);
    for (let t = 0; t < n; t++) {
      const a = out[i + t].slice(1);
      const b = out[j + t].slice(1);
      if (a === b && LOCATOR_MARKER_RE.test(b)) {
        out[j + t] = '+' + b.replace(LOCATOR_MARKER_GLOBAL, '<LOCATOR_CHANGED>');
      }
    }
    i = k > i ? k : i + 1;
  }
  return out;
}

// Build a diff of only added/removed assertion lines. Locator arguments inside
// those lines are redacted; non-assertion action lines are dropped entirely.
export function assertionDiff(repo, from, to, testFile) {
  const raw = gitDiff(repo, from, to, [testFile], 0);
  if (raw == null) return { text: null, reason: 'git diff failed', added: 0, removed: 0, hunks: 0 };
  const out = [];
  let buf = [];
  let added = 0;
  let removed = 0;
  let hunks = 0;
  const flush = () => {
    if (buf.length) { out.push(buf[0], ...buf.slice(1)); hunks++; }
    buf = [];
  };
  for (const line of raw.split('\n')) {
    if (line.startsWith('@@')) {
      flush();
      buf = [line];
      continue;
    }
    if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff --git') || line.startsWith('index ')) continue;
    if (line.startsWith('+') || line.startsWith('-')) {
      const body = line.slice(1);
      if (!ASSERTION_RE.test(body)) continue;
      const redacted = redactLocatorCalls(body).trim();
      buf.push(`${line[0]}${redacted}`);
      if (line[0] === '+') added++; else removed++;
    }
  }
  flush();
  if (!added && !removed) {
    return { text: '（本次提交未改动断言级代码；旧断言保持不变。）', added: 0, removed: 0, hunks: 0 };
  }

  return { text: markLocatorChanged(out).join('\n'), added, removed, hunks };
}

// ---------------------------------------------------------------------------
// non-reconstructability verification (scheme 1)
// ---------------------------------------------------------------------------
//
// Only the *mechanical addressing path* must be non-recoverable. Semantic
// anchors (role, accessible name, text, hasText) are allowed to be visible by
// protocol and are listed one by one with a reason, rather than waved through.

function norm(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

export function countHits(haystack, needle) {
  if (!needle) return 0;
  let n = 0;
  let i = 0;
  while ((i = haystack.indexOf(needle, i)) >= 0) { n++; i += Math.max(1, needle.length); }
  return n;
}

// Tokens are whole address chunks (hyphenated class / attribute names kept
// intact); generic CSS/HTML words are dropped so the token check does not fire
// on ordinary prose in commit messages or app diffs.
const TOKEN_STOP = new Set([
  'true', 'false', 'null', 'undefined', 'only', 'skip', 'data', 'aria',
  'testid', 'test-id', 'state', 'attached', 'detached', 'visible', 'hidden',
  'selected', 'class', 'value', 'name', 'role', 'type', 'div', 'span',
  'input', 'button', 'label', 'text', 'page', 'locator', 'first', 'last',
  'nth', 'element', 'elements', 'menu', 'header', 'content', 'container',
  'wrapper', 'root', 'item', 'list', 'area', 'toolbar', 'cell', 'row', 'col',
]);

export function identifierTokens(value) {
  const chunks = String(value || '').split(/[^A-Za-z0-9_-]+/).filter(Boolean);
  const out = new Set();
  for (const c of chunks) {
    if (c.length < 4) continue;
    if (TOKEN_STOP.has(c.toLowerCase())) continue;
    out.add(c);
  }
  return [...out];
}

// Classify a locator expression into mechanical addressing fragments (must be
// masked) and semantic anchors (allowed to be visible).
export function analyzeLocator(locator) {
  const text = String(locator || '');
  const mechanical = [];
  const semantic = [];
  let found = false;

  const re = new RegExp(LOCATOR_CALL_RE.source, 'g');
  let m;
  while ((m = re.exec(text))) {
    const open = m.index + m[0].length - 1;
    const close = findMatchingParen(text, open);
    if (close < 0) continue;
    const callPart = text.slice(m.index + (m.index ? 1 : 0), open);
    const api = apiNameOf(callPart);
    const parts = topLevelParts(text.slice(open + 1, close));
    classifyCall(api, parts, mechanical, semantic);
    found = true;
    re.lastIndex = close + 1;
  }

  const chainRe = new RegExp(CHAIN_PATH_RE.source, 'g');
  for (const cm of text.matchAll(chainRe)) {
    const open = cm.index + cm[0].length - 1;
    const close = findMatchingParen(text, open);
    if (close < 0) continue;
    const args = text.slice(open + 1, close);
    if (cm[1] === 'eq') {
      mechanical.push({ kind: 'index', value: args.trim(), reason: 'eq 是索引寻址，只说明怎么找到目标' });
      continue;
    }
    const sel = literalOf(topLevelParts(args)[0]);
    if (sel) mechanical.push({ kind: 'selector', value: sel, reason: `链式 ${cm[1]} 的首参是寻址路径，按协议遮蔽` });
  }

  for (const fm of text.matchAll(/\.\s*filter\s*\(/g)) {
    const open = fm.index + fm[0].length - 1;
    const close = findMatchingParen(text, open);
    if (close < 0) continue;
    classifyOptions(text.slice(open + 1, close), mechanical, semantic);
  }

  for (const nm of text.matchAll(/\.\s*(nth|first|last)\s*\(([^()]*)\)/g)) {
    mechanical.push({ kind: 'index', value: (nm[2] || '').trim() || nm[1], reason: 'nth/first/last 是索引寻址，只说明怎么找到目标' });
    found = true;
  }

  if (!found && !mechanical.length && text.trim()) {
    const sel = literalOf(text) || text.trim();
    mechanical.push({ kind: 'selector', value: sel, reason: '未识别出定位 API，按整段选择器路径处理' });
  }
  const seen = new Set();
  const deduped = mechanical.filter((m) => {
    const key = `${m.kind}|${m.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { mechanical: deduped, semantic };
}

function classifyCall(api, parts, mechanical, semantic) {
  if (api === 'getByRole') {
    const role = literalOf(parts[0]);
    if (role) semantic.push({ kind: 'role', value: role, reason: 'getByRole 的 role 说明目标元素的语义类型（是什么），按协议保留' });
    const rest = parts.slice(1).join(',');
    const nameM = /name\s*:\s*['"`]([^'"`]*)['"`]/.exec(rest);
    if (nameM) semantic.push({ kind: 'name', value: nameM[1], reason: 'getByRole 的 name 是可访问名称，说明断言对象是什么，按协议保留' });
    classifyOptions(nameM ? rest.replace(nameM[0], '') : rest, mechanical, semantic);
    return;
  }
  if (api === 'contains') {
    if (parts.length >= 2) {
      const sel = literalOf(parts[0]);
      if (sel) mechanical.push({ kind: 'selector', value: sel, reason: 'contains 的第一个参数是选择器路径' });
      const t = literalOf(parts[1]);
      if (t) semantic.push({ kind: 'text', value: t, reason: 'contains 的文本参数是断言语义内容，按协议保留' });
    } else {
      const t = literalOf(parts[0]);
      if (t) semantic.push({ kind: 'text', value: t, reason: 'contains 的文本参数是断言语义内容，按协议保留' });
    }
    return;
  }
  if (FIRST_ARG_IS_TEXT.has(api)) {
    const t = literalOf(parts[0]);
    if (t) semantic.push({ kind: 'text', value: t, reason: `${api} 的文本是断言目标的语义内容，按协议保留` });
    classifyOptions(parts.slice(1).join(','), mechanical, semantic);
    return;
  }
  if (FIRST_ARG_IS_PATH.has(api)) {
    const sel = literalOf(parts[0]);
    if (sel) mechanical.push({ kind: api === 'getByTestId' ? 'testid' : 'selector', value: sel, reason: `${api} 的首参是寻址路径（CSS/id/class/data-* /xpath），按协议遮蔽` });
    classifyOptions(parts.slice(1).join(','), mechanical, semantic);
    return;
  }
  classifyOptions(parts.join(','), mechanical, semantic);
}

function classifyOptions(opt, mechanical, semantic) {
  const text = String(opt || '');
  const keepValues = new Set();
  for (const hm of text.matchAll(/(hasText|hasNotText)\s*:\s*['"`]([^'"`]*)['"`]/g)) {
    keepValues.add(hm[2]);
    semantic.push({ kind: hm[1], value: hm[2], reason: 'filter/options 的 hasText 是目标文本锚点，说明断言对象内容，按协议保留' });
  }
  for (const sp of stringSpans(text)) {
    if (keepValues.has(sp.value)) continue;
    mechanical.push({ kind: 'option', value: sp.value, reason: '定位参数中的非语义字符串，按寻址路径遮蔽' });
  }
}

// Semantic anchors actually visible in the distributed redacted assertion diff.
export function visibleSemanticAnchors(text) {
  const map = new Map();
  const add = (kind, value, reason) => {
    if (!value) return;
    const key = `${kind}=${value}`;
    if (!map.has(key)) map.set(key, { kind, value, reason, count: 0 });
    map.get(key).count++;
  };
  const t = String(text || '');
  for (const m of t.matchAll(/getByRole\s*\(\s*['"`]([^'"`]*)['"`]/g)) {
    add('role', m[1], 'getByRole 的 role 说明目标元素的语义类型（是什么），按协议允许可见');
  }
  for (const m of t.matchAll(/getByRole\s*\(\s*['"`][^'"`]*['"`]\s*,\s*\{[^}]*?name\s*:\s*['"`]([^'"`]*)['"`]/g)) {
    add('name', m[1], 'getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见');
  }
  for (const m of t.matchAll(/(getByText|getByLabel|getByPlaceholder|getByAltText|getByTitle)\s*\(\s*['"`]([^'"`]*)['"`]/g)) {
    add(m[1], m[2], `${m[1]} 的文本是断言目标的语义内容，按协议允许可见`);
  }
  for (const m of t.matchAll(/(hasText|hasNotText)\s*:\s*['"`]([^'"`]*)['"`]/g)) {
    add(m[1], m[2], 'filter 的文本锚点说明断言对象内容，按协议允许可见');
  }
  return [...map.values()];
}

export function verifyRedaction({
  redactedText, newLocator, newTestPath, newTestAddedLines, redactedFullContext,
  allowedOldText = '', visibleOldText = '',
}) {
  const target = redactedText || '';
  const haystackAll = redactedFullContext || target;
  const visibleOld = visibleOldText || allowedOldText || '';
  // Old test / old block is legitimate disclosed input. Mechanical strings that
  // already appear there are not a new-locator leak; they are recorded separately.
  const contextNoOld = visibleOld ? haystackAll.split(visibleOld).join('\n') : haystackAll;
  const analysis = analyzeLocator(newLocator);
  const semanticValues = new Set(analysis.semantic.map((x) => x.value));

  const mechanicalChecks = analysis.mechanical.map((item) => {
    const value = String(item.value || '');
    const tokens = identifierTokens(value).filter((t) => !semanticValues.has(t));
    const checks = [
      { mode: 'exact', where: 'redacted_assertion_diff', hits: countHits(target, value) },
      { mode: 'exact', where: 'context_excluding_old', hits: countHits(contextNoOld, value) },
      { mode: 'whitespace_normalized', where: 'redacted_assertion_diff', hits: norm(value) ? countHits(norm(target), norm(value)) : 0 },
      ...tokens.flatMap((t) => [
        { mode: 'token', token: t, where: 'redacted_assertion_diff', hits: countHits(target, t) },
        { mode: 'token', token: t, where: 'context_excluding_old', hits: countHits(contextNoOld, t) },
      ]),
    ];
    // The leak criterion applies to the distributed assertion diff. Occurrences
    // elsewhere (app diff / commit / old block) are recorded for transparency:
    // app source legitimately contains class/testId/aria strings, and the old
    // locator is disclosed input by protocol.
    const leaks = checks.filter((c) => c.hits > 0 && c.where === 'redacted_assertion_diff');
    const contextOccurrences = checks.filter((c) => c.hits > 0 && c.where === 'context_excluding_old');
    return {
      kind: item.kind,
      value,
      reason: item.reason,
      tokens,
      checks,
      leaked: leaks.length > 0,
      context_occurrences: contextOccurrences,
      visible_in_old_input: countHits(visibleOld, value) > 0,
    };
  });

  const mechanicalLeaks = mechanicalChecks.filter((c) => c.leaked);
  // A new-test non-assertion line must not appear; identical old lines are fine.
  const newTestLineCandidates = (newTestAddedLines || []).filter((l) => {
    const t = l.trim();
    return t.length >= 12 && haystackAll.includes(t);
  });
  const newTestLineHits = newTestLineCandidates.filter((l) => !String(allowedOldText || '').includes(l.trim()));
  const newTestLineAlreadyInOld = newTestLineCandidates.length - newTestLineHits.length;
  // Mechanical APIs must no longer carry a literal selector argument.
  const mechSyntaxRe = /\.\s*(?:locator|get|find|getByTestId|querySelector|querySelectorAll|waitForSelector|findElement)\s*\(\s*['"`](?!<LOCATOR_(?:REDACTED|CHANGED)>)/g;
  const dollarSyntaxRe = /(?:^|[^\w$])\$\$?\s*\(\s*['"`](?!<LOCATOR_(?:REDACTED|CHANGED)>)/g;
  const syntaxHits = [
    ...[...target.matchAll(mechSyntaxRe)].map((m) => m[0]),
    ...[...target.matchAll(dollarSyntaxRe)].map((m) => m[0]),
  ];
  const pathHits = countHits(haystackAll, newTestPath);
  const pass = mechanicalLeaks.length === 0 && newTestLineHits.length === 0 && syntaxHits.length === 0;
  return {
    rule: 'mask_mechanical_paths_keep_semantic_anchors',
    mechanical_checks: mechanicalChecks,
    mechanical_leaks: mechanicalLeaks,
    semantic_anchors_in_locator: analysis.semantic,
    semantic_anchors_visible: visibleSemanticAnchors(target),
    new_test_line_hits: newTestLineHits,
    new_test_line_already_in_old: newTestLineAlreadyInOld,
    locator_syntax_hits: syntaxHits,
    path_hits: pathHits,
    pass,
  };
}

export function truncateDiff(text, maxLines, label) {
  if (!text) return { text: '', lines: 0, truncated: false, originalLines: 0 };
  const lines = text.split('\n');
  if (lines.length <= maxLines) return { text, lines: lines.length, truncated: false, originalLines: lines.length };
  return {
    text: lines.slice(0, maxLines).join('\n') + `\n[... ${label} 截断：原始 ${lines.length} 行，仅显示前 ${maxLines} 行 ...]`,
    lines: maxLines,
    truncated: true,
    originalLines: lines.length,
  };
}

export function sha256(text) {
  // Node crypto is overkill for provenance; keep a stable string hash for
  // in-process records. The packet-level sha256 is computed with shasum.
  let h = 0x811c9dc5;
  for (const ch of String(text)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

// ---------------------------------------------------------------------------
// GitHub HTTP source (used when a clone cannot be completed / read reliably)
// ---------------------------------------------------------------------------
// Content is fetched from public endpoints and cached under annotate/cache/http.
// The compare URL uses two-dot (`prev..sha`) so it equals `git diff prev sha`
// even when `prev` is not an ancestor of `sha` (ReproBreak's previous_sha is
// not always the parent commit).

export async function httpGet(url, { retries = 6, timeoutMs = 90000 } = {}) {
  const key = crypto.createHash('sha256').update(url).digest('hex');
  const file = path.join(CACHE_DIR, `${key}.txt`);
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  let lastErr = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // curl honours HTTPS_PROXY/HTTP_PROXY in this environment; Node's fetch
      // does not, and direct github.com connections reset intermittently.
      const text = execFileSync('curl', ['-sSL', '--fail', '--max-time', String(Math.round(timeoutMs / 1000)), url], {
        encoding: 'utf8',
        maxBuffer: 128 * 1024 * 1024,
        env: process.env,
      });
      if (!text || text.length < 1) throw new Error(`empty response ${url}`);
      fs.writeFileSync(file, text);
      return text;
    } catch (e) {
      lastErr = e;
      if (attempt < retries) await new Promise((r) => setTimeout(r, Math.min(30000, 1000 * attempt * attempt)));
    }
  }
  throw lastErr;
}

export async function httpCompareDiff(repo, prev, sha) {
  return httpGet(`https://github.com/${repo}/compare/${prev}..${sha}.diff`);
}

export async function httpRaw(repo, sha, filePath) {
  const enc = filePath.split('/').map(encodeURIComponent).join('/');
  return httpGet(`https://raw.githubusercontent.com/${repo}/${sha}/${enc}`);
}

function unfoldHeader(value) {
  return value.replace(/\n[ \t]+/g, ' ').trim();
}

// Parse the commit message out of a `.patch` file; the body before the first
// `diff --git` marker. Returns { subject, body }.
export function parsePatchMessage(patch) {
  const start = patch.indexOf('\ndiff --git ');
  const head = start >= 0 ? patch.slice(0, start) : patch;
  const blank = head.indexOf('\n\n');
  const headerPart = blank >= 0 ? head.slice(0, blank) : head;
  const bodyPart = blank >= 0 ? head.slice(blank + 2) : '';
  const m = /^Subject:\s*\[PATCH\][ \t]*([\s\S]*)/m.exec(headerPart);
  const subject = m ? unfoldHeader(m[1]) : '';
  return { subject, body: bodyPart.trim() };
}

export async function httpCommitMessage(repo, sha) {
  const patch = await httpGet(`https://github.com/${repo}/commit/${sha}.patch`);
  return parsePatchMessage(patch);
}

// Split a unified diff into per-file blocks keyed by the `diff --git` header.
export function splitDiff(diffText) {
  const blocks = [];
  const lines = String(diffText || '').split('\n');
  let cur = null;
  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      if (cur) blocks.push(cur);
      const m = /^diff --git a\/(.*?) b\/(.*)$/.exec(line);
      cur = { path: m ? m[2] : '', text: [line] };
    } else if (cur) {
      cur.text.push(line);
    }
  }
  if (cur) blocks.push(cur);
  return blocks.map((b) => ({ path: b.path, text: b.text.join('\n') }));
}

export function diffPaths(diffText) {
  return splitDiff(diffText).map((b) => b.path);
}

export function joinDiffBlocks(blocks) {
  return blocks.map((b) => b.text).join('\n');
}

// Assertion-level diff from one test-file block. Locator args are redacted;
// non-assertion action lines are dropped.
export function assertionDiffFromBlock(blockText) {
  const out = [];
  let buf = [];
  let added = 0;
  let removed = 0;
  let hunks = 0;
  const flush = () => {
    if (buf.length) { out.push(...buf); hunks++; }
    buf = [];
  };
  for (const line of String(blockText || '').split('\n')) {
    if (line.startsWith('@@')) {
      flush();
      buf = [line];
      continue;
    }
    if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff --git') || line.startsWith('index ')) continue;
    if (line.startsWith('+') || line.startsWith('-')) {
      const body = line.slice(1);
      if (!ASSERTION_RE.test(body)) continue;
      const redacted = redactLocatorCalls(body).trim();
      buf.push(`${line[0]}${redacted}`);
      if (line[0] === '+') added++; else removed++;
    }
  }
  flush();
  if (!added && !removed) {
    return { text: '（本次提交未改动断言级代码；旧断言保持不变。）', added: 0, removed: 0, hunks: 0 };
  }
  return { text: markLocatorChanged(out).join('\n'), added, removed, hunks };
}

export function addedNonAssertionLines(blockText) {
  return String(blockText || '').split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .map((l) => l.slice(1))
    .filter((l) => !ASSERTION_RE.test(l))
    .map((l) => l.trim())
    .filter((l) => l.length >= 12)
    .slice(0, 200);
}
