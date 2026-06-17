# 硕士学位论文开题报告（聚焦版：以修复为实验重心）

> 说明：本版在原《基于 Code Diff 的 Playwright E2E 测试自动生成与修复方法研究》综合版开题基础上，结合"学术型硕士 / 约 1 年研究周期 / 仅依赖开源数据"的实际约束，**保留"生成与修复"完整框架，但将实验重心收敛到"修复"主线，"生成"作为次要贡献与小规模验证**。原综合版开题报告保留备查。

---

## 一、课题名称（论文题目）

**基于 Code Diff 的 Playwright 端到端（E2E）测试自动生成与修复方法研究（以修复为实验重心）**

英文题目：*Code Diff-Driven Automatic Generation and Repair of Playwright End-to-End Tests*

---

## 二、研究背景与意义（问题提出）

### 2.1 研究背景

现代 Web 应用在敏捷开发与持续集成/持续交付（CI/CD）下高频演进，代码以小颗粒度的提交（commit）与合并请求（PR）持续变化。端到端（E2E）测试通过模拟真实用户在浏览器中的完整业务流程来保障 Web 应用质量，Playwright 已成为主流的跨浏览器 E2E 测试框架。

然而，E2E 测试是软件测试中**编写成本最高、维护负担最重、稳定性最差**的一类：测试脚本通过定位符（locator：ID、CSS 选择器、XPath）与页面元素交互，一旦应用发生结构性代码变更（重命名元素、重构 DOM、调整组件层级），即使功能未变，定位符也会失效，导致测试断裂（locator break）。已有研究表明：传统定位符可导致多达 75% 的 Selenium 测试文件每 9 次提交就需变更；在 453 个 Web 应用版本的 1065 次测试断裂中，脆弱定位符引发了 73.6% 的失败；Meta 亦披露 14%–22% 的软件失效源于过时测试。手工修复与补写这些用例成本高、滞后于生产代码演进。

大语言模型（LLM）在代码理解与生成上的突破，为自动化测试生成与修复提供了新手段，并催生了"基于代码变更（Code Diff / Commit / PR）感知"的测试演化这一前沿方向。

### 2.2 问题提出

在"**面向 Web 应用、以 Code Diff 为触发与约束、针对 Playwright E2E 测试的自动生成与修复**"这一交叉点上，仍存在明显空白与痛点：

1. **变更感知的测试修复研究绝大多数落点在单元测试**（如 UTFix、TaRGET、Fix the Tests），E2E 层面缺乏"以引发失效的 Code Diff 为线索定向定位并修复失效用例"的系统方法。
2. **Web/E2E 修复多停留在 UI 演化后的元素重匹配或异步等待修复**（如 Semantic Test Repair、WEFix、Web UI Tests 修复），**未把引发断裂的源码变更（diff）显式作为修复上下文**，导致修复缺乏因果线索、易产生幻觉。
3. **E2E 生成与代码变更解耦**：现有 E2E 生成（AutoE2E、屏幕跳转图、VISCA）多"从需求/页面出发"全量生成，**未以 diff 为触发与约束**来补充"本次变更引入但尚无覆盖"的用例。
4. **缺乏对"有意改动 vs 真回归"的区分**：盲目修复/生成会把预期内的 UI 变化误报或误修，造成高误报。
5. **直接面向 Playwright 的研究极少，评测基准刚出现**：直到 2026 年才有 ReproBreak 这类面向 Cypress/Playwright 的可复现定位符断裂数据集。

### 2.3 研究意义

- **理论意义**：将"代码变更影响分析（CIA）"思想与"LLM 测试生成与修复"在 E2E 层打通，提出以"引发失效/变更的 Code Diff + 失败 trace + 页面快照"为统一上下文的修复（与变更约束下的补充生成）方法，并引入变更意图判定降低误报，填补"Code Diff + Playwright + E2E 生成与修复"的空白。
- **工程意义**：面向 Playwright 主流框架，提供可嵌入 CI/CD、低误报、可解释的 E2E 自动修复与按需补充生成方案，直接降低 E2E 测试维护成本，提升测试套件与生产代码的同步性。

---

## 三、国内外研究现状

围绕**Code Diff 变更感知**、**E2E / Web / Playwright 技术栈**、**测试生成与修复**三要素，归纳如下。

### 3.1 变更感知（Code Diff / Commit / PR）的测试生成与修复

