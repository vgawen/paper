# 数据产物 → 论文章节映射

> 论文题目：《代码变更感知的 Web 应用端到端回归测试用例选择与生成方法研究》。
> 本表把每个数据/代码产物对应到论文章节、图表与一句话结论，便于写作时直接引用。
> 所有行均已回填，产物路径即论文数字来源；人工第二标注列由作者本人在未见第一列的条件下完成，κ 已按论文 §5.6 合并。论文表图编号见各行“论文位置”。

## 理论与方法（第 3 章）
| 论文位置 | 来源 | 一句话结论 |
|---|---|---|
| 3.x 安全性命题与证明 | `docs/SAFETY.md` 命题 1 | H1–H3 假设下覆盖臂即安全：`A* ⊆ SelCov ⊆ Sel` |
| 3.x 副作用与状态闭包 | `docs/SAFETY.md` §5 + 命题 2 | 放宽 H3 后用状态闭包 `SelClosed` 保证召回 |
| 3.2 映射器结构与维护 | `docs/MAPPER.md`、`pipeline/src/graph/` | 三层 test-code graph（结构/路由/测试证据层）；`M⊆E×T` 是其测试↔实体投影，含增量维护与复杂度 |
| 3.4 H2′ 归因完备性 | `out/attribution_audit.md`、`out/attribution_audit_actual_desktop.md`、`pipeline/test/attribution.test.mjs` | 匿名/HOC 与限定名错位的兜底：唯一同名解析 + 不可归因回退文件级；24 过渡 3 个零实体均为纯注释、回退 0 次 |
| 3.x 成本模型 | `docs/COST_MODEL.md` | `NetSaving=1−(T_select+T_run(Sel))/T_full`、盈亏平衡、非时间资源 |
| 图 2-1（两维分析框架） | `out/figs/fig2_1_quadrants.svg`；象限定义见论文 §2.1，格内编号取自 §2.2 与 §2.5 | 六格文献分布与 (A2, B1) 定位；编号为示例而非穷举 |
| 图 3-1（系统架构） | `out/figs/fig3_1_arch.svg`；依论文 §3.1 第 124–136 行 | 组件—数据流（非分层），实线/虚线/双线✕ 对应无泄漏纪律三句 |
| 图 3-2（五步闭环） | `out/figs/fig3_2_loop.svg`；依论文 §3.1 五步与 §3.2 增量维护 | ①→⑤ 主链 + ⑤→① 回填边；M 持久化 band |
| 图 3-3（映射器增量维护） | `out/figs/fig3_3_mapper.svg`；依论文 §3.2 | 三层 test-code graph；`update(G_old, diff)` 受影响子图重建（`M` 为投影视图） |
| 图 3-4（Semantic UI Diff） | `out/figs/fig3_4_uidiff.svg`；例 A 依 `subject/history/seed.mjs` 复原的 c07→c08，例 B/C 依 `out/c1_loop.md` | 抽取→两轮匹配（key 精确 / 同标签+同 testId 或 onClick 回退）→ADD/REMOVE/MODIFY |
| 图 5-4（RQ2 三口径） | `out/figs/rq2_three_scopes.svg`；数据 `out/rq2_results.json`、`out/new5_v2_20261108/rq2_new5_v2_results.json`、`out/new10_20261108/rq2_new10_combined.json` | 三套口径 n=3 / n=8 / n=10 并列，不合并；diff 臂四项指标均 1.0 |
| 图 5-5（RQ2 缺口×算子杀伤） | `out/figs/rq2_gap_operator_matrix.svg`；数据 `out/new10_20261108/rq2_new10_combined.json`（逐缺口、`by_class`） | n=10 口径；diff 臂杀伤均值 0.8438，未杀伤点归因到用例未使用该信号 |
| 图 5-6（RQ3 证据阶梯） | `out/figs/rq3_evidence_ladder.svg`；数据 `realproj/results/reprobreak.json`、`reprobreak_e2e.json` | 9604→1172→574→414 四级分母不同，④ 与 ③ 并列 |
| 图 5-7（分仓池量与命中） | `out/figs/rq3_per_repo_minority.svg`；数据 `realproj/results/reprobreak_e2e.json`（`rows[].repo`） | 414 条全池：4 仓池量、每仓 10 条等额抽样、两臂命中；不用于跨仓外推 |
| 图 5-8（协议 B 分布） | `out/figs/rq3_protocolb_distribution.svg`；数据 `out/annotator1_masked.json`、`out/repeats/variance_report.json` | 40/0/0（40/40 有效）；`rb033` 复核结论单列，不回改计数 |
| 图 5-9（RQ4 净收益与 LLM 成本） | `out/figs/rq4_net_saving.svg`；数据 `out/real/actual_desktop_rq4_batch.json`（(a) 逐过渡 NetSaving）、`out/llm_cost.json`（(b) 按实验成本） | (a) 9 个过渡：1 empty + 8 full，mean 0.1111、median 0；(b) 424 次调用估算 $0.111454；`llm_cost.json` 无 NetSaving 字段，两栏不合并 |

