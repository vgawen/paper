# 基于 Code Diff 的 Playwright E2E 测试自动生成与修复：文献综述

> 课题：《基于 Code Diff 的 Playwright E2E 测试自动生成与修复方法研究》
> 综述范围：2023–2026 年软件工程领域顶刊/顶会（TSE、TOSEM、ICSE、FSE、ASE、ISSTA、WWW、NeurIPS、MSR 等）及高质量预印本，合计 66 篇核心文献。
> 引用口径：Semantic Scholar（2026-06），随时间变动。
> 文内引用采用本课题文献库编号（A=核心、B=支撑、C=前沿），完整对照见末尾"参考文献"与配套文件《文献来源与下载链接总表.md》。

---

## 摘要

随着 Web 应用的持续演化和敏捷/CI-CD 开发模式的普及，端到端（End-to-End, E2E）测试在保障真实用户场景下系统质量方面的价值日益凸显，但其编写成本高、随代码变更易失效、运行不稳定（flaky）等问题也愈发突出。近年来，大语言模型（LLM）为测试自动生成与自动修复带来了范式性变革，"变更感知（change-aware）"的测试演化（即以 commit/PR/Code Diff 为触发与约束来生成或修复测试）成为新的研究热点。本文系统梳理了 2023–2026 年间围绕 LLM 测试生成、变更感知测试演化、E2E/Web GUI 测试生成与修复、测试稳定性、回归测试选择（RTS）与变更影响分析（CIA），以及相关基准与工业实践的代表性工作。综述发现：**（1）** LLM 测试生成已从单元测试走向回归/演化场景，覆盖率导向的"代码感知提示"与执行反馈驱动成为主流技术路线；**（2）** 变更感知测试生成已形成"PR/commit 变更行→定向生成测试"的清晰范式，但研究落点几乎全部集中在单元/回归测试层面；**（3）** E2E 测试生成与修复虽已被 LLM 赋能并出现与 Playwright 技术栈一致的自治修复系统，但大多"从需求/页面出发"，**尚无专门以 Code Diff 为驱动的 Web E2E 测试自动生成与修复工作**。这一"Code Diff × Playwright × E2E 生成/修复"的组合是当前明确的研究空白，构成本课题的核心创新空间。本文最后据此提出"Diff 定位→E2E 生成/修复→演化下质量评估"的研究框架与可行的评测基准选型。

**关键词**：端到端测试；Playwright；代码变更；测试生成；测试修复；大语言模型；回归测试

---

## 1 引言

### 1.1 研究背景

软件测试是保障软件质量的核心活动，而测试代码本身也是需要持续维护的"活制品"。在现代 Web 应用中，端到端测试通过在真实浏览器中模拟用户的完整操作流程，验证跨组件、跨页面的业务功能，是发现集成层缺陷、保障用户体验的关键手段。Playwright、Selenium、Cypress 等框架是当前 Web E2E 自动化的主流工具。然而，E2E 测试长期受困于三类痛点：其一，**编写与维护成本高**——脚本需要精确刻画页面元素定位与交互时序；其二，**对代码/UI 演化高度敏感**——前端结构、组件、接口的微小变更即可导致定位符断裂或断言失效；其三，**运行不稳定（flaky）**——异步加载、网络时延等导致非确定性失败 [B26, A18]。研究表明，相当比例的软件失效源于"过时的测试套件"——Meta 的研究显示 14%–22% 的软件失效与未及时更新的测试相关 [A01]。

与此同时，大语言模型的崛起为软件测试注入了新动能。Wang 等的权威综述系统勾勒了 LLM 在测试生成、缺陷复现、测试预言等环节的版图与愿景 [B24]；面向 Web 测试的最新综述则进一步指出 AI（尤其 LLM）正在重塑 Web 测试的研究与工业实践 [B25]。在敏捷与持续集成成为主流的工程背景下，"以代码变更为单位驱动测试演化"（变更感知测试生成与修复）逐渐取代"整套重跑"的粗放模式，成为兼顾成本与有效性的关键方向。

### 1.2 研究问题与课题定位

本课题聚焦三个要素的交叉点：**Code Diff（变更感知）× Playwright（技术栈）× E2E（测试层级）× 生成与修复（任务）**。围绕这一定位，本文综述拟回答：