UTFix（OOPSLA 2025）是与本课题方法范式最贴近的工作：焦点方法变更后借助静态/动态切片与失败上下文用 LLM 修复单测。TaRGET（IEEE TSE 2025）将测试修复建模为"语言翻译"并构建 TaRBench。*Unit Test Update*（ASE 2025）同时覆盖"修复失效测试"与"增强测试"双场景。*Fix the Tests*（ISSRE 2024）用静态收集器+神经重排序修复过时测试。变更驱动生成方面，*Can LLM Generate Regression Tests for Software Commits?*（2025）、ChaCo（2026）确立了"PR/commit 变更行→定向生成测试"的范式。Testora（2025）首次以"变更意图"区分"有意改动 vs 真回归"。但上述工作**几乎全部面向单元/回归测试**。

### 3.2 E2E / Web 测试修复与稳定性（与本课题直接相关）

*Practical Limits of Autonomous Test Repair*（2026）是与本课题**技术栈最一致**的工业案例：LLM + LangGraph + **Playwright** + RAG 的多智能体自治 UI 测试修复，是头号对标。Semantic Test Repair for Web Applications（ESEC/FSE 2023）面向 Web 演化致脚本断裂做语义修复；WEFix（WWW 2024）针对 UI 异步致 flaky 自动生成等待修复（正确率 98%）；*Time-based Repair*（2023）做异步等待 flaky 时间修复；*Understanding & Enhancing Attribute Prioritization in Fixing Web UI Tests*（ICST 2025）用元素匹配 + ChatGPT 修复并以解释一致性校验抑制幻觉；*Towards Predicting Fragility in E2E Web Tests*（EASE 2024）预测脚本脆弱性；FlakyGuard（ASE 2025）工业规模修复 flaky。这些工作**未把引发断裂的源码 diff 显式作为修复输入**。

### 3.3 E2E / Web 测试自动生成

AutoE2E（ICSE 2025）用 LLM 推断 Web 功能特性生成语义连贯的 E2E 用例并提出 E2EBench；*Screen Transition Graphs*（2025）用屏幕跳转图 + LLM 建模导航与表单；VISCA（2025）将网页转为层次化语义组件抽象优化 LLM 上下文；GenIA-E2ETest（SBES 2025）从自然语言生成可执行 E2E 脚本。这些工作均"从需求/页面"出发，**未以 Code Diff 为触发与约束**。

### 3.4 评测资源（开源数据可得性，已核实）

- **ReproBreak（2026）**：分析 359 个开源仓库识别含定位符变更的 commit，在变更最多的 4 个项目上复现 **449 个可复现 locator break**，附自动复现脚本，开源（github.com/rub-sq/ReproBreak）。明确区分 structural change（致断裂）与 logical change，断裂与 commit 绑定，是本课题**修复主实验的核心评测基准**。
- **E2EGit（MSR 2025）**：472 个真实 GitHub 仓库、43,670 个 Web GUI 测试（Selenium/Playwright/Cypress/Puppeteer），是真实 Playwright 项目语料库，用于挖掘补充样本、支撑生成实验与提升外部有效性。
- 其余可借鉴：E2EBench（功能覆盖率基准，支撑生成评测）、TaRBench（修复基准）。

### 3.5 LLM 测试方法基础与综述

GAMMA（ASE 2023）、FlakyFix（IEEE TSE 2024）、Hierarchical Knowledge Injection（ASE 2025）等提供修复范式；SymPrompt（FSE 2024，覆盖率导向多阶段提示）为变更约束下的生成提供策略；综述有 *Software Testing With LLMs: Survey*（IEEE TSE 2023）、*A Survey on Web Testing*（2025）、*Challenges of E2E Testing with Selenium WebDriver*（ICST 2023）等。

### 3.6 存在问题（研究空白）

1. 变更感知生成/修复**落点几乎全在单元/回归测试，E2E 层空白**。
2. Web/E2E 修复**未将引发断裂的 Code Diff 显式作为修复上下文**，缺乏因果线索、易幻觉。
3. E2E 生成**与代码变更解耦**，无法定向补充变更引入的覆盖缺口。
4. **缺少"有意改动 vs 真回归"判定**，误报高。
5. **直接面向 Playwright 的方法与评测协议稀缺**。

### 3.7 未来方向

