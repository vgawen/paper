// Assemble a self-contained annotator packet from the two context JSONs.
//
//   node experiments/annotate/make_annotation_packet.mjs
//
// Writes experiments/out/annotation_packet/ with the two worksheets, a
// coordinator-facing coverage report, fill templates, the redaction record,
// and SHA256SUMS. The canonical blind CSVs are never modified.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const outDir = path.join(root, 'experiments', 'out');
const ctxDir = path.join(here, 'context');
const packet = path.join(outDir, 'annotation_packet');
fs.mkdirSync(packet, { recursive: true });

const rq2 = JSON.parse(fs.readFileSync(path.join(ctxDir, 'rq2_context.json'), 'utf8'));
const rq3 = JSON.parse(fs.readFileSync(path.join(ctxDir, 'rq3_context.json'), 'utf8'));

const rq2md = path.join(outDir, 'rq2_annotator2_worksheet.md');
const rq3md = path.join(outDir, 'rq3_annotator_context_blind.md');
fs.copyFileSync(rq2md, path.join(packet, 'rq2_worksheet.md'));
fs.copyFileSync(rq3md, path.join(packet, 'rq3_context.md'));

// ---- fill templates (labels + final only; no answers) ----
function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function writeCsv(file, header, rows) {
  fs.writeFileSync(file, [header.join(',')].concat(rows.map((r) => r.map(csvCell).join(','))).join('\n') + '\n');
}
const rq2Rows = rq2.rows.map((r) => [r.case_id, '', '']);
writeCsv(path.join(packet, 'rq2_fill_template.csv'), ['case_id', 'annotator2_yn', 'final'], rq2Rows);
const rq3Rows = rq3.contexts.map((c) => [c.case_id, '', '']);
writeCsv(path.join(packet, 'rq3_fill_template.csv'), ['case_id', 'human2', 'final'], rq3Rows);

// ---- instructions ----
const instructions = `# RQ2 / RQ3 盲评材料说明

这份材料包用于第二标注者独立标注。规则全文见 \`diffe2e/experiments/annotate/ANNOTATION_GUIDE.md\`。

## 打开哪些文件

| 任务 | 工作文件（直接编辑） | 填哪一列 |
|---|---|---|
| RQ2（30 条生成测试） | \`rq2_worksheet.md\` | 每节末尾 \`annotator2_yn=y\` 或 \`annotator2_yn=n\` |
| RQ3（40 条断裂） | \`rq3_context.md\` | 每节末尾 \`human2=STRUCTURAL_ONLY\` / \`EXPECTATION_CHANGE\` / \`SUSPECTED_REGRESSION\` |

\`final\` 一律留空，它只由第三仲裁者在两列不一致时填写。\`*_fill_template.csv\` 是手工录入的备用模板，只有在不能编辑 Markdown 时才用。

## RQ2 判什么

一条 spec 是否真的打开应用、操作或断言了**这次变更引入/改变的具体 UI 或行为**。四个问题都过才填 \`y\`：

1. 它有没有真的打开应用（不是 \`page.setContent\` 造假 DOM）？
2. 它操作/断言的元素，和 \`gap_file\` 里的变更对得上吗？
3. 断言是否具体到“变更后的结果”，而不是 body/页面/通用 header？
4. 如果这次变更不存在，这条测试会不会失败？

依据：\`gap_file\`、\`route\`（只是定位信息，不是页面说明）、**应用源码 diff**、\`spec\` 全文。应用 diff 只含应用源码，已排除测试文件。

## RQ3 判什么

一条已执行验证的 locator 断裂属于哪种过时：

- \`STRUCTURAL_ONLY\`：测试意图不变，只是 locator / DOM 层级 / class/id / 文案锚点 / 测试 API / 框架迁移变了。可以自动改定位。
- \`EXPECTATION_CHANGE\`：测试要验证的业务结果/断言目标本身变了，旧断言还在检查旧行为。需要改断言语义，通常要人确认。
- \`SUSPECTED_REGRESSION\`：无法排除新版本真回归；看不出是测试老了还是应用坏了。保守选项，不应自动改写采纳。

依据：旧定位器、**完整旧测试块**、完整 commit 主题与正文、完整应用改动文件列表、**应用源码 diff**、**断言级测试 diff（机械定位方式已遮蔽）**。**遮蔽对象是寻址路径，不是语义锚**：CSS/id/class/\`data-*\`/xpath/\`nth\` 等替换为 \`<LOCATOR_REDACTED>\`；\`getByRole\` 的 role 与 name、\`getByText\` 等的文本、\`filter({hasText})\` 的文本、断言值与 matcher 保持可见。若某对 \`-\`/\`+\` 行只因机械寻址方式不同而完全一样，新增侧标为 \`<LOCATOR_CHANGED>\`，只表明“定位方式变了”，不显示具体路径。

## 什么情况停下来问协调者

- RQ2 某节没有应用 diff，或 diff 里混进了测试文件；
- RQ2 的 spec 引用了被截断/找不到的 fixture 或页面路径；
- RQ3 的旧测试块看不到断言，或明显不是完整 \`it/test\` 块；
- RQ3 应用 diff 为空，但 commit 主题像行为变更；
- 断言级 diff 显示“遮蔽验证未通过”；
- 你在材料里看到 \`new_locator\`、新测试内容、arm、第一列标签/理由、自动指标或 score。

以上都属于证据不足或盲评泄露，写进备注并停下，不要用猜测填标签。

## 禁止

- 不要打开 \`rq2_real_to_annotate.csv\` / \`rq3_reprobreak_to_annotate.csv\`（含第一列）；
- 不要打开 \`*_rationale.md\`、\`*_unblind.json\`、\`score\` 输出、\`kappa_backfill.md\`；
- 不要打开被测仓库、git 历史、commit 网页/PR/issue；
- 不要运行被测测试（RQ3 会直接暴露 new_locator）。

## 交付

- 保存为 UTF-8，不要增删节、不要改标题和顺序；
- 全部填完后，协调者会做锁定与 \`shasum -a 256\` 记录，再运行 collect / merge / score。
`;
fs.writeFileSync(path.join(packet, 'ANNOTATOR_INSTRUCTIONS.md'), instructions);

