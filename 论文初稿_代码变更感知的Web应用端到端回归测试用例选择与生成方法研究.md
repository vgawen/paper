# 代码变更感知的 Web 应用端到端回归测试用例选择与生成方法研究

> **论文初稿（v0.1）**
>
> 编写约定：本稿基于受控主体、真实项目 replay、真实 LLM 与 ReproBreak 结果撰写主体内容，所有数字均来自仓库实际产物（`diffe2e/experiments/out/`、`diffe2e/realproj/results/`）。凡仍需补充的数据项必须醒目标注，绝不以合成数字冒充真实结论。
>
> 方法工具无关：定位器、覆盖映射与 UI 语义抽象均不绑定具体框架；Playwright 仅为实现实例，方法同样适用于 Selenium / Cypress。

---

## 摘要

现代 Web 项目提交频繁，持续集成（CI）中每次都全量运行端到端（E2E）测试成本高昂；但若人工挑选少跑，又容易漏掉受本次代码变更影响的用例。与此同时，新增页面、路由或交互常常没有对应 E2E 覆盖，使回归测试既"跑得多"又"补得慢"。本文研究**代码变更感知的 Web 应用端到端回归测试用例选择与生成方法**：给定一次代码变更（diff），围绕两个核心目标自动构造 targeted E2E 测试集——从既有测试中安全选择受影响用例，并对既有测试覆盖不到的新变化进行 diff 约束生成。测试修复作为闭环支撑能力，用于提升选中失效用例的可用性并量化真实测试演化难度，而非本文主创新点。

方法的核心是一个持久化、可增量维护的**测试↔代码映射器**（带类型的二部索引），以及一个把源码层 UI 变更对应到测试定位器、断言和新增交互的 **Semantic UI Diff**，二者作为"源码 diff ↔ 浏览器操作"的语义桥，支撑"选择→缺口分析→生成"主链路，并在运行阶段提供轻量修复锚点。针对回归测试选择的核心诉求"召回不可妥协"，本文给出与选择器无关的真正受影响集 `A*` 定义、条件安全命题及其证明，并用**非循环的结果差异 oracle** 经验验证；针对测试间共享状态引发的副作用，给出状态依赖闭包及其安全性命题。针对生成质量，本文引入可执行率、变更相关率、版本差分敏感性与变异杀伤等自动指标，避免只以"能运行"衡量生成用例。

在一个含 6+ 路由、共享工具、25 个真实 git 提交、24 个变更过渡的受控被测应用上，本方法在 Safety=1.0（不漏选）的前提下达到 Reduction=0.625、Precision=1.0，是唯一兼顾安全与高缩减的方法；非循环结果差异 oracle 与变异压力测试均给出 SafetyEmp=1.0、0 漏选；副作用场景下经典文件级覆盖选择导致判定 pass→fail 翻转（不保真），状态闭包恢复保真。在 2 个真实开源 Playwright 项目（actual-budget、mermaid-live-editor，共 14 个稳定过渡，经 CDP 覆盖注入）上完成多 commit replay，dual 均达 Safety=1.0、Precision=1.0，并实证了 UI 信号臂"稀疏触发、高精度"的互补性。真实 DeepSeek 生成对照显示，diff 约束臂在 3 个缺口上可执行率、变更相关率、版本敏感率与自动语义有效率均为 1.0，明显优于无 diff 基线。真实 wall-clock 计时显示，cand_coverage 中用例数减少 66.7%，计入 0.12s 选择开销后 NetSaving 为 5.0%，说明用例数量缩减不能直接等同于 CI 时间收益；actual_desktop 的空选集过渡可避免约 111s 全量执行。作为闭环支撑和边界分析，在 ReproBreak 的 9604 条真实定位器断裂上，本文量化了 Semantic UI Diff 的语义可达性（12.2%）与确定性改写器在已知信号下的精确重建上界（574/578=99.3%）；端到端无泄漏修复中，规则臂为 14/414=3.38%，DeepSeek LLM 臂为 23/414=5.56%，说明真实 locator 修复仍是困难问题。

**关键词**：回归测试选择；端到端测试；代码变更感知；测试生成；测试修复；持续集成

---

## Abstract

Modern web projects commit frequently, making full end-to-end (E2E) test execution in CI prohibitively expensive; yet manually trimming the suite risks missing tests affected by a change, while newly added routes or interactions often lack E2E coverage. This thesis studies a **code-change-aware method for E2E regression test selection and generation** for web applications: given a code diff, it automatically yields a *targeted* E2E test set by safely selecting affected existing tests and generating diff-constrained tests for uncovered changes. Test repair is treated as a supporting capability in the closed loop, used to improve targeted-set usability and to quantify the difficulty of real test evolution rather than as the primary contribution.

The method centers on a persistent, incrementally maintained **test–code mapper** (a typed bipartite index) and a **Semantic UI Diff** that bridges source-level UI changes to test locators, assertions, and newly added interactions, supporting the main chain of *selection → gap analysis → generation* and providing lightweight repair anchors when selected tests become stale. To make "recall is non-negotiable" provable, we define a selector-independent truly-affected set `A*`, state and prove a conditional safety proposition, and validate it empirically with a **non-circular outcome-difference oracle**; for side effects via shared state, we give a state-dependency closure with an accompanying safety proposition. On a controlled subject (6+ routes, 25 commits, 24 transitions), the method achieves Reduction=0.625 and Precision=1.0 at Safety=1.0, with SafetyEmp=1.0 and zero misses under both the outcome-difference oracle and a mutation stress test. Real-project commit replay on two Playwright projects also reaches Safety=1.0 and Precision=1.0. For generation, a real DeepSeek comparison shows that the diff-constrained arm reaches 1.0 executable, change-relevant, change-sensitive, and automatically semantic-valid rates, clearly outperforming the no-diff baseline. Real wall-clock measurements show positive but non-linear savings: cand_coverage reduces test count by 66.7% but NetSaving is 5.0% after a 0.12s selection cost, while an empty-selected actual_desktop transition avoids about 111s of full-suite execution. As a supporting boundary study, ReproBreak shows that end-to-end locator repair remains difficult: 3.38% exact-match for rules and 5.56% for DeepSeek, far below the known-signal upper bound.

**Keywords**: regression test selection; end-to-end testing; code-change awareness; test generation; test repair; continuous integration

---

## 第 1 章 绪论

### 1.1 研究背景与意义

端到端（E2E）测试以浏览器真实驱动用户操作路径，是验证 Web 应用功能正确性的关键手段。然而在持续集成（CI）场景下，E2E 测试面临三重现实困境：

1. **全量运行代价高**：E2E 需启动浏览器、加载页面、等待异步状态收敛，单条用例的执行时间与 CI 资源开销远高于单元测试；项目提交频繁时，每次全量回归不可承受。
2. **人工选测不可靠**：开发者难以从一次 code diff 准确判断哪些 E2E 用例受影响——源码与浏览器行为之间隔着路由、组件、DOM、定位器多层抽象。
3. **测试易过时**：页面结构、可见文本、定位器或断言一旦变化，既有测试即可能失败；而失败未必意味着功能回归，也可能仅是测试脚本过时（stale）。

因此，工程上真正需要的不是"再生成一批测试"，而是一个面向 CI 的闭环：**对一次 code diff，只运行必要的 E2E；该修的修、该补的补，最后给出可执行的 targeted E2E 测试集。**

### 1.2 研究问题

本文以"给定一次代码变更，自动产出可执行的 targeted E2E 测试集"为总目标，围绕四个研究问题展开：

