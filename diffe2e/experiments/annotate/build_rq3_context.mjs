// Build the RQ3 blind-annotation context (Plan B).
//
// For each of the 40 sampled breaks: full old `it/test` block (with assertions),
// full commit subject/body, full changed-file list, application-source diff
// (test files excluded), and an assertion-level test diff whose locator
// arguments are redacted. Every redaction is verified for non-reconstructability.
//
// Source: public GitHub `compare/<prev>..<sha>.diff` (two-dot, equals
// `git diff prev sha` even when prev is not an ancestor), `commit/<sha>.patch`
// for the message, and `raw/<sha>/<path>` for the old test file. The new test
// file is never emitted raw; only its assertion lines, with locators redacted.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  httpCompareDiff, httpRaw, httpCommitMessage, splitDiff, joinDiffBlocks,
  diffPaths, assertionDiffFromBlock, addedNonAssertionLines,
  isTestPath, extractTestBlock, verifyRedaction, truncateDiff,
  MAX_DIFF_LINES_RQ3, APP_DIFF_EXT, LOCKFILE, ASSERTION_RE,
} from './annotation_ctx_lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const outDir = path.join(root, 'experiments', 'out');
const ctxDir = path.join(here, 'context');
const csvPath = path.join(outDir, 'rq3_reprobreak_to_annotate.csv');
const wsPath = path.join(outDir, 'rq3_annotator_context_blind.md');
const breaksPath = path.join(root, 'realproj', 'results', 'reprobreak_breaks.json');

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

const csv = parseCSV(fs.readFileSync(csvPath, 'utf8'));
if (csv.rows.length !== 40) throw new Error(`expected 40 rows, got ${csv.rows.length}`);
const breaks = JSON.parse(fs.readFileSync(breaksPath, 'utf8'));
const metaById = new Map(breaks.map((b) => [String(b.id), b]));

const contexts = [];
const problems = [];
const fetchErrors = [];

