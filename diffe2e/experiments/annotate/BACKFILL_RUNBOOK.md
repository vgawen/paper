# 第二标注者回传后 Runbook（RQ2 / RQ3 → κ）

> 适用范围：第二标注者交回 RQ2 的 30 条、RQ3 的 40 条盲评材料后，由论文作者在本地合并、评分、生成 κ 回填模板。
>
> 前置约定：
> - 所有命令在 `/Users/dd/gdb/paper/diffe2e` 下执行；`RET` 等环境变量需要在同一个 shell 会话中保留。
> - `RET` 为回传材料暂存目录，建议 `experiments/out/return_YYYYMMDD/`。
> - 任何一步预期不符就停下，不要继续 merge/score；先修材料，不要“带病跑完”。
> - 现有 `collect_annotator2_md.mjs` / `merge_second_annotator.mjs` / `score.mjs` 对少填、非法值、重复行**不会硬失败**。本 runbook 用 `check_second_annotator.mjs` 作为强制闸门。
>
> **第一列口径（本 runbook 所有 κ / 一致率只用这一列）**：
> - 第一列 = 现行协议 B 的正式预标注结果 = `out/repeats/variance_report.json` 中 `conditions.masked.families.<rq2|rq3>.cases[].majority`（三次运行多数票）。`score.mjs` 默认 `--first-source=b-majority`，显式传参更稳妥。
> - 主表 CSV 里的 `annotator1_yn`（RQ2）与 `human1`（RQ3）是**已作废的旧预标注**，仅作历史留档，评分脚本已拒绝把它们作为第一列（传 `--first-source=csv|legacy|annotator1` 会直接报错）。
> - 自查：若第一列分布出现 **RQ2 `y=5/n=25`** 或 **RQ3 `SO=37/EC=2/SR=1`**，说明误用了旧列，`score.mjs` 会打印 `WARNING`；此时任何 Po/Pe/κ 都不可信，必须停下检查来源。

---

## 0. 接收材料与哈希校验

```bash
cd /Users/dd/gdb/paper/diffe2e
export RET=experiments/out/return_20261108
mkdir -p "$RET"
# 把对方回传的 worksheet / CSV / checksum 文件放进 $RET，并统一成下面的文件名：
#   $RET/rq2_annotator2_worksheet.md
#   $RET/rq3_annotator_context_blind.md
#   $RET/rq2_annotator2_blind.csv
#   $RET/rq3_annotator2_blind.csv
#   $RET/HANDOVER_CHECKSUMS_<name>.txt
cd "$RET"
grep -E '^[0-9a-fA-F]{64}  ' HANDOVER_CHECKSUMS_*.txt > /tmp/return_sums.txt
shasum -a 256 -c /tmp/return_sums.txt
```

**预期**：每个被列出的文件一行 `OK`，没有 `FAILED`。checksum 文件里附带的填写时间/条数行会被 `grep` 过滤掉，不影响校验。

**失败判断**：出现 `FAILED` 或文件缺失 → 停止，要求对方重发；不要用损坏/被改动的材料。

**备份正式表**（只备份，不改动）：

```bash
cd /Users/dd/gdb/paper/diffe2e
cp experiments/out/rq2_real_to_annotate.csv        "$RET/backup_rq2_main.csv"
cp experiments/out/rq3_reprobreak_to_annotate.csv  "$RET/backup_rq3_main.csv"
cp experiments/out/rq2_annotator2_blind.csv        "$RET/backup_rq2_blind.csv"
cp experiments/out/rq3_annotator2_blind.csv        "$RET/backup_rq3_blind.csv"
```

---

## 1. 选择录入方式并落到正式盲表

### 1A. Markdown 判定行（推荐）

对方填的是 `rq2_annotator2_worksheet.md` / `rq3_annotator_context_blind.md` 的判定行。

```bash
cd /Users/dd/gdb/paper/diffe2e
export RQ2_MD="$RET/rq2_annotator2_worksheet.md"
export RQ3_MD="$RET/rq3_annotator_context_blind.md"
unset RQ2_CSV RQ3_CSV

node experiments/annotate/collect_annotator2_md.mjs
```

**预期**：

