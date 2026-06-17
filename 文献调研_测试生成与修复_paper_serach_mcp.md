# 文献调研：基于 Code Diff 的 Playwright E2E 测试自动生成与修复

> 课题：《基于 Code Diff 的 Playwright E2E 测试自动生成与修复方法研究》
> 检索范围：2023–2026 年，主题涵盖 test generation、test repair、基于 commit/diff 的测试演化与回归测试选择
> 数据来源：arXiv（检索）+ Semantic Scholar（引用数、期刊/会议）
> 引用数统计时间：2026 年 6 月（实时变动）
> ⭐ 标记表示与课题关联最强的论文

---

## 一、测试生成 (Test Generation)

| 题目 | 年份 | 引用数 | 摘要（中文概要） | 下载链接 | 期刊/会议 |
|---|---|---|---|---|---|
| ⭐ Feature-Driven End-to-End Test Generation (AutoE2E) | 2024 | 12 | 用 LLM 自动推断 Web 应用的功能特性并转化为可执行的、语义连贯的 E2E 测试用例；提出 E2EBench 基准衡量功能覆盖率，平均覆盖率达 79%，远超基线。 | https://arxiv.org/pdf/2408.01894 | ICSE 2025 |
| ⭐ Scenario-Guided LLM-based Mobile App GUI Testing | 2025 | 8 | 以"业务场景"为引导，用 LLM 驱动移动应用 GUI 自动测试，生成更符合真实用户操作流程的测试序列。 | https://arxiv.org/pdf/2506.05079 | ACM TOSEM 2025 |
| PopSweeper: Detecting & Resolving App-Blocking Pop-Ups for GUI Testing | 2024 | 3 | 自动检测并消除阻塞测试的弹窗，辅助移动 GUI 自动化测试持续执行（与处理 E2E 测试中干扰元素思路相近）。 | https://arxiv.org/pdf/2412.02933 | arXiv 预印本 |

---

## 二、测试修复 (Test Repair)

| 题目 | 年份 | 引用数 | 摘要（中文概要） | 下载链接 | 期刊/会议 |
|---|---|---|---|---|---|
| ⭐ WEFix: Automatic Generation of Explicit Waits for Web E2E Flaky Tests | 2024 | 10 | 针对 Web E2E 测试中由 UI 异步导致的 flaky，利用浏览器 UI 变化预测客户端执行，自动生成正确的等待(wait)修复代码；开销显著降低、修复正确率 98%。 | https://arxiv.org/pdf/2402.09745 | WWW (The Web Conf) 2024 |
| ⭐ Understanding & Enhancing Attribute Prioritization in Fixing Web UI Tests with LLMs（原名 Guiding ChatGPT to Fix Web UI Tests） | 2023 | 2 | Web UI 演化导致测试失效，先用已有技术做元素初匹配，再用 ChatGPT 做后续匹配与断点修复，并设计"解释一致性校验器"抑制幻觉。 | https://arxiv.org/pdf/2312.05778 | ICST 2025 |
| ⭐ Automated Test Case Repair Using Language Models (TaRGET) | 2024 | 22 | 将测试用例修复建模为"语言翻译"任务，微调代码 LLM；构建 TaRBench 基准（59 个开源项目、45,373 条失效测试修复），精确匹配率 66.1%。 | https://arxiv.org/pdf/2401.06765 | IEEE TSE 2025 |
| ⭐ Time-based Repair for Asynchronous Wait Flaky Tests in Web Testing | 2023 | 6 | 针对 Web 测试中异步等待造成的 flaky，提出基于时间的自动修复方法。 | https://arxiv.org/pdf/2305.08592 | arXiv 预印本 |
| FlakyFix: LLMs for Predicting Flaky Test Fix Categories and Test Code Repair | 2023 | 34 | 用 LLM 预测 flaky 测试的修复类别并自动修复测试代码。 | https://arxiv.org/pdf/2307.00012 | IEEE TSE 2024 |
| Hierarchical Knowledge Injection for Improving LLM-based Program Repair | 2025 | 4 | 分层注入"缺陷层/仓库层/项目层"上下文知识提升 LLM 程序修复效果，修复率提升至 79%。 | https://arxiv.org/pdf/2506.24015 | ASE 2025 |
| GAMMA: Revisiting Template-Based APR via Mask Prediction | 2023 | 84 | 将模板修复转为"完形填空(mask prediction)"，用预训练模型直接预测补丁代码，在 Defects4J 等基准显著超越 TBar/Recoder。 | https://arxiv.org/pdf/2309.09308 | ASE 2023 |
| SoK: Automated Vulnerability Repair: Methods, Tools, and Assessments | 2025 | 18 | 系统化梳理自动漏洞修复（分析/补丁生成/补丁验证三步），构建 Vul4C 基准并评测多款工具。 | https://arxiv.org/pdf/2506.11697 | USENIX Security 2025 |

