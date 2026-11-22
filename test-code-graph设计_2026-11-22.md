# test-code graph 设计：把映射器从"查表"升级为"可推理图"

**日期**：2026-11-22
**参考**：codegraph（`/Users/gg/SourceCode/codegraph`，`src/types.ts` 的类型系统、`docs/design/framework-coverage.md` 的路由 resolver、`tree-sitter|scip|heuristic` 的 provenance 纪律）
**定位**：本文（论文 §3.2）映射器 `M` 的增强设计，是 A2 第三步（`K` 层）与 C5（路由→handler）的正式落地蓝本。

---

## 0. 一句话

把 §3.2 的**扁平二部映射器** `M ⊆ E×T`（只有 `dynamic`(文件级) + `ui`(字面量锚定) 两类边）升级为一个**三层可追踪图**：

```
[测试层]  test ──证据边(executes/locates/asserts/observes)──▶ [代码层] code ──结构边 K(contains/calls/renders/navigates)──▶ [桥层] route/component/ui_node
```

- **结构层 `K ⊆ E_code×E_code`** 照搬 codegraph（tree-sitter 符号抽取 + import/call/route 解析）；
- **证据层 `E_test×E_code|ui|state`** 是我们 E2E 特有的贡献（运行时插桩 + 定位器/断言静态解析）；
- **桥层** 连接代码与浏览器语义（UI 节点、路由、状态）。

选择 / 生成 / 修复从"三个独立规则模块"变成**同一张图的三种遍历**。

---

## 1. 现状与差距

**现在的 `M`（论文 §3.2）**：

```
M ⊆ E × T,  E = E_file ∪ E_func ∪ E_route ∪ E_comp ∪ E_ui
边：(e,t) ∈ { dynamic(文件级覆盖), ui(字面量锚定) }
选择 = ∪_{e∈Δ} entityIndex[e]
```

**三个结构性差距**：

1. **没有 `K` 层**：`E×T` 是扁平的，无法回答"这个函数属于哪个组件→哪个路由→哪个测试经过"的传递查询。选择只能"查表"（改了文件→谁跑过文件），不能"推理"。
2. **多粒度 `E` 有名无实**：`E_func/E_route/E_comp` 定义了但几乎没用；A2 第一步证明函数级 diff 归因 + 第二步函数级覆盖能把 Reduction 从 0.625 抬到 0.6805，但 `route`/`component` 还没接入（`main.js` 路由器一改仍全选 6）。
3. **生成/修复走图外规则**：生成用 `coverageGap`（变更单元 − 覆盖单元），修复用 `staleness.classify`（sigMap/segMap 硬规则）——都不是图查询。

---

## 2. 从 codegraph 借来的三样东西

| codegraph 的东西 | 我们怎么用 |
|---|---|
| **统一 Node/Edge 类型系统**（24 节点 × 13 边，`qualifiedName = file::Class.method` + 精确 line/column span） | 照搬其结构，裁剪到 TS/TSX + 增补 test/ui/state 节点 |
| **provenance 纪律**（`tree-sitter`(确定静态) / `heuristic`(不确定) / `scip`(外部索引)） | 扩展到 `dynamic`(运行时) / `symbolic`(AST) / `heuristic`(匹配/推断)。**不确定的边显式标出，永不进召回** |
| **framework 路由 resolver 模式**（`route` 节点绑定 handler/component + `navigates` 边，7 个 router 已验证） | 让 `E_route/E_comp` 真正可用，解决 `main.js` 一改全选的粗粒度 |

---

## 3. graph 长什么样

### 3.1 节点（Node）

沿用 codegraph 的单一 `Node`（`kind` 区分），裁剪 + 增补：

