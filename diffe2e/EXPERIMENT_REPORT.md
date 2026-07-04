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

## 2. RQ2 生成：覆盖缺口补齐（双臂：diff 约束 vs 无约束基线）
- provider=deepseek。
| 臂 | n | 可执行率 | 变更相关率 | 变异杀伤(均值) | 版本敏感率 | 自动语义有效率 |
|---|---|---|---|---|---|---|
| diff | 3 | 1 | 1 | 0.6667 | 1 | 1 |
| nodiff | 3 | 0.3333 | 0 | 0.2222 | 0.3333 | 0.3333 |

- 自动语义有效率 = 可执行 ∧ 版本敏感（V_new 过、V_old 失败）∧ 杀掉≥1个注入变异；客观、无需人工。
- 核心论点：真实 LLM 下，diff 约束臂在可执行率、变更相关率、版本敏感率和自动语义有效率上均明显高于无约束基线。
- 工程护栏：真实 provider 请求失败或返回空 completion 时直接报错；LLM 输出会清洗 Markdown 代码围栏，并统一导入 `./fixtures` 以保留覆盖采集。
- 人工小样本校准=待办（仅作自动语义指标的辅助验证；盲标注候选见 out/rq2_to_annotate.jsonl，解盲键 rq2_unblind.json）。

## 3. RQ3 修复：让选中的失效用例重新可用
- provider=deepseek。
- 修复成功率（rule）=0.750 (3/4)；修复成功率（LLM）=1.000 (4/4)。
- TargetedSetUsability（按规则修复后可进入 targeted set 的保守口径）：before 0.000 → after 0.750。
- 过时分类：定位失效→STRUCTURAL_ONLY（语义定位重写），期望变化→EXPECTATION_CHANGE（断言更新）；c21 被保守分为 SUSPECTED_REGRESSION，规则臂不改写，LLM 臂可生成通过补丁但需人工/业务语义确认是否采纳。

## 3.5 ReproBreak 真实数据子实验（离线 / CSV ground truth）
- 数据：9604 条真实结构性 locator 断裂对（Playwright 4867/Cypress 4737，多个开源项目）。
- **Semantic UI Diff 可达性**：1172/9604 = 12.2% 为 testId/text/role-name/href 语义锚值替换（本方法 UI 信号直接可定位）；其余为 CSS id/class 改名、结构重排、策略切换（需 DOM 拓扑或 LLM）。Playwright 语义定位的可达性显著高于 Cypress。
- **确定性修复改写器**（已知 oracle 信号，上界）：在可达的 578 条上精确重建开发者修复 574/578 = 99.3%。
- 诚实定位：该结果量化了「语义信号能覆盖多少真实断裂」与「改写机制在真实语法上的正确性」；端到端信号检测精度与执行验证（449 断裂 / Docker）为后续。详见 realproj/results/reprobreak.md。

## 3.6 ReproBreak 端到端修复（无信息泄漏，真实逐 commit 源码）
- 数据：449 条执行验证断裂（导出自 SQLite），进入评估 n=414，泄漏护栏跳过 35 条。
- **无泄漏设定**：修复输入仅「旧（断裂）测试 + 应用源码 old/new diff（已排除测试文件）」；`new_locator` 与新测试文件仅评估用。
- **规则臂端到端 exact-match**：14/414 = 3.38%（有 app 信号子集 14/393 = 3.56%）。
- **LLM 臂端到端 exact-match（DeepSeek）**：23/414 = 5.56%（LLM 调用错误 0）。
- 分项目：angular-slickgrid 1/245、koenig 2/78、openmct 6/46、playwright 14/45。
- 关键对比：3.5 离线「已知 oracle 信号」上界 99.3% vs 本节端到端「从 app diff 自行还原信号」规则臂 3.38%、DeepSeek LLM 臂 5.56%——LLM 有增益，但整体 exact-match 仍低，量化了信号检测的难度。详见 realproj/results/reprobreak_e2e.md。

