# 锁定、校验与回传（照抄命令）

下面命令都在 `annotation_handover/` 目录内执行。把尖括号占位替换成你自己的信息，不要保留尖括号。

## 0. 先验证收到的包没被改动

```bash
cd annotation_handover
shasum -a 256 -c SHA256SUMS
```

每一行都应显示 `OK`。若出现 `FAILED`，先不要开始标注，联系协调者重新发一份。

## 1. 复制出你的工作副本（不要直接改原件）

命名规则：`<任务>_worksheet_<姓名拼音>_<YYYYMMDD>.md` 或 `<任务>_fill_<姓名拼音>_<YYYYMMDD>.csv`。

```bash
cd annotation_handover
cp 02_RQ2_worksheet.md  RQ2_worksheet_<姓名拼音>_<YYYYMMDD>.md
cp 03_RQ3_worksheet.md  RQ3_worksheet_<姓名拼音>_<YYYYMMDD>.md
```

如果你选择 CSV 方式，则改为：

```bash
cp 04_RQ2_fill_template.csv  RQ2_fill_<姓名拼音>_<YYYYMMDD>.csv
cp 05_RQ3_fill_template.csv  RQ3_fill_<姓名拼音>_<YYYYMMDD>.csv
```

示例（请替换成你的）：`RQ2_worksheet_zhangsan_20261110.md`。

## 2. 填写并自查

- 只改判定行/判定列：RQ2 为 `annotator2_yn`，RQ3 为 `human2`；`final` 一律留空。
- RQ2 必须是 30 个 `y`/`n`；RQ3 必须是 40 个三标签之一。
- 自查命令（Markdown 方式）：

```bash
grep -c '^判定：`annotator2_yn=y`' RQ2_worksheet_<姓名拼音>_<YYYYMMDD>.md
grep -c '^判定：`annotator2_yn=n`' RQ2_worksheet_<姓名拼音>_<YYYYMMDD>.md
grep -c '^判定：`human2=STRUCTURAL_ONLY`' RQ3_worksheet_<姓名拼音>_<YYYYMMDD>.md
grep -c '^判定：`human2=EXPECTATION_CHANGE`' RQ3_worksheet_<姓名拼音>_<YYYYMMDD>.md
grep -c '^判定：`human2=SUSPECTED_REGRESSION`' RQ3_worksheet_<姓名拼音>_<YYYYMMDD>.md
```

前两个数字之和应为 30；后三个数字之和应为 40。

CSV 方式自查：

```bash
awk -F',' 'NR>1 && $2!="" {c++} END{print c}' RQ2_fill_<姓名拼音>_<YYYYMMDD>.csv
awk -F',' 'NR>1 && $2!="" {c++} END{print c}' RQ3_fill_<姓名拼音>_<YYYYMMDD>.csv
```

分别应为 30 与 40。

## 3. 锁定（写完就不要再改）

```bash
chmod 444 RQ2_worksheet_<姓名拼音>_<YYYYMMDD>.md RQ3_worksheet_<姓名拼音>_<YYYYMMDD>.md
```

如果你在 macOS 上需要继续编辑，先不要 `chmod`；改完再执行。CSV 方式把文件名换成你的两份 CSV。

## 4. 生成校验记录

```bash
shasum -a 256 RQ2_worksheet_<姓名拼音>_<YYYYMMDD>.md RQ3_worksheet_<姓名拼音>_<YYYYMMDD>.md > HANDOVER_CHECKSUMS_<姓名拼音>_<YYYYMMDD>.txt
wc -c RQ2_worksheet_<姓名拼音>_<YYYYMMDD>.md RQ3_worksheet_<姓名拼音>_<YYYYMMDD>.md >> HANDOVER_CHECKSUMS_<姓名拼音>_<YYYYMMDD>.txt
date >> HANDOVER_CHECKSUMS_<姓名拼音>_<YYYYMMDD>.txt
shasum -a 256 -c HANDOVER_CHECKSUMS_<姓名拼音>_<YYYYMMDD>.txt
```

最后一条应显示 `OK`（`wc` 与 `date` 那几行不是校验行，`-c` 会跳过无法解析的行；若你的版本报错，只保留前两行 SHA-256 再校验）。

**要保留的记录内容**：填写后两份文件的文件名、SHA-256、字节数、完成日期，以及本包原始 `SHA256SUMS` 的校验结果。这些一起放进 `HANDOVER_CHECKSUMS_*.txt`。

## 5. 打包回传

```bash
zip -r annotation_return_<姓名拼音>_<YYYYMMDD>.zip \
  RQ2_worksheet_<姓名拼音>_<YYYYMMDD>.md \
  RQ3_worksheet_<姓名拼音>_<YYYYMMDD>.md \
  HANDOVER_CHECKSUMS_<姓名拼音>_<YYYYMMDD>.txt
```

CSV 方式把两个 worksheet 换成两份 CSV。

回传：把 `annotation_return_<姓名拼音>_<YYYYMMDD>.zip` 发给协调者（邮件或协调者指定的传输方式），主题写 `annotation_return_<姓名拼音>_<YYYYMMDD>`。

## 6. 锁定后的规则

- 校验文件生成后**不要再编辑**任何填写文件。
- 若必须修改，另存为 `_v2` 版本，重新执行第 4、5 步，并在回传时说明“以 v2 为准”。
- 不要回传本包原件（`02`/`03`/`04`/`05`），只回传你自己的副本与校验文件。
