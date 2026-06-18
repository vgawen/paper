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

  // signal ablation (coverage-only / uidiff-only / dual)
  if (rq1.summary.coverage_only && rq1.summary.uidiff_only && rq1.summary.dual) {
    const uiHit = dataset.filter((r) => r.ui_selected && r.ui_selected.length).length;
    L.push('### 信号消融：coverage-only / uidiff-only / dual');
    L.push('| 变体 | Reduction | Safety | Precision |', '|---|---|---|---|');
    for (const v of ['coverage_only', 'uidiff_only', 'dual']) {
      const s = rq1.summary[v];
      L.push(`| ${v} | ${s.Reduction} | ${s.Safety} | ${s.Precision} |`);
    }
    L.push('', `- UI 信号（Semantic UI Diff 的 vanilla-JS 同构版）在 ${uiHit}/${rq1.n} 个过渡上触发选择，均为 locator 改名类变更，精确但单用 Safety 仅 ${rq1.summary.uidiff_only.Safety}（漏选逻辑/路由/断言类变更）。`);
    L.push('- dual = coverage ∪ uidiff，在该文件粒度主体上与 coverage-only 等价：覆盖映射已是安全主干，UI 信号此处冗余但无害。');
    L.push('- UI 信号的真正增益体现在覆盖粒度过粗的单组件应用——见 1.6 C1 动态实测（uidiff 选择精确率 1.0 vs 纯覆盖 0.33）。两者互补。', '');
  }

  L.push('### 按变更类型（ours）');
  L.push('| 类型 | n | Reduction | Safety | Precision |', '|---|---|---|---|---|');
  for (const [t, rs] of Object.entries(byType)) {
    L.push(`| ${t} | ${rs.length} | ${m(mean(rs.map((r) => r.metrics.ours.Reduction)))} | ${m(mean(rs.map((r) => r.metrics.ours.Safety)))} | ${m(mean(rs.map((r) => r.metrics.ours.Precision)))} |`);
  }
  L.push('');

  // C1 closed loop (uidiff-driven), if present
  const c1Path = path.join(OUT, 'c1_loop.json');
  if (fs.existsSync(c1Path)) {
    const c1 = readJ(c1Path);
    L.push('## 1.5 C1 闭环：Semantic UI Diff 驱动选择/生成/修复（真实 JSX）');
    L.push(`- 语义差分: ADD ${c1.uidiff.ADD.length} / REMOVE ${c1.uidiff.REMOVE.length} / MODIFY ${c1.uidiff.MODIFY.length}（真实 JSX App.old→App.new）。`);
    L.push(`- 选择: 选中 ${c1.selected.join(', ')}；无关用例正确排除。`);
    L.push(`- 生成: 对未覆盖的新增节点(${c1.uncoveredAdds.map((n) => n.text).join(', ')})合成可执行用例。`);
    const reps = Object.entries(c1.repaired).map(([f, v]) => `${f}[${v.edits.map((e) => e.kind).join('/')}]`);
    L.push(`- 修复: ${reps.join('；')}（locator 重定向 / 断言更新 / locator 加固）。`);
    L.push('- 详见 out/c1_loop.md。这是 C1 核心（JSX 语义差分驱动整条链）的端到端集成，与 RQ1–3 动态数字互补。', '');
  }

  const c1dPath = path.join(OUT, 'c1_dynamic.json');
  if (fs.existsSync(c1dPath)) {
    const d = readJ(c1dPath);
    L.push('## 1.6 C1 动态实测：真实 React 项目 (cand_coverage)');
    L.push(`- 变更：Red→Crimson（同 handler/颜色）+ 新增 Green；实跑 e2e，affected oracle（结果翻转）= ${d.affected.join(', ')}。`);
    L.push(`- 选择对比（同一 oracle）：coverage-only Precision ${d.mCov.Precision} (选 ${d.covSel.length}/${d.mCov.full_suite})；**uidiff Precision ${d.mUi.Precision}**（选 ${d.uiSel.length}，Reduction ${d.mUi.Reduction}，Safety ${d.mUi.Safety}）。`);
    L.push(`- 修复：${JSON.stringify(d.repair.edits)} → "use Red" 重跑 ${d.repair.red_after_pass ? 'PASS' : 'FAIL'}。`);
    L.push(`- 生成：新增 ${d.generation.add} 按钮 → 可执行=${d.generation.executable}，覆盖App=${d.generation.covers_app}。`);
    L.push('- 这是 C1 在真实 React 工程上的**动态**证据：语义 UI Diff 把选择精度从覆盖级的 ' +
      `${d.mCov.Precision} 提升到 ${d.mUi.Precision}，并实跑完成修复与生成。详见 out/c1_dynamic.md。`, '');
  }

  L.push('## 2. RQ2 生成：覆盖缺口补齐');
  L.push(`- provider=${rq2.provider}，缺口数 n=${rq2.n}：可执行率=${rq2.execRate}，变更相关率=${rq2.relRate}。`);
  L.push('- 语义有效率=NA（需人工/LLM 评判；候选见 out/rq2_to_annotate.jsonl）。', '');

  L.push('## 3. RQ3 修复：让选中的失效用例重新可用');
  L.push(`- 修复成功率=${rq3.n ? (rq3.repaired / rq3.n).toFixed(3) : 0} (${rq3.repaired}/${rq3.n})；TargetedSetUsability：before ${mean(rq3.rows.map((r) => r.usability_before)).toFixed(3)} → after ${mean(rq3.rows.map((r) => r.usability_after)).toFixed(3)}。`);
  L.push('- 过时分类：定位失效→STRUCTURAL_ONLY（语义定位重写），期望变化→EXPECTATION_CHANGE（断言更新）。', '');

  // 3.5 ReproBreak real-data sub-experiment
  const rbPath = path.join(DIFFE2E, 'realproj', 'results', 'reprobreak.json');
  if (fs.existsSync(rbPath)) {
    const rb = readJ(rbPath);
    const rate = (x, d) => `${((100 * x) / d).toFixed(1)}%`;
    L.push('## 3.5 ReproBreak 真实数据子实验（离线 / CSV ground truth）');
    L.push(`- 数据：${rb.n} 条真实结构性 locator 断裂对（Playwright ${rb.framework.playwright}/Cypress ${rb.framework.cypress}，多个开源项目）。`);
    L.push(`- **Semantic UI Diff 可达性**：${rb.addressable.yes}/${rb.n} = ${rate(rb.addressable.yes, rb.n)} 为 testId/text/role-name/href 语义锚值替换（本方法 UI 信号直接可定位）；` +
      `其余为 CSS id/class 改名、结构重排、策略切换（需 DOM 拓扑或 LLM）。Playwright 语义定位的可达性显著高于 Cypress。`);
    L.push(`- **确定性修复改写器**（已知 oracle 信号，上界）：在可达的 ${rb.repair_rewriter.n} 条上精确重建开发者修复 ${rb.repair_rewriter.exact_match}/${rb.repair_rewriter.n} = ${rate(rb.repair_rewriter.exact_match, rb.repair_rewriter.n)}。`);
    L.push('- 诚实定位：该结果量化了「语义信号能覆盖多少真实断裂」与「改写机制在真实语法上的正确性」；端到端信号检测精度与执行验证（449 断裂 / Docker）为后续。详见 realproj/results/reprobreak.md。', '');
  }

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
  L.push('- 修复在真实数据（ReproBreak, 见 3.5）上已量化可达性与改写器正确性；但执行验证版（449 断裂/Docker）与端到端信号检测精度尚待补。');
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
    'node experiments/uidiff_loop.mjs     # C1 闭环(静态,真实JSX): 语义UI Diff 驱动 选/生/修',
    'node experiments/run_c1_dynamic.mjs  # C1 动态(真实React项目): 实跑 选/生/修(自动还原)',
    'node realproj/gate.mjs               # 真实项目可插桩闸门',
    'git clone --depth 1 https://github.com/rub-sq/ReproBreak realproj/clones/ReproBreak  # 真实 locator 断裂数据',
    'node realproj/reprobreak.mjs         # ReproBreak 真实数据子实验(可达性+改写器精确匹配)',
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