1. 把"引发失效/变更的代码变更"作为 E2E 修复与生成的一等上下文与触发器。
2. 引入变更意图理解，区分"更新断言以适配新行为"与"修复脚本以恢复旧行为/如实报告回归"。
3. 面向 Playwright 等主流框架，研究可嵌入 CI/CD 的低误报、可解释的修复与按需生成方案及评测协议。

---

## 四、研究目标与研究内容

### 4.1 研究目标

面向 Web 应用演化场景，提出并实现一套**以 Code Diff 为驱动的 Playwright E2E 测试自动生成与修复方法与原型工具**：当代码变更导致 E2E 用例失效或产生未覆盖的新行为时，能够（1）定位失效用例并提取引发失效的代码变更上下文；（2）自动修复定位符断裂与断言失配（异步 flaky 为选做扩展）；（3）以 diff 为约束补充生成覆盖变更新行为的 E2E 用例；（4）通过变更意图判定区分"有意改动 vs 真回归"以降低误报；（5）以可解释、可嵌入 CI/CD 为目标。**其中（2）（4）为实验重心，（3）为次要贡献与小规模验证。**

### 4.2 研究内容

**内容一：变更感知的失效定位与修复上下文构造（核心）**
解析 commit/PR 的 Code Diff，结合失败 trace、报错堆栈、失效时刻的 DOM 快照与新旧定位符，提取"引发该 E2E 失效的最小变更上下文"（借鉴 UTFix 的切片思想与 Fix the Tests 的静态收集），形成喂给 LLM 的结构化修复上下文。**这是本课题方法核心与最大工程难点。**

**内容二：LLM 驱动的 Playwright E2E 修复（实验重心）**
将失效分为两类——（a）定位符断裂、（b）断言/期望失配（（c）异步时序 flaky 为选做扩展）。对（a）采用"多属性优先级匹配 + LLM 重写定位符"（优先生成 Playwright 语义定位 getByRole/getByText 等）；对（b）结合变更语义生成新的断言/期望；统一以解释一致性校验 + Playwright 实际执行验证抑制幻觉，并以执行反馈迭代修复。

**内容三：变更意图判定与误报抑制（核心差异化）**
从 commit message、PR 描述与 diff 语义抽取"变更意图"，判定 UI/行为变化属于"有意改动"还是"真回归"（借鉴 Testora），据此决定"更新断言适配新行为""修复脚本恢复旧行为"或"如实报告回归"，显著降低误报。**这是区别于通用 self-healing 的核心差异化创新。**

**内容四：基于 Code Diff 约束的 E2E 用例补充生成（次要贡献）**
针对变更引入但尚无 E2E 覆盖的新行为/新路径，以 diff 涉及的功能特性/页面为种子，借鉴 AutoE2E 的特性驱动、SymPrompt 的覆盖率导向多阶段提示、VISCA 的页面语义抽象，生成语义连贯、可执行的 Playwright 用例，并通过执行反馈迭代收敛。**作为"变更驱动闭环"的补全环节，实验规模相对修复主线更小，重在验证"以 diff 为约束相较无约束生成"的相关性与有效性提升。**

> 总体形成"**变更发生 → 失效定位与上下文构造 → 意图判定 → (修复失效用例 + 按需补充生成) → Playwright 执行验证 → 反馈迭代**"的变更驱动闭环；其中修复（内容一/二/三）为深度做透的实验重心，生成（内容四）为完整闭环的补全与小规模验证。

---

## 五、研究方案与技术路线

### 5.1 总体技术路线

```text
┌────────────────────────────────────────────────────────────────────┐
│  Code Diff (commit/PR)  +  失效的 Playwright 用例 / 变更引入的新行为   │
│        │                                                             │
│        ▼                                                             │
│  ① 失效定位 & 修复上下文构造                                          │
│     （diff 切片 + 失败 trace + DOM 快照 + 新旧 locator）              │
│        │                                                             │
│        ▼                                                             │
│  ② 变更意图判定（有意改动 vs 真回归）                                 │
│        │                                                             │
│    ┌───┴───────────────┬────────────────────┐                       │
│    ▼                   ▼                     ▼                       │
│  更新断言/期望      修复脚本（locator/断言）   补充生成（缺口用例）      │
│  └────────┬──────────────────────┬──────────────┘                   │
│           ▼ （实验重心：修复）      ▼ （次要：生成）                    │
│  ③ Playwright 执行验证 + 解释一致性校验                               │
│           │  通过？──否──▶ 反馈上下文增强，迭代                         │
│          是                                                          │
│           ▼                                                          │
│   产出：修复后脚本 + 新增用例 + 可解释报告                             │
└────────────────────────────────────────────────────────────────────┘
```

