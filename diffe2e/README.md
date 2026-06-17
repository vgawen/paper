# diffe2e — 面向代码变更的 Playwright E2E 针对性回归测试（RQ1 最小闭环）

本目录是论文核心 **RQ1** 的可运行最小验证：
> 基于 **V_old 覆盖映射 + diff** 选择相关 E2E 测试，是否可行、有效？

**只验证选择**，不涉及 LLM / 生成 / 修复（那是后续增强模块）。

## 流水线

```
V_old 全量跑(逐用例采覆盖)  ──┐
                              ├─ diff(变更文件) ─► 选择 Sel = {t : cov_Vold[t] ∩ diff ≠ ∅}
V_new 全量跑(构造 oracle)   ──┘                    oracle Affected = {t : cov_Vnew[t] ∩ diff ≠ ∅}
                                                  Reduction / Safety / Precision
```

**无信息泄漏纪律**：选择只用 `V_old` 覆盖；`V_new` 全量跑仅用于构造 affected oracle，不参与选择。

## 目录

```
demo-app/            受控被测应用（hash 路由 + 动态 import，按路由分文件，便于逐用例覆盖归属）
  server.mjs         极简静态服务器（no-store，保证每次执行新鲜覆盖）
  public/src/*.js    home/cart/login/profile + main(共享路由)
tests/
  fixtures.ts        覆盖采集 fixture：每个用例 start/stopJSCoverage，落盘 cov/<run>/<test>.json
  *.spec.ts          4 个 E2E 用例
tools/
  select.mjs         选择 + oracle + 指标计算
  mutate.mjs         模拟一次 diff（默认对 cart.js 做非破坏性变更）生成 V_new
```

## 一键复现

```bash
npm install
npx playwright install chromium

# 1) 采集 V_old 逐用例覆盖
COV_OUT=cov/vold npx playwright test

# 2) 施加变更 -> V_new，采集 oracle，再还原
node tools/mutate.mjs apply
COV_OUT=cov/vnew npx playwright test
node tools/mutate.mjs revert

# 3) 给定 diff，算指标
node tools/select.mjs --vold cov/vold --vnew cov/vnew --diff src/cart.js
```

## 已验证结果（绿灯）

| 场景 | diff | 选中 | Reduction | Safety | Precision |
|---|---|---|---|---|---|
| A 单文件 | src/cart.js | cart | 0.75 | 1.0 | 1.0 |
| B 共享文件 | src/main.js | 全部 4 | 0.0 | 1.0 | 1.0 |
| C 多文件 | cart.js,login.js | cart,login | 0.5 | 1.0 | 1.0 |
| D 无覆盖文件 | src/admin.js | 无 | 1.0 | 1.0 | (空) |

- 逐用例覆盖归属干净：home 用例不加载 cart.js（动态 import 隔离）。
- 场景 D = 变更无相关已有测试 → 覆盖缺口 100%，正是后续**生成模块**的动机。

## 指标定义（与开题/实验方案一致）

- `Reduction = 1 - |Sel| / |S|`
- `Safety   = |Sel ∩ Affected| / |Affected|`（affected 召回，安全性）
- `Precision= |Sel ∩ Affected| / |Sel|`（选择精确性）

---

# 数据集构造规范（每个样本一行）

迁移到真实 E2EGit 项目时，每个 commit 样本记录以下字段（建议存 CSV/JSONL）：

| 字段 | 含义 |
|---|---|
| project | 项目名 / 仓库地址 |
| old_commit / new_commit | V_old、V_new 的 commit SHA |
| diff_type | UI文案 / 路由 / 组件 / 逻辑 / 配置 / 混合 |
| changed_files | diff 涉及的源码文件（被测应用代码，排除测试与构建产物） |
| full_suite_n | V_old 全量 E2E 用例数 |
| selected_n | 选中用例数 |
| affected_oracle | V_new 全量跑得到的 affected 用例集合 |
| Reduction / Safety / Precision | 三项指标 |
| selected_failed | 选中但在 V_new 失败的用例（→ 修复模块输入） |
| failure_reason | locator失效 / 断言过时 / 真实回归 / flaky |
| repairable | 是否可由修复模块修好（后续填） |
| coverage_ok | 该项目逐用例覆盖是否稳定采到（可插桩闸门） |

## 真实项目筛选闸门（按优先级）

1. **可本地构建 + 插桩**：能以插桩模式启动被测应用（nyc/babel-plugin-istanbul 或 CDP JS coverage + source map），且测试打的是该本地实例。**测试打远程/压缩产物的项目直接排除。**
2. JS/TS 前端，Playwright 套件能稳定跑（先确认全绿基线）。
3. commit 历史中存在 UI/路由/组件变更，且变更前已有相关 E2E。
4. 逐用例覆盖需串行执行（workers=1）+ 用例前后 reset/dump，避免覆盖混淆。

## 已知局限与下一步

- 当前为文件级（L1）归属；路由/组件级（L2）、元素级（L3）为后续增强。
- demo 用 CDP JS coverage 直接按 URL 归属（源码未打包）；真实项目若打包需经 source map 反映射。
- 下一步：选 1 个满足闸门 1 的真实项目，套用本闭环跑 20–30 个 commit 小样本。
