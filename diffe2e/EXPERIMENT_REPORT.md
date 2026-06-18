# DiffE2E 实验报告（面向代码变更的 Playwright E2E 针对性回归测试）

## 0. 概览
- 主体：受控多文件应用（6+ 路由、共享 util），真实 git 历史 25 个 commit、24 个变更过渡。
- 全流程零外部依赖、可一键复现；生成/修复使用可插拔 LLM 客户端（无 key 时走确定性 stub）。
- 无信息泄漏：选择只用 V_old 覆盖 + diff；V_new 全量覆盖仅用于构造 affected oracle。

## 1. RQ1 选择：最小且安全的针对性测试集
| 方法 | Reduction | Safety | Precision |
|---|---|---|---|
| ours | 0.625 | 1 | 1 |
| retest_all | 0 | 1 | 0.375 |
| random_k | 0.625 | 0.3958 | 0.3958 |
| static_heuristic | 0.875 | 0.6667 | 1 |

- ours bootstrap 95% CI：Reduction 0.625 (0.493–0.75)、Safety 1 (1–1)、Precision 1。
- 显著性（ours vs 基线）：
  - vs retest_all: Reduction Wilcoxon p=0.0001 (Cliff δ=0.7917); Safety p=1 (δ=0); McNemar(安全) b=0,c=0,χ²=0。
  - vs random_k: Reduction Wilcoxon p=1 (Cliff δ=0); Safety p=0.0003 (δ=0.7083); McNemar(安全) b=17,c=0,χ²=15.0588。
  - vs static_heuristic: Reduction Wilcoxon p=0.0143 (Cliff δ=-0.5451); Safety p=0.0143 (δ=0.3333); McNemar(安全) b=8,c=0,χ²=6.125。
- 结论：ours 是唯一同时做到 Safety=1.0 且高 Reduction 的方法；random 同规模但不安全（漏选），static 启发式在共享 util/router 变更上漏选。

### 信号消融：coverage-only / uidiff-only / dual
| 变体 | Reduction | Safety | Precision |
|---|---|---|---|
| coverage_only | 0.625 | 1 | 1 |
| uidiff_only | 0.9861 | 0.0833 | 1 |
| dual | 0.625 | 1 | 1 |

- UI 信号（Semantic UI Diff 的 vanilla-JS 同构版）在 2/24 个过渡上触发选择，均为 locator 改名类变更，精确但单用 Safety 仅 0.0833（漏选逻辑/路由/断言类变更）。
- dual = coverage ∪ uidiff，在该文件粒度主体上与 coverage-only 等价：覆盖映射已是安全主干，UI 信号此处冗余但无害。
- UI 信号的真正增益体现在覆盖粒度过粗的单组件应用——见 1.6 C1 动态实测（uidiff 选择精确率 1.0 vs 纯覆盖 0.33）。两者互补。

### 按变更类型（ours）
| 类型 | n | Reduction | Safety | Precision |
|---|---|---|---|---|
| ui_text | 5 | 0.833 | 1.000 | 1.000 |
| logic | 5 | 0.800 | 1.000 | 1.000 |
| new_feature_gap | 3 | 0.000 | 1.000 | 1.000 |
| multi_file | 3 | 0.667 | 1.000 | 1.000 |
| locator_break | 2 | 0.833 | 1.000 | 1.000 |
| refactor_noise | 2 | 0.750 | 1.000 | 1.000 |
| route | 2 | 0.000 | 1.000 | 1.000 |
| assertion_break | 2 | 0.833 | 1.000 | 1.000 |

## 1.5 C1 闭环：Semantic UI Diff 驱动选择/生成/修复（真实 JSX）
- 语义差分: ADD 2 / REMOVE 1 / MODIFY 2（真实 JSX App.old→App.new）。
- 选择: 选中 paint.spec.ts, link.spec.ts, turquoise.spec.ts；无关用例正确排除。
- 生成: 对未覆盖的新增节点(Crimson, Green)合成可执行用例。
- 修复: paint.spec.ts[locator]；link.spec.ts[assertion]；turquoise.spec.ts[locator-harden]（locator 重定向 / 断言更新 / locator 加固）。
- 详见 out/c1_loop.md。这是 C1 核心（JSX 语义差分驱动整条链）的端到端集成，与 RQ1–3 动态数字互补。

## 1.6 C1 动态实测：真实 React 项目 (cand_coverage)
- 变更：Red→Crimson（同 handler/颜色）+ 新增 Green；实跑 e2e，affected oracle（结果翻转）= App.test.ts::red。
- 选择对比（同一 oracle）：coverage-only Precision 0.3333 (选 3/3)；**uidiff Precision 1**（选 1，Reduction 0.6667，Safety 1）。
- 修复：[{"kind":"locator","field":"text","from":"Red","to":"Crimson"}] → "use Red" 重跑 PASS。
- 生成：新增 Green 按钮 → 可执行=true，覆盖App=true。
- 这是 C1 在真实 React 工程上的**动态**证据：语义 UI Diff 把选择精度从覆盖级的 0.3333 提升到 1，并实跑完成修复与生成。详见 out/c1_dynamic.md。

## 2. RQ2 生成：覆盖缺口补齐
- provider=stub，缺口数 n=2：可执行率=1，变更相关率=1。
- 语义有效率=NA（需人工/LLM 评判；候选见 out/rq2_to_annotate.jsonl）。

## 3. RQ3 修复：让选中的失效用例重新可用
- 修复成功率=1.000 (2/2)；TargetedSetUsability：before 0.000 → after 1.000。
- 过时分类：定位失效→STRUCTURAL_ONLY（语义定位重写），期望变化→EXPECTATION_CHANGE（断言更新）。

## 4. RQ4 成本/效率
- 跨 24 个过渡：retest-all 共执行 144 次用例；ours 仅执行 54 次 → 测试执行量下降 62.5%（Safety 仍=1.0）。
- 生成/修复均为按需触发（仅缺口/失效用例），额外成本与变更规模成正比。

## 5. 外部效度（真实项目，尽力而为）
- cand_coverage: Playwright=true, 覆盖方法=istanbul (vite-plugin-istanbul), E2E=3, 闸门=PASS (per-test coverage produced), 可replay=false。
- cand_movies: Playwright=true, 覆盖方法=CDP page.coverage, E2E=71, 闸门=PASS (method available), 可replay=false。
- 详见 realproj/results/REPORT.md。多 commit 真实历史 replay 因浅克隆/需逐 commit 运行环境列为后续工作。

## 6. 有效性威胁与局限
- 主体为受控工程，量化结论的外部效度有限；真实多 commit replay 为后续工作。
- 生成/修复用确定性 stub（无 LLM key）：可执行率/相关性/修复率可测，语义有效率需人工或真实 LLM。
- 覆盖映射在 bundler 行号变换下子文件级需 sourcemap 反查；本实验采用文件级归属（干净）+ locator/UI 信号（不依赖行号）。
- Semantic UI Diff 在“文案与 handler 同时变更”时静态匹配会退化为 ADD/REMOVE，需运行时 DOM 邻域匹配消歧。

## 7. 复现
见 REPRODUCE.md（一键：seed → run_rq1..3 → analyze → aggregate）。