```text
rq2_annotator2_blind.csv: 30/30 labeled, 0 missing
rq3_annotator2_blind.csv: 40/40 labeled, 0 missing
dry run; add --write to persist the labels.
```

且**没有** `invalid ... value`、`unknown case_id`、`invalid label(s)`。

**失败判断**：
- 条数不是 30/30、40/40 → 少填/多填，停止。
- 出现 `invalid` → 判定行里有 `Y`、`yes`、小写、带空格或非法三分类，停止。
- 出现 `unknown case_id` → 工作表 ID 对不上，停止。

确认无误后写入：

```bash
node experiments/annotate/collect_annotator2_md.mjs --write
```

**预期**：与 dry-run 相同的计数，末行 `wrote labels into the blind CSVs; next run merge_second_annotator.mjs + score.mjs.`

### 1B. CSV 模板直填

对方直接填 `rq2_annotator2_blind.csv` / `rq3_annotator2_blind.csv` 的第二列。**这条路径不经过 collect，因此没有 INVALID 检查**，必须依赖第 2 步闸门。

```bash
cd /Users/dd/gdb/paper/diffe2e
cp "$RET/rq2_annotator2_blind.csv" experiments/out/rq2_annotator2_blind.csv
cp "$RET/rq3_annotator2_blind.csv" experiments/out/rq3_annotator2_blind.csv
```

**预期**：两个正式盲表被回传版本替换；备份仍在 `$RET/backup_*`。

---

## 2. 结构闸门（merge 前必须通过）

```bash
cd /Users/dd/gdb/paper/diffe2e
node experiments/annotate/check_second_annotator.mjs validate --labels-only rq2 \
  experiments/out/rq2_real_to_annotate.csv experiments/out/rq2_annotator2_blind.csv
node experiments/annotate/check_second_annotator.mjs validate --labels-only rq3 \
  experiments/out/rq3_reprobreak_to_annotate.csv experiments/out/rq3_annotator2_blind.csv
```

**预期**：

```text
PASS rq2: 30 rows, labels valid
PASS rq3: 40 rows, labels valid
```

退出码均为 0。

**失败判断（退出码 1）**：脚本会列出具体问题，按类型处理：
- `空标签` / `主表行数=` / `盲表行数=` → 少填或多填，退回对方补/删。
- `非法标签` → 只接受 RQ2 `y|n`；RQ3 `STRUCTURAL_ONLY|EXPECTATION_CHANGE|SUSPECTED_REGRESSION`。大小写、空格、`EC` 简写都不接受。
- `重复 case_id` → 同一条重复出现，删除重复行。
- `盲表缺少 case_id` / `盲表多出 case_id` → ID 被改或错行，退回对方。

> 为什么需要这一步：`merge_second_annotator.mjs` 会把盲表第二列和 `final` 原样写入主表，不校验取值；`score.mjs` 也不会因为非法值报错。没有闸门时，`Y`/`yes`/重复行会被静默计入。

---

## 3. 生成分歧清单并填 `final`

```bash
cd /Users/dd/gdb/paper/diffe2e
node experiments/annotate/list_label_disagreements.mjs --write
```

**预期**：
- RQ2、RQ3 各打印 `rows=30` / `rows=40`、`problems=0`、`disagreements=<n>`。
- 写出：
  - `experiments/out/rq2_label_disagreements.csv`
  - `experiments/out/rq3_label_disagreements.csv`

**失败判断**：
- 退出码 1 或 `problems>0` → 有非法值或主表/盲表第二列冲突。先修，不要继续。
- `human fallback: （不存在）` 且主表第二列为空 → 第 1 步没落到正式盲表。
- `disagreements=0` → 可能全一致；仍需确认不是漏填造成的假一致。

**填 final 的规则**（关键）：
1. 只对 `prelabel_label ≠ human_label` 的行填 `final`（分歧清单里的 `mismatch=prelabel≠human`）。`run1_label` 只是诊断列，不参与分歧判定。
2. `final` 写在**盲表 CSV**（`experiments/out/rq2_annotator2_blind.csv` / `rq3_annotator2_blind.csv`）的 `final` 列，不是只写在分歧清单里。
3. `prelabel` 与 `human` 一致的行 `final` 必须留空。
4. 取值必须来自允许集合：RQ2 `y|n`；RQ3 三个全大写标签。`final` 是你的仲裁结论，可以与第一列或第二列相同，也可以不同；不要机械照抄第二列。

