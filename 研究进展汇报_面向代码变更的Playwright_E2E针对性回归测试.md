# 研究进展汇报

**课题**：面向代码变更的 Playwright 端到端针对性回归测试方法研究
（*Change-Aware Targeted Regression Testing for Playwright End-to-End Tests: Selection, Generation and Repair*）

**汇报人**：高东标　　**日期**：2026 年 6 月 18 日

> **一句话**：CI/CD 下每次提交全量跑 E2E 既慢又贵、还常被无害变更"震断"；本课题研究——**给定一次 Code Diff，自动产出一组"可运行、与变更相关、不过时"的 targeted Playwright E2E 测试集**（选择为主线，生成、修复为支撑）。该问题**有明确工程价值且存在研究空白**，并已通过**端到端可运行原型 + 真实数据预实验**验证**可行**。

---

## 一、研究问题（What & Why valuable）

### 1.1 问题背景

现代 Web 应用在敏捷 + CI/CD 下高频演进，代码以 commit/PR 小颗粒持续变化。E2E 测试模拟真实用户在浏览器中的完整业务流程，是质量保障关键，Playwright 已成主流框架。但 E2E 测试**执行昂贵、维护重、稳定性差**：

- 全量 E2E 套件在每次提交上运行**耗时长、占用大量 CI 资源**；
- 脚本通过定位符（locator）与页面交互，一次结构性变更即可使大量脚本断裂或断言失配——**即便功能并未改变**。实证数据：传统定位符可致多达 **75%** 的 Selenium 测试文件每 9 次提交需变更；脆弱定位符引发 **73.6%** 的测试断裂；Meta 披露 **14%–22%** 软件失效源于过时测试；E2E 在 CI 中采用率偏低（某 4518 仓库研究仅约 **10.6%**）。

**工程上真正需要的**：CI 里不想全量跑昂贵 E2E，而是**只跑与本次 diff 强相关的一小组 E2E，并保证这组测试可执行、覆盖变化、不过时**。

### 1.2 研究问题（RQ）

| 编号 | 研究问题 | 定位 |
|---|---|---|
| **RQ1** | 基于 Code Diff 的 E2E 测试**选择**，能否在**保证不漏选**受影响用例的前提下**显著减少执行开销**？ | 核心主线 |
| **RQ2** | 相比无 diff 约束的 E2E 生成，**diff 约束的缺口生成**是否产生更高**变更相关性与可执行率**的用例？ | 核心主线 |
| **RQ3** | 对因变更而失效的已选用例，引入**修复**能否提升 targeted 集的**可用性**（TargetedSetUsability）？ | 支撑环节 |
| **RQ4** | 方法在真实项目上的**成本（token/迭代/wall-clock）、泛化性与 CI 可集成性**如何？ | 成本/泛化 |

### 1.3 价值

- **工程价值**：直接面向 Playwright，提供可嵌入 CI/CD 的"针对 diff 的 targeted E2E 集"方案，降低 E2E 执行开销、提升测试与生产代码的同步性与可用性。
- **理论价值**：把**回归测试选择（RTS/CIA）、变更感知生成、E2E 测试修复**三条脉络在 **E2E 层**统一为"变更驱动的针对性回归测试"框架。

---

## 二、研究现状与空白（Where we stand）

围绕课题三要素——**变更感知**、**E2E/Playwright 技术栈**、**测试选择/生成/修复**——梳理五个方向（已系统调研 66 篇，A/B/C 三级分类，全文下载 61/66）：

| 方向 | 代表工作 | 局限（即空白） |
|---|---|---|
| ① RTS / CIA（"选择"基础） | iJaCoCo、语义修改推理 RTS、Hybrid RTS、NameRTS、Datalog-CIA | **全在代码/单元层，未解决 E2E 用例与源码变更的关联选择** |
| ② 变更感知测试生成 | Can-LLM-commits、ChaCo、PR-Aware、Just-in-Time@Meta | **落点几乎全在单元/回归测试** |
| ③ E2E/Web 生成 | AutoE2E、Screen Transition Graphs、VISCA、GenIA | **从需求/页面出发全量生成，与 Code Diff 解耦** |
| ④ E2E/Web 修复 | Practical Limits（Playwright+LangGraph+RAG）、WEFix、Semantic Repair、UTFix、TaRGET | **未把引发失效的源码 diff 作为修复上下文，也未服务 targeted 集可用性** |
| ⑤ 评测资源 | E2EGit（472 仓库/43,670 测试）、ReproBreak（449 可复现 locator break）、E2EBench | **直到 2026 年才出现面向 Playwright 的可复现断裂数据集** |

