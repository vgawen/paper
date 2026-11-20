// Variance analysis for repeated pre-annotation runs.
//
// Reads the canonical run (run 1) plus out/repeats/<condition>_run2.json,
// _run3.json, and reports per-case label stability, majority-vote distribution,
// and material/prompt features of the unstable cases.
//
//   node analyze_repeats.mjs
//
// Writes out/repeats/variance_report.{json,md}. Does not touch paper text or
// canonical results.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSections } from './annotator1_shared.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const outDir = path.join(root, 'experiments', 'out');
const repeatDir = path.join(outDir, 'repeats');

const CONDITIONS = {
  masked: {
    rq2File: path.join(outDir, 'annotation_packet', 'rq2_worksheet.md'),
    rq3File: path.join(outDir, 'annotation_packet', 'rq3_context.md'),
    canonical: path.join(outDir, 'annotator1_masked.json'),
  },
  condA: {
    rq2File: path.join(outDir, 'condA_material', 'rq2_condA.md'),
    rq3File: path.join(outDir, 'condA_material', 'rq3_condA.md'),
    canonical: path.join(outDir, 'annotator1_condA.json'),
  },
};

const parse = (file, family) => parseSections(file, family, (m) => { throw new Error(m); });

function sectionLines(section, startMarker, endMarker) {
  const s = section.indexOf(startMarker);
  if (s < 0) return [];
  const body = section.slice(s + startMarker.length);
  const e = endMarker ? body.indexOf(endMarker) : -1;
  return (e >= 0 ? body.slice(0, e) : body).split(/\r?\n/);
}

// Material features per case, used to explain instability.
function featuresFor(condition, family, section) {
  if (family === 'rq2') {
    const specMatch = /### 生成出来的测试\s*\n\s*```[^\n]*\n([\s\S]*?)\n```/.exec(section);
    const routeMatch = /- 变更上下文：`([^:`]+):/.exec(section);
    return {
      project: routeMatch ? routeMatch[1] : null,
      material_length: section.length,
      has_app_diff: /diff --git/.test(section),
      app_diff_hunks: (section.match(/^@@/gm) || []).length,
      spec_lines: specMatch ? specMatch[1].split(/\r?\n/).length : 0,
      material_lines: section.split(/\r?\n/).length,
    };
  }
  const oldBlock = sectionLines(section, '```js', '```');
  const hasOldBlock = section.includes('### 完整旧测试块');
  const appDiffMatch = /### 应用源码 diff[^\n]*\n([\s\S]*?)(?=\n###|\n判定：)/.exec(section);
  const appDiffText = appDiffMatch ? appDiffMatch[1] : '';
  const hasAppDiff = /diff --git/.test(appDiffText);
  const assertDiff = sectionLines(section, '```diff', '```');
  const plus = assertDiff.filter((l) => l.startsWith('+')).length;
  const minus = assertDiff.filter((l) => l.startsWith('-') && !l.startsWith('@@')).length;
  const commitMatch = /- Commit：([^\n]*)/.exec(section);
  const commit = commitMatch ? commitMatch[1] : '';
  const repoMatch = /^## rb\d{3} — (\S+)/.exec(section);
  return {
    repo: repoMatch ? repoMatch[1] : null,
    material_length: section.length,
    material_lines: section.split(/\r?\n/).length,
    has_full_old_block: hasOldBlock,
    old_block_lines: hasOldBlock ? oldBlock.filter((l) => l.trim()).length : 0,
    has_app_source_diff: hasAppDiff,
    app_diff_hunks: hasAppDiff ? (appDiffText.match(/^@@/gm) || []).length : 0,
    assertion_diff_lines: plus + minus,
    assertion_plus: plus,
    assertion_minus: minus,
    commit_chars: commit.length,
  };
}