| 层 | kind | 说明 | 来源 |
|---|---|---|---|
| **代码层** | `file` | 文件 | tree-sitter |
| | `function` / `method` | 函数 / 方法 | tree-sitter |
| | `class` / `interface` / `type_alias` / `enum` | 类型 | tree-sitter |
| | `variable` / `constant` | 模块级变量（`routes`/`ITEMS`/`ORDERS`） | tree-sitter |
| | `component` | 前端组件 | framework resolver |
| | `route` | 路由 | framework resolver |
| **桥层** | `ui_node` | 语义 UI 节点（`text/testId/role/aria/href/handler`） | uidiff AST 抽取 |
| | `api_endpoint` | `POST /api/orders` | 静态 + 网络 trace |
| | `state_slice` | `cart.items`、`auth.user` | statedep 读写足迹 |
| | `flag` / `config` / `permission` | 隐式依赖 | 启发式（§6） |
| **测试层** | `test` | E2E 用例（`<spec> > <标题>`） | 已有 |
| | `test_step`（可选） | 单个操作/断言 | trace |

每个 `Node` 带 `qualifiedName`、`filePath`、`startLine/endLine`、`language`（codegraph 已定义）。

### 3.2 边（Edge）

三类边，每类都带 `provenance + confidence + last_seen`：

**A. 结构边 `K`（code→code，照搬 codegraph 的 EDGE_KINDS）**

| 边 | 方向 | 来源 | 用途 |
|---|---|---|---|
| `contains` | file→function→… | tree-sitter（symbolic） | 归属 |
| `calls` | function→function | tree-sitter + dispatch 合成（heuristic） | 调用链 |
| `imports` / `exports` | file→file / file→symbol | tree-sitter（symbolic） | 模块依赖 |
| `references` | symbol→symbol | tree-sitter（symbolic） | 泛化引用 |
| `navigates` | code→route | framework resolver（symbolic） | 路由跳转 |
| `renders` | route→component | framework resolver（symbolic） | 路由→组件 |
| `routes_to` | component→route | framework resolver（symbolic，逆边） | 组件→路由 |

**B. 证据边（test→code/ui/state，我们的贡献）**

| 边 | 方向 | 来源 | 用途 |
|---|---|---|---|
| `executes` | test→function/statement | **运行时插桩（dynamic）** | **召回地基**（命题 1 的 H2） |
| `locates` | test→ui_node | AST 解析定位器 + 运行时锚点（symbolic+dynamic） | 选择精度 / 修复锚 |
| `asserts` | test→entity/field | AST 解析断言目标（symbolic） | **修复诊断** |
| `observes` | test→state_slice/api_endpoint | 网络/状态 trace（dynamic） | 隐式依赖 / 副作用 |

**C. 桥边（code↔浏览器语义）**

| 边 | 方向 | 来源 | 用途 |
|---|---|---|---|
| `binds` | ui_node→handler(function) | JSX/template AST（symbolic） | UI→代码 |
| `guarded_by` | component/route→flag/permission | 启发式 | 隐式依赖 |

### 3.3 边的元数据（每条边都带）

```json
{ "provenance": "dynamic | symbolic | heuristic | scip",
  "confidence": 0.0,
  "last_seen": "2026-11-22",
  "evidence": ["cov.json", "commit_sha", "trace.zip"] }
```

**核心纪律（这是图"足够好"的关键）**：`executes`（dynamic）边是**唯一**参与召回承诺的边；`calls`/`navigates`/`renders`/`locates`/`asserts` 等所有其它边只做**精度细化与生成/修复上下文**，绝不进召回。于是我们可以放心地加 `heuristic` 边（动态分派漏掉的 `calls`、短文本误匹配的 `locates`）而**永远安全**——这是"宁多跑不漏"在图上的正规化（即 codegraph 的 `provenance: heuristic` 范式）。

---

## 4. 三个任务 = 三种遍历

| 任务 | 图查询 | 现在做法 |
|---|---|---|
| **选择** | 从 diff seed 出发，沿 `K`（contains/calls/renders/navigates）**正向**传播到代码实体，再沿 `executes` 证据边落到 test；召回只走 `executes`，结构路径只用于过滤/排序 | `entityIndex[file]` 并集（文件级） |
| **生成** | **反向**：diff 可达（或新增）的代码实体中，**没有入 `executes`/`locates` 证据边**的 → 缺口；从 `K` 取它的 route/component/ui_node 上下文 → 喂生成 prompt | `coverageGap = 变更单元 − 覆盖单元`，上下文硬拼 |
| **修复** | **局部断边**：失败 test 的 `locates`/`asserts` 边指向的实体，恰好是 diff 改过的实体 → 定位断点；Semantic UI Diff 的旧→新实体对 → 修复锚 | `staleness.classify` 的 sigMap/segMap 硬规则 |

