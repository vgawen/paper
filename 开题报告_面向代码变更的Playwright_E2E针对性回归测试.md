# 硕士学位论文开题报告

> 定位：面向 CI/CD 下的 Web 应用演化，研究"**一次代码变更发生后，如何只运行与该变更强相关的一小组 Playwright E2E 测试，并保证这组测试可运行、覆盖变化、不过时**"。方法包含三个环节——已有测试**选择**、缺口**补充生成**、受影响测试**修复**；其中**选择与生成为深做主线，修复为保障已选测试可复用的支撑环节，过时/回归判定为轻量环节**。
> 历史版本：综合版《…自动生成与修复方法研究》保留备查。

---

## 一、课题名称（论文题目）

**面向代码变更的 Playwright 端到端针对性回归测试方法研究**

副标题/正文释义：基于 Code Diff 的 targeted E2E 回归测试，涵盖测试选择、补充生成与修复。

英文题目：*Change-Aware Targeted Regression Testing for Playwright End-to-End Tests: Selection, Generation and Repair*

---

## 二、研究背景与意义（问题提出）

### 2.1 研究背景

现代 Web 应用在敏捷开发与持续集成/持续交付（CI/CD）下高频演进，代码以小颗粒度的提交（commit）与合并请求（PR）持续变化。端到端（E2E）测试模拟真实用户在浏览器中的完整业务流程，是保障 Web 应用质量的关键，Playwright 已成为主流的跨浏览器 E2E 框架。

然而 E2E 测试**执行昂贵、维护负担重、稳定性差**：全量 E2E 套件在每次提交上运行耗时长、占用大量 CI 资源；测试脚本通过定位符（locator）与页面交互，应用一次结构性变更即可能使大量脚本断裂（locator break）或断言失配，即便功能未变。研究显示传统定位符可致多达 75% 的 Selenium 测试文件每 9 次提交需变更，脆弱定位符引发了 73.6% 的测试断裂失败；Meta 亦披露 14%–22% 的软件失效源于过时测试；实证研究表明 E2E 测试在 CI 中采用率偏低（某 4518 仓库研究中仅约 10.6%）。

工程上真正的痛点因此是：**CI 里不想全量跑昂贵的 E2E，而是想只跑与本次 diff 强相关的一小组 E2E，并保证这组测试可执行、覆盖变化、不过时。** LLM 在代码理解与生成上的突破，为"变更感知（Code Diff / Commit / PR）的 E2E 测试选择、生成与修复"提供了新手段。

### 2.2 问题提出

围绕"面向一次 Code Diff，产出一组可运行、相关、不过时的 targeted Playwright E2E 测试集"，存在以下空白与痛点：

1. **变更感知测试工作几乎全部落点单元/回归测试**（ChaCo、Can-LLM-commits、UTFix、TaRGET），**E2E 层缺乏"diff → 受影响 E2E 用例选择 / 缺口生成 / 失效修复"的系统方法**。
2. **E2E 生成与代码变更解耦**：AutoE2E、屏幕跳转图、VISCA 等均"从需求/页面"出发全量生成，**未以 diff 为触发与约束**定向覆盖本次变更。
3. **E2E 级 RTS 缺位**：经典回归测试选择多停留在代码/单元层（iJaCoCo、语义修改推理、NameRTS），**缺少"哪些已有 E2E 用例覆盖本次 diff"的可操作方法**。
4. **已有相关测试常因 UI/locator/断言变化而过时**，若不修复则"相关测试因过时而无法使用"，targeted 集不可用。
5. **直接面向 Playwright 的方法与评测资源稀缺**：直到 2026 年才出现 ReproBreak 这类面向 Cypress/Playwright 的可复现定位符断裂数据集。

### 2.3 研究意义

- **理论意义**：把回归测试选择（RTS）、变更感知测试生成与测试修复三条脉络在 E2E 层统一为"变更驱动的针对性回归测试"框架。
- **工程意义**：面向 Playwright 主流框架，提供可嵌入 CI/CD 的"针对 diff 的 targeted E2E 测试集"自动化方案，显著降低 E2E 执行开销、提升测试与生产代码的同步性与可用性。

---

## 三、国内外研究现状