- **RQ1**：LLM 驱动的测试生成与修复已发展到何种程度？其核心技术路线是什么？
- **RQ2**：以 Code Diff/PR/commit 为驱动的变更感知测试演化有哪些代表性范式？落点集中在哪个测试层级？
- **RQ3**：E2E/Web 测试的自动生成、修复与稳定性研究现状如何？与 Playwright 技术栈的契合度如何？
- **RQ4**：用于"以 diff 精准定位受影响测试"的回归测试选择与变更影响分析提供了哪些工程支撑？
- **RQ5**：当前研究的空白何在？本课题的创新空间与可行的研究框架、评测基准是什么？

### 1.3 文献来源与检索方法

本综述的文献来自多轮、多渠道检索的汇总与去重：以 arXiv（cs.SE 为主）作为一手检索源，辅以 Semantic Scholar Graph API 补全引用数与发表 venue，并通过 OpenAlex/Crossref/ACM DL/IEEE Xplore 核实出版信息。检索时间为 2026 年 6 月，年份限定 2023–2026，覆盖 test generation、test repair、change/commit/PR-aware testing、regression test selection、E2E/web/GUI testing、flaky test、self-healing 等关键词组。最终筛选并整理出 66 篇文献，按与课题的关联度分为三类：**A 类核心文献（18 篇）**——与课题三要素直接交叉、必读对标；**B 类支撑文献（30 篇）**——提供方法论与工程基础（RTS/CIA、LLM 测试生成经典、综述）；**C 类前沿文献（18 篇）**——2025–2026 新兴方向，用于趋势研判与空白论证。文献的可获取性与下载情况见配套文件《文献来源与下载链接总表.md》（已合法开放获取 61 篇）。

---

## 2 大语言模型驱动的测试生成（领域基石）

LLM 测试生成是本课题的方法论基石。这一方向在 2023 年前后迅速成熟，奠定了"提示工程 + 程序分析 + 反馈迭代"的基本范式。

**奠基性实证与对比。** Siddiq 等对 LLM 自动单元测试生成进行了系统性的实证评估，揭示了模型在编译通过率、覆盖率与可读性上的能力边界 [B09]；Tang 等则将 ChatGPT 与搜索式软件测试（SBST，如 EvoSuite）进行对比评估，明确了 LLM 路线在测试可读性与语义合理性上的相对优势及其局限 [B13]。这些工作共同确立了 LLM 测试生成的基线认知。

**突破覆盖率瓶颈。** 传统 SBST 易陷入"覆盖率停滞（coverage plateau）"。CodaMosa 创造性地在搜索陷入停滞时调用预训练 LLM 生成新测试以"逃逸"停滞区，将搜索式方法与生成式模型有机结合 [B10]；Dakhel 等则用变异测试（mutation testing）引导 LLM 生成更具缺陷揭示能力的测试 [B12]。

**框架化与训练方案。** ChatUniTest 提出了一套面向 LLM 的测试生成框架（生成—校验—修复闭环），是该方向被广泛引用的工程化代表 [B11]；CAT-LM 则从训练侧切入，在"代码—测试对齐"语料上训练语言模型，使其更好地建模代码与测试的对应关系 [B14]。

**工业落地与规模化。** Meta 的 TestGen-LLM 用 LLM 自动改进既有人工测试，并以"保证可编译、可通过、能提升覆盖"为硬性验证门槛，体现了工业级质量约束下的务实路线 [B16]；其 Observation-Based TestGen 则从应用运行时"雕刻（carving）"出单元测试，已在 CI 中规模化执行并发现数千缺陷 [B29]。这些工业案例对本课题"如何在 CI 流水线中规模化、可靠地生成 E2E 测试"具有直接借鉴意义。SWT-Bench 进一步提供了"用代码 Agent 为真实 bug-fix 生成测试"的评测基准，连接了测试生成与软件演化 [B15]。此外，面向移动端的测试脚本生成与迁移工作也展示了 LLM 在跨平台脚本任务上的潜力 [B17]。

**小结（RQ1）**：LLM 测试生成已从"能否生成"走向"如何生成更高覆盖、更可信、可规模化"的精细化阶段，"程序分析增强上下文 + 反馈驱动迭代 + 严格验证门槛"是被反复验证的有效路线。但上述工作绝大多数面向**单元测试**，输入为完整类/方法，评估以覆盖率为主，**尚未以代码变更为单位、面向 E2E 层级**。

---

## 3 变更感知（Code Diff / PR / Commit）的测试生成

这是与本课题"Code Diff 驱动"最直接相关的方向，也是 2024–2026 年最活跃的前沿之一。

