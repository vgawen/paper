# 条件 A/B 回填影响清单（已执行，正文按协议 B 回填）

状态（2026-11-08 更新）：作者决定以**协议 B**（`out/annotator1_masked.json`）为正式预标注列，条件 A（`out/annotator1_condA.json`）只作敏感性对照，原第一列仅历史参照。正文已按此口径回填 §5.2、§5.3/表 5-8、§5.6/表 5-10、摘要、§6、§7、附录 A.3 与 A.4。

> **2026-11-08 作废声明**：下列“实际结果”记录的上一轮 B/A 数字（RQ2 0/15 与 0/15、RQ3 有效 39 且 39/0/0、A vs B 0 翻转）**因 `max_tokens=500` 被 reasoning tokens 耗尽（`rb001`、`rb033` 空 completion，且失败条目被对比脚本静默排除）以及 RQ3 断言级 diff 在 13/39 条上遮蔽后 `-`/`+` 行完全相同而作废**。正文中相关数字已回滚为“待重算”；本轮重跑结果见文末“重跑结果（修复后）”。

实际结果（B 为准；**以下为已作废的上一轮结果，仅留档**）：

- RQ2：diff 0/15、nodiff 0/15（y=0，n=30）。与原列比：配对 30，一致 25，5 条 `y→n`（16.67%）。A 与 B：30/30 一致，0 翻转。
- RQ3：有效 39/40，STRUCTURAL_ONLY=39、EXPECTATION_CHANGE=0、SUSPECTED_REGRESSION=0；`rb001` 空 completion，单独重试 1 次仍失败。与原列比：配对 39，3 条翻转（7.69%：`rb021` SR→SO、`rb024` EC→SO、`rb033` EC→SO）。A 与 B：配对 38（A 失败 `rb033`、B 失败 `rb001`），0 翻转。
- 冲突（该结论已随数字作废，重算后再判断）：B 的 RQ2 方向与表 5-5 自动语义有效率 1.0 相反，上一轮正文曾如实记录。
- κ：人工列为空（RQ2 0/30、RQ3 0/40），`human vs B` 与 `human vs A` 都不可计算。

下文是原始分支清单，保留作回填依据的历史记录；其中“A 为正式列”的假设已被作者决定取代。

## 0. 口径

- `orig`：原第一列（原信息条件，模型/参数/prompt 不可考），仅作历史参照，不进入结论。
- `A`：条件 A 重做，固定 `deepseek-v4-flash`、`temperature=0`、`max_tokens=2000`（预算阶梯 2000→4000→8000）、`retries=3`，与 masked 共用同一份 prompt；材料为**近似**原信息条件，已知偏差见 `out/condA_material/condA_material_manifest.json` 的 `known_deviations`。
- `masked`：方案 C 的协议-B 盲评条件重做（实际采用为正式列）。
- `human`：人工第二列（仍为空，RQ2 0/30、RQ3 0/40）。
- 列位置：B 结果 `out/annotator1_masked.json`，A 结果 `out/annotator1_condA.json`；原列 `annotator1_yn` / `human1` 保留不动。
- 两个 κ 目前都**无法计算**：κ 需要 human 列；没有 human 时不得用准确率/F1 代替。

## 1. 必须先写进正文的“条件 A 说明”（新增，不是替换）

在 §5.6 的标注协议段落（约第 438 行附近）新增 3–4 句：

1. 预标注由固定模型与参数生成：`deepseek-v4-flash`，`temperature=0`，`max_tokens=500`，逐条独立调用，prompt 与 masked 条件一致。
2. 条件 A 的材料是**近似重建**：RQ2 为 `route + gap_file + spec`；RQ3 为 `old_locator + 旧测试行 + commit 说明 + 应用改动文件列表 + 未遮蔽的断言级 diff + new_locator`，不含完整 `it` 块与应用源码 diff。
3. 原第一列与条件 A 的差异**只能粗略反映模型/参数效应**，不是精确复现；原因是原列的模型、版本、温度、prompt 与材料快照均无记录。
4. 原列保留为历史参照，正文结论一律使用条件 A 的数字。

## 2. §5.2（RQ2 生成）

当前正文（第 362 行）：