- **RQ1（选择：能否少跑但不漏？）** 基于"旧版本覆盖映射 + diff"能否最小且安全地选出受影响的 E2E 测试？
- **RQ2（生成：diff 约束是否更相关？）** 对覆盖缺口（新增路由 / 无对应测试），能否生成可执行、变更相关的用例，且优于无 diff 约束的生成基线？
- **RQ3（闭环支撑：修复能提供多大帮助、边界在哪里？）** 轻量修复能否提升 targeted set 的可用性？在真实 locator 断裂上，端到端仅依赖旧测试与应用 diff 的修复难度如何？
- **RQ4（成本：净收益是否为正？）** "选择算法时间 + 选中用例执行时间"是否远小于全量执行时间，并在时间以外的资源维度同样划算？

### 1.3 研究内容与贡献

1. **测试↔代码映射器**：把"源码 diff 难以直接对应到浏览器中的用户操作与测试脚本"这一 E2E 核心断点，形式化为一个**带类型的二部索引** `M ⊆ E×T`（动态覆盖边 + 静态 UI 语义边），并给出构建算法、增量维护规则与复杂度/摊销论证（第 3.2 节）。
2. **Semantic UI Diff 语义桥与 diff 约束缺口生成**：从 JSX/TSX/HTML 抽取 UI 语义节点（text/testId/role/aria/href/handler），比较新旧版本得到 UI 层增删改，用于关联受影响测试、识别未覆盖新增 UI，并约束生成用例必须触达 diff、包含变化相关断言且在新版本真实通过（第 3.3 节）。
3. **可证明的安全选测与生成质量度量**：给出与选择器无关的真正受影响集 `A*` 定义、条件安全命题 1 及其证明，并以**非循环结果差异 oracle** 与变异压力测试经验验证；针对副作用经共享状态的间接依赖，给出状态依赖闭包与命题 2。针对生成用例，采用可执行率、变更相关率、版本差分敏感性与变异杀伤率作为自动语义质量指标（第 3.4–3.5 节）。
4. **端到端闭环原型与轻量修复边界分析**：实现 DiffE2E 原型，将覆盖映射、diff 分析、双信号选择、运行分诊、轻量修复与缺口生成串联起来；修复模块作为闭环支撑能力评估 targeted set 可用性，并用 ReproBreak 量化真实 locator 修复的困难边界（第 4–5 章）。
5. **净收益成本模型**：把"少跑用例比例"（Reduction）与"实际时间节省"（TimeReduction）、"选择开销税"（SelectionTax）解耦，定义净收益 `NetSaving` 与盈亏平衡，并纳入 machine-minutes、LLM token 等非时间资源（第 3.6 节）。

### 1.4 论文组织

第 2 章梳理相关工作并定位研究空白；第 3 章给出方法设计与理论；第 4 章介绍原型实现与实验设置；第 5 章报告 RQ1–RQ4 的实验结果；第 6 章讨论有效性威胁与局限；第 7 章总结全文并展望后续工作。

---

## 第 2 章 相关工作

### 2.1 两维分析框架

为精确定位本方法相对现有工作的区别，本文构造两个区分维度：

- **维度 A：代码变更感知程度**
  - `A0` 无：与具体 diff 无关（泛化生成 / 通用修复）。
  - `A1` 粗粒度：文件 / 方法级变更影响分析（经典回归测试选择 RTS）。
  - `A2` 细粒度定向：以 diff 为核心输入，定向分析**并**定向生成 / 修复针对变更的测试。
- **维度 B：测试层级与上下文**
  - `B0` 局部：单元 / 集成测试，源码内可定位的上下文。
  - `B1` 全局：浏览器 E2E，跨越源码↔路由↔DOM↔定位器↔断言的全局上下文。

本方法的目标象限是 **(A2, B1)**：代码变更感知 + 浏览器端到端全局上下文。下文说明现有工作几乎都落在其他象限，留下该象限的空白。

### 2.2 回归测试选择 / 变更影响分析（RTS / CIA）

经典 RTS 与变更影响分析在 (A1, B0) 已相当成熟：增量覆盖分析 [19]、面向语义修改的精化选择 [20]、统一回归测试选择 [21]、微服务变更影响 [22][23]、文件+方法依赖混合 RTS [24]、流水线感知的 CI 优化 [25]、基于命名的安全 Python RTS [64]、形式化 CI 回归测试 [65] 等。

**族缺口**：这些工作的覆盖 / 依赖映射止于源码 / 字节码层，**未跨越 B0→B1 的鸿沟**——E2E 测试与源码之间隔着路由、组件、DOM、定位器，单元 RTS 无法直接判定"哪条浏览器用例受影响"。

### 2.3 E2E / Web 测试生成

E2E 生成工作多落在 (A0, B1)：特征驱动生成 AutoE2E [6]、屏幕转移图 + LLM 生成 [7]、场景引导移动 GUI 测试 [8]、生成式 GenIA-E2ETest [9]、组件抽象 VISCA [59] 等，均从特征 / 页面 / 场景出发，不回答"本次 diff 缺哪条测试"。变更感知生成（提交回归测试生成 [3]、TestWeaver [52]、JIT catching [51]、ChaCo [49]、PR-aware 单测 [50]）则停在 (A2, B0) 的单元 / API 层。

**族缺口**：变更感知生成几乎都在 (A2, B0)，E2E 生成几乎都在 (A0, B1)，**(A2, B1)——以 diff 为核心、为浏览器端到端缺口定向生成——基本空白**。

### 2.4 E2E / Web 测试修复

E2E 修复多为"失败后修测试"：语义化 Web 测试修复 [12]、引导 ChatGPT 修 Web UI 测试 [16]、WEFix 显式等待 [13]、异步等待修复 [17]、自治修复多智能体 [10]，均不以源码 diff 为核心上下文。变更感知修复（TaRGET [11]、Fix the Tests [14]、单测更新 [15]）面向单元测试；最接近的变更感知修复 UTFix [1] 也停在单元层、无 DOM/定位器。ReproBreak [55] 提供真实定位器断裂真值，但本身非方法。

**族缺口**：E2E 修复**不以源码 diff 为核心上下文**，也不服务于一个 targeted 回归集的整体可用性；变更感知修复则停在单元层。

### 2.5 技术缺口与本方法定位

综合三族，现有工作在目标象限 (A2, B1) 留下三个技术缺口：

1. **缺源码↔浏览器的语义桥**：单元 RTS/修复的覆盖/依赖映射止于源码层；E2E 生成/修复又不以 diff 为核心。→ 本方法用 **Semantic UI Diff + 测试↔代码映射器** 显式建立该桥。
2. **缺可证明的召回保证**：RTS 工作多报经验 Safety，但 E2E 场景下缺少"与选择器无关"的真值定义与安全性论证，且未处理副作用经共享状态的间接影响。→ 本方法给出条件安全命题 + 非循环结果差异 oracle + 状态依赖闭包。
3. **缺端到端闭环与净收益量化**：现有工作多为单点（选择 或 生成），少有"选出受影响测试之后如何识别未覆盖 diff 并定向生成"的闭环，也少有"选择开销 + 执行时间 vs 全量"的净收益与资源量化。→ 本方法以选择与生成为主链路，把选择→运行→缺口分析→生成串成代码变更感知闭环，轻量修复仅作为支撑环节，并以净收益模型量化。

