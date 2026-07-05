# 数据产物 → 论文章节映射

> 论文题目：《代码变更感知的 Web 应用端到端回归测试用例选择与生成方法研究》。
> 本表把每个数据/代码产物对应到论文章节、图表与一句话结论，便于写作时直接引用。
> 标注 `[待真实数据]` 的行需要先接入真实项目 / LLM key / ReproBreak DB 才有最终数字；已补齐的行保留产物路径作为论文数字来源。

## 理论与方法（第 3 章）
| 论文位置 | 来源 | 一句话结论 |
|---|---|---|
| 3.x 安全性命题与证明 | `docs/SAFETY.md` 命题 1 | H1–H3 假设下覆盖臂即安全：`A* ⊆ SelCov ⊆ Sel` |
| 3.x 副作用与状态闭包 | `docs/SAFETY.md` §5 + 命题 2 | 放宽 H3 后用状态闭包 `SelClosed` 保证召回 |
| 3.x 映射器结构与维护 | `docs/MAPPER.md` | 带类型二部索引 `M⊆E×T`：动态覆盖边 + 静态 UI 语义边，含增量维护与复杂度 |
| 3.x 成本模型 | `docs/COST_MODEL.md` | `NetSaving=1−(T_select+T_run(Sel))/T_full`、盈亏平衡、非时间资源 |

## 第 4 章 RQ1：选择
| 论文位置 | 数据/图表来源 | 一句话结论 |
|---|---|---|
| RQ1 表（合成主体） | `out/rq1_summary.md` + `out/rq1_stats.md` | dual 选择 Safety=1.0、Reduction 0.625、Precision 1.0 |
| RQ1 图 | `out/figs/rq1_metrics.svg` | 方法 vs 基线（retest_all/random_k/static_heuristic） |
| RQ1 信号消融 | `out/rq1_stats.md`「信号消融」段 | coverage 为安全主干；UI 信号在粗覆盖处增益（C1 动态 0.33→1.0） |
| RQ1 召回保证（非循环 oracle） | `out/rq1_summary.json` + `out/safety_misses.json` | SafetyEmp=1.0、0 漏选（结果差异 oracle，破除自证） |
| RQ1 变异压力测试 | `out/safety_mutation.json` | 变异真值下 mean SafetyEmp=1.0、all_safe=true |
| RQ1 真实项目 `[待真实数据]` | `out/real/*_rq1.json` + `out/real/real_rq1_stats.md` + `figs/real_rq1.svg` | 跨 ≥2 真实项目 commit-replay 的选择指标 + CI + 显著性 |

## 第 4 章 RQ2：生成
| 论文位置 | 数据/图表来源 | 一句话结论 |
|---|---|---|
| RQ2 双臂表 | `out/rq2_results.md` | diff 约束臂 vs 无约束基线的 executable/change-relevant 率 |
| RQ2 语义有效率 + κ `[待真实数据]` | `out/rq2_annotation.json`（盲标注 `rq2_to_annotate.jsonl` + 解盲键 `rq2_unblind.json`） | 双标注 κ≥0.6；diff 臂语义有效率显著高于 nodiff |

## 第 4 章 RQ3：修复
| 论文位置 | 数据/图表来源 | 一句话结论 |
|---|---|---|
| RQ3 合成主体 | `out/rq3_results.md` | 修复成功率 2/2；TargetedSetUsability 0→1 |
| RQ3 ReproBreak 离线刻画 | `realproj/results/reprobreak.md` | 9604 真实断裂；语义可达 12.2%；改写器上界 574/578=99.3% |
| RQ3 ReproBreak 端到端（无泄漏）`[待真实数据]` | `realproj/results/reprobreak_e2e.json` | 规则 vs LLM 端到端 exact-match 修复率（仅用旧测试 + 应用 diff） |
| RQ3 过时分类 κ `[待真实数据]` | `out/rq3_staleness_*`（待挂钩） | 模型 vs 人工三分类一致率与 κ |

## 第 4 章 RQ4：成本
| 论文位置 | 数据/图表来源 | 一句话结论 |
|---|---|---|
| RQ4 合成主体执行量 | `EXPERIMENT_REPORT.md` §4 | 测试执行量下降 62.5%（Safety=1.0） |
| RQ4 真实 wall-clock + NetSaving | `out/real/cand_coverage_rq4.json`、`out/real/actual_desktop_rq4.json` | full vs selected 的 median/IQR、NetSaving、盈亏平衡、machine-minutes；`T_select` hook 待补 |

## 第 2 章 相关工作 / 第 5 章 威胁
| 论文位置 | 数据/图表来源 | 一句话结论 |
|---|---|---|
| 相关工作矩阵 | `docs/RELATED_WORK.md` | 两维框架（变更感知 × E2E 全局上下文），(A2,B1) 空白即本方法定位 |
| 副作用 live 证据 | `experiments/out/sideeffect.json` + `SAFETY.md §5.3` | naive 覆盖在共享状态下 pass→fail 翻转（不保真）；状态闭包保真 |
| 有效性威胁 | `EXPERIMENT_REPORT.md` §6 | 诚实局限与边界 |

## 复现
| 项 | 来源 |
|---|---|
| 一键复现 | `REPRODUCE.md`（seed → run_rq1..3 → analyze → aggregate） |
| 真实项目接入协议 | `experiments/real/ONBOARDING.md` |
| 标注规范 | `experiments/annotate/PROTOCOL.md` |