### 3.1 回归测试选择（RTS）与变更影响分析（CIA）——"选择"环节基础
iJaCoCo（ASE 2024）、*More Precise RTS*（ISSTA 2023）、*Unified Regression Testing*（ICSE 2023）、*Hybrid RTS*（ASE 2024）、Pipeline-Aware RTS（ICST 2025）、NameRTS（2026）、Datalog-Based CIA（ICSE 2025）确立"变更→受影响测试"范式，但**均为代码/单元层，未解决 E2E 用例与源码变更的关联选择**。

### 3.2 变更感知（Code Diff / Commit / PR）的测试生成——"生成"环节前沿
*Can LLM Generate Regression Tests for Commits?*（2025）、ChaCo（2026）、*PR-Aware Unit Test Generation*（2026）、Just-in-Time Catching@Meta（2026）确立"PR/commit 变更行→定向生成"范式，但**落点几乎全在单元/回归测试**。

### 3.3 E2E / Web 测试自动生成——技术栈相关
AutoE2E（ICSE 2025，特性驱动 + E2EBench）、*Screen Transition Graphs*（2025）、VISCA（2025）、GenIA-E2ETest（SBES 2025）证明 LLM 生成 E2E 可行，但**均未以 Code Diff 为触发与约束**；SymPrompt（FSE 2024）提供回归场景覆盖率导向提示。

### 3.4 E2E / Web 测试修复与稳定性——"修复"环节（本课题支撑模块）
*Practical Limits of Autonomous Test Repair*（2026，LLM+LangGraph+**Playwright**+RAG）、Semantic Test Repair（ESEC/FSE 2023）、WEFix（WWW 2024）、*Time-based Repair*（2023）、*Fixing Web UI Tests with LLMs*（ICST 2025）、UTFix（OOPSLA 2025）、TaRGET（IEEE TSE 2025）、*Fix the Tests*（ISSRE 2024）提供修复范式，但**未把引发失效的源码 diff 显式作为修复上下文，也未服务于 targeted 测试集可用性目标**。

### 3.5 评测资源（开源数据可得性，已核实）
- **E2EGit（MSR 2025）**：472 个真实 GitHub 仓库、43,670 个 Web GUI 测试，是构建"针对性 E2E 测试选择/生成"数据集的真实语料库。
- **ReproBreak（2026）**：359 仓库识别含定位符变更的 commit，4 个项目复现 **449 个可复现 locator break** + 复现脚本，开源——**专用于"修复"子实验**。
- E2EBench 支撑生成评测。

### 3.6 存在问题（研究空白）
1. 变更感知测试**落点几乎全在单元/回归层，E2E 层选择/生成/修复闭环空白**。
2. E2E 生成**与 diff 解耦**。
3. **E2E 级 RTS 缺位**。
4. 已有相关测试**易过时**，缺乏服务于 targeted 集可用性的修复。

### 3.7 未来方向
1. 将 RTS/CIA 从代码层延伸到 **E2E 用例层**（基于 E2E→源码覆盖映射做选择）。
2. 以 Code Diff 为触发与约束**定向生成**覆盖变更新行为的 E2E 用例。
3. 把修复**作为 targeted 回归测试的支撑模块**。

---

## 四、研究目标与研究内容

### 4.1 研究目标
面向 Web 应用演化，提出并实现一套**以 Code Diff 驱动、产出"针对本次变更的可运行 targeted Playwright E2E 测试集"的方法与原型工具（暂名 DiffE2E）**：对一次 commit/PR，（1）**选择**可能覆盖该变更的已有 E2E 用例；（2）对因变更而**失效（过时）**的已选用例做 locator/断言**修复**以恢复可用性，疑似真回归则报告；（3）对变更引入但无覆盖的缺口，以 diff 为约束**补充生成**新 targeted 用例；（4）输出低执行开销、高变更相关性的 E2E 测试集。

### 4.2 研究内容

**内容一：Code Diff 驱动的 E2E 测试选择（深做，核心）**
在 `V_old` 上构建"已有 E2E 用例 → 所覆盖源码（文件/路由/组件）"的覆盖映射（运行期覆盖插桩为主、静态启发式为辅）；将 commit/PR 变更文件集与映射求交，**选出可能覆盖本次变更的已有 Playwright 用例子集**。目标：在保持高变更覆盖能力的前提下显著减少执行开销。**选择只允许使用 `V_old` 覆盖映射与 diff，不得使用 `V_new` 信息（避免泄漏）。**

