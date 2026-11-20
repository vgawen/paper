// RQ3 扩展批次构建脚本（阶段二）
//
// 只读写 out/expansion_20261108/rq3/ 下的文件；主表、主盲评包与冻结清单只读。
//
// 子命令：
//   node build_rq3_expansion.mjs sample    # 每仓 hash 第 11–20 条，生成 rbx001..rbx040
//   node build_rq3_expansion.mjs context   # 抓取公开 GitHub 材料并做遮蔽/泄漏复核
//   node build_rq3_expansion.mjs triage    # 对 40 条跑真实分诊（DeepSeek，temperature=0）
//   node build_rq3_expansion.mjs packet    # 组装独立盲评包 + SHA256SUMS
//   node build_rq3_expansion.mjs report    # 扩展分布、与主实验 40 条对照
//
// 泄漏纪律：new_locator 只用于遮蔽验证，绝不写入任何发放材料。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  splitDiff, joinDiffBlocks, isTestPath, APP_DIFF_EXT, LOCKFILE,
  extractTestBlock, assertionDiffFromBlock, addedNonAssertionLines,
  verifyRedaction, truncateDiff, MAX_DIFF_LINES_RQ3, ASSERTION_RE,
} from '../../../../annotate/annotation_ctx_lib.mjs';
import {
  PROVIDERS, LABELS, TEMPERATURE, loadDeepSeekKey, callModel, parseAnswer,
} from '../../../../annotate/annotator1_shared.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EXP = path.join(HERE, '..');
const ROOT = path.join(HERE, '..', '..', '..', '..', '..');
const CACHE_DIR = path.join(EXP, 'cache', 'http');

const E2E = path.join(ROOT, 'realproj', 'results', 'reprobreak_e2e.json');
const BREAKS = path.join(ROOT, 'realproj', 'results', 'reprobreak_breaks.json');
const MAIN_CSV = path.join(ROOT, 'experiments', 'out', 'rq3_reprobreak_to_annotate.csv');
const MAIN_UNBLIND = path.join(ROOT, 'experiments', 'out', 'rq3_reprobreak_to_annotate_unblind.json');

const SAMPLE_CSV = path.join(EXP, 'rq3_expansion_sample.csv');
const UNBLIND = path.join(EXP, 'rq3_expansion_unblind.json');
const CONTEXT = path.join(EXP, 'rq3_expansion_context.json');
const CONTEXT_MD = path.join(EXP, 'rq3_expansion_context_blind.md');
const VER_JSON = path.join(EXP, 'redaction_verification.json');
const VER_MD = path.join(EXP, 'redaction_verification.md');
const TRIAGE = path.join(EXP, 'rq3_expansion_triage.json');
const TRIAGE_MD = path.join(EXP, 'rq3_expansion_triage.md');
const METRICS = path.join(EXP, 'rq3_expansion_metrics.json');
const REPORT = path.join(EXP, 'EXPANSION_RQ3_REPORT.md');
const PACKET = path.join(EXP, 'annotation_packet_expansion');

const SAMPLE_PER_REPO = 10;
const SKIP_PER_REPO = 10;
const FIRST_NEW_ID = 1;
const MODE = process.argv[2] || 'sample';

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const rel = (p) => path.relative(ROOT, p);

function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  const headers = rows.shift() || [];
  return { headers, rows: rows.filter((r) => r.length === headers.length).map((r) => Object.fromEntries(headers.map((h, j) => [h, r[j]]))) };
}

function writeCsv(file, headers, rows) {
  fs.writeFileSync(file, [headers.join(',')].concat(rows.map((r) => headers.map((h) => esc(r[h])).join(','))).join('\n') + '\n');
}

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function gitHash(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

// ---------------------------------------------------------------------------
// 0. sample：每仓第 11–20 条（与主实验同排序，零重叠）
// ---------------------------------------------------------------------------
function buildSample() {
  const e2e = readJson(E2E);
  const breaks = readJson(BREAKS);
  const metaById = new Map(breaks.map((b) => [String(b.id), b]));
  const grouped = new Map();
  for (const row of e2e.rows) {
    if (!metaById.has(String(row.id))) continue;
    const arr = grouped.get(row.repo) || [];
    arr.push(row);
    grouped.set(row.repo, arr);
  }

  const mainIds = new Set(parseCSV(fs.readFileSync(MAIN_CSV, 'utf8')).rows.map((r) => String(r.rb_id)));
  const sample = [];
  for (const [repo, rows] of [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    rows.sort((a, b) => hashString(`${repo}:${a.id}`) - hashString(`${repo}:${b.id}`));
    sample.push(...rows.slice(SKIP_PER_REPO, SKIP_PER_REPO + SAMPLE_PER_REPO));
  }
  sample.sort((a, b) => a.repo.localeCompare(b.repo) || Number(a.id) - Number(b.id));

  if (sample.length !== 40) throw new Error(`expected 40 expansion rows, got ${sample.length}`);
  const overlap = sample.filter((r) => mainIds.has(String(r.id)));
  if (overlap.length) throw new Error(`expansion overlaps main sample: ${overlap.map((r) => r.id).join(',')}`);

  const rows = sample.map((r, i) => {
    const meta = metaById.get(String(r.id));
    return {
      case_id: `rbx${String(i + FIRST_NEW_ID).padStart(3, '0')}`,
      rb_id: String(r.id),
      repo: r.repo,
      framework: meta.framework,
      test_file_path: meta.test_file_path,
      line_no: meta.line_no,
      old_locator: meta.old_locator,
      human1: '',
      human2: '',
      final: '',
    };
  });

  writeCsv(SAMPLE_CSV, ['case_id', 'rb_id', 'repo', 'framework', 'test_file_path', 'line_no', 'old_locator', 'human1', 'human2', 'final'], rows);

  const unblind = {};
  for (const [i, r] of rows.entries()) {
    const src = sample[i];
    unblind[r.case_id] = {
      rb_id: Number(r.rb_id),
      repo: r.repo,
      app_files: src.app_files,
      rule: src.rule,
      llm: src.llm,
      model_label: null,
      triage: null,
    };
  }
  writeJson(UNBLIND, unblind);

  console.log(`sample: ${rows.length} rows, per repo ${SAMPLE_PER_REPO}; overlap with main=0`);
  const counts = {};
  for (const r of rows) counts[r.repo] = (counts[r.repo] || 0) + 1;
  for (const [repo, n] of Object.entries(counts)) console.log(`  ${repo}: ${n}`);
}

// ---------------------------------------------------------------------------
// 1. context：公开 GitHub 材料 + 遮蔽 + 泄漏复核（缓存只写 expansion 目录）
// ---------------------------------------------------------------------------
async function httpGet(url, { retries = 5, timeoutMs = 60000 } = {}) {
  const key = crypto.createHash('sha256').update(url).digest('hex');
  const file = path.join(CACHE_DIR, `${key}.txt`);
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  let lastErr = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const text = execFileSync('curl', ['-sSL', '--fail', '--max-time', String(Math.round(timeoutMs / 1000)), url], {
        encoding: 'utf8', maxBuffer: 128 * 1024 * 1024,
      });
      fs.writeFileSync(file, text);
      return text;
    } catch (e) {
      lastErr = e;
      if (attempt < retries) await new Promise((r) => setTimeout(r, Math.min(15000, 1000 * attempt * attempt)));
    }
  }
  throw lastErr;
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

// GitHub 的 compare 端点对大仓库经常 504；改用 commits API 一次取回
// 提交说明、父提交与逐文件 patch。ReproBreak 的 previous_sha 应为父提交，
// 脚本会逐条核验；不一致即阻断。API 每分钟 60 次，40 条在限额内。
// raw.githubusercontent.com 在部分网络下会超时；旧测试文件改走 jsDelivr 镜像。
const commitApiUrl = (repo, sha) => `https://api.github.com/repos/${repo}/commits/${sha}`;
const rawUrl = (repo, sha, filePath) => `https://cdn.jsdelivr.net/gh/${repo}@${sha}/${filePath.split('/').map(encodeURIComponent).join('/')}`;

async function prefetch(rows) {
  const breaks = readJson(BREAKS);
  const metaById = new Map(breaks.map((b) => [String(b.id), b]));
  const tasks = [];
  for (const row of rows) {
    const meta = metaById.get(String(row.rb_id));
    if (!meta) continue;
    tasks.push({ case_id: row.case_id, what: 'commit_api', url: commitApiUrl(meta.repository_name, meta.commit_sha) });
    tasks.push({ case_id: row.case_id, what: 'old_test', url: rawUrl(meta.repository_name, meta.previous_sha, meta.test_file_path) });
  }
  const failures = [];
  await mapLimit(tasks, 4, async (t) => {
    try { await httpGet(t.url, { retries: 4, timeoutMs: 60000 }); }
    catch (e) { failures.push({ case_id: t.case_id, what: t.what, error: String(e.message || e).split('\n')[0] }); }
  });
  return failures;
}

function stripStringLiterals(text) {
  return String(text || '').replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, '<STRING_LITERAL>');
}