---

## 三、基于 commit/diff 的变更感知测试生成与修复

| 题目 | 年份 | 引用数 | 摘要（中文概要） | 下载链接 | 期刊/会议 |
|---|---|---|---|---|---|
| ⭐⭐ UTFix: Change Aware Unit Test Repairing using LLM | 2025 | 14 | **最贴近课题**：当焦点方法(focal method)发生代码变更后，用 LLM 修复对应单元测试。借助静态切片、动态切片和失败信息上下文，解决"断言失败"与"覆盖率下降"两类问题；断言修复率 89.2%/60%。首个面向演化中 Python 项目单测修复的系统研究。 | https://arxiv.org/pdf/2503.14924 | Proc. ACM Program. Lang. (OOPSLA) 2025 |
| ⭐⭐ Code-Aware Prompting (SymPrompt): Coverage-Guided Test Generation in Regression Setting using LLM | 2024 | 160 | **高引经典**：面向回归测试场景，提出代码感知的多阶段提示策略，按被测方法执行路径拆解生成过程并注入类型/依赖上下文，使 LLM 无需额外训练即生成更高覆盖率测试；GPT-4 覆盖率较基线提升 2 倍以上。 | https://arxiv.org/pdf/2402.00097 | Proc. ACM Softw. Eng. (FSE) 2024 |
| ⭐ AI for Context-Aware Visual Change Detection in Software Test Automation | 2024 | 2 | 用 YOLOv5 检测 UI 控件并构建图结构建模其空间/上下文关系，跨软件版本识别 UI 元素对应关系与"有意义的变更"，显著优于像素级/区域级基线——对 E2E 视觉/UI 变更检测有借鉴价值。 | https://arxiv.org/pdf/2405.00874 | Progress in Artificial Intelligence 2024 |
| ⭐ Code-A1: Adversarial Evolving of Code LLM and Test LLM via RL | 2026 | 3 | 对抗式协同进化框架：Code LLM 以"通过更多测试"为奖励、Test LLM 以"暴露更多缺陷"为奖励，分离架构避免自我合谋，可安全做白盒对抗测试生成。 | https://arxiv.org/pdf/2603.15611 | arXiv 预印本 |

---

## 四、回归测试选择 / 优化 / 覆盖率

| 题目 | 年份 | 引用数 | 摘要（中文概要） | 下载链接 | 期刊/会议 |
|---|---|---|---|---|---|
| ⭐ Efficient Incremental Code Coverage Analysis for Regression Test Suites (iJaCoCo) | 2024 | 1 | 首个"增量代码覆盖率分析"技术：仅执行受代码变更影响的最小测试子集来更新覆盖率数据，弥补 RTS 与覆盖率分析不兼容的问题；基于 Ekstazi+JaCoCo，22 个仓库 1122 个版本上平均提速 1.86×、最高 8.2×。 | https://arxiv.org/pdf/2410.21798 | ASE 2024 |
| Practical Pipeline-Aware Regression Test Optimization for CI | 2025 | 4 | 面向大型多语言单体仓库的轻量级、流水线感知回归测试优化：用语言无关特征训练强化学习模型，区分 pre-submit（优先失败用例）与 post-submit（优先 pass↔fail 状态翻转）目标。 | https://arxiv.org/pdf/2501.11550 | ICST 2025 |
| Formalizing Regression Testing for Agile and CI Environments | 2025 | 0 | 将敏捷/CI 下的"持续回归测试"形式化为按时间排序的构建链，并定义两次构建间的"回归测试窗口"（有限时间预算）；退化到双版本即经典 retest-all，证明了健全性与完备性。 | https://arxiv.org/pdf/2511.02810 | arXiv 预印本 |

