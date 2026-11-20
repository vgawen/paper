// Build the approximate "original information condition" (condition A) material.
//
// A is a RECONSTRUCTION, not the original artifact. The original pre-label left
// no prompt, no model record and no material snapshot, so several dimensions
// cannot be restored. Every such dimension is listed in the manifest's
// `known_deviations`; nothing here is presented as the original file.
//
//   node experiments/annotate/build_condA_material.mjs
//
// RQ2 case = route + gap_file + spec (no application-source diff).
// RQ3 case = old_locator + old test line + commit message + app changed-file
//            list + unredacted assertion-level diff + new_locator (no full it block).
//
// Outputs:
//   out/condA_material/rq2_condA.md
//   out/condA_material/rq3_condA.md
//   out/condA_material/condA_material_manifest.json
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  ASSERTION_RE, httpCompareDiff, httpRaw, splitDiff,
} from './annotation_ctx_lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const outDir = path.join(root, 'experiments', 'out');
const condADir = path.join(outDir, 'condA_material');
const RQ2_CSV = path.join(outDir, 'rq2_real_to_annotate.csv');
const RQ3_CTX = path.join(here, 'context', 'rq3_context.json');

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift() || [];
  const objects = rows
    .filter((r) => r.length === headers.length)
    .map((r) => Object.fromEntries(headers.map((h, j) => [h, r[j]])));
  return { headers, rows: objects };
}

// Same assertion filter as the protocol-B builder, but locators stay intact.
// Scope is narrowed to the hunk that contains old_locator (removed side) or
// new_locator (added side), because the original rationale describes
// "assertion changes in the same hunk". If no hunk matches, the whole file's
// assertion-level changes are shown and the scope is marked accordingly.
function unredactedAssertionDiff(blockText, { oldLocator, newLocator }) {
  const hunks = [];
  let cur = null;
  for (const line of String(blockText || '').split('\n')) {
    if (line.startsWith('@@')) {
      if (cur) hunks.push(cur);
      cur = { header: line, lines: [], matches: false };
      continue;
    }
    if (!cur) continue;
    if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('diff --git') || line.startsWith('index ')) continue;
    cur.lines.push(line);
    if (line.startsWith('-') && oldLocator && line.includes(oldLocator)) cur.matches = true;
    if (line.startsWith('+') && newLocator && line.includes(newLocator)) cur.matches = true;
  }
  if (cur) hunks.push(cur);

  const scoped = hunks.filter((h) => h.matches);
  const chosen = scoped.length ? scoped : hunks;
  const out = [];
  let added = 0, removed = 0;
  for (const h of chosen) {
    const kept = [];
    for (const line of h.lines) {
      if (!(line.startsWith('+') || line.startsWith('-')) || !ASSERTION_RE.test(line.slice(1))) continue;
      kept.push(`${line[0]}${line.slice(1).trimEnd()}`);
      if (line[0] === '+') added++; else removed++;
    }
    if (kept.length) out.push(h.header, ...kept);
  }
  const scope = scoped.length ? 'same_hunk' : 'whole_file';
  if (!added && !removed) {
    return { text: scoped.length ? '（包含该定位器的 hunk 内未改动断言级代码。）' : '（本次提交未改动断言级代码；旧断言保持不变。）', added: 0, removed: 0, scope };
  }
  return { text: out.join('\n'), added, removed, scope };
}

// The old test LINE that carried the broken locator. The original extraction
// window is unknown; the closest reconstruction is the matching line of the old
// test file at the recorded line number, then old_block, then the locator string.
async function oldTestLine(ctx) {
  try {
    const text = await httpRaw(ctx.repo, ctx.previous_sha, ctx.test_file_path);
    const lines = text.split('\n');
    const at = Number(ctx.line_no) - 1;
    if (at >= 0 && at < lines.length && lines[at].includes(ctx.old_locator)) {
      return { line: lines[at].trim(), from: 'old_test_file_line_no' };
    }
    const idx = lines.findIndex((l) => l.includes(ctx.old_locator));
    if (idx >= 0) return { line: lines[idx].trim(), from: 'old_test_file_match' };
  } catch {
    // fall through to the block-level approximation
  }
  if (ctx.old_block) {
    const hit = ctx.old_block.split('\n').find((l) => l.includes(ctx.old_locator));
    if (hit) return { line: hit.trim(), from: 'old_block_line' };
  }
  return { line: ctx.old_locator, from: 'old_locator_fallback' };
}

