// Compare the original first-column pre-labels with the plan-C masked redo.
//
//   node experiments/annotate/compare_annotator1.mjs            # dry run
//   node experiments/annotate/compare_annotator1.mjs --write    # write report
//   node experiments/annotate/compare_annotator1.mjs --input experiments/out/annotator1_condA.json --write
//
// Reads (read-only):
//   out/rq2_real_to_annotate.csv   column annotator1_yn
//   out/rq3_reprobreak_to_annotate.csv column human1
//   <input json>                   masked (default) or condition-A redo
//
// Reports per family: paired n, agreement, flips, direction counts and a
// confusion matrix (rows = original, columns = input). Cohen's κ needs the
// human blind column; when it is empty the script says so and does NOT
// substitute another statistic.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const outDir = path.join(root, 'experiments', 'out');
const WRITE = process.argv.includes('--write');

const RQ2_MAIN = path.join(outDir, 'rq2_real_to_annotate.csv');
const RQ3_MAIN = path.join(outDir, 'rq3_reprobreak_to_annotate.csv');
const argValue = (flag) => {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
};

const DEFAULT_INPUT = path.join(outDir, 'annotator1_masked.json');
const INPUT_JSON = argValue('--input')
  || process.env.COMPARE_INPUT
  || DEFAULT_INPUT;
const INPUT_BASE = path.basename(INPUT_JSON, '.json');
const OUT_MD = path.join(outDir, `${INPUT_BASE}_comparison.md`);
const OUT_JSON = path.join(outDir, `${INPUT_BASE}_comparison.json`);

const RQ2_LABELS = ['y', 'n'];
const RQ3_LABELS = ['STRUCTURAL_ONLY', 'EXPECTATION_CHANGE', 'SUSPECTED_REGRESSION'];

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
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
  return { headers, rows: rows.filter((r) => r.length === headers.length).map((r) => Object.fromEntries(headers.map((h, j) => [h, r[j]]))) };
}

const trim = (v) => String(v ?? '').trim();

function loadMasked(file) {
  if (!fs.existsSync(file)) return { ok: false, reason: 'not_run' };
  try {
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!j?.rq2?.rows || !j?.rq3?.rows) return { ok: false, reason: 'missing_sections' };
    return { ok: true, json: j };
  } catch (e) {
    return { ok: false, reason: `unreadable: ${e.message}` };
  }
}

function compareFamily({ name, mainFile, origKey, humanKey, labels, maskedSection, contextFields }) {
  const main = parseCSV(fs.readFileSync(mainFile, 'utf8'));
  const maskedRows = maskedSection.rows || {};
  const matrix = Object.fromEntries(labels.map((a) => [a, Object.fromEntries(labels.map((b) => [b, 0]))]));
  const flips = [];
  let paired = 0;
  let agree = 0;
  let missingOrig = 0;
  let missingMasked = 0;
  let invalid = 0;
  const failures = [];

  for (const row of main.rows) {
    const caseId = trim(row.case_id);
    const orig = trim(row[origKey]);
    const m = maskedRows[caseId];
    if (!labels.includes(orig)) { missingOrig++; continue; }
    if (!m || !trim(m.label)) {
      missingMasked++;
      failures.push({
        case_id: caseId,
        side: 'redo',
        status: m ? (m.status || 'failed') : 'missing_row',
        error: m?.error || null,
        attempts: m?.attempts ?? null,
        finish_reason: m?.finish_reason ?? null,
        budgets_tried: m?.budgets_tried ?? null,
        label: m?.label ?? null,
      });
      continue;
    }
    const masked = trim(m.label);
    if (!labels.includes(masked)) {
      invalid++;
      failures.push({
        case_id: caseId,
        side: 'redo',
        status: 'invalid_label',
        error: `label=${masked}`,
        attempts: m?.attempts ?? null,
        finish_reason: m?.finish_reason ?? null,
        budgets_tried: m?.budgets_tried ?? null,
        label: masked,
      });
      continue;
    }
    paired++;
    matrix[orig][masked]++;
    if (orig === masked) agree++;
    else {
      const item = { case_id: caseId };
      for (const f of contextFields) item[f] = row[f] ?? '';
      item.orig_label = orig;
      item.masked_label = masked;
      item.reason = trim(m?.reason);
      flips.push(item);
    }
  }

  const directions = {};
  for (const f of flips) {
    const k = `${f.orig_label}→${f.masked_label}`;
    directions[k] = (directions[k] || 0) + 1;
  }

  let humanLabeled = 0;
  for (const row of main.rows) if (trim(row[humanKey]) !== '') humanLabeled++;

  return {
    name, n_main: main.rows.length, paired, agree, flips: flips.length, directions, matrix,
    missing_orig: missingOrig, missing_masked: missingMasked, invalid,
    human_labeled: humanLabeled, flips_list: flips, failures_list: failures,
  };
}