---

## 五、测试用例优先级与 CI 测试实践

| 题目 | 年份 | 引用数 | 摘要（中文概要） | 下载链接 | 期刊/会议 |
|---|---|---|---|---|---|
| Towards Explainable Test Case Prioritisation with Learning-to-Rank Models | 2023 | 4 | 探讨用 Learning-to-Rank 做回归测试用例优先级排序时的可解释性问题（全局模型级与局部结果级），并初步实验分析解释的相似性。 | https://arxiv.org/pdf/2405.13786 | ICSTW 2023 |
| Do Autonomous Agents Contribute Test Code? A Study of Tests in Agentic Pull Requests | 2026 | 2 | 基于 AIDev 数据集的实证研究：分析 AI 编码 Agent 提交的 PR 中包含测试代码的频率、引入时机及与无测试 PR 在体量/周转/合并率上的差异。 | https://arxiv.org/pdf/2601.03556 | arXiv 预印本 |
| Android Instrumentation Testing in CI: Practices, Patterns, and Performance | 2026 | 0 | 对 4518 个使用 CI 的开源 Android 仓库做实证研究，分析 E2E instrumentation 测试在 CI 中的采用率（仅约 10.6%）、演化方式及不同模拟器配置的可靠性与性能。 | https://arxiv.org/pdf/2604.03438 | arXiv 预印本 |

---

## 六、综述与背景 (Survey)

| 题目 | 年份 | 引用数 | 摘要（中文概要） | 下载链接 | 期刊/会议 |
|---|---|---|---|---|---|
| ⭐ A Survey on Web Testing: On the Rise of AI and Applications in Industry | 2025 | 7 | 系统综述 Web 测试领域，重点关注 AI（尤其 LLM）在 Web 测试中的兴起及工业应用，可作为课题背景与 Related Work。 | https://arxiv.org/pdf/2503.05378 | arXiv 预印本 |
| A Comprehensive Survey of AI-Driven Advancements in Automated Program Repair and Code Generation | 2024 | 10 | 综述 27 篇近期工作，分自动程序修复(APR)与代码生成两大方向梳理 LLM 应用趋势。 | https://arxiv.org/pdf/2411.07586 | arXiv 预印本 |
| Vision-Based Mobile App GUI Testing: A Survey | 2023 | 23 | 综述基于视觉的移动应用 GUI 测试方法。 | https://arxiv.org/pdf/2310.13518 | ACM Computing Surveys 2023 |

---

## 七、总结与对课题的启示

1. **最值得精读的核心论文**
   - **UTFix**（2503.14924）：正是"代码变更 → 测试修复"，其静态/动态切片上下文 + LLM 修复的思路可直接迁移到 Playwright E2E + Code Diff 的修复设计。
   - **Code-Aware Prompting / SymPrompt**（2402.00097，160 引）：回归场景下覆盖率导向的测试生成，执行路径感知提示策略值得借鉴到 E2E 用例生成。
   - **WEFix / Time-based Repair**：针对 Web E2E flaky（异步等待）的自动修复，与 Playwright 测试稳定性问题高度相关。
   - **AutoE2E**：LLM 驱动的 Web E2E 测试生成代表作 + E2EBench 基准。

2. **工程支撑方向**
   - **iJaCoCo / Pipeline-Aware RTS**：提供"如何用 diff 精准定位受影响测试"的工程基础，可支撑"基于 Code Diff 决定生成/修复哪些 E2E 用例"的设计。

3. **创新空白点（重要）**
   - 两轮检索（共约 25 篇）中**未发现专门针对 Playwright、或直接以 Code Diff 驱动 Web E2E 测试自动生成/修复**的工作。现有工作多集中在单元测试（UTFix）、通用 Web UI 测试修复、或移动 GUI 测试，**"Code Diff + Playwright + E2E 生成与修复"的组合是明确的研究空白**，可作为课题创新性的有力论证。