const csv = parseCSV(fs.readFileSync(RQ2_CSV, 'utf8'));
if (csv.rows.length !== 30) throw new Error(`RQ2 expected 30 rows, got ${csv.rows.length}`);

const rq2Sections = csv.rows.map((r) => {
  const id = String(r.case_id).trim();
  const body = [
    `## ${id}`,
    '',
    `- 变更上下文：\`${String(r.route ?? '').trim()}\``,
    `- 变更文件：\`${String(r.gap_file ?? '').trim()}\``,
    '',
    '### 生成出来的测试',
    '',
    '```ts',
    String(r.spec ?? '').replace(/\n+$/, ''),
    '```',
    '',
    '---',
    '',
  ].join('\n');
  return { case_id: id, body };
});
const rq2Text = `# RQ2 条件 A 材料（近似原第一列信息条件）\n\n> 仅 route + gap_file + spec；不含应用源码 diff。\n\n---\n\n${rq2Sections.map((s) => s.body).join('')}`;

const ctxFile = JSON.parse(fs.readFileSync(RQ3_CTX, 'utf8'));
const contexts = ctxFile.contexts || [];
if (contexts.length !== 40) throw new Error(`RQ3 expected 40 contexts, got ${contexts.length}`);

const rq3Sections = [];
const stats = { new_locator_present: 0, diff_reconstructed: 0, diff_no_test_change: 0, old_line_fallback: 0 };
const perCase = [];

for (const c of contexts) {
  const newLoc = String(c.new_locator || '').trim();
  if (!newLoc) throw new Error(`${c.case_id} 缺少 new_locator`);
  if (!String(c.old_locator || '').trim()) throw new Error(`${c.case_id} 缺少 old_locator`);

  // Unredacted assertion-level diff, recomputed from the cached compare diff.
  let diff = { text: '', added: 0, removed: 0, hunks: 0 };
  let diffSource = 'compare_cache';
  try {
    const compare = await httpCompareDiff(c.repo, c.previous_sha, c.commit_sha);
    const blocks = splitDiff(compare);
    const tb = blocks.find((b) => b.path === c.test_file_path);
    if (!tb) { diffSource = 'no_test_change'; diff = { text: '（本次提交未改动该测试文件；旧断言保持不变。）', added: 0, removed: 0, scope: 'no_test_change' }; }
    else diff = unredactedAssertionDiff(tb.text, { oldLocator: c.old_locator, newLocator: newLoc });
  } catch (e) {
    diffSource = 'compare_unavailable';
    diff = { text: `（compare diff 不可用：${String(e.message || e).split('\n')[0]}）`, added: 0, removed: 0, scope: 'compare_unavailable' };
  }
  if (diffSource === 'compare_cache') stats.diff_reconstructed++;
  if (diffSource === 'no_test_change') stats.diff_no_test_change++;

  const oldLine = await oldTestLine(c);
  if (oldLine.from === 'old_locator_fallback') stats.old_line_fallback++;
  stats.new_locator_present++;

  // Undo the protocol-B redaction of the commit body: A may show new_locator.
  const body = String(c.commit_body || '').split('<LOCATOR_REDACTED>').join(newLoc);
  const appFiles = c.app_files || [];

  const section = [
    `## ${c.case_id} — ${c.repo} (${c.framework})`,
    '',
    `- 测试文件：\`${c.test_file_path}\` 第 ${c.line_no} 行`,
    `- 旧定位器：\`${c.old_locator}\``,
    `- 旧测试行：\`${oldLine.line}\``,
    `- 新定位器：\`${newLoc}\``,
    `- Commit：${c.commit_subject || '（未取得）'}`,
    `- Commit 说明：${body ? body.replace(/\n/g, '\n  ') : '（该 commit 无正文）'}`,
    `- 应用源码改动文件（${appFiles.length}）：${appFiles.length ? appFiles.join(', ') : '（无）'}`,
    '',
    '### 断言级测试 diff（未遮蔽）',
    '',
    `> 断言增删：+${diff.added} / -${diff.removed}；来源：${diffSource}。`,
    '',
    '```diff',
    diff.text.replace(/\n$/, ''),
    '```',
    '',
    '---',
    '',
  ].join('\n');

  rq3Sections.push(section);
  perCase.push({
    case_id: c.case_id,
    new_locator_present: true,
    unredacted_diff_source: diffSource,
    unredacted_diff_scope: diff.scope,
    old_line_source: oldLine.from,
    assertion_added: diff.added,
    assertion_removed: diff.removed,
    sha256_section: sha256(section),
  });
}