for (const row of csv.rows) {
  const meta = metaById.get(String(row.rb_id));
  if (!meta) {
    problems.push({ case_id: row.case_id, status: 'break_meta_missing', reason: `reprobreak_breaks.json 无 id=${row.rb_id}` });
    contexts.push({ case_id: row.case_id, rb_id: String(row.rb_id), status: 'break_meta_missing' });
    continue;
  }
  const base = {
    case_id: row.case_id,
    rb_id: String(row.rb_id),
    repo: meta.repository_name,
    framework: meta.framework,
    test_file_path: meta.test_file_path,
    line_no: Number(meta.line_no),
    old_locator: meta.old_locator,
    new_locator: meta.new_locator,
    commit_sha: meta.commit_sha,
    previous_sha: meta.previous_sha,
    source_mode: 'github_compare_two_dot',
  };

  let compare = null;
  try {
    compare = await httpCompareDiff(meta.repository_name, meta.previous_sha, meta.commit_sha);
  } catch (e) {
    fetchErrors.push({ case_id: row.case_id, what: 'compare', error: String(e.message || e).split('\n')[0] });
    problems.push({ case_id: row.case_id, status: 'compare_fetch_failed', reason: 'compare diff 获取失败' });
  }

  let message = { subject: '', body: '' };
  let commitMissing = false;
  try {
    message = await httpCommitMessage(meta.repository_name, meta.commit_sha);
  } catch (e) {
    commitMissing = true;
    fetchErrors.push({ case_id: row.case_id, what: 'patch', error: String(e.message || e).split('\n')[0] });
    problems.push({ case_id: row.case_id, status: 'commit_message_fetch_failed', reason: 'commit 主题/正文获取失败' });
  }

  let oldText = null;
  try {
    oldText = await httpRaw(meta.repository_name, meta.previous_sha, meta.test_file_path);
  } catch (e) {
    fetchErrors.push({ case_id: row.case_id, what: 'raw_old_test', error: String(e.message || e).split('\n')[0] });
  }

  const blocks = compare ? splitDiff(compare) : [];
  const allPaths = blocks.map((b) => b.path);
  const appFiles = compare ? allPaths.filter((f) => !isTestPath(f, meta.test_file_path)) : null;
  const appDiffFiles = appFiles ? appFiles.filter((f) => APP_DIFF_EXT.test(f) && !LOCKFILE.test(f)) : null;
  let appDiff = '';
  let appDiffNote = '';
  if (appDiffFiles && appDiffFiles.length) {
    appDiff = joinDiffBlocks(blocks.filter((b) => appDiffFiles.includes(b.path))).trim();
    if (!appDiff) appDiffNote = '所选应用源码文件无文本差异';
  } else if (appDiffFiles) {
    appDiffNote = '本次提交没有可展示的应用源码文件改动（可能仅改测试/文档/锁文件）';
  }

  // old test + full enclosing block
  let oldBlock = null;
  let oldBlockMethod = null;
  let oldBlockStart = null;
  let oldBlockEnd = null;
  let oldBlockLines = 0;
  let oldHasOldLocator = false;
  let oldLeaksNewLocator = false;
  if (oldText == null) {
    problems.push({ case_id: row.case_id, status: 'old_test_missing', reason: `无法读取 ${meta.test_file_path}@${meta.previous_sha}` });
  } else {
    oldHasOldLocator = oldText.includes(meta.old_locator);
    oldLeaksNewLocator = oldText.includes(meta.new_locator);
    if (!oldHasOldLocator) problems.push({ case_id: row.case_id, status: 'old_locator_not_in_old_test', reason: '旧测试文件中找不到 old_locator' });
    if (oldLeaksNewLocator) problems.push({ case_id: row.case_id, status: 'old_test_contains_new_locator', reason: '旧测试已含 new_locator，按无泄漏规则不得展示' });
    if (!oldLeaksNewLocator) {
      const b = extractTestBlock(oldText, Number(meta.line_no));
      oldBlock = b.text;
      oldBlockMethod = b.method;
      oldBlockStart = b.start_line;
      oldBlockEnd = b.end_line;
      oldBlockLines = b.line_count;
    }
  }
  let oldBlockSupplement = null;
  if (oldBlock && !ASSERTION_RE.test(oldBlock)) {
    const ls = oldText.split('\n');
    const from = Math.max(0, Number(meta.line_no) - 1 - 80);
    const to = Math.min(ls.length, Number(meta.line_no) + 80);
    oldBlockSupplement = ls.slice(from, to).join('\n');
  }

  // nothing that could expose the new locator survives into emitted fields
  const sanitizedBody = message.body.split(meta.new_locator).join('<LOCATOR_REDACTED>');
  const sanitizedAppDiff = (appDiff || '').split(meta.new_locator).join('<LOCATOR_REDACTED>');
  if (sanitizedBody !== message.body) problems.push({ case_id: row.case_id, status: 'commit_body_redacted', reason: 'commit 正文中出现 new_locator，已替换' });
  if (sanitizedAppDiff !== (appDiff || '')) problems.push({ case_id: row.case_id, status: 'app_diff_redacted', reason: '应用 diff 中出现 new_locator，已替换' });
  appDiff = sanitizedAppDiff;

  // assertion-level test diff, locator-redacted
  let testDiff = { text: null, added: 0, removed: 0, hunks: 0 };
  let verification = null;
  let redactionStatus = 'not_run';
  let reason = '';
  const testBlock = blocks.find((b) => b.path === meta.test_file_path);
  if (!compare) {
    redactionStatus = 'compare_missing';
    reason = 'compare diff 不可用';
  } else if (!testBlock) {
    redactionStatus = 'test_file_not_in_diff';
    reason = '本次 compare 中旧测试文件没有改动';
    testDiff = { text: '（本次提交未改动该测试文件；旧断言保持不变。）', added: 0, removed: 0, hunks: 0 };
  } else {
    testDiff = assertionDiffFromBlock(testBlock.text);
    const addedLines = addedNonAssertionLines(testBlock.text);
    const fullContext = [oldBlock || '', oldBlockSupplement || '', message.subject, sanitizedBody, appDiff, testDiff.text].join('\n');
    verification = verifyRedaction({
      redactedText: testDiff.text,
      newLocator: meta.new_locator,
      newTestPath: meta.test_file_path,
      newTestAddedLines: addedLines,
      redactedFullContext: fullContext,
      allowedOldText: oldText,
      visibleOldText: [oldBlock || '', oldBlockSupplement || ''].join('\n'),
    });
    if (!verification.pass) {
      redactionStatus = 'failed';
      reason = '遮蔽不可还原验证未通过';
      testDiff.text = '（遮蔽验证未通过，断言级 diff 已移除；请协调者复核后再发放。）';
      problems.push({ case_id: row.case_id, status: 'redaction_failed', reason, verification });
    } else {
      redactionStatus = 'pass';
    }
  }

  const status = !oldText || oldLeaksNewLocator || !compare ? 'blocked'
    : (redactionStatus === 'pass' ? 'ok' : redactionStatus);
  contexts.push({
    ...base,
    status,
    commit_subject: message.subject,
    commit_body: sanitizedBody,
    commit_body_missing: message.body.length === 0,
    commit_meta_missing: commitMissing,
    app_files: appFiles,
    app_diff_files: appDiffFiles,
    app_diff_note: appDiffNote,
    app_diff: appDiff,
    old_block: oldBlock,
    old_block_method: oldBlockMethod,
    old_block_start_line: oldBlockStart,
    old_block_end_line: oldBlockEnd,
    old_block_lines: oldBlockLines,
    old_block_has_assertion: oldBlock ? ASSERTION_RE.test(oldBlock) : null,
    old_block_supplement: oldBlockSupplement,
    old_has_old_locator: oldHasOldLocator,
    old_leaks_new_locator: oldLeaksNewLocator,
    test_diff: testDiff,
    redaction_status: redactionStatus,
    redaction_reason: reason,
    verification,
  });
}