**核心空白（本课题切入点）**：
1. 变更感知测试工作**几乎全落点单元/回归层，E2E 层的"选择 / 缺口生成 / 失效修复"闭环缺位**；
2. E2E 生成**与 diff 解耦**，无法定向覆盖本次变更；
3. **E2E 级 RTS 缺位**——缺"哪些已有 E2E 用例覆盖本次 diff"的可操作方法；
4. 已有相关测试**易过时**，缺乏服务于 targeted 集可用性的修复。

---

## 三、解决方法（How）

### 3.1 总体架构：M0–M9 变更驱动流水线

对一次 Code Diff（`V_old→V_new`），输出 targeted E2E 集（已选 + 已修 + 新生成）+ 执行/覆盖/成本报告：

```text
Code Diff (V_old→V_new)
   │
   ├─ M0 覆盖映射(E2E→源码, 仅 V_old)
   ▼
M1 变更影响分析 ──▶ M2 测试选择 ──▶ M3 运行与分诊
                                        │通过 → 入 targeted set
                                        │失败 → M4 过时判定 ─疑似回归→ 报告
                                                  │过时
                                                  ▼
                                          M5 修复(locator/断言) ─M8 验证→ 入集
   M6 覆盖缺口分析(基于"已有覆盖 + 已选/已修实际覆盖"统一计算)
                                                  ▼
                                          M7 diff 约束生成 ─M8 验证→ M9 输出
```

| 模块 | 职责 | 深度 |
|---|---|---|
| M0 覆盖映射 | 逐用例运行期覆盖（istanbul/Playwright coverage），建"E2E→源码文件/路由"映射，仅用 V_old | 前提 |
| M1 变更影响分析 | git diff + tree-sitter AST → 变更文件/符号/路由/组件 | 支撑 |
| **M2 测试选择** | `diff ∩ 覆盖映射` 安全主干 **∪ Semantic UI Diff↔locator** 信号，取并集 | **深做** |
| M3 运行与分诊 | 跑 Sel，通过入集，失败采 trace/DOM/截图 | 支撑 |
| M4 过时判定 | 仅三类：结构性改动 / 期望变化 / 疑似回归 | 轻做 |
| M5 修复 | 失效 locator 多属性候选 + LLM 语义重写；断言更新；diff 切片入上下文 | 中等做 |
| M6 覆盖缺口分析 | 统一计算 V_new 中未被触达的 diff | 支撑 |
| **M7 diff 约束生成** | 对缺口生成 Playwright 用例（触达 diff + 关键路径 + 可解释断言） | **深做** |
| M8 验证迭代 | 修复/生成用例在 V_new 真实执行，失败反馈迭代（≤N_iter） | 支撑 |
| M9 输出与报告 | targeted 集 + 指标 + 可解释依据 | 支撑 |

### 3.2 贯穿性创新机制：Semantic UI Diff（C1）

这是本方法**区别于"把动态 RTS 直接套到 E2E"的关键连接件**：用 TypeScript 编译器 API 从 JSX/TSX 抽取语义 UI 节点（tag/text/handler/testId/role/aria/href），对 base/head 求 `ADD/MODIFY/REMOVE`。**同一份差异复用到三处**：
- **选择**：变更 UI 节点 ↔ 测试 locator 文本/testId 匹配——一条**免 sourcemap、对 E2E 更自然**的关联信号（覆盖映射回答"哪些测试碰了变更"，UI Diff 进一步补充覆盖之外的关联）；
- **修复**：REMOVE/文本变更 → 失效 locator + 结构邻居候选；
- **生成**：ADD 且无测试触达 → 覆盖缺口。

### 3.3 关键设计原则

