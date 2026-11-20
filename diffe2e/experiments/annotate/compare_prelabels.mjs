// Compare two LLM pre-label sets (condition A vs condition B) directly.
//
//   node experiments/annotate/compare_prelabels.mjs --write
//   node experiments/annotate/compare_prelabels.mjs --a <json> --b <json> --write
//
// Rows with status != ok (or a missing row) are reported as missing and are
// excluded from the paired matrix. No κ substitute is computed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const outDir = path.join(root, 'experiments', 'out');
const WRITE = process.argv.includes('--write');
const argValue = (flag) => {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
};
const A_JSON = argValue('--a') || path.join(outDir, 'annotator1_condA.json');
const B_JSON = argValue('--b') || path.join(outDir, 'annotator1_masked.json');
const OUT_MD = path.join(outDir, 'annotator1_condA_vs_masked_comparison.md');
const OUT_JSON = path.join(outDir, 'annotator1_condA_vs_masked_comparison.json');

const LABELS = {
  rq2: ['y', 'n'],
  rq3: ['STRUCTURAL_ONLY', 'EXPECTATION_CHANGE', 'SUSPECTED_REGRESSION'],
};
const CONTEXT = {
  rq2: ['route', 'gap_file'],
  rq3: ['rb_id', 'repo', 'test_file_path', 'line_no'],
};

const load = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

function labelOf(rows, id) {
  const row = rows[id];
  if (!row) return { status: 'missing_row', label: null, error: 'missing row' };
  if (row.status !== 'ok' || !row.label) {
    return {
      status: 'failed',
      label: null,
      error: row.error || row.retry_error || null,
      attempts: row.attempts ?? null,
      finish_reason: row.finish_reason ?? null,
      budgets_tried: row.budgets_tried ?? null,
    };
  }
  return { status: 'ok', label: row.label };
}

function compareFamily(fam, aRows, bRows) {
  const labels = LABELS[fam];
  const matrix = Object.fromEntries(labels.map((x) => [x, Object.fromEntries(labels.map((y) => [y, 0]))]));
  const flips = [];
  let paired = 0;
  let agree = 0;
  let failedA = 0;
  let failedB = 0;
  const failures = [];

  for (const id of [...new Set([...Object.keys(aRows), ...Object.keys(bRows)])].sort()) {
    const a = labelOf(aRows, id);
    const b = labelOf(bRows, id);
    const record = (side, x) => failures.push({
      case_id: id,
      side,
      status: x.status,
      error: x.error || null,
      attempts: x.attempts ?? null,
      finish_reason: x.finish_reason ?? null,
      budgets_tried: x.budgets_tried ?? null,
    });
    if (a.status !== 'ok') { failedA++; record('A', a); continue; }
    if (b.status !== 'ok') { failedB++; record('B', b); continue; }
    if (!labels.includes(a.label)) { failedA++; record('A', { status: 'invalid_label', error: `label=${a.label}` }); continue; }
    if (!labels.includes(b.label)) { failedB++; record('B', { status: 'invalid_label', error: `label=${b.label}` }); continue; }
    paired++;
    matrix[a.label][b.label]++;
    if (a.label === b.label) agree++;
    else flips.push({ case_id: id, a_label: a.label, b_label: b.label, reason: bRows[id]?.reason || '' });
  }

  const directions = {};
  for (const f of flips) {
    const k = `${f.a_label}→${f.b_label}`;
    directions[k] = (directions[k] || 0) + 1;
  }
  const distA = {};
  const distB = {};
  for (const id of Object.keys(aRows)) {
    const x = labelOf(aRows, id);
    if (x.status === 'ok') distA[x.label] = (distA[x.label] || 0) + 1;
  }
  for (const id of Object.keys(bRows)) {
    const x = labelOf(bRows, id);
    if (x.status === 'ok') distB[x.label] = (distB[x.label] || 0) + 1;
  }

  return {
    paired, agree, flips: flips.length, directions, matrix, failedA, failedB,
    distA, distB, flips_list: flips, failures_list: failures,
  };
}