> “第一标注列为 LLM 辅助预标注（附逐条理由）：diff 臂 5/15 判为语义有效（y），nodiff 臂 0/15”。

分支：

- **若 A 与原列完全相同（5/15、0/15）**：数字不变，但把“第一标注列”改为“条件 A 预标注列（deepseek-v4-flash，temperature=0）”，并补一句“原列作历史参照，差异为 0”。
- **若 A 的 y 数不同**：把该句改为 A 的实际分臂数（diff X/15、nodiff Y/15）；如需保留历史，改为“条件 A 为 X/15 与 Y/15；原列历史值为 5/15 与 0/15，仅作参照”。
- **若 A 的 diff > nodiff 方向消失或翻转**：同一段“该方向与自动指标一致”改为“条件 A 未复现该方向”，并明确这只影响预标注构念效度，不改变表 5-5 的自动指标。
- **第 360 行“κ 反映预标注-人工一致性”**：补一句“κ 将对条件 A 与 human 计算；原列不再参与 κ”。

不受影响：表 5-5 的自动语义指标与 §5.2 受控主体 n=3 结果。

## 3. §5.3（RQ3 闭环与修复边界）

当前正文：表 5-8（第 403-409 行）`STRUCTURAL_ONLY=37 / EXPECTATION_CHANGE=2 / SUSPECTED_REGRESSION=1`；第 411 行“40 条中 37 条同标签，κ 对少数类极敏感”。

分支：

- **若 A 与原列相同（37/2/1）**：表 5-8 数字不变，标签来源改为“条件 A 预标注”；第 411 行的 37 保留。
- **若 A 分布不同**：表 5-8 三行计数全部替换为 A 的计数；第 411 行的 37 替换为 A 的多数类计数。
- **若 A 的多数类不再极端偏斜**：重写“κ 对少数类极敏感”的判断；保留“必须同时报告样本构成与混淆矩阵”。
- **若同时执行 masked**：可在表 5-8 加一列或加一张小表，列 `A` 与 `masked` 两套计数；不得只报其中一套。
- **第 411 行“模型-人工 κ 不具区分度”**：该结论针对 `model_label`（恒为 STRUCTURAL_ONLY），与 A 无关，保留；补一句“预标注列的条件会影响多数类构成，κ 的解释随分布而定”。

不受影响：§5.3 的规则/LLM 修复率（3.38%、5.56%）、已知信号上界 99.3%、449/414 样本流程。

## 4. §5.6 与表 5-10（人工一致性校准）

- **第 438 行“先由 LLM 依据显式判据做预标注并附逐条理由，形成第一标注列”**：改为“条件 A 预标注列（固定模型/参数，近似原信息条件）”+“原列仅作历史参照”两句。
- **表 5-10（第 442-445 行）**：
  - “第一标注列”来源改为 `A`；RQ2 行填 A 的 y 数与分臂数；RQ3 行填 A 的三类计数。
  - 原列如需展示，只放在表注或附录，标注“历史参照，不参与结论”。
  - “Cohen's κ”列仍为“待合并”，并注明“human vs A”；若也执行 masked，再列“human vs masked”。
- **第 447 行“不得打开含第一标注列的主表、`*_unblind.json`、逐条理由文件”**：仍适用；补充“条件 A 只读 `out/condA_material/`，不回读原列与 unblind key”。
- **第 461 行“合并后……其余章节与数字不受影响”**：改为列出受影响位置（§5.2、§5.3、表 5-8、表 5-10、摘要、附录 A.3）。

## 5. 摘要

- **中文摘要（第 17 行）**“30 条真实项目人工复核样本上，diff 臂与 nodiff 臂的第一标注列语义有效数分别为 5/15 与 0/15”：
  - 改为“条件 A 预标注列（deepseek-v4-flash，temperature=0）为 X/15 与 Y/15”。
  - 不再使用“第一标注列”这一含混说法；原列数字不写进摘要。
- **英文摘要（第 27 行）**“a 30-case real-project human review is directionally consistent (5/15 vs. 0/15)”：
  - 改为 “under the reconstructed original-information condition with a fixed model (X/15 vs Y/15)”。
  - 若方向消失，删除 “directionally consistent”，改述为 “did not reproduce the direction”。