> **一句话定位**：现有工作要么"变更感知但停在单元层"（A2,B0：[1][3][49][50][51][52]），要么"做浏览器 E2E 但与变更无关"（A0,B1：[6][7][9][12][16]）。本方法填补 **(A2, B1)** 空白。

---

## 第 3 章 方法设计

### 3.1 总体框架：五步闭环

记输入为旧版本 `V_old`、新版本 `V_new`、本次变更 `diff` 与既有 E2E 测试集 `T`。方法是一条以 diff 为核心输入、以**选择与生成为主链路**的五步闭环：

1. **建立旧版本覆盖映射**：在 `V_old` 上逐条运行 `T`，记录每条测试实际触达的源码文件、路由与组件，沉淀为测试↔代码映射器 `M` 的动态边。
2. **分析本次代码变更**：解析 git diff 得到变更实体 `Δ`（文件/函数/组件/路由/UI 语义节点），并对 UI 源码做 Semantic UI Diff。
3. **选择相关 E2E 测试**：在 `M` 上做邻居查询，取覆盖信号臂与 UI 语义信号臂的并集 `Sel`。
4. **运行、分诊与轻量修复**：在 `V_new` 上运行 `Sel`；通过者直接进入 targeted set；失败者分诊为疑似回归或测试过时。对明显定位器/断言过时的样本，结合 diff/DOM/trace/Semantic UI Diff 给出轻量修复候选，修复通过后进入 targeted set；复杂真实修复不作为本文主贡献。
5. **缺口分析与生成**：对 diff 中未被已选/已修测试触达的部分进行带约束生成（必须触达 diff、含可解释操作路径、含变化相关断言、在 `V_new` 上真实通过）。

> **无信息泄漏纪律（贯穿全程）**：选择只用 `V_old` 覆盖 + diff；`V_new` 全量执行仅用于构造评估 oracle，不参与选择。修复的输入只能是"旧（断裂）测试 + 应用源码 old/new diff + DOM/trace/候选元素"；`V_new` 的测试文件与 `new_locator` 只能用于评估，绝不进入修复输入或生成 prompt。

### 3.2 测试↔代码映射器

映射器 `M` 是连接源码实体与测试的**带类型二部图**：

```
M ⊆ E × T,   E = E_file ∪ E_func ∪ E_route ∪ E_comp ∪ E_ui
```

- 测试节点 `T`：每条 E2E 测试（`"<spec 文件> > <用例标题>"` 作 id）。
- 实体节点 `E`（多粒度）：文件 `E_file`、函数 `E_func`、路由 `E_route`、组件 `E_comp`、UI 语义节点 `E_ui = {kind, key}`，其中 `kind ∈ {text, testId, role, aria, href, handler}`。
- 边 `(e, t)` 带类型标签：`dynamic`（`t` 在 `V_old` 上执行到 `e`，插桩证据）或 `ui`（`t` 源码引用了 UI 语义节点 `e`，定位器/文本匹配证据）。

`M` 同时编码"测试跑过哪些代码"（dynamic）与"测试通过哪些 UI 锚点定位"（ui）。**选择**即在 `M` 上做邻居查询；**修复/生成**沿 `ui` 边找锚点。配合反向索引 `entityIndex`（实体→触达它的测试），选择查询复杂度为 `O(变更实体数 × 平均度)`。

**构建（一次全量）**：动态边由逐用例插桩执行得到（≈ `O(T_run(all))`，一次性成本）；UI 边由 AST 抽取 + 锚点匹配得到（`O(|源码| + |T|×|锚点|)`）。

**增量维护（关键）**：映射器不需每次提交重建。给定上一版本 `M_old` 与本次 `diff`，仅对"触达变更实体的测试 `T_touch`"重插桩、对"变更文件"重抽 UI 语义边，其余原样复用：

```
update(M_old, diff) -> M_new:
  Δ = changedEntities(diff)
  T_touch = ∪_{e∈Δ} entityIndex[e]
  for t ∈ T_touch:               dynamic_new[t] = instrumentRun(t, V_new)
  for f ∈ changedFiles(diff):    reExtractUiEdges(f)
  其余边从 M_old 复用；重建受影响部分的 entityIndex
```

增量复杂度 `O(|T_touch|×单测插桩 + |changedFiles|×静态抽取)`，与"变更规模"成正比而非"全量规模"。**正确性条件**：未触达变更实体的测试在假设 H1–H3（见 3.4）下覆盖不变，故复用旧边安全。**摊销结论**：首次全量构建 `C_build` 单列；此后每次 CI 的更新成本 `C_update ≪ C_build`，使长期 CI 中平均每提交的 `T_select` 远小于 `T_run(all)`。若检测到插桩盲区或索引偏差超阈值，则触发强制重建或回退全量，保证安全优先于效率。

### 3.3 Semantic UI Diff：源码 diff ↔ 浏览器操作的桥

Semantic UI Diff 从新旧版本 UI 源码（JSX/TSX/HTML）抽取 UI 语义节点并比较，得到 ADD / REMOVE / MODIFY 三类语义变更。它在三阶段发挥作用：

- **选择阶段**：把 UI 变更与测试定位器（text/testId/role/href 等）做语义关联，在覆盖粒度过粗时提升选择精度。
- **修复阶段**：为失效的定位器或断言提供基于语义锚值替换的修复候选（如 `text: "Red"→"Crimson"`）。
- **生成阶段**：指出哪些新增 UI 节点或变化路径尚无测试覆盖，作为缺口生成的目标。

这是本方法的核心连接机制：解决"源码 diff 很难直接对应到浏览器中的用户操作和测试脚本"这一 E2E 场景特有的断点。

**节点抽取（面向真实工程的工程化）**：真实前端极少直接使用原生 `<button>/<a>/<input>`，而是封装自设计系统的组件（`<Button>`、`<TapField>`、`<View>` 等）。因此抽取规则不以标签名白名单为唯一依据：**凡携带定位锚点属性者**（`data-testid`/`testID`/`aria-label`/`role`/`name`/`href`/`title`/`placeholder`）的任意 JSX 元素均纳入 UI 语义节点，与原生交互标签取并集。可见文本仅折叠"类文本"表达式（`{t('Save')}`、`{label}`），跳过内嵌子元素树的长表达式以避免把整棵子树误当文本而产生噪声锚值。

**信号→测试的匹配（精度与召回的工程权衡）**：将变更（REMOVE/MODIFY）的锚值与测试源做关联时，要求锚值以**引号字面量**形式出现（`'sig'`/`"sig"`/`` `sig` ``），与真实定位器写法一致（`getByTestId('amount-input')`、`getByText('No payees found.')`）。这消除了裸子串匹配对短/通用信号的误匹配（如 `date` 命中 `update`/`validate`）。此外，真实套件普遍采用页面对象模型（Page Object），定位锚点位于被 spec 导入的辅助模块而非 spec 顶层；故匹配时对 spec 做 1–2 层**本地导入闭包**展开（`import … from './page-models/…'`），将页面对象源码并入待匹配文本，避免漏选。

### 3.4 召回保证：定义、命题与边界

**真正受影响集 `A*`（与选择器无关，金标准）**：以测试在两版本上的可观测结果定义，不依赖任何选择算法。记 `outcome_V(t) = (status, fingerprint)`，`status ∈ {pass, fail, error, absent}`，`fingerprint` 为关键断言的可观测取值指纹（捕捉"都 pass 但断言观测值变了"）。则

```
A* = { t ∈ T : outcome_{V_old}(t) ≠ outcome_{V_new}(t) }
```