**内容二：Code Diff 约束的 E2E 缺口补充生成（深做，核心）**
对变更涉及但现有 E2E 未覆盖的源码/路由/页面识别为**覆盖缺口**，以 diff 为约束生成 Playwright 用例。**生成目标收窄为可验证的三条**：(a) 触达 diff 相关页面/路由/组件；(b) 能完成关键用户路径；(c) 至少包含可解释的 UI 断言（文本/URL/可见性/role）。目标：相比无 diff 约束生成，提升用例的**变更相关性与可执行率**，并以人工抽检评估**语义有效率**（避免"可执行≠正确测试"）。

**内容三：受影响已有测试的失效修复（中等做，支撑模块）**
所选用例若因 UI/locator/断言变化失效，需先修复以保证 targeted 集可用：修复上下文 = 失效用例 + 失败 trace + 失效时刻 DOM 候选 + **引发失效的 Code Diff 切片（分层 L1/L2/L3）**；定位符断裂用多属性候选匹配 + LLM 重写为 Playwright 语义定位；断言失配结合变更与新页面状态更新期望；Playwright 真实执行验证 + 解释一致性校验抑制幻觉。修复价值以闭环指标 **TargetedSetUsability** 体现（见 5.3）。

**内容四：变更过时判定与疑似回归报告（轻做）**
仅判定三类明确情形：`结构性改动行为不变`（→修脚本）、`明确期望变化`（文本/URL/可见性，→改断言）、`疑似真回归`（→报告，不强修）；**不声称理解复杂业务意图**；质量在小规模人工标注集上以双人标注 + Cohen's κ + 仲裁评估。

> 全流程闭环：`Code Diff → 变更影响分析 → 已有 E2E 选择 → 运行 → (通过入集 / 失败→过时则修复入集，否则报告回归) → 基于"已有覆盖+已选/已修结果"统一做覆盖缺口分析 → diff 约束补充生成 → 输出 targeted set`。

---

## 五、研究方案与技术路线

### 5.1 总体技术路线

```text
                         Code Diff (V_old→V_new)
                                │
                                ▼
                M1 变更影响分析（文件/路由/组件/DOM/API）
                                │
            ┌───────────────────┴───────────────────┐
            ▼                                         ▼
  M2 已有 E2E 测试选择                      M0 覆盖映射(E2E→源码, 仅 V_old)
  （diff ∩ 覆盖映射 → 相关用例子集）
            │
            ▼
   M3 运行所选用例 ──通过──▶ 加入 targeted set
            │
          失败 → M4 过时判定 ──疑似回归──▶ 报告（不强修）
            │ 过时（locator/断言）
            ▼
   M5 修复（语义定位/断言更新）──M8 验证通过──▶ 加入 targeted set
            │
            ▼
   M6 覆盖缺口分析（基于"已有覆盖 + 已选/已修结果"统一计算）
            │
            ▼
   M7 diff 约束缺口生成 ──M8 验证──▶ 加入
            │
            ▼
   M9 输出：targeted E2E 测试集 + 执行/覆盖/成本报告
```

### 5.2 关键技术方案

