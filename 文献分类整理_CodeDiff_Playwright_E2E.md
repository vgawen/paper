# 文献分类整理：基于 Code Diff 的 Playwright E2E 测试自动生成与修复

> 课题：《基于 Code Diff 的 Playwright E2E 测试自动生成与修复方法研究》
> 整理范围：汇总并去重以下 4 份调研文件——
> `literature-review-software-testing_acamedic_search.md`、`文献调研_测试生成与修复_paper_serach_mcp.md`、`文献检索_CodeDiff_E2E测试生成与修复_literature-downloader-skill.md`、`download_软件演化与测试维护_文献调研_scholar_search_skills.md`
> 引用数为 Semantic Scholar 口径（2026-06，随时间变动；新论文偏低）。venue 类型已标注：顶刊/顶会（TSE/TOSEM/ICSE/FSE/ASE/ISSTA/WWW 等）、普通会议/期刊、预印本（arXiv）。

## 分类原则

- **A 类（核心文献）**：与课题三要素（**Code Diff 变更感知** × **E2E / Web / Playwright** × **测试生成 / 修复**）直接交叉、必读对标的工作。优先收录顶会顶刊与技术栈一致者。
- **B 类（支撑文献）**：提供方法论与工程基础——回归测试选择/变更影响分析、LLM 测试生成经典、综述、自洽愈合（self-healing）综述等。发表于较稳定 venue，用作背景与 Related Work。
- **C 类（最新前沿）**：2025–2026 年新兴方向与前沿预印本，尚未稳定 venue，但代表趋势，可用于"研究空白"论证与创新对标。

---

## A 类：核心文献（直接对标，必读）

### A-1 变更感知（Code Diff / Commit / PR → 测试生成与修复）

