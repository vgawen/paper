# 复现指南（DiffE2E 实验）

## 环境
- Node 24+（用到内置 node:test）。
- 首次运行先安装依赖（`node_modules/` 与 `real/cand_coverage/` 均被 gitignore，不在仓库内）：
```bash
cd diffe2e
npm install --prefix pipeline
npm install
npm install --prefix subject/base
npm install --prefix subject/sideeffect
npx playwright install chromium
```
- 无 key 时走确定性 stub，只能复现 pipeline 可运行性；论文中的真实 RQ2/RQ3 LLM 数字需要 `.env` 中的 `DEEPSEEK_API_KEY`（或其他 provider key）。
- `node --env-file=.env ...` 会读取本地 key；`.env` 不提交。
- C1 动态实验依赖 `real/cand_coverage/`；缺失时对应测试会跳过（skip），不影响其余单测。

### 浏览器版本隔离（历史批次复跑）

`npx playwright install chromium` 装的是当前依赖（1.61.0）对应的 chromium 1228，只够主实验与 tldraw。阶段三（x01–x05 v1、`new5_v2`）与 c03 的 1.54 对照臂固定 `@playwright/test 1.54.0` + chromium 1181，而新装 1.61 会删掉默认缓存里的 1181，故改用独立目录，默认缓存不动：

```bash
PLAYWRIGHT_BROWSERS_PATH="$HOME/.cache/pw-1181" npx -y playwright@1.54.0 install chromium
# 复跑示例（工作副本需自带 1.54.0 的 node_modules）
cd /tmp/expv2/work_main
PLAYWRIGHT_BROWSERS_PATH="$HOME/.cache/pw-1181" COV_OUT=/tmp/ver1181/cov npx playwright test tests/_gen_diff_c03.spec.ts
```

- 不设该变量时 1.54 会直接报 `Executable doesn't exist at …/ms-playwright/chromium_headless_shell-1181/…`，说明 1228 无法替代，必须隔离。
- 已实测（2026-11-10）：`_gen_diff_c03` 在 c03 上 1 passed；`_gen_nodiff_c03` 在 c03 上因 `getByText(/Cart/i)` 命中 3 元素而 strict-mode 失败，与 c03/nodiff 的更正结论一致。
- 1228 保持在默认路径 `~/Library/Caches/ms-playwright`，另镜像一份到 `~/.cache/pw-1228`，与 `~/.cache/pw-1181` 并列；复跑时按批次挂对应目录即可，默认缓存本身不被改动。
- 已实测两个目录都能独立启动：`PLAYWRIGHT_BROWSERS_PATH=~/.cache/pw-1228 npx -y playwright@1.61.0 screenshot …` 与 `PLAYWRIGHT_BROWSERS_PATH=~/.cache/pw-1181 npx -y playwright@1.54.0 screenshot …` 均成功出图（各约 2 s）。

## 单元测试
```bash
cd diffe2e
node --test pipeline/test/*.test.mjs experiments/*.test.mjs experiments/real/*.test.mjs experiments/annotate/*.test.mjs
```

## 快速复现（无需 LLM key）
```bash
cd diffe2e
node subject/history/seed.mjs        # 构造 16-commit 真实历史到 subject/work/
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
node experiments/annotate/make_sheet.mjs
# 填写 experiments/annotate/sheet.csv 后：
node experiments/annotate/score.mjs
# 填写 experiments/out/rq3_staleness_to_annotate.csv 后：
node experiments/annotate/score.mjs experiments/out/rq3_staleness_to_annotate.csv
```