## 第 5 章 RQ1：选择
| 论文位置 | 数据/图表来源 | 一句话结论 |
|---|---|---|
| 表 5-1、图 5-1（合成主体） | `out/rq1_summary.md` + `out/rq1_stats.md` + `out/figs/rq1_methods_scatter.svg` | dual 选择 Safety=1.0、Reduction 0.625、Precision 1.0，**与最强覆盖基线 coverage_only 持平**（非优于） |
| 表 5-2（统计检验） | `out/rq1_stats.md` | bias-corrected bootstrap 95% CI、Wilcoxon、Cliff δ、McNemar |
| 表 5-3（副作用） | `out/sideeffect.json` | naive 覆盖 pass→fail 翻转；状态闭包保真 |
| RQ1 逐例等价（50 过渡，图 5-2） | `out/rq1_dataset.jsonl` + `out/real/{tldraw_examples,actual_desktop,mermaid_live}_rq1.jsonl` + `out/figs/rq1_equiv50.svg` | 受控 24 + tldraw 12 + actual 9 + mermaid 5，dual 与 coverage_only 选中集合逐例相同、三指标逐项相同、正收益 0 |
| RQ1 信号消融 | `out/rq1_stats.md`「信号消融」段 | coverage 为安全主干；UI 信号只作并集召回兜底，50 过渡无边际增益；C1 动态 0.333→1.0 属单组件精度证据 |
| RQ1 召回保证（非循环 oracle） | `out/rq1_summary.json` + `out/safety_misses.json` | SafetyEmp=1.0、0 漏选（结果差异 oracle，破除自证） |
| RQ1 变异压力测试 | `out/safety_mutation.json` | 变异真值下 mean SafetyEmp=1.0、all_safe=true |
| 表 5-4、图 5-3（真实项目） | `out/real/*_rq1.json` + `out/real/real_rq1_stats.md` + `out/figs/rq1_real_transitions.svg` | 2 个真实项目、14 个稳定过渡；dual Safety/Precision=1.0，uidiff 稀疏触发且命中项均已被覆盖臂包含；图 5-3 为逐过渡 `|Sel|` 与 Safety（取代早期英文占位 `out/real/figs/real_rq1.svg`，后者按方法均值出图且数值与表 5-4 不符） |

## 第 5 章 RQ2：生成
| 论文位置 | 数据/图表来源 | 一句话结论 |
|---|---|---|
| 表 5-5（RQ2 双臂） | `out/rq2_results.md` + `out/rq2_results.json` | diff 约束臂 vs 无约束基线的 executable/change-relevant 率；c03/nodiff 单格已按钉住环境复核修正（nodiff 臂全 0），取证见 `out/repro_c03_20261108/REPRO_C03_FORENSICS.md` |
| 表 5-5b（RQ2 扩样补充 b，n=8） | `out/new5_v2_20261108/RQ2_NEW5_V2_REPORT.md` + `rq2_new5_v2_results.json` | 同一批 16 条用例换用 v2 算子（文本优先改结果文本、属性改 label+aria 整链）；diff 变异杀伤均值 0.5625→0.7792，文本类 0/8→7/8、属性类 3/8→11/17 |
| 表 5-5c（RQ2 扩样补充 c，n=10） | `out/new10_20261108/RQ2_NEW10_REPORT.md` + `rq2_new10_combined.json` | 新增 y01–y05 后与 x01–x05 合并（不含主实验 c03/c13/c19）；diff 变异杀伤均值 0.8438、exec/change-relevant/版本敏感 1.0，nodiff exec 0.2、其余 0；预注册清单 `manifest_expansion_v2.json` |
| 扩样 diff 臂人工盲评包 | `out/new10_20261108/annotation_packet/`（独立 `SHA256SUMS`、`LEAKAGE_CHECK.json` PASS、解盲键 `new10_packet_unblind.json`） | 独立 case_id `nb001`–`nb005`，协议 B 第二列 + 第三人仲裁；与主实验包互不复用 |
| 表 5-10（RQ2 人工复核） | `out/rq2_real_to_annotate.csv` + `out/*_unblind.json` + `out/annotator1_masked.json` + `out/repeats/variance_report.md` | 30 条真实项目样本（actual 28 + mermaid 2；diff/nodiff 各 15）；现行协议 B 预标注 diff 2/15、nodiff 0/15；作者盲评第二列 30/30 判 n；Po=0.9333、κ=0（常量列退化）、AC1=0.929 |