> 原因：`merge_second_annotator.mjs` 只从盲表复制 `final`；如果只填分歧清单，merge 时主表 `final` 仍为空，RQ3 会把分歧行丢出模型准确率，RQ2 会把空 final 按非 `y` 计入。

填完后跑**完整闸门**（不带 `--labels-only`），同时检查标签合法性与 final 一致性：

```bash
cd /Users/dd/gdb/paper/diffe2e
node experiments/annotate/check_second_annotator.mjs validate rq2 \
  experiments/out/rq2_real_to_annotate.csv experiments/out/rq2_annotator2_blind.csv --first-source=b-majority
node experiments/annotate/check_second_annotator.mjs validate rq3 \
  experiments/out/rq3_reprobreak_to_annotate.csv experiments/out/rq3_annotator2_blind.csv --first-source=b-majority
```

**预期**：

```text
PASS rq2: 30 rows, labels valid, final consistent with disagreements (first-source=b-majority)
PASS rq3: 40 rows, labels valid, final consistent with disagreements (first-source=b-majority)
```

若出现 `分歧未填 final` 或 `一致却填了 final`，按提示修正后重跑。

---

## 4. 合并两次

```bash
cd /Users/dd/gdb/paper/diffe2e
node experiments/annotate/merge_second_annotator.mjs \
  experiments/out/rq2_annotator2_blind.csv experiments/out/rq2_real_to_annotate.csv
node experiments/annotate/merge_second_annotator.mjs \
  experiments/out/rq3_annotator2_blind.csv experiments/out/rq3_reprobreak_to_annotate.csv
```

**预期**：

```text
merged 30/30 annotator2_yn labels into experiments/out/rq2_real_to_annotate.csv
merged 40/40 human2 labels into experiments/out/rq3_reprobreak_to_annotate.csv
```

退出码 0，**没有** `WARNING: ... empty ...`。

**失败判断**：
- `merged 29/30` / `39/40` + WARNING → 仍有空标签，回到第 2 步。
- `case_id mismatch` 退出 1 → 盲表 ID 与主表不一致。
- 退出 2 → 盲表缺 `annotator2_yn`/`human2` 或 `final` 列。

合并后再跑一次分歧审计，确认主表与盲表第二列一致：

```bash
node experiments/annotate/list_label_disagreements.mjs --write
```

**预期**：`problems=0`，退出码 0。若报 `conflict`，说明主表被上一次合并或手改污染，停止并对照 `$RET/backup_*`。

---

## 5. 评分两次

```bash
cd /Users/dd/gdb/paper/diffe2e
node experiments/annotate/score.mjs experiments/out/rq2_real_to_annotate.csv --first-source=b-majority
node experiments/annotate/score.mjs experiments/out/rq3_reprobreak_to_annotate.csv --first-source=b-majority
```

**预期（RQ2）**：

```text
first-source=b-majority (协议 B 正式结果（masked 三次运行多数票，variance_report.json）)
first-label-distribution={"y":2,"n":28}  second-label-distribution=<人工分布>
semantic-validity=<0..1>  Po=<实测>  Pe=<实测>  kappa=<实测> (n=30)
confusion=<2x2 矩阵>
  diff=<...> (n=15)  nodiff=<...> (n=15)
```

第一列分布应为 `{"y":2,"n":28}`。若看到 `{"y":5,"n":25}` 并伴随 `WARNING`，说明第一列来源错误（旧 `annotator1_yn`），停止，不要回填论文。

**预期（RQ3）**：

```text
first-source=b-majority (协议 B 正式结果（masked 三次运行多数票，variance_report.json）)
first-label-distribution={"STRUCTURAL_ONLY":40}  n=40  Po=<实测>
confusion=<3x3 矩阵>
disagreements=<实测>
kappa=NOT REPORTED (RQ3 policy: constant pre-label; report Po + confusion + disagreements only)
```

