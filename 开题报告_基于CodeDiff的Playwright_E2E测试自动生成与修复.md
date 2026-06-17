# 硕士学位论文开题报告

---

## 一、课题名称（论文题目）

**基于 Code Diff 的 Playwright 端到端（E2E）测试自动生成与修复方法研究**

英文题目：*Code Diff-Driven Automatic Generation and Repair of Playwright End-to-End Tests*

---

## 二、研究背景与意义（问题提出）

### 2.1 研究背景

现代 Web 应用规模庞大、迭代频繁，敏捷开发与持续集成/持续交付（CI/CD）已成为主流工程范式，代码以小颗粒度的提交（commit）与合并请求（Pull Request, PR）的形式持续演进。在此背景下，端到端（End-to-End, E2E）测试——模拟真实用户在浏览器中的完整业务流程——成为保障 Web 应用质量不可或缺的环节。Playwright 作为近年来快速崛起的跨浏览器 E2E 测试框架，凭借自动等待、多浏览器内核支持、强定位能力等特性，已被工业界广泛采用。

然而，E2E 测试同时也是软件测试中**编写成本最高、维护负担最重、稳定性最差**的一类测试。已有综述与实证研究表明：

- E2E 测试在 CI 中的采用率仍然偏低（一项针对 4518 个使用 CI 的开源 Android 仓库的实证研究显示，E2E instrumentation 测试采用率仅约 10.6%）；
- E2E 测试脚本对前端结构（DOM、定位符 locator）和异步时序高度敏感，应用一次看似无害的代码变更就可能导致大量脚本断裂（locator break）或出现间歇性失败（flaky test）；
- Meta 的研究披露，14%–22% 的软件失效源于过时（outdated）的测试套件；维护测试占据了软件测试过程中相当大比例的成本与人力。

与此同时，大语言模型（LLM）在代码理解与生成上的突破，为自动化测试生成与修复带来了新机遇。学界已涌现出大量"LLM 用于测试生成/修复"的工作，并初步形成了"基于代码变更（Code Diff / Commit / PR）感知的测试演化"这一前沿方向。

### 2.2 问题提出

尽管 LLM 驱动的测试自动化进展显著，但在"**面向 Web 应用、以 Code Diff 为触发与约束、针对 Playwright E2E 测试的自动生成与修复**"这一交叉点上，仍存在明显的研究空白与工程痛点：

1. **生成侧——缺乏"变更感知"**：现有 E2E 测试生成工作（如 AutoE2E、基于屏幕跳转图的生成、VISCA 等）大多"从需求或页面出发"全量生成，**没有把代码变更（diff）作为生成的触发器与约束**，导致生成盲目、与本次改动无关的用例占比高、难以精准覆盖"本次变更引入的新行为/新风险"。

2. **修复侧——E2E 层面研究稀缺**：变更感知的测试修复研究（如 UTFix、TaRGET、Fix the Tests 等）**绝大多数落点在单元测试**；而 Web/E2E 测试修复多停留在 UI 演化后的元素重匹配、异步等待修复（WEFix）或定位符自愈（self-healing），**缺乏"以 Code Diff 为线索、定向定位并修复受影响 E2E 用例"的系统方法**。

3. **生成与修复彼此割裂**：现有工作往往孤立地做"生成"或"修复"，缺乏在代码演化场景下将二者统一在同一个变更驱动闭环中的方案——即"**变更发生 → 受影响 E2E 用例定位 → 失效用例修复 + 覆盖缺口补充生成**"。

4. **意图判定缺失，误报严重**：代码变更可能是"有意的行为改变"（修 bug、加功能）而非"真回归"。若不区分变更意图，盲目修复或生成会把预期内的 UI/行为变化误报为失败。

5. **技术栈与评测基准不匹配**：直接面向 Playwright 的研究极少；缺乏针对"变更致 E2E 断裂→修复"的标准评测基准（直到 2026 年才出现 ReproBreak 这类面向 Cypress/Playwright 的定位符断裂数据集）。

### 2.3 研究意义

- **理论意义**：本课题将"代码变更影响分析（CIA）/ 回归测试选择（RTS）"与"LLM 测试生成与修复"两条技术脉络在 E2E 层面打通，提出"Code Diff → 受影响 UI 业务流 → E2E 用例生成/修复"的统一变更驱动框架，填补"Code Diff + Playwright + E2E 生成与修复"组合的研究空白。
- **工程意义**：面向 Playwright 这一主流框架，提供可嵌入 CI/CD 流水线的"变更感知"自动化方案，显著降低 E2E 测试的编写与维护成本、提升测试套件与生产代码的同步性，对工业实践具有直接落地价值。