- **E2E→源码覆盖映射（M0）**：对被测应用做覆盖插桩，离线记录每个 E2E 用例触达的源码文件/函数/路由，建映射表；增量更新（iJaCoCo 思想）。**实验主范围限定为前端 Web 项目、Playwright + Chromium、可插桩的 JS/TS 应用**；后端/API diff 作为扩展或用路由/API 启发式兜底，不承诺同等效果。
- **选择（M2）**：`diff 变更文件/符号 ∩ 覆盖映射 → 相关用例`；无覆盖数据时用路由/组件静态启发式兜底。
- **Semantic UI Diff（C1，选择/修复/生成的共用桥）**：用 JSX/模板 AST 抽取语义 UI 节点（tag/text/handler/testId/role/aria/href），对 base/head 两版做 `ADD/MODIFY/REMOVE` 差异，并与 base/head 运行时 DOM snapshot 互补消歧。该差异**同时驱动三件事**：选择（变更 UI 节点 ↔ 测试 locator 匹配，一条免 sourcemap、对 E2E 更自然的关联信号）、修复（失效 locator → 结构邻居候选）、生成（新增 UI 无测试触达 → 覆盖缺口）。**已在真实 React+JSX 项目上验证可计算**（见 7.6）。
- **DiffSlice 因果关联（分层降级）**：L1 文件级（兜底）/ L2 组件路由级 / L3 元素属性·文本·role 级（最有用但在 React/Vue/构建产物/动态 DOM 下可能失败）；取能达到的最细层，并把"diff→失效关联成功率"作为实验统计项。
- **生成（M7）/修复（M5）/验证迭代（M8）**：见研究内容；所有修复补丁与生成用例经 Playwright 真实执行验证，失败反馈迭代（上限 N_iter）。

### 5.3 评测要点（详见配套《实验方案与系统设计_DiffE2E》）

- **受影响测试 oracle（ground truth）**：在 `V_new` 上**全量运行并采集覆盖**，凡触达 diff 行/路由/组件的测试构成"受影响测试 oracle"；选择器只用 `V_old` 覆盖映射与 diff，杜绝信息泄漏。
- **指标拆分**：
  - 选择阶段：`Safety`（受影响 oracle 的召回）、`Precision`（已选中确为受影响的比例）**评价选择是否选对**；`SelectionChangeCoverage` = **仅已选已有测试中无需修复即可在 V_new 通过者**触达 diff 的比例，**评价"无需修复即可执行的已选测试覆盖能力"**（因 locator/断言过时而失败的相关测试不在此体现，另由 TargetedSetUsability 反映）；`Reduction` 为执行开销下降。
  - 闭环阶段：`FinalChangeCoverage` = 选择 + 修复 + 生成后的最终变更覆盖。
- **TargetedSetUsability** = (selected_pass + repaired_pass) / |Sel ∩ Affected|，即"可运行的已选相关测试数 / 初始选中的相关测试数"；**生成用例不计入分母**（避免与 FinalChangeCoverage 混淆），体现修复服务于 targeted regression testing。
- **生成有效性**：变更相关性、可执行率 + 人工抽检的**语义有效率**。

---

## 六、创新点分析

> 表述从稳，避免"首个"等易被文献反例击穿的措辞。

1. **Code Diff 驱动的 E2E 级针对性回归测试方法**：将回归测试选择从代码/单元层推进到 Playwright E2E 用例层，基于"E2E→源码覆盖映射"按 diff 选出相关用例，降低全量 E2E 执行开销。
2. **以 Code Diff 为约束的 E2E 缺口补充生成**：相比"从需求/页面"出发的全量生成，以变更为触发与约束定向覆盖新行为，提升变更相关性与可执行率。
3. **面向变更的 E2E 测试维护闭环**：把修复从独立任务转化为"保障 targeted 回归测试集可复用"的支撑模块（以 TargetedSetUsability 量化），并将引发失效的 Code Diff 切片纳入修复上下文。
4. **可嵌入 CI/CD 的低开销、可解释 targeted E2E 方案与配套评测协议**（含无泄漏 oracle、指标拆分；ReproBreak 修复子实验 + E2EGit 自建针对性测试数据集）。

> **贯穿性机制（C1）**：以 **Semantic UI Diff** 作为"代码变更 → UI 语义变化"的中间表示，统一驱动选择、修复与生成。这使本方法**不止是把动态 RTS 套到 E2E**：覆盖映射回答"哪些已有测试碰了变更"，而 Semantic UI Diff 进一步提供覆盖之外、免 sourcemap 的"变更 UI ↔ 测试"关联，并把同一份差异复用到修复与生成，构成闭环的连接件。

> **更大的系统蓝图（研究展望，非本论文实现范围）**：可将 diff 投影到"异构影响图"（component/route/API/state/feature flag/permission/async event/cache/capability 多类节点）再检索测试（暂名 Diff2E2E-TIA）。但开源项目普遍缺少后端可观测性、CI 历史、flag/权限运行时日志等数据源，且体量超出硕士工作量。**本论文遵循"框架画大、实现画准"：实现与评测聚焦可自产数据的核心切片（E2E→源码覆盖映射 + Semantic UI Diff + 选择/生成/修复闭环），其余层作为未来工作。**