第一列分布应为 `{"STRUCTURAL_ONLY":40}`。若看到 `{"STRUCTURAL_ONLY":37,"EXPECTATION_CHANGE":2,"SUSPECTED_REGRESSION":1}` 并伴随 `WARNING`，说明误用了旧 `human1`，停止。

**失败判断**：
- RQ2 `n != 30` → 有行缺第一列或第二列；先确认 `missing-first` 是否为空，再回第 2 步。
- RQ3 `n != 40` → 有行缺 `human2` 或第一列；回第 2/3 步。
- 出现具体 κ 但 n 不对 → 不要回填论文；先修样本。
- RQ3 不应出现任何 κ 数值；出现即说明脚本被改回旧口径。

> `score.mjs` 控制台现在会打印第一列来源、第一/第二列分布、Po、Pe、κ（仅 RQ2）与混淆矩阵；RQ3 固定打印 `kappa=NOT REPORTED`。

---

## 6. 补齐 Po / Pe / κ / 混淆矩阵

```bash
cd /Users/dd/gdb/paper/diffe2e
node experiments/annotate/check_second_annotator.mjs matrix rq2 \
  experiments/out/rq2_real_to_annotate.csv --first-source=b-majority
node experiments/annotate/check_second_annotator.mjs matrix rq3 \
  experiments/out/rq3_reprobreak_to_annotate.csv --first-source=b-majority
```

**预期（RQ2）**：输出 JSON，含 `family`、`n: 30`、`expected: 30`、`complete: true`、`first_source: "b-majority"`、`po`、`pe`、`kappa`、`cm`，退出码 0。

**预期（RQ3）**：输出 JSON，含 `family`、`n: 40`、`expected: 40`、`complete: true`、`first_source: "b-majority"`、`po`、`confusion`、`disagreements`，以及 `kappa: "NOT REPORTED"`、`kappa_reported: false`、`kappa_reason`，退出码 0。

**失败判断**：`complete: false` 或 `n` 小于 30/40 → 样本不完整，停止。RQ3 若出现数值 `kappa`，说明口径被改坏。

**回填论文时需要同时报**：
- RQ2：`n`、`Po`、`Pe`、`κ`、2×2 混淆矩阵（第一列为现行 B 三次多数票预标注，第二列为人工）。
- RQ3：`n`、`Po`、3×3 混淆矩阵、逐条分歧；**不报 κ**（预标注为常量 `STRUCTURAL_ONLY`，`Pe` 退化）。
- 偏斜分布下 RQ2 κ 可能接近 0 或为负；必须与 `Po`/`Pe` 同报，不能只报 κ。临时副本实测（第一列固定 B 多数票）：人工 30 条全填 `n` 时 RQ2 `n=30, Po=0.9333, Pe=0.9333, κ=0`；人工 40 条全填 `STRUCTURAL_ONLY` 时 RQ3 `n=40, Po=1.0, disagreements=0`（无 κ）。这说明 Po 很高而 κ=0 时“未超出随机一致”，必须同时给出混淆矩阵。
- 结构闸门不拦统计偏斜：若某一标签在 40 条中占 ≥95%，即使闸门 PASS，也要在正文加偏斜说明，并同时报告混淆矩阵。

---

## 7. 生成 κ 回填模板

```bash
cd /Users/dd/gdb/paper/diffe2e
node experiments/annotate/render_kappa_backfill.mjs
```

**预期**：

```text
wrote experiments/out/kappa_backfill.md
```

**失败判断**：提示缺少 `rq2_real_to_annotate_annotation.json` 或 `rq3_staleness_annotation.json` → 第 5 步没跑成功；先补跑 score。

**模板内容核对**：RQ2 n=30、RQ3 n=40；RQ2 的 κ 与第 5/6 步一致；RQ3 只有 Po、混淆矩阵与逐条分歧，**不应出现 κ**；模板中的“待填”只指论文文字位置，不是数据缺项。

---

## 8. 回填论文与文档