const a = load(A_JSON);
const b = load(B_JSON);
const result = {
  a: { file: path.relative(root, A_JSON), condition: a.condition, model: a.model, provider: a.provider, temperature: a.temperature },
  b: { file: path.relative(root, B_JSON), condition: b.condition, model: b.model, provider: b.provider, temperature: b.temperature },
  rq2: compareFamily('rq2', a.rq2.rows, b.rq2.rows),
  rq3: compareFamily('rq3', a.rq3.rows, b.rq3.rows),
};

const short = { STRUCTURAL_ONLY: 'SO', EXPECTATION_CHANGE: 'EC', SUSPECTED_REGRESSION: 'SR' };
const show = (l) => short[l] || l;

function render(name, f) {
  const lines = [`## ${name}`, ''];
  lines.push(`- 配对 n=${f.paired}；一致=${f.agree}；翻转=${f.flips}（${f.paired ? ((f.flips / f.paired) * 100).toFixed(2) : '—'}%）`);
  lines.push(`- A 侧失败/缺失=${f.failedA}；B 侧失败/缺失=${f.failedB}`);
  lines.push(`- A 分布：${JSON.stringify(f.distA)}`);
  lines.push(`- B 分布：${JSON.stringify(f.distB)}`);
  lines.push('');
  const cols = LABELS[name.startsWith('RQ2') ? 'rq2' : 'rq3'];
  lines.push('| A \\ B | ' + cols.map(show).join(' | ') + ' | 行合计 |');
  lines.push('|' + '---|'.repeat(cols.length) + '---:|');
  for (const x of cols) {
    lines.push(`| ${show(x)} | ${cols.map((y) => f.matrix[x][y]).join(' | ')} | ${cols.reduce((s, y) => s + f.matrix[x][y], 0)} |`);
  }
  lines.push(`| 列合计 | ${cols.map((y) => cols.reduce((s, x) => s + f.matrix[x][y], 0)).join(' | ')} | ${f.paired} |`);
  if (f.flips_list.length) {
    lines.push('', '翻转明细：');
    for (const x of f.flips_list) lines.push(`- ${x.case_id}: ${show(x.a_label)} → ${show(x.b_label)}；B 理由：${x.reason || '（无）'}`);
  }
  lines.push('', '失败清单（显式列出，未静默排除）：');
  if (!f.failures_list.length) lines.push('- 无');
  for (const x of f.failures_list) {
    lines.push(`- ${x.case_id}：side=${x.side}；status=${x.status}；原因=${x.error || '（未记录）'}；attempts=${x.attempts ?? '—'}；finish_reason=${x.finish_reason ?? '—'}；budgets_tried=${JSON.stringify(x.budgets_tried ?? [])}`);
  }
  return lines.join('\n');
}

const report = [
  '# 条件 A vs 条件 B（两套预标注）',
  '',
  `- A：${result.a.file}；条件=${result.a.condition}；model=${result.a.model}；T=${result.a.temperature}`,
  `- B：${result.b.file}；条件=${result.b.condition}；model=${result.b.model}；T=${result.b.temperature}`,
  '',
  render('RQ2（y/n）', result.rq2), '',
  render('RQ3（SO/EC/SR）', result.rq3), '',
  '## 说明',
  '',
  'A 与 B 使用同一模型、同一 temperature、同一 prompt 文本，仅材料不同：A 为近似原始信息条件（信息更少），B 为协议 B 盲评材料（含应用源码 diff / 完整旧块 / 遮蔽断言 diff）。',
  '失败条目不计入配对矩阵，但逐条列入“失败清单”；两个 κ 仍因人工列为空而无法计算。',
].join('\n');

console.log(report);
if (WRITE) {
  fs.writeFileSync(OUT_MD, report + '\n');
  fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2) + '\n');
  console.log(`\nwrote ${path.relative(root, OUT_MD)}`);
  console.log(`wrote ${path.relative(root, OUT_JSON)}`);
}
