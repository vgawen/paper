# 变更记录：κ 第一列口径修复（2026-11-08）

> 授权：作者指令“先修 κ 的第一列口径，这优先于阶段二”。
> 范围：只改一致性评分的第一列来源与说明；不改主表、原冻结清单、论文其它部分。
> 原冻结记录 `FREEZE_RECORD.md`、`SHA256SUMS_MAIN.txt` 保持原样，不覆盖。

---

## 1. 变更原因

`score.mjs` 原先的 RQ2 第一列取 CSV `annotator1_yn`、RQ3 第一列取 `human1`。这两列是已作废的旧预标注（RQ2 y=5/30；RQ3 SO=37 / EC=2 / SR=1），而论文 §5.6 声明的一致性对象是人工与**现行协议 B 三次多数票**（RQ2 y=2/30；RQ3 SO=40 / EC=0 / SR=0）。两者来源不同，直接计算会把旧列当作正式列，导致 κ 语义错误。

## 2. 变更内容

| 文件 | 变更 |
|---|---|
| `diffe2e/experiments/annotate/score.mjs` | 新增 `loadFirstLabels(family, source)`：默认 `b-majority`，读取 `out/repeats/variance_report.json` 中 `conditions.masked.families.<family>.cases[].majority`；另支持 `b-run1`、`file:<json>`。显式拒绝 `csv` / `legacy` / `annotator1`。RQ2 计算 Po/Pe/κ/2×2 混淆矩阵；RQ3 只算 Po/3×3 混淆矩阵/逐条分歧，输出 `kappa: null`、`kappa_reported: false`、`kappa_reason`。检测到旧列特征分布时打印 `WARNING`。 |
| `diffe2e/experiments/annotate/score.test.mjs` | 测试字段改为 `prelabel` + `annotator2_yn` / `human2`；新增 RQ3 不报 κ 的断言。5/5 通过。 |
| `diffe2e/experiments/annotate/check_second_annotator.mjs` | `validate` / `matrix` 默认第一列 `b-majority`；`final` 一致性按现行预标注 vs 人工判定；RQ3 矩阵固定输出 `kappa: "NOT REPORTED"`。CLI 新增 `--first-source`。 |
| `diffe2e/experiments/annotate/list_label_disagreements.mjs` | 只比较现行预标注与人工；`run1_label` 仅诊断展示；输出列改为 `prelabel_label` 等。 |
| `diffe2e/experiments/annotate/render_kappa_backfill.mjs` | RQ2 模板注明第一列来源 `b-majority`；RQ3 模板只写 Po/混淆矩阵/逐条分歧并声明不报 κ。 |
| `diffe2e/experiments/annotate/BACKFILL_RUNBOOK.md` | 新增“第一列口径”前置说明；`final` 仲裁规则改为 prelabel≠human；score/matrix 命令加 `--first-source=b-majority` 并更新预期输出；写入误用旧列的自查数字。 |
| 论文 §5.6 与表 5-10 | 明确第一列是现行 B 三次多数票预标注；旧列仅历史留档、不参与任何 κ/一致率/分母；RQ3 只报 Po、混淆矩阵、逐条分歧，不报 κ。仅改这两处。 |

## 3. 哈希变化（论文在冻结清单内，其余 35 个冻结文件未变）

| 项目 | 改前 | 改后 |
|---|---|---|
| 论文初稿 `.md` | `b9e6f00eb75c38796707cfe9504002489a8adbeb630da2c73adce84c3189f807` | `511a0131b899f4c2b20aa1149866cc9a41a831b37c279c223c7bf04c5558d380` |

- 改前哈希取自原 `SHA256SUMS_MAIN.txt`（第 36 行），原文件未改动。
- 改后完整 36 文件清单见同目录 `SHA256SUMS_MAIN_after_kappa_fix.txt`，已用 `shasum -a 256 -c` 全部通过。
- 未入冻结清单的评分脚本哈希（仅记录，不属于冻结范围）：

