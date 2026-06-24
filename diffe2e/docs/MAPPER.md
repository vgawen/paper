# 测试↔代码映射器（Test–Code Mapper）：结构、构建与增量维护

> 本文回应评审意见 #3（创新点是"测试到代码的映射器"，但其结构、如何高效构建与维护未说清）。这里把映射器形式化为一个**带类型的二部索引**，给出数据模型、构建算法、**增量维护**规则与复杂度，并定位它在创新点中的角色。对应代码：`coverageMap.mjs`（动态覆盖边）、`uidiff.mjs` / `selector.mjs`（静态 UI 语义边）、`diff.mjs`（变更实体抽取）。

## 1. 映射器是什么：带类型的二部索引

映射器 `M` 是连接**源码实体**与**测试**的带类型二部图：

```
M ⊆ E × T,   E = E_file ∪ E_func ∪ E_route ∪ E_comp ∪ E_ui
```

- 测试节点 `T`：每条 E2E 测试（`"<spec 文件> > <用例标题>"` 作 id）。
- 实体节点 `E`（多粒度）：
  - `E_file`：源码文件（如 `src/cart.js`）；
  - `E_func`：函数/方法；
  - `E_route`：路由/页面路径（如 `/cart`）；
  - `E_comp`：组件；
  - `E_ui`：UI 语义节点——`{ kind, key }`，`kind ∈ {text, testId, role, aria, href, handler}`（来自 JSX/TSX/HTML 静态抽取）。
- 边 `(e, t) ∈ M` 带**类型标签** `type ∈ {dynamic, ui}` 与**来源**：
  - `dynamic`（动态覆盖边）：`t` 在 `V_old` 上**执行**到了实体 `e`（插桩证据）；
  - `ui`（静态语义边）：`t` 的源码**引用**了 UI 语义节点 `e`（定位器/文本匹配证据）。

> 直观：`M` 同时是"测试跑过哪些代码"（dynamic）与"测试通过哪些 UI 锚点定位"（ui）的统一索引。选择 = 在 `M` 上做邻居查询；修复/生成 = 沿 `ui` 边找锚点。

### 1.1 物理 schema（落盘）

```jsonc
{
  "version": "old@<sha>",
  "tests": ["cart.spec.ts > add to cart", "..."],
  "dynamic": {            // 动态覆盖边：test -> 实体列表
    "cart.spec.ts > add to cart": ["src/cart.js", "src/util.js", "route:/cart"]
  },
  "ui": {                 // 静态语义边：test -> UI 语义节点
    "cart.spec.ts > add to cart": [
      {"kind": "testId", "key": "add-btn"},
      {"kind": "text",   "key": "Add to cart"}
    ]
  },
  "entityIndex": {        // 反向索引：实体 -> 触达它的测试（查询用）
    "src/cart.js": ["cart.spec.ts > add to cart"]
  }
}
```

动态边由 `coverageMap.mjs`（`fileLevelFromCDP` / `normalizeCovRecords`）产出；UI 边由 `uidiff.mjs::extractFromCode` + `selector.mjs::selectByUiLocator` 的锚点匹配产出。`entityIndex` 是 `dynamic ∪ ui` 的反向索引，使选择查询为 O(变更实体数 × 平均度)。

## 2. 构建算法（一次全量）

```
build(V_old):
  1. 对每条测试 t ∈ T：插桩执行（istanbul / CDP page.coverage），
     收集执行到的文件/函数/路由 → dynamic[t]                 # 动态边
  2. 对 V_old 的 UI 源码做 AST 抽取 → 全体 UI 语义节点；
     对每条 t，匹配其 spec 源码引用到的语义节点 → ui[t]        # 静态边
  3. 由 dynamic ∪ ui 建反向索引 entityIndex
  4. 落盘 M(version = old@sha)
```

- 复杂度：动态边 = 一次全量插桩跑 ≈ `O(T_run(all))`（与全量执行同阶，是**一次性**成本）；UI 边 = `O(|源码| + |T| × |锚点|)` 的静态分析；反向索引 `O(|M|)`。
- 这步的开销正是评审意见 #4 关心的"选择算法成本"的大头，但它**可被增量维护摊销**（见 §3）。

## 3. 增量维护（回应"如何高效维护"）

> 核心论点：映射器**不需要每次提交重建**。给定上一版本的 `M_old` 与本次 `diff`，只更新受影响部分，其余复用。

```
update(M_old, diff) -> M_new:
  Δ = changedEntities(diff)                       # diff.mjs 解析得到变更实体
  T_touch = ∪_{e ∈ Δ} entityIndex[e]              # 仅触达变更实体的测试
  for t ∈ T_touch:                                # 只对这些测试重插桩
      dynamic_new[t] = instrumentRun(t, V_new)
  for f ∈ changedFiles(diff):                     # 仅变更文件重抽 UI 语义
      reExtractUiEdges(f) 更新 ui[·]
  其余 dynamic[t]、ui[t] 从 M_old 原样复用
  重建受影响部分的 entityIndex
```

- **增量复杂度**：`O(|T_touch| × 单测插桩 + |changedFiles| × 静态抽取)`，与"变更规模"成正比，而非与"全量规模"成正比。
- **正确性条件**：未触达变更实体的测试 `t`（`t ∉ T_touch`）在 H1–H3 下覆盖不变（同 `SAFETY.md` 命题 1 的论证），故复用其旧边是安全的。
- **摊销结论**：首次全量 `build` 成本 `C_build` 单列；此后每次 CI 的映射更新成本 `C_update ≪ C_build`。在长期 CI 中，平均每提交的选择开销趋近 `C_update`，使 `T_select` 远小于 `T_run(all)`（接 `COST_MODEL.md` 的盈亏平衡分析）。

### 3.1 失配检测与回退

- 若检测到插桩盲区（H2 风险）或 `entityIndex` 与实际覆盖偏差超阈值，触发该测试的**强制重建**或回退到全量 `build`，保证安全优先于效率。
- 版本指纹 `version = old@sha` 用于校验 `M_old` 与当前基线一致，避免用错基线映射。

## 4. 在创新点中的定位

本方法的创新不是单点的"选择"或"生成"或"修复"，而是：

1. **持久化、增量维护的测试↔代码映射器 `M`**：把"源码 diff 难以直接对应到浏览器中的用户操作与测试脚本"这一 E2E 核心断点，固化为一个可查询、可演进的索引；
2. **Semantic UI Diff 作为桥**：在 `M` 的 `ui` 边之上，把源码层的 UI 语义变更对应到测试定位器与断言，贯穿**选择（找受影响测试）→ 修复（定位失效锚点）→ 生成（指出未覆盖的新 UI）** 三阶段；
3. **代码变更感知的闭环**：`Δ → M 查询 → 选择 → 运行/修复 → 缺口 → 生成`，全程以 diff 为核心输入，且工具无关（Playwright 仅为实现实例，见标题修订）。

## 5. 论文写作映射

| 论文位置 | 本文对应 | 交付物/代码 |
|---|---|---|
| 方法·总体架构图（5 步闭环 + 映射器中枢） | §4 | 架构图 + `MAPPER.md` |
| 方法·映射器数据模型 | §1 | schema 定义 |
| 方法·构建算法 + 复杂度 | §2 | `coverageMap.mjs` / `uidiff.mjs` |
| 方法·增量维护（高效性论证） | §3 | `diff.mjs` + 增量规则 + 摊销分析 |
| 实验 RQ4·选择开销 | §3.0 摊销 | 接 `COST_MODEL.md` |