## 第 5 章 RQ3：修复
| 论文位置 | 数据/图表来源 | 一句话结论 |
|---|---|---|
| 表 5-6（RQ3 受控主体） | `out/rq3_results.md` | 规则 3/4、LLM 4/4；TargetedSetUsability 0→0.75 |
| RQ3 ReproBreak 离线刻画 | `realproj/results/reprobreak.md` + `reprobreak.json` | 9604 真实断裂；语义可达 12.2%；改写器上界 574/578=99.3% |
| 表 5-7（ReproBreak 端到端） | `realproj/results/reprobreak_e2e.json`、`reprobreak_e2e_v2.json` | 规则 14/414=3.38%；LLM 主批（flash）30/414=7.25%；v2 候选+POM 27/414=6.52%；语义子集 n=90 上 33.33%（flash）；真实 locator 修复边界证据 |
| ReproBreak 语义子集 pro 对照 | `realproj/results/reprobreak_e2e_pro90.json`、`reprobreak_pro90_compare.{json,md}`、`llm_usage_pro90.jsonl` | 同 n=90 子集：pro 语义 30.00% vs flash 33.33%（exact 23.33% vs 26.67%）；配对 McNemar b=4/c=1、p=0.375，不显著；模型升级未提升修复率 |
| 表 5-8、表 5-10（RQ3 人工复核） | `out/rq3_reprobreak_to_annotate.csv` + `out/*_blind.csv` + `out/annotator1_masked.json` | 40 条现行协议 B 预标注 SO=40、EC=0、SR=0；作者盲评第二列 40/40 SO；Po=1.0、不报 κ；模型标签恒为 STRUCTURAL_ONLY，模型-人工 κ 仅描述性 |

## 第 5 章 RQ4：成本
| 论文位置 | 数据/图表来源 | 一句话结论 |
|---|---|---|
| RQ4 合成主体执行量 | `EXPERIMENT_REPORT.md` §4 | 测试执行量下降 62.5%（Safety=1.0） |
| 表 5-9（RQ4 真实 wall-clock + NetSaving） | `out/real/cand_coverage_rq4.json`、`out/real/actual_desktop_rq4.json` | full vs selected 的 median/IQR、NetSaving、盈亏平衡、machine-minutes；cand_coverage 已计入 `T_select`，actual_desktop 单场景仍为 selected=0 边界案例 |
| RQ4 图选择 62 用例成本测算 | `out/real/actual_desktop_rq4_graph.md` | T_full=168s、T_run(1)=19.5s、T_select≈9.1s（冷启动静态建图上界）；NetSaving 94.6% / 83.0% / −5.4% 为成本模型测算值，不是逐臂重复 3 次的分布 |
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