之所以不用覆盖定义 `A*`：覆盖型 affected 与选择器同源，会使 Safety 近乎自证。`A*` 改用真实结果差异定义，**打破循环**。

**选择规则 `Sel`**：覆盖信号臂与 UI 语义信号臂的并集。

```
SelCov = { t : cov(t) ∩ Δ ≠ ∅ }
SelUI  = { t : src(t) 引用了 Δ 中的 UI 语义节点 }
Sel    = SelCov ∪ SelUI
```

**定义（安全 Safe RTS）**：选择规则安全 ⟺ `A* ⊆ Sel`（召回率=1，不漏测）。

**命题 1（覆盖臂即安全）**：在以下假设下，`A* ⊆ SelCov ⊆ Sel`：
- (H1) 确定性：测试结果只由被执行代码与固定输入决定（无 flaky）。
- (H2) 覆盖完备性：`cov(t)` 记录了 `t` 在 `V_old` 上执行到的所有源码实体。
- (H3) 变更实体完备性：`Δ` 覆盖了本次 diff 引入的所有语义改动所在实体。

**证明（逆否）**：设 `t ∉ SelCov`，则 `cov(t) ∩ Δ = ∅`。由 (H2)，`t` 执行轨迹涉及的实体 `⊆ cov(t)`，皆不在 `Δ`；由 (H3)，所有语义改动都在 `Δ` 内，故 `t` 路径上代码语义在两版本间未变；由 (H1)，相同语义+相同输入 ⇒ `outcome_{V_old}(t) = outcome_{V_new}(t)`，即 `t ∉ A*`。取逆否得 `A* ⊆ SelCov ⊆ Sel`。∎

**推论**：UI 语义臂 `SelUI` 只做并集（只增不减），不可能破坏召回；它的作用是提升 Precision 与提供修复/生成锚点。这与"宁可多跑也不漏"一致：召回由 `SelCov` 保证，`SelUI` 锦上添花。当对召回的信心高于对成本的敏感度时，本方法总是包含整个 `SelCov`，不做任何裁剪；Precision 的提升只能通过更细的 `Δ` 粒度获得。

**诚实边界（假设何时失效）**：

| 假设 | 失效场景 | 后果 | 处理 |
|---|---|---|---|
| H1 确定性 | flaky、时间/并发相关 | 结果差异非 diff 引起 → 污染 `A_obs` | 多次重跑取稳定结果；flaky 单列不计入主 `A_obs` |
| H2 覆盖完备 | 动态 import、SSR、未插桩第三方 | `cov(t)` 漏记 → 可能漏选 | 插桩自检；盲区实体做保守纳入（路由/组件粒度兜底） |
| H3 实体完备 | 配置/数据驱动改动；**副作用经共享状态** | 改动不在 `Δ` → 可能漏选 | 副作用交 3.5 状态闭包；配置/数据纳入 `Δ` 扩展 |

命题 1 是**条件安全**（在 H1–H3 下）。论文显式陈述这三个假设，并用经验真值（第 5.1 节）检验其在实践中是否被违反。

**经验召回验证（非循环）**：在 `V_old/V_new` 全量执行，用结果差异取 `A_obs`（`A*` 的经验实例），计算 `SafetyEmp = |Sel ∩ A_obs| / |A_obs|`，目标=1.0；任何 `A_obs \ Sel ≠ ∅` 的个案逐条审计并归因 H1/H2/H3 哪条失效，不得掩盖。为扩大真值规模，对 `Δ` 中实体注入小型语义变异、重跑全量得到 `A_obs^mut`，做主动压力测试。

### 3.5 副作用与状态依赖闭包

经典覆盖型 RTS 的安全性依赖"测试隔离"。当测试经**共享状态**（localStorage/cookie/全局变量/后端持久化/外部服务）耦合时，一个不直接触达 `Δ` 的测试 `t`（`cov(t)∩Δ=∅`）可能间接受影响——这是 H3 失效的典型形态。

定义状态资源集 `R`、读写足迹 `rw : T → 2^{R×{read,write}}`、状态依赖关系 `t_i ⤳ t_j`（`t_i` 写、`t_j` 读同一资源，或执行序耦合）。**安全闭包**：

```
SelClosed = Sel ∪ { t : ∃ s ∈ (Sel ∩ A*), t 与 s 在 ⤳ 关系下共享资源 }
```

**命题 2（放宽 H3 后的安全性）**：在 (H1)(H2) 成立、允许副作用（放宽 H3）下，若状态足迹 `rw` 完备，则 `A* ⊆ SelClosed`。代价是 Reduction 下降——这是"召回不可妥协"下可接受的权衡。选择器以可选开关 `--state-closure`（默认开，体现保守取向）接入。

### 3.6 净收益成本模型

在召回硬约束下最小化执行成本：`min Cost(Sel) s.t. SafetyEmp(Sel)=1`，次目标 `max Reduction = 1 − |Sel|/|S|`。时间分解与净收益：

```
T_full        = 全量执行 S 的 wall-clock
T_select      = T_mapper_update + T_diff_analyze + T_select_compute
T_run(Sel)    = 执行选中子集的 wall-clock
NetSaving     = 1 − (T_select + T_run(Sel)) / T_full
TimeReduction = 1 − T_run(Sel) / T_full          # 只看执行
SelectionTax  = T_select / T_full                 # 选择本身的"税"
```

**关键诚实点**：`Reduction`（用例数比例）≫ `TimeReduction`（时间）是常态——E2E 用例时长高度不均，少跑的多是短用例；且 `T_select>0` 进一步吃掉收益。三者必须解耦报告。**盈亏平衡**：当 `NetSaving>0`（即 `T_select+T_run(Sel)<T_full`）方法才划算。除 wall-clock 外，报告 machine-minutes、峰值并行度、LLM token/$ 等非时间资源。公平对比协议：full 与 selected 用同一命令模板、同 `--workers`、同覆盖设置；selected 多个 spec 一次性传入单次调用；每臂重复 `R≥3` 取 median/IQR；`T_select` 单独计时并纳入总时。

---

## 第 4 章 原型实现与实验设置

### 4.1 原型 DiffE2E

实现了端到端原型 DiffE2E，纯函数核心（`pipeline/src/`）可单测、无 IO：diff 解析、覆盖映射、双信号选择、覆盖型与结果差异 oracle、状态依赖图与闭包、Reduction/Safety/Precision/Usability 指标、bootstrap/Wilcoxon/Cliff δ/McNemar/Cohen's κ 统计、JSX 语义 UI Diff、规则修复、过时三分类，以及可插拔 LLM 客户端（无 key 时走确定性 stub）。实验层（`experiments/`）在受控主体上逐 commit replay。技术栈：Node.js（ESM、`node:test`）、Playwright + Chromium、istanbul / CDP `page.coverage`、git、Python3（仅读 SQLite）。

### 4.2 受控被测主体

受控被测应用含 6+ 路由与共享工具，脚本化构造 25 个 commit（`c00..c24`）、24 个变更过渡，覆盖 8 类变更：`ui_text / logic / new_feature_gap / multi_file / locator_break / assertion_break / route / refactor_noise`。replay 引擎按 tag checkout 重放。全流程零外部依赖、可一键复现。

### 4.3 对照臂与指标