**回归场景下的代码感知提示。** Ryan 等提出的 Code-Aware Prompting（SymPrompt）是该方向的高引经典：面向回归测试场景，按被测方法的执行路径将生成过程拆解为多阶段提示，并注入类型/依赖等代码上下文，使 GPT-4 无需额外训练即将覆盖率较基线提升 2 倍以上 [A02]。其"执行路径感知 + 上下文注入"的提示策略，可迁移到"以变更路径引导 E2E 用例生成"。

**commit/PR 变更 → 定向生成测试。** 一组工作共同确立了"变更行→定向测试"的范式：
- *Can LLM Generate Regression Tests for Software Commits?* 面向结构化输入程序，给定一次 commit 变更，用 LLM 生成回归测试以暴露该变更引入的 bug [A03]；
- *ChaCo（Change And Cover）* 不追求整体覆盖率，而是**精准定向 PR 中仍未被覆盖的"最后一公里"变更行**生成补充测试，直接对应"用 diff 决定生成哪些测试" [C01]；
- *PR-Aware Automated Unit Test Generation* 指出现有方法多面向完整类、以覆盖率评估，与"以小颗粒 PR 演进"的现实开发脱节，并系统评估了 PR 感知测试生成的可行性与差距，为课题提供了"PR 粒度评测"方法论 [C02]；
- Meta 的 *Just-in-Time Catching Test Generation* 以"catching test（应当失败、在合入前暴露 bug）"为目标，分析 22,126 条生成测试，发现**变更感知方法**较 hardening 测试提升候选捕获 4 倍，并用规则 + LLM 抑制误报，是工业级实践代表 [C03]。

**执行/反馈驱动与演化下的质量评估。** TestWeaver 针对 LLM 回归测试生成的覆盖率停滞，集成轻量程序分析构造聚焦执行上下文、降低幻觉，并以反馈驱动迭代提升覆盖 [C04]；*Evaluating LLM-Based Test Generation Under Software Evolution* 则做大规模实证，揭示 LLM 生成的测试在代码演化下存在覆盖率下降、漏检回归、漏报缺陷等弱点，为"演化场景下的测试质量评估"提供了框架 [C05]。Code-A1 进一步探索 Code LLM 与 Test LLM 的对抗式协同进化（强化学习），以分离架构避免自我合谋，拓展了白盒对抗测试生成的思路 [C06]。

**区分"有意变更"与"真回归"。** Testora 首次将"代码变更意图（自然语言）"与"变更导致的行为差异"对比，用以区分"有意行为改变（修 bug/加功能）"与"真回归"，避免传统方法将所有差异都误报为回归 [A04]。这一思想对 E2E 断言/期望的更新判定尤为关键——可避免把预期内的 UI 改动误报为测试失败。

**小结（RQ2）**：变更感知测试生成已形成成熟范式（变更行定位→定向生成→反馈/误报抑制），并已有工业级落地。但**其落点几乎全部集中在单元/回归测试**，输入多为后端代码 diff，**E2E/前端层面仍属空白**——这是本课题创新性的有力佐证。

---

## 4 E2E / Web GUI 测试的自动生成

E2E 生成方向回答"如何让 LLM 理解 Web 页面与业务流程并产出可执行用例"。

**功能驱动与基准。** AutoE2E 是 LLM 驱动 Web E2E 生成的代表作：自动推断 Web 应用的功能特性并转化为语义连贯、可执行的 E2E 用例，并提出 E2EBench 基准衡量功能覆盖率（平均达 79%），远超基线 [A06]。该工作既是技术对标，也提供了重要的评测基准。

**页面/导航建模。** 如何把复杂的页面与导航结构有效喂给 LLM 是核心挑战。Screen Transition Graphs 方法用"屏幕跳转图 + LLM"建模站点导航与复杂表单交互，解决动态导航流与表单处理难题 [A07]；VISCA 将网页转化为层次化、语义丰富的组件抽象（启发式分段 + 分类/上下文抽取），为 LLM 提供更优的页面上下文输入 [C11]。这两种"页面上下文表征"思路对本课题"如何把受 diff 影响的 UI 区域结构化喂给模型"有直接借鉴价值。

**场景/意图驱动。** Scenario-Guided 方法以"业务场景"为引导，用 LLM 生成更贴近真实用户操作流程的测试序列（虽以移动 GUI 为载体，但思路通用）[A08]；GenIA-E2ETest 从自然语言描述生成可执行 E2E 脚本，明确针对"现有方案多停留在单元测试、缺乏 E2E"这一空白 [A09]；面向"可塑移动应用"的工作也体现了"需求/变更→验证测试"的相似思路 [C13]。ViMoTest 则用 BDD + ViewModel + 投影式 DSL 解耦表现层逻辑与 GUI 框架，旨在降低 E2E 的高规约成本、维护难与 flaky 问题 [C12]。