- **κ 句**仍写“第二标注者与 κ 合并流程见 §5.6”；κ 未算出前不得写成已有 κ 数值。
- **新增一句限定（中英文各一句）**：条件 A 是近似重建，原第一列无生成链记录，A 与原列的差异只能粗略反映模型/参数效应。

## 6. 附录 A.3

- 当前“第一标注列已完成”改为“条件 A 预标注列已完成/待完成（取决于运行状态）”。
- 增加一张小表，逐项列出 `known_deviations`（原 prompt、温度、旧测试行截取范围、是否读过 unblind、是否展示应用 diff 等），不要把近似写成原件。
- 说明 κ 将只对 `human vs A` 计算；原列不参与。
- 若也执行 masked，附录列出 masked 的模型/参数/prompt 哈希与材料哈希，作为稳健性对照。

## 7. 定稿自动审计清单

需要新增/修改的核对项：

- “第一标注列 5/15、0/15”改为“条件 A：X/15、Y/15”；原列 5/15、0/15 标注为历史参照。
- “RQ3 37/2/1”改为“条件 A：SO/EC/SR 实际计数”。
- “表 5-10 第一标注列”改为“条件 A 列”。
- “κ 待合并”保留，并注明对比对象是 `human vs A`。
- 新增核对项：“正文是否声明条件 A 为近似重建，并列出已知偏差”。
- 新增核对项：“正文是否出现把 A 与原列差异归因为单一信息条件变化的表述”（若出现即为不合格）。

## 8. 当前不能做的事

- 不能给出 A 的翻转条数、方向或混淆矩阵：`annotator1_condA.json` 尚不存在。
- 不能给出任何 κ：人工第二列为空（RQ2 0/30、RQ3 0/40）。
- 不能用本地规则、写死标签或人工扮演模型来填充 A 结果。
- 不能把 A 描述为“原第一列的精确复现”；只能写“固定模型/参数下的近似重建”。

## 9. 运行门槛（key 到位后）

1. `node experiments/annotate/build_condA_material.mjs`（已可离线运行，40/40 compare 缓存命中）。
2. `node experiments/annotate/run_annotator1_condA.mjs --dry-parse`（已通过：RQ2 30、RQ3 40、new_locator 40/40）。
3. `DEEPSEEK_API_KEY=... node experiments/annotate/run_annotator1_condA.mjs`。
4. `node experiments/annotate/compare_annotator1.mjs --input experiments/out/annotator1_condA.json --write`。

## 10. 重跑结果（修复后，2026-11-08）

> **本节 B 结果已被 §11（方案一遮蔽重跑）取代。** 本节保留修复 `max_tokens` 与 `<LOCATOR_CHANGED>` 后的上一轮记录；A 结果未变，B 的 RQ2 分布与 A vs B 翻转数以 §11 为准。

修复项已生效：`max_tokens=2000`、预算阶梯 `[2000,4000,8000]`、`finish_reason=length` 视为预算不足并升档、失败条目写入 `failures_list`；RQ3 断言 diff 对 locator-only 变化在 `+` 侧标 `<LOCATOR_CHANGED>`；RQ2/RQ3 保守项按族定义（RQ3 保守项为 `SUSPECTED_REGRESSION`）。

**运行完整性**

| 条件 | RQ2 | RQ3 | 失败清单 |
|---|---|---|---|
| A（`annotator1_condA.json`） | 30/30 ok | 40/40 ok | 空 |
| B（`annotator1_masked.json`） | 30/30 ok | 40/40 ok | 空 |

`rb001` 与 `rb033` 在两套条件中均成功，且未互相填补：A 的 `rb001=SO`（2000，1 次）、`rb033=EC`（4000，2 次）；B 的 `rb001=SO`（4000，2 次）、`rb033=SO`（2000，1 次）。

**各自分布**

| 条件 | RQ2 y / n | RQ3 SO / EC / SR | 预算分布 |
|---|---|---|---|
| A | 1 / 29 | 37 / 3 / 0 | RQ2 全 2000；RQ3 37 条 2000、3 条 4000 |
| B | 2 / 28 | 40 / 0 / 0 | RQ2 全 2000；RQ3 38 条 2000、2 条 4000 |

**A vs B（同模型、同 prompt、仅材料不同）**

