import fs from 'node:fs';
import path from 'node:path';

const round4 = (x) => Number.isFinite(x) ? +x.toFixed(4) : null;
const mean = (xs) => xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export function readJsonl(file) {
  const text = fs.readFileSync(file, 'utf8').trim();
  return text ? text.split('\n').map((line) => JSON.parse(line)) : [];
}

export function classifyRow(row, method = 'dual') {
  const m = row.metrics?.[method];
  if (!m) throw new Error(`row ${row.sha || '<unknown>'} has no metrics.${method}`);
  if (m.selected_count === 0) return 'empty';
  if (m.selected_count >= m.full_suite) return 'full';
  return 'partial';
}

function rowCounts(row, method) {
  const m = row.metrics?.[method];
  if (!m) throw new Error(`row ${row.sha || '<unknown>'} has no metrics.${method}`);
  return {
    selected: m.selected_count,
    full: m.full_suite,
    reduction: m.Reduction ?? (m.full_suite ? 1 - m.selected_count / m.full_suite : 0),
  };
}

function estimateTransition(row, costProfile, method) {
  const counts = rowCounts(row, method);
  const bucket = classifyRow(row, method);
  const tFull = costProfile.T_full_ms?.median ?? 0;
  const tSelect = costProfile.T_select_ms?.median ?? 0;
  let tRunSel = 0;
  let estimate = 'measured-empty-profile';

  if (bucket === 'full') {
    tRunSel = tFull;
    estimate = 'full-selection-reuses-full-suite-profile';
  } else if (bucket === 'partial') {
    tRunSel = counts.full ? tFull * (counts.selected / counts.full) : 0;
    estimate = 'linear-partial-estimate';
  }

  const oursTotal = tSelect + tRunSel;
  return {
    sha: row.sha,
    bucket,
    selected_count: counts.selected,
    full_count: counts.full,
    Reduction: round4(counts.reduction),
    T_full_ms: round4(tFull),
    T_select_ms: round4(tSelect),
    T_run_sel_ms: round4(tRunSel),
    ours_total_ms: round4(oursTotal),
    NetSaving: tFull ? round4(1 - oursTotal / tFull) : 0,
    break_even: tFull ? oursTotal < tFull : false,
    estimate,
  };
}

export function summarizeBatch(rows, costProfile, options = {}) {
  const method = options.method || 'dual';
  const transitions = rows.map((row) => estimateTransition(row, costProfile, method));
  const buckets = { empty: 0, partial: 0, full: 0 };
  for (const t of transitions) buckets[t.bucket] += 1;

  const partial = buckets.partial > 0;
  const selectionMeasured = !!costProfile.T_select_ms?.measured;
  const caveats = [];
  if (!selectionMeasured) caveats.push('T_select is not measured in the supplied cost profile; batch NetSaving may be optimistic.');
  if (partial) caveats.push('Partial selected sets use a linear runtime estimate unless a per-transition measurement is supplied.');
  if (buckets.full) caveats.push('Full-selection transitions are modeled as full-suite runtime plus selection overhead, so they do not create runtime savings.');

  return {
    project: costProfile.project,
    source_profile: costProfile.project ? `${costProfile.project}_rq4.json` : null,
    method: `${method} batch-estimated from RQ1 transitions and one RQ4 cost profile`,
    transitions: transitions.length,
    workers: costProfile.workers ?? null,
    full_count: costProfile.full_count ?? null,
    buckets,
    selectionMeasured,
    meanReduction: round4(mean(transitions.map((t) => t.Reduction))),
    medianReduction: round4(median(transitions.map((t) => t.Reduction))),
    meanNetSaving: round4(mean(transitions.map((t) => t.NetSaving))),
    medianNetSaving: round4(median(transitions.map((t) => t.NetSaving))),
    breakEvenRate: round4(mean(transitions.map((t) => t.break_even ? 1 : 0))),
    transitions_detail: transitions,
    caveats,
  };
}

export function renderMarkdown(summary) {
  const pct = (x) => `${((x ?? 0) * 100).toFixed(1)}%`;
  const lines = [];
  lines.push(`# RQ4 多过渡成本汇总：${summary.project}`, '');
  lines.push('| 项目 | transitions | empty | partial | full | mean Reduction | mean NetSaving | median NetSaving | break-even rate | T_select measured |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---|');
  lines.push(`| ${summary.project} | ${summary.transitions} | ${summary.buckets.empty} | ${summary.buckets.partial} | ${summary.buckets.full} | ${pct(summary.meanReduction)} | ${pct(summary.meanNetSaving)} | ${pct(summary.medianNetSaving)} | ${pct(summary.breakEvenRate)} | ${summary.selectionMeasured} |`);
  lines.push('', '## 方法说明', '');
  lines.push(`- ${summary.method}。`);
  lines.push('- empty 过渡：选中集为空，只计选择开销；full 过渡：等价于全量执行再叠加选择开销；partial 过渡：若无逐 transition 实测，按选中比例线性估算。');
  if (summary.caveats.length) {
    lines.push('', '## 注意事项', '');
    for (const c of summary.caveats) lines.push(`- ${c}`);
  }
  return `${lines.join('\n')}\n`;
}

export function writeBatchSummary(summary, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const base = path.join(outDir, `${summary.project}_rq4_batch`);
  fs.writeFileSync(`${base}.json`, JSON.stringify(summary, null, 2));
  fs.writeFileSync(`${base}.md`, renderMarkdown(summary));
  return { json: `${base}.json`, md: `${base}.md` };
}