function loadRuns(condition) {
  const cfg = CONDITIONS[condition];
  const canonical = JSON.parse(fs.readFileSync(cfg.canonical, 'utf8'));
  const runs = [{ index: 1, file: cfg.canonical, data: canonical }];
  for (let i = 2; i <= 9; i++) {
    const f = path.join(repeatDir, `${condition}_run${i}.json`);
    if (!fs.existsSync(f)) continue;
    runs.push({ index: i, file: f, data: JSON.parse(fs.readFileSync(f, 'utf8')) });
  }
  return { cfg, runs };
}

const majority = (labels) => {
  const counts = {};
  for (const l of labels) if (l) counts[l] = (counts[l] || 0) + 1;
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return { label: null, tie: false, counts };
  const top = entries[0][1];
  const winners = entries.filter((e) => e[1] === top).map((e) => e[0]);
  if (winners.length > 1) return { label: 'TIE', tie: true, candidates: winners, counts };
  return { label: winners[0], tie: false, counts };
};

const dist = (labels) => {
  const c = {};
  for (const l of labels) if (l) c[l] = (c[l] || 0) + 1;
  return c;
};

function usageSummary(run, family, caseIds) {
  const rows = caseIds.map((id) => run.data[family].rows[id]).filter(Boolean);
  const sum = (pick) => rows.reduce((acc, r) => acc + (Number(pick(r)) || 0), 0);
  return {
    run: run.index,
    prompt_tokens: sum((r) => r.usage?.prompt_tokens),
    completion_tokens: sum((r) => r.usage?.completion_tokens),
    reasoning_tokens: sum((r) => r.usage?.completion_tokens_details?.reasoning_tokens),
    budgets: [...new Set(rows.map((r) => r.budget_used))].filter(Boolean).join(','),
    escalations: rows.filter((r) => (r.budget_used || 0) > 2000).map((r) => `${r.case_id}@${r.budget_used}`),
  };
}

const median = (arr) => {
  const v = arr.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : Math.round((v[mid - 1] + v[mid]) / 2);
};

function stabilityObservations(cases, family) {
  const unstable = cases.filter((c) => c.distinct_labels > 1);
  const stable = cases.filter((c) => c.distinct_labels === 1);
  const feats = family === 'rq3'
    ? (c) => `旧块${c.features.has_full_old_block ? '有' : '无'}、应用diff${c.features.has_app_source_diff ? '有' : '无'}、断言diff ${c.features.assertion_diff_lines} 行`
    : (c) => `应用diff${c.features.has_app_diff ? '有' : '无'}、spec ${c.features.spec_lines} 行`;
  return {
    unstable_count: unstable.length,
    stable_prompt_length_median: median(stable.map((c) => c.features.prompt_length)),
    unstable_prompt_length_median: median(unstable.map((c) => c.features.prompt_length)),
    stable_material_length_median: median(stable.map((c) => c.features.material_length)),
    unstable_material_length_median: median(unstable.map((c) => c.features.material_length)),
    groups: unstable.map((c) => (family === 'rq3' ? c.features.repo : c.features.project) || '未知'),
    details: unstable.map((c) => ({ case_id: c.case_id, sequence: c.labels, material: feats(c) })),
  };
}