- RQ2：配对 30，一致 27，翻转 3（10.00%）。`rq2_007` y→n；`rq2_023` n→y；`rq2_029` n→y。
- RQ3：配对 40，一致 37，翻转 3（7.50%）。`rb033` EC→SO；`rb039` EC→SO；`rb040` EC→SO。
- 混淆矩阵：

| A \ B | y | n |
|---|---|---|
| y | 0 | 1 |
| n | 2 | 27 |

| A \ B | SO | EC | SR |
|---|---|---|---|
| SO | 37 | 0 | 0 |
| EC | 3 | 0 | 0 |
| SR | 0 | 0 | 0 |

**原第一列 vs B（仅历史参照）**

- RQ2：配对 30，一致 27，翻转 3（10.00%）：`rq2_007`、`rq2_019`、`rq2_025` 均 y→n。
- RQ3：配对 40，一致 37，翻转 3（7.50%）：`rb021` SR→SO、`rb024` EC→SO、`rb033` EC→SO。
- 混淆矩阵：RQ2 原 y→B y=2、原 y→B n=3、原 n→B n=25、原 n→B y=0；RQ3 原 SO→B SO=37、原 EC→B SO=2、原 SR→B SO=1，B 侧无 EC/SR。

**遮蔽修复验证**

对 `out/annotation_packet/rq3_context.md` 的断言级 diff 统计：共 530 个 `-`/`+` 配对，遮蔽后全等配对仅剩 1 个（`rb027`），且该对不含 locator（是真实 diff 中同一行同时出现在两侧）。此前 13 条 locator-only 全等案例已归零；`rb024`、`rb033` 已出现 `<LOCATOR_CHANGED>`。

**论文状态**

按回滚要求，正文相关位置仍为“待重算”占位，未用上述新数字回填；逐处原文与回滚后文本见 `论文回填改动记录_2026-11-08.md` §7。新数字仅记录于本文件与两份对比报告：`out/annotator1_masked_comparison.md`、`out/annotator1_condA_vs_masked_comparison.md`。

## 11. 方案一遮蔽重跑（2026-11-08）

作者选定方案一：**只遮机械寻址路径，保留语义锚**。规则与披露措辞见 `ANNOTATION_GUIDE.md` §6.4；判定原则是“说明断言对象是什么就保留，只说明怎么找到它就遮蔽”，混合表达式保留 role 与 name、遮蔽其余。

**材料重建与验证**

- RQ3 协议 B 材料重建完成，40/40 PASS。
- 遮蔽对象：CSS 选择器、id/class、`data-testid`/`data-*` 的值、`nth()`/`first()`/`last()` 索引、xpath、`page.$` 类选择器字符串、`new_locator` 路径片段。
- 机械片段在**已发放的断言级 diff**中精确、空白归一化与 token 命中均为 0；若片段与 `old_locator`/旧测试块相同，单独记录为已披露旧定位器，不计为新泄露。
- 语义锚（role/name/文本/hasText）按协议允许可见，逐条值、类型、出现次数与理由见 `out/annotation_packet/redaction_verification.md` 的“按协议允许可见的语义锚”一节。
- 重新计算材料哈希，`out/annotation_packet/SHA256SUMS` 已更新并通过 `shasum -a 256 -c` 校验。

**B 重跑（模型与参数不变：`deepseek-v4-flash`，`temperature=0`，`max_tokens=2000`，预算阶梯 2000→4000→8000）**

| 条件 | RQ2 | RQ3 | 失败清单 |
|---|---|---|---|
| B（方案一材料） | 30/30 ok | 40/40 ok | 空 |

| 条件 | RQ2 y / n | RQ3 SO / EC / SR | 预算分布 |
|---|---|---|---|
| B（方案一） | 1 / 29 | 40 / 0 / 0 | 全部 2000 |

`rb033`、`rb039`、`rb040`、`rb021`、`rb024` 均为 `STRUCTURAL_ONLY`，全部 2000、1 次、`finish_reason=stop`。

**A vs B（A 为上一轮条件 A 结果，未变）**

- RQ2：配对 30，一致 28，翻转 2（6.67%）：`rq2_007` y→n；`rq2_029` n→y。
- RQ3：配对 40，一致 37，翻转 3（7.50%）：`rb033` EC→SO；`rb039` EC→SO；`rb040` EC→SO。
- 混淆矩阵：

