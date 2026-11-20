# 原第一列 vs annotator1_masked

- 输入：experiments/out/annotator1_masked.json
- provider=deepseek model=deepseek-v4-flash temperature=0 max_tokens=2000
- 条件：aligned_information
- 已知偏差项：0 条（详见 manifest）

## RQ2（二分类：y/n）

- 主表 n=30，两条件都有合法标签的配对 n=30
- 一致=26，翻转=4（13.33%）
- 第一列缺失/非法=0/0；重做列缺失=0
- 人工第二列已标=0/30

| 原 \ 重做 | y | n | 行合计 |
|---|---|---:|
| y | 1 | 4 | 5 |
| n | 0 | 25 | 25 |
| 列合计 | 1 | 29 | 30 |

翻转明细：
- rq2_007: y → n；理由：diff仅将RuleEditor的onSave默认值由undefined改为必填；测试只操作条件/动作列表并断言可见文本，未涉及保存或onSave行为。
- rq2_019: y → n；理由：测试仅访问 '/' 并断言 locator('functiontooltip') 可见，未操作或断言变更涉及的自动完成弹层样式、滚轮/鼠标事件转发、悬停高亮或函数集合/提示文案，无法建立与本次变更的直接关联。
- rq2_023: y → n；理由：测试仅访问首页并检查 reportcardname 可见/填充，未设置或断言 showTitle 条件下标题隐藏及 Rename 菜单变化，无法关联本次变更行为。
- rq2_025: y → n；理由：变更仅将分类自动补全的过滤逻辑替换为 filterCategorySuggestions；测试只点击 split-transaction-button 并断言对话框可见，未操作或断言分类自动补全过滤行为，无法建立直接关联。

失败清单（显式列出，未静默排除）：
- 无

## RQ3（三分类：SO/EC/SR）

- 主表 n=40，两条件都有合法标签的配对 n=40
- 一致=37，翻转=3（7.50%）
- 第一列缺失/非法=0/0；重做列缺失=0
- 人工第二列已标=0/40

| 原 \ 重做 | SO | EC | SR | 行合计 |
|---|---|---|---:|
| SO | 37 | 0 | 0 | 37 |
| EC | 2 | 0 | 0 | 2 |
| SR | 1 | 0 | 0 | 1 |
| 列合计 | 40 | 0 | 0 | 40 |

翻转明细：
- rb021: SR → SO；理由：旧断言用 getByRole('cell') 定位表头，新断言改为 columnheader；源码改动仅给 th 增加 scope="col" 并调整 a11y 属性，未改列显示/隐藏逻辑，断言可见性语义未变，且 commit 明确为 update broken locator。
- rb024: EC → SO；理由：源码在 LadRow.vue 为 td 新增 aria-label（如 lad timestamp），使旧 getByRole('cell',{name:'Timestamp'}) 的可访问名称匹配失效；测试仅加 exact:true，可见/隐藏断言与目标未变。
- rb033: EC → SO；理由：仅断言中的 locator 变更，toBeVisible 与“卡片可见”意图未变；无应用源码改动，commit 说明为规避 flaky 的测试定位调整。

失败清单（显式列出，未静默排除）：
- 无

## Cohen's κ

人工第二列仍为空，两个 κ（RQ2 30 条、RQ3 40 条）都**无法计算**。本报告不采用准确率、F1 或其他替代指标冒充 κ。
