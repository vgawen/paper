# diffe2e — 代码变更感知的 E2E 回归测试闭环

本目录是论文《代码变更感知的 Web 应用端到端回归测试闭环》的**完整实验代码**，覆盖 RQ1–RQ4：

- **RQ1 选择**：三层 test-code graph（结构层 / 路由层 / 测试证据层）+ 四层归因
  （`executes` 函数级覆盖 → `references` 变量引用 → 路由 diff → 文件级回退 + config 全量）；
- **RQ2 生成**：graph 缺口检测（`detectGaps`）+ diff 约束生成 + Graph-RAG few-shot + 有界执行反馈；
- **RQ3 修复**：graph `asserts` 边做断点诊断，规则臂 / LLM 臂修复，ReproBreak 端到端量化；
- **RQ4 成本**：`NetSaving = 1 − (T_select + T_run(Sel)) / T_full`，真实 wall-clock + LLM token/$。

> 快速上手见 `REPRODUCE.md`（环境安装 → 单测 → 主实验 → 真实项目）。
> 数据产物到论文章节的映射见 `docs/THESIS_MAPPING.md`；产物汇总见 `EXPERIMENT_REPORT.md`。

## 流水线

```
V_old 全量跑(逐用例采覆盖)  ──┐
                              ├─ diff(变更文件) ─► 选择 Sel = {t : cov_Vold[t] ∩ diff ≠ ∅}
V_new 全量跑(构造 oracle)   ──┘                    oracle Affected = {t : cov_Vnew[t] ∩ diff ≠ ∅}
                                                  Reduction / Safety / Precision
```

**无信息泄漏纪律**：选择只用 `V_old` 覆盖；`V_new` 全量跑仅用于构造 affected oracle，不参与选择。

## 目录结构

| 路径 | 作用 |
|---|---|
| `pipeline/src/` | **纯函数内核**（无 IO）：diff 解析、覆盖映射、选择器、oracle、指标统计、Semantic UI Diff、规则修复、过时分类、LLM 客户端 |
| `pipeline/src/graph/` | **test-code graph 建图管线**：`extract`（tree-sitter 抽取）、`resolve`（名字解析）、`semanticResolve`（typeChecker 别名/barrel）、`fileRoutes`（SvelteKit 路由）、`testEdges`（executes/navigates/asserts）、`select`（四层归因 + 缺口检测）、`workspace`（monorepo 别名） |
| `pipeline/src/llm/` | 可插拔 LLM 客户端（provider 探测、`LLM_MODEL` 覆盖、无 key 降级 stub） |
| `pipeline/test/` | **16 个测试文件、109 个单测**（纯函数级，不需要浏览器） |
| `experiments/` | **实验驱动**：`lib.mjs`（受控主体 replay 原语）、`run_*.mjs`（各 RQ 脚本）、`compute/analyze/aggregate`（计算与汇总）、`annotate/`（人工校准流程） |
| `experiments/real/` | **真实项目适配层**：`engine.mjs`（安装/注入 CDP 覆盖/跑套件/读覆盖）、`adapters/*.json`（项目配置）、`run_rq1_real*.mjs`、`run_rq2_real.mjs`、`scan_ui.mjs`（离线可激活窗口扫描） |
| `experiments/out/` | **实验产物**：数据集（jsonl）、汇总（json/md）、图（figs/）、标注包与仲裁记录 |
| `subject/base/` | **受控被测主体**：6 个路由的最小 Web 应用 + 6 条 Playwright 用例 |
| `subject/sideeffect/` | **共享状态对照主体**（生产者/消费者两个用例，用于命题 2） |
| `subject/history/` | `seed.mjs`：脚本化构造 25 个 commit（c00–c24）的嵌套 git 历史 |
| `subject/work/` | seed 生成的 git 仓库（**不入库**，实验时生成） |
| `real/` | **真实被测项目 + DOM/UI Diff 适配**（见下方说明） |
| `realproj/` | **ReproBreak 基准实验**（见下方说明） |
| `tools/` | 早期最小原型（`select.mjs` / `mutate.mjs`，跑在根 `tests/` 上），保留作历史参照 |
| `docs/` | 方法文档：`SAFETY.md`（命题与假设）、`MAPPER.md`（映射器）、`COST_MODEL.md`（净收益模型）、`THESIS_MAPPING.md`（产物↔章节）、`RELATED_WORK.md`、`实验说明书.md` |
| `prepare.mjs` | **实验准备脚本**：一次性安装依赖、装浏览器、**全量**克隆所有仓库 |
| `REPRODUCE.md` | 复现指南（由 `aggregate.mjs` 生成） |
| `EXPERIMENT_REPORT.md` | 结果汇总（由 `aggregate.mjs` 生成） |