---

## 三、国内外研究现状

围绕本课题的三个要素——**Code Diff 变更感知**、**E2E / Web / Playwright 技术栈**、**测试生成与修复**，现将国内外研究现状归纳为五个方向。

### 3.1 变更感知（Code Diff / Commit / PR）的测试生成与修复

这是与本课题最直接相关的前沿方向。

- **变更驱动的测试生成**：*Can LLM Generate Regression Tests for Software Commits?*（2025）针对结构化输入程序，给定一次 commit/PR 变更用 LLM 生成回归测试以暴露变更引入的 bug，是"commit→回归测试生成"的直接代表作。ChaCo（*Change And Cover*, 2026）聚焦"PR 修改行中未覆盖的最后一公里回归缺口"，精准定向变更行生成补充测试。*PR-Aware Automated Unit Test Generation*（2026）系统评估了 PR 粒度测试生成的可行性与差距。Meta 的 *Just-in-Time Catching Test Generation*（2026）以"应在代码合入前暴露 bug"为目标，发现变更感知方法比 hardening 测试提升候选捕获约 4 倍。
- **变更后的测试修复/更新**：UTFix（*Change Aware Unit Test Repairing using LLM*, OOPSLA 2025）是与本课题方法范式最贴近的工作，当焦点方法变更后借助静态/动态切片与失败上下文修复单测，解决断言失败与覆盖率下降两类问题。TaRGET（IEEE TSE 2025）将测试修复建模为"语言翻译"并构建 TaRBench 大规模基准。*Unit Test Update*（ASE 2025）同时覆盖"修复失效测试"与"增强测试验证新功能"双场景。*Fix the Tests*（ISSRE 2024）用静态收集器+神经重排序器修复因代码未同步而过时的测试。
- **变更意图判定**：Testora（2025）首次将"变更意图（自然语言）"与"行为差异"对比来区分"有意改动 vs 真回归"，避免误报。

### 3.2 E2E / Web GUI 测试自动生成

- AutoE2E（*Feature-Driven End-to-End Test Generation*, ICSE 2025）用 LLM 推断 Web 功能特性并生成语义连贯、可执行的 E2E 用例，并提出 E2EBench 基准（功能覆盖率均值 79%），是 E2E 生成的代表作。
- *Automated Web Application Testing with Screen Transition Graphs*（2025）用"屏幕跳转图 + LLM"建模导航与复杂表单交互。VISCA（2025）将网页转为层次化语义组件抽象，为 LLM 提供更优页面上下文。GenIA-E2ETest（SBES 2025）从自然语言描述生成可执行 E2E 脚本。Scenario-Guided GUI Testing（ACM TOSEM 2025）以业务场景引导生成贴近真实用户流程的序列。

### 3.3 E2E / Web 测试修复与稳定性（代码/UI 演化后）

- *Practical Limits of Autonomous Test Repair*（2026）是与本课题**技术栈高度一致**的工业案例：基于 LLM + LangGraph 编排 + **Playwright** 执行 + RAG 知识库的多智能体自治 UI 测试系统，应作为头号对标/基线。
- Semantic Test Repair for Web Applications（ESEC/FSE 2023）面向 Web 演化致脚本断裂做语义修复；WEFix（WWW 2024）针对 UI 异步致 flaky 自动生成等待修复（正确率 98%）；*Time-based Repair*（2023）做异步等待 flaky 的时间修复；*Understanding & Enhancing Attribute Prioritization in Fixing Web UI Tests*（ICST 2025）用元素匹配+ChatGPT 修复并以解释一致性校验抑制幻觉。
- *Towards Predicting Fragility in End-to-End Web Tests*（EASE 2024）预测 E2E 脚本脆弱性；ReproBreak（2026）构建首个面向 Cypress/Playwright 的可复现定位符断裂数据集；FlakyGuard（ASE 2025）用选择性图探索工业规模修复 flaky。

### 3.4 回归测试选择（RTS）与变更影响分析（CIA）——工程支撑

为"用 diff 精准定位受影响测试"提供方法论基础：iJaCoCo（ASE 2024）做增量覆盖率分析（提速均值 1.86×）；*More Precise RTS via Semantics-Modifying Changes*（ISSTA 2023）、*Unified Regression Testing*（ICSE 2023）、*Hybrid RTS*（ASE 2024）、*Pipeline-Aware RTS*（ICST 2025）、NameRTS（2026，首个细粒度 Python RTS）、Datalog-Based 语言无关 CIA（ICSE 2025）等，共同构成"变更→受影响测试"的选择层。

