# RQ2 / RQ3 盲评交接说明

> 更新：2026-11-01
> 当前状态：**第一标注列已填写；第二标注列待盲评填写；κ 尚未计算。** 第二标注者优先为未参与预标注的独立标注者；作者本人填写时须保持“未见第一列”的隔离与锁定（见 `ANNOTATION_GUIDE.md` §6）。论文正文已推到定稿候选 v1.0，κ 的固定回填位置是 §5.2、§5.3、§5.6 与表 5-10。

## 1. 已完成什么

| 文件 | 内容 | 状态 |
|---|---|---|
| `experiments/annotate/ANNOTATION_GUIDE.md` | 完整盲评指南：为什么盲评、RQ2/RQ3 怎么看怎么判、不跑测试、作者隔离、回收命令 | 完成 |
| `experiments/out/rq2_real_to_annotate.csv` | 30 条 RQ2 真实项目生成用例；`annotator1_yn` 已填 | 第一列完成 |
| `experiments/out/rq2_annotator1_rationale.md` | RQ2 第一列逐条判定理由（不提供第二标注者） | 完成 |
| `experiments/out/rq2_annotator2_worksheet.md` | RQ2 逐条工作表（30 节，含判断方法速查） | **待填** |
| `experiments/out/rq2_annotator2_blind.csv` | 第二标注者盲表（只有 `annotator2_yn` / `final`） | **待填** |
| `experiments/out/rq3_reprobreak_to_annotate.csv` | 40 条 RQ3 ReproBreak 样本；`human1` 已填 | 第一列完成 |
| `experiments/out/rq3_annotator1_rationale.md` | RQ3 第一列逐条判定理由（不提供第二标注者） | 完成 |
| `experiments/out/rq3_annotator2_blind.csv` | 第二标注者盲表（只有 `human2` / `final`） | **待填** |
| `experiments/out/rq3_annotator_context_blind.md` | RQ3 逐条上下文：旧测试片段 + commit 说明 + 改动文件 + 判断方法速查；不含 new_locator | **待填** |

第一列分布（仅为第一标注者结果，不是最终 κ）：

- RQ2：`y=5 / n=30`；解盲后 diff 臂 `5/15`、nodiff 臂 `0/15`。
- RQ3：`STRUCTURAL_ONLY=37`、`EXPECTATION_CHANGE=2`、`SUSPECTED_REGRESSION=1`。

## 2. 第二标注者怎么填

> 完整的“怎么看、怎么判”见 `ANNOTATION_GUIDE.md`：为什么自动指标之外还要盲评、RQ2/RQ3 的逐条判断方法、为什么不需要跑测试、作者本人填写时的隔离与锁定步骤。下面只保留交接所需的最短说明。

### 推荐填法：Markdown 工作表

为避免在多行代码的 CSV 单元格里操作，RQ2 与 RQ3 都提供了逐条工作表：

- RQ2：`experiments/out/rq2_annotator2_worksheet.md`（30 节，每节一条生成用例）
- RQ3：`experiments/out/rq3_annotator_context_blind.md`（40 节，每节含 commit 说明、改动文件与旧测试片段）

RQ2 工作表由盲表派生；如果重新生成了 `rq2_annotator2_blind.csv`，用 `node experiments/annotate/make_rq2_worksheet.mjs` 重建工作表。

每节末尾有一行：

```
判定：`annotator2_yn=___`        # RQ2：改成 y 或 n
判定：`human2=___`  备注：       # RQ3：改成三个标签之一
```

只改 `___`，不要改 `case_id`、代码、标题或行序。填完后由收集脚本写回盲表：

```bash
cd diffe2e
node experiments/annotate/collect_annotator2_md.mjs          # 先 dry-run，看还差多少
node experiments/annotate/collect_annotator2_md.mjs --write  # 写回两张盲表
```

### 直接填 CSV（可选）

也可以直接打开 `rq2_annotator2_blind.csv` / `rq3_annotator2_blind.csv`，只填 `annotator2_yn` 或 `human2` 列；`final` 留空（它只由第三人在两人不一致时填写）。保存为 UTF-8 CSV，不要增删行列。

### 盲评纪律

- 只打开上述工作表，或 `*_annotator2_blind.csv` 与 `rq3_annotator_context_blind.md`。
- **不要**打开 `*_unblind.json`、`*_rationale.md`、`rq2_real_to_annotate.csv`（含第一列）、`rq3_reprobreak_to_annotate.csv`（含第一列）、`reprobreak_breaks.json`。
- RQ3 上下文中刻意不提供 `new_locator`；请根据旧测试片段、commit 说明和应用源码改动文件判断。

### 作者本人填写时的隔离

如果由作者本人填写第二标注列，可以，但必须保持与独立标注者相同的隔离：

1. **先填第二列，再看第一列**；填写期间不要打开含第一列的主表、逐条理由或 `*_unblind.json`。
2. 填完后、合并前，先留一份锁定副本，证明标签在查看第一列之前已固定：
   ```bash
   cp experiments/out/rq2_annotator2_worksheet.md experiments/out/rq2_annotator2_worksheet.locked.md
   cp experiments/out/rq3_annotator_context_blind.md experiments/out/rq3_annotator_context_blind.locked.md
   shasum -a 256 experiments/out/*_annotator2_worksheet.locked.md experiments/out/*_context_blind.locked.md
   ```
3. 之后才运行收集、合并与评分。
4. 论文中如实写成“人工盲评（未见第一列）”，κ 解释为**预标注-人工一致性**，不要写成“人际 κ”或“两名人类标注者独立盲评”。

