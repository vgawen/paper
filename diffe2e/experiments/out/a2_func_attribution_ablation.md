# A2 函数级覆盖归因消融（受控主体，真实运行）

**日期**：2026-11-22
**对象**：受控主体 24 个变更过渡（`out/rq1_dataset.jsonl` 冻结 oracle + `subject/work` git 历史）
**性质**：**真实运行**（Node 24.22.3 + Playwright/Chromium），非 dry-run。两步都用真实 pipeline 代码执行。

---

## 0. 结论（一句话）

把 `selectByCoverage` 从"文件级"升级到"函数级归因"后，受控主体 Reduction 从 **0.625 → 0.6805（+0.0556，即 +8.9% 相对）**，且**召回无损**（非循环 oracle 的 4 个受影响测试 0 漏选）。收益来自消除两类"文件级误伤"：注释级噪声（c10/c14/c24）与未使用函数新增（c04/c17）；剩余的过选（`main.js` 路由器 → 全选 6）是**真强耦合**，构成覆盖型 RTS 在该主体上的天花板。

## 1. 方法：两步归因

**第一步（diff 侧，函数级 diff 归属）**：`changedEntities`（行号→函数/变量/JSX）为空的变更文件从 Δ 中排除——只排除纯注释/空白/顶层噪声改动。运行时覆盖不动。

**第二步（覆盖侧，函数级运行时覆盖）**：fixture 记录每个测试在每个文件内**实际执行到的具名函数**（CDP `page.coverage` 的 `functionName`，`count>0` 且 `functionName≠''`；顶层模块代码 `functionName=''` 被排除）。归因规则：

- 变更实体是**函数**（`kind='function'`）→ 只选执行了该具名函数的测试；
- 变更实体是**模块级变量**（`kind='variable'`，如 `routes`/`ITEMS`/`ORDERS`）→ 回退到文件级（所有触及该文件的测试）。

`kind` 的区分由 `astEntities.mjs` 完成：箭头/函数绑定的 `const` 判为 `function`，普通 `const/let` 判为 `variable`。

## 2. 结果

| 指标 | 文件级（现状 coverage_only） | 函数级归因 |
|---|---|---|
| Reduction（24 过渡均值） | **0.6250** | **0.6805** |
| 增益 | — | **+0.0556（+8.9% 相对）** |
| 召回（非循环 oracle） | 1.0 | **1.0（0 漏选）** |

被排除的 5 个过渡（`file→func` 为选中数变化）：

| 过渡 | 类型 | 选中变化 | 归因机制 |
|---|---|---|---|
| c04 | multi_file（util.js 加 `discount`） | 2→0 | 第二步：新函数未被任何测试调用 |
| c10 | refactor_noise（home.js 注释） | 1→0 | 第一步：注释不在任何实体内 |
| c14 | logic（实为 orders.js 注释，未实现排序） | 1→0 | 第一步：注释不在任何实体内 |
| c17 | logic（util.js 加 `taxCents`） | 2→0 | 第二步：新函数未被任何测试调用 |
| c24 | refactor_noise（util.js 注释） | 2→0 | 第一步：注释不在任何实体内 |

**未变化**：`main.js` 路由器改动（c03/c12/c13/c19/c23，全选 6）不变——`render()` 与 `routes` 常量被全部 6 条测试在导航/导入时真实执行，是真耦合。

## 3. 关键发现

1. **函数级归因有真实增量**：+0.0556，全部来自消除"文件级误伤"——注释噪声（3 条）与未使用函数新增（2 条），两类共 5/24 过渡。
2. **c14 被正确识破**：manifest 标为 `logic`、desc 写"sort orders"，实际 seed 只前插一行注释，函数级归因正确把它当噪声排除。
3. **召回无损**：4 个真实受影响的测试（c08/c15/c20/c21）在函数级归因下全部仍被选中（`missed=0`），因为它们的变更都落在被测试真实执行到的具名函数或模块级变量上。
4. **天花板 = 真强耦合**：`main.js` 路由器被每一条 E2E 真实执行，函数级也省不了（5 个过渡仍是全选 6），这是覆盖型 RTS 的固有上界，而非本方法的缺陷。

## 4. 对论文的定位建议

函数级归因给出**可测量但有限**的增量（+0.056、召回不变），说明"选择"环节确有"文件级误伤"可消除，但主体 Reduction 的天花板由真强耦合决定。建议论文把 A2 的结论表述为：**函数级覆盖归因在受控主体上把 Reduction 从 0.625 提升到 0.6805（召回 1.0 不变），收益来自注释噪声与未使用函数新增；剩余过选是路由器等共享代码的真耦合，构成天花板**——这是一个诚实的正向增量，而非"与 coverage_only 完全持平"。

## 5. 复现

```bash
node subject/history/seed.mjs                       # 生成 subject/work（含函数级 fixture）
node experiments/a2_func_attribution.mjs            # 第一步：diff 侧归因
node experiments/run_a2_func.mjs                    # 第二步：覆盖侧归因（真实运行，需 Playwright+Chromium）
```

产物：`out/a2_func_result.json`（逐过渡 `sel_file/sel_func/red_*` + `missed`）。