1. 第 5.2 节：RQ2 人工列与 κ（第一列为现行 B 三次多数票预标注；附 Po/Pe/n/2×2 混淆矩阵）。
2. 第 5.3 节 / 表 5-8：RQ3 人工列与 Po、3×3 混淆矩阵、逐条分歧；**不写 κ**（预标注为常量 SO、Pe 退化）。
3. 第 5.6 节 / 表 5-10：把“待第二标注者完成后填入”替换为实测值，并保留第一列来源说明与旧列作废说明。
4. 附录 A.3：更新 κ 可计算状态、n、偏斜说明；RQ3 明确标注“不报 κ”。
5. `总体任务与进度跟踪.md`、`定稿自动审计清单.md`：把 P0 项标记完成，记录回传日期与材料哈希。

**回填前再次确认**：正文中 RQ2 的 κ 必须与第 6 步 JSON 完全一致；不得只写 κ 而不写 Po/Pe/n；RQ2 的 n 必须是 30，RQ3 的 n 必须是 40（若 score 输出小于该值，说明有行被过滤，先回第 2/3 步，不得把缩小的 n 写进论文）。第一列必须是 `b-majority`；若正文或 JSON 出现旧列特征数字（RQ2 y=5/30、RQ3 SO=37/EC=2/SR=1），立即停止并追溯来源。

---

## 9. 回传前对方要检查的清单

请第二标注者在锁定材料、发回之前逐项打勾：

- [ ] RQ2 填完 **30/30** 条；RQ3 填完 **40/40** 条。
- [ ] 每条判定行/CSV 第二列只有允许值：
  - RQ2：`y` 或 `n`（小写，无空格）。
  - RQ3：`STRUCTURAL_ONLY` / `EXPECTATION_CHANGE` / `SUSPECTED_REGRESSION`（全大写，无空格，不写 `EC`/`SO`/`SR`）。
- [ ] Markdown 判定行格式与模板一致：
  - RQ2：``判定：`annotator2_yn=y` ``（或 `n`）。
  - RQ3：``判定：`human2=STRUCTURAL_ONLY`  备注：``。
- [ ] 没有留下 `___` 占位；没有重复 `case_id`；没有改动 `case_id`、第一列、`spec`/`old_locator` 等只读列。
- [ ] **`final` 列全部留空**（仲裁由作者在回传后做，不由第二标注者填）。
- [ ] 没有查看、复制或推测第一列/模型预标注；没有运行测试或读取隐藏答案。
- [ ] 回传文件只包含：RQ2 工作表或 RQ2 CSV、RQ3 工作表或 RQ3 CSV、`HANDOVER_CHECKSUMS_*.txt`。
- [ ] `HANDOVER_CHECKSUMS_*.txt` 中的 SHA-256 与回传文件一致，且包含填写时间、条数与填写人标识。
- [ ] 回传包未包含任何本地路径、账号、token、聊天记录或浏览器缓存。

**锁定哈希（对方在回传目录执行）**：

```bash
cd /path/to/return
# 只选一路：md 路线
shasum -a 256 rq2_annotator2_worksheet.md rq3_annotator_context_blind.md > HANDOVER_CHECKSUMS_annotator2.txt
# 或 CSV 路线
# shasum -a 256 rq2_annotator2_blind.csv rq3_annotator2_blind.csv > HANDOVER_CHECKSUMS_annotator2.txt

printf 'date=%s\nrq2=30/30\nrq3=40/40\nannotator=annotator2\n' \
  "$(date -Iseconds)" >> HANDOVER_CHECKSUMS_annotator2.txt
```

> 只回传实际采用的那一路文件（md 工作表或 CSV 模板），不要把两套半成品混在一起。

**作者收到后先做**：第 0 步哈希校验 → 第 2 步结构闸门。两步都过，才进入 final 仲裁与 merge/score。

---

## 10. 失败时的回滚

```bash
cd /Users/dd/gdb/paper/diffe2e
cp "$RET/backup_rq2_main.csv" experiments/out/rq2_real_to_annotate.csv
cp "$RET/backup_rq3_main.csv" experiments/out/rq3_reprobreak_to_annotate.csv
cp "$RET/backup_rq2_blind.csv" experiments/out/rq2_annotator2_blind.csv
cp "$RET/backup_rq3_blind.csv" experiments/out/rq3_annotator2_blind.csv
```

回滚后重新从第 1 步开始；不要在一次失败后继续叠加 merge。