### 3.5 LLM 测试自动化基础与综述

奠基性与综述工作为本课题提供背景与方法基石：*An Empirical Evaluation of Using LLMs for Unit Test Generation*（IEEE TSE 2023）、CodaMosa（ICSE 2023）、SymPrompt/Code-Aware Prompting（FSE 2024，回归场景覆盖率提升 2×）、TestGen-LLM@Meta（FSE 2024）、SWT-Bench（NeurIPS 2024）等；综述方面有 *Software Testing With LLMs: Survey*（IEEE TSE 2023）、*A Survey on Web Testing*（2025）、*Challenges of E2E Testing with Selenium WebDriver*（ICST 2023）、自愈框架综述与 AI 辅助测试自动化灰色文献综述等。

### 3.6 存在问题（研究空白）

综合上述现状，可归纳出以下尚未解决的关键问题：

1. **"Code Diff 驱动"已成范式，但落点几乎全在单元/回归测试，E2E 层面仍是空白**。ChaCo / PR-Aware / Can-LLM-Gen-Regression / Just-in-Time@Meta 等均面向单元/回归测试。
2. **E2E 生成已可行，但与代码变更解耦**。AutoE2E / Screen Transition Graphs / VISCA / GenIA 均"从需求/页面"出发，**未以 Code Diff 为触发与约束**。
3. **E2E 修复缺乏变更线索的精准定位**。Web/E2E 修复多基于 UI 演化后的元素重匹配或异步等待修复，**未建立"diff → 受影响 E2E 用例 → 定向修复"的链路**。
4. **生成与修复未统一在变更驱动闭环中**，且缺少变更意图判定来抑制误报。
5. **直接面向 Playwright 的研究极少，评测基准刚刚出现**（ReproBreak、E2EGit、E2EBench），尚无围绕"变更致 E2E 失效"的成熟评测协议。

### 3.7 未来方向

1. 将变更影响分析/回归测试选择从代码层延伸到 **UI 业务流层**，建立"代码变更 → 受影响页面/组件/用户流"的映射。
2. 把"生成"与"修复"统一进同一个**变更驱动闭环**，并以执行反馈迭代收敛。
3. 引入**变更意图理解**区分"有意改动 vs 真回归"，实现断言/期望的智能更新而非盲目修复。
4. 面向 Playwright 等主流框架，研究可嵌入 **CI/CD** 的轻量化、低误报、可解释的端到端方案，并建设配套评测基准。

---

## 四、研究目标与研究内容

### 4.1 研究目标

面向 Web 应用持续演进场景，提出并实现一套**以 Code Diff 为驱动的 Playwright E2E 测试自动生成与修复方法与原型系统**，在代码发生变更时能够：（1）精准定位受变更影响的 E2E 测试与 UI 业务流；（2）自动修复因变更而失效（定位符断裂、断言失配、异步 flaky）的 Playwright 脚本；（3）针对变更引入的新行为/未覆盖缺口自动生成新的 E2E 用例；（4）在统一的变更驱动闭环中协同"生成 + 修复"，并以低误报、可解释、可嵌入 CI/CD 为目标。

### 4.2 研究内容

**内容一：面向 E2E 的代码变更影响分析与受影响用例定位（Diff 定位层）**
解析 commit/PR 的 Code Diff，结合前后端调用关系、路由/组件依赖与 DOM/定位符映射，建立"代码变更 → 受影响页面/组件/用户流 → 受影响 Playwright 用例集合"的映射模型，输出"需修复用例集"与"覆盖缺口集"。借鉴 RTS/CIA（iJaCoCo、语义修改推理、混合依赖、NameRTS）思想，将其从代码层扩展到 UI 业务流层。

**内容二：基于 Code Diff 的 Playwright E2E 测试自动修复（修复层）**
针对受影响且失效的用例，区分三类失效：（a）定位符断裂、（b）断言/期望失配、（c）异步时序 flaky。借鉴 UTFix 的"切片+失败上下文"、Fix the Tests 的"静态收集+重排序"、WEFix 的"显式等待生成"、以及 Practical Limits 的"LLM+Playwright+RAG"自治修复范式，设计变更上下文增强的 LLM 修复流水线，并以解释一致性校验抑制幻觉。

