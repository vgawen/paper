# 标注交付包（独立版）

本目录是一个**自包含**的标注任务包。收件人不需要进入任何代码仓库，也不需要了解本项目的方法背景，只按照包内文件即可完成标注。

## 包里有什么

| 文件 | 用途 | 是否需要打开 |
|---|---|---|
| `01_START_HERE.md` | 一页说明：两件事怎么做、什么时候停 | **先读** |
| `02_RQ2_worksheet.md` | 任务一：30 条生成测试的逐条材料与判定行 | **打开并填写** |
| `03_RQ3_worksheet.md` | 任务二：40 条断裂的逐条材料与判定行 | **打开并填写** |
| `04_RQ2_fill_template.csv` | 任务一的备用录入表（30 行） | 二选一时才用 |
| `05_RQ3_fill_template.csv` | 任务二的备用录入表（40 行） | 二选一时才用 |
| `08_RQ3_LABELS.md` | 任务二三分类的一句话判据与正反例 | 判 RQ3 前读 |
| `SHA256SUMS` | 本包原始文件的校验值 | 用于确认包未被改动 |

## 两种填写方式，二选一

1. **直接编辑 Markdown（推荐）**：在 `02_RQ2_worksheet.md` 的每节末尾把 `annotator2_yn=___` 改成 `y` 或 `n`；在 `03_RQ3_worksheet.md` 把 `human2=___` 改成三个标签之一。`final` 一律留空。
2. **填 CSV**：打开 `04_RQ2_fill_template.csv` / `05_RQ3_fill_template.csv`，只填 `annotator2_yn` / `human2` 两列（`case_id` 已预填，`final` 留空）。材料仍要从对应工作表读。

**不要两种都填**，否则协调者无法判断以哪份为准。

## 回传方式与完成标志

完成后按 `01_START_HERE.md` 的“完成后怎么回传”生成校验文件，然后把以下文件打包回传：

- 填写后的 `02_RQ2_worksheet.md`（或 `04_RQ2_fill_template.csv`）
- 填写后的 `03_RQ3_worksheet.md`（或 `05_RQ3_fill_template.csv`）
- 你生成的 `HANDOVER_CHECKSUMS_<姓名拼音>_<YYYYMMDD>.txt`

**完成标志**（全部满足才算交付）：

1. RQ2 的 30 条全部有且仅有 `y` 或 `n`，没有空行；
2. RQ3 的 40 条全部有且仅有 `STRUCTURAL_ONLY`、`EXPECTATION_CHANGE`、`SUSPECTED_REGRESSION` 之一；
3. `final` 列或字段全部为空（这是第三仲裁者用的，不要填）；
4. 按 `01_START_HERE.md` 的回传步骤生成校验文件，`shasum -a 256 -c` 校验通过，且校验文件中记录了填写后文件的 SHA-256 与字节数；
5. 回传压缩包命名符合 `annotation_return_<姓名拼音>_<YYYYMMDD>.zip`。

## 独立性要求

本任务只依据包内材料做判断。**不要运行测试、不要搜索仓库、不要打开任何未在本包列出的结果文件。**

如果材料缺失、互相矛盾，或你无法确定某条该怎么判，按 `01_START_HERE.md` 的“停下来”规则处理，不要猜。