## 4. RQ4 成本/效率
- 跨 24 个过渡：retest-all 共执行 144 次用例；ours 仅执行 54 次 → 测试执行量下降 62.5%（Safety 仍=1.0）。
- 生成/修复均为按需触发（仅缺口/失效用例），额外成本与变更规模成正比。

## 5. 外部效度（真实项目，尽力而为）
- cand_coverage: Playwright=true, 覆盖方法=istanbul (vite-plugin-istanbul), E2E=3, 闸门=PASS (per-test coverage produced), 可replay=false。
- cand_movies: Playwright=true, 覆盖方法=CDP page.coverage, E2E=71, 闸门=PASS (method available), 可replay=false。

### 5.1 真实多 commit 历史 replay（CDP 覆盖注入）
通过 CDP 透明注入每用例覆盖（`page.coverage`，不改业务代码、无需预插桩），在真实开源项目的连续 commit 上回放并按变更选择用例。

| 项目 | n | 方法 | Reduction | Safety | Precision |
|---|---|---|---|---|---|
| actual_desktop | 9 | coverage_only | 0.1111 | 1 | 1 |
| actual_desktop | 9 | uidiff_only | 0.8954 | 0.2157 | 1 |
| actual_desktop | 9 | dual | 0.1111 | 1 | 1 |
| mermaid_live | 5 | coverage_only | 0 | 1 | 1 |
| mermaid_live | 5 | uidiff_only | 1 | 0 | 1 |
| mermaid_live | 5 | dual | 0 | 1 | 1 |

- 已接入 2 个真实项目、共 14 个稳定过渡（达计划 ≥2 个的外部效度目标）。
- 覆盖臂在两项目上 Safety=1.0（不漏选受影响用例）；Reduction 取决于项目结构：
  - 模块化 monorepo（actual-budget）覆盖选择有缩减；小型单页 SPA（mermaid-live-editor）核心组件被几乎所有用例加载，覆盖选择缩减有限（Reduction≈0）——覆盖法在“强耦合核心”应用上的固有局限。
  - uidiff 臂为**稀疏触发、高精度互补信号**：仅当 diff 触及测试引用的 testId/可见文本锚点时激活。actual 9 过渡中 1 个（commit 19cea1a：schedule 金额改 ± 符号、改动 testId `date`）激活，经页面对象导入闭包映射到 32 个用例，**uidiff_only Precision=1.0**（选中皆为受影响）；其余过渡为新增/逻辑改动不触发。锚点稀疏项目（如 mermaid）该臂多为空选。
  - 跨项目（n=14）：dual 在两项目上均 Safety=1.0、Precision=1.0；uidiff_only 触发即 Precision=1.0 但平均 Safety 低（稀疏），印证“覆盖臂为安全主干、UI 信号为精度补充”的设计取舍。详见 out/real/real_rq1_stats.md 与 figs/real_rq1.svg。
- 明细见 out/real/<project>_rq1.{json,jsonl,md,_skips.json}。

## 6. 有效性威胁与局限
- 主体为受控工程；外部效度已在 2 个真实开源项目（actual-budget、mermaid-live-editor）的多 commit replay 上初步验证（§5.1），但项目数仍有限。
- 生成实验已接入真实 DeepSeek 对照；修复在无 LLM key 时仍走确定性 stub，可执行率/相关性/修复率可测，语义有效率需人工或真实 LLM。
- 修复在真实数据（ReproBreak）上已两层量化：3.5 离线可达性/改写器正确性（已知信号上界 99.3%），3.6 端到端无泄漏修复（449 执行验证断裂、4 真实项目，规则臂 3.38%、DeepSeek LLM 臂 5.56%）；仍存局限：端到端执行验证（Docker overwrite）与 DOM/trace 候选元素作为更强上下文为后续。
- 覆盖映射在 bundler 行号变换下子文件级需 sourcemap 反查；本实验采用文件级归属（干净）+ locator/UI 信号（不依赖行号）。
- Semantic UI Diff 在“文案与 handler 同时变更”时静态匹配会退化为 ADD/REMOVE，需运行时 DOM 邻域匹配消歧。

## 7. 复现
见 REPRODUCE.md（一键：seed → run_rq1..3 → analyze → aggregate）。