const rq3Text = `# RQ3 条件 A 材料（近似原第一列信息条件）\n\n> old_locator + 旧测试行 + commit 说明 + 应用改动文件列表 + 未遮蔽断言级 diff + new_locator；不含完整 it 块、不含应用源码 diff。\n\n---\n\n${rq3Sections.join('')}`;

fs.mkdirSync(condADir, { recursive: true });
const rq2Path = path.join(condADir, 'rq2_condA.md');
const rq3Path = path.join(condADir, 'rq3_condA.md');
const manifestPath = path.join(condADir, 'condA_material_manifest.json');
fs.writeFileSync(rq2Path, rq2Text + '\n');
fs.writeFileSync(rq3Path, rq3Text + '\n');

const manifest = {
  schema: 'condA_material/v1',
  generated_at: new Date().toISOString(),
  condition: 'approx_original_information',
  note: '近似重建，不是原第一列的原始材料；无法复原的维度见 known_deviations。',
  source_files: [
    { path: path.relative(root, RQ2_CSV), sha256: sha256(fs.readFileSync(RQ2_CSV, 'utf8')) },
    { path: path.relative(root, RQ3_CTX), sha256: sha256(fs.readFileSync(RQ3_CTX, 'utf8')) },
  ],
  rq2: { n: rq2Sections.length, file: path.relative(root, rq2Path), sha256: sha256(rq2Text) },
  rq3: {
    n: rq3Sections.length,
    file: path.relative(root, rq3Path),
    sha256: sha256(rq3Text),
    new_locator_present: stats.new_locator_present,
    unredacted_diff_reconstructed_from_compare_cache: stats.diff_reconstructed,
    unredacted_diff_no_test_change: stats.diff_no_test_change,
    unredacted_diff_scope_counts: perCase.reduce((acc, x) => {
      acc[x.unredacted_diff_scope] = (acc[x.unredacted_diff_scope] || 0) + 1;
      return acc;
    }, {}),
    old_test_line_fallback: stats.old_line_fallback,
    old_test_line_source_counts: perCase.reduce((acc, x) => {
      acc[x.old_line_source] = (acc[x.old_line_source] || 0) + 1;
      return acc;
    }, {}),
  },
  per_case: perCase,
  known_deviations: [
    '原 prompt 文本不可知：条件 A 与 masked 使用同一份中性 prompt，因此不等同于原 prompt。',
    '原模型、版本、温度、max_tokens、重试策略均无记录；条件 A 固定为 deepseek-v4-flash、temperature=0、max_tokens=500、retries=3。',
    '原 RQ3 “旧测试行”的确切截取范围不可知；条件 A 用旧测试文件中 old_locator 所在单行近似，不是完整 it 块。',
    '原 RQ3 是否展示未遮蔽的断言级 diff 只能由 rationale 推断；条件 A 的 diff 由 compare 缓存重算，并优先限定到包含 old_locator/new_locator 的 hunk，定位不到时展示整文件断言变化；展示形式仍可能与当时不同。',
    '原 RQ2 是否看到应用源码 diff 不可知；条件 A 按“不提供”处理。',
    '原标注流程是否读取过 unblind key（含 arm / model_label）不可知；条件 A 不提供这些字段。',
    '原标注是否逐条独立调用、是否有人工对话上下文不可知；条件 A 为逐条独立调用。',
    '原 RQ3 的应用改动文件列表格式（是否截断、排序）不可知；条件 A 使用未截断列表。',
    '原 RQ2 的 spec 视为与当前 CSV 一致；CSV 在工作区被改过（增加标签与引号），但 spec 文本未变化，仍记录输入哈希。',
  ],
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`rq2 sections=${rq2Sections.length} rq3 sections=${rq3Sections.length}`);
console.log(`rq3 new_locator=${stats.new_locator_present}/40 diff_reconstructed=${stats.diff_reconstructed}/40 no_test_change=${stats.diff_no_test_change} old_line_fallback=${stats.old_line_fallback}`);
console.log(`wrote ${path.relative(root, rq2Path)}, ${path.relative(root, rq3Path)}, ${path.relative(root, manifestPath)}`);