### 5.2 关键技术方案

1. **修复上下文构造**：用 git diff/AST diff 提取变更，关联失败 trace 与失效时刻 DOM；对定位符断裂，提取"旧定位符目标元素在新 DOM 中的候选"特征。
2. **定位符修复**：多属性（id/class/text/role/层级）优先级匹配候选元素 + LLM 重写为稳健语义定位。
3. **断言修复**：结合变更意图与新页面状态更新期望值/断言。
4. **意图判定**：LLM 基于 commit/PR 文本与 diff 语义分类，驱动"更新 / 修复 / 报告回归"分支。
5. **补充生成**：以 diff 约束的覆盖率导向提示 + 页面语义抽象生成 Playwright 用例。
6. **幻觉抑制**：解释一致性校验 + Playwright 真实执行验证 + 迭代反馈。

### 5.3 实验设计

- **数据集**：ReproBreak（449 个可复现 locator break，**修复主基准**）+ 从 E2EGit 真实 Playwright 项目挖掘的"commit→E2E 失效→人工核对修复"样本（外部有效性）；生成实验在 E2EGit/E2EBench 上小规模评估。
- **基线**：通用 self-healing 定位（纯属性匹配，如 Healenium 思路）、无 diff 上下文的纯 LLM 修复；生成侧以"无 diff 约束生成"为对照。**优先确保至少一个一定能跑起来的兜底基线。**
- **指标**：修复成功率、定位符/断言精确匹配率、误报率、迭代次数与 token 开销、可解释性（人工评估）；生成侧用功能覆盖率与"变更相关性"。
- **研究问题**：RQ1 引入 Code Diff 修复上下文相比无 diff 基线提升多少修复成功率？RQ2 两类失效（定位符/断言）修复效果差异？RQ3 变更意图判定对误报的抑制程度？RQ4 真实项目（E2EGit）上的泛化性与 CI 开销？RQ5（次要）以 diff 为约束的补充生成相较无约束生成在变更相关性上的提升？

---

## 六、创新点分析

1. **首个"以引发失效的 Code Diff 为修复上下文"的 Playwright E2E 修复方法**：把"提取引发断裂的代码变更切片"作为修复一等输入，区别于通用 self-healing 的"仅靠新旧 DOM 匹配"。
2. **变更意图判定驱动的"修复/更新/报告回归"三分支决策**：把"有意改动 vs 真回归"判定嵌入 E2E 修复，显著降低误报——相对单元测试修复与通用自愈的关键差异化。
3. **以 Code Diff 为触发与约束的 E2E 补充生成**：将变更驱动从"修复"延伸到"按需生成"，与修复共同构成完整的变更驱动闭环。
4. **面向 Playwright 的可解释、低误报修复（与按需生成）流水线与评测协议**：基于 ReproBreak + E2EGit/E2EBench 构建"变更致 E2E 失效→修复/补充"的评测方法。

---

## 七、可行性分析

### 7.1 理论可行性
所依赖的脉络——LLM 测试修复（UTFix、TaRGET、Fix the Tests）、Web/E2E 修复（Semantic Test Repair、WEFix、Web UI 修复）、E2E 生成（AutoE2E、SymPrompt、VISCA）——均有成熟范式可迁移；将"引发失效/变更的 diff"作为上下文/约束在逻辑上自洽且有空白可填。

### 7.2 技术可行性
Playwright 提供稳定的执行、trace、截图与语义定位 API；git/AST diff、DOM 快照、LLM 调用均为成熟可得能力；Practical Limits 等工业案例已验证"LLM+Playwright+RAG"路线可行。

### 7.3 数据与评测可行性（已核实）
- **ReproBreak 已开源**，含 449 个可复现 locator break + 自动复现脚本，直接支撑修复主实验，**无需自建大数据集**——这是 1 年周期内可毕业的关键。
- **E2EGit 已开源**（472 仓库 / 43,670 Web GUI 测试），可挖掘真实 Playwright 项目支撑生成与泛化实验。
- ⚠️ 风险与应对：ReproBreak 以"测试侧定位符变更 commit"为中心，**引发断裂的应用侧 Code Diff 需自行从 commit 抽取**——本课题已将"修复上下文构造"列为内容一，正好覆盖该工作；若个别样本无法关联应用侧 diff，则退化为"新旧 DOM + trace"上下文，方法仍成立。

