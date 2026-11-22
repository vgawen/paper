# 条件 A vs 条件 B（两套预标注）

- A：experiments/out/annotator1_condA.json；条件=approx_original_information；model=deepseek-v4-flash；T=0
- B：experiments/out/annotator1_masked.json；条件=aligned_information；model=deepseek-v4-flash；T=0

## RQ2（y/n）

- 配对 n=30；一致=28；翻转=2（6.67%）
- A 侧失败/缺失=0；B 侧失败/缺失=0
- A 分布：{"n":29,"y":1}
- B 分布：{"n":29,"y":1}

| A \ B | y | n | 行合计 |
|---|---|---:|
| y | 0 | 1 | 1 |
| n | 1 | 28 | 29 |
| 列合计 | 1 | 29 | 30 |

翻转明细：
- rq2_007: y → n；B 理由：diff仅将RuleEditor的onSave默认值由undefined改为必填；测试只操作条件/动作列表并断言可见文本，未涉及保存或onSave行为。
- rq2_029: n → y；B 理由：测试在 / 定位并点击 popover trigger，断言 popover 可见，直接对应 diff 新增的 Popover.Trigger/Popover.Content 行为；选择器不精确但仍建立了关联。

失败清单（显式列出，未静默排除）：
- 无

## RQ3（SO/EC/SR）

- 配对 n=40；一致=37；翻转=3（7.50%）
- A 侧失败/缺失=0；B 侧失败/缺失=0
- A 分布：{"STRUCTURAL_ONLY":37,"EXPECTATION_CHANGE":3}
- B 分布：{"STRUCTURAL_ONLY":40}

| A \ B | SO | EC | SR | 行合计 |
|---|---|---|---:|
| SO | 37 | 0 | 0 | 37 |
| EC | 3 | 0 | 0 | 3 |
| SR | 0 | 0 | 0 | 0 |
| 列合计 | 40 | 0 | 0 | 40 |

翻转明细：
- rb033: EC → SO；B 理由：仅断言中的 locator 变更，toBeVisible 与“卡片可见”意图未变；无应用源码改动，commit 说明为规避 flaky 的测试定位调整。
- rb039: EC → SO；B 理由：应用源码无改动，最终断言 toHaveCount(2) 未变；仅将等待任意选中菜单项改为等待含 'snippet' 的菜单项可见，属定位/等待方式调整。
- rb040: EC → SO；B 理由：提交仅改测试，用带hasText:'snippet'的可见性等待替换旧选中项等待，属定位/等待方式调整；无应用diff，最终toHaveCount(2)未变。

失败清单（显式列出，未静默排除）：
- 无

## 说明

A 与 B 使用同一模型、同一 temperature、同一 prompt 文本，仅材料不同：A 为近似原始信息条件（信息更少），B 为协议 B 盲评材料（含应用源码 diff / 完整旧块 / 遮蔽断言 diff）。
失败条目不计入配对矩阵，但逐条列入“失败清单”；两个 κ 仍因人工列为空而无法计算。