**小结（RQ3-a）**：LLM 生成 E2E 已被证明可行，关键技术在于"页面/导航/场景的上下文表征"。但现有工作几乎都**从需求或当前页面状态出发，没有以代码变更（diff）作为生成的触发与约束**——将"Code Diff → 受影响 UI 流 → E2E 用例"这条链路打通，是清晰的贡献点。

---

## 5 测试修复与维护（代码/UI 演化后）

测试修复是本课题"修复"任务的直接对标方向，涵盖单元测试修复、Web/UI 测试修复与通用测试更新。

### 5.1 变更感知的单元测试修复（范式参考）

UTFix 是与课题"代码变更→测试修复"最贴近的方法范式：当焦点方法（focal method）发生变更后，借助静态切片、动态切片与失败信息上下文，用 LLM 修复对应单元测试，分别解决"断言失败"与"覆盖率下降"两类问题（断言修复率达 89.2%/60%），是首个面向演化中 Python 项目单测修复的系统研究 [A01]。其"切片获取最小相关上下文 + 失败信息驱动修复"的设计可直接迁移到 Playwright E2E + Code Diff 的修复框架。与之互补，*Unit Test Update*（ASE 2025）同时覆盖"修复失效测试"与"增强测试以验证新功能"双场景，采用 LLM 驱动的上下文收集 + 错误类型感知精炼 [A15]；*Fix the Tests* 用静态上下文收集器 + 神经重排序器修复因代码变更未同步而过时（obsolete）的测试，提升大型项目的修复准确率 [A14]；YATE 则把"修复"嵌入"生成"闭环，将 LLM 生成的含错测试通过简单修复重获价值 [C09]。

### 5.2 Web / UI / E2E 测试修复

- **TaRGET** 将测试用例修复建模为"语言翻译"任务并微调代码 LLM，构建了大规模 TaRBench 基准（59 个开源项目、45,373 条失效测试修复），精确匹配率 66.1%，是测试修复方向的顶刊代表与重要基准 [A11]。
- **Semantic Test Repair for Web Applications** 针对 Web 演化导致脚本断裂，提出语义层面的测试修复，直接面向 Web 自动化测试维护 [A12]。
- **Fixing Web UI Tests with LLMs**（原 Guiding ChatGPT）先用已有技术做元素初匹配，再用 ChatGPT 做后续匹配与断点修复，并设计"解释一致性校验器"抑制幻觉，强调属性优先级在元素重定位中的作用 [A16]。
- **Practical Limits of Autonomous Test Repair**（多智能体案例）是**技术栈与课题几乎完全一致**的工作：基于 LLM + LangGraph 编排 + **Playwright** 执行 + RAG 知识库，构建企业级 UI 测试套件的自治修复系统，应对每屏数百个动态 UI 元素，从人工指导逐步走向高自治，应作为本课题**头号对标与基线** [A10]。

### 5.3 程序修复与自愈（Self-Healing）方法与综述

测试修复可借鉴自动程序修复（APR）的成熟技术。GAMMA 将模板修复转化为"完形填空（mask prediction）"，用预训练模型直接预测补丁，在 Defects4J 上超越 TBar/Recoder [B18]；分层知识注入（缺陷层/仓库层/项目层）的 APR 工作将修复率提升至 79% [C10]；从可追溯性视角理解 APR Agent 行为的实证研究，则为 Agent 化修复的可解释与可控提供了洞见 [C18]。StubCoder 关注 Mock 桩代码的生成与修复 [B20]。综述层面，多年灰色文献综述系统梳理了 AI 辅助测试自动化（含 self-healing 商业工具）的现状与局限 [B22]；工业测试维护中 LLM 集成的探索性研究给出了真实流程视角 [B23]；面向 Web 自动化的 self-healing 框架综述则刻画了"自愈定位"的工程脉络 [B21]。

**小结（RQ3-b）**：测试修复方向技术成熟、且已出现与 Playwright 技术栈一致的自治修复系统 [A10]，"切片/上下文收集 + 失败驱动 + 幻觉抑制"是共性要素。然而现有 E2E/UI 修复多由**运行时失败触发**，**鲜见以 Code Diff 为先验信号预测/定位将断裂的 E2E 用例并主动修复**。

---

## 6 E2E 测试稳定性：Flaky、定位符断裂与脆弱性

E2E 测试的非确定性失败与变更脆弱性是其落地的主要障碍，也是修复任务的重要子问题。