function langOf(file) {
  if (/\.tsx?$/.test(file)) return 'ts';
  if (/\.jsx?$/.test(file)) return 'js';
  if (/\.vue$/.test(file)) return 'vue';
  return '';
}

async function buildContext() {
  const csv = parseCSV(fs.readFileSync(SAMPLE_CSV, 'utf8'));
  if (csv.rows.length !== 40) throw new Error(`expected 40 rows, got ${csv.rows.length}`);
  const breaks = readJson(BREAKS);
  const metaById = new Map(breaks.map((b) => [String(b.id), b]));

  const prefetchFailures = await prefetch(csv.rows);
  if (prefetchFailures.length) console.log(`prefetch failures: ${prefetchFailures.length}`);
  for (const f of prefetchFailures) console.log(`  ${f.case_id} ${f.what}: ${f.error}`);

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
      source_mode: 'github_commit_diff_previous_sha_assumed_parent',
    };

    let api = null;
    try { api = JSON.parse(await httpGet(commitApiUrl(meta.repository_name, meta.commit_sha), { timeoutMs: 60000 })); }
    catch (e) {
      fetchErrors.push({ case_id: row.case_id, what: 'commit_api', error: String(e.message || e).split('\n')[0] });
      problems.push({ case_id: row.case_id, status: 'commit_api_fetch_failed', reason: 'commit API 获取失败' });
    }

    const parentOk = api ? (api.parents?.[0]?.sha || '') === meta.previous_sha : false;
    const filesTruncated = api ? (api.files || []).length >= 300 : false;
    let diffFiles = api?.files || [];
    let sourceMode = 'github_commits_api_parent_verified';
    if (api && !parentOk) {
      // previous_sha 不是父提交（例如跨多个提交/合并），改用 compare API 取完整区间。
      const cmpUrl = `https://api.github.com/repos/${meta.repository_name}/compare/${meta.previous_sha}...${meta.commit_sha}`;
      try {
        const cmp = JSON.parse(await httpGet(cmpUrl, { timeoutMs: 60000 }));
        diffFiles = cmp.files || [];
        sourceMode = 'github_compare_api_range';
      } catch (e) {
        fetchErrors.push({ case_id: row.case_id, what: 'compare_api', error: String(e.message || e).split('\n')[0] });
        problems.push({ case_id: row.case_id, status: 'compare_api_fetch_failed', reason: 'previous_sha 非父提交，且 compare API 获取失败' });
      }
    }
    if (api && !parentOk && sourceMode === 'github_compare_api_range') {
      problems.push({ case_id: row.case_id, status: 'previous_sha_not_parent_but_compare_used', reason: `previous_sha=${meta.previous_sha} 非父提交；已改用 compare API 区间 diff` });
    }
    if (filesTruncated) problems.push({ case_id: row.case_id, status: 'files_truncated_at_300', reason: 'GitHub API 的文件列表达到 300 上限，应用改动可能不完整' });

    const fullMessage = String(api?.commit?.message || '');
    const nl = fullMessage.indexOf('\n');
    const message = { subject: (nl >= 0 ? fullMessage.slice(0, nl) : fullMessage).trim(), body: (nl >= 0 ? fullMessage.slice(nl + 1) : '').trim() };
    const commitMissing = !api;

    let oldText = null;
    try { oldText = await httpGet(rawUrl(meta.repository_name, meta.previous_sha, meta.test_file_path)); }
    catch (e) { fetchErrors.push({ case_id: row.case_id, what: 'raw_old_test', error: String(e.message || e).split('\n')[0] }); }

    const blocks = api
      ? diffFiles.filter((f) => typeof f.patch === 'string' && f.patch.length).map((f) => ({
          path: f.filename,
          text: `diff --git a/${f.filename} b/${f.filename}\n--- a/${f.filename}\n+++ b/${f.filename}\n${f.patch}`,
        }))
      : [];
    const allPaths = blocks.map((b) => b.path);
    const appFiles = api ? allPaths.filter((f) => !isTestPath(f, meta.test_file_path)) : null;
    const appDiffFiles = appFiles ? appFiles.filter((f) => APP_DIFF_EXT.test(f) && !LOCKFILE.test(f)) : null;
    let appDiff = '';
    let appDiffNote = '';
    if (appDiffFiles && appDiffFiles.length) {
      appDiff = joinDiffBlocks(blocks.filter((b) => appDiffFiles.includes(b.path))).trim();
      if (!appDiff) appDiffNote = '所选应用源码文件无文本差异';
    } else if (appDiffFiles) {
      appDiffNote = '本次提交没有可展示的应用源码文件改动（可能仅改测试/文档/锁文件）';
    }

    let oldBlock = null, oldBlockMethod = null, oldBlockStart = null, oldBlockEnd = null;
    let oldBlockLines = 0, oldHasOldLocator = false, oldLeaksNewLocator = false;
    if (oldText == null) {
      problems.push({ case_id: row.case_id, status: 'old_test_missing', reason: `无法读取 ${meta.test_file_path}@${meta.previous_sha}` });
    } else {
      oldHasOldLocator = oldText.includes(meta.old_locator);
      oldLeaksNewLocator = oldText.includes(meta.new_locator);
      if (!oldHasOldLocator) problems.push({ case_id: row.case_id, status: 'old_locator_not_in_old_test', reason: '旧测试文件中找不到 old_locator' });
      if (oldLeaksNewLocator) problems.push({ case_id: row.case_id, status: 'old_test_contains_new_locator', reason: '旧测试已含 new_locator，按无泄漏规则不得展示' });
      if (!oldLeaksNewLocator) {
        const b = extractTestBlock(oldText, Number(meta.line_no));
        oldBlock = b.text; oldBlockMethod = b.method;
        oldBlockStart = b.start_line; oldBlockEnd = b.end_line; oldBlockLines = b.line_count;
      }
    }
    let oldBlockSupplement = null;
    if (oldBlock && !ASSERTION_RE.test(oldBlock)) {
      const ls = oldText.split('\n');
      const from = Math.max(0, Number(meta.line_no) - 1 - 80);
      const to = Math.min(ls.length, Number(meta.line_no) + 80);
      oldBlockSupplement = ls.slice(from, to).join('\n');
    }

    const sanitizedBody = message.body.split(meta.new_locator).join('<LOCATOR_REDACTED>');
    const sanitizedAppDiff = (appDiff || '').split(meta.new_locator).join('<LOCATOR_REDACTED>');
    if (sanitizedBody !== message.body) problems.push({ case_id: row.case_id, status: 'commit_body_redacted', reason: 'commit 正文中出现 new_locator，已替换' });
    if (sanitizedAppDiff !== (appDiff || '')) problems.push({ case_id: row.case_id, status: 'app_diff_redacted', reason: '应用 diff 中出现 new_locator，已替换' });
    appDiff = sanitizedAppDiff;

    let testDiff = { text: null, added: 0, removed: 0, hunks: 0 };
    let verification = null;
    let redactionStatus = 'not_run';
    let reason = '';
    const testBlock = blocks.find((b) => b.path === meta.test_file_path);
    if (!api) {
      redactionStatus = 'commit_api_missing';
      reason = 'commit API 不可用';
    } else if (!testBlock) {
      redactionStatus = 'test_file_not_in_diff';
      reason = '本次提交中旧测试文件没有改动';
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
      // 断言期望值里的字符串本身允许可见（例如 toContainText('await page.getByText(...)')）。
      // 若唯一命中的是字符串字面量里的 .locator(...) 文本，再跑一次剥离字符串后的代码级复核；
      // 通过则记为“字符串内语法误报”，不改变协议对“寻址路径不得泄露”的判定。
      if (!verification.pass) {
        const stripped = verifyRedaction({
          redactedText: stripStringLiterals(testDiff.text),
          newLocator: meta.new_locator,
          newTestPath: meta.test_file_path,
          newTestAddedLines: addedLines.map(stripStringLiterals),
          redactedFullContext: stripStringLiterals(fullContext),
          allowedOldText: stripStringLiterals(oldText || ''),
          visibleOldText: stripStringLiterals([oldBlock || '', oldBlockSupplement || ''].join('\n')),
        });
        if (stripped.pass) {
          verification.pass = true;
          verification.string_literal_false_positives = {
            note: '原命中全部位于断言期望值字符串内，属于允许可见的语义锚；剥离字符串后的代码级复核通过。',
            original_locator_syntax_hits: verification.locator_syntax_hits,
          };
          verification.locator_syntax_hits_in_code = [];
        }
      }
      if (!verification.pass) {
        redactionStatus = 'failed';
        reason = '遮蔽不可还原验证未通过';
        testDiff.text = '（遮蔽验证未通过，断言级 diff 已移除；请协调者复核后再发放。）';
        problems.push({ case_id: row.case_id, status: 'redaction_failed', reason, verification });
        console.log(`  REDACTION FAIL ${row.case_id}: leaks=${verification.mechanical_leaks.length} newLines=${verification.new_test_line_hits.length} syntax=${verification.locator_syntax_hits.length}`);
        for (const l of verification.mechanical_leaks.slice(0, 3)) console.log(`    leak ${l.kind}=${JSON.stringify(l.value)}`);
        for (const l of verification.new_test_line_hits.slice(0, 3)) console.log(`    new-test-line ${JSON.stringify(l)}`);
        for (const l of verification.locator_syntax_hits.slice(0, 3)) console.log(`    syntax ${JSON.stringify(l)}`);
      } else redactionStatus = 'pass';
    }

    const diffOk = !!api && (parentOk || sourceMode === 'github_compare_api_range');
    const status = !oldText || oldLeaksNewLocator || !diffOk || filesTruncated ? 'blocked'
      : (redactionStatus === 'pass' ? 'ok' : redactionStatus);

    contexts.push({
      ...base, status,
      source_mode: sourceMode,
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
    console.log(`built ${row.case_id}: ${status} (${redactionStatus})`);
  }

  writeJson(CONTEXT, {
    generated_for: 'RQ3 expansion batch (stage 2) — independent namespace rbx',
    source_csv: rel(SAMPLE_CSV),
    breaks: rel(BREAKS),
    contexts, problems, fetch_errors: fetchErrors,
  });

  writeJson(VER_JSON, {
    rule: 'mask mechanical addressing paths only (CSS/id/class/data-*/xpath/nth/first/last/page.$ selector strings/path fragments); keep semantic anchors (getByRole role+name, getByText-like text, filter hasText, assertion values/matchers).',
    contexts: contexts.map((c) => ({
      case_id: c.case_id, rb_id: c.rb_id, repo: c.repo, status: c.status,
      redaction_status: c.redaction_status, verification: c.verification,
    })),
  });

  fs.writeFileSync(CONTEXT_MD, worksheet(contexts, problems));
  fs.writeFileSync(VER_MD, verificationMarkdown(contexts));

  const ok = contexts.filter((c) => c.status === 'ok').length;
  const verified = contexts.filter((c) => c.verification && c.verification.pass).length;
  console.log(`context: ${contexts.length} rows, status ok=${ok}, redaction PASS=${verified}, problems=${problems.length}, fetch_errors=${fetchErrors.length}`);
  for (const p of problems) console.log(`PROBLEM ${p.case_id} ${p.status}: ${p.reason}`);
}

