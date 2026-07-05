# 数据产物 → 论文章节映射

> 论文题目：《代码变更感知的 Web 应用端到端回归测试用例选择与生成方法研究》。
> 本表把每个数据/代码产物对应到论文章节、图表与一句话结论，便于写作时直接引用。
> 标注 `[待人工校准]` 的行需要人工标注后才能给出最终 κ；已补齐的行保留产物路径作为论文数字来源。

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
| RQ1 真实项目 | `out/real/*_rq1.json` + `out/real/real_rq1_stats.md` + `figs/real_rq1.svg` | 2 个真实项目、14 个稳定过渡；dual Safety/Precision=1.0，uidiff 稀疏但高精度 |

## 第 4 章 RQ2：生成
| 论文位置 | 数据/图表来源 | 一句话结论 |
|---|---|---|
| RQ2 双臂表 | `out/rq2_results.md` | diff 约束臂 vs 无约束基线的 executable/change-relevant 率 |
| RQ2 人工小样本校准 `[待人工校准]` | `out/rq2_to_annotate.jsonl` + `out/rq2_unblind.json` + `annotate/sheet.csv` | 自动指标为主；人工双标注仅校准 semantic-validity 与 κ |

## 第 4 章 RQ3：修复
| 论文位置 | 数据/图表来源 | 一句话结论 |
|---|---|---|
| RQ3 合成主体 | `out/rq3_results.md` | 修复成功率 2/2；TargetedSetUsability 0→1 |
| RQ3 ReproBreak 离线刻画 | `realproj/results/reprobreak.md` | 9604 真实断裂；语义可达 12.2%；改写器上界 574/578=99.3% |
| RQ3 ReproBreak 端到端（无泄漏） | `realproj/results/reprobreak_e2e.json` | 规则 14/414=3.38%，DeepSeek 23/414=5.56%；真实 locator 修复边界证据 |
| RQ3 过时分类 κ `[待人工校准]` | `out/rq3_staleness_to_annotate.csv` + `annotate/score.mjs` | 模型 vs 人工三分类 accuracy/κ；评分链路已就绪，待人工标签 |

## 第 4 章 RQ4：成本
| 论文位置 | 数据/图表来源 | 一句话结论 |
|---|---|---|
| RQ4 合成主体执行量 | `EXPERIMENT_REPORT.md` §4 | 测试执行量下降 62.5%（Safety=1.0） |
| RQ4 真实 wall-clock + NetSaving | `out/real/cand_coverage_rq4.json`、`out/real/actual_desktop_rq4.json` | full vs selected 的 median/IQR、NetSaving、盈亏平衡、machine-minutes；cand_coverage 已计入 `T_select`，actual_desktop 单场景仍为 selected=0 边界案例 |
| RQ4 多过渡平均 | `out/real/actual_desktop_rq4_batch.{json,md}` | actual_desktop 9 个过渡：1 empty / 8 full，mean NetSaving 11.1%、median NetSaving 0%、break-even 11.1%；说明平均收益受全选过渡限制 |
| RQ4 LLM token/$ 成本 | `out/llm_cost.{json,md}` | 424 次 LLM 调用估算约 757.8k input / 19.1k output tokens，按 DeepSeek v4-flash 约 $0.111；早期实验未保存精确 usage，后续可用 `LLM_USAGE_OUT` 记录 |

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