- **RQ1 基线**：`retest_all`（全量）、`random_k`（同规模随机）、`static_heuristic`（静态路由/组件启发式），以及信号消融 `coverage_only / uidiff_only / dual`。
- **指标**：`Reduction = 1 − |Sel|/|S|`；`Safety`（覆盖型）`= |Sel∩Affected|/|Affected|`；`SafetyEmp`（非循环）`= |Sel∩A_obs|/|A_obs|`；`Precision = |Sel∩Affected|/|Sel|`；`TargetedSetUsability`；`NetSaving`；RQ2 语义有效性以**自动指标**为主——变异杀伤率（mutation kill）与版本差分敏感性（V_new 过/V_old 失败），Cohen's κ 仅作人工小样本校准。

### 4.4 真实数据接入（状态说明）

受控主体给出零依赖、可复现的主结果；真实外部效度部分已补齐、部分待补：(i) ≥2 个真实 Playwright 项目的多 commit replay（RQ1）**已完成**（actual-budget + mermaid-live-editor，共 14 个稳定过渡，§5.1）；(ii) 真实 LLM 生成对照（RQ2）**已完成**，采用 DeepSeek 对 diff 约束臂与无 diff 基线做自动语义指标评估；(iii) 闭环支撑与修复边界对照（RQ3）**已完成**，受控主体 LLM 臂 4/4，ReproBreak 端到端 LLM 臂 23/414；(iv) 真实项目 wall-clock 与 NetSaving（RQ4）**已完成初步计时**，覆盖 cand_coverage 与 actual_desktop 两个场景；人工 κ 仍作为辅助校准待补。

---

## 第 5 章 实验结果

### 5.1 RQ1：选择——少跑但不漏

**主结果（受控主体，n=24 过渡）**：

| 方法 | Reduction | Safety | Precision |
|---|---|---|---|
| **ours (=dual)** | **0.625** | **1.0** | **1.0** |
| coverage_only | 0.625 | 1.0 | 1.0 |
| uidiff_only | 0.986 | 0.083 | 1.0 |
| retest_all | 0 | 1.0 | 0.375 |
| random_k | 0.625 | 0.396 | 0.396 |
| static_heuristic | 0.875 | 0.667 | 1.0 |

来源：`out/rq1_summary.md`。ours 是唯一同时做到 Safety=1.0 且高 Reduction 的方法；random 同规模但不安全（漏选），static 启发式在共享 util/router 变更上漏选。

**统计检验**（来源 `out/rq1_stats.md`）：ours bootstrap 95% CI——Reduction 0.625 (0.493–0.75)、Safety 1 (1–1)、Precision 1 (1–1)。

| 对比 | 指标 | Wilcoxon p | Cliff δ | McNemar（安全）|
|---|---|---|---|---|
| ours vs retest_all | Reduction | 0.0001 | 0.7917 | b=0,c=0,χ²=0 |
| ours vs random_k | Safety | 0.0003 | 0.7083 | b=17,c=0,χ²=15.06 |
| ours vs static_heuristic | Reduction | 0.0143 | −0.5451 | — |
| ours vs static_heuristic | Safety | 0.0143 | 0.3333 | b=8,c=0,χ²=6.125 |

**信号消融**：覆盖映射是安全主干（coverage_only/dual 在 24/24 过渡上安全）；UI 信号仅在 2/24 个过渡触发选择，均为 locator 改名类，单用 Safety 仅 0.083（漏选逻辑/路由/断言）。在该文件粒度主体上 dual = coverage_only：UI 信号冗余但无害。UI 信号的真正增益体现在覆盖粒度过粗的单组件应用——见第 5.5 节 C1 动态实测（uidiff Precision 1.0 vs 纯覆盖 0.33），两者互补。

**召回保证（非循环 oracle）**：结果差异 oracle 下，有 observed-affected 的过渡 4 个，`SafetyEmp(ours)=1.0`、`SafetyEmp(coverage_only)=1.0`、0 漏选（`safety_misses.json` 为空）。变异压力测试：4 文件 mean SafetyEmp=1.0、all_safe=true、0 漏选，且 `home.js` 变异产生非空有效样本并被覆盖臂命中（来源 `out/safety_mutation.json`）。

**副作用 live 证据**（来源 `out/sideeffect.json`）：当 `Δ={src/dashboard.js}` 时，生产者 A 写共享后端状态、消费者 B 读该状态并断言计数为 1：

| | coverage_only（naive） | state_closed（本方法）|
|---|---|---|
| 选择集 | 仅 B（漏掉生产者 A）| B + A |
| B 子集重跑判定 | **fail**（visits=0）| pass |
| 与全量套件判定(pass)保真度 | **不保真（翻转）** | 保真 |

结论：共享状态副作用下 naive 文件级覆盖 RTS 不安全；状态依赖闭包因 `A ⤳ B` 将 A 纳回，恢复判定保真度（端到端验证命题 2）。

**RQ1 真实项目多 commit replay（已接入 2 个真实 Playwright 项目）**：

借助通用 **CDP 覆盖注入**（`page.coverage` V8 覆盖，透明改写测试导入、不改业务代码、无需预插桩，详见 §6 实现），在两个真实开源项目的连续 commit 上回放、按 git diff 选择用例。两项目分别代表"模块化 monorepo"与"单页强耦合 SPA"两类典型结构：

| 项目 | 栈 / 起服务 | 稳定过渡 | 方法 | Reduction | Safety | Precision |
|---|---|---|---|---|---|---|
| actual-budget（desktop-client）| React + Vite dev | 9 | coverage_only / dual | 0.111 | **1.0** | **1.0** |
| | | | uidiff_only | 0.895 | 0.216 | **1.0** |
| mermaid-live-editor | SvelteKit + Vite dev | 5 | coverage_only / dual | 0.0 | **1.0** | **1.0** |
| | | | uidiff_only | 1.0 | 0.0 | **1.0** |

跨项目合计 n=14：dual 在两项目上均 **Safety=1.0、Precision=1.0**（bootstrap 95% CI 均为 [1,1]）；coverage_only 与 dual 一致（UI 信号在文件粒度主干上冗余但无害，与受控主体结论一致，Wilcoxon dual vs coverage_only 三指标 p=1）。来源 `out/real/{actual_desktop,mermaid_live}_rq1.json`、`out/real/real_rq1_stats.md`、图 `out/real/figs/real_rq1.svg`。

两点诚实观察，与受控主体互补、量化了方法的适用边界：

- **覆盖选择的缩减取决于"覆盖耦合度"**：actual 的多数过渡改动核心/共享文件，6 个 spec 的 34 个用例几乎全部触及→Reduction 仅 0.111；mermaid 为单页编辑器，核心组件被几乎每个用例加载→Reduction≈0。这是覆盖型 RTS 在强耦合应用上的固有局限，而非本方法特有；Safety 始终为 1.0。
- **UI 信号臂为稀疏触发、高精度的互补信号**：前向开发中 testId/可见文本大多稳定（新功能多为 ADD，不触发 REMOVE/MODIFY），故 uidiff 自然较少选中。actual 9 个过渡中仅 commit `19cea1a`（"schedule 金额改用 ± 符号"，改动 testId `date`）触发，经页面对象导入闭包映射到 32 个用例，**uidiff_only Precision=1.0**（选中皆受影响）；这与 §5.5 C1 在单组件应用上 uidiff 把精度从覆盖级 0.33 提升到 1.0 的动态证据一致——覆盖臂是安全主干、UI 信号臂在覆盖粒度过粗时补精度。