| A \ B | y | n |
|---|---|---|
| y | 0 | 1 |
| n | 1 | 28 |

| A \ B | SO | EC | SR |
|---|---|---|---|
| SO | 37 | 0 | 0 |
| EC | 3 | 0 | 0 |
| SR | 0 | 0 | 0 |

**上一轮 B（旧遮蔽规则）vs 方案一 B**

- RQ2：唯一变化为 `rq2_023` y→n（上一轮 y=2：`rq2_023`、`rq2_029`；本轮 y=1：`rq2_029`）。
- RQ3：标签无变化，仍全部 `STRUCTURAL_ONLY`。

**可直接归因于“语义锚现在可见”的标签变化**

- RQ3：**0 条**。
- `rb039`/`rb040` 未翻回 `EXPECTATION_CHANGE`：上一轮遮蔽只替换基础 locator 的参数列表，链式 `filter({hasText:'snippet'})` 本就未被遮蔽；本轮规则没有新增可改变判断的语义信息。
- `rb033` 仍为 `STRUCTURAL_ONLY`：新机械路径 `[data-kg-card="codeblock"]` 仍完整遮蔽为 `locator('<LOCATOR_REDACTED>')`，没有语义锚新增可见。
- `rb021`/`rb024` 仍为 `STRUCTURAL_ONLY`：上一轮 `<LOCATOR_REDACTED>〔role=..., name=...〕` 描述符已暴露 role/name；本轮新可见的 `columnheader` vs `cell`、`Limit` 前缀与 `exact:true` 未改变模型判断。
- `rq2_023` 的 y→n 属 RQ2 重跑波动：RQ2 材料（`gap_file` + spec）未被本次 RQ3 遮蔽改动触及，不能归因于语义锚可见。

**论文状态**

正文“待重算”占位未改，等 B 稳定后统一回填。

## 12. 重复运行波动记录（2026-11-08）

本节只记录重复采样与稳定性证据，不改变论文正文、主表或人工标注列。对应机器可读报告：`experiments/out/repeats/variance_report.md`（同目录另有 `variance_report.json`）。原始逐条落盘：

- B（方案一材料）：run2 `experiments/out/repeats/masked_run2.json`、run3 `experiments/out/repeats/masked_run3.json`；run1 为既有 `experiments/out/annotator1_masked.json`。
- A（近似原信息条件）：run2 `experiments/out/repeats/condA_run2.json`、run3 `experiments/out/repeats/condA_run3.json`；run1 为既有 `experiments/out/annotator1_condA.json`。
- 运行脚本：`experiments/annotate/run_annotator1_repeat.mjs`；分析脚本：`experiments/annotate/analyze_repeats.mjs`。

### 12.1 运行与材料一致性

模型与参数未变：`deepseek-v4-flash`、`temperature=0`、`max_tokens=2000`、预算阶梯 2000→4000→8000、`retries=3`。每次运行前逐条校验材料 SHA256 与每条 prompt 哈希，均与 run1 一致；4 次重复共 280 次调用全部成功，`failures_list` 为空；每条均保留 `usage` 与 `raw_output`。

| 条件 | run2 文件 | run3 文件 | 失败条目 |
|---|---|---|---|
| B | `out/repeats/masked_run2.json` | `out/repeats/masked_run3.json` | 0 |
| A | `out/repeats/condA_run2.json` | `out/repeats/condA_run3.json` | 0 |

预算升档但均成功（未改变判定口径）：B RQ3 run2 仅 `rb001@4000`；A RQ3 run1 `rb021`/`rb033`/`rb039@4000`，run2 `rb031`/`rb035`/`rb039@4000`，run3 `rb003`/`rb021`/`rb033@4000`。

### 12.2 三次分布与多数票

| 条件 | 样本族 | run1 | run2 | run3 | 三次多数票 |
|---|---|---|---|---|---|
| B | RQ2 | y=1 / n=29 | y=2 / n=28 | y=2 / n=28 | **y=2 / n=28** |
| B | RQ3 | SO=40 | SO=40 | SO=40 | **SO=40** |
| A | RQ2 | y=1 / n=29 | y=1 / n=29 | y=2 / n=28 | **y=1 / n=29** |
| A | RQ3 | SO=37 / EC=3 | SO=38 / EC=2 | SO=38 / EC=2 | **SO=38 / EC=2** |