## 2026-11-09 增补：§5.3 分仓构成披露与 RQ3 数字口径
| 论文位置 | 来源 | 一句话结论 |
|---|---|---|
| §5.3「分仓构成与可读边界」 | `realproj/results/reprobreak_e2e.json` → `rows[].repo`、`rows[].rule`、`rows[].llm`；分项目表见 `realproj/results/reprobreak_e2e.md` | 414 条池构成 245/78/46/45（59.2%/18.8%/11.1%/10.9%）；规则臂 0/7/6/1、LLM 臂 4/3/7/16；LLM 30 条命中中 16 条（53.3%）来自 microsoft/playwright（16/45=35.6%），池量最大的 ghiscoding/angular-slickgrid 两臂合计 4/245=1.63%；总体 7.25% 为按池量加权的混合值，不宜读作各仓普适水平 |
| §5.3「抽样设计带来的同类偏斜」 | `experiments/out/rq3_reprobreak_to_annotate.csv` → `repo` 列（40 行，各 10 条） | 40 条复核样本为每仓等额 10 条，抽样比 4.1%（10/245）–22.2%（10/45），小仓约为大仓 5.4 倍；分层只作用于仓库、不作用于过时类型，故 40 条分布不代表池构成，也不代表各仓普适水平 |
| 图 5-9（已出图，不改） | `experiments/out/figs/rq3_per_repo_minority.svg` | 与上两段同源；正文新增段与图注在 14/45=31.1%、4.1%–22.2%、5.4 倍三处重复，属图内自洽与正文论证的双重表述，不需改图 |
| 全文数字口径核查 | 论文全文（中英文摘要、§4.4、§5.3、§5.5、§6、§7） | 当前主批为 3.38%（14/414）与 7.25%（30/414）；早期批 5.56%（23/414）仅作为重跑波动在 §5.3 非确定性说明中出现；语义子集 n=90 为 33.33%。各数字均带分母或限定在 ReproBreak/4 个真实项目，属描述性陈述 |

口径说明：当前主批 `7.25% = 30/414`、`3.38% = 14/414` 是四个仓库的混合率（早期批 `5.56% = 23/414` 仅作重跑波动披露）；分仓率只用于披露构成，不用于仓库类型归因（本文未做该类检验）。

## 2026-11-10 增补：五张示意图的前置正文定义
| 论文位置 | 来源 | 一句话结论 |
|---|---|---|
| §3.1 五步闭环（第 128 行第 5 步「回填」） | `pipeline/src/` 主链路（选择→运行分诊→缺口生成→并入 `T`）；对应 `out/rq1_dataset.jsonl` 中每条过渡的 `prev_sha/sha` 与 `selected_count` | 生成通过的测试并入 `T`，在后续提交的第 1 步被重新插桩建边、`M` 增量更新；`T` 与 `M` 跨提交共同演进，五步闭合成环（此前正文止于「生成」） |
| §3.2 `kind` 六类（第 141 行） | `pipeline/src/uidiff.mjs#L12`（`ANCHOR_ATTRS` 9 项）、`#L46-L49`（节点字段）、`#L88`（`FIELDS` 10 项） | `text`（可见文本 + `name`/`title`/`placeholder`）、`testId`（`data-testid`/`testID`）、`role`、`aria`（`aria-label`）、`href` 为属性类信号；`handler` 为唯一非属性类信号（`onClick`/`onSubmit` 的处理函数名），`key` 取信号值 |
| §3.3 属性集归档规则（第 171 行） | 同上 `uidiff.mjs#L12`；`#L80-L86`（`keyOf` 身份判定）、`#L95-L119`（`semanticDiffNodes` 两轮匹配） | 属性集按 `testId`/`role`/`aria`/`href`/`text` 五类归档，与 `kind` 双向可推；`handler` 无对应 HTML 属性，单列为非属性类信号，不留悬空项 |
| §3.3 ADD/REMOVE/MODIFY 粒度（第 163 行） | `uidiff.mjs#L99-L118` | 三类变更均以**节点**为单位；MODIFY 为节点级、内含字段级 `changes`；身份先按 `key`，`key` 变化时以"同标签 + 同 `testId` 或同 `handler`"回退匹配，仍记 MODIFY（例 `text: "Red"→"Crimson"`） |
| §2.1 四象限处置（第 82 行）、§2.5 定位句（第 114 行） | `docs/RELATED_WORK.md` 两维框架；论文 §2.2–§2.4 的族归属 | `(A2, B1)` 为目标象限；`(A1, B1)` 检索范围内无代表工作（未占据的相邻方向）；`(A0, B0)` 为成熟拥挤领域，只作背景引用（[27][36]）；写法统一为半角括号 + 逗号后空格 |

口径说明：本轮只补正文定义，未改任何表值、图、盲评包与冻结清单；正文改前 `0956fba7…`、改后 `7bb68224…`，逐处登记见 `论文回填改动记录_2026-11-08.md` §15。