### 7.4 工作量与条件可行性
研究内容以修复为深度主线、生成为小规模补全，数据基准现成，单个研究生在约 1 年内可完成原型与实验。已完成系统性文献调研（66 篇，全文已下载 61 篇）。

### 7.5 风险与应对
- **LLM 幻觉/不稳定** → 解释一致性校验 + 真实执行验证 + 迭代反馈。
- **基线可复现性**（Practical Limits 为 2026 预印本，可能无开源代码）→ 以"纯属性匹配 self-healing""无 diff 的纯 LLM 修复"作兜底基线。
- **diff→失效关联缺失** → 见 7.3 应对（退化上下文）。
- **时间不足** → 生成（内容四）可弹性收缩为小规模验证甚至讨论章节，不影响修复主线成立。

---

## 八、研究计划与进度计划（约 12 个月）

| 阶段 | 时长 | 主要任务 | 阶段成果 |
|------|------|----------|----------|
| 第一阶段 | 第 1–2 月 | 精读对标（UTFix/Practical Limits/WEFix/Web UI 修复/Testora/AutoE2E）；跑通 ReproBreak 复现脚本；复现 1 个兜底基线；明确问题刻画 | 开题、基线数据、问题定义 |
| 第二阶段 | 第 3–4 月 | 内容一：失效定位与修复上下文构造（diff 切片 + trace + DOM + 新旧 locator） | 修复上下文模块 + 初步实验 |
| 第三阶段 | 第 5–7 月 | 内容二：LLM 修复流水线（定位符断裂 + 断言失配两类）+ 执行验证迭代 | 核心修复模块 + 主实验（对比无 diff 基线） |
| 第四阶段 | 第 8–9 月 | 内容三：变更意图判定 + 误报抑制；消融实验 | 创新点验证 + 误报对比 |
| 第五阶段 | 第 10 月 | 内容四：以 diff 约束的补充生成小规模实验；E2EGit 泛化与 CI 开销评估 | 生成验证 + 泛化结果 |
| 第六阶段 | 第 11–12 月 | 系统实验整理、论文撰写、投稿、开源复现包 | 学位论文 + 投稿稿 + 开源仓库 |

---

## 九、预期成果

1. **方法与工具**：提出"以引发失效的 Code Diff 为修复上下文 + 变更意图判定降误报 + diff 约束补充生成"的 Playwright E2E 自动生成与修复方法，并实现可嵌入 CI/CD 的原型工具。
2. **学位论文**：完成一篇系统阐述方法、实现与评测的硕士学位论文。
3. **学术论文**：争取在软件工程会议/期刊（如 ICST、ICSME、SANER 或相关期刊/workshop）投稿 1 篇。
4. **开源**：开源原型工具与实验复现包（replication package），并在 ReproBreak/E2EGit 上给出可复现结果。
5. **实验结论**：量化给出"引入 Code Diff 修复上下文""变更意图判定"对修复成功率与误报率的提升，以及"diff 约束生成"对用例变更相关性的提升。

---

## 十、参考文献

[1] UTFix: Change Aware Unit Test Repairing using LLM. Proc. ACM Program. Lang. (OOPSLA), 2025. https://arxiv.org/abs/2503.14924

[2] Automated Test Case Repair Using Language Models (TaRGET). IEEE Transactions on Software Engineering, 2025. https://arxiv.org/abs/2401.06765

[3] Unit Test Update through LLM-Driven Context Collection and Error-Type-Aware Refinement. ASE, 2025. https://arxiv.org/abs/2509.24419

[4] Fix the Tests: Augmenting LLMs to Repair Test Cases with Static Collector and Neural Reranker. ISSRE, 2024. https://arxiv.org/abs/2407.03625

[5] Testora: Using Natural Language Intent to Detect Behavioral Regressions. arXiv:2503.18597, 2025. https://arxiv.org/abs/2503.18597

[6] Practical Limits of Autonomous Test Repair: A Multi-Agent Case Study (LLM + LangGraph + Playwright). arXiv:2605.01471, 2026. https://arxiv.org/abs/2605.01471

[7] Semantic Test Repair for Web Applications. ESEC/FSE, 2023. https://doi.org/10.1145/3611643.3616324

[8] WEFix: Automatic Generation of Explicit Waits for Web E2E Flaky Tests. The Web Conf (WWW), 2024. https://arxiv.org/abs/2402.09745