**内容三：变更意图判定与断言/期望的智能更新（意图层）**
借鉴 Testora，从 commit message、PR 描述、diff 语义中抽取"变更意图"，判定 UI/行为变化是"有意改动"还是"真回归"，据此决定是"更新断言/期望以适配新行为"还是"修复脚本以恢复旧行为或如实报告回归"，从而降低误报。

**内容四：基于 Code Diff 的 E2E 用例补充生成（生成层）**
针对"覆盖缺口集"（变更引入但无对应 E2E 覆盖的新功能/新路径），借鉴 AutoE2E 的特性驱动、SymPrompt 的覆盖率导向多阶段提示、VISCA 的页面语义抽象，以 diff 为约束生成语义连贯、可执行的 Playwright 用例，并通过执行反馈迭代收敛（参考 TestWeaver 的反馈驱动思路）。

**内容五：变更驱动的"生成+修复"统一闭环与 CI/CD 集成（系统层）**
将上述各层编排为统一闭环：`变更检测 → Diff 定位 → 意图判定 → (修复失效用例 + 生成补充用例) → Playwright 执行验证 → 反馈迭代`，并封装为可在 CI/CD（如 GitHub Actions）中触发的工具原型。

**内容六：实验评测与基准建设（评测层）**
在 ReproBreak、E2EGit、E2EBench 等公开资源基础上，结合自建的"变更致 E2E 失效"评测集，系统评估修复成功率、生成用例的功能覆盖率与变更相关性、误报率、与基线（Practical Limits、AutoE2E、WEFix、通用 self-healing）的对比及 CI 开销。

---

## 五、研究方案与技术路线

### 5.1 总体技术路线

整体采用"**Diff 定位 → 意图判定 → 生成/修复 → 执行验证 → 反馈迭代**"的变更驱动闭环架构：