**生成/修复为什么能被 graph 做好**：缺口不再是"变更文件 − 覆盖文件"的粗差，而是"哪个函数/组件/路由没有测试证据边"；修复不再是"有没有 testId 映射"，而是"这条测试的哪条 `locates`/`asserts` 边断了、新旧锚是什么"。

---

## 5. 怎么建（分阶段，每阶段验证一次）

| 阶段 | 做什么 | 复用 | 产出/验证 |
|---|---|---|---|
| **Stage 0（已有）** | 扁平 `E×T`，`dynamic`(文件级)+`ui` 边 | 现有 selector/fixtures | Reduction 0.625 |
| **Stage 1（已完成）** | 函数级 `executes`（fixtures 记具名函数）+ `astEntities` 区分 function/variable | A2 第一步+第二步 | Reduction 0.6805，召回 0 漏 |
| **Stage 2（下一步）** | 建 `K` 层：`contains`/`calls`/`imports`/`references`，**只做 TS/TSX（3 个项目）** | **codegraph 的 `src/extraction`（tree-sitter 符号）+ `src/resolution`（import/call 解析）** | 选择沿调用链传播，看 Reduction 再抬多少 |
| **Stage 3** | 接入 `route`/`component`：`renders`/`routes_to`/`navigates` | **codegraph 的 framework resolver（React Router + SvelteKit：actual-budget/tldraw 为 React，mermaid 为 SvelteKit）** | `main.js` 路由改动不再全选 6，按路由定向 |
| **Stage 4** | 加 `locates`/`asserts` 证据边（AST 解析测试的 `getBy*` + `expect(...)`） | 现有 `uidiff.mjs` 锚点匹配 + 新增断言解析 | 修复统一成"断边查询"，替代 sigMap/segMap |
| **Stage 5** | 隐式依赖：`state_slice`/`flag`/`config`/`permission` + 保守闭包 | 现有 `statedep.mjs`（读写足迹）+ 启发式 flag/config 抽取 | 命题 2 从状态推广到 flag/config 等 |

**增量维护**（继承 §3.2）：只有"触达变更实体的测试"重插桩（更新 `executes`）、"变更文件"重抽静态边（更新 `K`）、"变更路由文件"重跑 framework resolver；其余边复用，`last_seen` 过期衰减。全量重建只在索引偏差超阈值时触发。

---

## 6. 建图程序：架构与动态更新（实现蓝图）

**定位**：建图程序**自研**（`diffe2e/pipeline/src/graph/`），运行时**不依赖 codegraph**，只借它的数据模型（node/edge 的 kind 划分、`provenance` 字段）与"tree-sitter 符号解析 + 路由 resolver"的**思路**作参考。解析层对 TS/TSX 直接用 **TypeScript 编译器 API**（我们已依赖、自带符号表、跨度精确）；后续若要无损跨度/多语言再换 tree-sitter。

### 6.1 程序结构：三个提取器 + 图仓库 + 更新器

```
git 仓库(V_old→V_new diff)
   ├─① 代码结构提取器 extract.mjs：读源文件→节点(function/class/variable)+contains/imports/calls 边
   ├─② 路由/组件提取器(Stage 3)：识别 route→component
   └─③ 测试证据提取器：跑测试(executes，Stage 1 已有) + 读脚本(locates/asserts，Stage 4)
        ↓ 全部写进
   图仓库 store.mjs：nodes 表 + edges 表
        ↑ 更新器 update.mjs：拿 diff 做增量
```

### 6.2 数据结构（增量更新的地基）

```
nodes(id, kind, name, qualified_name, file, start_line, end_line, signature)
edges(source, target, kind, provenance, line, last_seen)
```

**节点 id 必须稳定**：`id = file::qualifiedName`（或 hash 之）。一次改动里未改名的符号 id 不变 → 可按 id 做 diff，只增删改变化的部分，而不是推倒重建。

### 6.3 动态更新算法（分两类边）

