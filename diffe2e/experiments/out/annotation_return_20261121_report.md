# 第二标注者返回处理报告（2026-11-21）

## 1. 归档与完整性

- 返回包：`out/annotation_return_sll_20261121.zip`，SHA-256 `402bbc5e52b2c438b1704ab493d49823c6f19fb9f27b017e09b40f94b6fbd3e8`（与上传件一致）。
- 内含 `02_RQ2_worksheet_annotation.md`（30 条）、`03_RQ3_worksheet_annotation.md`（40 条）。
- 完整性核验：与交付件 `annotation_handover/02_RQ2_worksheet.md`、`03_RQ3_worksheet.md` 逐行 diff，RQ2 60 处、RQ3 80 处差异**全部**为填写字段（`annotator2_yn=`／`human2=`），其余内容零改动。
- 填写完整性：RQ2 30/30 全部填写（无空项）；RQ3 40/40 全部填写（无空项）。`final` 列均留空，符合协议。

## 2. 第二标注者标签分布

| RQ | 分布 |
|---|---|
| RQ2（n=30） | n=30，y=0（全 n） |
| RQ3（n=40） | STRUCTURAL_ONLY=40（全 SO） |

## 3. 与第一标注者（LLM 辅助）对照

### RQ2

- 一致：25/30，po = 0.8333。
- 第一标注者分布：y=5，n=25；第二标注者全 n。
- pe = 0.8333，**Cohen's κ = 0.000**（第二标注列为常量，po=pe，κ 失效——患病率悖论，非"无一致性"）。
- 不一致 5 条（均为 a1=y / a2=n）：`rq2_007`、`rq2_019`、`rq2_023`、`rq2_025`、`rq2_029`。

### RQ3

- 一致：37/40，po = 0.9250。
- 第一标注者分布：SO=37、EC=2（rb024、rb033）、SR=1（rb021）；第二标注者全 SO。
- pe = 0.9250，**Cohen's κ = 0.000**（同上，常量列导致 κ=0）。
- 不一致 3 条（均为 a1 少数类 / a2=SO）：`rb021`（SR→SO）、`rb024`（EC→SO）、`rb033`（EC→SO）。
- 注意：`rb033` 即正文 §5.3 按协议 B 单列复核的条目，此处同样落入不一致集。

## 4. 待仲裁

共 8 条需第三人（仲裁人）填写 `final`：RQ2 五条 + RQ3 三条（清单见上）。

## 5. 仲裁包（2026-11-21，第三人裁决、先盲后明）

已生成 `out/annotation_arbitration_20261121/`：`00_README.md`（流程与披露要求，仲裁人为独立第三人——非第二标注者、未参与第一列）、`01_ARBITRATION_BLIND.md`（8 条原始盲评材料 + `final_blind`，已核验无标签泄漏）、`02_ARBITRATION_INFORMED.md`（两列标签与第一列理由 + `final`）、独立 `SHA256SUMS`。待第三人回填后据此落定 `final` 列。

## 6. 正式合并结果（2026-11-21，按 BACKFILL_RUNBOOK 执行，第一列=协议 B 多数票）

**偏差记录**：本节覆盖第 3 节——第 3 节的对照列误用了已作废的早期标注列（`rq2/rq3_annotator1_rationale.md`）。按论文 §5.6 与 runbook 规定，正式第一列为 `out/repeats/variance_report.json` 的 masked 三次多数票。同因，第 5 节仲裁包的"第一列"展示用了旧列：按协议 B，真实分歧只有 RQ2 两条（rq2_023、rq2_029），RQ3 为零；仲裁人对这两条均裁 `n`（有效），对其余 6 条的裁决属多余但无害（rb033 裁 EC，与作者复核结论一致，仍按 §5.3 单列，不进合并）。

- RQ2（n=30，主表 `rq2_real_to_annotate.csv`，分臂 15/15）：第一列 y=2（rq2_023，一致性 2/3；rq2_029，3/3）、n=28；人工列全 n。仲裁 final：rq2_023=n、rq2_029=n。**人工语义有效率=0（0/30），Po=0.9333，Pe=0.9333，κ=0**；混淆 {y→n:2, n→n:28}；分臂 diff=0、nodiff=0。
- RQ3（n=40，主表 `rq3_reprobreak_to_annotate.csv`）：两列均全 STRUCTURAL_ONLY，**Po=1.0，分歧 0 条；按既定口径不报 κ**（常量列 Pe 退化）；混淆仅 SO/SO=40。
- 已执行：collect（30+40 标签）→ 门禁 validate（双 RQ PASS，first-source=b-majority）→ 分歧表（rq2=2 条、rq3=0 条）→ final 回填盲表 → merge 主表 → score → matrix JSON → 重渲染 `kappa_backfill.md`。备份在 `return_20261121/backup_*`。
- 冻结清单：`rq2_real_to_annotate.csv` 等因回填改变；另发现 `annotation_handover/`、`annotation_packet/` 等条目自 11-08 后已漂移（含 2 个已删除文件）。已生成新版本 `expansion_20261108/SHA256SUMS_MAIN_after_second_annotator.txt`（59 项，全部校验通过，删除 06/07 两项，新增 20 项）。
- 待办：论文 §5.2、§5.3/表 5-8 注、§5.6/表 5-10、附录 A.3 的回填（结论级改动，待作者确认文本）；`总体任务与进度跟踪.md` P0 标记。