---

## 七、可行性分析

### 7.1 理论可行性
RTS/CIA、变更感知生成、E2E 修复三脉络均有成熟范式可迁移与组合，在 E2E 层打通逻辑自洽、空白明确。

### 7.2 技术可行性与边界
Playwright 提供执行、trace、截图、语义定位与覆盖采集 API；覆盖插桩（istanbul/nyc、Playwright coverage）对**前端 JS/TS、Chromium** 可行。**明确边界**：后端 API、动态 import、构建后 source map、跨浏览器覆盖存在不稳定，故实验主范围限定前端可插桩 JS/TS 项目，其余作扩展或静态兜底。

### 7.3 数据与评测可行性（含关键风险，已核实）
- **修复子实验**：ReproBreak 开源、449 个可复现 locator break + 复现脚本，现成可用。
- **泛化与真实语料**：E2EGit 开源（472 仓库 / 43,670 Web GUI 测试）。
- ⚠️ **最大数据风险**：主线"选择/生成"**无开箱基准**，需**自建针对性 E2E 数据集**——从 E2EGit 的 Playwright 项目挖掘 commit 历史，构造"commit → 变更文件 → 受影响/失效/新增 E2E"样本并采集覆盖映射。应对：① 先在 2–3 个结构清晰、commit 历史规范的可插桩 Playwright 项目上构建小而可靠数据集；② 覆盖映射自动插桩采集；③ 不可得时退化为路由/组件静态启发式并如实报告局限。

### 7.4 工作量与条件可行性
按深度分配（选择/生成深做、修复中等、判定轻做）控制范围；修复子实验有现成基准，主线数据自建但规模可控；单个研究生约 1 年内可完成原型与实验。已完成系统性文献调研（66 篇，全文已下载 61 篇）。

### 7.5 风险与应对
- **主线数据集自建成本高** → 小而可靠 + 自动插桩 + 静态兜底。
- **覆盖采集边界** → 限定前端 Chromium JS/TS 主范围，后端/API 作扩展。
- **DiffSlice→失效关联在动态 DOM 下不可靠** → L1/L2/L3 分层 + 关联成功率作统计项。
- **生成 oracle 问题** → 生成目标收窄三条 + 人工抽检语义有效率。
- **意图/过时判定易被质疑** → 限定明确可判范围 + 双人标注 + κ + 仲裁。
- **基线可复现性**（Practical Limits 预印本可能无代码）→ 修复侧以纯属性 self-healing、无 diff 纯 LLM 修复兜底。
- **范围偏大** → 裁剪优先级：保住"选择 + diff 约束生成"两个主结论（RQ1/RQ2）。


### 7.6 可行性预验证（已完成最小闭环）
已在受控 demo 与**真实开源项目**（`mxschmitt/playwright-test-coverage`：React 19 + Vite + Playwright + vite-plugin-istanbul）上验证两条核心机制：

- **闸门①（覆盖插桩）通过**：逐用例 istanbul 覆盖可稳定采集，并以**原始源码文件为键**归属，statement/function 级在不同用例间可区分。**已知约束**：插桩行号位于 JSX 转译后空间（文件 42 行、覆盖行号达 134）——**文件级（L1）归属无需任何映射；子文件级（L2/L3）须经 sourcemap 反映射**（被测项目已开 `build.sourcemap`，具备条件）。
- **闸门②（Semantic UI Diff）通过**：用 TypeScript 编译器 API 从真实 JSX 抽取语义 UI 节点并算出 `ADD/MODIFY/REMOVE`（含 href 变更、testId 新增的结构匹配）。**已知约束**：当某节点的**文本与 handler 同时改变**时，静态匹配退化为"删+增"而非"改"，需运行时 DOM 位置/邻域匹配消歧（即 C1 中静态+运行时互补的动因）。
- **RQ1 真实代码闭环**：以"UI 签名 ↔ 测试 locator"信号跑通——正确选中引用该 locator 的测试、给出修复候选、并把新增 UI 标为生成缺口。
- **不适配样本（已实测）**：`debs-obrien/playwright-movies-app`（Next.js+Redux）因应用源码为 submodule 未随浅克隆拉取、硬性依赖 auth 凭据与外部 API、且无覆盖接线，归入"需大量改造"类——印证 7.3 的数据可得性风险与筛选闸门。
- 复现与详情见《可行性验证报告》（`diffe2e/real/可行性验证报告.md`）。