```text
┌──────────────────────────────────────────────────────────────────┐
│                     变更驱动闭环（Change-Driven Loop）              │
│                                                                    │
│  Code Diff (commit/PR)                                             │
│        │                                                           │
│        ▼                                                           │
│  ① Diff 定位层：代码变更影响分析 + UI 业务流映射                     │
│     （RTS/CIA 思想 → 受影响 Playwright 用例集 + 覆盖缺口集）          │
│        │                                                           │
│        ▼                                                           │
│  ② 意图层：变更意图判定（有意改动 vs 真回归）                        │
│        │                                                           │
│    ┌───┴─────────────────┐                                         │
│    ▼                     ▼                                         │
│  ③ 修复层               ④ 生成层                                    │
│  （失效用例：定位符/      （覆盖缺口：以 diff 为约束的               │
│    断言/异步修复）          E2E 用例生成）                           │
│    └───┬─────────────────┘                                         │
│        ▼                                                           │
│  ⑤ Playwright 执行验证（断言/截图/trace）                           │
│        │                                                           │
│        ▼  通过？──否──▶ 反馈上下文增强，迭代回到 ③/④                  │
│       是                                                           │
│        ▼                                                           │
│  产出：修复后脚本 + 新增用例 + 变更测试报告（可解释）                 │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 关键技术方案

1. **Diff 定位层**：以 AST/语法 diff 解析变更，结合前端路由表、组件依赖图与"代码符号 ↔ DOM/locator"映射，构建受影响用户流图；用 RTS 的依赖推理（语义修改推理、文件+方法混合依赖）裁剪测试集，用增量覆盖率（iJaCoCo 思想）评估缺口。
2. **修复层**：以"焦点变更切片 + 失败堆栈/trace + 页面快照"构造增强上下文喂给 LLM（借鉴 UTFix / Fix the Tests）；定位符断裂用多属性优先级匹配（借鉴 Web UI 修复工作）+ LLM 重写；异步 flaky 用显式等待生成（WEFix 思想）；用解释一致性校验与执行验证抑制幻觉。
3. **意图层**：从 commit/PR 文本与 diff 语义构造意图表示，用 LLM 判定行为差异类别（有意 vs 回归），驱动"更新断言"或"修复脚本/报告回归"的分支决策（Testora 思想）。
4. **生成层**：以变更涉及的功能特性/页面为种子，采用覆盖率导向的多阶段提示（SymPrompt）+ 页面语义抽象（VISCA）+ 特性驱动（AutoE2E）生成 Playwright 用例，执行反馈驱动迭代（TestWeaver）。
5. **系统与集成**：用智能体编排（参考 LangGraph + Playwright + RAG 的 Practical Limits 架构）封装闭环，提供 CI/CD 触发钩子。

### 5.3 实验设计

- **数据集/基准**：ReproBreak（Playwright/Cypress 定位符断裂）、E2EGit（开源 E2E web 测试数据集）、E2EBench（功能覆盖率），辅以从开源仓库挖掘的"变更-失效-修复"真实样本自建评测集。
- **基线方法**：Practical Limits（LLM+LangGraph+Playwright+RAG）、AutoE2E（生成）、WEFix / Semantic Test Repair / 通用 self-healing（修复）、SymPrompt（回归生成）。
- **评测指标**：修复成功率/精确匹配率、生成用例功能覆盖率与"变更相关性"、误报率（FP rate）、flaky 抑制率、端到端通过率、CI 时间/算力开销、可解释性（人工评估）。
- **研究问题（RQ）**：RQ1 Diff 定位的精确率/召回率？RQ2 修复成功率与对基线的提升？RQ3 变更意图判定对误报的抑制效果？RQ4 生成用例的变更相关性与覆盖？RQ5 端到端闭环在 CI 中的开销与实用性？

---

## 六、创新点分析

1. **首个"Code Diff 驱动的 Playwright E2E 生成与修复"统一框架**。现有变更感知工作几乎全部落点单元/回归测试，E2E 生成又与 diff 解耦；本课题首次把"代码变更 → 受影响 UI 业务流 → E2E 用例生成/修复"在 Playwright 技术栈上打通，填补明确的研究空白。
2. **将 RTS/CIA 从代码层扩展到 UI 业务流层的"受影响 E2E 用例定位"模型**。提出"代码符号 ↔ 路由/组件 ↔ DOM/locator ↔ 用户流 ↔ Playwright 用例"的多级映射，实现 diff 到 E2E 用例的精准定位与覆盖缺口识别。
3. **"生成 + 修复"协同的变更驱动闭环**。不同于孤立的生成或修复，本课题在同一闭环中以执行反馈协同二者，对失效用例修复、对缺口用例生成，统一收敛。
4. **引入变更意图判定以降低误报**。把"有意改动 vs 真回归"的判定嵌入 E2E 测试演化，驱动断言/期望的智能更新，显著抑制把预期内 UI 变化误报为失败的问题。
5. **面向 CI/CD 的可解释、低误报工程化方案与配套评测协议**，并基于 ReproBreak/E2EGit/E2EBench 构建"变更致 E2E 失效→生成/修复"的评测基准与协议。

---

## 七、可行性分析

### 7.1 理论可行性
课题所依赖的三条技术脉络——RTS/CIA、LLM 测试生成、LLM 测试修复——均有成熟理论与代表性工作（如 UTFix、SymPrompt、AutoE2E、WEFix、iJaCoCo、Testora），为各功能层提供了可借鉴、可迁移的方法范式；将其在 E2E 层组合的思路在逻辑上自洽且有空白可填。

### 7.2 技术可行性
- **技术栈成熟**：Playwright 提供稳定的脚本执行、trace、截图与定位 API；LLM（GPT-4 系列/开源代码模型）在代码理解与生成上已被大量验证；LangGraph + RAG 的智能体编排已有 Practical Limits 等工业案例佐证可行。
- **关键能力可得**：AST/语法 diff、调用图/依赖分析、增量覆盖率（iJaCoCo）等工具链开源可用。

### 7.3 数据与评测可行性
ReproBreak（359 项目定位符断裂）、E2EGit（开源 E2E 测试数据集）、E2EBench（功能覆盖率基准）等公开资源已经具备，且本课题已系统调研并下载 61/66 篇相关文献（含核心对标工作全文），可支撑对标实验与基准构建。

### 7.4 工作量与条件可行性
课题已完成系统性文献调研（66 篇，按 A/B/C 三类分级，含完整下载链接与全文），明确了核心对标与空白点；研究内容按"层"解耦，可分阶段递进实现，单个研究生在学位论文周期内可完成原型实现与实验评估。

### 7.5 风险与应对
- **LLM 幻觉/不稳定** → 以执行验证 + 解释一致性校验 + 反馈迭代约束；
- **Diff→UI 映射不准** → 多级映射 + RTS 安全性兜底（必要时回退 retest-all 子集）；
- **付费墙/数据缺失** → 已确认 5 篇待手动获取文献有开放替代源，核心数据集均开放；
- **评测基准不足** → 在公开基准之外自建"变更-失效-修复"样本集补充。

---

## 八、研究计划与进度计划

| 阶段 | 时间 | 主要任务 | 阶段成果 |
|------|------|----------|----------|
| 第一阶段 | 第 1–2 月 | 文献精读与对标（UTFix、AutoE2E、Practical Limits、WEFix、SymPrompt 等），确定方法框架与评测协议 | 开题报告、文献综述、技术方案初稿 |
| 第二阶段 | 第 3–4 月 | 实现内容一：Diff 定位层（变更解析 + UI 业务流映射 + 受影响用例/缺口识别） | Diff 定位原型 + 定位精度初步实验 |
| 第三阶段 | 第 5–7 月 | 实现内容二、三：修复层（定位符/断言/异步）+ 意图判定层 | E2E 自动修复模块 + 误报抑制实验 |
| 第四阶段 | 第 8–9 月 | 实现内容四：生成层（变更约束下的 E2E 用例生成 + 反馈迭代） | E2E 生成模块 + 覆盖/相关性实验 |
| 第五阶段 | 第 10–11 月 | 实现内容五、六：统一闭环 + CI/CD 集成 + 系统性实验评测（对比基线、消融、开销） | 完整原型系统 + 全面实验结果 |
| 第六阶段 | 第 12–14 月 | 撰写学位论文、投稿论文、整理开源代码与数据 | 学位论文 + 投稿稿 + 开源仓库 |

---

## 九、预期成果

1. **方法与系统**：提出"Code Diff 驱动的 Playwright E2E 测试自动生成与修复"统一框架，并实现可嵌入 CI/CD 的原型系统。
2. **学位论文**：完成一篇系统阐述上述方法、实现与评测的硕士学位论文。
3. **学术论文**：争取在软件工程领域会议/期刊（如 ICST、ICSME、ASE/ISSTA workshop 或相关期刊）发表 1 篇研究论文。
4. **评测基准与开源**：构建"变更致 E2E 失效→生成/修复"评测集与协议，开源原型工具与实验复现包（replication package）。
5. **实验结论**：给出本方法在修复成功率、生成用例变更相关性与覆盖率、误报抑制、CI 开销等指标上相较现有基线的量化提升。

---

## 十、参考文献

### A 类：核心文献（直接对标）

[1] UTFix: Change Aware Unit Test Repairing using LLM. Proc. ACM Program. Lang. (OOPSLA), 2025. https://arxiv.org/abs/2503.14924

[2] Code-Aware Prompting (SymPrompt): Coverage-Guided Test Generation in Regression Setting using LLM. Proc. ACM Softw. Eng. (FSE), 2024. https://arxiv.org/abs/2402.00097

[3] Can LLM Generate Regression Tests for Software Commits? arXiv:2501.11086, 2025. https://arxiv.org/abs/2501.11086

[4] Testora: Using Natural Language Intent to Detect Behavioral Regressions. arXiv:2503.18597, 2025. https://arxiv.org/abs/2503.18597

[5] AI for Context-Aware Visual Change Detection in Software Test Automation. Progress in Artificial Intelligence, 2024. https://arxiv.org/abs/2405.00874

[6] Feature-Driven End-to-End Test Generation (AutoE2E). ICSE, 2025. https://arxiv.org/abs/2408.01894

[7] Automated Web Application Testing: E2E Test Case Generation with LLMs and Screen Transition Graphs. arXiv:2506.02529, 2025. https://arxiv.org/abs/2506.02529

[8] Scenario-Guided LLM-based Mobile App GUI Testing. ACM TOSEM, 2025. https://arxiv.org/abs/2506.05079

[9] GenIA-E2ETest: A Generative AI-Based Approach for End-to-End Test Automation. SBES, 2025. https://arxiv.org/abs/2510.01024

[10] Practical Limits of Autonomous Test Repair: A Multi-Agent Case Study (LLM + LangGraph + Playwright). arXiv:2605.01471, 2026. https://arxiv.org/abs/2605.01471

[11] Automated Test Case Repair Using Language Models (TaRGET). IEEE Transactions on Software Engineering, 2025. https://arxiv.org/abs/2401.06765

[12] Semantic Test Repair for Web Applications. ESEC/FSE, 2023. https://doi.org/10.1145/3611643.3616324

[13] WEFix: Automatic Generation of Explicit Waits for Web E2E Flaky Tests. The Web Conf (WWW), 2024. https://arxiv.org/abs/2402.09745

[14] Fix the Tests: Augmenting LLMs to Repair Test Cases with Static Collector and Neural Reranker. ISSRE, 2024. https://arxiv.org/abs/2407.03625

[15] Unit Test Update through LLM-Driven Context Collection and Error-Type-Aware Refinement. ASE, 2025. https://arxiv.org/abs/2509.24419

[16] Understanding & Enhancing Attribute Prioritization in Fixing Web UI Tests with LLMs (Guiding ChatGPT to Fix Web UI Tests). ICST, 2025. https://arxiv.org/abs/2312.05778

[17] Time-based Repair for Asynchronous Wait Flaky Tests in Web Testing. arXiv:2305.08592, 2023. https://arxiv.org/abs/2305.08592

[18] Towards Predicting Fragility in End-to-End Web Tests. EASE, 2024. https://doi.org/10.1145/3661167.3661179

### B 类：支撑文献（方法论与背景）

[19] Efficient Incremental Code Coverage Analysis for Regression Test Suites (iJaCoCo). ASE, 2024. https://arxiv.org/abs/2410.21798

[20] More Precise Regression Test Selection via Reasoning about Semantics-Modifying Changes. ISSTA, 2023. https://doi.org/10.1145/3597926.3598086

[21] Test Selection for Unified Regression Testing. ICSE, 2023. https://doi.org/10.1109/ICSE48619.2023.00145

[22] Change Impact Analysis in Microservice Systems: A Systematic Literature Review. Journal of Systems and Software, 2024. https://doi.org/10.1016/j.jss.2024.112241

[23] Datalog-Based Language-Agnostic Change Impact Analysis for Microservices. ICSE, 2025. https://doi.org/10.1109/ICSE55347.2025.00115

[24] Hybrid Regression Test Selection by Integrating File and Method Dependences. ASE, 2024. https://doi.org/10.1145/3691620.3695525

[25] Practical Pipeline-Aware Regression Test Optimization for CI. ICST, 2025. https://arxiv.org/abs/2501.11550

[26] Regression Test Selection in Test-Driven Development. Automated Software Engineering, 2023. https://doi.org/10.1007/s10515-023-00405-w

[27] An Empirical Evaluation of Using LLMs for Automated Unit Test Generation. IEEE Transactions on Software Engineering, 2023. https://arxiv.org/abs/2302.06527

[28] CodaMosa: Escaping Coverage Plateaus in Test Generation with Pre-trained LLMs. ICSE, 2023. https://doi.org/10.1109/ICSE48619.2023.00085

[29] ChatUniTest: A Framework for LLM-Based Test Generation. FSE Companion, 2023. https://arxiv.org/abs/2305.04764

[30] Effective Test Generation Using Pre-trained LLMs and Mutation Testing. Information and Software Technology, 2023. https://arxiv.org/abs/2308.16557

[31] ChatGPT vs SBST: A Comparative Assessment of Unit Test Suite Generation. IEEE Transactions on Software Engineering, 2023. https://arxiv.org/abs/2307.00588

[32] CAT-LM: Training Language Models on Aligned Code And Tests. ASE, 2023. https://arxiv.org/abs/2310.01602

[33] SWT-Bench: Testing and Validating Real-World Bug-Fixes with Code Agents. NeurIPS, 2024. https://arxiv.org/abs/2406.12952

[34] Automated Unit Test Improvement using LLMs at Meta (TestGen-LLM). FSE Companion, 2024. https://arxiv.org/abs/2402.09171

[35] LLM for Test Script Generation and Migration: Challenges, Capabilities, and Opportunities. QRS, 2023. https://arxiv.org/abs/2309.13574

[36] GAMMA: Revisiting Template-Based APR via Mask Prediction. ASE, 2023. https://arxiv.org/abs/2309.09308

[37] FlakyFix: LLMs for Predicting Flaky Test Fix Categories and Test Code Repair. IEEE Transactions on Software Engineering, 2024. https://arxiv.org/abs/2307.00012

[38] StubCoder: Automated Generation and Repair of Stub Code for Mock Objects. ACM TOSEM, 2023. https://arxiv.org/abs/2307.14733

[39] Effortless Test Maintenance: A Critical Review of Self-Healing Frameworks. IJRASET, 2023. https://doi.org/10.22214/ijraset.2023.56048

[40] A Multi-Year Grey Literature Review on AI-assisted Test Automation. Information and Software Technology, 2024. https://arxiv.org/abs/2408.06224

[41] Exploring the Integration of LLMs in Industrial Test Maintenance Processes. arXiv:2409.06416, 2024. https://arxiv.org/abs/2409.06416

[42] Software Testing With Large Language Models: Survey, Landscape, and Vision. IEEE Transactions on Software Engineering, 2023. https://arxiv.org/abs/2307.07221

[43] A Survey on Web Testing: On the Rise of AI and Applications in Industry. arXiv:2503.05378, 2025. https://arxiv.org/abs/2503.05378

[44] Challenges of End-to-End Testing with Selenium WebDriver and How to Face Them: A Survey. ICST, 2023. https://doi.org/10.1109/ICST57152.2023.00039

[45] Vision-Based Mobile App GUI Testing: A Survey. ACM Computing Surveys, 2023. https://arxiv.org/abs/2310.13518

[46] A Comprehensive Survey of AI-Driven Advancements in Automated Program Repair and Code Generation. arXiv:2411.07586, 2024. https://arxiv.org/abs/2411.07586

[47] Observation-Based Unit Test Generation at Meta (TestGen). FSE Companion, 2024. https://arxiv.org/abs/2402.06111

[48] E2EGit: A Dataset of End-to-End Web Tests in Open Source Projects. MSR, 2025. https://doi.org/10.1109/MSR66628.2025.00121

### C 类：最新前沿（2025–2026）

[49] Change And Cover (ChaCo): Last-Mile, Pull Request-Based Regression Test Augmentation. arXiv:2601.10942, 2026. https://arxiv.org/abs/2601.10942

[50] PR-Aware Automated Unit Test Generation: Challenges and Opportunities. arXiv:2605.25285, 2026. https://arxiv.org/abs/2605.25285

[51] Just-in-Time Catching Test Generation at Meta. arXiv:2601.22832, 2026. https://arxiv.org/abs/2601.22832

[52] TestWeaver: Execution-aware, Feedback-driven Regression Testing Generation with LLMs. arXiv:2508.01255, 2025. https://arxiv.org/abs/2508.01255

[53] Evaluating LLM-Based Test Generation Under Software Evolution. arXiv:2603.23443, 2026. https://arxiv.org/abs/2603.23443

[54] Code-A1: Adversarial Evolving of Code LLM and Test LLM via RL. arXiv:2603.15611, 2026. https://arxiv.org/abs/2603.15611

[55] ReproBreak: A Dataset of Reproducible Web Locator Breaks. arXiv:2605.12158, 2026. https://arxiv.org/abs/2605.12158

[56] FlakyGuard: Automatically Fixing Flaky Tests at Industry Scale. ASE, 2025. https://arxiv.org/abs/2511.14002

[57] YATE: The Role of Test Repair in LLM-Based Unit Test Generation. arXiv:2507.18316, 2025. https://arxiv.org/abs/2507.18316

[58] Hierarchical Knowledge Injection for Improving LLM-based Program Repair. ASE, 2025. https://arxiv.org/abs/2506.24015

[59] VISCA: Inferring Component Abstractions for Automated End-to-End Testing. arXiv:2506.04161, 2025. https://arxiv.org/abs/2506.04161

[60] ViMoTest: Specify ViewModel-Based GUI Test Scenarios using Projectional Editing. ICSCT, 2025. https://arxiv.org/abs/2504.16753

[61] Automated Functional Testing for Malleable Mobile Application Driven from User Intent. arXiv:2604.02079, 2026. https://arxiv.org/abs/2604.02079

[62] Android Instrumentation Testing in CI: Practices, Patterns, and Performance. arXiv:2604.03438, 2026. https://arxiv.org/abs/2604.03438

[63] Do Autonomous Agents Contribute Test Code? A Study of Tests in Agentic Pull Requests. arXiv:2601.03556, 2026. https://arxiv.org/abs/2601.03556

[64] Names Are All You Need (NameRTS): Effective and Safe Regression Test Selection for Python. arXiv:2605.25356, 2026. https://arxiv.org/abs/2605.25356

[65] Formalizing Regression Testing for Agile and CI Environments. arXiv:2511.02810, 2025. https://arxiv.org/abs/2511.02810

[66] Understanding Automated Program Repair Agents Through the Lens of Traceability: An Empirical Study. arXiv:2506.08311, 2025. https://arxiv.org/abs/2506.08311

---

> 注：引用数与发表 venue 为 Semantic Scholar 口径（截至 2026 年 6 月），部分 2026 年文献仍处预印本阶段。文献全文与下载链接详见配套文件《文献来源与下载链接总表.md》与《文献分类整理_CodeDiff_Playwright_E2E.md》。