> 工程化要点（使 uidiff 能在真实工程激活，见 §3.3）：抽取器纳入携带定位锚点属性的设计系统组件（`<Button>/<TapField>` 等，非仅原生标签）；信号→测试匹配要求引号字面量（消除 `date`→`update` 误匹配）并对 spec 做本地导入闭包展开（覆盖 Page Object 间接层）。离线扫描器 `scan_ui.mjs` 可在不安装、不跑测试的前提下定位可激活窗口。

### 5.2 RQ2：生成——diff 约束的相关性

**语义有效性度量（方法）**：人工双标注成本高、规模小、且主观，本文以**两个客观自动指标**作为语义有效性的主度量，人工 Cohen's κ 仅用于小样本校准：

- **变异杀伤（mutation kill）**：向缺口新增源码注入可被测试观察到的变异（重命名各 `data-testid`、对可见文本追加标记），重跑该生成用例。若其由通过转为失败即"杀掉"该变异，说明用例确实在验证新行为；恒真/仅占位的断言一个也杀不掉。指标为每条用例 killed/injected 的均值。
- **版本差分敏感性（change sensitivity）**：同一生成用例在 V_new（缺口提交，新功能存在）通过、在 V_old（前一提交，新功能尚不存在）失败，则判定其对该变更敏感——这排除了与变更无关的"哪个版本都能过"的弱用例。
- **自动语义有效率** = 可执行 ∧ 版本敏感 ∧ 杀掉≥1 个注入变异（完全客观、无需人工）。

**双臂结果（受控主体，真实 LLM，provider=deepseek）**：

| 臂 | n | executable-rate | change-relevant-rate | 变异杀伤(均值) | 版本敏感率 | 自动语义有效率 |
|---|---|---|---|---|---|---|
| diff（约束）| 3 | **1.0** | **1.0** | **0.6667** | **1.0** | **1.0** |
| nodiff（基线）| 3 | 0.3333 | 0.0 | 0.2222 | 0.3333 | 0.3333 |

来源：`out/rq2_results.md`。为避免 LLM 输出格式影响执行，生成端对 Markdown 代码围栏做清洗，并统一将 `@playwright/test` 导入改写为项目覆盖采集 fixture `./fixtures`；真实 provider 请求失败或返回空 completion 时直接报错，禁止静默 fallback。结果显示，diff 约束臂在 3 个新增缺口上全部可执行、全部触达变更文件、全部对版本差异敏感，且均杀掉至少 1 个注入变异；无 diff 基线仅 1/3 可执行，且 0/3 触达变更文件。人工双标注（`rq2_to_annotate.jsonl` + `rq2_unblind.json` + Cohen's κ）保留为自动指标的小样本校准，不作为主度量。

### 5.3 RQ3：闭环支撑与修复边界

RQ3 的目的不是证明本文已经解决真实 Web 测试修复，而是回答两个支撑性问题：第一，轻量修复是否能让受控场景中的 selected stale tests 重新进入 targeted set；第二，真实 locator 断裂在"只给旧测试 + 应用 diff"的无泄漏设定下到底有多难。前者服务于选择+生成闭环的可用性，后者用于限定本文方法边界。

**受控主体（n=4，provider=deepseek）**：规则臂修复成功率 0.75（3/4），LLM 臂修复成功率 1.0（4/4）；mean TargetedSetUsability（按规则修复后可进入 targeted set 的保守口径）：before 0.0 → after 0.75。该结果说明轻量修复足以支撑受控闭环，但不外推为真实项目修复能力。

| tag | type | target | staleness | rule 修复 | LLM 修复 | usability_before | usability_after |
|---|---|---|---|---|---|---|---|
| c08 | locator_break | cart.spec.ts | STRUCTURAL_ONLY | true | true | 0 | 1 |
| c15 | assertion_break | login.spec.ts | EXPECTATION_CHANGE | true | true | 0 | 1 |
| c20 | locator_break | search.spec.ts | STRUCTURAL_ONLY | true | true | 0 | 1 |
| c21 | assertion_break | orders.spec.ts | SUSPECTED_REGRESSION | false | true | 0 | 0 |

来源：`out/rq3_results.md`。过时三分类正确区分定位失效（STRUCTURAL_ONLY，语义定位重写）与期望变化（EXPECTATION_CHANGE，断言更新）；c21 被保守分为 SUSPECTED_REGRESSION，规则臂不改写，因此不进入 targeted set，LLM 臂可生成通过补丁但需结合人工/业务语义判断是否应采纳。

**ReproBreak 真实数据（离线 / CSV ground truth）**，来源 `realproj/results/reprobreak.md`：
- **E1 数据刻画**：9604 条真实结构性 locator 断裂对，Playwright 4867（50.7%）/ Cypress 4737（49.3%）。
- **E2 Semantic UI Diff 可达性**：1172/9604 = 12.2% 为 testId/text/role-name/href 语义锚值替换（本方法 UI 信号直接可定位）；其余为 CSS id/class 改名、结构重排、策略切换（需 DOM 拓扑或 LLM）。分框架：Playwright 17.4% vs Cypress 6.9%（Playwright 语义定位天然更可修）。
- **E3 确定性改写器精确匹配（已知 oracle 信号，上界）**：在可达的 578 条上精确重建开发者修复 574/578 = 99.3%。该指标隔离"改写机制在真实语法上的正确性"，假定语义信号已知。

> 诚实定位：E3 是上界（给定 oracle 信号）；端到端"diff→信号→修复"的信号检测精度需各 commit 源码 + 执行验证。

**RQ3 ReproBreak 端到端（无泄漏，真实逐 commit 源码）**，来源 `realproj/results/reprobreak_e2e.md`：

从 ReproBreak SQLite 导出 **449 条执行验证断裂**（4 个真实开源项目：ghiscoding/angular-slickgrid、tryghost/koenig、nasa/openmct、microsoft/playwright），逐条按其 commit 克隆 AUT、取旧（断裂）测试与应用源码 old/new diff，端到端修复并与 ground-truth `new_locator` 做归一化 exact-match。无泄漏护栏（旧测试须含 `old_locator` 且不含答案）跳过 35 条，进入评估 n=414。

| 臂 | n | exact-match 修复率 | 备注 |
|---|---|---|---|
| 规则（rule）| 414 | 3.38%（14/414）| 仅用旧测试 + 应用 diff（有 app 信号子集 14/393=3.56%）|
| LLM（DeepSeek）| 414 | 5.56%（23/414）| 同上输入 + LLM 推理；LLM 调用错误 0 |

> **关键对比**：E3 离线「已知 oracle 信号」改写器上界为 99.3%，而本节端到端「从应用 diff 自行还原 old→new 信号」的规则臂仅 **3.38%**，DeepSeek LLM 臂提升至 **5.56%**。LLM 在 microsoft/playwright 子集上增益明显（14/45），但整体 exact-match 仍远低于已知信号上界。因此，ReproBreak 在本文中应被解读为**真实修复难度和边界的量化**：当前轻量修复模块可支撑闭环，但还不能作为真实 locator 修复的强结果；后续需要 DOM/trace 候选元素、运行时对齐和执行验证式语义等价判定。

### 5.4 RQ4：成本——净收益

**受控主体执行量**：跨 24 个过渡，retest-all 共执行 144 次用例，ours 仅执行 54 次 → 测试执行量下降 62.5%（Safety 仍=1.0）。生成/修复均按需触发（仅缺口/失效用例），额外成本与变更规模成正比。

**RQ4 真实项目 wall-clock + NetSaving**，来源 `out/real/*_rq4.json`，每臂重复 3 次并报告 median/IQR：