// ---- coverage report ----
const lines = ['# 盲评材料覆盖清单', '',
  `生成对象：RQ2 ${rq2.rows.length} 条 / RQ3 ${rq3.contexts.length} 条。`, '',
  '## 总览', '',
  '| 项目 | 数量 |', '|---|---|'];
const rq2Ctx = rq2.contexts;
lines.push(`| RQ2 变更上下文 | ${rq2Ctx.length} |`);
lines.push(`| RQ2 应用 diff 可用 | ${rq2Ctx.filter((c) => c.status === 'ok').length} |`);
lines.push(`| RQ2 应用 diff 缺失 | ${rq2Ctx.filter((c) => c.status !== 'ok').length} |`);
lines.push(`| RQ3 条目 | ${rq3.contexts.length} |`);
lines.push(`| RQ3 完整旧测试块（block 提取） | ${rq3.contexts.filter((c) => c.old_block_method === 'block').length} |`);
lines.push(`| RQ3 旧测试块退化为窗口 | ${rq3.contexts.filter((c) => c.old_block_method === 'window').length} |`);
lines.push(`| RQ3 commit 无正文 | ${rq3.contexts.filter((c) => c.commit_body_missing).length} |`);
lines.push(`| RQ3 应用改动文件数为 0 | ${rq3.contexts.filter((c) => c.app_files && c.app_files.length === 0).length} |`);
lines.push(`| RQ3 应用 diff 为空 | ${rq3.contexts.filter((c) => !c.app_diff).length} |`);
lines.push(`| RQ3 断言级 diff 有变化 | ${rq3.contexts.filter((c) => c.test_diff && c.test_diff.text && c.test_diff.added + c.test_diff.removed > 0).length} |`);
lines.push(`| RQ3 遮蔽验证 PASS | ${rq3.contexts.filter((c) => c.verification && c.verification.pass).length} |`);
lines.push(`| RQ3 遮蔽验证 FAIL / 未执行 | ${rq3.contexts.filter((c) => !c.verification || !c.verification.pass).length} |`);
lines.push('', '## RQ2 逐条', '',
  '| case_id | 项目 | 状态 | diff 行数 | 截断 | 说明 |', '|---|---|---|---|---|---|');