function analyzeCondition(condition) {
  const { cfg, runs } = loadRuns(condition);
  const families = {};
  for (const family of ['rq2', 'rq3']) {
    const parsed = parse(family === 'rq2' ? cfg.rq2File : cfg.rq3File, family);
    const rows = parsed.rows;
    const cases = [];
    for (const { case_id: caseId, section } of rows) {
      const labels = runs.map((r) => {
        const row = r.data[family].rows[caseId];
        return row && row.status === 'ok' ? row.label : null;
      });
      const reasons = runs.map((r) => {
        const row = r.data[family].rows[caseId];
        return row && row.status === 'ok' ? row.reason : null;
      });
      const allSame = labels.every((l) => l === labels[0]);
      const nonNull = labels.filter(Boolean);
      const counts = dist(nonNull);
      const distinct = Object.keys(counts).length;
      const consistency = allSame ? `${nonNull.length}/${nonNull.length}` : `${Math.max(...Object.values(counts))}/${nonNull.length}`;
      const maj = majority(nonNull);
      const feats = featuresFor(condition, family, section);
      const canonRow = runs[0].data[family].rows[caseId];
      feats.prompt_length = canonRow?.prompt?.length ?? null;
      cases.push({
        case_id: caseId,
        labels,
        reasons,
        consistency,
        distinct_labels: distinct,
        majority: maj.label,
        majority_tie: maj.tie,
        features: feats,
      });
    }
    const overall = {
      n: cases.length,
      runs_available: runs.map((r) => r.index),
      per_run_distribution: runs.map((r) => ({
        run: r.index,
        file: path.relative(root, r.file),
        distribution: dist(rows.map(({ case_id }) => r.data[family].rows[case_id]?.label)),
        failures: r.data[family].failures,
      })),
      per_run_usage: runs.map((r) => usageSummary(r, family, rows.map((x) => x.case_id))),
      stability: {
        '3/3': cases.filter((c) => c.distinct_labels === 1).length,
        '2/3': cases.filter((c) => c.distinct_labels === 2).length,
        '1/3': cases.filter((c) => c.distinct_labels === 3).length,
      },
      unstable: cases.filter((c) => c.distinct_labels > 1),
      flips_vs_run1: runs.slice(1).map((r) => ({
        run: r.index,
        flips: cases
          .filter((c) => c.labels[0] && c.labels[r.index - 1] && c.labels[0] !== c.labels[r.index - 1])
          .map((c) => ({ case_id: c.case_id, from: c.labels[0], to: c.labels[r.index - 1], reason: c.reasons[r.index - 1] })),
      })),
      majority_distribution: dist(cases.map((c) => c.majority).filter((l) => l !== 'TIE')),
      majority_ties: cases.filter((c) => c.majority_tie).map((c) => c.case_id),
      majority_vs_run1: cases
        .filter((c) => c.majority !== 'TIE' && c.labels[0] && c.majority !== c.labels[0])
        .map((c) => ({ case_id: c.case_id, run1: c.labels[0], majority: c.majority, sequence: c.labels })),
      observations: stabilityObservations(cases, family),
      cases,
    };
    families[family] = overall;
  }
  return { condition, runs: runs.map((r) => ({ run: r.index, file: path.relative(root, r.file), started_at: r.data.started_at, finished_at: r.data.finished_at, failures: r.data.failures_list?.length ?? null })), families };
}

const results = { generated_at: new Date().toISOString(), conditions: {} };
for (const condition of Object.keys(CONDITIONS)) {
  if (!fs.existsSync(CONDITIONS[condition].canonical)) continue;
  results.conditions[condition] = analyzeCondition(condition);
}

// --- Markdown rendering -----------------------------------------------------
function mdTable(rows) {
  return rows.join('\n');
}

