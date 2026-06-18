# DiffE2E 实验报告（面向代码变更的 Playwright E2E 针对性回归测试）

## 0. 概览
- 主体：受控多文件应用（6+ 路由、共享 util），真实 git 历史 17 个 commit、16 个变更过渡。
- 全流程零外部依赖、可一键复现；生成/修复使用可插拔 LLM 客户端（无 key 时走确定性 stub）。
- 无信息泄漏：选择只用 V_old 覆盖 + diff；V_new 全量覆盖仅用于构造 affected oracle。

## 1. RQ1 选择：最小且安全的针对性测试集
| 方法 | Reduction | Safety | Precision |
|---|---|---|---|
| ours | 0.6562 | 1 | 1 |
| retest_all | 0 | 1 | 0.3438 |
| random_k | 0.6562 | 0.375 | 0.375 |
| static_heuristic | 0.8646 | 0.75 | 1 |

- ours bootstrap 95% CI：Reduction 0.6562 (0.5–0.8021)、Safety 1 (1–1)、Precision 1。
- 显著性（ours vs 基线）：
  - vs retest_all: Reduction Wilcoxon p=0.0017 (Cliff δ=0.8125); Safety p=1 (δ=0); McNemar(安全) b=0,c=0,χ²=0。
  - vs random_k: Reduction Wilcoxon p=1 (Cliff δ=0); Safety p=0.0039 (δ=0.6875); McNemar(安全) b=11,c=0,χ²=9.0909。
  - vs static_heuristic: Reduction Wilcoxon p=0.1003 (Cliff δ=-0.4336); Safety p=0.1003 (δ=0.25); McNemar(安全) b=4,c=0,χ²=2.25。
- 结论：ours 是唯一同时做到 Safety=1.0 且高 Reduction 的方法；random 同规模但不安全（漏选），static 启发式在共享 util/router 变更上漏选。

### 按变更类型（ours）
| 类型 | n | Reduction | Safety | Precision |
|---|---|---|---|---|
| ui_text | 4 | 0.833 | 1.000 | 1.000 |
| logic | 4 | 0.833 | 1.000 | 1.000 |
| new_feature_gap | 2 | 0.000 | 1.000 | 1.000 |
| multi_file | 2 | 0.667 | 1.000 | 1.000 |
| locator_break | 1 | 0.833 | 1.000 | 1.000 |
| refactor_noise | 1 | 0.833 | 1.000 | 1.000 |
| route | 1 | 0.000 | 1.000 | 1.000 |
| assertion_break | 1 | 0.833 | 1.000 | 1.000 |

## 2. RQ2 生成：覆盖缺口补齐
- provider=stub，缺口数 n=2：可执行率=1，变更相关率=1。
- 语义有效率=NA（需人工/LLM 评判；候选见 out/rq2_to_annotate.jsonl）。

## 3. RQ3 修复：让选中的失效用例重新可用
- 修复成功率=1.000 (2/2)；TargetedSetUsability：before 0.000 → after 1.000。
- 过时分类：定位失效→STRUCTURAL_ONLY（语义定位重写），期望变化→EXPECTATION_CHANGE（断言更新）。

## 4. RQ4 成本/效率
- 跨 16 个过渡：retest-all 共执行 96 次用例；ours 仅执行 33 次 → 测试执行量下降 65.6%（Safety 仍=1.0）。
- 生成/修复均为按需触发（仅缺口/失效用例），额外成本与变更规模成正比。

## 5. 外部效度（真实项目，尽力而为）
- cand_coverage: Playwright=true, 覆盖方法=istanbul (vite-plugin-istanbul), E2E=3, 闸门=PASS (per-test coverage produced), 可replay=false。
- cand_movies: Playwright=true, 覆盖方法=CDP page.coverage, E2E=71, 闸门=PASS (method available), 可replay=false。
- 详见 realproj/results/REPORT.md。多 commit 真实历史 replay 因浅克隆/需逐 commit 运行环境列为后续工作。

## 6. 有效性威胁与局限
- 主体为受控工程，量化结论的外部效度有限；真实多 commit replay 为后续工作。
- 生成/修复用确定性 stub（无 LLM key）：可执行率/相关性/修复率可测，语义有效率需人工或真实 LLM。
- 覆盖映射在 bundler 行号变换下子文件级需 sourcemap 反查；本实验采用文件级归属（干净）+ locator/UI 信号（不依赖行号）。
- Semantic UI Diff 在“文案与 handler 同时变更”时静态匹配会退化为 ADD/REMOVE，需运行时 DOM 邻域匹配消歧。

## 7. 复现
见 REPRODUCE.md（一键：seed → run_rq1..3 → analyze → aggregate）。
