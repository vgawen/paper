# 复现指南（DiffE2E 实验）

## 环境
- Node 24+（用到内置 node:test）。
- **依赖需自行安装**（仓库不含 node_modules）：
```bash
cd diffe2e
(cd pipeline && npm install)                      # typescript + tree-sitter + tree-sitter-typescript
(cd subject/base && npm install && npx playwright install chromium)
```
- 真实项目（可选，RQ1 真实回放/RQ2 样本）：`git clone` mermaid-live-editor 与 actualbudget/actual 到 `real/`，actual 需 `corepack yarn install`。
- 已知坑：旧 commit 需在其目录 `playwright install chromium`（版本漂移）；`--filter=blob:none` 部分克隆缺历史 blob（脚本 `ensureCommit()` 会自动 `--depth=1` 抓取）。
- 无 key 时走确定性 stub，只能复现 pipeline 可运行性；论文中的真实 RQ2/RQ3 LLM 数字需要 `.env` 中的 `DEEPSEEK_API_KEY`（或其他 provider key）。
- `node --env-file=.env ...` 会读取本地 key；`.env` 不提交。

## 单元测试
```bash
cd diffe2e
node --test pipeline/test/*.test.mjs experiments/*.test.mjs experiments/real/*.test.mjs experiments/annotate/*.test.mjs
```

## 快速复现（无需 LLM key）
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

## 真实 LLM 与 RQ4 复现
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

## ReproBreak 复现
```bash
cd diffe2e
git clone --depth 1 https://github.com/rub-sq/ReproBreak realproj/clones/ReproBreak  # 真实 locator 断裂数据
node realproj/reprobreak.mjs         # ReproBreak 真实数据子实验(可达性+改写器精确匹配)
RB_LIMIT=449 node --env-file=.env realproj/reprobreak_e2e.mjs  # 端到端规则臂 + LLM 臂
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