[9] Time-based Repair for Asynchronous Wait Flaky Tests in Web Testing. arXiv:2305.08592, 2023. https://arxiv.org/abs/2305.08592

[10] Understanding & Enhancing Attribute Prioritization in Fixing Web UI Tests with LLMs (Guiding ChatGPT to Fix Web UI Tests). ICST, 2025. https://arxiv.org/abs/2312.05778

[11] Towards Predicting Fragility in End-to-End Web Tests. EASE, 2024. https://doi.org/10.1145/3661167.3661179

[12] ReproBreak: A Dataset of Reproducible Web Locator Breaks. arXiv:2605.12158, 2026. https://arxiv.org/abs/2605.12158

[13] E2EGit: A Dataset of End-to-End Web Tests in Open Source Projects. MSR, 2025. https://doi.org/10.1109/MSR66628.2025.00121

[14] Feature-Driven End-to-End Test Generation (AutoE2E). ICSE, 2025. https://arxiv.org/abs/2408.01894

[15] Code-Aware Prompting (SymPrompt): Coverage-Guided Test Generation in Regression Setting using LLM. Proc. ACM Softw. Eng. (FSE), 2024. https://arxiv.org/abs/2402.00097

[16] VISCA: Inferring Component Abstractions for Automated End-to-End Testing. arXiv:2506.04161, 2025. https://arxiv.org/abs/2506.04161

[17] GenIA-E2ETest: A Generative AI-Based Approach for End-to-End Test Automation. SBES, 2025. https://arxiv.org/abs/2510.01024

[18] Automated Web Application Testing: E2E Test Case Generation with LLMs and Screen Transition Graphs. arXiv:2506.02529, 2025. https://arxiv.org/abs/2506.02529

[19] Can LLM Generate Regression Tests for Software Commits? arXiv:2501.11086, 2025. https://arxiv.org/abs/2501.11086

[20] Change And Cover (ChaCo): Last-Mile, Pull Request-Based Regression Test Augmentation. arXiv:2601.10942, 2026. https://arxiv.org/abs/2601.10942

[21] FlakyGuard: Automatically Fixing Flaky Tests at Industry Scale. ASE, 2025. https://arxiv.org/abs/2511.14002

[22] FlakyFix: LLMs for Predicting Flaky Test Fix Categories and Test Code Repair. IEEE Transactions on Software Engineering, 2024. https://arxiv.org/abs/2307.00012

[23] GAMMA: Revisiting Template-Based APR via Mask Prediction. ASE, 2023. https://arxiv.org/abs/2309.09308

[24] Hierarchical Knowledge Injection for Improving LLM-based Program Repair. ASE, 2025. https://arxiv.org/abs/2506.24015

[25] An Empirical Evaluation of Using LLMs for Automated Unit Test Generation. IEEE Transactions on Software Engineering, 2023. https://arxiv.org/abs/2302.06527

[26] Software Testing With Large Language Models: Survey, Landscape, and Vision. IEEE Transactions on Software Engineering, 2023. https://arxiv.org/abs/2307.07221

[27] A Survey on Web Testing: On the Rise of AI and Applications in Industry. arXiv:2503.05378, 2025. https://arxiv.org/abs/2503.05378

[28] Challenges of End-to-End Testing with Selenium WebDriver and How to Face Them: A Survey. ICST, 2023. https://doi.org/10.1109/ICST57152.2023.00039

[29] A Multi-Year Grey Literature Review on AI-assisted Test Automation. Information and Software Technology, 2024. https://arxiv.org/abs/2408.06224

[30] Effortless Test Maintenance: A Critical Review of Self-Healing Frameworks. IJRASET, 2023. https://doi.org/10.22214/ijraset.2023.56048

[31] Exploring the Integration of LLMs in Industrial Test Maintenance Processes. arXiv:2409.06416, 2024. https://arxiv.org/abs/2409.06416

[32] SWT-Bench: Testing and Validating Real-World Bug-Fixes with Code Agents. NeurIPS, 2024. https://arxiv.org/abs/2406.12952

---

> 注：引用数与发表 venue 为 Semantic Scholar 口径（截至 2026 年 6 月），部分 2026 年文献仍处预印本阶段。完整文献池（66 篇）见《文献分类整理_CodeDiff_Playwright_E2E.md》与《文献来源与下载链接总表.md》。