多数票相对 run1 的差异：

- B RQ2：`y=1/n=29` → `y=2/n=28`；唯一变化为 `rq2_023` n→y。
- A RQ3：`SO=37/EC=3` → `SO=38/EC=2`；唯一变化为 `rb040` EC→SO。
- B RQ3、A RQ2 的多数票分布与 run1 相同。

### 12.3 逐条一致率（140 条 × 3 次）

| 条件 | 样本族 | 3/3 | 2/3 | 1/3 |
|---|---|---|---|---|
| B | RQ2 | 29 | 1 | 0 |
| B | RQ3 | 40 | 0 | 0 |
| A | RQ2 | 29 | 1 | 0 |
| A | RQ3 | 39 | 1 | 0 |
| 合计 | RQ2（60） | 58 | 2 | 0 |
| 合计 | RQ3（80） | 79 | 1 | 0 |
| **合计（140）** | | **137** | **3** | **0** |

相对 run1，280 次重复调用中共 5 次标签翻转（1.79%）：B run2 `rq2_023` n→y、B run3 `rq2_023` n→y、A run2 `rb040` EC→SO、A run3 `rq2_019` n→y、A run3 `rb040` EC→SO。

### 12.4 不稳定样本与 reasoning token

除下列 3 条外，其余 137 条三次标签完全一致；B 的 RQ3 40 条无一条不稳定。

| 条件/族 | case | 序列（run1/run2/run3） | 多数票 | reasoning tokens（run1/run2/run3） | prompt 长度 | 材料长度 | 材料特征 |
|---|---|---|---|---|---|---|---|
| B RQ2 | `rq2_023` | n / y / y | y | 1674 / 196 / 300 | 3511 | 3004 | actual_desktop；应用 diff 3 hunk；spec 9 行 |
| A RQ2 | `rq2_019` | n / n / y | n | 144 / 281 / 361 | 925 | 418 | actual_desktop；无应用 diff；spec 6 行 |
| A RQ3 | `rb040` | EC / SO / SO | SO | 442 / 300 / 1102 | 3163 | 2450 | tryghost/koenig；无完整旧块、无应用 diff；断言 diff 1 行 |

特征判读：

- 不稳定不是“长材料”导致。prompt 长度中位数：B RQ2 稳定 3168 / 不稳定 3511（略长）；A RQ2 稳定 1239 / 不稳定 925（更短）；A RQ3 稳定 5907 / 不稳定 3163（明显更短）。
- 共同点是证据间接、落在判据边界：`rq2_023` 的应用 diff 改了标题组件（`ReportCardName`，包裹在 `showTitle` 条件下），测试断言同一标题；`rq2_019` 无应用 diff、只有通用 selector；`rb040` 是测试侧 `waitForSelector` → `locator+filter({hasText})`，无应用 diff、无完整旧块。
- 同一 prompt 下 reasoning 长度差异大（`rq2_023` 1674/196/300；`rb040` 442/300/1102），说明温度 0 下仍存在“推理深度不同 → 判据边界摆动”，与材料长度不是同一因素。
- 唯一出现 RQ3 不稳定的条件族是 A（材料更稀疏）；B 的 RQ3 三次全稳。

### 12.5 rb033 / rb039 / rb040 的 A/B 断言 diff 原文

A 来源 `experiments/out/condA_material/rq3_condA.md`；B 来源 `experiments/out/annotation_packet/rq3_context.md`。以下照录原文；B 材料生成器会裁掉行首缩进，这不是遮蔽。

**rb033（A 三次均 EC；B 三次均 SO）**

```text
A[0] @@ -372,21 +372,21 @@ test.describe('Plus button', async () => {
B[0] @@ -372,21 +372,21 @@ test.describe('Plus button', async () => {

A[1] -            await expect(page.locator('[data-kg-card="markdown"]')).toBeVisible();
B[1] -await expect(page.locator('<LOCATOR_REDACTED>')).toBeVisible();

A[2] +            await expect(page.locator('[data-kg-card="codeblock"]')).toBeVisible();
B[2] +await expect(page.locator('<LOCATOR_CHANGED>')).toBeVisible();
```

