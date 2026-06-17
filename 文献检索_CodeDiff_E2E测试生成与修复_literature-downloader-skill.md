# 文献检索：Code Diff → 自动生成 E2E 测试与测试修复

> 研究主题：**基于 Code Diff 的 E2E 测试自动生成与测试修复**
> 检索时间：2026 年 6 月 ｜ 检索范围：arXiv（cs.SE 为主，2023–2026），Semantic Scholar 补全引用数与发表 venue
> 引用数为 Semantic Scholar 实时数据（2026-06，随时间变动；新论文引用数天然偏低）
> 本表为**新一轮检索结果**，已剔除与既有《文献调研_测试生成与修复.md》重复的条目
> ⭐⭐ = 与课题（Code Diff + E2E + 生成/修复）高度契合 ｜ ⭐ = 强相关 ｜ 全部为 arXiv 开放获取，提供 PDF 直链（未下载）

---

## 一、基于 Code Diff / PR / Commit 的变更感知测试生成（最核心方向）

| 题目 | 年份 | 引用数 | 摘要（中文概要） | PDF | 来源/Venue |
|---|---|---|---|---|---|
| ⭐⭐ Change And Cover (ChaCo): Last-Mile, Pull Request-Based Regression Test Augmentation | 2026 | 2 | 针对"PR 修改行中仍未被测试覆盖的最后一公里(last-mile)回归测试缺口"，提出基于 LLM 的测试增强：不追求整体覆盖率，而是**精准定向 PR 中未覆盖的变更行**生成补充测试。直接对应"用 diff 决定生成哪些测试"。 | https://arxiv.org/pdf/2601.10942 | arXiv 2026 |
| ⭐⭐ PR-Aware Automated Unit Test Generation: Challenges and Opportunities | 2026 | 0 | 指出现有测试生成多面向完整类、以覆盖率评估，而现实开发以小颗粒 PR 演进；系统评估 PR 感知测试生成（EvoSuite vs LLM 路线）的可行性与差距。给课题提供"PR 粒度评测"的方法论参照。 | https://arxiv.org/pdf/2605.25285 | arXiv 2026 |
| ⭐⭐ Can LLM Generate Regression Tests for Software Commits? | 2025 | 11 | 面向结构化输入程序（XML 解析器、JS 解释器等），给定一次 commit/PR 代码变更，用 LLM 生成回归测试以**发现该变更引入的 bug**。是"commit → 回归测试生成"的直接代表作。 | https://arxiv.org/pdf/2501.11086 | arXiv 2025 |
| ⭐ Evaluating LLM-Based Test Generation Under Software Evolution | 2026 | 1 | 大规模实证：LLM 生成的测试在代码演化下是真推理还是表面模式复刻？分析其覆盖率下降、漏检回归、漏报缺陷等弱点。为课题提供"演化场景下测试质量评估"框架。 | https://arxiv.org/pdf/2603.23443 | arXiv 2026 |
| ⭐ Just-in-Time Catching Test Generation at Meta | 2026 | 0 | Meta 工业实践："catching test"以"应当失败、在代码合入前暴露 bug"为目标。分析 22,126 条生成测试，**代码变更感知方法**比 hardening 测试提升候选捕获 4×、比偶然失败 20×；并用规则+LLM 抑制误报。 | https://arxiv.org/pdf/2601.22832 | arXiv 2026 |
| ⭐ TestWeaver: Execution-aware, Feedback-driven Regression Testing Generation with LLMs | 2025 | 0 | 针对 LLM 回归测试生成的"覆盖率停滞(coverage plateau)"，集成轻量程序分析构造聚焦执行上下文、降低幻觉，反馈驱动迭代提升覆盖。 | https://arxiv.org/pdf/2508.01255 | arXiv 2025 |
| ⭐ Testora: Using Natural Language Intent to Detect Behavioral Regressions | 2025 | 5 | 首个将"代码变更意图(NL intent)"与"变更导致的行为差异"对比来判定回归的方法——区分"有意行为改变(修 bug/加功能)"与"真回归"，避免传统回归测试把所有差异都报为回归。 | https://arxiv.org/pdf/2503.18597 | arXiv 2025 |

---

## 二、E2E / Web·GUI 测试自动生成