**异步等待型 Flaky 修复。** WEFix 针对 Web E2E 中由 UI 异步导致的 flaky，利用浏览器 UI 变化预测客户端执行，自动生成正确的显式等待（explicit wait）修复代码，修复正确率达 98% 且开销显著降低 [A13]；基于时间的修复方法则从时序角度自动修复异步等待型 flaky [A17]。FlakyFix 用 LLM 预测 flaky 修复类别并修复测试代码 [B19]；FlakyGuard 把代码视为图结构、用选择性图探索找到最相关上下文，解决 LLM 修复 flaky 时"上下文过少/过多"的难题，并做了工业规模评估 [C08]。

**定位符断裂与脆弱性预测。** ReproBreak **直接面向 Cypress/Playwright**：当被测应用结构变化导致 locator 找不到目标元素（功能未变但测试断裂）时，分析 359 个开源项目构建了首个可复现的 Web GUI 测试**定位符断裂数据集**，是本课题"Code Diff 致 E2E 失效→修复"问题刻画与评估的**理想现成基准** [C07]。*Towards Predicting Fragility in E2E Web Tests* 则从预测视角出发，提前定位易断裂的 E2E 用例 [A18]，与"用 diff 预测受影响/将断裂用例"的思路天然契合。视觉变更检测方面，基于 YOLOv5 + 图结构的工作可跨版本识别 UI 元素对应关系与"有意义的变更"，为 E2E 视觉/UI 变更检测提供了非脚本视角 [A05]。

**小结（RQ3-c）**：稳定性研究为"修复"提供了精细的问题分型（异步等待 vs 定位符断裂 vs 脆弱性）与可复现数据集（尤其 ReproBreak [C07]）。这为本课题提供了直接可用的评测抓手，并提示"修复"应区分 flaky 与真实变更失效两类成因。

---

## 7 回归测试选择与变更影响分析（工程支撑层）

要"基于 Code Diff 决定生成/修复哪些 E2E 用例"，必须先精准定位受变更影响的测试。这正是回归测试选择（RTS）与变更影响分析（CIA）的核心能力，构成本课题的工程支撑层。

**精确 RTS。** 基于语义修改推理的 RTS 通过判别"是否真正改变语义"来更精确地选择受影响测试 [B02]；统一回归测试（uRTS）同时覆盖变更代码与变更配置 [B03]；混合 RTS（文件 + 方法依赖）兼顾精度与效率 [B06]；面向 TDD 场景的 RichTest 探索了测试驱动开发下的 RTS [B08]；NameRTS 提出首个基于细粒度依赖分析的 Python RTS，针对动态类型致调用图不准的问题，安全且有效地只执行受影响测试 [C16]。

**增量覆盖率与流水线优化。** iJaCoCo 是首个"增量代码覆盖率分析"技术，仅执行受变更影响的最小测试子集来更新覆盖率，平均提速 1.86×、最高 8.2×，弥补了 RTS 与覆盖率分析不兼容的问题 [B01]；流水线感知的回归测试优化用语言无关特征训练强化学习模型，区分 pre-submit（优先失败用例）与 post-submit（优先状态翻转）目标 [B07]。形式化方面，有工作将敏捷/CI 下的"持续回归测试"形式化为按时间排序的构建链，并定义两次构建间的"回归测试窗口" [C17]。

**变更影响分析（CIA）。** 微服务系统变更影响分析的系统综述梳理了该领域全貌 [B04]；Microscope 提出基于 Datalog 的语言无关 CIA，适配微服务的跨语言场景 [B05]。

**小结（RQ4）**：RTS/CIA/增量覆盖率技术成熟，能为"diff→受影响测试集合"提供严谨的选择层；其细粒度依赖分析与语义变更推理思想，可被改造为"diff→受影响 UI 流/E2E 用例"的定位机制。但这些工作几乎都面向**代码级单元/集成测试**，**尚未延伸到前端 UI 流与 E2E 脚本的影响定位**。

---

## 8 基准、数据集与工业实践

可靠的评测是方法研究的前提。本领域已积累若干关键资源与综述：