for (const r of rq2.rows) {
  const c = rq2.contexts.find((x) => x.context_key === r.context_key);
  const truncated = (c.diff || '').split('\n').length > 400;
  lines.push(`| ${r.case_id} | ${r.project} | ${c.status} | ${c.diff_lines || 0} | ${truncated ? '是' : '否'} | ${c.reason || '-'} |`);
}
lines.push('', '## RQ3 逐条', '',
  '| case_id | rb_id | repo | 旧块 | 行数 | commit 正文 | 应用文件 | diff 文件 | diff 行 | 截断 | 断言 +/− | 遮蔽 | 说明 |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const c of rq3.contexts) {
  const appDiffLines = (c.app_diff || '').split('\n').filter(Boolean).length;
  const trunc = appDiffLines > 900;
  const td = c.test_diff || {};
  const red = c.verification ? (c.verification.pass ? 'PASS' : 'FAIL') : c.redaction_status;
  const notes = [];
  if (c.commit_body_missing) notes.push('commit 无正文');
  if (c.app_files && c.app_files.length === 0) notes.push('无应用文件改动');
  if (!c.app_diff) notes.push(c.app_diff_note || '无应用 diff');
  if (td.text && td.added + td.removed === 0) notes.push('无断言级变化');
  if (c.old_block_method === 'window') notes.push('旧测试块退化为窗口');
  if (c.old_block && !c.old_block_has_assertion) notes.push('旧测试块内无断言，已补断点窗口');
  if (!c.old_has_old_locator) notes.push('旧文件找不到 old_locator');
  if (c.redaction_reason) notes.push(c.redaction_reason);
  lines.push(`| ${c.case_id} | ${c.rb_id} | ${c.repo} | ${c.old_block_method || '-'} | ${c.old_block_lines || 0} | ${c.commit_body_missing ? '无' : '有'} | ${c.app_files ? c.app_files.length : '-'} | ${c.app_diff_files ? c.app_diff_files.length : '-'} | ${appDiffLines} | ${trunc ? '是' : '否'} | ${td.added || 0}/${td.removed || 0} | ${red} | ${notes.join('；') || '-'} |`);
}
lines.push('', '## 阻塞与缺失', '');
const allProblems = [...(rq2.problems || []).map((p) => ({ ...p, scope: 'RQ2' })), ...(rq3.problems || []).map((p) => ({ ...p, scope: 'RQ3' }))];
if (!allProblems.length) lines.push('无。');
for (const p of allProblems) lines.push(`- [${p.scope}] ${p.case_id}: ${p.status} — ${p.reason}`);
lines.push('', '## 注意', '',
  '- 应用 diff 超过行数上限时会截断，并在条目内标注原始行数。',
  '- RQ3 的 commit 正文为空是数据事实（该 commit 本身没有正文），不是抓取失败。',
  '- 遮蔽只针对测试侧新 locator 的**机械寻址路径**；role/name/文案等语义锚按方案一保留可见，应用 diff 中出现的 testId/role/文案属于方法本来可见的 app 信号。',
  '- 详细验证结果见 `redaction_verification.md` / `redaction_verification.json`（取自 annotate/context 目录）。');
fs.writeFileSync(path.join(packet, 'COVERAGE_REPORT.md'), lines.join('\n') + '\n');

// copy verification records
fs.copyFileSync(path.join(ctxDir, 'redaction_verification.md'), path.join(packet, 'redaction_verification.md'));
fs.copyFileSync(path.join(ctxDir, 'redaction_verification.json'), path.join(packet, 'redaction_verification.json'));

// ---- SHA256SUMS over every packet file except itself ----
const files = fs.readdirSync(packet).filter((f) => f !== 'SHA256SUMS').sort();
const sums = files.map((f) => {
  const buf = fs.readFileSync(path.join(packet, f));
  return `${crypto.createHash('sha256').update(buf).digest('hex')}  ${f}`;
});
fs.writeFileSync(path.join(packet, 'SHA256SUMS'), sums.join('\n') + '\n');

console.log(`wrote packet -> ${path.relative(root, packet)} (${files.length} files)`);
console.log(`RQ2 ok ${rq2Ctx.filter((c) => c.status === 'ok').length}/${rq2Ctx.length}; RQ3 ok ${rq3.contexts.filter((c) => c.status === 'ok').length}/${rq3.contexts.length}`);