```text
fd238126f9f7a9f26c34d0654689820dbbbdc6f4b6fd3610e9945850e53efe04  diffe2e/experiments/annotate/score.mjs
741dbeff23d86b49b9d48e9f6917b7ec595bb273139b3c75c0dad6a33cb5ee4e  diffe2e/experiments/annotate/score.test.mjs
6cbca50ad88662e6e0803bff856489af3e01bf18ea6e297fcf38d7502bc431ed  diffe2e/experiments/annotate/check_second_annotator.mjs
c54d80c7dedde9714cb6e9297b95aa4218ab4c5ec64fbdc3a4748cd4b8562c39  diffe2e/experiments/annotate/list_label_disagreements.mjs
50617a4b05de85f07a61bd523bd4ce3a9b2872aa300ed7f3a388560235b4c6cc  diffe2e/experiments/annotate/render_kappa_backfill.mjs
808f9ec5a0b9a3de3281d6c045bac8ecf74a41636eb1250beeb1964d09e7a024  diffe2e/experiments/annotate/BACKFILL_RUNBOOK.md
```

## 4. 临时副本验证（`/tmp/kappa_source_fix_20261108/`，已验证后清理）

第一列固定为 B 正式多数票（RQ2 y=2/n=28；RQ3 SO=40），只改合成的第二列。

| 情形 | RQ2 n | Po | Pe | κ | 2×2 混淆矩阵 |
|---|---:|---:|---:|---:|---|
| (a) 与 B 高度一致 | 30 | 0.9 | 0.7889 | 0.5263 | y→y=2, y→n=0, n→y=3, n→n=25 |
| (b) 完全不一致 | 30 | 0 | 0.1244 | -0.1421 | y→y=0, y→n=2, n→y=28, n→n=0 |
| (c) 极度偏斜（人工全 n） | 30 | 0.9333 | 0.9333 | 0 | y→y=0, y→n=2, n→y=0, n→n=28 |

| 情形 | RQ3 n | Po | 3×3 混淆矩阵（SO 行） | 分歧 | κ |
|---|---:|---:|---|---:|---|
| (a) 与 B 高度一致 | 40 | 0.925 | SO→SO=37, SO→EC=2, SO→SR=1 | 3 | 不报 |
| (b) 完全不一致 | 40 | 0 | SO→EC=40 | 40 | 不报 |
| (c) 极度偏斜（人工全 SO） | 40 | 1.0 | SO→SO=40 | 0 | 不报 |

结论：第一列来源固定后，分母始终为 30/40，无因来源错误而虚高；RQ2 偏斜情形 Po 高但 κ=0，符合“未超出随机一致”的预期；RQ3 全程不产生 κ 字段（`kappa: null`、`kappa_reported: false`）。

`node --test experiments/annotate/score.test.mjs`：5/5 通过。`check_second_annotator.mjs matrix` 对六种情形的结果与 `score.mjs` 一致。

## 5. 未做

- 未修改两份主表、`FREEZE_RECORD.md`、`SHA256SUMS_MAIN.txt`、`kappa_backfill.md`。
- 未修改论文 §5.6 与表 5-10 以外的正文。
- 未开始阶段三扩样。

## 6. 阶段二：RQ3 扩样（同日完成）

- 样本：4 仓各取 hash 排序第 11–20 条，共 40 条；独立命名空间 `rbx001`–`rbx040`；与主实验重叠 0。
- 真实分诊：DeepSeek `deepseek-v4-flash`、temperature=0，40/40 成功，45 次调用尝试；结果 `STRUCTURAL_ONLY=38`、`SUSPECTED_REGRESSION=2`（2 条均在 microsoft/playwright）。
- 主实验模型列仍为常量 `STRUCTURAL_ONLY=40`，不重跑、不回填；两批统计不合并。
- 独立盲评包：`rq3/annotation_packet_expansion/`，6 个文件 + 独立 `SHA256SUMS`，40/40 遮蔽复核 PASS。
- 报告：`rq3/EXPANSION_RQ3_REPORT.md`；主表与主解盲键哈希未变。
- 阶段三未开始。

## 7. 阶段三：受控缺口扩样（3 → 8，同日完成）

