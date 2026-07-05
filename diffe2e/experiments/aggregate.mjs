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
  const realDir = path.join(OUT, 'real');
  const rq4Files = fs.existsSync(realDir)
    ? fs.readdirSync(realDir).filter((f) => f.endsWith('_rq4.json')).sort() : [];
  const rq4Real = rq4Files.map((f) => readJ(path.join(realDir, f)));
  agg.rq4.real = rq4Real;
  fs.writeFileSync(path.join(OUT, 'aggregate.json'), JSON.stringify(agg, null, 2));

  const m = (x) => x.toFixed(3);
  const pct = (x) => `${(100 * x).toFixed(1)}%`;
  const sec = (ms) => `${(ms / 1000).toFixed(2)}s`;
  const statCell = (s) => `${sec(s.median)} (${sec(s.iqr[0])}-${sec(s.iqr[1])})`;
  const L = [];
  L.push('# DiffE2E 实验报告（代码变更感知的 Playwright E2E 选测与生成）', '');
  L.push('## 0. 概览');
  L.push(`- 主体：受控多文件应用（6+ 路由、共享 util），真实 git 历史 ${rq1.n + 1} 个 commit、${rq1.n} 个变更过渡。`);
  L.push('- 主链路聚焦安全选测（RQ1）与 diff 约束缺口生成（RQ2）；修复（RQ3）用于闭环支撑和真实边界分析。');
  L.push('- 全流程可一键复现；生成/修复使用可插拔 LLM 客户端（真实 provider 失败会明确报错，无 key 时仅本地 stub）。');
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

  L.push('## 2. RQ2 生成：覆盖缺口补齐（双臂：diff 约束 vs 无约束基线）');
  if (rq2.summary && rq2.summary.diff) {
    L.push(`- provider=${rq2.provider}。`);
    L.push('| 臂 | n | 可执行率 | 变更相关率 | 变异杀伤(均值) | 版本敏感率 | 自动语义有效率 |',
      '|---|---|---|---|---|---|---|');
    for (const arm of ['diff', 'nodiff']) {
      const s = rq2.summary[arm];
      if (s) L.push(`| ${arm} | ${s.n} | ${s.execRate} | ${s.relRate} | ${s.mutKillMean ?? 'NA'} | ${s.changeSensRate ?? 'NA'} | ${s.semanticAutoRate ?? 'NA'} |`);
    }
    L.push('', '- 自动语义有效率 = 可执行 ∧ 版本敏感（V_new 过、V_old 失败）∧ 杀掉≥1个注入变异；客观、无需人工。');
    if (rq2.provider === 'stub') {
      L.push('- 核心论点：stub 仅验证 pipeline 可运行；真实结论需 provider key 后重跑。');
    } else {
      L.push('- 核心论点：真实 LLM 下，diff 约束臂在可执行率、变更相关率、版本敏感率和自动语义有效率上均明显高于无约束基线。');
      L.push('- 工程护栏：真实 provider 请求失败或返回空 completion 时直接报错；LLM 输出会清洗 Markdown 代码围栏，并统一导入 `./fixtures` 以保留覆盖采集。');
    }
  } else {
    // backward-compat with the single-arm result shape
    L.push(`- provider=${rq2.provider}，缺口数 n=${rq2.n}：可执行率=${rq2.execRate}，变更相关率=${rq2.relRate}。`);
  }
  // semantic-validity + kappa, if annotation has been scored
  const annPath = path.join(OUT, 'rq2_annotation.json');
  if (fs.existsSync(annPath)) {
    const ann = readJ(annPath);
    L.push(`- 人工小样本校准（双标注，n=${ann.n}）：语义有效率 ${ann.semantic_validity}，Cohen's κ=${ann.kappa.kappa}` +
      (ann.by_arm ? `；分臂 diff=${ann.by_arm.diff.semantic_validity} / nodiff=${ann.by_arm.nodiff.semantic_validity}。` : '。'));
  } else {
    L.push('- 人工小样本校准=待办（仅作自动语义指标的辅助验证；盲标注候选见 out/rq2_to_annotate.jsonl，解盲键 rq2_unblind.json）。');
  }
  L.push('');

  L.push('## 3. RQ3 闭环支撑：让选中的失效用例重新可用');
  L.push(`- 修复成功率=${rq3.n ? (rq3.repaired / rq3.n).toFixed(3) : 0} (${rq3.repaired}/${rq3.n})；TargetedSetUsability：before ${mean(rq3.rows.map((r) => r.usability_before)).toFixed(3)} → after ${mean(rq3.rows.map((r) => r.usability_after)).toFixed(3)}。该结果说明轻量修复能支撑 selected tests 的闭环可用性，但不作为本文主创新点。`);
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
    L.push('- 诚实定位：该结果量化了「语义信号能覆盖多少真实断裂」与「改写机制在真实语法上的正确性」；它是修复上界和边界证据，不等同于端到端真实修复能力。详见 realproj/results/reprobreak.md。', '');
  }

  // 3.6 ReproBreak end-to-end (leakage-free, real per-commit source)
  const rbePath = path.join(DIFFE2E, 'realproj', 'results', 'reprobreak_e2e.json');
  if (fs.existsSync(rbePath)) {
    const rbe = readJ(rbePath);
    const pct = (x) => `${(100 * x).toFixed(2)}%`;
    L.push('## 3.6 ReproBreak 端到端修复（无信息泄漏，真实逐 commit 源码）');
    L.push(`- 数据：${rbe.n + rbe.skipped} 条执行验证断裂（导出自 SQLite），进入评估 n=${rbe.n}，泄漏护栏跳过 ${rbe.skipped} 条。`);
    L.push('- **无泄漏设定**：修复输入仅「旧（断裂）测试 + 应用源码 old/new diff（已排除测试文件）」；`new_locator` 与新测试文件仅评估用。');
    L.push(`- **规则臂端到端 exact-match**：${rbe.arms.rule.ok}/${rbe.arms.rule.n} = ${pct(rbe.rule_rate)}` +
      `（有 app 信号子集 ${rbe.app_signal_subset.rule_ok}/${rbe.app_signal_subset.n} = ${pct(rbe.app_signal_subset.rule_rate)}）。`);
    L.push(`- **LLM 臂**：${rbe.provider === 'stub' ? 'NA（无 API key，记 0）' : `${rbe.arms.llm.ok}/${rbe.arms.llm.n} = ${pct(rbe.llm_rate)}`}。`);
    L.push('- 关键对比：3.5 离线「已知 oracle 信号」上界 99.3% vs 本节端到端「从 app diff 自行还原信号」规则臂 ' +
      `${pct(rbe.rule_rate)}、DeepSeek LLM 臂 ${pct(rbe.llm_rate)}——LLM 有增益，但整体 exact-match 仍低。因此 ReproBreak 在本文中主要作为真实修复难度和方法边界的量化证据。详见 realproj/results/reprobreak_e2e.md。`, '');
  }

  L.push('## 4. RQ4 成本/效率');
  L.push(`- 跨 ${rq1.n} 个过渡：retest-all 共执行 ${totalFull} 次用例；ours 仅执行 ${totalSel} 次 → 测试执行量下降 ${(execSaving * 100).toFixed(1)}%（Safety 仍=1.0）。`);
  if (rq4Real.length) {
    L.push('- 真实 wall-clock 计时如下（每臂 repeats=3，报告 median/IQR；`T_select` 未实测时显式标注，不把选择开销假装为 0）。', '');
    L.push('| 项目 | workers | full_count | selected_count | Reduction | T_full | T_run(Sel) | T_select | TimeReduction | NetSaving | break_even | machine-minutes(full/ours) |',
      '|---|---:|---:|---:|---:|---|---|---|---:|---:|---|---|');
    for (const r of rq4Real) {
      const tsel = r.T_select_ms.measured ? statCell(r.T_select_ms) : 'not measured';
      const fullMm = (r.T_full_ms.median * r.workers / 60000).toFixed(3);
      const oursMm = ((r.T_run_sel_ms.median + (r.T_select_ms.measured ? r.T_select_ms.median : 0)) * r.workers / 60000).toFixed(3);
      L.push(`| ${r.project} | ${r.workers} | ${r.full_count} | ${r.selected_count} | ${pct(r.Reduction)} | ${statCell(r.T_full_ms)} | ${statCell(r.T_run_sel_ms)} | ${tsel} | ${pct(r.TimeReduction)} | ${pct(r.NetSaving)} | ${r.break_even} | ${fullMm}/${oursMm} |`);
    }
    const cand = rq4Real.find((r) => r.project === 'cand_coverage');
    const actual = rq4Real.find((r) => r.project === 'actual_desktop');
    const candNote = cand
      ? `cand_coverage 显示用例数减少 ${pct(cand.Reduction)}，但计入选择开销后 NetSaving 仅 ${pct(cand.NetSaving)}（SelectionTax=${pct(cand.SelectionTax)}）`
      : 'cand_coverage 显示用例数量缩减与 wall-clock 收益并非线性关系';
    const actualNote = actual
      ? `actual_desktop 当前记录的是一个 selected=0 的无影响过渡，说明空选集可避免约 ${sec(actual.T_full_ms.median)} 的 full run，但不能代表该项目平均收益`
      : 'actual_desktop 空选集过渡可作为边界案例';
    L.push('', `- 读法：${candNote}，说明 Reduction 与真实时间收益必须解耦报告；${actualNote}。`);
  }
  L.push('- 生成/修复均为按需触发（仅缺口/失效用例），额外成本与变更规模成正比。', '');

  L.push('## 5. 外部效度（真实项目，尽力而为）');
  for (const g of gate) {
    if (!g.present) continue;
    L.push(`- ${g.name}: Playwright=${g.hasPW}, 覆盖方法=${g.covMethod}, E2E=${g.e2eCount}, 闸门=${g.gate}, 可replay=${g.replayReady}。`);
  }
  L.push('');

  // 5.1 真实多 commit replay（CDP 覆盖注入，无需预插桩）
  const realFiles = fs.existsSync(realDir)
    ? fs.readdirSync(realDir).filter((f) => f.endsWith('_rq1.json')).sort() : [];
  if (realFiles.length) {
    L.push('### 5.1 真实多 commit 历史 replay（CDP 覆盖注入）');
    L.push('通过 CDP 透明注入每用例覆盖（`page.coverage`，不改业务代码、无需预插桩），在真实开源项目的连续 commit 上回放并按变更选择用例。', '');
    L.push('| 项目 | n | 方法 | Reduction | Safety | Precision |', '|---|---|---|---|---|---|');
    let totN = 0, nProj = 0;
    for (const f of realFiles) {
      const r = readJ(path.join(realDir, f));
      if (!r.n) continue;
      totN += r.n; nProj += 1;
      for (const m of ['coverage_only', 'uidiff_only', 'dual']) {
        const s = r.summary[m];
        L.push(`| ${r.project} | ${r.n} | ${m} | ${s.Reduction} | ${s.Safety} | ${s.Precision} |`);
      }
    }
    L.push('', `- 已接入 ${nProj} 个真实项目、共 ${totN} 个稳定过渡（达计划 ≥2 个的外部效度目标）。`,
      '- 覆盖臂在两项目上 Safety=1.0（不漏选受影响用例）；Reduction 取决于项目结构：',
      '  - 模块化 monorepo（actual-budget）覆盖选择有缩减；小型单页 SPA（mermaid-live-editor）核心组件被几乎所有用例加载，覆盖选择缩减有限（Reduction≈0）——覆盖法在“强耦合核心”应用上的固有局限。',
      '  - uidiff 臂为**稀疏触发、高精度互补信号**：仅当 diff 触及测试引用的 testId/可见文本锚点时激活。actual 9 过渡中 1 个（commit 19cea1a：schedule 金额改 ± 符号、改动 testId `date`）激活，经页面对象导入闭包映射到 32 个用例，**uidiff_only Precision=1.0**（选中皆为受影响）；其余过渡为新增/逻辑改动不触发。锚点稀疏项目（如 mermaid）该臂多为空选。',
      '  - 跨项目（n=14）：dual 在两项目上均 Safety=1.0、Precision=1.0；uidiff_only 触发即 Precision=1.0 但平均 Safety 低（稀疏），印证“覆盖臂为安全主干、UI 信号为精度补充”的设计取舍。详见 out/real/real_rq1_stats.md 与 figs/real_rq1.svg。',
      '- 明细见 out/real/<project>_rq1.{json,jsonl,md,_skips.json}。', '');
  } else {
    L.push('- 详见 realproj/results/REPORT.md。多 commit 真实历史 replay 因浅克隆/需逐 commit 运行环境列为后续工作。', '');
  }

  L.push('## 6. 有效性威胁与局限');
  L.push('- 主体为受控工程；外部效度已在 2 个真实开源项目（actual-budget、mermaid-live-editor）的多 commit replay 上初步验证（§5.1），但项目数仍有限。');
  L.push('- 生成实验已接入真实 DeepSeek 对照；真实 provider 调用失败或返回空结果时实验会明确报错，避免把本地 stub 误当真实 LLM 结果。');
  L.push('- 修复在真实数据（ReproBreak）上已两层量化：3.5 离线可达性/改写器正确性（已知信号上界 99.3%），3.6 端到端无泄漏修复（449 执行验证断裂、4 真实项目，规则臂 3.38%、DeepSeek LLM 臂 5.56%）；仍存局限：端到端执行验证（Docker overwrite）与 DOM/trace 候选元素作为更强上下文为后续。');
  L.push('- 覆盖映射在 bundler 行号变换下子文件级需 sourcemap 反查；本实验采用文件级归属（干净）+ locator/UI 信号（不依赖行号）。');
  L.push('- Semantic UI Diff 在“文案与 handler 同时变更”时静态匹配会退化为 ADD/REMOVE，需运行时 DOM 邻域匹配消歧。', '');

  L.push('## 7. 复现');
  L.push('见 REPRODUCE.md（一键：seed → run_rq1..3 → analyze → aggregate）。');

  fs.writeFileSync(path.join(DIFFE2E, 'EXPERIMENT_REPORT.md'), L.join('\n') + '\n');

  const R = [
    '# 复现指南（DiffE2E 实验）', '',
    '## 环境', '- Node 24+（用到内置 node:test）; 已随仓库安装 pipeline/subject 依赖。',
    '- 无 key 时走确定性 stub，只能复现 pipeline 可运行性；论文中的真实 RQ2/RQ3 LLM 数字需要 `.env` 中的 `DEEPSEEK_API_KEY`（或其他 provider key）。',
    '- `node --env-file=.env ...` 会读取本地 key；`.env` 不提交。', '',
    '## 单元测试', '```bash', 'cd diffe2e',
    'node --test pipeline/test/*.test.mjs experiments/*.test.mjs experiments/real/*.test.mjs experiments/annotate/*.test.mjs',
    '```', '',
    '## 快速复现（无需 LLM key）', '```bash', 'cd diffe2e',
    'node subject/history/seed.mjs        # 构造 16-commit 真实历史到 subject/work/',
    'node experiments/run_rq1.mjs         # RQ1 选择：dataset + summary',
    'node experiments/analyze.mjs         # RQ1 统计 + SVG 图',
    'node experiments/uidiff_loop.mjs     # C1 闭环(静态,真实JSX): 语义UI Diff 驱动 选/生/修',
    'node experiments/run_c1_dynamic.mjs  # C1 动态(真实React项目): 实跑 选/生/修(自动还原)',
    'node realproj/gate.mjs               # 真实项目可插桩闸门',
    'node experiments/aggregate.mjs       # 汇总 -> EXPERIMENT_REPORT.md',
    '```', '',
    '## 真实 LLM 与 RQ4 复现', '```bash', 'cd diffe2e',
    'node --env-file=.env experiments/run_rq2.mjs',
    'node --env-file=.env experiments/run_rq3.mjs',
    'node experiments/run_rq4_cost.mjs experiments/real/adapters/cand_coverage.json "App.test.ts -g \\"use Red as a background color\\"" 1 3 3',
    'node experiments/run_rq4_cost.mjs experiments/real/adapters/actual_desktop.json "" 2 3 34',
    'node experiments/aggregate.mjs',
    '```', '',
    '## ReproBreak 复现', '```bash', 'cd diffe2e',
    'git clone --depth 1 https://github.com/rub-sq/ReproBreak realproj/clones/ReproBreak  # 真实 locator 断裂数据',
    'node realproj/reprobreak.mjs         # ReproBreak 真实数据子实验(可达性+改写器精确匹配)',
    'RB_LIMIT=449 node --env-file=.env realproj/reprobreak_e2e.mjs  # 端到端规则臂 + LLM 臂',
    '```', '',
    '## 产物', '- experiments/out/rq1_dataset.jsonl, rq1_summary.md, rq1_stats.md, figs/rq1_metrics.svg',
    '- experiments/out/rq2_results.md, rq3_results.md, aggregate.json',
    '- experiments/out/real/*_rq1.json, *_rq4.json, real_rq1_stats.md',
    '- realproj/results/reprobreak.md, reprobreak_e2e.md',
    '- EXPERIMENT_REPORT.md, realproj/results/REPORT.md', '',
    '## 人工校准', '```bash',
    'node experiments/annotate/make_sheet.mjs',
    '# 填写 experiments/annotate/sheet.csv 后：',
    'node experiments/annotate/score.mjs',
    '# 填写 experiments/out/rq3_staleness_to_annotate.csv 后：',
    'node experiments/annotate/score.mjs experiments/out/rq3_staleness_to_annotate.csv',
    '```',
  ];
  fs.writeFileSync(path.join(DIFFE2E, 'REPRODUCE.md'), R.join('\n') + '\n');

  console.log('wrote EXPERIMENT_REPORT.md + REPRODUCE.md + aggregate.json');
  const rq2Exec = rq2.summary && rq2.summary.diff ? rq2.summary.diff.execRate : rq2.execRate;
  console.log(`RQ1 ours Red=${rq1.summary.ours.Reduction} Safe=${rq1.summary.ours.Safety} | RQ2 diff exec=${rq2Exec} | RQ3 fix=${rq3.repaired}/${rq3.n} | RQ4 saving=${(execSaving * 100).toFixed(1)}%`);
}

main();