---

## 八、研究计划与进度计划（约 12 个月）

| 阶段 | 时长 | 主要任务 | 阶段成果 |
|------|------|----------|----------|
| 第一阶段 | 第 1–2 月 | 精读对标；选 2–3 个可插桩 E2EGit Playwright 项目；搭覆盖插桩与 harness；复现 ReproBreak | 数据/环境就绪、问题刻画 |
| 第二阶段 | 第 3–4 月 | 内容一：覆盖映射 + diff 选择；构造 oracle；自建小规模针对性数据集；RQ1 | 选择模块 + 选择实验 |
| 第三阶段 | 第 5–7 月 | 内容二：缺口生成 + 验证迭代 + 人工抽检；RQ2 | 生成模块 + 主实验 |
| 第四阶段 | 第 8–9 月 | 内容三：修复（locator/断言）；ReproBreak 修复子实验 + TargetedSetUsability；RQ3 | 修复模块 + 闭环可用率 |
| 第五阶段 | 第 10 月 | 内容四：过时/回归判定（标注 + κ）；E2EGit 泛化与成本/CI 时延；RQ4 | 判定评估 + 成本/泛化 |
| 第六阶段 | 第 11–12 月 | 全实验整理、统计检验、画图、论文与投稿、开源数据/复现包 | 学位论文 + 投稿稿 + 开源仓库 |

---

## 九、预期成果

1. **方法与工具**：DiffE2E——Code Diff 驱动的 Playwright E2E 针对性测试选择、缺口生成与修复方法及可嵌入 CI/CD 的原型工具。
2. **学位论文**：一篇系统阐述方法、实现与评测的硕士学位论文。
3. **学术论文**：争取在软件工程会议/期刊（ICST、ICSME、SANER 或相关期刊/workshop）投稿 1 篇。
4. **数据与开源**：发布自建"针对性 E2E 测试"数据集与实验复现包，并在 ReproBreak/E2EGit 上给出可复现结果。
5. **实验结论**：量化给出 diff 驱动选择的执行开销下降与变更覆盖保持（SelectionChangeCoverage/Safety/Precision/Reduction）、diff 约束生成相对无约束的相关性/可执行率/语义有效率提升、修复对 TargetedSetUsability 的提升、以及成本与 CI 可集成性。

---

## 十、参考文献

[1] Efficient Incremental Code Coverage Analysis for Regression Test Suites (iJaCoCo). ASE, 2024. https://arxiv.org/abs/2410.21798

[2] More Precise Regression Test Selection via Reasoning about Semantics-Modifying Changes. ISSTA, 2023. https://doi.org/10.1145/3597926.3598086

[3] Test Selection for Unified Regression Testing. ICSE, 2023. https://doi.org/10.1109/ICSE48619.2023.00145

[4] Hybrid Regression Test Selection by Integrating File and Method Dependences. ASE, 2024. https://doi.org/10.1145/3691620.3695525

[5] Practical Pipeline-Aware Regression Test Optimization for CI. ICST, 2025. https://arxiv.org/abs/2501.11550

[6] Names Are All You Need (NameRTS): Effective and Safe Regression Test Selection for Python. arXiv:2605.25356, 2026. https://arxiv.org/abs/2605.25356

[7] Datalog-Based Language-Agnostic Change Impact Analysis for Microservices. ICSE, 2025. https://doi.org/10.1109/ICSE55347.2025.00115

[8] Change And Cover (ChaCo): Last-Mile, Pull Request-Based Regression Test Augmentation. arXiv:2601.10942, 2026. https://arxiv.org/abs/2601.10942

[9] Can LLM Generate Regression Tests for Software Commits? arXiv:2501.11086, 2025. https://arxiv.org/abs/2501.11086

