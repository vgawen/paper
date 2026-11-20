# RQ3 扩展批次真实分诊（40 条）

- 提供方：deepseek / deepseek-v4-flash，temperature=0
- 有效分诊：40/40；失败：0
- 标签分布：STRUCTURAL_ONLY=38，SUSPECTED_REGRESSION=2
- 口径：本批为真实分诊；主实验 40 条模型列仍为常量 `STRUCTURAL_ONLY`，不重跑、不合并。

| case | repo | label | 理由（节选） |
|---|---|---|---|
| rbx001 | ghiscoding/angular-slickgrid | STRUCTURAL_ONLY | Commit 主题为“feat!: migrate to Slickgrid-Universal v4.0 new major version”，源码 diff 主要升级 @slickgrid-universal/* 到 4.0.1-alp |
| rbx002 | ghiscoding/angular-slickgrid | STRUCTURAL_ONLY | Commit 主题为 feat!: migrate to Slickgrid-Universal v4.0 new major version；package.json 将 @slickgrid-universal/* 从 ~3.7.1 升 |
| rbx003 | ghiscoding/angular-slickgrid | STRUCTURAL_ONLY | Commit 主题为“feat!: migrate to Slickgrid-Universal v4.0 new major version”，源码 diff 显示依赖从 3.7.x 升级到 4.0.1-alpha.1，并伴随 API 迁 |
| rbx004 | ghiscoding/angular-slickgrid | STRUCTURAL_ONLY | 提交主题明确为“migrate to Slickgrid-Universal v4.0 new major version”，package.json 中相关依赖从 ~3.7.1 升至 ~4.0.1-alpha.1；旧定位器依赖 slick |
| rbx005 | ghiscoding/angular-slickgrid | STRUCTURAL_ONLY | Commit 主题明确为“migrate to Slickgrid-Universal v4.0 new major version”，package.json 中依赖从 ~3.7.1 批量升级到 ~4.0.1-alpha.1；源码 dif |
| rbx006 | ghiscoding/angular-slickgrid | STRUCTURAL_ONLY | Commit 主题明确为“migrate to Slickgrid-Universal v4.0 new major version”，package.json 中相关依赖从 ~3.7.1 升级到 ~4.0.1-alpha.1，源码出现 F |
| rbx007 | ghiscoding/angular-slickgrid | STRUCTURAL_ONLY | Commit 主题为“feat!: migrate to Slickgrid-Universal v4.0 new major version”，package.json 将 @slickgrid-universal/* 从 ~3.7.1  |
| rbx008 | ghiscoding/angular-slickgrid | STRUCTURAL_ONLY | 旧测试意图是点击下一页后验证第二页仅有1行选中，并校验指定行的 checkbox 为 checked；断言级 diff 仅将定位路径从 <LOCATOR_REDACTED> 改为 <LOCATOR_CHANGED>，仍保留 should(' |
| rbx009 | ghiscoding/angular-slickgrid | STRUCTURAL_ONLY | Commit 主题与说明表明本次变更是为 HeaderMenu 等菜单新增子菜单；源码改动中 grid-headermenu.component.ts 的菜单定义由 items 改为 commandItem，且依赖从 ~3.3.2 升级到  |
| rbx010 | ghiscoding/angular-slickgrid | STRUCTURAL_ONLY | 提交主题为“migrate to Slickgrid-Universal v4.0 new major version”，package.json 中 @slickgrid-universal/* 从 ~3.7.x 升级到 ~4.0.1-a |
| rbx011 | microsoft/playwright | STRUCTURAL_ONLY | Commit 主题明确为“test: use role based selectors in trace-viewer tests (#36295)”；应用源码 diff 在 metadataView.tsx 中移除 data-testid |
| rbx012 | microsoft/playwright | STRUCTURAL_ONLY | 旧测试块中定位器为 page.getByTestId('stack-trace')，断言内容 /doClick.*trace-viewer\.spec\.ts:[\d]+/ 未变；断言级测试 diff 也只把 <LOCATOR_REDACT |
| rbx013 | microsoft/playwright | STRUCTURAL_ONLY | 旧定位器为 page.locator('.window-address-bar')；应用源码 diff 中删除了 .window-address-bar，并在 browserFrame.css 新增 .browser-frame-addre |
| rbx014 | microsoft/playwright | STRUCTURAL_ONLY | 旧测试用 page.locator('.stack-trace-frame.selected') 定位选中帧，断言文本 /doClick.*trace-viewer\.spec\.ts:[\d]+/ 未变；源码将 stackTrace.ts |
| rbx015 | microsoft/playwright | STRUCTURAL_ONLY | 旧定位器为 page.getByRole('listitem')，依赖列表项角色；本次提交主题为“implement tree w/o list”，源码 diff 将 .ui-mode-list-item 改为 .ui-mode-tree- |
| rbx016 | microsoft/playwright | SUSPECTED_REGRESSION | 材料中“本次提交未改动断言级代码；旧断言保持不变”，因此不满足 EXPECTATION_CHANGE（断言目标未变）。旧定位器为 getByRole('treeitem')，但可见的应用源码 diff 只显示以下重构性改动：actionLi |
| rbx017 | microsoft/playwright | STRUCTURAL_ONLY | Commit 主题为“chore: implement tree w/o list (#33167)”，源码 diff 将 list 组件迁移为 tree 组件：CSS/类名从 .ui-mode-list-item 改为 .ui-mode- |
| rbx018 | microsoft/playwright | STRUCTURAL_ONLY | 提交主题为“implement tree w/o list”，diff 中 CSS/TSX 将 ui-mode-list-item/list-view 相关命名迁移为 ui-mode-tree-item/tree-view，并新增 tree |
| rbx019 | microsoft/playwright | STRUCTURAL_ONLY | Commit 主题为“chore: implement tree w/o list (#33167)”，应用源码将 uiModeTestListView.css 中的 .ui-mode-list-item 系列类名改为 .ui-mode-t |
| rbx020 | microsoft/playwright | SUSPECTED_REGRESSION | 旧测试块只包含 setViewportSize 与 toHaveScreenshot，未出现旧定位器 page.getByText(/Log/)；材料又明确“本次提交未改动断言级代码；旧断言保持不变”。同时源码 diff 涉及 traceU |
| rbx021 | nasa/openmct | STRUCTURAL_ONLY | 旧定位器为 page.getByRole('button', { name: 'OK' })，依赖可访问角色/名称；断言级测试 diff 明确“未改动断言级代码；旧断言保持不变”，完整旧测试块中的列表计数、展开/高亮、清空后计数等断言也未变 |
| rbx022 | nasa/openmct | STRUCTURAL_ONLY | 旧测试断言未改动，仍验证清除最近对象后的列表数量及按钮启用状态；提交源码 diff 主要是在多个组件中补充 aria-label/role（如 MenuComponent.vue 增加 :aria-label、GridView.vue 增加 |
| rbx023 | nasa/openmct | STRUCTURAL_ONLY | 测试意图仍是验证 LAD Table 编辑模式下隐藏列及重载后状态不变；断言从 page.getByRole('cell', { name: 'Timestamp', exact: true }) 改为 page.getByRole('co |
| rbx024 | nasa/openmct | STRUCTURAL_ONLY | 旧用例用 getByRole('cell', { name: 'Timestamp', exact: true }) 检查表头；新用例改为 getByRole('columnheader', { name: 'Timestamp', exa |
| rbx025 | nasa/openmct | STRUCTURAL_ONLY | 测试意图仍是验证 LAD 表编辑模式下列的显示/隐藏；断言 diff 只是把 getByRole('cell', ...) 改为 getByRole('columnheader', ...)，并将 WATCH 等锚点更新为 Limit WA |
| rbx026 | nasa/openmct | STRUCTURAL_ONLY | 测试意图仍是验证 LAD 表列在编辑配置后可见/隐藏，断言目标未变；变化是定位角色从 getByRole('cell') 迁移为 getByRole('columnheader')，且应用源码在 LadTable.vue 中给表头 th 增 |
| rbx027 | nasa/openmct | STRUCTURAL_ONLY | 旧定位器使用文案锚点 name: 'OK'；应用源码 FormProperties.vue 将默认提交按钮文案从 'OK' 改为 'Ok'，ImageExporter.js 也将按钮 label 从 'OK' 改为 'Ok'，且 Commi |
| rbx028 | nasa/openmct | STRUCTURAL_ONLY | 旧测试块标题仍为 'in edit mode, LAD Tables provide ability to hide columns'，断言仍验证 Timestamp 等列的 visible/hidden；测试 diff 仅将 getByR |
| rbx029 | nasa/openmct | STRUCTURAL_ONLY | 旧定位器为 getByRole('cell', { name: 'Type' })，断言级 diff 中仅将其改为 getByRole('cell', { name: 'Type', exact: true })，即定位锚点精确化；测试块仍 |
| rbx030 | nasa/openmct | STRUCTURAL_ONLY | 旧定位器为 getByRole('cell', { name: 'Timestamp' })，断言级 diff 仅将其改为 getByRole('cell', { name: 'Timestamp', exact: true })，同类改动 |
| rbx031 | tryghost/koenig | STRUCTURAL_ONLY | 旧定位器是 '[data-kg-card-toolbar="html"] [aria-label="Visibility"]'，旧测试验证工具栏中 Visibility 图标可见；Commit 说明明确写有“Moved HTML card  |
| rbx032 | tryghost/koenig | STRUCTURAL_ONLY | 材料中 Commit 主题为“Migration to playwright (#647)”，说明“Migration from vitest to playwright runner for e2e tests”；断言级 diff 显示  |
| rbx033 | tryghost/koenig | STRUCTURAL_ONLY | 旧测试仍验证同一业务目标：通过 /snippet 菜单插入 snippet 后 embed card 数量为 2；测试 diff 仅把等待任意 selected 菜单项的定位器改为等待带 hasText 'snippet' 的菜单项可见。C |
| rbx034 | tryghost/koenig | STRUCTURAL_ONLY | 旧测试等待的是任意已选中菜单项 `[data-kg-cardmenu-selected="true"]`；Commit 说明明确这是“snippet menu race condition”，修复方式是“waiting for the co |
| rbx035 | tryghost/koenig | STRUCTURAL_ONLY | 旧测试意图仍是上传图片并断言 markdown 内容写入；源码 diff 只改 spellcheck 菜单 className（'fa fa-check active'→'fa fa-check'）并新增 codemirror.setOpt |
| rbx036 | tryghost/koenig | STRUCTURAL_ONLY | Commit 主题为“Fix three flaky E2E tests”，说明中明确“product-card 'can add snippet': wait for the specific snippet menu item to b |
| rbx037 | tryghost/koenig | STRUCTURAL_ONLY | Commit 主题为“Reworked signup card background image selection”，源码 SettingsPanel.jsx 中 MediaUploadSetting 的 data-testid 由 "c |
| rbx038 | tryghost/koenig | STRUCTURAL_ONLY | 旧定位器是 `[data-testid="media-upload-filled"] img`，对应断言仍是 `toHaveAttribute('src', /blob:/)`；测试 diff 中仅把该定位器从 `<LOCATOR_REDA |
| rbx039 | tryghost/koenig | STRUCTURAL_ONLY | Commit 主题为“Switched all nested editor styles to use @apply (#834)”，源码 diff 显示多处 class 重命名，如 'koenig-lexical-header-headi |
| rbx040 | tryghost/koenig | STRUCTURAL_ONLY | 旧测试块仍然围绕 custom thumbnail 的上传、替换和删除流程，断言目标（settings-panel 可见、空缩略图占位可见、custom-thumbnail-filled 可见、删除后占位再次可见）未变；Commit 说明包 |