### RQ2 判定标准

看 `gap_file`、`route`、`spec`，问四个问题：是否真的打开应用、是否触达变更文件对应的 UI、断言是否具体到变更后的结果、变更不存在时测试是否会失败。四个都过才填 `y`。

- `y`：测试实际打开应用，并操作/断言了本次变更引入或改变的具体 UI/行为。
- `n`：通用 smoke、只断言 body 可见、`page.setContent` 合成页面、与变更文件无关的业务流程、断言过于空泛。
- **不需要跑测试**：可执行率、版本敏感、变异杀伤已由自动实验测过；人工判的是语义相关性。
- 详细规范见 `ANNOTATION_GUIDE.md`、`PROTOCOL.md` 与 `ANNOTATION_ONE_PAGER.md`。

### RQ3 判定标准

看 `old_locator`、旧测试片段、commit 说明与改动文件列表；不要跑新版本（会看到 `new_locator`）。

- `STRUCTURAL_ONLY`：测试意图不变；只是 locator、DOM 结构、文案锚点、测试 API 迁移或格式变化。
- `EXPECTATION_CHANGE`：测试要验证的业务结果/断言目标发生实质变化，修复需要改测试语义。
- `SUSPECTED_REGRESSION`：无法确定是测试过时，可能是新版本真实回归；保守判此类。
- 仅由测试框架迁移（vitest→Playwright）或定位器 API 迁移（`page.$`→`page.locator`）引起 → `STRUCTURAL_ONLY`。
- 测试自身的 flaky 修复：意图不变、仅定位器更精确 → `STRUCTURAL_ONLY`；插入/断言的业务对象实质变化（如 markdown→codeblock）→ `EXPECTATION_CHANGE`。

### 填写规则

- 只填自己负责的列，不要修改 `case_id`、代码内容或表头顺序。
- 两人不一致时，由第三人仲裁后填 `final`；一致时 `final` 留空。
- RQ2 只填 `y` / `n`；RQ3 只填三个标签之一。

## 3. 填完后如何合并与计算 κ

```bash
# 0) 如果填的是 Markdown 工作表，先把标签写回盲表（填 CSV 则跳过）
node experiments/annotate/collect_annotator2_md.mjs --write

# 1) 合并第二标注者列到主表
node experiments/annotate/merge_second_annotator.mjs \
  experiments/out/rq2_annotator2_blind.csv \
  experiments/out/rq2_real_to_annotate.csv
node experiments/annotate/merge_second_annotator.mjs \
  experiments/out/rq3_annotator2_blind.csv \
  experiments/out/rq3_reprobreak_to_annotate.csv

# 2) 计算 κ 与语义有效率
node experiments/annotate/score.mjs experiments/out/rq2_real_to_annotate.csv
node experiments/annotate/score.mjs experiments/out/rq3_reprobreak_to_annotate.csv

# 3) 生成论文回填模板
node experiments/annotate/render_kappa_backfill.mjs
```

输出：

- `experiments/out/rq2_real_to_annotate_annotation.json`
- `experiments/out/rq3_staleness_annotation.json`
- `experiments/out/kappa_backfill.md`

## 4. 必须写进论文/答辩说明的三件事

1. **第一列是 LLM 辅助标注，不是独立人类标注。** 当前第一列由模型按显式判据生成并附逐条理由；作者复核应在合并前完成。论文当前写为“LLM 辅助预标注（附逐条理由）”，不能写成“两名人类标注者独立盲评”。
2. **RQ3 的 `model_label` 是常量 `STRUCTURAL_ONLY`。** `make_rq3_reprobreak_sheet.mjs:13` 把 40 条样本的模型标签全部硬编码为 `STRUCTURAL_ONLY`；而 `pipeline/src/staleness.mjs` 的规则是“只要 locator 断裂就返回 STRUCTURAL_ONLY”。因此：
   - 模型准确率（约 0.925）只能作描述性报告；
   - 模型-人工 Cohen's κ 必然为 0（一方的标签无方差），**不应作为方法优越性的证据**；
   - RQ3 的主结果应报告 human1 vs human2 的 κ，并注明 human1 为 LLM 辅助预标注，因此这是**预标注-人工一致性**而非人际 κ；模型对比需注明上述构造性限制。
3. **RQ3 样本中有大量测试 API 迁移/格式变化**（`page.$`→`page.locator`、style 字符串空格、`waitForSelector`→`locator`），并非都由应用行为变化引起。论文中应说明 ReproBreak 的样本构成，避免把“测试代码迁移”误读为“应用语义变化”。

## 5. 建议的论文表述（κ 出来后替换占位）

> RQ2：从 actual-budget 与 mermaid-live-editor 两个真实项目抽取 30 条生成用例（diff/nodiff 各 15）。第一标注列为 LLM 辅助预标注（附逐条理由），结果为 diff 臂 5/15、nodiff 臂 0/15；第二标注者独立盲评后，报告 Cohen's κ 与仲裁后语义有效率（最终数字以双标注合并后为准）。
>
> RQ3：从 ReproBreak 414 条无泄漏评估样本中分层抽取 40 条。第一标注列分布为 STRUCTURAL_ONLY=37、EXPECTATION_CHANGE=2、SUSPECTED_REGRESSION=1；第二标注者独立盲评后报告人际 Cohen's κ。由于 ReproBreak 由 locator 断裂构造，自动分诊标签恒为 STRUCTURAL_ONLY，模型-人工 κ 不具区分度，故模型侧仅作描述性准确率报告。