| 项目/场景 | workers | full_count | selected_count | Reduction | T_full (median/IQR) | T_run(Sel) | T_select | TimeReduction | NetSaving | break_even | machine-minutes(full/ours) |
|---|---:|---:|---:|---:|---|---|---|---:|---:|---|---|
| cand_coverage（C1 动态，选中 1/3） | 1 | 3 | 1 | 66.7% | 1.64s (1.64-2.27) | 1.43s (1.43-1.44) | 0.12s (0.12-0.13) | 12.4% | 5.0% | true | 0.027/0.026 |
| actual_desktop（无影响过渡，空选集） | 2 | 34 | 0 | 100.0% | 110.84s (110.58-119.35) | 0.00s (0.00-0.00) | not measured | 100.0% | 100.0% | true | 3.695/0.000 |

> 读法：`cand_coverage` 说明用例数量减少 66.7% 并不等价于 wall-clock 同比例下降，真实 TimeReduction 为 12.4%，计入 0.12s 选择开销后 NetSaving 为 5.0%，主要受浏览器启动、dev server 与单测时长不均影响；`actual_desktop` 记录的是一个 selected=0 的无影响过渡，说明空选集可避免约 111s 全量执行，但不能代表该项目平均收益。actual_desktop 的 `T_select` 仍未接入真实 selection hook，后续需扩展为多过渡平均。

### 5.5 C1 闭环：Semantic UI Diff 驱动整条链

**静态（真实 JSX）**：在真实 JSX（`App.old→App.new`）上语义差分得 ADD 2 / REMOVE 1 / MODIFY 2，驱动选择（选中 paint/link/turquoise，无关用例正确排除）、生成（对新增 Crimson/Green 合成可执行用例）、修复（locator 重定向 / 断言更新 / locator 加固）。来源 `out/c1_loop.md`。

**动态（真实 React 工程 cand_coverage）**：变更 Red→Crimson + 新增 Green，实跑 e2e，结果翻转 oracle = `App.test.ts::red`。同一 oracle 下 coverage-only Precision 0.333（选 3/3），**uidiff Precision 1.0**（选 1，Reduction 0.667，Safety 1）；修复后重跑 PASS；新增 Green 按钮生成可执行=true、覆盖=true。来源 `out/c1_dynamic.md`。这是 Semantic UI Diff 在真实工程上把选择精度从覆盖级 0.333 提升到 1.0 的动态证据，与 RQ1 文件粒度主体互补。

---

## 第 6 章 讨论：有效性威胁与局限

- **外部效度**：主体为受控工程；真实多 commit replay（RQ1）已在 2 个真实开源项目（actual-budget、mermaid-live-editor，14 个稳定过渡）上完成并给出 dual Safety/Precision=1.0（§5.1），但项目数仍有限、且两者均为 Vite dev 起服务的前端；真实 LLM 生成（RQ2）与修复（RQ3）对照已用 DeepSeek 跑通；真实 wall-clock（RQ4）已在 cand_coverage 与 actual_desktop 两个场景给出初步 NetSaving，但 `T_select` 尚未接入真实 selection hook，仍需扩大项目与过渡数量。
- **构造效度**：召回保证已从"用覆盖映射自证"升级为"用与选择器无关的真实结果差异 oracle 验证"，并辅以变异压力测试，破除 Safety 自证循环；但 `A_obs` 在自然 diff 下样本偏小（4 个过渡），变异增强部分缓解。
- **内部效度**：命题 1 的安全性是条件安全（H1–H3）；flaky（H1）、覆盖盲区（H2）、配置/副作用（H3）均可能使其失效。副作用情形已由状态闭包（命题 2）专门处理并有 live 证据；flaky 与覆盖盲区以多次重跑、保守纳入与失配回退应对。
- **结论效度**：生成/修复在无 LLM key 时走确定性 stub，可测可执行率/相关性/修复率；语义有效性不再依赖人工标注，而以变异杀伤率与版本差分敏感性两个客观自动指标度量。RQ2 真实 DeepSeek 对照已给出 diff vs nodiff 的自动语义指标差异，人工 κ 仅作小样本校准。ReproBreak 修复已两层量化：E3 离线给出"已知 oracle 信号"的改写器上界（99.3%），§5.3 端到端在 449 条执行验证断裂、4 个真实项目上给出"从应用 diff 自行还原信号"的规则臂 3.38% 与 DeepSeek LLM 臂 5.56%——二者均远低于上界，正面量化了信号检测的难度。仍存局限：端到端执行验证版（Docker overwrite）与 DOM/trace 候选元素作为更强上下文为后续。
- **覆盖映射粒度**：bundler 行号变换下子文件级需 sourcemap 反查；本实验采用文件级归属（干净）+ locator/UI 信号（不依赖行号）。Semantic UI Diff 在"文案与 handler 同时变更"时静态匹配会退化为 ADD/REMOVE，需运行时 DOM 邻域匹配消歧。

---

## 第 7 章 总结与展望

本文研究代码变更感知的 Web 应用端到端回归测试用例选择与生成方法，把安全选测、覆盖缺口识别与 diff 约束生成统一进一个以 diff 为核心输入的闭环，核心是持久化、可增量维护的测试↔代码映射器与作为"源码 diff ↔ 浏览器操作"语义桥的 Semantic UI Diff。理论上给出与选择器无关的 `A*` 定义、条件安全命题 1 及证明、副作用状态闭包命题 2，并以净收益模型量化成本。在受控主体上，方法在 Safety=1.0 前提下达到 Reduction=0.625、Precision=1.0，非循环 oracle 与变异压力测试均给出 SafetyEmp=1.0、0 漏选，副作用场景下状态闭包恢复判定保真；真实 DeepSeek 生成对照表明 diff 约束显著提升生成用例的变更相关性与自动语义有效性。修复模块作为闭环支撑，在受控主体上可提升 targeted set 可用性；ReproBreak 结果则诚实揭示真实 locator 修复仍困难，本文不将其作为主贡献夸大。

**展望（按优先级）**：① RQ1 多 commit replay 已接入 2 个真实项目（actual-budget、mermaid-live-editor）；后续扩大项目数与栈多样性（含生产构建/sourcemap 归因、带后端者），并把 RQ4 计时扩展为多过渡平均且纳入真实 `T_select`；② RQ2/RQ3 真实 LLM 对照已完成，后续补双标注 κ 与更强 DOM/trace 候选上下文；③ ReproBreak 端到端（无泄漏）修复已完成规则臂与 DeepSeek 臂，尚需补执行验证版（Docker overwrite）；④ 扩大变更类型与样本规模以提升统计可信度；⑤ 做 CI（如 GitHub Actions）集成 demo，展示工程落地形态。

---

## 参考文献

> 沿用研究进展汇报的统一编号。A 类核心、B 类支撑、C 类前沿。