const redo = loadMasked(INPUT_JSON);
if (!redo.ok) {
  console.error(`BLOCKED: 重做结果不可用（${redo.reason}）：${path.relative(root, INPUT_JSON)}`);
  console.error('未计算任何对比或 κ；请先完成对应 runner 并生成结果 JSON。');
  process.exit(2);
}

const rq2 = compareFamily({
  name: 'RQ2（二分类：y/n）',
  mainFile: RQ2_MAIN,
  origKey: 'annotator1_yn',
  humanKey: 'annotator2_yn',
  labels: RQ2_LABELS,
  maskedSection: redo.json.rq2,
  contextFields: ['route', 'gap_file'],
});

const rq3 = compareFamily({
  name: 'RQ3（三分类：SO/EC/SR）',
  mainFile: RQ3_MAIN,
  origKey: 'human1',
  humanKey: 'human2',
  labels: RQ3_LABELS,
  maskedSection: redo.json.rq3,
  contextFields: ['rb_id', 'repo', 'test_file_path', 'line_no'],
});

const short = { STRUCTURAL_ONLY: 'SO', EXPECTATION_CHANGE: 'EC', SUSPECTED_REGRESSION: 'SR' };
const show = (l) => short[l] || l;

function render(f) {
  const lines = [];
  lines.push(`## ${f.name}`);
  lines.push('');
  lines.push(`- 主表 n=${f.n_main}，两条件都有合法标签的配对 n=${f.paired}`);
  lines.push(`- 一致=${f.agree}，翻转=${f.flips}（${f.paired ? ((f.flips / f.paired) * 100).toFixed(2) : '—'}%）`);
  lines.push(`- 第一列缺失/非法=${f.missing_orig}/${f.invalid}；重做列缺失=${f.missing_masked}`);
  lines.push(`- 人工第二列已标=${f.human_labeled}/${f.n_main}`);
  lines.push('');
  const cols = Object.keys(f.matrix);
  lines.push('| 原 \\ 重做 | ' + cols.map(show).join(' | ') + ' | 行合计 |');
  lines.push('|' + '---|'.repeat(cols.length) + '---:|');
  for (const a of cols) {
    lines.push(`| ${show(a)} | ${cols.map((b) => f.matrix[a][b]).join(' | ')} | ${cols.reduce((s, b) => s + f.matrix[a][b], 0)} |`);
  }
  lines.push(`| 列合计 | ${cols.map((b) => cols.reduce((s, a) => s + f.matrix[a][b], 0)).join(' | ')} | ${f.paired} |`);
  if (f.flips) {
    lines.push('');
    lines.push('翻转明细：');
    for (const x of f.flips_list) lines.push(`- ${x.case_id}: ${show(x.orig_label)} → ${show(x.masked_label)}；理由：${x.reason || '（无）'}`);
  }
  lines.push('');
  lines.push('失败清单（显式列出，未静默排除）：');
  if (!f.failures_list.length) lines.push('- 无');
  for (const x of f.failures_list) {
    lines.push(`- ${x.case_id}：status=${x.status}；原因=${x.error || '（未记录）'}；attempts=${x.attempts ?? '—'}；finish_reason=${x.finish_reason ?? '—'}；budgets_tried=${JSON.stringify(x.budgets_tried ?? [])}`);
  }
  return lines.join('\n');
}

const report = [
  `# 原第一列 vs ${INPUT_BASE}`,
  '',
  `- 输入：${path.relative(root, INPUT_JSON)}`,
  `- provider=${redo.json.provider || '?'} model=${redo.json.model || '?'} temperature=${redo.json.temperature ?? '?'} max_tokens=${redo.json.max_tokens ?? '?'}`,
  `- 条件：${redo.json.condition || '?'}`,
  `- 已知偏差项：${Array.isArray(redo.json.known_deviations) ? redo.json.known_deviations.length : 0} 条（详见 manifest）`,
  '',
  render(rq2), '', render(rq3), '',
  '## Cohen\'s κ',
  '',
  '人工第二列仍为空，两个 κ（RQ2 30 条、RQ3 40 条）都**无法计算**。本报告不采用准确率、F1 或其他替代指标冒充 κ。',
].join('\n');

console.log(report);
if (WRITE) {
  fs.writeFileSync(OUT_MD, report + '\n');
  fs.writeFileSync(OUT_JSON, JSON.stringify({ rq2, rq3, redo_params: { provider: redo.json.provider, model: redo.json.model, temperature: redo.json.temperature, condition: redo.json.condition } }, null, 2) + '\n');
  console.log(`\nwrote ${path.relative(root, OUT_MD)}`);
  console.log(`wrote ${path.relative(root, OUT_JSON)}`);
}