| 行 | B 中被替换 | 两侧一致 |
|---|---|---|
| [0] hunk 头 | 无 | 整行完全一致 |
| [1] 删除行 | `'[data-kg-card="markdown"]'` → `'<LOCATOR_REDACTED>'` | `await expect(page.locator(` + `)).toBeVisible();` |
| [2] 新增行 | `'[data-kg-card="codeblock"]'` → `'<LOCATOR_CHANGED>'` | `await expect(page.locator(` + `)).toBeVisible();` |

A 另有 `新定位器：page.locator('[data-kg-card="codeblock"]'))`；B 无新定位器，`+` 侧只剩“路径已变更”。

**rb039（A 三次均 EC；B 三次均 SO）**

```text
A[0] @@ -241,7 +241,7 @@ test.describe('Bookmark card (with searchLinks)', async () => {
B[0] @@ -241,7 +241,7 @@ test.describe('Bookmark card (with searchLinks)', async () => {

A[1] +        await expect(page.locator('[data-kg-cardmenu-selected="true"]').filter({hasText: 'snippet'})).toBeVisible();
B[1] +await expect(page.locator('<LOCATOR_REDACTED>').filter({hasText: 'snippet'})).toBeVisible();
```

| 行 | B 中被替换 | 两侧一致 |
|---|---|---|
| [0] hunk 头 | 无 | 整行完全一致 |
| [1] 新增行 | `'[data-kg-cardmenu-selected="true"]'` → `'<LOCATOR_REDACTED>'` | `.filter({hasText: 'snippet'})).toBeVisible();` |

两侧都只有 `+` 行，没有 `-` 行。A 另有旧测试行 `await page.waitForSelector('[data-kg-cardmenu-selected="true"]');` 与新定位器 `page.locator('[data-kg-cardmenu-selected="true"]')`；B 另有完整旧块（含后续 `toHaveCount(2)`）与“无应用 diff”说明。

**rb040（A：EC / SO / SO；B 三次均 SO）**

```text
A[0] @@ -235,7 +235,7 @@ test.describe('Bookmark card', async () => {
B[0] @@ -235,7 +235,7 @@ test.describe('Bookmark card', async () => {

A[1] +        await expect(page.locator('[data-kg-cardmenu-selected="true"]').filter({hasText: 'snippet'})).toBeVisible();
B[1] +await expect(page.locator('<LOCATOR_REDACTED>').filter({hasText: 'snippet'})).toBeVisible();
```

行级替换关系与 rb039 相同（仅 hunk 头不同）；材料差异亦相同：A 无完整旧块、无应用 diff，B 有完整旧块并写明“无应用 diff”。

### 12.6 三条的差异归因

- **rb033：新路径值可见性。** A 三次稳定 EC，因为 `markdown → codeblock` 的 selector 值直接暴露业务对象变化；B 三次稳定 SO，因为新旧路径都被替换为标记，只剩“locator 改过”。这是遮蔽规则按设计隐藏新路径，同时隐藏了该条的业务语义证据，不是判据模糊。
- **rb039：完整旧块覆盖。** 两侧语义锚完全一致（`hasText: 'snippet'`、`toBeVisible()`），差异不在语义锚；B 的完整旧块显示旧测试后续 `toHaveCount(2)`，把改动呈现为“等待条件细化、最终断言未变”，A 只有旧测试行与未遮蔽 selector，只能按“新增 filter”判为断言目标变化。
- **rb040：判据边界摆动。** A 用同一份材料就出现 EC / SO / SO，说明“新增 `filter({hasText})` 算定位细化还是断言目标变化”在判据边界上不稳定；B 的完整旧块与“无应用 diff”把这批证据稳定压到 SO（3/3）。因此不能只归因于材料，也不能只归因于语义锚。

**对“语义锚现在可见”的归因结论**：这三条没有一条的标签差异可直接归因于语义锚可见性；`hasText` 在 A/B 两侧本来就都可见。差异来自新路径值可见性（rb033）、完整旧块覆盖（rb039）与判据边界稳定性（rb040）。

### 12.7 方法论记录与正式列口径

