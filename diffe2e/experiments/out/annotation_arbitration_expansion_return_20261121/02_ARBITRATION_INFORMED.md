# 扩展批次仲裁第二阶段（明判）

前提：`01_ARBITRATION_BLIND.md` 已填完并锁定 SHA。对照两列后填 `final` 与理由；若与盲判不同，须说明为何改判。`final` 只能取三个合法标签。

## rbx016（microsoft/playwright）

- 第一列（管线真实分诊）：`SUSPECTED_REGRESSION` —— 材料中“本次提交未改动断言级代码；旧断言保持不变”，因此不满足 EXPECTATION_CHANGE（断言目标未变）。旧定位器为 getByRole('treeitem')，但可见的应用源码 diff 只显示以下重构性改动：actionList.tsx 把内联回调提取为 useCallback；treeView.tsx 新增 title 属性，并把 flattenTree 与可见项过滤逻辑抽成 i
- 第二列（人工盲评）：`STRUCTURAL_ONLY`
- 材料：见 `01_ARBITRATION_BLIND.md` 同名单元

裁决：`final=STRUCTURAL_ONLY`  理由：对照两列，第一列（管线分诊）虽注意到 treeView.tsx 的重构，但未识别出 TreeView 从扁平兄弟节点改为嵌套 role='treeitem' 结构会直接导致 page.getByRole('treeitem') 产生定位结构变化。本次提交（chore: implement tree w/o list）无断言目标变更（+0/-0），属于典型的 DOM 层级重构导致的定位器失效，支持第二列 STRUCTURAL_ONLY。

---

## rbx020（microsoft/playwright）

- 第一列（管线真实分诊）：`SUSPECTED_REGRESSION` —— 旧测试块只包含 setViewportSize 与 toHaveScreenshot，未出现旧定位器 page.getByText(/Log/)；材料又明确“本次提交未改动断言级代码；旧断言保持不变”。同时源码 diff 涉及 traceUtils.ts 的 attachment.sha1/path 处理、testInfo.attach 新增 step，以及 attachmentsTab/call
- 第二列（人工盲评）：`STRUCTURAL_ONLY`
- 材料：见 `01_ARBITRATION_BLIND.md` 同名单元

裁决：`final=SUSPECTED_REGRESSION`  理由：第一列指出的证据缺口成立——旧测试块未包含 page.getByText(/Log/) 的实际调用与断言上下文，应用源码 diff 涉及 traceUtils.ts、testInfo.ts 及新增 AttachmentsTab，无法从现有材料中直接建立 Log 定位器失效与纯结构改动的因果链。按“看不出是测试老了还是应用坏了，两可时保守倾向 SUSPECTED_REGRESSION”的仲裁规则，支持第一列 SUSPECTED_REGRESSION。

---

## rbx031（tryghost/koenig）

- 第一列（管线真实分诊）：`STRUCTURAL_ONLY` —— 旧定位器是 '[data-kg-card-toolbar="html"] [aria-label="Visibility"]'，旧测试验证工具栏中 Visibility 图标可见；Commit 说明明确写有“Moved HTML card visibility settings to the SettingsPanel”和“Removed VisibilityDropdown component”
- 第二列（人工盲评）：`EXPECTATION_CHANGE`
- 材料：见 `01_ARBITRATION_BLIND.md` 同名单元

裁决：`final=EXPECTATION_CHANGE`  理由：第一列将其归为 STRUCTURAL_ONLY 忽略了旧测试本身的语义意图——旧用例名为 toolbar shows content visibility icon，明确断言卡片处于非编辑态（data-kg-card-editing="false"）且工具栏存在 Visibility 按钮。本次提交将该入口从非编辑态工具栏移除并迁入编辑态设置面板，断言级 diff 也相应改为校验 data-kg-card-editing="true" 与 settings-panel，属于产品行为与测试断言目标的实质变更，支持第二列 EXPECTATION_CHANGE。

---
