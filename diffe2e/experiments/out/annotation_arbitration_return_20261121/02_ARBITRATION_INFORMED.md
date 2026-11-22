# 仲裁第二阶段（明判）

前提：`01_ARBITRATION_BLIND.md` 已填完并锁定 SHA。此处对照两列标签与第一列理由，填写最终裁决 `final` 与一句理由。
`final` 只能取本 RQ 合法标签；可采纳任一列，也可坚持盲判。若 `final` 与盲判不同，理由须说明为何改判。

## rq2_007

- 第一列（作者 LLM 辅助）：`y` —— 导航后操作 RuleEditor 的 conditions-op、condition-list、field/op/editor-row，并断言条件值与 action 列表可见，直接覆盖变更组件的新交互。
- 第二列（外部标注者）：`n`
- 材料：见 `01_ARBITRATION_BLIND.md` 同名单元

裁决：`final=n`  理由：采纳第二列并维持盲判；源码仅删除 onSave 的 = undefined 默认值，测试未触及保存行为，第一列所谓“覆盖变更组件的新交互”并不成立。

---

## rq2_019

- 第一列（作者 LLM 辅助）：`y` —— 导航后专门断言 functiontooltip 可见，该元素对应 codeMirror-excelLanguage 的变更产物。
- 第二列（外部标注者）：`n`
- 材料：见 `01_ARBITRATION_BLIND.md` 同名单元

裁决：`final=n`  理由：采纳第二列并维持盲判；functiontooltip 为无效 DOM 定位器且未进入编辑器场景，无法验证 codeMirror-excelLanguage.tsx 的实际变更。

---

## rq2_023

- 第一列（作者 LLM 辅助）：`y` —— 导航后定位 reportcardname，填入并断言 value，直接验证 FormulaCard 的变更元素。
- 第二列（外部标注者）：`n`
- 材料：见 `01_ARBITRATION_BLIND.md` 同名单元

裁决：`final=n`  理由：采纳第二列并维持盲判；测试使用伪定位器 [tag="reportcardname"] 且完全未验证 showTitle 开关对标题及菜单项的条件渲染。

---

## rq2_025

- 第一列（作者 LLM 辅助）：`y` —— 点击 split-transaction-button 并断言 split-transaction-dialog 出现，验证 CategoryAutocomplete 相关的新交互。
- 第二列（外部标注者）：`n`
- 材料：见 `01_ARBITRATION_BLIND.md` 同名单元

裁决：`final=n`  理由：采纳第二列并维持盲判；测试针对虚构的拆分交易按钮与弹窗，与 CategoryAutocomplete 提取 filterCategorySuggestions 的重构变更无关。

---

## rq2_029

- 第一列（作者 LLM 辅助）：`y` —— 导航后点击 card 内的 popover.trigger 并断言 popover 可见，直接验证 Preset 的变更交互。
- 第二列（外部标注者）：`n`
- 材料：见 `01_ARBITRATION_BLIND.md` 同名单元

裁决：`final=n`  理由：采纳第二列并维持盲判；测试把 Svelte 组件名直接写成无效 DOM 选择器且未验证示例切换结果，按保守规则不构成对 Preset.svelte 变更的有效验证。

---

## rb021

- 第一列（作者 LLM 辅助）：`SUSPECTED_REGRESSION` —— 断言语义发生反转：旧断言 Units 单元格可见，新断言 Timestamp 列头隐藏；无法确认是测试随重构更新还是掩盖了真实回归，保守判疑似回归。
- 第二列（外部标注者）：`STRUCTURAL_ONLY`
- 材料：见 `01_ARBITRATION_BLIND.md` 同名单元

裁决：`final=STRUCTURAL_ONLY`  理由：采纳第二列并维持盲判；核对断言 diff 可见每组 8 列的 toBeVisible/toBeHidden 语义完全一一对应，第一列系将 diff 错位误读为“语义反转”，实际仅为配合 LadTable.vue 新增 scope="col" 的定位器更新。

---

## rb024

- 第一列（作者 LLM 辅助）：`EXPECTATION_CHANGE` —— 断言目标由 Type 单元格改为 Timestamp 单元格，验证的列发生实质变化；不是单纯定位器重写。
- 第二列（外部标注者）：`STRUCTURAL_ONLY`
- 材料：见 `01_ARBITRATION_BLIND.md` 同名单元

裁决：`final=STRUCTURAL_ONLY`  理由：采纳第二列并维持盲判；断言 diff 仅在原有 Timestamp 与 Type 定位器上补充 exact: true 以规避 LadRow.vue 新增 aria-label 的子串冲突，第一列误读了 diff 行序，断言目标并未变化。

---

## rb033

- 第一列（作者 LLM 辅助）：`EXPECTATION_CHANGE` —— 测试输入与目标卡片类型由 markdown 改为 codeblock（插入方式也改为 ```），断言目标发生实质变化；这是测试自身的 flaky 修复。
- 第二列（外部标注者）：`STRUCTURAL_ONLY`
- 材料：见 `01_ARBITRATION_BLIND.md` 同名单元

裁决：`final=EXPECTATION_CHANGE`  理由：采纳第一列并维持盲判；无应用源码改动，测试为修复 flaky 将输入方式与目标卡片类型由 markdown 更换为 codeblock，属于断言目标发生实质变化的预期变更。

---