- **`temperature=0` 不保证确定性。** 在材料、prompt、模型与参数完全一致的情况下，140 条中 3 条三次不一致（2.14%），280 次重复调用中 5 次相对 run1 翻转（1.79%）。
- **正式列改用三次多数票，并同时报告一致率。** B 正式列取 `RQ2 y=2/n=28`、`RQ3 SO=40/EC=0/SR=0`；A 敏感性列取 `RQ2 y=1/n=29`、`RQ3 SO=38/EC=2/SR=0`。报告必须附 3/3、2/3、1/3 计数与不稳定样本清单；不得只报单次运行。
- 按此口径，§11 中“方案一 B”的单次表仅作为 run1 记录保留；其中 `rq2_023` 的 y→n 已被判定为波动，不代表材料效应。§11 的 A vs B 配对以 run1 为 B，正式回填时需按多数票重算配对与翻转清单；本记录不预先改写 §11。
- 论文正文“待重算”占位、主表与人工标注列均未改动；本条只记录方法口径，供回填时统一执行。

## 13. 最终回填结果与生效口径（2026-11-08，三次多数票）

> 本节为最终回填口径，取代 §7/§8/§11 的“待重算”状态。§11 的单次表仅作为 run1 运行记录保留，不再作为正文数值。

### 13.1 正式列与敏感性列（三次多数票）

| 列 | RQ2 | RQ3 |
|---|---|---|
| 协议 B（正式列） | diff 2/15、nodiff 0/15（y=2/n=28；y 为 `rq2_023`、`rq2_029`，均在 diff 臂） | 有效 40；SO=40、EC=0、SR=0 |
| 条件 A（敏感性对照） | diff 1/15、nodiff 0/15（y=1/n=29；y 为 `rq2_007`） | SO=38、EC=2（`rb033`、`rb039`）、SR=0 |

- RQ2 方向与自动语义有效率 1.0 一致，但绝对水平远低；正文写成**外部效度限定**，不得写成“复现 1.0”。
- RQ3 的 39 条可直接判为结构性；`rb033` 的业务语义恰好由被遮蔽的属性值 `[data-kg-card="codeblock"]` 承载，协议 B 下必然只能判 SO，属**遮蔽不可约边界**，论文与指南均单列披露；**不得为单条放松通用遮蔽规则**。

### 13.2 A vs B（三次多数票逐条对比）

| 族 | 配对 | 一致 | 翻转 | 明细 |
|---|---:|---:|---:|---|
| RQ2 | 30 | 27 | 3 | `rq2_007` y→n、`rq2_023` n→y、`rq2_029` n→y |
| RQ3 | 40 | 38 | 2 | `rb033` EC→SO、`rb039` EC→SO |

`rb040` 在 A 中为 EC/SO/SO（2/3 摆动），多数票为 SO，与 B 一致，不计翻转。

### 13.3 稳定性与一致率

| 指标 | 数值 |
|---|---|
| 重复次数 | 每条件 3 次（含 run1），共 420 次逐条调用 |
| 3/3 完全一致 | 137/140 |
| 2/3 摆动 | 3 条：`rq2_023`、`rq2_019`（A）、`rb040`（A） |
| 1/3（三条三种标签） | 0 条 |
| 重复调用相对 run1 翻转 | 5/280（1.79%） |
| 失败清单 | 两套均为空 |

因此 `temperature=0` **不保证确定性**；正式列固定取三次多数票，并必须同时报告 3/3、2/3、1/3 与不稳定条目清单。详见 `out/repeats/variance_report.{json,md}`。

### 13.4 κ 状态

人工第二列仍为空（RQ2 0/30、RQ3 0/40），`human vs 协议 B` 与 `human vs 条件 A` 两个 κ 均**不可计算**，正文只保留“待第二标注者完成后填入”，不出现任何具体 κ 值或置信区间。RQ3 协议 B 40 条全为 SO，`Pe` 很高，κ 可能接近 0 或为负；一旦算出必须同报 `Po`、`Pe`、`n` 与混淆矩阵。

### 13.5 未做

- 未修改主表（表 5-5、表 5-9 等自动指标与成本数字未动）。
- 未启动人工标注。
- 未为自洽调整任何数字。
