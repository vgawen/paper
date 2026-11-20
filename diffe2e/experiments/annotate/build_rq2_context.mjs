// Build the RQ2 blind-annotation context: mapping + `gap_file` app diff.
//
// Reproducible: reads the two source JSONL files (in their original order),
// verifies each row against the existing main CSV, and records prev/sha.
// The main CSV (with annotator1_yn) is read-only; only the blind worksheet is
// rewritten, keeping each `## rq2_XXX` heading and its 判定 line.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { httpCompareDiff, splitDiff, truncateDiff, MAX_DIFF_LINES_RQ2 } from './annotation_ctx_lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const outDir = path.join(root, 'experiments', 'out');
const ctxDir = path.join(here, 'context');
const csvPath = path.join(outDir, 'rq2_real_to_annotate.csv');
const wsPath = path.join(outDir, 'rq2_annotator2_worksheet.md');

const SOURCES = [
  {
    project: 'actual_desktop',
    source: 'real_actual_rq2',
    repoName: 'actualbudget/actual',
    jsonl: path.join(outDir, 'real', 'actual_desktop_rq2_to_annotate.jsonl'),
    unblind: path.join(outDir, 'real', 'actual_desktop_rq2_unblind.json'),
  },
  {
    project: 'mermaid_live',
    source: 'real_mermaid_rq2',
    repoName: 'mermaid-js/mermaid-live-editor',
    jsonl: path.join(outDir, 'real', 'mermaid_live_rq2_to_annotate.jsonl'),
    unblind: path.join(outDir, 'real', 'mermaid_live_rq2_unblind.json'),
  },
];

function parseCSV(t) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  const h = rows.shift();
  return { headers: h, rows: rows.filter((r) => r.length === h.length).map((r) => Object.fromEntries(h.map((k, j) => [k, r[j]]))) };
}

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
}

function normalize(s) {
  return String(s ?? '').replace(/\r\n?/g, '\n');
}

const csv = parseCSV(fs.readFileSync(csvPath, 'utf8'));
if (csv.rows.length !== 30) throw new Error(`expected 30 rows in ${csvPath}, got ${csv.rows.length}`);

// Build the explicit case_id -> source/prev/sha mapping. Ordering follows the
// same source sequence used by make_rq2_real_sheet.mjs, but every row is
// cross-checked against the CSV text so a reordering would be caught, not
// silently mapped to the wrong commit.
const mapping = [];
let i = 0;
for (const src of SOURCES) {
  const rows = readJsonl(src.jsonl);
  const unblind = JSON.parse(fs.readFileSync(src.unblind, 'utf8'));
  for (const row of rows) {
    const caseId = `rq2_${String(++i).padStart(3, '0')}`;
    const key = unblind[row.case_id];
    if (!key) throw new Error(`no unblind entry for ${src.project}:${row.case_id}`);
    const csvRow = csv.rows[i - 1];
    if (csvRow.case_id !== caseId) throw new Error(`case_id mismatch at ${i}: csv=${csvRow.case_id} expected=${caseId}`);
    if (csvRow.gap_file !== row.gap_file || normalize(csvRow.spec) !== normalize(row.spec)) {
      throw new Error(`row mismatch for ${caseId}: csv does not match ${src.project}:${row.case_id}; refusing to guess`);
    }
    mapping.push({
      case_id: caseId,
      project: src.project,
      source: src.source,
      source_case_id: row.case_id,
      route: row.route,
      gap_file: row.gap_file,
      prev: key.prev,
      sha: key.sha,
    });
  }
}

if (mapping.length !== 30) throw new Error(`expected 30 mapped rows, got ${mapping.length}`);

