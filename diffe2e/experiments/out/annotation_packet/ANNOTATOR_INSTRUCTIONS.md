# RQ2 / RQ3 盲评材料说明

这份材料包用于第二标注者独立标注。规则见本文件；逐条材料见 `rq2_worksheet.md` 与 `rq3_context.md`。

## 打开哪些文件

| 任务 | 工作文件（直接编辑） | 填哪一列 |
|---|---|---|
| RQ2（30 条生成测试） | `rq2_worksheet.md` | 每节末尾 `annotator2_yn=y` 或 `annotator2_yn=n` |
| RQ3（40 条断裂） | `rq3_context.md` | 每节末尾 `human2=STRUCTURAL_ONLY` / `EXPECTATION_CHANGE` / `SUSPECTED_REGRESSION` |

`final` 一律留空，它只由第三仲裁者在两列不一致时填写。`*_fill_template.csv` 是手工录入的备用模板，只有在不能编辑 Markdown 时才用。

## RQ2 判什么

一条 spec 是否真的打开应用、操作或断言了**这次变更引入/改变的具体 UI 或行为**。四个问题都过才填 `y`：

1. 它有没有真的打开应用（不是 `page.setContent` 造假 DOM）？
2. 它操作/断言的元素，和 `gap_file` 里的变更对得上吗？
3. 断言是否具体到“变更后的结果”，而不是 body/页面/通用 header？
4. 如果这次变更不存在，这条测试会不会失败？

依据：`gap_file`、`route`（只是定位信息，不是页面说明）、**应用源码 diff**、`spec` 全文。应用 diff 只含应用源码，已排除测试文件。

## RQ3 判什么

一条已执行验证的 locator 断裂属于哪种过时：

- `STRUCTURAL_ONLY`：测试意图不变，只是 locator / DOM 层级 / class/id / 文案锚点 / 测试 API / 框架迁移变了。可以自动改定位。
- `EXPECTATION_CHANGE`：测试要验证的业务结果/断言目标本身变了，旧断言还在检查旧行为。需要改断言语义，通常要人确认。
- `SUSPECTED_REGRESSION`：无法排除新版本真回归；看不出是测试老了还是应用坏了。保守选项，不应自动改写采纳。

依据：旧定位器、**完整旧测试块**、完整 commit 主题与正文、完整应用改动文件列表、**应用源码 diff**、**断言级测试 diff（机械定位方式已遮蔽）**。**遮蔽对象是寻址路径，不是语义锚**：CSS/id/class/`data-*`/xpath/`nth` 等替换为 `<LOCATOR_REDACTED>`；`getByRole` 的 role 与 name、`getByText` 等的文本、`filter({hasText})` 的文本、断言值与 matcher 保持可见。若某对 `-`/`+` 行只因机械寻址方式不同而完全一样，新增侧标为 `<LOCATOR_CHANGED>`，只表明“定位方式变了”，不显示具体路径。

## 什么情况停下来问协调者

- RQ2 某节没有应用 diff，或 diff 里混进了测试文件；
- RQ2 的 spec 引用了被截断/找不到的 fixture 或页面路径；
- RQ3 的旧测试块看不到断言，或明显不是完整 `it/test` 块；
- RQ3 应用 diff 为空，但 commit 主题像行为变更；
- 断言级 diff 显示“遮蔽验证未通过”；
- 你在材料里看到 `new_locator`、新测试内容、arm、第一列标签/理由、自动指标或 score。

以上都属于证据不足或盲评泄露，写进备注并停下，不要用猜测填标签。

## 禁止

- 不要打开任何包外的结果、标签、理由、一致性统计或评分文件；
- 不要打开被测仓库、git 历史、commit 网页/PR/issue；
- 不要运行被测测试（RQ3 会直接暴露 new_locator）。

## 交付

- 保存为 UTF-8，不要增删节、不要改标题和顺序；
- 全部填完后，协调者会做锁定与 `shasum -a 256` 记录，再运行 collect / merge / score。
