# 原第一列 vs annotator1_condA

- 输入：experiments/out/annotator1_condA.json
- provider=deepseek model=deepseek-v4-flash temperature=0 max_tokens=500
- 条件：approx_original_information
- 已知偏差项：9 条（详见 manifest）

## RQ2（二分类：y/n）

- 主表 n=30，两条件都有合法标签的配对 n=30
- 一致=25，翻转=5（16.67%）
- 第一列缺失/非法=0/0；重做列缺失=0
- 人工第二列已标=0/30

| 原 \ 重做 | y | n | 行合计 |
|---|---|---:|
| y | 0 | 5 | 5 |
| n | 0 | 25 | 25 |
| 列合计 | 0 | 30 | 30 |

翻转明细：
- rq2_007: y → n；理由：材料仅给出变更文件路径，未说明具体变更内容；测试虽操作规则编辑器，但无法确认触达并验证了本次引入或改变的行为。
- rq2_019: y → n；理由：用例仅访问首页并断言'functiontooltip'元素可见，未打开公式编辑器，未触达codeMirror-excelLanguage.tsx变更的函数提示行为，断言也无法区分新旧版本。
- rq2_023: y → n；理由：测试仅检查reportcardname输入可见并可填值，未体现FormulaCard.tsx本次变更的具体行为，无法区分新旧版本。
- rq2_025: y → n；理由：变更文件是 CategoryAutocomplete.tsx，用例却只点击 split-transaction-button 并断言 split-transaction-dialog，未触达分类自动完成相关行为。
- rq2_029: y → n；理由：材料只给出变更文件，未说明Preset.svelte具体改变了什么行为；用例仅点击触发器的并断言popover可见，无法确认触达本次变更，也无法区分新旧版本。

## RQ3（三分类：SO/EC/SR）

- 主表 n=40，两条件都有合法标签的配对 n=39
- 一致=37，翻转=2（5.13%）
- 第一列缺失/非法=0/0；重做列缺失=1
- 人工第二列已标=0/40

| 原 \ 重做 | SO | EC | SR | 行合计 |
|---|---|---|---:|
| SO | 37 | 0 | 0 | 37 |
| EC | 1 | 0 | 0 | 1 |
| SR | 1 | 0 | 0 | 1 |
| 列合计 | 39 | 0 | 0 | 39 |

翻转明细：
- rb021: SR → SO；理由：断言仅将 cell 改为 columnheader，并把 WATCH 等文案锚点改为 Limit WATCH；测试意图仍是 LAD 表列头可见/隐藏，commit 也说明是修复断裂定位器。
- rb024: EC → SO；理由：断言仍为可见/隐藏，仅将 getByRole 的 name 匹配加上 exact:true，属于定位器锚点收紧，测试意图未变。

## Cohen's κ

人工第二列仍为空，两个 κ（RQ2 30 条、RQ3 40 条）都**无法计算**。本报告不采用准确率、F1 或其他替代指标冒充 κ。