## `real/` 与 `realproj/` 的区别

两者都涉及"真实项目"，但**服务的研究问题与数据流完全不同**：

| | `real/` | `realproj/` |
|---|---|---|
| **服务对象** | **RQ1（真实项目回放）**、**RQ2（真实项目生成样本）** | **RQ3（真实 locator 修复的边界量化）** |
| **被测项目** | `mermaid-live-editor`（SvelteKit）、`actual`（React，monorepo） | ReproBreak 的 4 个 AUT：`angular-slickgrid`、`koenig`、`openmct`、`microsoft/playwright` |
| **克隆位置** | `real/<项目名>/`（实验时 checkout 各 commit） | `realproj/clones/aut/<owner>__<repo>/` |
| **输入** | git diff + 逐用例覆盖（CDP 注入） | 断裂记录（`results/reprobreak_breaks.json`，449 条）+ 各 commit 的应用源码 |
| **产出** | `experiments/out/real/*_rq1*.jsonl`、`*_rq2*`、净收益 | `realproj/results/reprobreak_e2e*.json/md`（规则臂/LLM 臂 exact-match 与语义等价） |
| **适配代码** | `real/uidiff.mjs`（JSX 抽取）、`real/analyze.mjs`（istanbul 行级分析）、`real/link.mjs`（UI Diff → 测试的 USES_LOCATOR 边） | `realproj/gate.mjs`（可插桩闸门）、`reprobreak.mjs`（离线刻画）、`reprobreak_e2e.mjs`（端到端修复）、`reprobreak_db.mjs`（SQLite→JSON） |
| **核心脚本入口** | `experiments/real/run_rq1_real.mjs`、`run_rq1_real_graph.mjs`、`run_rq2_real.mjs` | `node realproj/reprobreak_e2e.mjs` |

一句话：**`real/` 是"在真实项目上做选择与生成"，`realproj/` 是"在 ReproBreak 基准上量化修复有多难"**。

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

## 真实 LLM API Key

默认不设置 key 时，生成/修复实验会走确定性 stub，便于离线复现。需要跑真实 LLM 对照时，在本目录创建或编辑 `.env`：

```env
DEEPSEEK_API_KEY=你的key
# OPENAI_API_KEY=你的key
# ANTHROPIC_API_KEY=你的key
```

推荐使用 DeepSeek，成本较低。运行时通过 Node 读取 `.env`：

```bash
node --env-file=.env experiments/run_rq2.mjs
node --env-file=.env experiments/run_rq3.mjs
node --env-file=.env realproj/reprobreak_e2e.mjs
```

如果当前 Node 版本不支持 `--env-file`，可以先把 `.env` 导入当前 shell：

```bash
set -a
source .env
set +a
node experiments/run_rq2.mjs
```

provider 检测顺序为 `OPENAI_API_KEY`、`DEEPSEEK_API_KEY`、`ANTHROPIC_API_KEY`；如果同时设置多个 key，会优先使用 OpenAI。`.env` 已被 `.gitignore` 忽略，不要提交真实密钥。

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