### A 类：核心文献（直接对标）
[1] UTFix: Change Aware Unit Test Repairing using LLM. OOPSLA, 2025. https://arxiv.org/abs/2503.14924
[2] Code-Aware Prompting (SymPrompt). FSE, 2024. https://arxiv.org/abs/2402.00097
[3] Can LLM Generate Regression Tests for Software Commits? arXiv:2501.11086, 2025.
[4] Testora: Using Natural Language Intent to Detect Behavioral Regressions. arXiv:2503.18597, 2025.
[5] AI for Context-Aware Visual Change Detection in Software Test Automation. PAI, 2024. https://arxiv.org/abs/2405.00874
[6] Feature-Driven End-to-End Test Generation (AutoE2E). ICSE, 2025. https://arxiv.org/abs/2408.01894
[7] Automated Web Application Testing: E2E Test Case Generation with LLMs and Screen Transition Graphs. arXiv:2506.02529, 2025.
[8] Scenario-Guided LLM-based Mobile App GUI Testing. ACM TOSEM, 2025. https://arxiv.org/abs/2506.05079
[9] GenIA-E2ETest. SBES, 2025. https://arxiv.org/abs/2510.01024
[10] Practical Limits of Autonomous Test Repair: A Multi-Agent Case Study. arXiv:2605.01471, 2026.
[11] Automated Test Case Repair Using Language Models (TaRGET). TSE, 2025. https://arxiv.org/abs/2401.06765
[12] Semantic Test Repair for Web Applications. ESEC/FSE, 2023. https://doi.org/10.1145/3611643.3616324
[13] WEFix: Automatic Generation of Explicit Waits for Web E2E Flaky Tests. WWW, 2024. https://arxiv.org/abs/2402.09745
[14] Fix the Tests: Augmenting LLMs to Repair Test Cases. ISSRE, 2024. https://arxiv.org/abs/2407.03625
[15] Unit Test Update through LLM-Driven Context Collection and Error-Type-Aware Refinement. ASE, 2025. https://arxiv.org/abs/2509.24419
[16] Understanding & Enhancing Attribute Prioritization in Fixing Web UI Tests with LLMs. ICST, 2025. https://arxiv.org/abs/2312.05778
[17] Time-based Repair for Asynchronous Wait Flaky Tests in Web Testing. arXiv:2305.08592, 2023.
[18] Towards Predicting Fragility in End-to-End Web Tests. EASE, 2024. https://doi.org/10.1145/3661167.3661179

### B 类：支撑文献（方法论与背景）
[19] Efficient Incremental Code Coverage Analysis (iJaCoCo). ASE, 2024. https://arxiv.org/abs/2410.21798
[20] More Precise RTS via Reasoning about Semantics-Modifying Changes. ISSTA, 2023. https://doi.org/10.1145/3597926.3598086
[21] Test Selection for Unified Regression Testing. ICSE, 2023. https://doi.org/10.1109/ICSE48619.2023.00145
[22] Change Impact Analysis in Microservice Systems: A SLR. JSS, 2024. https://doi.org/10.1016/j.jss.2024.112241
[23] Datalog-Based Language-Agnostic Change Impact Analysis for Microservices. ICSE, 2025. https://doi.org/10.1109/ICSE55347.2025.00115
[24] Hybrid RTS by Integrating File and Method Dependences. ASE, 2024. https://doi.org/10.1145/3691620.3695525
[25] Practical Pipeline-Aware Regression Test Optimization for CI. ICST, 2025. https://arxiv.org/abs/2501.11550
[26] Regression Test Selection in Test-Driven Development. ASE Journal, 2023. https://doi.org/10.1007/s10515-023-00405-w
[27] An Empirical Evaluation of Using LLMs for Automated Unit Test Generation. TSE, 2023. https://arxiv.org/abs/2302.06527
[28] CodaMosa. ICSE, 2023. https://doi.org/10.1109/ICSE48619.2023.00085
[29] ChatUniTest. FSE Companion, 2023. https://arxiv.org/abs/2305.04764
[30] Effective Test Generation Using Pre-trained LLMs and Mutation Testing. IST, 2023. https://arxiv.org/abs/2308.16557
[31] ChatGPT vs SBST. TSE, 2023. https://arxiv.org/abs/2307.00588
[32] CAT-LM. ASE, 2023. https://arxiv.org/abs/2310.01602
[33] SWT-Bench. NeurIPS, 2024. https://arxiv.org/abs/2406.12952
[34] Automated Unit Test Improvement using LLMs at Meta (TestGen-LLM). FSE Companion, 2024. https://arxiv.org/abs/2402.09171
[35] LLM for Test Script Generation and Migration. QRS, 2023. https://arxiv.org/abs/2309.13574
[36] GAMMA: Revisiting Template-Based APR via Mask Prediction. ASE, 2023. https://arxiv.org/abs/2309.09308
[37] FlakyFix. TSE, 2024. https://arxiv.org/abs/2307.00012
[38] StubCoder. ACM TOSEM, 2023. https://arxiv.org/abs/2307.14733
[39] Effortless Test Maintenance: A Critical Review of Self-Healing Frameworks. IJRASET, 2023. https://doi.org/10.22214/ijraset.2023.56048
[40] A Multi-Year Grey Literature Review on AI-assisted Test Automation. IST, 2024. https://arxiv.org/abs/2408.06224
[41] Exploring the Integration of LLMs in Industrial Test Maintenance Processes. arXiv:2409.06416, 2024.
[42] Software Testing With LLMs: Survey, Landscape, and Vision. TSE, 2023. https://arxiv.org/abs/2307.07221
[43] A Survey on Web Testing: On the Rise of AI and Applications in Industry. arXiv:2503.05378, 2025.
[44] Challenges of E2E Testing with Selenium WebDriver: A Survey. ICST, 2023. https://doi.org/10.1109/ICST57152.2023.00039
[45] Vision-Based Mobile App GUI Testing: A Survey. ACM CSUR, 2023. https://arxiv.org/abs/2310.13518
[46] A Comprehensive Survey of AI-Driven Advancements in APR and Code Generation. arXiv:2411.07586, 2024.
[47] Observation-Based Unit Test Generation at Meta (TestGen). FSE Companion, 2024. https://arxiv.org/abs/2402.06111
[48] E2EGit: A Dataset of End-to-End Web Tests in Open Source Projects. MSR, 2025. https://doi.org/10.1109/MSR66628.2025.00121

### C 类：最新前沿（2025–2026）
[49] Change And Cover (ChaCo). arXiv:2601.10942, 2026.
[50] PR-Aware Automated Unit Test Generation. arXiv:2605.25285, 2026.
[51] Just-in-Time Catching Test Generation at Meta. arXiv:2601.22832, 2026.
[52] TestWeaver. arXiv:2508.01255, 2025.
[53] Evaluating LLM-Based Test Generation Under Software Evolution. arXiv:2603.23443, 2026.
[54] Code-A1. arXiv:2603.15611, 2026.
[55] ReproBreak: A Dataset of Reproducible Web Locator Breaks. arXiv:2605.12158, 2026.
[56] FlakyGuard. ASE, 2025. https://arxiv.org/abs/2511.14002
[57] YATE: The Role of Test Repair in LLM-Based Unit Test Generation. arXiv:2507.18316, 2025.
[58] Hierarchical Knowledge Injection for Improving LLM-based Program Repair. ASE, 2025. https://arxiv.org/abs/2506.24015
[59] VISCA: Inferring Component Abstractions for Automated E2E Testing. arXiv:2506.04161, 2025.
[60] ViMoTest. ICSCT, 2025. https://arxiv.org/abs/2504.16753
[61] Automated Functional Testing for Malleable Mobile Application Driven from User Intent. arXiv:2604.02079, 2026.
[62] Android Instrumentation Testing in CI. arXiv:2604.03438, 2026.
[63] Do Autonomous Agents Contribute Test Code? arXiv:2601.03556, 2026.
[64] Names Are All You Need (NameRTS). arXiv:2605.25356, 2026.
[65] Formalizing Regression Testing for Agile and CI Environments. arXiv:2511.02810, 2025.
[66] Understanding APR Agents Through the Lens of Traceability. arXiv:2506.08311, 2025.