- **基准/数据集**：E2EBench（功能覆盖率，随 AutoE2E [A06]）、TaRBench（测试修复，45,373 条 [A11]）、SWT-Bench（bug-fix 测试生成 [B15]）、E2EGit（开源项目 E2E web 测试数据集 [B30]）、ReproBreak（Playwright/Cypress 定位符断裂 [C07]）、WebEV（E2E 测试者行为数据集，见配套调研）。其中 **ReproBreak 与 E2EGit 与本课题最契合**，可分别支撑"修复"评测与"真实 E2E 演化"语料构建。
- **综述与背景**：LLM 测试综述 [B24]、Web 测试 + AI 综述 [B25]、Selenium E2E 测试挑战综述 [B26]、视觉 GUI 测试综述 [B27]、APR 与代码生成综述 [B28]，共同构成本课题 Related Work 与背景章节的骨架。
- **工业与 Agent 实践**：Meta 的 TestGen-LLM/TestGen [B16, B29]、Just-in-Time Catching [C03] 展示了规模化落地；Android CI 中 E2E instrumentation 测试的实证显示其采用率仅约 10.6%，揭示 E2E 在 CI 中的现实门槛 [C14]；对"AI 编码 Agent 提交的 PR 是否包含测试代码"的实证研究 [C15] 则反映了 Agent 时代测试供给的新趋势。

**小结**：评测资源已较充分，本课题可直接复用 ReproBreak/E2EGit 等，并参考 E2EBench/TaRBench 的指标体系（功能覆盖率、精确匹配率、修复正确率等）。

---

## 9 研究现状综合分析与研究空白（RQ5）

综合前述六个主题，可得出以下判断：

**（1）三条技术链路均已成熟，但彼此尚未在 E2E 层面打通。**
- 变更感知生成链（[A02, A03, C01, C02, C03, C04]）：成熟，但落点在单元/回归测试。
- E2E 生成链（[A06, A07, A08, A09, C11, C12]）：可行，但从需求/页面出发，未与 diff 耦合。
- 测试修复链（[A01, A10, A11, A12, A14, A15, A16]）：成熟，已有 Playwright 自治修复 [A10]，但多由运行时失败触发，而非 diff 先验驱动。

**（2）明确的研究空白：Code Diff × Playwright × E2E 生成/修复的组合尚无专门工作。**
- 变更感知工作"懂 diff 但不做 E2E"；E2E 工作"做 E2E 但不懂 diff"；二者的交集——**以代码变更为触发与约束，自动判定受影响的 E2E 用例并对其进行生成（补充覆盖新行为）与修复（适配变更后的 UI/接口）**——在现有 66 篇文献中均未被专门研究。
- 与课题技术栈最接近的 [A10] 聚焦"自治修复"的工程可行性，并未将 **Code Diff 作为核心输入信号**；与课题问题最接近的 ReproBreak [C07] 仅提供数据集而非方法。

**（3）关键挑战与可借鉴要素。**
- *上下文表征*：如何将受 diff 影响的代码与 UI 区域结构化（借鉴 VISCA [C11]、Screen Transition Graphs [A07] 的页面抽象，与 UTFix [A01] 的切片上下文）。
- *受影响定位*：如何把代码级 RTS/CIA（[B02, B05, B06, C16]）映射到前端 UI 流与 E2E 用例。
- *有意变更 vs 真回归判定*：避免把预期内 UI 改动误报为失败（借鉴 Testora [A04]）。
- *flaky 与真失效区分*：修复前先甄别失败成因（借鉴 WEFix [A13]、FlakyGuard [C08]）。
- *误报抑制与验证门槛*：保证生成/修复结果可信（借鉴 Meta 实践 [C03, B16] 与解释一致性校验 [A16]）。

---

## 10 对本课题的启示与研究框架

基于上述综述，本文提出一个"**Diff 定位 → E2E 生成/修复 → 演化下质量评估**"的三阶段研究框架：

**阶段一：基于 Code Diff 的受影响 E2E 用例定位。**
以 git diff 为输入，结合改造后的 RTS/CIA（[B02, B05, B06, C16] 的依赖与语义变更推理）与前端组件抽象（[C11, A07]），建立"代码变更 → 受影响 UI 流/页面区域 → 相关 E2E 用例"的映射，输出"需新增覆盖"与"可能失效需修复"两类候选集。

**阶段二：变更驱动的 E2E 测试生成与修复。**
- *生成*：借鉴 SymPrompt 的执行路径感知提示 [A02] 与 ChaCo 的"变更行定向" [C01]，针对变更引入的新行为生成 Playwright E2E 用例；
- *修复*：借鉴 UTFix 的切片上下文 + 失败驱动 [A01]、A10 的 LLM+LangGraph+Playwright+RAG 自治架构 [A10]，对断裂用例（定位符断裂、断言失效）进行修复，并用 Testora 式意图比对 [A04] 判定"该更新期望还是判定为回归"。

