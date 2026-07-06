# RQ2 / RQ3 标注一页清单

## 文件位置

- RQ2：`diffe2e/experiments/out/rq2_real_to_annotate.csv`
- RQ3：`diffe2e/experiments/out/rq3_reprobreak_to_annotate.csv`

## RQ2 怎么填

### 目标

判断生成用例是不是**真的在测试本次变更相关的新行为**。

### 表头说明

- `case_id`：盲评编号。不要改。
- `route`：变更上下文标签，只用于帮助理解样本来源。
- `gap_file`：对应的变更文件。
- `spec`：待判断的生成测试代码。
- `annotator1_yn`：标注者 1 填 `y` 或 `n`。
- `annotator2_yn`：标注者 2 填 `y` 或 `n`。
- `final`：只有两人不一致时才填；填仲裁后的 `y` 或 `n`。

### 判定标准

- 填 `y`：这条测试确实验证了本次变更引入的新界面、新交互或新结果。
- 填 `n`：这条测试虽然能运行，但没有验证本次变更，或者断言过于空泛。

### 常见误判

- 只断言页面能打开、`body` 可见、某个通用容器存在，通常应判 `n`。
- 测试跑的是老流程、与变更文件无关，通常应判 `n`。
- 测试明确点击/输入了新增或变化的 UI，并断言变化结果，通常应判 `y`。

## RQ3 怎么填

### 目标

判断失败测试更像是哪一种“过时”类型，而不是看系统原标签。

### 表头说明

- `case_id`：盲评编号。不要改。
- `rb_id`：ReproBreak 样本 id。
- `repo`：样本来自哪个仓库。
- `framework`：`playwright` 或 `cypress`。
- `test_file_path`：原测试文件路径。
- `line_no`：定位器所在行号。
- `old_locator`：旧测试中的断裂定位器。
- `human1`：标注者 1 填分类标签。
- `human2`：标注者 2 填分类标签。
- `final`：只有两人不一致时才填；填仲裁后的最终标签。

### 可选标签

- `STRUCTURAL_ONLY`：测试意图没变，主要是 locator、DOM 结构、文案锚点变了。
- `EXPECTATION_CHANGE`：需求或断言目标变了，修复需要改测试语义。
- `SUSPECTED_REGRESSION`：不能确定是测试过时，可能是系统真实回归。

### 常见误判

- 只是定位器失效、元素路径变了，优先判 `STRUCTURAL_ONLY`。
- 预期文本、业务结果、断言语义变了，优先判 `EXPECTATION_CHANGE`。
- 看不出是测试老了还是功能坏了，保守判 `SUSPECTED_REGRESSION`。

## 填写规则

- 只填自己负责的列，不要覆盖对方列。
- 不一致时再填写 `final`。
- 除 `y`、`n` 和三类标签外，不要写别的自由文本。
- 不要修改 `case_id`、路径、代码内容或表头顺序。

## 填完后怎么评分

### RQ2

```bash
node diffe2e/experiments/annotate/score.mjs diffe2e/experiments/out/rq2_real_to_annotate.csv
```

输出会写到：

- `diffe2e/experiments/out/rq2_real_to_annotate_annotation.json`

### RQ3

```bash
node diffe2e/experiments/annotate/score.mjs diffe2e/experiments/out/rq3_reprobreak_to_annotate.csv
```

输出会写到：

- `diffe2e/experiments/out/rq3_staleness_annotation.json`

## 回填论文

两张表都评分后，运行：

```bash
node diffe2e/experiments/annotate/render_kappa_backfill.mjs
```

会生成：

- `diffe2e/experiments/out/kappa_backfill.md`

这个文件里的文字可以直接拿去回填论文正文。