| 题目 | 年份 | 引用数 | 摘要（中文概要） | PDF | 来源/Venue |
|---|---|---|---|---|---|
| ⭐ GenIA-E2ETest: A Generative AI-Based Approach for End-to-End Test Automation | 2025 | 0 | 用生成式 AI 从自然语言描述自动生成**可执行 E2E 测试脚本**，明确针对"现有方案多停留在单元测试、缺乏 E2E"这一空白。与课题 E2E 生成目标直接对齐。 | https://arxiv.org/pdf/2510.01024 | 巴西软件工程研讨会 SBES 2025 |
| ⭐ Automated Web Application Testing: End-to-End Test Case Generation with LLMs and Screen Transition Graphs | 2025 | 8 | 用**屏幕跳转图(screen transition graph) + LLM** 建模站点导航与复杂表单交互，自动生成 Web 应用 E2E 测试，解决动态导航流与表单处理难题。 | https://arxiv.org/pdf/2506.02529 | arXiv 2025 |
| ⭐ VISCA: Inferring Component Abstractions for Automated End-to-End Testing | 2025 | 0 | 将网页转为**层次化、语义丰富的组件抽象**（启发式分段 + 分类/上下文抽取），为 LLM 提供更优上下文输入以提升 E2E 测试生成质量。对"如何给 LLM 喂 Web 页面上下文"有借鉴价值。 | https://arxiv.org/pdf/2506.04161 | arXiv 2025 |
| Automated Functional Testing for Malleable Mobile Application Driven from User Intent | 2026 | 0 | 设想"按用户意图可塑(malleable)的移动应用"，用 LLM 生成代码并需配套自动测试生成来可靠验证由用户需求驱动的改动——"需求/变更 → 验证测试"思路相关。 | https://arxiv.org/pdf/2604.02079 | arXiv 2026 |
| ViMoTest: Specify ViewModel-Based GUI Test Scenarios using Projectional Editing | 2025 | 1 | 用 BDD + ViewModel 模式 + 投影式 DSL，将表现层逻辑与 GUI 框架解耦测试，缓解 E2E 方案的高规约成本、维护难、flaky 问题。提供"降低 E2E 维护成本"的另一思路。 | https://arxiv.org/pdf/2504.16753 | ICSCT 2025 |

---

## 三、测试修复 / 测试更新（代码变更后，与课题"测试修复"对齐）

| 题目 | 年份 | 引用数 | 摘要（中文概要） | PDF | 来源/Venue |
|---|---|---|---|---|---|
| ⭐⭐ Practical Limits of Autonomous Test Repair: A Multi-Agent Case Study (LLM + LangGraph + Playwright) | 2026 | 0 | 工业案例：大型企业级 UI 测试套件的多智能体自治测试系统，基于 LLM + **LangGraph 编排 + Playwright 执行 + RAG 知识库**，每屏数百动态 UI 元素，从人工指导逐步走向高自治的特性发现与测试执行/修复。**技术栈与课题（Playwright E2E）高度一致**。 | https://arxiv.org/pdf/2605.01471 | arXiv 2026 |
| ⭐⭐ Unit Test Update through LLM-Driven Context Collection and Error-Type-Aware Refinement | 2025 | 3 | 不仅"修复失效测试"，还"增强测试以验证新功能"——LLM 驱动上下文收集 + 错误类型感知的精炼，覆盖代码变更后测试更新的双场景。与 UTFix 互补，是课题"修复+增强"的关键参考。 | https://arxiv.org/pdf/2509.24419 | ASE 2025 |
| ⭐ Fix the Tests: Augmenting LLMs to Repair Test Cases with Static Collector and Neural Reranker | 2024 | 8 | 软件演化中测试更新滞后于生产代码会致编译失败等问题。用**静态上下文收集器 + 神经重排序器**增强 LLM，修复因代码变更未同步而过时(obsolete)的测试，提升大型项目修复准确率。 | https://arxiv.org/pdf/2407.03625 | ISSRE 2024 |
| ⭐ YATE: The Role of Test Repair in LLM-Based Unit Test Generation | 2025 | 4 | LLM 生成的测试常有语法/语义错误，直接丢弃是"错失机会"。提出对这些错误测试做简单修复，使其重获测试价值并作为生成更多测试的良种。把"修复"嵌入"生成"闭环。 | https://arxiv.org/pdf/2507.18316 | arXiv 2025 |

---

## 四、E2E 测试稳定性：定位符断裂 / Flaky 修复