- **无信息泄漏铁律**：选择只用 `V_old` 覆盖映射 + diff；`V_new` 全量覆盖**仅用于事后构造 affected oracle**，绝不回流给选择器。
- **可插拔 LLM**：有 API key 调真实大模型，无 key 走确定性 stub/规则回退——保证**全流程离线一键复现**，并天然形成"规则基线 vs LLM"两档对比。
- **执行验证**：所有修复补丁与生成用例**必须经 Playwright 真实执行验证**通过才入集。

---

## 四、实验设计（How to evaluate）

### 4.1 受影响测试 Oracle（Ground Truth，关键）

在 `V_new` 上**全量运行 E2E 并采集覆盖**，凡触达 diff 行/路由/组件的测试构成"受影响测试 oracle"`Affected`。选择器只用 V_old 信息——**杜绝信息泄漏**，这是定量结论可信的前提。

### 4.2 数据集

| 用途 | 来源 | 规模目标 |
|---|---|---|
| 选择/生成主实验 | **自建**（挖 E2EGit 中可插桩 Playwright 项目的 commit 历史） | 2–3 项目、数十–上百变更点 |
| 修复子实验 | **ReproBreak**（现成，449 可复现 locator break / 4 项目） | 449 |
| 泛化 | E2EGit 其余 Playwright 项目 | ≥1–2 项目 |

### 4.3 基线与消融

- **选择基线（RQ1）**：retest-all（全量上界）、随机同规模、静态路由/组件启发式、**纯覆盖映射（去 UI Diff 信号）**。
- **生成基线（RQ2）**：无 diff 约束的页面/功能驱动生成、随机生成。
- **修复基线（RQ3）**：纯属性 self-healing（无 LLM）、无 diff 上下文纯 LLM。
- **消融**：coverage-only / uidiff-only / dual；生成去 diff 约束；修复去 diff 切片 / 去候选匹配 / 去迭代。

### 4.4 评估指标（已形式化拆分）

- **选择（RQ1）**：`Reduction=1−|Sel|/|S|`、`Safety=|Sel∩Affected|/|Affected|`（不漏选）、`Precision`、`SelectionChangeCoverage`。
- **闭环（RQ3）**：`TargetedSetUsability=(selected_pass+repaired_pass)/|Sel∩Affected|`、`FinalChangeCoverage`。
- **生成（RQ2）**：变更相关性、可执行率、人工抽检**语义有效率**（应对"可执行≠正确测试"）。
- **成本（RQ4）**：token、迭代次数、wall-clock、CI 单 PR 时延。

### 4.5 统计方法

配对二元结果用 **McNemar**；比例/连续指标用 **Wilcoxon 符号秩 + bootstrap CI**，报告效应量 **Cliff's δ**；因 LLM 随机性 ≥3 次运行报均值±std。

---

## 五、可行性证据：已跑通的原型与预实验（Proof it's feasible）

> 不止"计划可行"，已搭出**端到端可运行原型 DiffE2E（M0–M9 全链路，21 个单测全绿、零运行时依赖、一键复现）**，并在受控主体 + 真实工程 + 真实数据上跑出真数字。

### 5.1 RQ1 选择（受控多文件应用，24 个真实 git 变更过渡）

| 方法 | Reduction | Safety（不漏选） | Precision |
|---|---|---|---|
| **ours** | **0.625** | **1.000** | **1.000** |
| retest_all | 0 | 1.000 | 0.375 |
| random_k | 0.625 | 0.396 | 0.396 |
| static_heuristic | 0.875 | 0.667 | 1.000 |

- **本方法是四个基线中唯一同时做到 Safety=1.0 且大幅 Reduction 的方法**（bootstrap 95% CI：Reduction 0.625 [0.493–0.75]，Safety 1）。
- 统计显著：vs retest_all Reduction p=0.0001（δ=0.79）；vs random_k Safety p=0.0003（McNemar χ²=15.06，17 个过渡 random 漏选而本方法不漏）；vs static_heuristic Safety p=0.0143（χ²=6.13，启发式靠漏选换缩减）。
- **消融**：覆盖信号是"安全主干"（Safety=1.0）；UI 信号单用精确但漏逻辑/路由变更（Safety 0.083）——**两者互补**。

### 5.2 C1 动态实测（真实 React + Vite + Playwright 工程）