**阶段三：演化场景下的质量评估。**
采用 ReproBreak [C07] 作为定位符断裂修复评测基准、E2EBench [A06]/E2EGit [B30] 评估生成质量与真实演化覆盖，参考 [C05] 的演化质量评估框架与 Meta 的误报抑制门槛 [C03]，从功能覆盖率、修复正确率、误报率、CI 开销等维度综合评估。

**头号对标与基线**：A10（Playwright 自治修复）、UTFix（变更感知修复范式）、AutoE2E（E2E 生成 + 基准）、SymPrompt（回归场景提示策略）。

---

## 11 结论

本文系统综述了 2023–2026 年间 66 篇围绕 LLM 测试生成、变更感知测试演化、E2E/Web 测试生成与修复、测试稳定性、回归测试选择与变更影响分析的代表性文献。综述表明：LLM 已深度赋能测试生成与修复，变更感知范式日趋成熟，E2E 生成与修复也已起步并出现与 Playwright 一致的自治系统；但**"以 Code Diff 为驱动的 Playwright E2E 测试自动生成与修复"这一组合仍是明确的研究空白**。现有三条技术链路（变更感知生成、E2E 生成、测试修复）虽各自成熟却未在 E2E 层面打通，为本课题留出了清晰且有价值的创新空间。本文提出的"Diff 定位→E2E 生成/修复→演化下质量评估"框架及配套基准选型，可作为后续方法设计与实验评估的起点。

---

## 参考文献

> 编号对应本课题文献库（A 核心 / B 支撑 / C 前沿），引用数为 Semantic Scholar 2026-06 口径。完整原文与 PDF 链接见《文献来源与下载链接总表.md》。

### A 类：核心文献
- [A01] UTFix: Change Aware Unit Test Repairing using LLM. Proc. ACM PL (OOPSLA) 2025.
- [A02] Code-Aware Prompting (SymPrompt): Coverage-Guided Test Generation in Regression Setting. Proc. ACM SE (FSE) 2024.
- [A03] Can LLM Generate Regression Tests for Software Commits? arXiv 2025.
- [A04] Testora: Using Natural Language Intent to Detect Behavioral Regressions. arXiv 2025.
- [A05] AI for Context-Aware Visual Change Detection in Software Test Automation. Progress in AI 2024.
- [A06] Feature-Driven End-to-End Test Generation (AutoE2E). ICSE 2025.
- [A07] Automated Web Application Testing: E2E Test Case Generation with LLMs and Screen Transition Graphs. arXiv 2025.
- [A08] Scenario-Guided LLM-based Mobile App GUI Testing. ACM TOSEM 2025.
- [A09] GenIA-E2ETest: A Generative AI-Based Approach for E2E Test Automation. SBES 2025.
- [A10] Practical Limits of Autonomous Test Repair: A Multi-Agent Case Study (LLM+LangGraph+Playwright). arXiv 2026.
- [A11] Automated Test Case Repair Using Language Models (TaRGET). IEEE TSE 2025.
- [A12] Semantic Test Repair for Web Applications. ESEC/FSE 2023.
- [A13] WEFix: Automatic Generation of Explicit Waits for Web E2E Flaky Tests. WWW 2024.
- [A14] Fix the Tests: Augmenting LLMs to Repair Test Cases with Static Collector and Neural Reranker. ISSRE 2024.
- [A15] Unit Test Update through LLM-Driven Context Collection and Error-Type-Aware Refinement. ASE 2025.
- [A16] Understanding & Enhancing Attribute Prioritization in Fixing Web UI Tests with LLMs. ICST 2025.
- [A17] Time-based Repair for Asynchronous Wait Flaky Tests in Web Testing. arXiv 2023.
- [A18] Towards Predicting Fragility in End-to-End Web Tests. EASE 2024.