- 独立扩展历史 `subject/work_exp`（从 `subject/base` 复制，x00 基线 + x01–x05 五个“新增路由且无测试”缺口），不追加到主 24 过渡历史；主 `subject/work`、`subject/history/manifest.json` 未写入。
- 预注册 `gaps/manifest_expansion.json`（19:42 落盘）先于实验；RQ1 19:47、两臂与算子结果 19:53。
- 新缺口：x01 `/settings`（testid 富集）、x02 `/feedback`（无 testid）、x03 `/inbox`（testid+文本）、x04 `/checkout`（无 testid，条件逻辑）、x05 `/help`（无 testid，可展开）。
- 生成：DeepSeek `deepseek-v4-flash`，diff/nodiff 两臂，10 次调用；主 3 缺口复用冻结用例。
- 旧 2 类算子 n=8（与主实验逐字一致，k=3）：diff 平均杀伤 0.5、自动语义有效 0.625；nodiff 仅 1/8 可执行。
- 新 5 类算子 n=8（42 个注入）：diff 平均杀伤 0.5625、自动语义有效 1.0；逐类杀伤 testid 2/6、文本 0/9、属性 3/9、结构 8/9、逻辑 8/9。
- 与主实验不合并统计；主 3 缺口旧算子 diff 逐缺口复现（2/3）。发现冻结的 c03 nodiff 用例在现环境无法复现（strict-mode 冲突），已记录、未改主表。
- 报告：`gaps/EXPANSION_GAPS_REPORT.md`；主表/冻结清单/论文哈希复核 36/36 OK。
- 阶段四未开始。

## 8. 变更 2026-11-08：c03/nodiff 复核修正（作者批准）

- 授权：作者批准按取证结论修正；主表/论文同步，旧冻结清单不覆盖。
- 取证：`out/repro_c03_20261108/REPRO_C03_FORENSICS.md`；逐格原始结果 `out/repro_c03_20261108/repro_rq2_cells.json`。
- 原因：c03/nodiff 原记录与冻结 spec 实际执行不符（c03 与 c02 均 strict-mode 失败；覆盖率不含 `src/coupon.js`；V_old 同败）。钉住 Playwright 1.61.0 + Chromium 1228 重跑，其余五个受控执行格逐格一致。
- 修正：c03/nodiff → executable=false、killed 0/0、change_sensitive=false、semantic_auto=false；nodiff 臂汇总 → exec 0 / 变异杀伤 0 / 版本敏感 0 / 自动语义有效 0；diff 臂不变。
- 文件：`out/rq2_results.json`、`out/rq2_results.md`、`out/aggregate.json`、论文 §5.2/§6、`docs/THESIS_MAPPING.md`、`总体任务与进度跟踪.md`、`质量对比评估报告_外部评阅论文与本项目初稿.md`、`EXPERIMENT_REPORT.md`。
- 新清单：`SHA256SUMS_MAIN_after_c03_fix.txt`（41 项，含原 36 个冻结文件 + 3 个主结果来源 + 2 个取证文件），自身 SHA256 `24b331a1a96c656dcd647ff4c7c3951590a60c5c3c846031020d6cc085cb798d`；`shasum -c` 全部通过。
- 改前/改后哈希：论文 `511a0131…` → `090b606a…`；`rq2_results.json` `3cb697e9…` → `af692acb…`；`rq2_results.md` `80925a45…` → `9610c456…`；`aggregate.json` `05e0e415…` → `7d4b79ce…`。
- 旧清单 `SHA256SUMS_MAIN.txt`、`SHA256SUMS_MAIN_after_kappa_fix.txt` 与 `FREEZE_RECORD.md` §1–§7 原文未覆盖；变更登记见 `FREEZE_RECORD.md` §8。

## 9. 阶段三报告的主实验参考同步（同日，随 §8 修正）

- `gaps/rq2_expansion_old.md` 与 `gaps/EXPANSION_GAPS_REPORT.md` 原先把主实验 nodiff 旧记录作为“只读参考”引用；按 §8 取证结论改为修正后的全 0 值，并标注复核日期与 `FREEZE_RECORD.md §8`。
- 原 `gaps/SHA256SUMS_EXPANSION_GAPS.json` 未覆盖；新增 `gaps/SHA256SUMS_EXPANSION_GAPS_after_c03_fix.json`（7 个文件，逐项校验通过）。
- 主表、论文、原两份主清单均未再改动。
