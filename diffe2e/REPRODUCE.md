# 复现指南（DiffE2E 实验）

## 阶段 0：实验准备（一次性）

**先跑完准备，再跑实验**——所有仓库为**全量克隆**、依赖与浏览器提前装好，
实验脚本执行期间不再触发 clone / install，避免网络与版本漂移带来的不确定性。

```bash
cd diffe2e
node prepare.mjs                 # 幂等：已就绪的步骤自动跳过
node prepare.mjs --force         # 强制重装/重克隆
node prepare.mjs --only=deps     # 只做依赖（deps | browsers | repos | data）
```

`prepare.mjs` 做四件事：

1. **运行时检查**：Node 24+；
2. **依赖**：`pipeline`（typescript + tree-sitter 原生模块）、`subject/base`、`subject/sideeffect` 的 `npm install`，并自检 tree-sitter 可加载；
3. **浏览器**：`subject/base` 下 `playwright install chromium`；
4. **全量克隆**（无 `--depth` / `--filter`）：
   - `real/mermaid-live-editor`、`real/actual`（后者自动 `corepack yarn install`）——RQ1 真实回放 / RQ2 真实样本；
   - `realproj/clones/aut/{angular-slickgrid,koenig,openmct,playwright}`——RQ3 ReproBreak 端到端修复。

> **受限网络 / 离线复现**：`prepare.mjs` 支持 `DIFFE2E_CLONE_MIRROR=/path/to/mirror`，优先从本地镜像
> （目录名同目标仓库，如 `microsoft__playwright`）克隆，origin 仍指回 GitHub；开始前用 `df` 检查可用空间
> （`DIFFE2E_MIN_FREE_GB`，默认 10 GB）。全量历史不能换成 `--depth=1`：实验要在任意历史 commit 的父提交上 checkout。

完成后脚本会打印就绪清单；有步骤失败时（多为网络）**直接重跑即可**，已完成项自动跳过。

> 已知环境坑（prepare 已覆盖）：`tree-sitter` 需要 C++ 构建链；Playwright 每版本绑定特定 Chromium，
> 回放历史 commit 时需在其目录 `playwright install chromium`（`run_rq1_real_graph.mjs#ensureBrowser()` 会自动处理）。

- 无 key 时走确定性 stub，只能复现 pipeline 可运行性；论文中的真实 RQ2/RQ3 LLM 数字需要 `.env` 中的 `DEEPSEEK_API_KEY`（或其他 provider key）。
- `node --env-file=.env ...` 会读取本地 key；`.env` 不提交。

## 单元测试
```bash
cd diffe2e
node --test pipeline/test/*.test.mjs experiments/*.test.mjs experiments/real/*.test.mjs experiments/annotate/*.test.mjs
```

## 打包送审归档

```bash
cd diffe2e
node tools/package_archive.mjs ../Archive.zip --force   # 顶层目录为 diffe2e/，仅含 git 跟踪文件
```

归档用 `git archive` 生成：不含 `.git/`、`node_modules/`、`.DS_Store`、`__MACOSX/`，也不会把根目录遗留的
`cov/vold|vnew` 带进去。**先提交再打包**——`git archive` 取 HEAD，未提交改动不会进入归档。

## 阶段 1：主实验（无需 LLM key，准备完成后直接运行）
```bash
cd diffe2e
node subject/history/seed.mjs        # 构造 25-commit 真实历史（c00–c24）
# —— 主方法：test-code graph 四层归因（表 5-1 -> out/rq1_graph.json）——
node experiments/run_a2_func.mjs     # 【前置】逐过渡采集函数级 CDP 覆盖（需 Playwright+Chromium）
node experiments/run_graph_selection.mjs
node experiments/verify_graph_incremental.mjs   # 增量 == 全量（受控主体 25 commit）
node experiments/verify_real_incremental.mjs real/mermaid-live-editor src 8   # 真实项目（需 clone）
# —— 文件级基线 / 消融（表 5-1a）——
node experiments/run_rq1.mjs         # RQ1 选择：dataset + summary
node experiments/analyze.mjs         # RQ1 统计 + SVG 图
node experiments/uidiff_loop.mjs     # C1 闭环(静态,真实JSX): 语义UI Diff 驱动 选/生/修
node experiments/run_c1_dynamic.mjs  # C1 动态(真实React项目): 实跑 选/生/修(自动还原)
node realproj/gate.mjs               # 真实项目可插桩闸门
node experiments/aggregate.mjs       # 汇总 -> EXPERIMENT_REPORT.md
```

## 阶段 2：真实 LLM 与 RQ4
```bash
cd diffe2e
node --env-file=.env experiments/run_rq2.mjs
node --env-file=.env experiments/run_rq3.mjs
node experiments/run_rq4_cost.mjs experiments/real/adapters/cand_coverage.json "App.test.ts -g \"use Red as a background color\"" 1 3 3
node experiments/run_rq4_cost.mjs experiments/real/adapters/actual_desktop.json "" 2 3 34
node experiments/run_rq4_batch.mjs experiments/out/real/actual_desktop_rq1.jsonl experiments/out/real/actual_desktop_rq4.json dual
node experiments/run_llm_cost.mjs
node experiments/aggregate.mjs
```

## 阶段 3：ReproBreak（RQ3 修复边界）
```bash
cd diffe2e
git clone --depth 1 https://github.com/rub-sq/ReproBreak realproj/clones/ReproBreak  # 真实 locator 断裂数据
node realproj/reprobreak.mjs         # ReproBreak 真实数据子实验(可达性+改写器精确匹配)
RB_LIMIT=449 node --env-file=.env realproj/reprobreak_e2e.mjs  # 端到端规则臂 + LLM 臂
```

### 模型能力对照（pro vs flash，n=90，可选）

```bash
cd diffe2e
# RB_SUBSET=semantic 只跑 distinctive 语义子集（与论文 n=90 完全相同的筛选）；RB_DRY=1 可先预览
LLM_MODEL=deepseek-v4-pro RB_SUBSET=semantic RB_LIMIT=90 RB_CONCURRENCY=6 \
  RB_OUT=realproj/results/reprobreak_e2e_pro90.json \
  LLM_USAGE_OUT=realproj/results/llm_usage_pro90.jsonl \
  node --env-file=.env realproj/reprobreak_e2e.mjs
node experiments/real/compare_pro90.mjs   # 同子集配对对照 + McNemar -> reprobreak_pro90_compare.md
```

## 产物
- experiments/out/rq1_dataset.jsonl, rq1_summary.md, rq1_stats.md, figs/rq1_metrics.svg
- experiments/out/rq2_results.md, rq3_results.md, llm_cost.md, aggregate.json
- experiments/out/real/*_rq1.json, *_rq4.json, *_rq4_batch.json, real_rq1_stats.md
- realproj/results/reprobreak.md, reprobreak_e2e.md
- EXPERIMENT_REPORT.md, realproj/results/REPORT.md

## 人工校准
```bash
# 填写 experiments/out/rq2_real_to_annotate.csv 后：
node experiments/annotate/score.mjs experiments/out/rq2_real_to_annotate.csv
# 填写 experiments/out/rq3_staleness_to_annotate.csv 后：
node experiments/annotate/score.mjs experiments/out/rq3_staleness_to_annotate.csv
```