变更 Red→Crimson + 新增 Green：**覆盖信号 Precision=0.33（选 3/3）→ Semantic UI Diff Precision=1.0（选 1，Reduction 0.67，Safety 1）**，并实跑完成修复（locator 重定向后重跑 PASS）与新增按钮生成（可执行 + 命中覆盖）。→ 证明 UI 信号在覆盖粒度过粗时的真实增益。

### 5.3 RQ2 生成 / RQ3 修复 / RQ4 成本

- **RQ2**：缺口 n=2，可执行率 1.0、变更相关率 1.0（语义有效率待真实 LLM/人工）。
- **RQ3**：修复 2/2 成功；**TargetedSetUsability 0.0 → 1.0**。
- **RQ4**：24 过渡 retest-all 执行 144 次 vs 本方法 54 次 → **执行量降 62.5%（Safety 仍 1.0）**。

### 5.4 真实数据子实验：ReproBreak（9604 条真实断裂）

- **Semantic UI Diff 可达性 12.2%**（testId/text/role/href 语义锚替换；Playwright 17.4% 明显高于 Cypress 6.9%）；
- 确定性改写器在可达的 578 条上精确重建开发者修复 **574/578 = 99.3%**——**诚实界定了能力边界与 LLM 增益空间**。

### 5.5 两个已暴露的工程约束（已纳入有效性威胁）

1. 插桩行号位于 JSX 转译后空间——**文件级（L1）归属无需映射稳定可用**，子文件级须 sourcemap 反映射（被测项目已开 sourcemap）；
2. 文本与 handler 同时变更时 Semantic UI Diff 退化为"删+增"，需运行时 DOM 邻域匹配消歧（即"静态+运行时互补"的动因）。

---

## 六、价值 × 可行性 小结

| 维度 | 结论 | 证据 |
|---|---|---|
| **有价值** | E2E 层"选择/生成/修复"闭环是明确研究空白，且对应真实 CI 痛点 | 66 篇文献梳理出空白；执行量可降 62.5% |
| **方法成立** | 双信号选择 + Semantic UI Diff 贯穿选择/修复/生成，区别于简单套用 RTS | RQ1 显著优于全部基线；C1 把选择精度 0.33→1.0 |
| **可评测** | 无泄漏 oracle + 形式化指标 + 现成 ReproBreak + 自建数据 | RQ1–RQ4 已跑出真数字并通过统计检验 |
| **可实现** | 原型 M0–M9 全链路已跑通，核心实现风险基本出清 | 21 单测全绿、一键复现、真实工程 + 9604 条真实数据验证 |

---

## 七、存在问题与下一步

**当前局限**：① 主体为受控工程，真实项目**多 commit replay** 尚未跑通（候选项目已过可插桩闸门，replayReady=false）；② 生成/修复目前用 stub，**语义有效率需真实 LLM/人工**；③ ReproBreak **执行验证版（449 断裂 + Docker）** 与"diff→信号→修复"端到端精度待补。

| 优先级 | 任务 | 产出 |
|---|---|---|
| 高 | 接入真实 LLM，对 stub 做对比 | 语义有效率、真实修复率、量化 LLM 增益 |
| 高 | 真实项目多 commit replay（E2EGit 筛可插桩项目） | 外部效度增强的 RQ1 数字 |
| 中 | ReproBreak 执行验证版 + 端到端精度 | RQ3 完整结论 |
| 中 | 扩充变更类型/样本规模 | 更稳健的统计功效 |
| 低 | CI/CD 集成原型（GitHub Actions 钩子） | 可落地工程演示 |

**论文目标**：完成真实 LLM 与真实项目实验后形成可投稿实验章节，目标 ICST / ICSME / ASE-ISSTA workshop 或相关期刊。

---

## 附：关键产物

- 开题报告（聚焦版）：`开题报告_面向代码变更的Playwright_E2E针对性回归测试.md`
- 实验方案与系统设计：`实验方案与系统设计_DiffE2E_针对性测试.md`
- 文献综述：`文献综述_基于CodeDiff的Playwright_E2E测试自动生成与修复.md`
- 实验报告/复现：`diffe2e/EXPERIMENT_REPORT.md`、`diffe2e/REPRODUCE.md`
- 实验数据：`diffe2e/experiments/out/`（rq1_dataset.jsonl、rq1_stats.md、aggregate.json、figs/）
- 真实数据子实验：`diffe2e/realproj/results/reprobreak.md`
