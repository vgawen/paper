# RQ3 扩展批次人工列回收 — 交付记录（2026-11-21）

## 交付物

- 文件：`out/annotation_handover_expansion_20261121.zip`
- SHA-256：`d3fc93a17051a5199abadce93140385a45ac81783163b88217c13755cbc4db79`
- 内容：`expansion_20261108/rq3/annotation_packet_expansion/` 原样 6 文件 + 独立 `SHA256SUMS`（交付前已逐项校验 OK）：
  - `ANNOTATOR_INSTRUCTIONS.md`（判据、禁止事项）
  - `rq3_context.md`（40 条盲评材料，`rbx001`–`rbx040`，每节末尾 `human2=___`）
  - `rq3_fill_template.csv`（备用录入模板，40 行空白）
  - `COVERAGE_REPORT.md`、`redaction_verification.md/.json`（遮蔽复核 40/40 PASS 证据）

## 协议要点（与主实验一致）

- 第二标注者盲评，不看第一列（协议 B 多数票）与任何 unblind/rationale 材料；
- 每节填 `human2` ∈ {STRUCTURAL_ONLY, EXPECTATION_CHANGE, SUSPECTED_REGRESSION}；`final` 留空（仅仲裁时填写）；
- 两可时按保守规则倾向 `SUSPECTED_REGRESSION`。

## 统计隔离（不可违反）

- 本批为独立扩展样本：四仓 hash 第 11–20 条，与主实验（第 1–10 条）零重叠；
- 回收后只与扩展批自身的协议 B 列计算 Po/混淆矩阵/逐条分歧，**不与主实验 40 条合并，不合并 κ，不并入表 5-8**；
- 主实验协议 B 列（对照用）：SO=38、SR=2（两条 SR 均在 microsoft/playwright；分仓 10/8/10/10）。

## 回收后流程

1. 逐行 diff 交付件，确认仅填写字段变化（参照主实验验收方式）；
2. 按扩展批自身协议 B 列计算一致性（Po、混淆矩阵、分歧清单）；若有分歧，复用 `annotation_arbitration_20261121` 的先盲后明仲裁程序；
3. 结果写入论文 §5.3.1（扩展批次小节），不动主表、不动主实验 κ；
4. 回填冻结清单新版本。