[10] PR-Aware Automated Unit Test Generation: Challenges and Opportunities. arXiv:2605.25285, 2026. https://arxiv.org/abs/2605.25285

[11] Just-in-Time Catching Test Generation at Meta. arXiv:2601.22832, 2026. https://arxiv.org/abs/2601.22832

[12] Code-Aware Prompting (SymPrompt): Coverage-Guided Test Generation in Regression Setting using LLM. Proc. ACM Softw. Eng. (FSE), 2024. https://arxiv.org/abs/2402.00097

[13] Feature-Driven End-to-End Test Generation (AutoE2E). ICSE, 2025. https://arxiv.org/abs/2408.01894

[14] Automated Web Application Testing: E2E Test Case Generation with LLMs and Screen Transition Graphs. arXiv:2506.02529, 2025. https://arxiv.org/abs/2506.02529

[15] VISCA: Inferring Component Abstractions for Automated End-to-End Testing. arXiv:2506.04161, 2025. https://arxiv.org/abs/2506.04161

[16] GenIA-E2ETest: A Generative AI-Based Approach for End-to-End Test Automation. SBES, 2025. https://arxiv.org/abs/2510.01024

[17] ReproBreak: A Dataset of Reproducible Web Locator Breaks. arXiv:2605.12158, 2026. https://arxiv.org/abs/2605.12158

[18] E2EGit: A Dataset of End-to-End Web Tests in Open Source Projects. MSR, 2025. https://doi.org/10.1109/MSR66628.2025.00121

[19] Practical Limits of Autonomous Test Repair: A Multi-Agent Case Study (LLM + LangGraph + Playwright). arXiv:2605.01471, 2026. https://arxiv.org/abs/2605.01471

[20] Semantic Test Repair for Web Applications. ESEC/FSE, 2023. https://doi.org/10.1145/3611643.3616324

[21] WEFix: Automatic Generation of Explicit Waits for Web E2E Flaky Tests. The Web Conf (WWW), 2024. https://arxiv.org/abs/2402.09745

[22] Time-based Repair for Asynchronous Wait Flaky Tests in Web Testing. arXiv:2305.08592, 2023. https://arxiv.org/abs/2305.08592

[23] Understanding & Enhancing Attribute Prioritization in Fixing Web UI Tests with LLMs. ICST, 2025. https://arxiv.org/abs/2312.05778

[24] UTFix: Change Aware Unit Test Repairing using LLM. Proc. ACM Program. Lang. (OOPSLA), 2025. https://arxiv.org/abs/2503.14924

[25] Automated Test Case Repair Using Language Models (TaRGET). IEEE Transactions on Software Engineering, 2025. https://arxiv.org/abs/2401.06765

[26] Fix the Tests: Augmenting LLMs to Repair Test Cases with Static Collector and Neural Reranker. ISSRE, 2024. https://arxiv.org/abs/2407.03625

[27] Testora: Using Natural Language Intent to Detect Behavioral Regressions. arXiv:2503.18597, 2025. https://arxiv.org/abs/2503.18597

[28] Towards Predicting Fragility in End-to-End Web Tests. EASE, 2024. https://doi.org/10.1145/3661167.3661179

[29] An Empirical Evaluation of Using LLMs for Automated Unit Test Generation. IEEE Transactions on Software Engineering, 2023. https://arxiv.org/abs/2302.06527

[30] Software Testing With Large Language Models: Survey, Landscape, and Vision. IEEE Transactions on Software Engineering, 2023. https://arxiv.org/abs/2307.07221

[31] A Survey on Web Testing: On the Rise of AI and Applications in Industry. arXiv:2503.05378, 2025. https://arxiv.org/abs/2503.05378

[32] Challenges of End-to-End Testing with Selenium WebDriver and How to Face Them: A Survey. ICST, 2023. https://doi.org/10.1109/ICST57152.2023.00039

---

> 注：引用数与 venue 为 Semantic Scholar 口径（截至 2026 年 6 月），部分 2026 文献仍处预印本阶段。完整文献池（66 篇）见《文献分类整理_CodeDiff_Playwright_E2E.md》与《文献来源与下载链接总表.md》。
