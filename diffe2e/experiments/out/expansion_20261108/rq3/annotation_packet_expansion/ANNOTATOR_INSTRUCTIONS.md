# RQ3 扩展批次盲评材料说明

这份材料包只用于 **RQ3 扩展批次**（40 条，case_id `rbx001`–`rbx040`）。它与主实验 `rb` 批次完全独立：不共用条目、不共用哈希清单、不引用主实验标签或结果。

## 打开哪些文件

| 任务 | 工作文件（直接编辑） | 填哪一列 |
|---|---|---|
| RQ3 扩展批次（40 条断裂） | `rq3_context.md` | 每节末尾 `human2=STRUCTURAL_ONLY` / `EXPECTATION_CHANGE` / `SUSPECTED_REGRESSION` |

`final` 一律留空，它只由第三仲裁者在两列不一致时填写。`rq3_fill_template.csv` 是手工录入的备用模板。

## 判什么

一条已执行验证的 locator 断裂属于哪种过时：

- `STRUCTURAL_ONLY`：测试意图不变，只是 locator / DOM 层级 / class/id / 文案锚点 / 测试 API / 框架迁移变了。
- `EXPECTATION_CHANGE`：测试要验证的业务结果/断言目标本身变了，旧断言还在检查旧行为。
- `SUSPECTED_REGRESSION`：无法排除新版本真回归；看不出是测试老了还是应用坏了。保守选项。

依据：旧定位器、完整旧测试块、commit 主题与正文、完整应用改动文件列表、应用源码 diff、断言级测试 diff（机械定位方式已遮蔽，语义锚可见）。

## 禁止

- 不要打开 `rq3_expansion_unblind.json`、`rq3_expansion_triage.json` 或任何 `*_unblind.json`、`*_rationale.md`；
- 不要打开被测仓库、git 历史、commit 网页/PR/issue；
- 不要运行被测测试（会直接暴露 new locator）；
- 不要查看或推测真实分诊标签、主实验第一列或任何自动指标。

## 交付

- 保存为 UTF-8，不要增删节、不要改标题和顺序；
- 全部填完后，协调者会做锁定与 `shasum -a 256` 记录，再进入扩展批次的结构闸门与评分。