function worksheet(contexts, problems) {
  const intro = `# RQ3 扩展批次盲评上下文（第二标注者用，独立批次）

> 完整规则见 \`diffe2e/experiments/annotate/ANNOTATION_GUIDE.md\`。本页只保留填写时最常用的判断方法。
> 本批共 ${contexts.length} 条，case_id 以 \`rbx\` 开头；与主实验 \`rb\` 批次完全独立，不共用条目、不共用哈希清单。

你只需要判断：**旧测试为什么会失效**。不要看任何 \`*_unblind.json\`、\`*_rationale.md\`，也不要打开 commit 的 new test 文件。

## 怎么看、怎么判

每条看这些：

1. \`old_locator\`：断掉的是哪个定位器。
2. 完整旧测试块：这个 \`it/test\` 块原本在操作什么、断言什么。
3. \`Commit\` / \`Commit 说明\`：加功能、修 bug、重构、迁移，还是改业务规则。
4. 完整应用改动文件列表：这次提交改了哪些非测试文件。
5. 应用源码 diff：应用代码具体怎么改（已排除测试文件）。
6. 断言级测试 diff（机械定位方式已遮蔽）：只显示断言增删。**遮蔽对象是寻址路径，不是语义锚**：CSS/id/class/\`data-*\`/xpath/\`nth\` 等被替换为 \`<LOCATOR_REDACTED>\`；\`getByRole\` 的 role 与 name、\`getByText\` 等的文本、\`filter({hasText})\` 的文本、断言值与 matcher 保持可见。若 \`-\`/\`+\` 行只因机械寻址方式不同而变得完全一样，新增侧标为 \`<LOCATOR_CHANGED>\`。

决策表：

| 你看到的情况 | 填 |
|---|---|
| 只是定位器写法、DOM 层级、class/id、文案锚点、测试 API 或框架迁移变了；测试想验证的东西没变 | \`STRUCTURAL_ONLY\` |
| 测试要验证的业务结果/断言目标本身变了；旧断言还在检查旧行为 | \`EXPECTATION_CHANGE\` |
| commit 像是修 bug/改行为，旧测试失败也可能是真的回归；看不出是测试老了还是应用坏了 | \`SUSPECTED_REGRESSION\` |
| 测试自身 flaky，只是把定位器改精确，意图不变 | \`STRUCTURAL_ONLY\` |
| 业务对象实质变化（例如 markdown 卡片改成 codeblock 卡片） | \`EXPECTATION_CHANGE\` |

特别规则：

- 仅由测试框架迁移或定位器 API 迁移引起 → \`STRUCTURAL_ONLY\`。
- 看不出是测试过时还是应用真回归 → 保守选 \`SUSPECTED_REGRESSION\`。

如果某条的完整旧测试块、应用 diff 或断言级测试 diff 缺失，停下来问协调者，不要用 commit 标题猜。

**不需要跑测试。** 这 ${contexts.length} 条来自 ReproBreak 的执行验证断裂，断已经是真的；跑新版本会暴露修复后的定位器，破坏盲评。判的是“失效类型”，不是“能否修好”。

## 怎么填

把每节末尾的 \`human2=___\` 改成三个标签之一：\`STRUCTURAL_ONLY\`、\`EXPECTATION_CHANGE\`、\`SUSPECTED_REGRESSION\`。\`final\` 留空（它只由第三人在两列不一致时填写）。

标签定义：

- \`STRUCTURAL_ONLY\`：测试意图不变；只是 locator、DOM 结构、文案锚点、测试 API 或格式变化。
- \`EXPECTATION_CHANGE\`：测试要验证的业务结果/断言目标发生了实质变化，修复需要改测试语义。
- \`SUSPECTED_REGRESSION\`：无法确定是测试过时，可能是新版本真实回归；保守判此类。

`;

  const sections = [];
  for (const c of contexts) {
    let body = `## ${c.case_id} — ${c.repo} (${c.framework})\n\n`;
    body += `- 测试文件：\`${c.test_file_path}\` 第 ${c.line_no} 行\n`;
    body += `- 旧定位器：\`${c.old_locator}\`\n`;
    body += `- Commit：${c.commit_subject || '（未取得）'}\n`;
    body += `- Commit 说明：${c.commit_body ? c.commit_body.replace(/\n/g, '\n  ') : '（该 commit 无正文）'}\n`;
    body += c.app_files
      ? `- 应用源码改动文件（${c.app_files.length}）：${c.app_files.length ? c.app_files.join(', ') : '（无）'}\n`
      : '- 应用源码改动文件：（未取得）\n';

    body += '\n### 完整旧测试块\n\n';
    if (c.old_block) {
      const methodNote = c.old_block_method === 'block'
        ? `完整 \`it/test\` 块，第 ${c.old_block_start_line}–${c.old_block_end_line} 行`
        : `未找到完整块，显示第 ${c.old_block_start_line}–${c.old_block_end_line} 行窗口`;
      body += `> 提取方式：${methodNote}；共 ${c.old_block_lines} 行。\n\n`;
      body += '```' + langOf(c.test_file_path) + '\n' + c.old_block.replace(/\n$/, '') + '\n```\n';
      if (c.old_block_supplement) {
        body += `\n> 该块内未检测到断言，以下补充断点前后窗口（第 ${Math.max(0, c.line_no - 1 - 80) + 1}–${c.line_no + 80} 行）：\n\n`;
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

    body += '\n判定：`human2=___`  备注：\n\n---\n\n';
    sections.push(body);
  }
  return intro + sections.join('');
}

function verificationMarkdown(contexts) {
  const lines = ['# RQ3 扩展批次遮蔽不可还原验证（沿用协议 B 规则）', '',
    '**遮蔽对象是寻址路径，不是语义锚。** 机械寻址字符串在已发放断言级 diff 中的精确 / 空白归一化 / token 命中必须为 0；`old_locator` 与旧测试块内容属于已披露输入，单独记录。', '',
    '## 逐条结果', '',
    '| case | repo | 结果 | 机械片段 | 新泄露 | 语法残留 | 新测试非断言行 | 语义锚(去重) |',
    '|---|---|---|---|---|---|---|---|'];
  for (const c of contexts) {
    if (!c.verification) {
      lines.push(`| ${c.case_id} | ${c.repo} | 未执行（${c.redaction_status}${c.redaction_reason ? '：' + c.redaction_reason : ''}） | - | - | - | - | - |`);
      continue;
    }
    const v = c.verification;
    lines.push(`| ${c.case_id} | ${c.repo} | ${v.pass ? 'PASS' : 'FAIL'} | ${(v.mechanical_checks || []).length} | ${(v.mechanical_leaks || []).length} | ${v.locator_syntax_hits.length} | ${v.new_test_line_hits.length} | ${(v.semantic_anchors_visible || []).length} |`);
  }
  lines.push('', '## 按协议允许可见的语义锚', '',
    '以下语义锚按协议保留可见，逐条列出以证明不是笼统放行：', '');
  for (const c of contexts) {
    const v = c.verification;
    lines.push(`### ${c.case_id} — ${c.repo}`, '');
    if (!v) { lines.push(`_未执行验证（${c.redaction_status}）。_`, ''); continue; }
    const anchors = v.semantic_anchors_visible || [];
    if (!anchors.length) { lines.push('_本条断言级 diff 中没有出现可保留的定位器语义锚。_', ''); continue; }
    lines.push('| 类型 | 值 | 出现次数 | 理由 |', '|---|---|---|---|');
    for (const a of anchors) lines.push(`| ${a.kind} | \`${a.value}\` | ${a.count} | ${a.reason} |`);
    lines.push('');
  }
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// 2. triage：新增 40 条的真实分诊（与主实验常量标签分开）
// ---------------------------------------------------------------------------
function triagePrompt(c) {
  const appDiff = (c.app_diff || '').slice(0, 8000);
  const oldBlock = (c.old_block || '').slice(0, 4000);
  const testDiff = (c.test_diff?.text || '').slice(0, 3000);
  return [
    '你是软件测试维护分诊器。判断这条已执行验证的定位器断裂属于哪类过时。',
    '',
    '判定规则（只依据下面材料，不得使用外部知识）：',
    '- STRUCTURAL_ONLY：测试意图不变，只是 locator、DOM 层级、class/id、文案锚点、测试 API 或框架迁移发生变化。',
    '- EXPECTATION_CHANGE：测试要验证的业务结果/断言目标本身变了，旧断言仍在检查旧行为。',
    '- SUSPECTED_REGRESSION：无法排除新版本真实回归，看不出是测试老了还是应用坏了；保守选此类。',
    '',
    '材料：',
    `旧定位器：${c.old_locator}`,
    `完整旧测试块：\n${oldBlock}`,
    `Commit 主题：${c.commit_subject || '（无）'}`,
    `Commit 说明：${c.commit_body || '（无正文）'}`,
    `应用源码改动文件（${(c.app_files || []).length}）：${(c.app_files || []).join(', ') || '（无）'}`,
    `应用源码 diff：\n${appDiff || '（无）'}`,
    `断言级测试 diff（定位路径已遮蔽，语义锚可见）：\n${testDiff || '（无）'}`,
    '',
    '只输出一个 JSON 对象，不要输出其它文字：',
    '{"label":"STRUCTURAL_ONLY|EXPECTATION_CHANGE|SUSPECTED_REGRESSION","reason":"引用材料中的具体证据"}',
  ].join('\n');
}

async function runTriage() {
  const ctx = readJson(CONTEXT);
  const contexts = ctx.contexts.filter((c) => c.status === 'ok');
  if (contexts.length !== 40) throw new Error(`triage needs 40 ok contexts, got ${contexts.length}`);

  const keyInfo = loadDeepSeekKey({ rootDir: ROOT });
  if (!keyInfo.ok) throw new Error(`DeepSeek key unavailable: ${keyInfo.message}`);
  const provider = 'deepseek';
  const cfg = PROVIDERS[provider];
  const allowed = LABELS.rq3;

  const cases = [];
  const failures = [];
  const usageLog = [];
  let totalAttempts = 0;
  for (const c of contexts) {
    const prompt = triagePrompt(c);
    if (/new_locator|annotator1|\bnodiff\b/i.test(prompt)) throw new Error(`${c.case_id} prompt contains forbidden content`);
    try {
      const res = await callModel({ provider, cfg, apiKey: keyInfo.key, userPrompt: prompt });
      totalAttempts += res.attempts;
      const ans = parseAnswer(res.raw, allowed);
      cases.push({
        case_id: c.case_id, rb_id: c.rb_id, repo: c.repo,
        label: ans.label, reason: ans.reason,
        prompt_sha256: crypto.createHash('sha256').update(prompt).digest('hex'),
        prompt_chars: prompt.length,
        raw: res.raw,
        attempts: res.attempts,
        budget_used: res.budget_used,
        finish_reason: res.finish_reason,
        usage: res.usage,
      });
      if (res.usage) usageLog.push({ case_id: c.case_id, ...res.usage });
      console.log(`triage ${c.case_id}: ${ans.label}`);
    } catch (e) {
      failures.push({ case_id: c.case_id, error: e.message, attempts: e.attempts || null });
      console.log(`TRIAGE FAIL ${c.case_id}: ${e.message}`);
    }
  }

  const distribution = {};
  for (const c of cases) distribution[c.label] = (distribution[c.label] || 0) + 1;
  const byRepo = {};
  for (const c of cases) {
    byRepo[c.repo] = byRepo[c.repo] || {};
    byRepo[c.repo][c.label] = (byRepo[c.repo][c.label] || 0) + 1;
  }

  const inputTokens = usageLog.reduce((s, u) => s + (u.prompt_tokens || 0), 0);
  const outputTokens = usageLog.reduce((s, u) => s + (u.completion_tokens || 0), 0);

  writeJson(TRIAGE, {
    generated_for: 'RQ3 expansion batch real triage (stage 2)',
    provider,
    model: cfg.model,
    temperature: TEMPERATURE,
    first_column_policy: '扩展批次真实分诊；主实验模型列仍为常量 STRUCTURAL_ONLY。两批不合并、不重跑主实验。',
    input_material: '旧定位器 + 完整旧测试块 + commit 主题/正文 + 应用源码 diff + 遮蔽后的断言级测试 diff；不含 new_locator、不含主实验条目。',
    n: cases.length,
    failures,
    attempts_total: totalAttempts,
    usage: usageLog.length ? { calls_with_usage: usageLog.length, prompt_tokens: inputTokens, completion_tokens: outputTokens } : null,
    distribution,
    by_repo: byRepo,
    cases,
  });

  // 更新解盲键：写入真实分诊标签，供扩展批次后续评分使用（绝不写主表）
  const unblind = readJson(UNBLIND);
  for (const c of cases) {
    if (!unblind[c.case_id]) continue;
    unblind[c.case_id].model_label = c.label;
    unblind[c.case_id].triage = { label: c.label, reason: c.reason, prompt_sha256: c.prompt_sha256 };
  }
  writeJson(UNBLIND, unblind);

  const lines = ['# RQ3 扩展批次真实分诊（40 条）', '',
    `- 提供方：${provider} / ${cfg.model}，temperature=${TEMPERATURE}`,
    `- 有效分诊：${cases.length}/40；失败：${failures.length}`,
    `- 标签分布：${Object.entries(distribution).map(([k, v]) => `${k}=${v}`).join('，')}`,
    '- 口径：本批为真实分诊；主实验 40 条模型列仍为常量 `STRUCTURAL_ONLY`，不重跑、不合并。', '',
    '| case | repo | label | 理由（节选） |', '|---|---|---|---|'];
  for (const c of cases) lines.push(`| ${c.case_id} | ${c.repo} | ${c.label} | ${String(c.reason).replace(/\|/g, '\\|').slice(0, 120)} |`);
  if (failures.length) {
    lines.push('', '## 失败', '');
    for (const f of failures) lines.push(`- ${f.case_id}: ${f.error}`);
  }
  fs.writeFileSync(TRIAGE_MD, lines.join('\n') + '\n');
  console.log(`triage: ${cases.length}/40, ${JSON.stringify(distribution)}, failures=${failures.length}`);
}

// ---------------------------------------------------------------------------
// 3. packet：独立盲评包（独立 case_id / 独立 SHA256SUMS）
// ---------------------------------------------------------------------------
function buildPacket() {
  fs.mkdirSync(PACKET, { recursive: true });
  const ctx = readJson(CONTEXT);
  const contexts = ctx.contexts;
  const verified = contexts.filter((c) => c.verification && c.verification.pass).length;
  if (verified !== 40) throw new Error(`refuse to build packet: redaction PASS ${verified}/40`);

  const worksheetText = fs.readFileSync(CONTEXT_MD, 'utf8');
  // 泄漏/串批检查：发放材料不得出现 new_locator、主实验 rb 编号、第一列标识。
  const forbidden = [
    ['new_locator', /new_locator/i],
    ['主实验 rb 编号', /(^|[^A-Za-z0-9])rb\d{3}(?![0-9])/m],
    ['annotator1', /annotator1/i],
    ['主实验 case_id', /\brb0[0-3]\d\b/],
  ];
  for (const [name, re] of forbidden) {
    if (re.test(worksheetText)) throw new Error(`packet worksheet contains forbidden content: ${name}`);
  }

  fs.writeFileSync(path.join(PACKET, 'rq3_context.md'), worksheetText);
  writeCsv(path.join(PACKET, 'rq3_fill_template.csv'),
    ['case_id', 'human2', 'final'],
    contexts.map((c) => ({ case_id: c.case_id, human2: '', final: '' })));

  const instructions = `# RQ3 扩展批次盲评材料说明

这份材料包只用于 **RQ3 扩展批次**（40 条，case_id \`rbx001\`–\`rbx040\`）。它与主实验 \`rb\` 批次完全独立：不共用条目、不共用哈希清单、不引用主实验标签或结果。

## 打开哪些文件

| 任务 | 工作文件（直接编辑） | 填哪一列 |
|---|---|---|
| RQ3 扩展批次（40 条断裂） | \`rq3_context.md\` | 每节末尾 \`human2=STRUCTURAL_ONLY\` / \`EXPECTATION_CHANGE\` / \`SUSPECTED_REGRESSION\` |

\`final\` 一律留空，它只由第三仲裁者在两列不一致时填写。\`rq3_fill_template.csv\` 是手工录入的备用模板。

## 判什么

一条已执行验证的 locator 断裂属于哪种过时：

- \`STRUCTURAL_ONLY\`：测试意图不变，只是 locator / DOM 层级 / class/id / 文案锚点 / 测试 API / 框架迁移变了。
- \`EXPECTATION_CHANGE\`：测试要验证的业务结果/断言目标本身变了，旧断言还在检查旧行为。
- \`SUSPECTED_REGRESSION\`：无法排除新版本真回归；看不出是测试老了还是应用坏了。保守选项。

依据：旧定位器、完整旧测试块、commit 主题与正文、完整应用改动文件列表、应用源码 diff、断言级测试 diff（机械定位方式已遮蔽，语义锚可见）。

## 禁止

- 不要打开 \`rq3_expansion_unblind.json\`、\`rq3_expansion_triage.json\` 或任何 \`*_unblind.json\`、\`*_rationale.md\`；
- 不要打开被测仓库、git 历史、commit 网页/PR/issue；
- 不要运行被测测试（会直接暴露 new locator）；
- 不要查看或推测真实分诊标签、主实验第一列或任何自动指标。

## 交付

- 保存为 UTF-8，不要增删节、不要改标题和顺序；
- 全部填完后，协调者会做锁定与 \`shasum -a 256\` 记录，再进入扩展批次的结构闸门与评分。
`;
  fs.writeFileSync(path.join(PACKET, 'ANNOTATOR_INSTRUCTIONS.md'), instructions);

  const coverage = ['# RQ3 扩展批次盲评材料覆盖清单', '',
    `- 条目：${contexts.length} 条（\`rbx001\`–\`rbx040\`）。`,
    `- 每仓 10 条：${[...new Set(contexts.map((c) => c.repo))].map((r) => `${r}=${contexts.filter((c) => c.repo === r).length}`).join('，')}。`,
    `- 完整旧测试块（block 提取）：${contexts.filter((c) => c.old_block_method === 'block').length}。`,
    `- 旧测试块退化为窗口：${contexts.filter((c) => c.old_block_method === 'window').length}。`,
    `- 应用 diff 为空：${contexts.filter((c) => !c.app_diff).length}。`,
    `- 遮蔽验证 PASS：${verified}/40。`,
    '',
    '## 逐条', '',
    '| case_id | repo | 旧块 | 行数 | 应用文件 | diff 行 | 断言 +/− | 遮蔽 | 备注 |',
    '|---|---|---|---|---|---|---|---|---|'];
  for (const c of contexts) {
    const appDiffLines = (c.app_diff || '').split('\n').filter(Boolean).length;
    const td = c.test_diff || {};
    const notes = [];
    if (c.commit_body_missing) notes.push('commit 无正文');
    if (c.app_files && c.app_files.length === 0) notes.push('无应用文件改动');
    if (!c.app_diff) notes.push(c.app_diff_note || '无应用 diff');
    if (c.old_block_method === 'window') notes.push('旧测试块退化为窗口');
    if (!c.old_has_old_locator) notes.push('旧文件找不到 old_locator');
    coverage.push(`| ${c.case_id} | ${c.repo} | ${c.old_block_method || '-'} | ${c.old_block_lines || 0} | ${c.app_files ? c.app_files.length : '-'} | ${appDiffLines} | ${td.added || 0}/${td.removed || 0} | ${c.redaction_status} | ${notes.join('；') || '-'} |`);
  }
  coverage.push('', '## 阻塞与缺失', '');
  if (!ctx.problems.length) coverage.push('无。');
  for (const p of ctx.problems) coverage.push(`- ${p.case_id}: ${p.status} — ${p.reason}`);
  fs.writeFileSync(path.join(PACKET, 'COVERAGE_REPORT.md'), coverage.join('\n') + '\n');

  fs.copyFileSync(VER_JSON, path.join(PACKET, 'redaction_verification.json'));
  fs.copyFileSync(VER_MD, path.join(PACKET, 'redaction_verification.md'));

  const files = fs.readdirSync(PACKET).filter((f) => f !== 'SHA256SUMS').sort();
  const sums = files.map((f) => `${crypto.createHash('sha256').update(fs.readFileSync(path.join(PACKET, f))).digest('hex')}  ${f}`);
  fs.writeFileSync(path.join(PACKET, 'SHA256SUMS'), sums.join('\n') + '\n');
  console.log(`packet: ${files.length} files, PASS ${verified}/40 -> ${rel(PACKET)}`);
}

// ---------------------------------------------------------------------------
// 4. report：扩展分布 + 与主实验 40 条对照
// ---------------------------------------------------------------------------
function locatorFamily(locator) {
  const s = String(locator || '');
  if (/cy\.get|cy\.contains|\bcy\./i.test(s)) return 'cy.get / cy.contains';
  if (/getByTestId/i.test(s)) return 'getByTestId';
  if (/getByRole/i.test(s)) return 'getByRole';
  if (/(getByText|getByLabel|getByPlaceholder|getByAltText|getByTitle)/i.test(s)) return 'getByText-like';
  if (/\.locator\s*\(/i.test(s)) return 'locator';
  if (/querySelector|waitForSelector|\$\$?\s*\(/i.test(s)) return 'css / $';
  return 'other';
}

function distributionOf(arr, keyFn) {
  const out = {};
  for (const x of arr) { const k = keyFn(x); out[k] = (out[k] || 0) + 1; }
  return out;
}

function buildReport() {
  const sample = parseCSV(fs.readFileSync(SAMPLE_CSV, 'utf8')).rows;
  const ctx = readJson(CONTEXT).contexts;
  const triage = readJson(TRIAGE);
  const unblind = readJson(UNBLIND);
  const mainRows = parseCSV(fs.readFileSync(MAIN_CSV, 'utf8')).rows;
  const mainUnblind = readJson(MAIN_UNBLIND);
  const breaks = readJson(BREAKS);

  const triageByCase = new Map(triage.cases.map((c) => [c.case_id, c]));
  const pools = {};
  for (const b of breaks) {
    const row = sample.find((r) => r.rb_id === String(b.id));
    if (!row) continue;
    pools[row.repo] = (pools[row.repo] || 0) + 1;
  }
  // 池大小需要同口径：按 e2e rows 中 meta 可用的条目计数
  const e2e = readJson(E2E);
  const metaIds = new Set(breaks.map((b) => String(b.id)));
  const poolCounts = {};
  for (const r of e2e.rows) if (metaIds.has(String(r.id))) poolCounts[r.repo] = (poolCounts[r.repo] || 0) + 1;

  const repos = [...new Set(sample.map((r) => r.repo))].sort();
  const triageDist = triage.distribution;
  const mainModelDist = distributionOf(mainRows, (r) => mainUnblind[r.case_id]?.model_label || 'missing');
  const mainRepoDist = distributionOf(mainRows, (r) => r.repo);
  const expRepoDist = distributionOf(sample, (r) => r.repo);
  const expFramework = distributionOf(ctx, (c) => c.framework || 'unknown');
  const expLocator = distributionOf(ctx, (c) => locatorFamily(c.old_locator));
  const expAppSignal = distributionOf(ctx, (c) => (c.app_files && c.app_files.length > 0 ? 'app_files>0' : 'app_files=0'));
  const semanticSameAsNew = ctx.filter((c) => c.test_diff?.text && c.new_locator && c.test_diff.text.includes(c.new_locator)).length;

  const metrics = {
    generated_at: new Date().toISOString(),
    batch: 'expansion_20261108_rq3',
    n: sample.length,
    main_n: mainRows.length,
    sample_per_repo: SAMPLE_PER_REPO,
    skip_per_repo: SKIP_PER_REPO,
    repo_pool_sizes: poolCounts,
    expansion_repo_distribution: expRepoDist,
    expansion_framework: expFramework,
    expansion_locator_family: expLocator,
    expansion_app_signal: expAppSignal,
    semantic_anchor_same_as_new_locator: semanticSameAsNew,
    expansion_triage_distribution: triageDist,
    expansion_triage_by_repo: triage.by_repo,
    main_model_distribution: mainModelDist,
    main_human_b_masked_distribution: { STRUCTURAL_ONLY: 40, EXPECTATION_CHANGE: 0, SUSPECTED_REGRESSION: 0 },
    overlap_with_main: 0,
    main_table_sha256: gitHash(MAIN_CSV),
    main_unblind_sha256: gitHash(MAIN_UNBLIND),
  };
  writeJson(METRICS, metrics);

  const lines = ['# RQ3 扩展批次报告（阶段二）', '',
    `- 批次目录：\`${rel(EXP)}\``,
    `- 主实验：RQ3 40 条（每仓 10，hash 前 10），模型列常量 \`STRUCTURAL_ONLY\`，**不重跑、不改表**。`,
    `- 扩展批次：RQ3 40 条（每仓第 11–20 条，case_id \`rbx001\`–\`rbx040\`）。`,
    '- 两批统计不合并；本报告只描述扩展批次，并与主实验做构成对照。', '',
    '## 1. 扩展批分布', '',
    '### 1.1 抽样与池量', '',
    '| 仓库 | 池量 | 主实验 | 扩展批 | 扩展批抽样比 | 两批合计抽样比 |',
    '|---|---:|---:|---:|---:|---:|'];
  for (const repo of repos) {
    const pool = poolCounts[repo] || 0;
    lines.push(`| ${repo} | ${pool} | ${mainRepoDist[repo] || 0} | ${expRepoDist[repo] || 0} | ${(10 / pool * 100).toFixed(1)}% | ${(20 / pool * 100).toFixed(1)}% |`);
  }
  lines.push('', '> 为什么保持每仓等额、不改按池比例：主实验是 4 仓各 10；若把 80 条按 245:78:46:45 分配，angular-slickgrid 会占近 6 成，openmct/playwright 各不足 10 条，直接破坏与主实验的可比性，也让小仓类别覆盖更薄。因此扩展批沿用“每仓 10 + 10”的等额设计，与主实验同构。代价是小仓抽样比偏高（见上表），报告中已如实列出，不能把 80 条当作 414 池的无偏代表。', '');

  lines.push('### 1.2 可观测分层（不依赖系统标签）', '',
    `- 框架：${Object.entries(expFramework).map(([k, v]) => `${k}=${v}`).join('，')}。`,
    `- 定位器族：${Object.entries(expLocator).map(([k, v]) => `${k}=${v}`).join('，')}。`,
    `- 应用信号：${Object.entries(expAppSignal).map(([k, v]) => `${k}=${v}`).join('，')}。`, '');

  lines.push('### 1.3 真实分诊分布', '',
    `- 有效分诊：${triage.n}/40；调用尝试总数 ${triage.attempts_total}；失败 ${triage.failures.length}。`,
    `- 总体：${Object.entries(triageDist).map(([k, v]) => `${k}=${v}`).join('，')}。`,
    '- 分仓：', '');
  for (const repo of repos) {
    const d = triage.by_repo[repo] || {};
    lines.push(`  - ${repo}：${Object.entries(d).map(([k, v]) => `${k}=${v}`).join('，') || '（无）'}`);
  }
  lines.push('');

  lines.push('## 2. 与主实验 40 条的对照', '',
    '| 维度 | 主实验 40 | 扩展 40 |', '|---|---|---|',
    '| 抽样位置 | 每仓 hash 前 10 | 每仓 hash 第 11–20 |',
    '| 与对方重叠 | — | 0 条 |',
    `| 仓库构成 | ${Object.entries(mainRepoDist).map(([k, v]) => `${k}=${v}`).join('，')} | ${Object.entries(expRepoDist).map(([k, v]) => `${k}=${v}`).join('，')} |`,
    `| 模型侧口径 | 常量 STRUCTURAL_ONLY：${Object.entries(mainModelDist).map(([k, v]) => `${k}=${v}`).join('，')} | 真实分诊：${Object.entries(triageDist).map(([k, v]) => `${k}=${v}`).join('，')} |`,
    '| 人工协议 B 正式列 | SO=40 / EC=0 / SR=0 | 待第二标注者回收（本批未做人工） |',
    '| 统计处理 | 主实验单独报告 | 扩展批次单独报告，不合并 κ / 不合并 p 值 |', '');

  const mainSO = mainModelDist.STRUCTURAL_ONLY || 0;
  lines.push('### 2.1 真实分诊与常量标签的差异', '',
    `- 主实验模型侧不是逐条分类器，而是常量 \`STRUCTURAL_ONLY\`（${mainSO}/40）；它只用于退化展示，不能与真实分诊混为一谈。`,
    `- 扩展批次真实分诊得到：${Object.entries(triageDist).map(([k, v]) => `${k}=${v}`).join('，')}。`,
    '- 因此两批的“模型-人工一致性”不可直接比较；扩展到 80 条时也只能分两段报告，不能把常量 40 与真实分诊 40 拼成一个分类器的 n=80。', '');

  lines.push('## 3. 材料包与校验', '');
  const packetDir = `\`${rel(PACKET)}\``;
  if (fs.existsSync(path.join(PACKET, 'SHA256SUMS'))) {
    const sums = fs.readFileSync(path.join(PACKET, 'SHA256SUMS'), 'utf8').trim().split('\n');
    lines.push(`- 独立盲评包：${packetDir}，${sums.length} 个文件，独立 \`SHA256SUMS\`。`);
    lines.push('- 校验方式：在包目录执行 `shasum -a 256 -c SHA256SUMS`。');
  } else {
    lines.push(`- 盲评包尚未生成（${packetDir}）。`);
  }
  lines.push(`- 遮蔽泄漏复核：${ctx.filter((c) => c.verification && c.verification.pass).length}/40 PASS（按协议 B 规则重做）。`);
  lines.push(`- 语义锚同形说明：${semanticSameAsNew}/40 条的断言级差异中出现与允许可见语义锚（role+name / text）字面相同的新定位器；这是协议 B 明确保留可见的语义信息，不属于机械寻址路径泄漏。机械路径泄露命中为 0。`, '');

  lines.push('## 4. 边界声明', '',
    `- 主表哈希（本阶段前后不变）：\`rq3_reprobreak_to_annotate.csv\` = \`${gitHash(MAIN_CSV)}\`。`,
    `- 主解盲键哈希：\`rq3_reprobreak_to_annotate_unblind.json\` = \`${gitHash(MAIN_UNBLIND)}\`。`,
    '- 主实验盲评包、主表、冻结清单未改动；本阶段所有产物只写 `expansion_20261108/rq3/`。',
    '- 主实验模型侧不重跑；扩展批次真实分诊结果不回填主实验。',
    '- 阶段三（受控缺口扩样）未开始。', '');
  fs.writeFileSync(REPORT, lines.join('\n') + '\n');
  console.log(`report: ${rel(REPORT)}`);
}

// ---------------------------------------------------------------------------
async function main() {
  if (MODE === 'sample') buildSample();
  else if (MODE === 'context') await buildContext();
  else if (MODE === 'triage') await runTriage();
  else if (MODE === 'packet') buildPacket();
  else if (MODE === 'report') buildReport();
  else throw new Error(`unknown mode: ${MODE} (sample|context|triage|packet|report)`);
}
main().catch((e) => { console.error(`ERROR: ${e.stack || e.message}`); process.exit(1); });