### B 类：支撑文献
- [B01] Efficient Incremental Code Coverage Analysis for Regression Test Suites (iJaCoCo). ASE 2024.
- [B02] More Precise Regression Test Selection via Reasoning about Semantics-Modifying Changes. ISSTA 2023.
- [B03] Test Selection for Unified Regression Testing (uRTS). ICSE 2023.
- [B04] Change Impact Analysis in Microservice Systems: A Systematic Literature Review. JSS 2024.
- [B05] Datalog-Based Language-Agnostic Change Impact Analysis for Microservices (Microscope). ICSE 2025.
- [B06] Hybrid Regression Test Selection by Integrating File and Method Dependences. ASE 2024.
- [B07] Practical Pipeline-Aware Regression Test Optimization for CI. ICST 2025.
- [B08] Regression Test Selection in Test-Driven Development (RichTest). Autom. Softw. Eng. 2023.
- [B09] An Empirical Evaluation of Using LLMs for Automated Unit Test Generation. IEEE TSE 2023.
- [B10] CodaMosa: Escaping Coverage Plateaus in Test Generation with Pre-trained LLMs. ICSE 2023.
- [B11] ChatUniTest: A Framework for LLM-Based Test Generation. FSE Companion 2023.
- [B12] Effective Test Generation Using Pre-trained LLMs and Mutation Testing. Inf. & Softw. Tech. 2023.
- [B13] ChatGPT vs SBST: A Comparative Assessment of Unit Test Suite Generation. IEEE TSE 2023.
- [B14] CAT-LM: Training Language Models on Aligned Code And Tests. ASE 2023.
- [B15] SWT-Bench: Testing and Validating Real-World Bug-Fixes with Code Agents. NeurIPS 2024.
- [B16] Automated Unit Test Improvement using LLMs at Meta (TestGen-LLM). FSE Companion 2024.
- [B17] LLM for Test Script Generation and Migration. QRS 2023.
- [B18] GAMMA: Revisiting Template-Based APR via Mask Prediction. ASE 2023.
- [B19] FlakyFix: LLMs for Predicting Flaky Test Fix Categories and Test Code Repair. IEEE TSE 2024.
- [B20] StubCoder: Automated Generation and Repair of Stub Code for Mock Objects. ACM TOSEM 2023.
- [B21] Effortless Test Maintenance: A Critical Review of Self-Healing Frameworks. IJRASET 2023.
- [B22] A Multi-Year Grey Literature Review on AI-assisted Test Automation. Inf. & Softw. Tech. 2024.
- [B23] Exploring the Integration of LLMs in Industrial Test Maintenance Processes. arXiv 2024.
- [B24] Software Testing With Large Language Models: Survey, Landscape, and Vision. IEEE TSE 2023.
- [B25] A Survey on Web Testing: On the Rise of AI and Applications in Industry. arXiv 2025.
- [B26] Challenges of End-to-End Testing with Selenium WebDriver: A Survey. ICST 2023.
- [B27] Vision-Based Mobile App GUI Testing: A Survey. ACM Comput. Surv. 2023.
- [B28] A Comprehensive Survey of AI-Driven Advancements in APR and Code Generation. arXiv 2024.
- [B29] Observation-Based Unit Test Generation at Meta (TestGen). FSE Companion 2024.
- [B30] E2EGit: A Dataset of End-to-End Web Tests in Open Source Projects. MSR 2025.

### C 类：最新前沿
- [C01] Change And Cover (ChaCo): Last-Mile, PR-Based Regression Test Augmentation. arXiv 2026.
- [C02] PR-Aware Automated Unit Test Generation: Challenges and Opportunities. arXiv 2026.
- [C03] Just-in-Time Catching Test Generation at Meta. arXiv 2026.
- [C04] TestWeaver: Execution-aware, Feedback-driven Regression Testing Generation with LLMs. arXiv 2025.
- [C05] Evaluating LLM-Based Test Generation Under Software Evolution. arXiv 2026.
- [C06] Code-A1: Adversarial Evolving of Code LLM and Test LLM via RL. arXiv 2026.
- [C07] ReproBreak: A Dataset of Reproducible Web Locator Breaks. arXiv 2026.
- [C08] FlakyGuard: Automatically Fixing Flaky Tests at Industry Scale. ASE 2025.
- [C09] YATE: The Role of Test Repair in LLM-Based Unit Test Generation. arXiv 2025.
- [C10] Hierarchical Knowledge Injection for Improving LLM-based Program Repair. ASE 2025.
- [C11] VISCA: Inferring Component Abstractions for Automated End-to-End Testing. arXiv 2025.
- [C12] ViMoTest: Specify ViewModel-Based GUI Test Scenarios using Projectional Editing. ICSCT 2025.
- [C13] Automated Functional Testing for Malleable Mobile Application Driven from User Intent. arXiv 2026.
- [C14] Android Instrumentation Testing in CI: Practices, Patterns, and Performance. arXiv 2026.
- [C15] Do Autonomous Agents Contribute Test Code? A Study of Tests in Agentic Pull Requests. arXiv 2026.
- [C16] Names Are All You Need (NameRTS): Regression Test Selection for Python. arXiv 2026.
- [C17] Formalizing Regression Testing for Agile and CI Environments. arXiv 2025.
- [C18] Understanding Automated Program Repair Agents Through the Lens of Traceability. arXiv 2025.
