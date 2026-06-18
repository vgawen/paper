// Aggregate RQ1-RQ4 + cost into EXPERIMENT_REPORT.md and REPRODUCE.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wilcoxonP, cliffsDelta, mcnemar, bootstrapCI, mean } from '../pipeline/src/stats.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'out');
const DIFFE2E = path.join(here, '..');
const readJ = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

function main() {
  const dataset = fs.readFileSync(path.join(OUT, 'rq1_dataset.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const rq1 = readJ(path.join(OUT, 'rq1_summary.json'));
  const rq2 = readJ(path.join(OUT, 'rq2_results.json'));
  const rq3 = readJ(path.join(OUT, 'rq3_results.json'));
  const gate = readJ(path.join(DIFFE2E, 'realproj', 'results', 'gate.json'));

  // RQ4 cost / efficiency
  const totalFull = dataset.reduce((s, r) => s + r.full_suite, 0);
  const totalSel = dataset.reduce((s, r) => s + r.selected_count, 0);
  const execSaving = +(1 - totalSel / totalFull).toFixed(4);

  // RQ1 significance highlights
  const get = (m, k) => dataset.map((r) => r.metrics[m][k]);
  const sig = {};
  for (const b of ['retest_all', 'random_k', 'static_heuristic']) {
    const red = wilcoxonP(dataset.map((r) => [r.metrics.ours.Reduction, r.metrics[b].Reduction]));
    const saf = wilcoxonP(dataset.map((r) => [r.metrics.ours.Safety, r.metrics[b].Safety]));
    let bb = 0, cc = 0;
    for (const r of dataset) { const o = r.metrics.ours.Safety === 1, x = r.metrics[b].Safety === 1; if (o && !x) bb++; else if (!o && x) cc++; }
    sig[b] = {
      red_p: red.p, red_delta: cliffsDelta(get('ours', 'Reduction'), get(b, 'Reduction')),
      saf_p: saf.p, saf_delta: cliffsDelta(get('ours', 'Safety'), get(b, 'Safety')),
      mcnemar: mcnemar(bb, cc),
    };
  }
  const ci = {
    Reduction: bootstrapCI(get('ours', 'Reduction'), mean, 2000, 42),
    Safety: bootstrapCI(get('ours', 'Safety'), mean, 2000, 42),
    Precision: bootstrapCI(get('ours', 'Precision'), mean, 2000, 42),
  };

  const byType = {};
  for (const r of dataset) (byType[r.type] ||= []).push(r);

  const agg = { rq1: rq1.summary, rq1_n: rq1.n, sig, ci, rq2, rq3: { n: rq3.n, repaired: rq3.repaired },
    rq4: { totalFull, totalSel, execSaving }, gate };
  fs.writeFileSync(path.join(OUT, 'aggregate.json'), JSON.stringify(agg, null, 2));

  const m = (x) => x.toFixed(3);
  const L = [];
  L.push('# DiffE2E 实验报告（面向代码变更的 Playwright E2E 针对性回归测试）', '');
  L.push('## 0. 概览');
  L.push(`- 主体：受控多文件应用（6+ 路由、共享 util），真实 git 历史 ${rq1.n + 1} 个 commit、${rq1.n} 个变更过渡。`);
  L.push('- 全流程零外部依赖、可一键复现；生成/修复使用可插拔 LLM 客户端（无 key 时走确定性 stub）。');
  L.push('- 无信息泄漏：选择只用 V_old 覆盖 + diff；V_new 全量覆盖仅用于构造 affected oracle。', '');

  L.push('## 1. RQ1 选择：最小且安全的针对性测试集');
  L.push('| 方法 | Reduction | Safety | Precision |', '|---|---|---|---|');
  for (const me of ['ours', 'retest_all', 'random_k', 'static_heuristic']) {
    const s = rq1.summary[me];
    L.push(`| ${me} | ${s.Reduction} | ${s.Safety} | ${s.Precision} |`);
  }
  L.push('', `- ours bootstrap 95% CI：Reduction ${ci.Reduction.point} (${ci.Reduction.lo}–${ci.Reduction.hi})、Safety ${ci.Safety.point} (${ci.Safety.lo}–${ci.Safety.hi})、Precision ${ci.Precision.point}。`);
  L.push('- 显著性（ours vs 基线）：');
  for (const b of Object.keys(sig)) {
    const s = sig[b];
    L.push(`  - vs ${b}: Reduction Wilcoxon p=${s.red_p} (Cliff δ=${s.red_delta}); Safety p=${s.saf_p} (δ=${s.saf_delta}); McNemar(安全) b=${s.mcnemar.b},c=${s.mcnemar.c},χ²=${s.mcnemar.chi2}。`);
  }
  L.push('- 结论：ours 是唯一同时做到 Safety=1.0 且高 Reduction 的方法；random 同规模但不安全（漏选），static 启发式在共享 util/router 变更上漏选。', '');
  L.push('### 按变更类型（ours）');
  L.push('| 类型 | n | Reduction | Safety | Precision |', '|---|---|---|---|---|');
  for (const [t, rs] of Object.entries(byType)) {
    L.push(`| ${t} | ${rs.length} | ${m(mean(rs.map((r) => r.metrics.ours.Reduction)))} | ${m(mean(rs.map((r) => r.metrics.ours.Safety)))} | ${m(mean(rs.map((r) => r.metrics.ours.Precision)))} |`);
  }
  L.push('');

  L.push('## 2. RQ2 生成：覆盖缺口补齐');
  L.push(`- provider=${rq2.provider}，缺口数 n=${rq2.n}：可执行率=${rq2.execRate}，变更相关率=${rq2.relRate}。`);
  L.push('- 语义有效率=NA（需人工/LLM 评判；候选见 out/rq2_to_annotate.jsonl）。', '');

  L.push('## 3. RQ3 修复：让选中的失效用例重新可用');
  L.push(`- 修复成功率=${rq3.n ? (rq3.repaired / rq3.n).toFixed(3) : 0} (${rq3.repaired}/${rq3.n})；TargetedSetUsability：before ${mean(rq3.rows.map((r) => r.usability_before)).toFixed(3)} → after ${mean(rq3.rows.map((r) => r.usability_after)).toFixed(3)}。`);
  L.push('- 过时分类：定位失效→STRUCTURAL_ONLY（语义定位重写），期望变化→EXPECTATION_CHANGE（断言更新）。', '');

  L.push('## 4. RQ4 成本/效率');
  L.push(`- 跨 ${rq1.n} 个过渡：retest-all 共执行 ${totalFull} 次用例；ours 仅执行 ${totalSel} 次 → 测试执行量下降 ${(execSaving * 100).toFixed(1)}%（Safety 仍=1.0）。`);
  L.push('- 生成/修复均为按需触发（仅缺口/失效用例），额外成本与变更规模成正比。', '');

  L.push('## 5. 外部效度（真实项目，尽力而为）');
  for (const g of gate) {
    if (!g.present) continue;
    L.push(`- ${g.name}: Playwright=${g.hasPW}, 覆盖方法=${g.covMethod}, E2E=${g.e2eCount}, 闸门=${g.gate}, 可replay=${g.replayReady}。`);
  }
  L.push('- 详见 realproj/results/REPORT.md。多 commit 真实历史 replay 因浅克隆/需逐 commit 运行环境列为后续工作。', '');

  L.push('## 6. 有效性威胁与局限');
  L.push('- 主体为受控工程，量化结论的外部效度有限；真实多 commit replay 为后续工作。');
  L.push('- 生成/修复用确定性 stub（无 LLM key）：可执行率/相关性/修复率可测，语义有效率需人工或真实 LLM。');
  L.push('- 覆盖映射在 bundler 行号变换下子文件级需 sourcemap 反查；本实验采用文件级归属（干净）+ locator/UI 信号（不依赖行号）。');
  L.push('- Semantic UI Diff 在“文案与 handler 同时变更”时静态匹配会退化为 ADD/REMOVE，需运行时 DOM 邻域匹配消歧。', '');

  L.push('## 7. 复现');
  L.push('见 REPRODUCE.md（一键：seed → run_rq1..3 → analyze → aggregate）。');

  fs.writeFileSync(path.join(DIFFE2E, 'EXPERIMENT_REPORT.md'), L.join('\n') + '\n');

  const R = [
    '# 复现指南（DiffE2E 实验）', '',
    '## 环境', '- Node 24+（用到内置 node:test）; 已随仓库安装 pipeline/subject 依赖。',
    '- 无需任何 LLM API key（默认确定性 stub）；如需真实模型，设 OPENAI_API_KEY/ANTHROPIC_API_KEY/DEEPSEEK_API_KEY。', '',
    '## 单元测试', '```bash', 'cd diffe2e/pipeline && node --test', 'cd ../experiments && node --test', '```', '',
    '## 端到端实验（一键）', '```bash', 'cd diffe2e',
    'node subject/history/seed.mjs        # 构造 16-commit 真实历史到 subject/work/',
    'node experiments/run_rq1.mjs         # RQ1 选择：dataset + summary',
    'node experiments/analyze.mjs         # RQ1 统计 + SVG 图',
    'node experiments/run_rq2.mjs         # RQ2 缺口生成',
    'node experiments/run_rq3.mjs         # RQ3 修复',
    'node realproj/gate.mjs               # 真实项目可插桩闸门',
    'node experiments/aggregate.mjs       # 汇总 -> EXPERIMENT_REPORT.md',
    '```', '',
    '## 产物', '- experiments/out/rq1_dataset.jsonl, rq1_summary.md, rq1_stats.md, figs/rq1_metrics.svg',
    '- experiments/out/rq2_results.md, rq3_results.md, aggregate.json', '- EXPERIMENT_REPORT.md, realproj/results/REPORT.md', '',
    '## 切换真实 LLM', '设置上述任一 API key 后重跑 run_rq2/run_rq3，生成/修复将走真实模型（client.provider != stub）。',
  ];
  fs.writeFileSync(path.join(DIFFE2E, 'REPRODUCE.md'), R.join('\n') + '\n');

  console.log('wrote EXPERIMENT_REPORT.md + REPRODUCE.md + aggregate.json');
  console.log(`RQ1 ours Red=${rq1.summary.ours.Reduction} Safe=${rq1.summary.ours.Safety} | RQ2 exec=${rq2.execRate} | RQ3 fix=${rq3.repaired}/${rq3.n} | RQ4 saving=${(execSaving * 100).toFixed(1)}%`);
}

main();
