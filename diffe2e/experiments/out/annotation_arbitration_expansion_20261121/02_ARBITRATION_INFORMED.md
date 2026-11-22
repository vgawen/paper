# 扩展批次仲裁第二阶段（明判）

前提：`01_ARBITRATION_BLIND.md` 已填完并锁定 SHA。对照两列后填 `final` 与理由；若与盲判不同，须说明为何改判。`final` 只能取三个合法标签。

## rbx016（microsoft/playwright）

- 第一列（管线真实分诊）：`SUSPECTED_REGRESSION` —— 材料中“本次提交未改动断言级代码；旧断言保持不变”，因此不满足 EXPECTATION_CHANGE（断言目标未变）。旧定位器为 getByRole('treeitem')，但可见的应用源码 diff 只显示以下重构性改动：actionList.tsx 把内联回调提取为 useCallback；treeView.tsx 新增 title 属性，并把 flattenTree 与可见项过滤逻辑抽成 i
- 第二列（人工盲评）：`STRUCTURAL_ONLY`
- 材料：见 `01_ARBITRATION_BLIND.md` 同名单元

裁决：`final=___`  理由：___

---

## rbx020（microsoft/playwright）

- 第一列（管线真实分诊）：`SUSPECTED_REGRESSION` —— 旧测试块只包含 setViewportSize 与 toHaveScreenshot，未出现旧定位器 page.getByText(/Log/)；材料又明确“本次提交未改动断言级代码；旧断言保持不变”。同时源码 diff 涉及 traceUtils.ts 的 attachment.sha1/path 处理、testInfo.attach 新增 step，以及 attachmentsTab/call
- 第二列（人工盲评）：`STRUCTURAL_ONLY`
- 材料：见 `01_ARBITRATION_BLIND.md` 同名单元

裁决：`final=___`  理由：___

---

## rbx031（tryghost/koenig）

- 第一列（管线真实分诊）：`STRUCTURAL_ONLY` —— 旧定位器是 '[data-kg-card-toolbar="html"] [aria-label="Visibility"]'，旧测试验证工具栏中 Visibility 图标可见；Commit 说明明确写有“Moved HTML card visibility settings to the SettingsPanel”和“Removed VisibilityDropdown component”
- 第二列（人工盲评）：`EXPECTATION_CHANGE`
- 材料：见 `01_ARBITRATION_BLIND.md` 同名单元

裁决：`final=___`  理由：___

---