**静态边（K/locates/asserts，只看源码，便宜）——改哪抽哪：**
1. 对每个变更文件 F 重解析 → 新符号集合；与旧图 F 的符号**按 id 比对** → 得 `新增 / 删除 / 保留(改签名)`。
2. 新增→插节点；删除→删节点+它的边；保留→更新 span/签名。
3. F 内部的 `contains`/`calls` 边重抽后 diff。
4. F 的符号被改名/删除会波及其它文件指向 F 的边 → 只重解析"import 了 F 的文件"（不是全仓）。

**动态边（executes，靠跑测试，贵）——只重跑被波及的：**
5. `T_touch` = `executes` 边指向变更文件的测试；只重跑它们，更新 executes 边。
6. 其余测试复用旧边（H1-H3 下其覆盖不变）。

**衰减与回收：**
7. 每次更新给重新确认的边刷 `last_seen`；目标消失的边删；长期未确认的降 `confidence`。

### 6.4 增量正确性的硬指标

对同一 commit 序列：**增量更新得到的结果，必须与"每个 commit 全量重建"完全一致**。这是"动态更新"正确性的可执行验收标准。

### 6.5 召回安全的依据

召回只认 `executes` 边。增量更新里唯一可能过期的 executes 边只属于 `T_touch`（碰了变更代码的测试），而它们被重跑了；未碰变更代码的测试旧边仍正确。这是 §3.2"正确性条件"的图化表述。

---

## 7. 难点与风险（决定 graph "够不够好"的六件事）

1. **召回/精度必须物理分离**（见 §3.3）——这是唯一不能妥协的一条。
2. **动态分派 / 回调**：`calls` 边对动态分派、高阶函数、回调注册天然不准，只能标 `heuristic`（codegraph 有专门的 dispatch-synthesizer backlog）。召回不受影响（靠 `executes`），但调用链精度打折。
3. **framework 长尾**：codegraph 已覆盖 7 个 client router，但服务端渲染（Rails/Django/Laravel 等 16 个）只有 `route` 无 `navigates`。我们只做 TS/TSX + 3 个项目，先声明约束。
4. **隐式依赖**（flag/config/permission/state/async/cache）：不在任何调用图里，是"文件级覆盖漏选"的真正来源。要么建显式节点，要么保守闭包（命题 2 只是状态一种）。**A2 结果已表明：受控主体函数级只能 +0.056，天花板是 `main.js` 真耦合；真实项目天花板会变成这些隐式边。**
5. **增量维护 + 衰减**：图不能每次提交重建，过期边要衰减，否则图会腐化。
6. **命题 1 的重证**：每加一层粒度（文件→函数→语句），H2 都要从"覆盖完备性"细化重证，保证 `executes` 边仍是召回的上界。

---

## 8. 落到论文与现有代码

- **论文 §3.2**：把 `M` 从"带类型二部索引"改写为"三层 test-code graph（结构层 K + 证据层 + 桥层，每条边带 provenance）"；§3.4 命题 1 的 H2 从"文件级覆盖"细化到"函数/语句级 `executes`"；§3.7/§5 把生成/修复从"规则"改成"图遍历"。
- **现有代码映射**：

| 设计组件 | diffe2e 现状 | codegraph 对应 |
|---|---|---|
| `executes` 边 | `fixtures.ts`（函数级）+ `covinject.mjs` | （codegraph 无，我们新增） |
| `locates`/`ui_node` | `uidiff.mjs` + `domdiff.mjs` | （codegraph 无，我们新增） |
| `K` 层 contains/calls | `astEntities.mjs`（只有行→函数，无 calls） | `src/extraction` + `src/resolution` |
| route/component | 定义了 `E_route/E_comp` 未用 | `frameworks/*.ts` resolver |
| provenance | C4 刚加的 `dynamic/symbolic/heuristic` | `Edge.provenance` |

---

## 9. 下一步

先做**里程碑 1（自建建图程序 + 动态更新，纯静态 K 层）**：用 TS 编译器 API 抽 `function/class/variable` 节点 + `contains/imports/calls` 边 → 写进图仓库 → 实现 diff 增量更新 → 用 actual-budget 的 commit 序列验证"**增量 == 全量**"。验证通过后再做 Stage 2（跨文件 calls 解析）与 Stage 3（路由 resolver）。