function renderDistribution(cond) {
  const out = [];
  for (const family of ['rq2', 'rq3']) {
    const f = cond.families[family];
    out.push(`### ${family.toUpperCase()}（n=${f.n}，可用运行 ${f.runs_available.join('/')}）`);
    out.push('');
    out.push('| 运行 | 分布 | 失败 |');
    out.push('|---|---|---|');
    for (const r of f.per_run_distribution) {
      out.push(`| run${r.run} | ${JSON.stringify(r.distribution)} | ${r.failures} |`);
    }
    out.push('');
    out.push(`逐条一致率：3/3 = ${f.stability['3/3']} 条；2/3 = ${f.stability['2/3']} 条；1/3 = ${f.stability['1/3']} 条。`);
    out.push('');
    out.push('| 运行 | prompt tokens | completion tokens | 其中 reasoning | 预算 | 升档条目 |');
    out.push('|---|---|---|---|---|---|');
    for (const u of f.per_run_usage) {
      out.push(`| run${u.run} | ${u.prompt_tokens} | ${u.completion_tokens} | ${u.reasoning_tokens} | ${u.budgets} | ${u.escalations.length ? u.escalations.join('、') : '无'} |`);
    }
    out.push('');
    out.push(`多数票分布：${JSON.stringify(f.majority_distribution)}${f.majority_ties.length ? `；平票（无多数）：${f.majority_ties.join('、')}` : ''}`);
    out.push('');
    if (f.majority_vs_run1.length) {
      out.push(`多数票相对 run1 的差异：${f.majority_vs_run1.map((x) => `${x.case_id} ${x.run1}→${x.majority}（${x.sequence.map((l) => l || 'FAILED').join('/')}）`).join('；')}`);
      out.push('');
    }
    const obs = f.observations;
    if (obs.unstable_count) {
      out.push(`不稳定集中度：${obs.unstable_count} 条；prompt 长度中位数（稳定 ${obs.stable_prompt_length_median} / 不稳定 ${obs.unstable_prompt_length_median}）；材料长度中位数（稳定 ${obs.stable_material_length_median} / 不稳定 ${obs.unstable_material_length_median}）；涉及分组：${[...new Set(obs.groups)].join('、')}。`);
      out.push('');
      for (const d of obs.details) out.push(`- ${d.case_id}（${d.sequence.map((l) => l || 'FAILED').join(' / ')}）：${d.material}`);
      out.push('');
    }
    if (f.unstable.length) {
      out.push('| case | 取值序列（run1/run2/run3） | 一致度 | 多数票 | prompt 长度 | 材料长度 | 关键材料特征 |');
      out.push('|---|---|---|---|---|---|---|');
      for (const c of f.unstable) {
        const feat = family === 'rq3'
          ? `repo=${c.features.repo || '?'}；旧块=${c.features.has_full_old_block ? c.features.old_block_lines + '行' : '无'}；应用diff=${c.features.has_app_source_diff ? c.features.app_diff_hunks + 'hunk' : '无'}；断言diff=${c.features.assertion_diff_lines}行`
          : `项目=${c.features.project || '?'}；应用diff=${c.features.has_app_diff ? c.features.app_diff_hunks + 'hunk' : '无'}；spec=${c.features.spec_lines}行`;
        out.push(`| ${c.case_id} | ${c.labels.map((l) => l || 'FAILED').join(' / ')} | ${c.consistency} | ${c.majority} | ${c.features.prompt_length ?? ''} | ${c.features.material_length} | ${feat} |`);
      }
    } else {
      out.push('无逐条不一致样本。');
    }
    out.push('');
  }
  return out.join('\n');
}

const md = [
  '# 重复运行波动报告',
  '',
  `生成时间：${results.generated_at}`,
  '',
  '口径：run1 为既有正式结果；run2/run3 为同材料、同 prompt、同模型与参数（`deepseek-v4-flash`、`temperature=0`、`max_tokens=2000`、预算阶梯 2000→4000→8000）的重复采样。每条的原始输出与 usage 均保存在 `out/repeats/` 对应 JSON。',
  '',
];
for (const [name, cond] of Object.entries(results.conditions)) {
  md.push(`## 条件 ${name === 'masked' ? 'B（aligned_information）' : 'A（approx_original_information）'}`, '');
  md.push('| run | 文件 | 开始 | 结束 | 失败条目 |');
  md.push('|---|---|---|---|---|');
  for (const r of cond.runs) md.push(`| run${r.run} | ${r.file} | ${r.started_at || ''} | ${r.finished_at || ''} | ${r.failures ?? ''} |`);
  md.push('');
  md.push(renderDistribution(cond));
}

fs.mkdirSync(repeatDir, { recursive: true });
fs.writeFileSync(path.join(repeatDir, 'variance_report.json'), JSON.stringify(results, null, 2) + '\n');
fs.writeFileSync(path.join(repeatDir, 'variance_report.md'), md.join('\n'));
console.log(`wrote ${path.relative(root, path.join(repeatDir, 'variance_report.json'))}`);
console.log(`wrote ${path.relative(root, path.join(repeatDir, 'variance_report.md'))}`);