fs.mkdirSync(ctxDir, { recursive: true });
const outJson = path.join(ctxDir, 'rq3_context.json');
fs.writeFileSync(outJson, JSON.stringify({
  generated_for: 'RQ3 second annotator (Plan B)',
  source_csv: path.relative(root, csvPath),
  breaks: path.relative(root, breaksPath),
  contexts,
  problems,
  fetch_errors: fetchErrors,
}, null, 2) + '\n');

const verJson = path.join(ctxDir, 'redaction_verification.json');
fs.writeFileSync(verJson, JSON.stringify({
  rule: 'mask mechanical addressing paths only (CSS/id/class/data-*/xpath/nth/first/last/page.$ selector strings/path fragments); keep semantic anchors (getByRole role+name, getByText-like text, filter hasText, assertion values/matchers). Mechanical fragments must have 0 exact / whitespace-normalized / token hits outside the disclosed old-locator input; semantic anchors are listed one by one with reasons.',
  contexts: contexts.map((c) => ({
    case_id: c.case_id,
    rb_id: c.rb_id,
    repo: c.repo,
    status: c.status,
    redaction_status: c.redaction_status,
    verification: c.verification,
  })),
}, null, 2) + '\n');

// ---- rewrite the blind context, preserving the intro and 判定 lines ----
const existing = fs.readFileSync(wsPath, 'utf8');
const firstHead = existing.search(/^## rb\d+/m);
let intro = firstHead >= 0 ? existing.slice(0, firstHead) : existing;
const newView = `每条看这些：

1. \`old_locator\`：断掉的是哪个定位器。
2. 完整旧测试块：这个 \`it/test\` 块原本在操作什么、断言什么（已包含完整断言，不再是断点附近窗口）。
3. \`Commit\` / \`Commit 说明\`：加功能、修 bug、重构、迁移，还是改业务规则。
4. 完整应用改动文件列表：这次提交改了哪些非测试文件（不截断）。
5. 应用源码 diff：应用代码具体怎么改（已排除测试文件）。
6. 断言级测试 diff（locator 已遮蔽）：断言目标/期望值是否改变；只显示断言增删，定位器参数已替换为 \`<LOCATOR_REDACTED>\`。若 \`-\`/\`+\` 行只因定位方式不同而变得完全一样，新增侧会标为 \`<LOCATOR_CHANGED>\`：这说明“定位方式变了”，但具体变成什么仍不可见。

决策表：`;
intro = intro.replace(/每条看四样：[\s\S]*?\n\n决策表：/, newView);
const item6 = '6. 断言级测试 diff（机械定位方式已遮蔽）：只显示断言增删。**遮蔽对象是寻址路径，不是语义锚**：CSS/id/class/`data-*`/xpath/`nth` 等被替换为 `<LOCATOR_REDACTED>`；而 `getByRole` 的 role 与 name、`getByText` 等的文本、`filter({hasText})` 的文本、断言值与 matcher 保持可见。若 `-`/`+` 行只因机械寻址方式不同而变得完全一样，新增侧会标为 `<LOCATOR_CHANGED>`：说明“定位方式变了”，但具体路径仍不可见。';
intro = intro.replace(/^6\. 断言级测试 diff.*$/m, item6);
const stopLine = '如果某条的完整旧测试块、应用 diff 或断言级测试 diff 缺失，停下来问协调者，不要用 commit 标题猜。';
intro = intro.split(stopLine).join('').replace(/\n{3,}/g, '\n\n');
intro = intro.replace('**不需要跑测试。**', `${stopLine}\n\n**不需要跑测试。**`);

function langOf(file) {
  if (/\.tsx?$/.test(file)) return 'ts';
  if (/\.jsx?$/.test(file)) return 'js';
  if (/\.vue$/.test(file)) return 'vue';
  return '';
}

const sections = [];
for (const c of contexts) {
  let body = `## ${c.case_id} — ${c.repo} (${c.framework})\n\n`;
  body += `- 测试文件：\`${c.test_file_path}\` 第 ${c.line_no} 行\n`;
  body += `- 旧定位器：\`${c.old_locator}\`\n`;
  body += `- Commit：${c.commit_subject || '（未取得）'}\n`;
  body += `- Commit 说明：${c.commit_body ? c.commit_body.replace(/\n/g, '\n  ') : '（该 commit 无正文）'}\n`;
  if (c.app_files) {
    body += `- 应用源码改动文件（${c.app_files.length}）：${c.app_files.length ? c.app_files.join(', ') : '（无）'}\n`;
  } else {
    body += '- 应用源码改动文件：（未取得）\n';
  }

  body += '\n### 完整旧测试块\n\n';
  if (c.old_block) {
    const methodNote = c.old_block_method === 'block'
      ? `完整 \`it/test\` 块，第 ${c.old_block_start_line}–${c.old_block_end_line} 行`
      : `未找到完整块，显示第 ${c.old_block_start_line}–${c.old_block_end_line} 行窗口`;
    body += `> 提取方式：${methodNote}；共 ${c.old_block_lines} 行。\n\n`;
    body += '```' + langOf(c.test_file_path) + '\n' + c.old_block.replace(/\n$/, '') + '\n```\n';
    if (c.old_block_supplement) {
      body += '\n> 该块内未检测到断言，以下补充断点前后窗口（第 ' + (Math.max(0, c.line_no - 1 - 80) + 1) + '–' + (c.line_no + 80) + ' 行）：\n\n';
      body += '```' + langOf(c.test_file_path) + '\n' + c.old_block_supplement.replace(/\n$/, '') + '\n```\n';
    }
  } else {
    body += `_（未取得：${c.old_leaks_new_locator ? '旧测试已含 new_locator，按无泄漏规则不展示' : '仓库/提交不可用'}）_\n`;
  }

  body += '\n### 应用源码 diff（已排除测试文件）\n\n';
  if (c.app_diff) {
    const t = truncateDiff(c.app_diff, MAX_DIFF_LINES_RQ3, '应用 diff');
    body += '```diff\n' + t.text.replace(/\n$/, '') + '\n```\n';
    if (t.truncated) body += `\n> 注：diff 已截断（原始 ${t.originalLines} 行，仅显示前 ${t.lines} 行）。\n`;
  } else {
    body += `_（无应用 diff：${c.app_diff_note || '未取得'}）_\n`;
  }

  body += '\n### 断言级测试 diff（机械定位方式已遮蔽；语义锚可见）\n\n';
  if (c.test_diff.text) {
    body += `> 断言增删：+${c.test_diff.added} / -${c.test_diff.removed}。\n\n`;
    body += '```diff\n' + c.test_diff.text.replace(/\n$/, '') + '\n```\n';
  } else {
    body += `_（未取得：${c.redaction_reason || '新测试文件不可用'}）_\n`;
  }

  const old = existing.match(new RegExp(`^## ${c.case_id}[^\\n]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'));
  const judge = old ? (old[1].match(/^判定：.*$/m) || [])[0] : null;
  body += '\n' + (judge || '判定：`human2=___`  备注：') + '\n\n---\n\n';
  sections.push(body);
}

fs.writeFileSync(wsPath, intro + sections.join(''));

// human-readable verification summary
const vlines = ['# RQ3 遮蔽不可还原验证（方案一：只遮机械路径，保留语义锚）', '',
  '**遮蔽对象是寻址路径，不是语义锚。** 下列机械寻址字符串在已发放材料的断言级 diff 中精确 / 空白归一化 / token 命中必须为 0：',
  'CSS 选择器、id/class、`data-testid`/`data-*` 的值、`nth()`/`first()`/`last()` 索引、xpath、`page.$` 类选择器字符串、`new_locator` 中的路径片段。',
  '若某机械片段与 `old_locator` / 旧测试块中的字符串相同，则它属于按协议已披露的旧定位器，单独标注，不计为“新定位器泄露”。',
  '语义锚按协议允许可见：`getByRole` 的 role 与 name、`getByText`/`getByLabel`/`getByPlaceholder` 的文本、`filter({hasText})` 的文本、断言值与 matcher；逐条列在文末“按协议允许可见的语义锚”一节。', '',
  '## 逐条结果', '',
  '| case | repo | 结果 | 机械片段 | 新泄露 | 语法残留 | 新测试非断言行 | 语义锚(去重) |',
  '|---|---|---|---|---|---|---|---|'];
for (const c of contexts) {
  if (!c.verification) {
    vlines.push(`| ${c.case_id} | ${c.repo} | 未执行验证（${c.redaction_status}${c.redaction_reason ? '：' + c.redaction_reason : ''}） | - | - | - | - | - |`);
    continue;
  }
  const v = c.verification;
  const anchors = (v.semantic_anchors_visible || []).length;
  vlines.push(`| ${c.case_id} | ${c.repo} | ${v.pass ? 'PASS' : 'FAIL'} | ${(v.mechanical_checks || []).length} | ${(v.mechanical_leaks || []).length} | ${v.locator_syntax_hits.length} | ${v.new_test_line_hits.length} | ${anchors} |`);
}
vlines.push('', '## 机械片段在应用 diff / commit 中的同名出现（app 信号，非测试侧泄露）', '',
  '口径：零命中要求针对**已发放的断言级 diff**（测试侧新 locator 的唯一载体）。下表的机械片段只出现在应用源码 diff 或 commit 正文中，属于协议 B 本来就要提供的 app 信号（例如应用新增的 class/testId/文案），不是从测试侧 locator 还原出来的。', '',
  '| case | 机械片段 | 命中项 |',
  '|---|---|---|');
for (const c of contexts) {
  const v = c.verification;
  if (!v) continue;
  for (const m of v.mechanical_checks || []) {
    if (!(m.context_occurrences || []).length) continue;
    const detail = m.context_occurrences.map((x) => `${x.mode}${x.token ? ':' + x.token : ''}=${x.hits}`).join('、');
    vlines.push(`| ${c.case_id} | \`${m.value}\` | ${detail} |`);
  }
}
vlines.push('', '## 按协议允许可见的语义锚（逐条清单与理由）', '',
  '本节逐条列出实际出现在已发放断言级 diff 中的语义锚。它们说明“断言的对象是什么”，不是“怎么找到它”，因此按方案一保留可见；每条给出理由，不作笼统放行。',
  '断言期望值与 matcher（`toHaveText`/`toContainText` 等）位于 locator 之外，按规则始终保留。', '');
for (const c of contexts) {
  const v = c.verification;
  vlines.push(`### ${c.case_id} — ${c.repo}`);
  vlines.push('');
  if (!v) {
    vlines.push(`_未执行验证（${c.redaction_status}）。_`, '');
    continue;
  }
  const visibleOldMech = (v.mechanical_checks || []).filter((m) => m.visible_in_old_input);
  if (visibleOldMech.length) {
    vlines.push(`> 以下机械片段与已披露的旧定位器/旧测试块相同（属于输入的一部分，不是新泄露）：${visibleOldMech.map((m) => '`' + m.value + '`').join('、')}`, '');
  }
  const anchors = v.semantic_anchors_visible || [];
  if (!anchors.length) {
    vlines.push('_本条断言级 diff 中没有出现可保留的定位器语义锚。_', '');
  } else {
    vlines.push('| 类型 | 值 | 出现次数 | 理由 |', '|---|---|---|---|');
    for (const a of anchors) vlines.push(`| ${a.kind} | \`${a.value}\` | ${a.count} | ${a.reason} |`);
    vlines.push('');
  }
}
fs.writeFileSync(path.join(ctxDir, 'redaction_verification.md'), vlines.join('\n') + '\n');

const ok = contexts.filter((c) => c.status === 'ok').length;
console.log(`rq3 contexts=${contexts.length} ok=${ok} problems=${problems.length} fetch_errors=${fetchErrors.length}`);
console.log(`wrote ${path.relative(root, outJson)}, ${path.relative(root, verJson)}, ${path.relative(root, wsPath)}`);
for (const p of problems) console.log(`PROBLEM ${p.case_id} ${p.status}: ${p.reason}`);
for (const e of fetchErrors) console.log(`FETCH ${e.case_id} ${e.what}: ${e.error}`);