| 题目 | 年份 | 引用数 | 摘要（中文概要） | PDF | 来源/Venue |
|---|---|---|---|---|---|
| ⭐⭐ ReproBreak: A Dataset of Reproducible Web Locator Breaks | 2026 | 0 | **直接面向 Cypress/Playwright**：当被测应用结构变化导致 locator 找不到目标元素（功能未变但测试断裂）。分析 359 个开源项目，构建首个可复现的 Web GUI 测试**定位符断裂数据集**。是课题"Code Diff 致 E2E 失效 → 修复"的理想评测基准与问题刻画。 | https://arxiv.org/pdf/2605.12158 | arXiv 2026 |
| ⭐ FlakyGuard: Automatically Fixing Flaky Tests at Industry Scale | 2025 | 2 | 把代码当作图结构、用选择性图探索找到最相关上下文，解决 LLM 修复 flaky 测试时"上下文过少/过多"的难题（对比 FlakyDoctor），工业规模评估。 | https://arxiv.org/pdf/2511.14002 | ASE 2025 |

---

## 五、回归测试选择（用 diff 精准定位受影响测试，工程支撑）

| 题目 | 年份 | 引用数 | 摘要（中文概要） | PDF | 来源/Venue |
|---|---|---|---|---|---|
| ⭐ Names Are All You Need (NameRTS): Effective and Safe Regression Test Selection for Python | 2026 | 0 | 首个基于细粒度依赖分析的 Python 回归测试选择：针对 Python 动态类型致调用图不准、急切导入致文件级分析过保守的问题，只执行受代码变更影响的测试。支撑"基于 Code Diff 决定跑/生成哪些测试"。 | https://arxiv.org/pdf/2605.25356 | arXiv 2026 |

---

## 六、工业界规模化测试生成（背景与对标）

| 题目 | 年份 | 引用数 | 摘要（中文概要） | PDF | 来源/Venue |
|---|---|---|---|---|---|
| Observation-Based Unit Test Generation at Meta (TestGen) | 2024 | 14 | Meta 的 TestGen：从应用运行中序列化观测复杂对象、"雕刻(carving)"出单元测试。已落地 518 个测试、CI 中执行 960 万+次、发现 5,702 个缺陷。工业落地与规模化挑战的代表案例。 | https://arxiv.org/pdf/2402.06111 | FSE Companion 2024 |

---

## 七、对课题的启示（基于本轮新增文献）

1. **"Code Diff 驱动"已有明确同行工作，但仍偏单元测试**
   - **ChaCo / PR-Aware / Can LLM Generate Regression Tests for Commits / Just-in-Time Catching@Meta** 共同确立了"PR/commit 变更行 → 定向生成测试"的范式，但落点几乎都在**单元/回归测试**，**E2E 层面仍是空白**——进一步印证课题（Code Diff + Playwright E2E）的创新空间。

2. **E2E 生成已起步，缺与 diff 的耦合**
   - **GenIA-E2ETest / Web E2E with Screen Transition Graphs / VISCA** 证明 LLM 生成 E2E 已可行，但均为"从需求/页面"出发，**没有以代码变更(diff)为触发与约束**。把"Code Diff → 受影响 UI 流 → E2E 用例"这条链路接起来，是清晰的贡献点。

3. **修复方向有最贴近课题技术栈的工作（必读）**
   - **Practical Limits of Autonomous Test Repair（2605.01471）**：LLM + LangGraph + **Playwright** + RAG 的企业级 UI 测试自治修复——技术栈与课题几乎一致，应作为最重要对标/基线。
   - **Unit Test Update（2509.24419）/ Fix the Tests（2407.03625）**：变更后测试"修复 + 增强"的上下文收集与精炼策略，可迁移到 E2E。

4. **E2E 失效与评测的抓手**
   - **ReproBreak（2605.12158）**：Playwright/Cypress 定位符断裂的可复现数据集，是课题"变更致 E2E 断裂→自动修复"问题刻画与评估的现成基准。
   - **Testora（2503.18597）**：用"变更意图"区分"有意改动 vs 真回归"，可用于 E2E 断言/期望的更新判定，避免把预期内 UI 改动误报为失败。

5. **工程支撑闭环**
   - **NameRTS（RTS）+ 既有 iJaCoCo / Pipeline-Aware RTS** → "用 diff 精准定位受影响测试"的选择层；
   - **TestWeaver / Evaluating under Evolution** → 演化场景下覆盖率停滞与质量评估的方法层。
   - 三者可拼成"**Diff 定位 → E2E 生成/修复 → 演化下质量评估**"的完整研究框架。

---

### 检索说明
- 数据来源：arXiv API（11 组关键词检索，去重后 239 篇候选、CS+2023 后 212 篇），Semantic Scholar batch API 补全引用数/venue。
- 本表 20 篇均为既有调研之外的**新增**条目；全部为 arXiv 开放获取，仅记录 PDF 链接，未执行下载。
- 引用数与 venue 截至 2026-06，会随时间变化；部分 2026 年新论文尚处预印本阶段（venue 显示 arXiv.org）。