// One diff per context (two specs share a context).
const contexts = new Map();
const problems = [];
for (const m of mapping) {
  const ctxKey = `${m.project}|${m.prev}|${m.sha}|${m.gap_file}`;
  if (contexts.has(ctxKey)) continue;
  const src = SOURCES.find((s) => s.project === m.project);
  let status = 'ok';
  let diff = null;
  let reason = '';
  try {
    const compare = await httpCompareDiff(src.repoName, m.prev, m.sha);
    const blocks = splitDiff(compare);
    const block = blocks.find((b) => b.path === m.gap_file);
    if (!block) {
      status = 'file_not_in_diff';
      reason = `compare diff 中找不到 ${m.gap_file}`;
    } else {
      diff = block.text;
      if (!diff.trim()) {
        status = 'empty_diff';
        reason = `${m.gap_file} 在 ${m.prev}..${m.sha} 无文本 diff`;
      }
    }
  } catch (e) {
    status = 'fetch_failed';
    reason = `compare diff 获取失败：${String(e.message || e).split('\n')[0]}`;
  }
  if (status !== 'ok') problems.push({ ...m, status, reason });
  contexts.set(ctxKey, {
    context_key: ctxKey,
    project: m.project,
    repo: src.repoName,
    prev: m.prev,
    sha: m.sha,
    gap_file: m.gap_file,
    source_mode: 'github_compare_two_dot',
    status,
    reason,
    diff_lines: diff ? diff.split('\n').length : 0,
    diff: diff || '',
  });
}

const rows = mapping.map((m) => {
  const key = `${m.project}|${m.prev}|${m.sha}|${m.gap_file}`;
  return { ...m, context_key: key };
});

fs.mkdirSync(ctxDir, { recursive: true });
const outJson = path.join(ctxDir, 'rq2_context.json');
fs.writeFileSync(outJson, JSON.stringify({
  generated_for: 'RQ2 second annotator (Plan B)',
  source_csv: path.relative(root, csvPath),
  contexts: [...contexts.values()],
  rows,
  problems,
}, null, 2) + '\n');

// ---- rewrite the blind worksheet, preserving headings and 判定 lines ----
const existing = fs.readFileSync(wsPath, 'utf8');
const headRe = /^## (rq2_\d+)[^\n]*$/gm;
const first = existing.search(headRe);
let intro = first >= 0 ? existing.slice(0, first) : existing;
intro = intro.replace('每条看三样：`gap_file`（本次改的文件）、`route`（项目/页面上下文）、`spec`（生成出来的测试）。',
  '每条看四样：`gap_file`（本次改的文件）、`route`（项目/页面上下文）、**应用源码 diff**（本次变更的实际代码改动，已排除测试文件）、`spec`（生成出来的测试）。');
const stopLine = '应用源码 diff 缺失时，不要凭文件名猜变更内容，停下来问协调者。';
intro = intro.split(stopLine).join('').replace(/\n{3,}/g, '\n\n');
intro = intro.replace('**不需要跑测试。**', `${stopLine}\n\n**不需要跑测试。**`);

const lines = [];
for (const m of rows) {
  const ctx = contexts.get(m.context_key);
  let body = `## ${m.case_id}\n\n- 变更文件：\`${m.gap_file}\`\n- 变更上下文：\`${m.route}\`\n\n`;
  body += '### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）\n\n';
  if (ctx.status === 'ok') {
    const t = truncateDiff(ctx.diff, MAX_DIFF_LINES_RQ2, '应用 diff');
    body += '```diff\n' + t.text.replace(/\n$/, '') + '\n```\n';
    if (t.truncated) body += `\n> 注：diff 已截断（原始 ${t.originalLines} 行，仅显示前 ${t.lines} 行）。\n`;
  } else {
    body += `_（未取得：${ctx.reason}）_\n`;
  }
  body += `\n### 生成出来的测试\n\n\`\`\`ts\n${normalize(csv.rows.find((r) => r.case_id === m.case_id).spec).replace(/\n$/, '')}\n\`\`\`\n\n`;
  const old = existing.match(new RegExp(`^## ${m.case_id}[^\\n]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'));
  const judge = old ? (old[1].match(/^判定：.*$/m) || [])[0] : null;
  body += (judge || '判定：`annotator2_yn=___`') + '\n\n---\n\n';
  lines.push(body);
}

fs.writeFileSync(wsPath, intro + lines.join(''));
const okCount = contexts.size - problems.length;
console.log(`rq2 contexts=${contexts.size} ok=${okCount} problems=${problems.length}`);
console.log(`wrote ${path.relative(root, outJson)} and ${path.relative(root, wsPath)}`);
if (problems.length) for (const p of problems) console.log(`PROBLEM ${p.case_id} ${p.status}: ${p.reason}`);