| # | 题目 | 年份 | 引用 | venue（类型） | 与课题关联 | PDF |
|---|------|------|------|---------------|-----------|-----|
| 1 | **UTFix: Change Aware Unit Test Repairing using LLM** | 2025 | 14 | Proc. ACM Program. Lang. / OOPSLA（顶会） | **最贴近"代码变更→测试修复"**：focal method 变更后用静态/动态切片+失败上下文修复单测，解决断言失败与覆盖率下降；思路可直接迁移到 Playwright E2E | [pdf](https://arxiv.org/pdf/2503.14924) |
| 2 | **Code-Aware Prompting (SymPrompt): Coverage-Guided Test Generation in Regression Setting** | 2024 | 160 | Proc. ACM Softw. Eng. / FSE（顶会） | 回归场景下执行路径感知的多阶段提示，GPT-4 覆盖率提升 2×，无需训练；E2E 用例生成可借鉴 | [pdf](https://arxiv.org/pdf/2402.00097) |
| 3 | Can LLM Generate Regression Tests for Software Commits? | 2025 | 11 | arXiv（预印本） | "commit/PR 变更 → 回归测试生成以暴露该变更引入 bug"的直接代表作 | [pdf](https://arxiv.org/pdf/2501.11086) |
| 4 | Testora: Using Natural Language Intent to Detect Behavioral Regressions | 2025 | 5 | arXiv（预印本） | 用"变更意图"区分"有意改动 vs 真回归"，可用于 E2E 断言/期望更新判定，避免误报 | [pdf](https://arxiv.org/pdf/2503.18597) |
| 5 | AI for Context-Aware Visual Change Detection in Software Test Automation | 2024 | 2 | Progress in Artificial Intelligence（期刊） | YOLOv5+图结构跨版本识别 UI 元素对应与"有意义变更"，对 E2E 视觉/UI 变更检测有借鉴 | [pdf](https://arxiv.org/pdf/2405.00874) |

### A-2 E2E / Web GUI 测试自动生成

| # | 题目 | 年份 | 引用 | venue（类型） | 与课题关联 | PDF |
|---|------|------|------|---------------|-----------|-----|
| 6 | **Feature-Driven End-to-End Test Generation (AutoE2E)** | 2024 | 12 | ICSE 2025（顶会） | LLM 推断 Web 功能特性→生成语义连贯可执行 E2E；提出 E2EBench 基准（覆盖率均值 79%）。E2E 生成代表作 | [pdf](https://arxiv.org/pdf/2408.01894) |
| 7 | Automated Web Application Testing: E2E Test Case Generation with LLMs and Screen Transition Graphs | 2025 | 8 | arXiv（预印本） | 屏幕跳转图+LLM 建模导航与复杂表单，自动生成 Web E2E | [pdf](https://arxiv.org/pdf/2506.02529) |
| 8 | Scenario-Guided LLM-based Mobile App GUI Testing | 2025 | 8 | ACM TOSEM 2025（顶刊） | 以业务场景引导 LLM 生成贴近真实用户流程的测试序列 | [pdf](https://arxiv.org/pdf/2506.05079) |
| 9 | GenIA-E2ETest: A Generative AI-Based Approach for End-to-End Test Automation | 2025 | 0 | SBES 2025（会议） | 从自然语言描述生成可执行 E2E 脚本，明确针对"缺乏 E2E"空白 | [pdf](https://arxiv.org/pdf/2510.01024) |

### A-3 E2E / Web 测试修复（代码/UI 演化后修复）

| # | 题目 | 年份 | 引用 | venue（类型） | 与课题关联 | PDF |
|---|------|------|------|---------------|-----------|-----|
| 10 | **Practical Limits of Autonomous Test Repair: A Multi-Agent Case Study** | 2026 | 0 | arXiv（预印本） | **技术栈与课题几乎一致**：LLM + LangGraph + **Playwright** + RAG 的企业级 UI 测试自治修复，最重要对标/基线 | [pdf](https://arxiv.org/pdf/2605.01471) |
| 11 | **Automated Test Case Repair Using Language Models (TaRGET)** | 2024 | 22 | IEEE TSE 2025（顶刊） | 测试修复建模为"语言翻译"，微调代码 LLM；TaRBench（59 项目/45,373 失效测试），精确匹配 66.1% | [pdf](https://arxiv.org/pdf/2401.06765) |
| 12 | **Semantic Test Repair for Web Applications** | 2023 | 7 | ESEC/FSE（顶会） | Web 演化致测试脚本断裂的语义修复，直接面向 Web 自动化测试维护 | [pdf](https://doi.org/10.1145/3611643.3616324) |
| 13 | WEFix: Automatic Generation of Explicit Waits for Web E2E Flaky Tests | 2024 | 10 | WWW (The Web Conf) 2024（顶会） | 针对 UI 异步致 flaky，自动生成等待修复代码，修复正确率 98% | [pdf](https://arxiv.org/pdf/2402.09745) |
| 14 | Fix the Tests: Augmenting LLMs to Repair Test Cases with Static Collector and Neural Reranker | 2024 | 8 | ISSRE 2024（会议） | 静态上下文收集器+神经重排序，修复因代码变更未同步而过时的测试 | [pdf](https://arxiv.org/pdf/2407.03625) |
| 15 | Unit Test Update through LLM-Driven Context Collection and Error-Type-Aware Refinement | 2025 | 3 | ASE 2025（顶会） | 覆盖"修复失效测试 + 增强测试验证新功能"双场景，与 UTFix 互补 | [pdf](https://arxiv.org/pdf/2509.24419) |
| 16 | Understanding & Enhancing Attribute Prioritization in Fixing Web UI Tests with LLMs（原 Guiding ChatGPT to Fix Web UI Tests） | 2023 | 6 | ICST 2025（会议） | Web UI 演化致测试失效，元素匹配+ChatGPT 修复+解释一致性校验抑制幻觉 | [pdf](https://arxiv.org/pdf/2312.05778) |
| 17 | Time-based Repair for Asynchronous Wait Flaky Tests in Web Testing | 2023 | 6 | arXiv（预印本） | Web 异步等待 flaky 的基于时间的自动修复 | [pdf](https://arxiv.org/pdf/2305.08592) |
| 18 | Towards Predicting Fragility in End-to-End Web Tests | 2024 | 13 | EASE 2024（会议） | 预测 E2E web 测试脚本脆弱性，定位易断裂用例 | [pdf](https://doi.org/10.1145/3661167.3661179) |

---

## B 类：支撑文献（方法论与工程基础、背景）

### B-1 回归测试选择 / 变更影响分析（用 diff 定位受影响测试）

| # | 题目 | 年份 | 引用 | venue（类型） | 作用 | PDF |
|---|------|------|------|---------------|------|-----|
| 1 | Efficient Incremental Code Coverage Analysis (iJaCoCo) | 2024 | 1 | ASE 2024（顶会） | 仅执行受变更影响最小测试子集更新覆盖率，平均提速 1.86× | [pdf](https://arxiv.org/pdf/2410.21798) |
| 2 | More Precise Regression Test Selection via Reasoning about Semantics-Modifying Changes | 2023 | 25 | ISSTA 2023（顶会） | 基于语义修改推理的精确 RTS | [pdf](https://doi.org/10.1145/3597926.3598086) |
| 3 | Test Selection for Unified Regression Testing | 2023 | 13 | ICSE 2023（顶会） | 同时测试变更代码与变更配置的统一回归测试 | [pdf](https://doi.org/10.1109/ICSE48619.2023.00145) |
| 4 | Change impact analysis in microservice systems: A systematic literature review | 2024 | 13 | Journal of Systems and Software（期刊） | 变更影响分析系统综述 | [pdf](https://doi.org/10.1016/j.jss.2024.112241) |
| 5 | Datalog-Based Language-Agnostic Change Impact Analysis for Microservices | 2025 | 7 | ICSE 2025（顶会） | 语言无关的变更影响分析 | [pdf](https://doi.org/10.1109/ICSE55347.2025.00115) |
| 6 | Hybrid Regression Test Selection by Integrating File and Method Dependences | 2024 | 5 | ASE 2024（顶会） | 文件+方法依赖混合 RTS | [pdf](https://doi.org/10.1145/3691620.3695525) |
| 7 | Practical Pipeline-Aware Regression Test Optimization for CI | 2025 | 4 | ICST 2025（会议） | 流水线感知的回归测试优化（RL，区分 pre/post-submit） | [pdf](https://arxiv.org/pdf/2501.11550) |
| 8 | Regression test selection in test-driven development | 2023 | 8 | ASE（会议） | TDD 场景的 RTS | [pdf](https://doi.org/10.1007/s10515-023-00405-w) |

### B-2 LLM 测试生成经典（领域基石）

| # | 题目 | 年份 | 引用 | venue（类型） | 作用 | PDF |
|---|------|------|------|---------------|------|-----|
| 9 | An Empirical Evaluation of Using LLMs for Automated Unit Test Generation | 2023 | 506 | IEEE TSE（顶刊） | LLM 单测生成奠基性实证 | [pdf](https://arxiv.org/pdf/2302.06527) |
| 10 | CodaMosa: Escaping Coverage Plateaus in Test Generation with Pre-trained LLMs | 2023 | 219 | ICSE 2023（顶会） | SBST+LLM 突破覆盖率停滞 | [pdf](https://doi.org/10.1109/ICSE48619.2023.00085) |
| 11 | ChatUniTest: A Framework for LLM-Based Test Generation | 2023 | 234 | FSE Companion（顶会） | LLM 测试生成框架 | [pdf](https://arxiv.org/pdf/2305.04764) |
| 12 | Effective Test Generation Using Pre-trained LLMs and Mutation Testing | 2023 | 156 | Information and Software Technology（期刊） | 变异测试引导的 LLM 测试生成 | [pdf](https://arxiv.org/pdf/2308.16557) |
| 13 | ChatGPT vs SBST: A Comparative Assessment of Unit Test Suite Generation | 2023 | 103 | IEEE TSE（顶刊） | LLM vs 搜索式测试对比 | [pdf](https://arxiv.org/pdf/2307.00588) |
| 14 | CAT-LM: Training Language Models on Aligned Code And Tests | 2023 | 75 | ASE 2023（顶会） | 代码-测试对齐训练的语言模型 | [pdf](https://arxiv.org/pdf/2310.01602) |
| 15 | SWT-Bench: Testing and Validating Real-World Bug-Fixes with Code Agents | 2024 | 128 | NeurIPS 2024（顶会） | 真实 bug-fix 的测试生成基准 | [pdf](https://arxiv.org/pdf/2406.12952) |
| 16 | Automated Unit Test Improvement using LLMs at Meta (TestGen-LLM) | 2024 | 187 | FSE Companion（顶会） | 工业级 LLM 改进既有测试 | [pdf](https://arxiv.org/pdf/2402.09171) |
| 17 | LLM for Test Script Generation and Migration | 2023 | 76 | QRS（会议） | 移动测试脚本生成与迁移 | [pdf](https://arxiv.org/pdf/2309.13574) |

### B-3 程序修复 / 自洽愈合（Self-Healing）方法与综述

| # | 题目 | 年份 | 引用 | venue（类型） | 作用 | PDF |
|---|------|------|------|---------------|------|-----|
| 18 | GAMMA: Revisiting Template-Based APR via Mask Prediction | 2023 | 84 | ASE 2023（顶会） | 模板修复→完形填空，Defects4J 超越 TBar/Recoder | [pdf](https://arxiv.org/pdf/2309.09308) |
| 19 | FlakyFix: LLMs for Predicting Flaky Test Fix Categories and Test Code Repair | 2023 | 34 | IEEE TSE 2024（顶刊） | LLM 预测 flaky 修复类别并修复 | [pdf](https://arxiv.org/pdf/2307.00012) |
| 20 | StubCoder: Automated Generation and Repair of Stub Code for Mock Objects | 2023 | 13 | ACM TOSEM（顶刊） | Mock 桩代码生成与修复 | [pdf](https://arxiv.org/pdf/2307.14733) |
| 21 | Effortless Test Maintenance: A Critical Review of Self-Healing Frameworks | 2023 | 5 | IJRASET（期刊） | Web 自动化 self-healing 综述 | [pdf](https://doi.org/10.22214/ijraset.2023.56048) |
| 22 | A Multi-Year Grey Literature Review on AI-assisted Test Automation | 2024 | 15 | Information and Software Technology（期刊） | AI 辅助测试自动化灰色文献综述 | [pdf](https://arxiv.org/pdf/2408.06224) |
| 23 | Exploring the Integration of LLMs in Industrial Test Maintenance Processes | 2024 | 6 | arXiv（预印本） | 工业测试维护中 LLM 集成 | [pdf](https://arxiv.org/pdf/2409.06416) |

### B-4 综述与背景（Related Work / Background）

| # | 题目 | 年份 | 引用 | venue（类型） | 作用 | PDF |
|---|------|------|------|---------------|------|-----|
| 24 | Software Testing With Large Language Models: Survey, Landscape, and Vision | 2023 | 603 | IEEE TSE（顶刊） | LLM 测试领域权威综述 | [pdf](https://arxiv.org/pdf/2307.07221) |
| 25 | A Survey on Web Testing: On the Rise of AI and Applications in Industry | 2025 | 7 | arXiv（预印本） | Web 测试 + AI 综述，课题背景 | [pdf](https://arxiv.org/pdf/2503.05378) |
| 26 | Challenges of End-to-End Testing with Selenium WebDriver: A Survey | 2023 | 40 | ICST 2023（会议） | E2E 测试挑战综述 | [pdf](https://doi.org/10.1109/ICST57152.2023.00039) |
| 27 | Vision-Based Mobile App GUI Testing: A Survey | 2023 | 23 | ACM Computing Surveys（顶刊） | 视觉 GUI 测试综述 | [pdf](https://arxiv.org/pdf/2310.13518) |
| 28 | A Comprehensive Survey of AI-Driven Advancements in APR and Code Generation | 2024 | 10 | arXiv（预印本） | APR + 代码生成综述 | [pdf](https://arxiv.org/pdf/2411.07586) |
| 29 | Observation-Based Unit Test Generation at Meta (TestGen) | 2024 | 14 | FSE Companion 2024（顶会） | 工业落地与规模化挑战代表案例 | [pdf](https://arxiv.org/pdf/2402.06111) |
| 30 | E2EGit: A Dataset of End-to-End Web Tests in Open Source Projects | 2025 | 7 | MSR 2025（会议） | 开源 E2E web 测试数据集 | [pdf](https://doi.org/10.1109/MSR66628.2025.00121) |

---

## C 类：最新前沿（2025–2026，趋势与空白论证）

### C-1 Code Diff / PR 驱动测试生成（前沿）

| # | 题目 | 年份 | 引用 | venue（类型） | 看点 | PDF |
|---|------|------|------|---------------|------|-----|
| 1 | Change And Cover (ChaCo): Last-Mile, PR-Based Regression Test Augmentation | 2026 | 2 | arXiv（预印本） | 精准定向 PR 中未覆盖变更行生成补充测试，"用 diff 决定生成哪些测试" | [pdf](https://arxiv.org/pdf/2601.10942) |
| 2 | PR-Aware Automated Unit Test Generation: Challenges and Opportunities | 2026 | 0 | arXiv（预印本） | PR 粒度测试生成评测方法论参照 | [pdf](https://arxiv.org/pdf/2605.25285) |
| 3 | Just-in-Time Catching Test Generation at Meta | 2026 | 0 | arXiv（预印本） | 工业实践：变更感知方法比 hardening 提升候选捕获 4× | [pdf](https://arxiv.org/pdf/2601.22832) |
| 4 | TestWeaver: Execution-aware, Feedback-driven Regression Testing Generation with LLMs | 2025 | 0 | arXiv（预印本） | 程序分析构造执行上下文，反馈驱动突破覆盖率停滞 | [pdf](https://arxiv.org/pdf/2508.01255) |
| 5 | Evaluating LLM-Based Test Generation Under Software Evolution | 2026 | 1 | arXiv（预印本） | 演化场景下测试质量评估框架 | [pdf](https://arxiv.org/pdf/2603.23443) |
| 6 | Code-A1: Adversarial Evolving of Code LLM and Test LLM via RL | 2026 | 3 | arXiv（预印本） | Code/Test LLM 对抗式协同进化做白盒对抗测试生成 | [pdf](https://arxiv.org/pdf/2603.15611) |

### C-2 E2E 稳定性 / 修复前沿

| # | 题目 | 年份 | 引用 | venue（类型） | 看点 | PDF |
|---|------|------|------|---------------|------|-----|
| 7 | **ReproBreak: A Dataset of Reproducible Web Locator Breaks** | 2026 | 0 | arXiv（预印本） | **直接面向 Cypress/Playwright**：359 项目定位符断裂数据集，课题理想评测基准 | [pdf](https://arxiv.org/pdf/2605.12158) |
| 8 | FlakyGuard: Automatically Fixing Flaky Tests at Industry Scale | 2025 | 2 | ASE 2025（顶会） | 选择性图探索找最相关上下文修复 flaky，工业规模 | [pdf](https://arxiv.org/pdf/2511.14002) |
| 9 | YATE: The Role of Test Repair in LLM-Based Unit Test Generation | 2025 | 4 | arXiv（预印本） | 把"修复"嵌入"生成"闭环，错误测试再利用 | [pdf](https://arxiv.org/pdf/2507.18316) |
| 10 | Hierarchical Knowledge Injection for Improving LLM-based Program Repair | 2025 | 4 | ASE 2025（顶会） | 分层注入缺陷/仓库/项目上下文，修复率提升至 79% | [pdf](https://arxiv.org/pdf/2506.24015) |

### C-3 E2E 生成 / GUI 测试新思路

| # | 题目 | 年份 | 引用 | venue（类型） | 看点 | PDF |
|---|------|------|------|---------------|------|-----|
| 11 | VISCA: Inferring Component Abstractions for Automated End-to-End Testing | 2025 | 0 | arXiv（预印本） | 网页→层次化语义组件抽象，优化喂给 LLM 的页面上下文 | [pdf](https://arxiv.org/pdf/2506.04161) |
| 12 | ViMoTest: Specify ViewModel-Based GUI Test Scenarios using Projectional Editing | 2025 | 1 | ICSCT 2025（会议） | BDD+ViewModel+投影 DSL，降低 E2E 维护成本与 flaky | [pdf](https://arxiv.org/pdf/2504.16753) |
| 13 | Automated Functional Testing for Malleable Mobile Application Driven from User Intent | 2026 | 0 | arXiv（预印本） | "需求/变更 → 验证测试"思路 | [pdf](https://arxiv.org/pdf/2604.02079) |

### C-4 CI 中的 E2E 实践与 Agent 测试（实证前沿）

| # | 题目 | 年份 | 引用 | venue（类型） | 看点 | PDF |
|---|------|------|------|---------------|------|-----|
| 14 | Android Instrumentation Testing in CI: Practices, Patterns, and Performance | 2026 | 0 | arXiv（预印本） | 4518 个 CI 仓库 E2E instrumentation 采用率仅 ~10.6% 等实证 | [pdf](https://arxiv.org/pdf/2604.03438) |
| 15 | Do Autonomous Agents Contribute Test Code? Tests in Agentic Pull Requests | 2026 | 2 | arXiv（预印本） | AI Agent PR 中测试代码频率/时机/合并率实证 | [pdf](https://arxiv.org/pdf/2601.03556) |
| 16 | Names Are All You Need (NameRTS): RTS for Python | 2026 | 0 | arXiv（预印本） | 首个细粒度依赖分析的 Python RTS | [pdf](https://arxiv.org/pdf/2605.25356) |
| 17 | Formalizing Regression Testing for Agile and CI Environments | 2025 | 0 | arXiv（预印本） | 持续回归测试形式化、定义"回归测试窗口" | [pdf](https://arxiv.org/pdf/2511.02810) |
| 18 | Understanding Automated Program Repair Agents Through the Lens of Traceability | 2025 | 15 | arXiv（预印本） | APR Agent 行为可追溯性实证 | [pdf](https://arxiv.org/pdf/2506.08311) |

---

## 课题对标小结（基于以上分类）

1. **最需精读的核心对标（A 类）**
   - **UTFix**（A-1）：代码变更→测试修复的方法范式（切片+失败上下文），直接迁移到 Playwright E2E。
   - **Practical Limits of Autonomous Test Repair**（A-3）：LLM+LangGraph+**Playwright**+RAG，技术栈一致，作为头号基线。
   - **AutoE2E**（A-2）：LLM 驱动 E2E 生成代表作 + E2EBench 基准。
   - **SymPrompt / Code-Aware Prompting**（A-1）：回归场景覆盖率导向的提示策略。
   - **WEFix / Semantic Test Repair / Fix Web UI Tests**（A-3）：Web/E2E 修复直接相关。

2. **工程支撑闭环（B 类）**
   - iJaCoCo + Pipeline-Aware RTS + 各 RTS/CIA 工作 → "用 diff 精准定位受影响 E2E 用例"的选择层。
   - LLM 测试生成经典 + 综述 → Related Work 与背景。

3. **研究空白与创新性论证（C 类）**
   - Code Diff 驱动已有同行工作（ChaCo / PR-Aware / Just-in-Time@Meta），但**落点几乎全在单元/回归测试，E2E 层面仍空白**。
   - E2E 生成（AutoE2E / Screen Transition Graphs / VISCA）均"从需求/页面"出发，**未以 Code Diff 为触发与约束**。
   - **ReproBreak**（Cypress/Playwright 定位符断裂数据集）是"变更致 E2E 断裂→修复"的现成评测基准。
   - 综合：**"Code Diff + Playwright + E2E 生成与修复"的组合尚无专门工作**，是课题创新空白的有力论证。
