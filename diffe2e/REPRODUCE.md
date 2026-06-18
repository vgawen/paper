# 复现指南（DiffE2E 实验）

## 环境
- Node 24+（用到内置 node:test）; 已随仓库安装 pipeline/subject 依赖。
- 无需任何 LLM API key（默认确定性 stub）；如需真实模型，设 OPENAI_API_KEY/ANTHROPIC_API_KEY/DEEPSEEK_API_KEY。

## 单元测试
```bash
cd diffe2e/pipeline && node --test
cd ../experiments && node --test
```

## 端到端实验（一键）
```bash
cd diffe2e
node subject/history/seed.mjs        # 构造 16-commit 真实历史到 subject/work/
node experiments/run_rq1.mjs         # RQ1 选择：dataset + summary
node experiments/analyze.mjs         # RQ1 统计 + SVG 图
node experiments/run_rq2.mjs         # RQ2 缺口生成
node experiments/run_rq3.mjs         # RQ3 修复
node experiments/uidiff_loop.mjs     # C1 闭环(静态,真实JSX): 语义UI Diff 驱动 选/生/修
node experiments/run_c1_dynamic.mjs  # C1 动态(真实React项目): 实跑 选/生/修(自动还原)
node realproj/gate.mjs               # 真实项目可插桩闸门
git clone --depth 1 https://github.com/rub-sq/ReproBreak realproj/clones/ReproBreak  # 真实 locator 断裂数据
node realproj/reprobreak.mjs         # ReproBreak 真实数据子实验(可达性+改写器精确匹配)
node experiments/aggregate.mjs       # 汇总 -> EXPERIMENT_REPORT.md
```

## 产物
- experiments/out/rq1_dataset.jsonl, rq1_summary.md, rq1_stats.md, figs/rq1_metrics.svg
- experiments/out/rq2_results.md, rq3_results.md, aggregate.json
- EXPERIMENT_REPORT.md, realproj/results/REPORT.md

## 切换真实 LLM
设置上述任一 API key 后重跑 run_rq2/run_rq3，生成/修复将走真实模型（client.provider != stub）。
