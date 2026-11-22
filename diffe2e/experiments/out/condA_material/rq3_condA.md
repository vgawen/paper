# RQ3 条件 A 材料（近似原第一列信息条件）

> old_locator + 旧测试行 + commit 说明 + 应用改动文件列表 + 未遮蔽断言级 diff + new_locator；不含完整 it 块、不含应用源码 diff。

---

## rb001 — ghiscoding/angular-slickgrid (cypress)

- 测试文件：`test/cypress/e2e/example01.cy.ts` 第 40 行
- 旧定位器：`cy.get('.slick-header-menu')`
- 旧测试行：`cy.get('.slick-header-menu')`
- 新定位器：`cy.get('.slick-header-menu .slick-menu-command-list')`
- Commit：feat: add sub-menus to all Menu extensions/plugins - latest Slickgrid-Universal version brings sub-menus to all these extensions: CellMenu, Context, HeaderMenu & GridMenu
- Commit 说明：---
   package.json                                  |  26 +-
   .../examples/grid-contextmenu.component.ts    |  80 +++++-
   src/app/examples/grid-headermenu.component.ts |  49 +++-
   src/app/examples/grid-menu.component.ts       |  55 +++-
   .../angular-slickgrid/global-grid-options.ts  |   2 +-
   test/cypress/e2e/example01.cy.ts              |   6 +-
   test/cypress/e2e/example03.cy.ts              |   2 +-
   test/cypress/e2e/example05.cy.ts              |   2 +-
   test/cypress/e2e/example06.cy.ts              |  26 +-
   test/cypress/e2e/example07.cy.ts              |   4 +-
   test/cypress/e2e/example08.cy.ts              |  68 ++++-
   test/cypress/e2e/example09.cy.ts              | 160 ++++++++++-
   test/cypress/e2e/example12.cy.ts              |   2 +-
   test/cypress/e2e/example16.cy.ts              |  10 +-
   test/cypress/e2e/example17.cy.ts              |   8 +-
   test/cypress/e2e/example20.cy.ts              |   2 +-
   test/cypress/e2e/example21.cy.ts              |   4 +-
   test/cypress/e2e/example26.cy.ts              | 252 +++++++++++++++++-
   test/cypress/e2e/example31.cy.ts              |   2 +-
   test/cypress/package.json                     |   2 +-
   test/cypress/yarn.lock                        |   8 +-
   yarn.lock                                     | 196 +++++++-------
   22 files changed, 780 insertions(+), 186 deletions(-)
- 应用源码改动文件（6）：package.json, src/app/examples/grid-contextmenu.component.ts, src/app/examples/grid-headermenu.component.ts, src/app/examples/grid-menu.component.ts, src/app/modules/angular-slickgrid/global-grid-options.ts, yarn.lock

### 断言级测试 diff（未遮蔽）

> 断言增删：+0 / -0；来源：compare_cache。

```diff
（包含该定位器的 hunk 内未改动断言级代码。）
```

---
## rb002 — ghiscoding/angular-slickgrid (cypress)

- 测试文件：`test/cypress/e2e/example03.cy.ts` 第 47 行
- 旧定位器：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`)`
- 旧测试行：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2').click();`
- 新定位器：`cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)`)`
- Commit：feat!: migrate to Slickgrid-Universal v4.0 new major version
- Commit 说明：---
   angular.json                                  |   4 +-
   cypress/downloads/downloads.htm               | Bin 3844 -> 5087 bytes
   package.json                                  |  26 +-
   src/app/examples/custom-inputEditor.ts        |   7 +-
   src/app/examples/grid-additem.component.ts    |   3 +-
   src/app/examples/grid-angular.component.ts    |   7 +-
   .../grid-composite-editor.component.ts        |  13 +-
   src/app/examples/grid-editor.component.ts     |  13 +-
   src/app/examples/grid-frozen.component.ts     |   6 +-
   .../examples/grid-headerbutton.component.ts   |   2 +-
   src/app/examples/grid-remote.component.ts     |   4 +-
   .../grid-resize-by-content.component.ts       |  19 +-
   src/app/examples/grid-rowdetail.component.ts  |   6 +-
   src/app/examples/grid-rowmove.component.ts    |  10 +-
   src/app/examples/grid-trading.component.ts    |  11 +-
   .../grid-tree-data-hierarchical.component.ts  |   3 +-
   .../angular-slickgrid.component.spec.ts       | 168 +++++--------
   .../components/angular-slickgrid.component.ts |  78 +++---
   .../extensions/__tests__/index.spec.ts        |  11 -
   .../__tests__/slickRowDetailView.spec.ts      | 115 ++++-----
   .../extensions/slickRowDetailView.ts          |  16 +-
   .../angular-slickgrid/global-grid-options.ts  |   1 -
   .../modules/angular-slickgrid/index.spec.ts   |  16 --
   .../models/gridOption.interface.ts            |   4 +-
   .../services/__tests__/utilities.spec.ts      |   1 +
   test/cypress/e2e/example03.cy.ts              | 114 ++++-----
   test/cypress/e2e/example05.cy.ts              |   2 +-
   test/cypress/e2e/example14.cy.ts              |  50 ++--
   test/cypress/e2e/example15.cy.ts              |  60 ++---
   test/cypress/e2e/example16.cy.ts              |  12 +-
   test/cypress/e2e/example17.cy.ts              |  45 ++--
   test/cypress/e2e/example19.cy.ts              |  60 ++---
   test/cypress/e2e/example20.cy.ts              |  96 +++----
   test/cypress/e2e/example23.cy.ts              |  14 +-
   test/cypress/e2e/example24.cy.ts              |  30 +--
   test/cypress/e2e/example26.cy.ts              |  20 +-
   test/cypress/e2e/example27.cy.ts              | 166 ++++++------
   test/cypress/e2e/example28.cy.ts              |  38 +--
   test/cypress/e2e/example29.cy.ts              | 180 ++++++-------
   test/cypress/e2e/example30.cy.ts              | 238 +++++++++---------
   test/cypress/e2e/example31.cy.ts              |   6 +-
   test/cypress/e2e/example32.cy.ts              |  20 +-
   test/cypress/e2e/example33.cy.ts              |  24 +-
   test/cypress/support/commands.ts              |  41 +--
   test/cypress/support/drag.ts                  |  17 +-
   test/jest-global-mocks.ts                     |  10 +
   test/jest-pretest.ts                          |   6 -
   test/mockSlickEvent.ts                        |  66 +++--
   test/tsconfig.json                            |  15 +-
   tsconfig.spec.json                            |   4 +-
   yarn.lock                                     | 203 +++++++--------
   51 files changed, 994 insertions(+), 1087 deletions(-)
   delete mode 100644 src/app/modules/angular-slickgrid/extensions/__tests__/index.spec.ts
   delete mode 100644 src/app/modules/angular-slickgrid/index.spec.ts
- 应用源码改动文件（20）：angular.json, package.json, src/app/examples/custom-inputEditor.ts, src/app/examples/grid-additem.component.ts, src/app/examples/grid-angular.component.ts, src/app/examples/grid-composite-editor.component.ts, src/app/examples/grid-editor.component.ts, src/app/examples/grid-frozen.component.ts, src/app/examples/grid-headerbutton.component.ts, src/app/examples/grid-remote.component.ts, src/app/examples/grid-resize-by-content.component.ts, src/app/examples/grid-rowdetail.component.ts, src/app/examples/grid-rowmove.component.ts, src/app/examples/grid-trading.component.ts, src/app/examples/grid-tree-data-hierarchical.component.ts, src/app/modules/angular-slickgrid/components/angular-slickgrid.component.ts, src/app/modules/angular-slickgrid/extensions/slickRowDetailView.ts, src/app/modules/angular-slickgrid/global-grid-options.ts, src/app/modules/angular-slickgrid/models/gridOption.interface.ts, yarn.lock

### 断言级测试 diff（未遮蔽）

> 断言增删：+5 / -5；来源：compare_cache。

```diff
@@ -44,43 +44,43 @@ describe('Example 3 - Grid with Editors', () => {
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2').click();
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)`).should('contain', 'Task 2').click();
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2222');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(3)`).should('contain', 'Task 2222');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)`).should('contain', 'Task 2222');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(3)`).should('contain', 'Task 2222');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should('contain', '25');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(4)`).should('contain', '25');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).should('contain', '2009-01-22');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(6)`).should('contain', '2009-01-22');
```

---
## rb003 — ghiscoding/angular-slickgrid (cypress)

- 测试文件：`test/cypress/e2e/example03.cy.ts` 第 53 行
- 旧定位器：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`)`
- 旧测试行：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2').click();`
- 新定位器：`cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(3)`)`
- Commit：feat!: migrate to Slickgrid-Universal v4.0 new major version
- Commit 说明：---
   angular.json                                  |   4 +-
   cypress/downloads/downloads.htm               | Bin 3844 -> 5087 bytes
   package.json                                  |  26 +-
   src/app/examples/custom-inputEditor.ts        |   7 +-
   src/app/examples/grid-additem.component.ts    |   3 +-
   src/app/examples/grid-angular.component.ts    |   7 +-
   .../grid-composite-editor.component.ts        |  13 +-
   src/app/examples/grid-editor.component.ts     |  13 +-
   src/app/examples/grid-frozen.component.ts     |   6 +-
   .../examples/grid-headerbutton.component.ts   |   2 +-
   src/app/examples/grid-remote.component.ts     |   4 +-
   .../grid-resize-by-content.component.ts       |  19 +-
   src/app/examples/grid-rowdetail.component.ts  |   6 +-
   src/app/examples/grid-rowmove.component.ts    |  10 +-
   src/app/examples/grid-trading.component.ts    |  11 +-
   .../grid-tree-data-hierarchical.component.ts  |   3 +-
   .../angular-slickgrid.component.spec.ts       | 168 +++++--------
   .../components/angular-slickgrid.component.ts |  78 +++---
   .../extensions/__tests__/index.spec.ts        |  11 -
   .../__tests__/slickRowDetailView.spec.ts      | 115 ++++-----
   .../extensions/slickRowDetailView.ts          |  16 +-
   .../angular-slickgrid/global-grid-options.ts  |   1 -
   .../modules/angular-slickgrid/index.spec.ts   |  16 --
   .../models/gridOption.interface.ts            |   4 +-
   .../services/__tests__/utilities.spec.ts      |   1 +
   test/cypress/e2e/example03.cy.ts              | 114 ++++-----
   test/cypress/e2e/example05.cy.ts              |   2 +-
   test/cypress/e2e/example14.cy.ts              |  50 ++--
   test/cypress/e2e/example15.cy.ts              |  60 ++---
   test/cypress/e2e/example16.cy.ts              |  12 +-
   test/cypress/e2e/example17.cy.ts              |  45 ++--
   test/cypress/e2e/example19.cy.ts              |  60 ++---
   test/cypress/e2e/example20.cy.ts              |  96 +++----
   test/cypress/e2e/example23.cy.ts              |  14 +-
   test/cypress/e2e/example24.cy.ts              |  30 +--
   test/cypress/e2e/example26.cy.ts              |  20 +-
   test/cypress/e2e/example27.cy.ts              | 166 ++++++------
   test/cypress/e2e/example28.cy.ts              |  38 +--
   test/cypress/e2e/example29.cy.ts              | 180 ++++++-------
   test/cypress/e2e/example30.cy.ts              | 238 +++++++++---------
   test/cypress/e2e/example31.cy.ts              |   6 +-
   test/cypress/e2e/example32.cy.ts              |  20 +-
   test/cypress/e2e/example33.cy.ts              |  24 +-
   test/cypress/support/commands.ts              |  41 +--
   test/cypress/support/drag.ts                  |  17 +-
   test/jest-global-mocks.ts                     |  10 +
   test/jest-pretest.ts                          |   6 -
   test/mockSlickEvent.ts                        |  66 +++--
   test/tsconfig.json                            |  15 +-
   tsconfig.spec.json                            |   4 +-
   yarn.lock                                     | 203 +++++++--------
   51 files changed, 994 insertions(+), 1087 deletions(-)
   delete mode 100644 src/app/modules/angular-slickgrid/extensions/__tests__/index.spec.ts
   delete mode 100644 src/app/modules/angular-slickgrid/index.spec.ts
- 应用源码改动文件（20）：angular.json, package.json, src/app/examples/custom-inputEditor.ts, src/app/examples/grid-additem.component.ts, src/app/examples/grid-angular.component.ts, src/app/examples/grid-composite-editor.component.ts, src/app/examples/grid-editor.component.ts, src/app/examples/grid-frozen.component.ts, src/app/examples/grid-headerbutton.component.ts, src/app/examples/grid-remote.component.ts, src/app/examples/grid-resize-by-content.component.ts, src/app/examples/grid-rowdetail.component.ts, src/app/examples/grid-rowmove.component.ts, src/app/examples/grid-trading.component.ts, src/app/examples/grid-tree-data-hierarchical.component.ts, src/app/modules/angular-slickgrid/components/angular-slickgrid.component.ts, src/app/modules/angular-slickgrid/extensions/slickRowDetailView.ts, src/app/modules/angular-slickgrid/global-grid-options.ts, src/app/modules/angular-slickgrid/models/gridOption.interface.ts, yarn.lock

### 断言级测试 diff（未遮蔽）

> 断言增删：+5 / -5；来源：compare_cache。

```diff
@@ -44,43 +44,43 @@ describe('Example 3 - Grid with Editors', () => {
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2').click();
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)`).should('contain', 'Task 2').click();
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2222');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(3)`).should('contain', 'Task 2222');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)`).should('contain', 'Task 2222');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(3)`).should('contain', 'Task 2222');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should('contain', '25');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(4)`).should('contain', '25');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).should('contain', '2009-01-22');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(6)`).should('contain', '2009-01-22');
```

---
## rb004 — ghiscoding/angular-slickgrid (cypress)

- 测试文件：`test/cypress/e2e/example03.cy.ts` 第 56 行
- 旧定位器：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`)`
- 旧测试行：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).click();`
- 新定位器：`cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(4)`)`
- Commit：feat!: migrate to Slickgrid-Universal v4.0 new major version
- Commit 说明：---
   angular.json                                  |   4 +-
   cypress/downloads/downloads.htm               | Bin 3844 -> 5087 bytes
   package.json                                  |  26 +-
   src/app/examples/custom-inputEditor.ts        |   7 +-
   src/app/examples/grid-additem.component.ts    |   3 +-
   src/app/examples/grid-angular.component.ts    |   7 +-
   .../grid-composite-editor.component.ts        |  13 +-
   src/app/examples/grid-editor.component.ts     |  13 +-
   src/app/examples/grid-frozen.component.ts     |   6 +-
   .../examples/grid-headerbutton.component.ts   |   2 +-
   src/app/examples/grid-remote.component.ts     |   4 +-
   .../grid-resize-by-content.component.ts       |  19 +-
   src/app/examples/grid-rowdetail.component.ts  |   6 +-
   src/app/examples/grid-rowmove.component.ts    |  10 +-
   src/app/examples/grid-trading.component.ts    |  11 +-
   .../grid-tree-data-hierarchical.component.ts  |   3 +-
   .../angular-slickgrid.component.spec.ts       | 168 +++++--------
   .../components/angular-slickgrid.component.ts |  78 +++---
   .../extensions/__tests__/index.spec.ts        |  11 -
   .../__tests__/slickRowDetailView.spec.ts      | 115 ++++-----
   .../extensions/slickRowDetailView.ts          |  16 +-
   .../angular-slickgrid/global-grid-options.ts  |   1 -
   .../modules/angular-slickgrid/index.spec.ts   |  16 --
   .../models/gridOption.interface.ts            |   4 +-
   .../services/__tests__/utilities.spec.ts      |   1 +
   test/cypress/e2e/example03.cy.ts              | 114 ++++-----
   test/cypress/e2e/example05.cy.ts              |   2 +-
   test/cypress/e2e/example14.cy.ts              |  50 ++--
   test/cypress/e2e/example15.cy.ts              |  60 ++---
   test/cypress/e2e/example16.cy.ts              |  12 +-
   test/cypress/e2e/example17.cy.ts              |  45 ++--
   test/cypress/e2e/example19.cy.ts              |  60 ++---
   test/cypress/e2e/example20.cy.ts              |  96 +++----
   test/cypress/e2e/example23.cy.ts              |  14 +-
   test/cypress/e2e/example24.cy.ts              |  30 +--
   test/cypress/e2e/example26.cy.ts              |  20 +-
   test/cypress/e2e/example27.cy.ts              | 166 ++++++------
   test/cypress/e2e/example28.cy.ts              |  38 +--
   test/cypress/e2e/example29.cy.ts              | 180 ++++++-------
   test/cypress/e2e/example30.cy.ts              | 238 +++++++++---------
   test/cypress/e2e/example31.cy.ts              |   6 +-
   test/cypress/e2e/example32.cy.ts              |  20 +-
   test/cypress/e2e/example33.cy.ts              |  24 +-
   test/cypress/support/commands.ts              |  41 +--
   test/cypress/support/drag.ts                  |  17 +-
   test/jest-global-mocks.ts                     |  10 +
   test/jest-pretest.ts                          |   6 -
   test/mockSlickEvent.ts                        |  66 +++--
   test/tsconfig.json                            |  15 +-
   tsconfig.spec.json                            |   4 +-
   yarn.lock                                     | 203 +++++++--------
   51 files changed, 994 insertions(+), 1087 deletions(-)
   delete mode 100644 src/app/modules/angular-slickgrid/extensions/__tests__/index.spec.ts
   delete mode 100644 src/app/modules/angular-slickgrid/index.spec.ts
- 应用源码改动文件（20）：angular.json, package.json, src/app/examples/custom-inputEditor.ts, src/app/examples/grid-additem.component.ts, src/app/examples/grid-angular.component.ts, src/app/examples/grid-composite-editor.component.ts, src/app/examples/grid-editor.component.ts, src/app/examples/grid-frozen.component.ts, src/app/examples/grid-headerbutton.component.ts, src/app/examples/grid-remote.component.ts, src/app/examples/grid-resize-by-content.component.ts, src/app/examples/grid-rowdetail.component.ts, src/app/examples/grid-rowmove.component.ts, src/app/examples/grid-trading.component.ts, src/app/examples/grid-tree-data-hierarchical.component.ts, src/app/modules/angular-slickgrid/components/angular-slickgrid.component.ts, src/app/modules/angular-slickgrid/extensions/slickRowDetailView.ts, src/app/modules/angular-slickgrid/global-grid-options.ts, src/app/modules/angular-slickgrid/models/gridOption.interface.ts, yarn.lock

### 断言级测试 diff（未遮蔽）

> 断言增删：+5 / -5；来源：compare_cache。

```diff
@@ -44,43 +44,43 @@ describe('Example 3 - Grid with Editors', () => {
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2').click();
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)`).should('contain', 'Task 2').click();
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2222');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(3)`).should('contain', 'Task 2222');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)`).should('contain', 'Task 2222');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(3)`).should('contain', 'Task 2222');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should('contain', '25');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(4)`).should('contain', '25');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).should('contain', '2009-01-22');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(6)`).should('contain', '2009-01-22');
```

---
## rb005 — ghiscoding/angular-slickgrid (cypress)

- 测试文件：`test/cypress/e2e/example03.cy.ts` 第 60 行
- 旧定位器：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`)`
- 旧测试行：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should('contain', '25');`
- 新定位器：`cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(4)`)`
- Commit：feat!: migrate to Slickgrid-Universal v4.0 new major version
- Commit 说明：---
   angular.json                                  |   4 +-
   cypress/downloads/downloads.htm               | Bin 3844 -> 5087 bytes
   package.json                                  |  26 +-
   src/app/examples/custom-inputEditor.ts        |   7 +-
   src/app/examples/grid-additem.component.ts    |   3 +-
   src/app/examples/grid-angular.component.ts    |   7 +-
   .../grid-composite-editor.component.ts        |  13 +-
   src/app/examples/grid-editor.component.ts     |  13 +-
   src/app/examples/grid-frozen.component.ts     |   6 +-
   .../examples/grid-headerbutton.component.ts   |   2 +-
   src/app/examples/grid-remote.component.ts     |   4 +-
   .../grid-resize-by-content.component.ts       |  19 +-
   src/app/examples/grid-rowdetail.component.ts  |   6 +-
   src/app/examples/grid-rowmove.component.ts    |  10 +-
   src/app/examples/grid-trading.component.ts    |  11 +-
   .../grid-tree-data-hierarchical.component.ts  |   3 +-
   .../angular-slickgrid.component.spec.ts       | 168 +++++--------
   .../components/angular-slickgrid.component.ts |  78 +++---
   .../extensions/__tests__/index.spec.ts        |  11 -
   .../__tests__/slickRowDetailView.spec.ts      | 115 ++++-----
   .../extensions/slickRowDetailView.ts          |  16 +-
   .../angular-slickgrid/global-grid-options.ts  |   1 -
   .../modules/angular-slickgrid/index.spec.ts   |  16 --
   .../models/gridOption.interface.ts            |   4 +-
   .../services/__tests__/utilities.spec.ts      |   1 +
   test/cypress/e2e/example03.cy.ts              | 114 ++++-----
   test/cypress/e2e/example05.cy.ts              |   2 +-
   test/cypress/e2e/example14.cy.ts              |  50 ++--
   test/cypress/e2e/example15.cy.ts              |  60 ++---
   test/cypress/e2e/example16.cy.ts              |  12 +-
   test/cypress/e2e/example17.cy.ts              |  45 ++--
   test/cypress/e2e/example19.cy.ts              |  60 ++---
   test/cypress/e2e/example20.cy.ts              |  96 +++----
   test/cypress/e2e/example23.cy.ts              |  14 +-
   test/cypress/e2e/example24.cy.ts              |  30 +--
   test/cypress/e2e/example26.cy.ts              |  20 +-
   test/cypress/e2e/example27.cy.ts              | 166 ++++++------
   test/cypress/e2e/example28.cy.ts              |  38 +--
   test/cypress/e2e/example29.cy.ts              | 180 ++++++-------
   test/cypress/e2e/example30.cy.ts              | 238 +++++++++---------
   test/cypress/e2e/example31.cy.ts              |   6 +-
   test/cypress/e2e/example32.cy.ts              |  20 +-
   test/cypress/e2e/example33.cy.ts              |  24 +-
   test/cypress/support/commands.ts              |  41 +--
   test/cypress/support/drag.ts                  |  17 +-
   test/jest-global-mocks.ts                     |  10 +
   test/jest-pretest.ts                          |   6 -
   test/mockSlickEvent.ts                        |  66 +++--
   test/tsconfig.json                            |  15 +-
   tsconfig.spec.json                            |   4 +-
   yarn.lock                                     | 203 +++++++--------
   51 files changed, 994 insertions(+), 1087 deletions(-)
   delete mode 100644 src/app/modules/angular-slickgrid/extensions/__tests__/index.spec.ts
   delete mode 100644 src/app/modules/angular-slickgrid/index.spec.ts
- 应用源码改动文件（20）：angular.json, package.json, src/app/examples/custom-inputEditor.ts, src/app/examples/grid-additem.component.ts, src/app/examples/grid-angular.component.ts, src/app/examples/grid-composite-editor.component.ts, src/app/examples/grid-editor.component.ts, src/app/examples/grid-frozen.component.ts, src/app/examples/grid-headerbutton.component.ts, src/app/examples/grid-remote.component.ts, src/app/examples/grid-resize-by-content.component.ts, src/app/examples/grid-rowdetail.component.ts, src/app/examples/grid-rowmove.component.ts, src/app/examples/grid-trading.component.ts, src/app/examples/grid-tree-data-hierarchical.component.ts, src/app/modules/angular-slickgrid/components/angular-slickgrid.component.ts, src/app/modules/angular-slickgrid/extensions/slickRowDetailView.ts, src/app/modules/angular-slickgrid/global-grid-options.ts, src/app/modules/angular-slickgrid/models/gridOption.interface.ts, yarn.lock

### 断言级测试 diff（未遮蔽）

> 断言增删：+5 / -5；来源：compare_cache。

```diff
@@ -44,43 +44,43 @@ describe('Example 3 - Grid with Editors', () => {
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2').click();
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)`).should('contain', 'Task 2').click();
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2222');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(3)`).should('contain', 'Task 2222');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)`).should('contain', 'Task 2222');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(3)`).should('contain', 'Task 2222');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should('contain', '25');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(4)`).should('contain', '25');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).should('contain', '2009-01-22');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(6)`).should('contain', '2009-01-22');
```

---
## rb006 — ghiscoding/angular-slickgrid (cypress)

- 测试文件：`test/cypress/e2e/example03.cy.ts` 第 63 行
- 旧定位器：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(5)`)`
- 旧测试行：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(5)`).click();`
- 新定位器：`cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(5)`)`
- Commit：feat!: migrate to Slickgrid-Universal v4.0 new major version
- Commit 说明：---
   angular.json                                  |   4 +-
   cypress/downloads/downloads.htm               | Bin 3844 -> 5087 bytes
   package.json                                  |  26 +-
   src/app/examples/custom-inputEditor.ts        |   7 +-
   src/app/examples/grid-additem.component.ts    |   3 +-
   src/app/examples/grid-angular.component.ts    |   7 +-
   .../grid-composite-editor.component.ts        |  13 +-
   src/app/examples/grid-editor.component.ts     |  13 +-
   src/app/examples/grid-frozen.component.ts     |   6 +-
   .../examples/grid-headerbutton.component.ts   |   2 +-
   src/app/examples/grid-remote.component.ts     |   4 +-
   .../grid-resize-by-content.component.ts       |  19 +-
   src/app/examples/grid-rowdetail.component.ts  |   6 +-
   src/app/examples/grid-rowmove.component.ts    |  10 +-
   src/app/examples/grid-trading.component.ts    |  11 +-
   .../grid-tree-data-hierarchical.component.ts  |   3 +-
   .../angular-slickgrid.component.spec.ts       | 168 +++++--------
   .../components/angular-slickgrid.component.ts |  78 +++---
   .../extensions/__tests__/index.spec.ts        |  11 -
   .../__tests__/slickRowDetailView.spec.ts      | 115 ++++-----
   .../extensions/slickRowDetailView.ts          |  16 +-
   .../angular-slickgrid/global-grid-options.ts  |   1 -
   .../modules/angular-slickgrid/index.spec.ts   |  16 --
   .../models/gridOption.interface.ts            |   4 +-
   .../services/__tests__/utilities.spec.ts      |   1 +
   test/cypress/e2e/example03.cy.ts              | 114 ++++-----
   test/cypress/e2e/example05.cy.ts              |   2 +-
   test/cypress/e2e/example14.cy.ts              |  50 ++--
   test/cypress/e2e/example15.cy.ts              |  60 ++---
   test/cypress/e2e/example16.cy.ts              |  12 +-
   test/cypress/e2e/example17.cy.ts              |  45 ++--
   test/cypress/e2e/example19.cy.ts              |  60 ++---
   test/cypress/e2e/example20.cy.ts              |  96 +++----
   test/cypress/e2e/example23.cy.ts              |  14 +-
   test/cypress/e2e/example24.cy.ts              |  30 +--
   test/cypress/e2e/example26.cy.ts              |  20 +-
   test/cypress/e2e/example27.cy.ts              | 166 ++++++------
   test/cypress/e2e/example28.cy.ts              |  38 +--
   test/cypress/e2e/example29.cy.ts              | 180 ++++++-------
   test/cypress/e2e/example30.cy.ts              | 238 +++++++++---------
   test/cypress/e2e/example31.cy.ts              |   6 +-
   test/cypress/e2e/example32.cy.ts              |  20 +-
   test/cypress/e2e/example33.cy.ts              |  24 +-
   test/cypress/support/commands.ts              |  41 +--
   test/cypress/support/drag.ts                  |  17 +-
   test/jest-global-mocks.ts                     |  10 +
   test/jest-pretest.ts                          |   6 -
   test/mockSlickEvent.ts                        |  66 +++--
   test/tsconfig.json                            |  15 +-
   tsconfig.spec.json                            |   4 +-
   yarn.lock                                     | 203 +++++++--------
   51 files changed, 994 insertions(+), 1087 deletions(-)
   delete mode 100644 src/app/modules/angular-slickgrid/extensions/__tests__/index.spec.ts
   delete mode 100644 src/app/modules/angular-slickgrid/index.spec.ts
- 应用源码改动文件（20）：angular.json, package.json, src/app/examples/custom-inputEditor.ts, src/app/examples/grid-additem.component.ts, src/app/examples/grid-angular.component.ts, src/app/examples/grid-composite-editor.component.ts, src/app/examples/grid-editor.component.ts, src/app/examples/grid-frozen.component.ts, src/app/examples/grid-headerbutton.component.ts, src/app/examples/grid-remote.component.ts, src/app/examples/grid-resize-by-content.component.ts, src/app/examples/grid-rowdetail.component.ts, src/app/examples/grid-rowmove.component.ts, src/app/examples/grid-trading.component.ts, src/app/examples/grid-tree-data-hierarchical.component.ts, src/app/modules/angular-slickgrid/components/angular-slickgrid.component.ts, src/app/modules/angular-slickgrid/extensions/slickRowDetailView.ts, src/app/modules/angular-slickgrid/global-grid-options.ts, src/app/modules/angular-slickgrid/models/gridOption.interface.ts, yarn.lock

### 断言级测试 diff（未遮蔽）

> 断言增删：+5 / -5；来源：compare_cache。

```diff
@@ -44,43 +44,43 @@ describe('Example 3 - Grid with Editors', () => {
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2').click();
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)`).should('contain', 'Task 2').click();
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2222');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(3)`).should('contain', 'Task 2222');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)`).should('contain', 'Task 2222');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(3)`).should('contain', 'Task 2222');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should('contain', '25');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(4)`).should('contain', '25');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).should('contain', '2009-01-22');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(6)`).should('contain', '2009-01-22');
```

---
## rb007 — ghiscoding/angular-slickgrid (cypress)

- 测试文件：`test/cypress/e2e/example03.cy.ts` 第 69 行
- 旧定位器：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`)`
- 旧测试行：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).click();`
- 新定位器：`cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(6)`)`
- Commit：feat!: migrate to Slickgrid-Universal v4.0 new major version
- Commit 说明：---
   angular.json                                  |   4 +-
   cypress/downloads/downloads.htm               | Bin 3844 -> 5087 bytes
   package.json                                  |  26 +-
   src/app/examples/custom-inputEditor.ts        |   7 +-
   src/app/examples/grid-additem.component.ts    |   3 +-
   src/app/examples/grid-angular.component.ts    |   7 +-
   .../grid-composite-editor.component.ts        |  13 +-
   src/app/examples/grid-editor.component.ts     |  13 +-
   src/app/examples/grid-frozen.component.ts     |   6 +-
   .../examples/grid-headerbutton.component.ts   |   2 +-
   src/app/examples/grid-remote.component.ts     |   4 +-
   .../grid-resize-by-content.component.ts       |  19 +-
   src/app/examples/grid-rowdetail.component.ts  |   6 +-
   src/app/examples/grid-rowmove.component.ts    |  10 +-
   src/app/examples/grid-trading.component.ts    |  11 +-
   .../grid-tree-data-hierarchical.component.ts  |   3 +-
   .../angular-slickgrid.component.spec.ts       | 168 +++++--------
   .../components/angular-slickgrid.component.ts |  78 +++---
   .../extensions/__tests__/index.spec.ts        |  11 -
   .../__tests__/slickRowDetailView.spec.ts      | 115 ++++-----
   .../extensions/slickRowDetailView.ts          |  16 +-
   .../angular-slickgrid/global-grid-options.ts  |   1 -
   .../modules/angular-slickgrid/index.spec.ts   |  16 --
   .../models/gridOption.interface.ts            |   4 +-
   .../services/__tests__/utilities.spec.ts      |   1 +
   test/cypress/e2e/example03.cy.ts              | 114 ++++-----
   test/cypress/e2e/example05.cy.ts              |   2 +-
   test/cypress/e2e/example14.cy.ts              |  50 ++--
   test/cypress/e2e/example15.cy.ts              |  60 ++---
   test/cypress/e2e/example16.cy.ts              |  12 +-
   test/cypress/e2e/example17.cy.ts              |  45 ++--
   test/cypress/e2e/example19.cy.ts              |  60 ++---
   test/cypress/e2e/example20.cy.ts              |  96 +++----
   test/cypress/e2e/example23.cy.ts              |  14 +-
   test/cypress/e2e/example24.cy.ts              |  30 +--
   test/cypress/e2e/example26.cy.ts              |  20 +-
   test/cypress/e2e/example27.cy.ts              | 166 ++++++------
   test/cypress/e2e/example28.cy.ts              |  38 +--
   test/cypress/e2e/example29.cy.ts              | 180 ++++++-------
   test/cypress/e2e/example30.cy.ts              | 238 +++++++++---------
   test/cypress/e2e/example31.cy.ts              |   6 +-
   test/cypress/e2e/example32.cy.ts              |  20 +-
   test/cypress/e2e/example33.cy.ts              |  24 +-
   test/cypress/support/commands.ts              |  41 +--
   test/cypress/support/drag.ts                  |  17 +-
   test/jest-global-mocks.ts                     |  10 +
   test/jest-pretest.ts                          |   6 -
   test/mockSlickEvent.ts                        |  66 +++--
   test/tsconfig.json                            |  15 +-
   tsconfig.spec.json                            |   4 +-
   yarn.lock                                     | 203 +++++++--------
   51 files changed, 994 insertions(+), 1087 deletions(-)
   delete mode 100644 src/app/modules/angular-slickgrid/extensions/__tests__/index.spec.ts
   delete mode 100644 src/app/modules/angular-slickgrid/index.spec.ts
- 应用源码改动文件（20）：angular.json, package.json, src/app/examples/custom-inputEditor.ts, src/app/examples/grid-additem.component.ts, src/app/examples/grid-angular.component.ts, src/app/examples/grid-composite-editor.component.ts, src/app/examples/grid-editor.component.ts, src/app/examples/grid-frozen.component.ts, src/app/examples/grid-headerbutton.component.ts, src/app/examples/grid-remote.component.ts, src/app/examples/grid-resize-by-content.component.ts, src/app/examples/grid-rowdetail.component.ts, src/app/examples/grid-rowmove.component.ts, src/app/examples/grid-trading.component.ts, src/app/examples/grid-tree-data-hierarchical.component.ts, src/app/modules/angular-slickgrid/components/angular-slickgrid.component.ts, src/app/modules/angular-slickgrid/extensions/slickRowDetailView.ts, src/app/modules/angular-slickgrid/global-grid-options.ts, src/app/modules/angular-slickgrid/models/gridOption.interface.ts, yarn.lock

### 断言级测试 diff（未遮蔽）

> 断言增删：+5 / -5；来源：compare_cache。

```diff
@@ -44,43 +44,43 @@ describe('Example 3 - Grid with Editors', () => {
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2').click();
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)`).should('contain', 'Task 2').click();
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2222');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(3)`).should('contain', 'Task 2222');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)`).should('contain', 'Task 2222');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(3)`).should('contain', 'Task 2222');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should('contain', '25');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(4)`).should('contain', '25');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).should('contain', '2009-01-22');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(6)`).should('contain', '2009-01-22');
```

---
## rb008 — ghiscoding/angular-slickgrid (cypress)

- 测试文件：`test/cypress/e2e/example03.cy.ts` 第 74 行
- 旧定位器：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`)`
- 旧测试行：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).should('contain', '2009-01-22');`
- 新定位器：`cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(6)`)`
- Commit：feat!: migrate to Slickgrid-Universal v4.0 new major version
- Commit 说明：---
   angular.json                                  |   4 +-
   cypress/downloads/downloads.htm               | Bin 3844 -> 5087 bytes
   package.json                                  |  26 +-
   src/app/examples/custom-inputEditor.ts        |   7 +-
   src/app/examples/grid-additem.component.ts    |   3 +-
   src/app/examples/grid-angular.component.ts    |   7 +-
   .../grid-composite-editor.component.ts        |  13 +-
   src/app/examples/grid-editor.component.ts     |  13 +-
   src/app/examples/grid-frozen.component.ts     |   6 +-
   .../examples/grid-headerbutton.component.ts   |   2 +-
   src/app/examples/grid-remote.component.ts     |   4 +-
   .../grid-resize-by-content.component.ts       |  19 +-
   src/app/examples/grid-rowdetail.component.ts  |   6 +-
   src/app/examples/grid-rowmove.component.ts    |  10 +-
   src/app/examples/grid-trading.component.ts    |  11 +-
   .../grid-tree-data-hierarchical.component.ts  |   3 +-
   .../angular-slickgrid.component.spec.ts       | 168 +++++--------
   .../components/angular-slickgrid.component.ts |  78 +++---
   .../extensions/__tests__/index.spec.ts        |  11 -
   .../__tests__/slickRowDetailView.spec.ts      | 115 ++++-----
   .../extensions/slickRowDetailView.ts          |  16 +-
   .../angular-slickgrid/global-grid-options.ts  |   1 -
   .../modules/angular-slickgrid/index.spec.ts   |  16 --
   .../models/gridOption.interface.ts            |   4 +-
   .../services/__tests__/utilities.spec.ts      |   1 +
   test/cypress/e2e/example03.cy.ts              | 114 ++++-----
   test/cypress/e2e/example05.cy.ts              |   2 +-
   test/cypress/e2e/example14.cy.ts              |  50 ++--
   test/cypress/e2e/example15.cy.ts              |  60 ++---
   test/cypress/e2e/example16.cy.ts              |  12 +-
   test/cypress/e2e/example17.cy.ts              |  45 ++--
   test/cypress/e2e/example19.cy.ts              |  60 ++---
   test/cypress/e2e/example20.cy.ts              |  96 +++----
   test/cypress/e2e/example23.cy.ts              |  14 +-
   test/cypress/e2e/example24.cy.ts              |  30 +--
   test/cypress/e2e/example26.cy.ts              |  20 +-
   test/cypress/e2e/example27.cy.ts              | 166 ++++++------
   test/cypress/e2e/example28.cy.ts              |  38 +--
   test/cypress/e2e/example29.cy.ts              | 180 ++++++-------
   test/cypress/e2e/example30.cy.ts              | 238 +++++++++---------
   test/cypress/e2e/example31.cy.ts              |   6 +-
   test/cypress/e2e/example32.cy.ts              |  20 +-
   test/cypress/e2e/example33.cy.ts              |  24 +-
   test/cypress/support/commands.ts              |  41 +--
   test/cypress/support/drag.ts                  |  17 +-
   test/jest-global-mocks.ts                     |  10 +
   test/jest-pretest.ts                          |   6 -
   test/mockSlickEvent.ts                        |  66 +++--
   test/tsconfig.json                            |  15 +-
   tsconfig.spec.json                            |   4 +-
   yarn.lock                                     | 203 +++++++--------
   51 files changed, 994 insertions(+), 1087 deletions(-)
   delete mode 100644 src/app/modules/angular-slickgrid/extensions/__tests__/index.spec.ts
   delete mode 100644 src/app/modules/angular-slickgrid/index.spec.ts
- 应用源码改动文件（20）：angular.json, package.json, src/app/examples/custom-inputEditor.ts, src/app/examples/grid-additem.component.ts, src/app/examples/grid-angular.component.ts, src/app/examples/grid-composite-editor.component.ts, src/app/examples/grid-editor.component.ts, src/app/examples/grid-frozen.component.ts, src/app/examples/grid-headerbutton.component.ts, src/app/examples/grid-remote.component.ts, src/app/examples/grid-resize-by-content.component.ts, src/app/examples/grid-rowdetail.component.ts, src/app/examples/grid-rowmove.component.ts, src/app/examples/grid-trading.component.ts, src/app/examples/grid-tree-data-hierarchical.component.ts, src/app/modules/angular-slickgrid/components/angular-slickgrid.component.ts, src/app/modules/angular-slickgrid/extensions/slickRowDetailView.ts, src/app/modules/angular-slickgrid/global-grid-options.ts, src/app/modules/angular-slickgrid/models/gridOption.interface.ts, yarn.lock

### 断言级测试 diff（未遮蔽）

> 断言增删：+5 / -5；来源：compare_cache。

```diff
@@ -44,43 +44,43 @@ describe('Example 3 - Grid with Editors', () => {
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2').click();
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)`).should('contain', 'Task 2').click();
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2222');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(3)`).should('contain', 'Task 2222');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)`).should('contain', 'Task 2222');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(3)`).should('contain', 'Task 2222');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should('contain', '25');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(4)`).should('contain', '25');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).should('contain', '2009-01-22');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(6)`).should('contain', '2009-01-22');
```

---
## rb009 — ghiscoding/angular-slickgrid (cypress)

- 测试文件：`test/cypress/e2e/example30.cy.ts` 第 366 行
- 旧定位器：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(3)`)`
- 旧测试行：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(3)`).click();`
- 新定位器：`cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(3)`)`
- Commit：feat!: migrate to Slickgrid-Universal v4.0 new major version
- Commit 说明：---
   angular.json                                  |   4 +-
   cypress/downloads/downloads.htm               | Bin 3844 -> 5087 bytes
   package.json                                  |  26 +-
   src/app/examples/custom-inputEditor.ts        |   7 +-
   src/app/examples/grid-additem.component.ts    |   3 +-
   src/app/examples/grid-angular.component.ts    |   7 +-
   .../grid-composite-editor.component.ts        |  13 +-
   src/app/examples/grid-editor.component.ts     |  13 +-
   src/app/examples/grid-frozen.component.ts     |   6 +-
   .../examples/grid-headerbutton.component.ts   |   2 +-
   src/app/examples/grid-remote.component.ts     |   4 +-
   .../grid-resize-by-content.component.ts       |  19 +-
   src/app/examples/grid-rowdetail.component.ts  |   6 +-
   src/app/examples/grid-rowmove.component.ts    |  10 +-
   src/app/examples/grid-trading.component.ts    |  11 +-
   .../grid-tree-data-hierarchical.component.ts  |   3 +-
   .../angular-slickgrid.component.spec.ts       | 168 +++++--------
   .../components/angular-slickgrid.component.ts |  78 +++---
   .../extensions/__tests__/index.spec.ts        |  11 -
   .../__tests__/slickRowDetailView.spec.ts      | 115 ++++-----
   .../extensions/slickRowDetailView.ts          |  16 +-
   .../angular-slickgrid/global-grid-options.ts  |   1 -
   .../modules/angular-slickgrid/index.spec.ts   |  16 --
   .../models/gridOption.interface.ts            |   4 +-
   .../services/__tests__/utilities.spec.ts      |   1 +
   test/cypress/e2e/example03.cy.ts              | 114 ++++-----
   test/cypress/e2e/example05.cy.ts              |   2 +-
   test/cypress/e2e/example14.cy.ts              |  50 ++--
   test/cypress/e2e/example15.cy.ts              |  60 ++---
   test/cypress/e2e/example16.cy.ts              |  12 +-
   test/cypress/e2e/example17.cy.ts              |  45 ++--
   test/cypress/e2e/example19.cy.ts              |  60 ++---
   test/cypress/e2e/example20.cy.ts              |  96 +++----
   test/cypress/e2e/example23.cy.ts              |  14 +-
   test/cypress/e2e/example24.cy.ts              |  30 +--
   test/cypress/e2e/example26.cy.ts              |  20 +-
   test/cypress/e2e/example27.cy.ts              | 166 ++++++------
   test/cypress/e2e/example28.cy.ts              |  38 +--
   test/cypress/e2e/example29.cy.ts              | 180 ++++++-------
   test/cypress/e2e/example30.cy.ts              | 238 +++++++++---------
   test/cypress/e2e/example31.cy.ts              |   6 +-
   test/cypress/e2e/example32.cy.ts              |  20 +-
   test/cypress/e2e/example33.cy.ts              |  24 +-
   test/cypress/support/commands.ts              |  41 +--
   test/cypress/support/drag.ts                  |  17 +-
   test/jest-global-mocks.ts                     |  10 +
   test/jest-pretest.ts                          |   6 -
   test/mockSlickEvent.ts                        |  66 +++--
   test/tsconfig.json                            |  15 +-
   tsconfig.spec.json                            |   4 +-
   yarn.lock                                     | 203 +++++++--------
   51 files changed, 994 insertions(+), 1087 deletions(-)
   delete mode 100644 src/app/modules/angular-slickgrid/extensions/__tests__/index.spec.ts
   delete mode 100644 src/app/modules/angular-slickgrid/index.spec.ts
- 应用源码改动文件（20）：angular.json, package.json, src/app/examples/custom-inputEditor.ts, src/app/examples/grid-additem.component.ts, src/app/examples/grid-angular.component.ts, src/app/examples/grid-composite-editor.component.ts, src/app/examples/grid-editor.component.ts, src/app/examples/grid-frozen.component.ts, src/app/examples/grid-headerbutton.component.ts, src/app/examples/grid-remote.component.ts, src/app/examples/grid-resize-by-content.component.ts, src/app/examples/grid-rowdetail.component.ts, src/app/examples/grid-rowmove.component.ts, src/app/examples/grid-trading.component.ts, src/app/examples/grid-tree-data-hierarchical.component.ts, src/app/modules/angular-slickgrid/components/angular-slickgrid.component.ts, src/app/modules/angular-slickgrid/extensions/slickRowDetailView.ts, src/app/modules/angular-slickgrid/global-grid-options.ts, src/app/modules/angular-slickgrid/models/gridOption.interface.ts, yarn.lock

### 断言级测试 diff（未遮蔽）

> 断言增删：+37 / -37；来源：compare_cache。

```diff
@@ -255,21 +255,21 @@ describe('Example 30  Composite Editor Modal', () => {
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', '22 days');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(4)`).should('contain', '5');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(5).editable-field`).should('have.length', 1);
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(7)`).find('.fa.fa-check.checkmark-icon').should('have.length', 1);
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(8)`).should('not.be.empty');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(9)`).should('contain', 'Tasty Granite Table');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(2)`).should('contain', '22 days');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(4)`).should('contain', '5');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(5).editable-field`).should('have.length', 1);
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(7)`).find('.fa.fa-check.checkmark-icon').should('have.length', 1);
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(8)`).should('not.be.empty');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(9)`).should('contain', 'Tasty Granite Table');
@@ -289,21 +289,21 @@ describe('Example 30  Composite Editor Modal', () => {
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', '33 days');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(4)`).should('contain', '17');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(5).editable-field`).should('have.length', 1);
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(7)`).find('.fa.fa-check.checkmark-icon').should('not.exist');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(8)`).should('be.empty');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(9)`).should('contain', 'Tasty Granite Table');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(2)`).should('contain', '33 days');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(4)`).should('contain', '17');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(5).editable-field`).should('have.length', 1);
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(7)`).find('.fa.fa-check.checkmark-icon').should('not.exist');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(8)`).should('be.empty');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(9)`).should('contain', 'Tasty Granite Table');
@@ -337,33 +337,33 @@ describe('Example 30  Composite Editor Modal', () => {
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(4)`).should('contain', '51');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(5)`).should('contain', 'Straightforward');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(7)`).find('.fa.fa-check.checkmark-icon').should('have.length', 1);
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(8)`).should('not.be.empty');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(10)`).should('contain', 'Belgium');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(4)`).should('contain', '51');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(5)`).should('contain', 'Straightforward');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(7)`).find('.fa.fa-check.checkmark-icon').should('have.length', 1);
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(8)`).should('not.be.empty');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(10)`).should('contain', 'Belgium');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should('contain', '51');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(5)`).should('contain', 'Straightforward');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(7)`).find('.fa.fa-check.checkmark-icon').should('have.length', 1);
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(8)`).should('not.be.empty');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(10)`).should('contain', 'Belgium');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(4)`).should('contain', '51');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(5)`).should('contain', 'Straightforward');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(7)`).find('.fa.fa-check.checkmark-icon').should('have.length', 1);
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(8)`).should('not.be.empty');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(10)`).should('contain', 'Belgium');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(4)`).should('contain', '51');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(5)`).should('contain', 'Straightforward');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(7)`).find('.fa.fa-check.checkmark-icon').should('have.length', 1);
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(8)`).should('not.be.empty');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(10)`).should('contain', 'Belgium');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(4)`).should('contain', '51');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(5)`).should('contain', 'Straightforward');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(7)`).find('.fa.fa-check.checkmark-icon').should('have.length', 1);
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(8)`).should('not.be.empty');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(10)`).should('contain', 'Belgium');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(4)`).should('contain', '51');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(5)`).should('contain', 'Straightforward');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(7)`).find('.fa.fa-check.checkmark-icon').should('have.length', 1);
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(8)`).should('not.be.empty');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(10)`).should('contain', 'Belgium');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 3}px;"] > .slick-cell:nth(4)`).should('contain', '51');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(5)`).should('contain', 'Straightforward');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 3}px;"] > .slick-cell:nth(7)`).find('.fa.fa-check.checkmark-icon').should('have.length', 1);
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 3}px;"] > .slick-cell:nth(8)`).should('not.be.empty');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 3}px;"] > .slick-cell:nth(10)`).should('contain', 'Belgium');
@@ -534,16 +534,16 @@ describe('Example 30  Composite Editor Modal', () => {
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', '33 days');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(4)`).should('contain', '51');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(7)`).find('.fa.fa-check.checkmark-icon').should('have.length', 1);
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(8)`).should('not.be.empty');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(10)`).should('contain', 'Belgium');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(2)`).should('contain', '33 days');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(4)`).should('contain', '51');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(7)`).find('.fa.fa-check.checkmark-icon').should('have.length', 1);
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(8)`).should('not.be.empty');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(10)`).should('contain', 'Belgium');
```

---
## rb010 — ghiscoding/angular-slickgrid (cypress)

- 测试文件：`test/cypress/e2e/example31.cy.ts` 第 97 行
- 旧定位器：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(0)`
- 旧测试行：`cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(0) input[type="checkbox"]`).should('be.checked');`
- 新定位器：`cy.get(`[style="top: ${GRID_ROW_HEIGHT * 4}px;"] > .slick-cell:nth(0)`
- Commit：feat!: migrate to Slickgrid-Universal v4.0 new major version
- Commit 说明：---
   angular.json                                  |   4 +-
   cypress/downloads/downloads.htm               | Bin 3844 -> 5087 bytes
   package.json                                  |  26 +-
   src/app/examples/custom-inputEditor.ts        |   7 +-
   src/app/examples/grid-additem.component.ts    |   3 +-
   src/app/examples/grid-angular.component.ts    |   7 +-
   .../grid-composite-editor.component.ts        |  13 +-
   src/app/examples/grid-editor.component.ts     |  13 +-
   src/app/examples/grid-frozen.component.ts     |   6 +-
   .../examples/grid-headerbutton.component.ts   |   2 +-
   src/app/examples/grid-remote.component.ts     |   4 +-
   .../grid-resize-by-content.component.ts       |  19 +-
   src/app/examples/grid-rowdetail.component.ts  |   6 +-
   src/app/examples/grid-rowmove.component.ts    |  10 +-
   src/app/examples/grid-trading.component.ts    |  11 +-
   .../grid-tree-data-hierarchical.component.ts  |   3 +-
   .../angular-slickgrid.component.spec.ts       | 168 +++++--------
   .../components/angular-slickgrid.component.ts |  78 +++---
   .../extensions/__tests__/index.spec.ts        |  11 -
   .../__tests__/slickRowDetailView.spec.ts      | 115 ++++-----
   .../extensions/slickRowDetailView.ts          |  16 +-
   .../angular-slickgrid/global-grid-options.ts  |   1 -
   .../modules/angular-slickgrid/index.spec.ts   |  16 --
   .../models/gridOption.interface.ts            |   4 +-
   .../services/__tests__/utilities.spec.ts      |   1 +
   test/cypress/e2e/example03.cy.ts              | 114 ++++-----
   test/cypress/e2e/example05.cy.ts              |   2 +-
   test/cypress/e2e/example14.cy.ts              |  50 ++--
   test/cypress/e2e/example15.cy.ts              |  60 ++---
   test/cypress/e2e/example16.cy.ts              |  12 +-
   test/cypress/e2e/example17.cy.ts              |  45 ++--
   test/cypress/e2e/example19.cy.ts              |  60 ++---
   test/cypress/e2e/example20.cy.ts              |  96 +++----
   test/cypress/e2e/example23.cy.ts              |  14 +-
   test/cypress/e2e/example24.cy.ts              |  30 +--
   test/cypress/e2e/example26.cy.ts              |  20 +-
   test/cypress/e2e/example27.cy.ts              | 166 ++++++------
   test/cypress/e2e/example28.cy.ts              |  38 +--
   test/cypress/e2e/example29.cy.ts              | 180 ++++++-------
   test/cypress/e2e/example30.cy.ts              | 238 +++++++++---------
   test/cypress/e2e/example31.cy.ts              |   6 +-
   test/cypress/e2e/example32.cy.ts              |  20 +-
   test/cypress/e2e/example33.cy.ts              |  24 +-
   test/cypress/support/commands.ts              |  41 +--
   test/cypress/support/drag.ts                  |  17 +-
   test/jest-global-mocks.ts                     |  10 +
   test/jest-pretest.ts                          |   6 -
   test/mockSlickEvent.ts                        |  66 +++--
   test/tsconfig.json                            |  15 +-
   tsconfig.spec.json                            |   4 +-
   yarn.lock                                     | 203 +++++++--------
   51 files changed, 994 insertions(+), 1087 deletions(-)
   delete mode 100644 src/app/modules/angular-slickgrid/extensions/__tests__/index.spec.ts
   delete mode 100644 src/app/modules/angular-slickgrid/index.spec.ts
- 应用源码改动文件（20）：angular.json, package.json, src/app/examples/custom-inputEditor.ts, src/app/examples/grid-additem.component.ts, src/app/examples/grid-angular.component.ts, src/app/examples/grid-composite-editor.component.ts, src/app/examples/grid-editor.component.ts, src/app/examples/grid-frozen.component.ts, src/app/examples/grid-headerbutton.component.ts, src/app/examples/grid-remote.component.ts, src/app/examples/grid-resize-by-content.component.ts, src/app/examples/grid-rowdetail.component.ts, src/app/examples/grid-rowmove.component.ts, src/app/examples/grid-trading.component.ts, src/app/examples/grid-tree-data-hierarchical.component.ts, src/app/modules/angular-slickgrid/components/angular-slickgrid.component.ts, src/app/modules/angular-slickgrid/extensions/slickRowDetailView.ts, src/app/modules/angular-slickgrid/global-grid-options.ts, src/app/modules/angular-slickgrid/models/gridOption.interface.ts, yarn.lock

### 断言级测试 diff（未遮蔽）

> 断言增删：+3 / -3；来源：compare_cache。

```diff
@@ -93,15 +93,15 @@ describe('Example 31 - Columns Resize by Content', () => {
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(0) input[type="checkbox"]`).should('be.checked');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 4}px"] > .slick-cell:nth(0) input[type="checkbox"]`).should('be.checked');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 3}px;"] > .slick-cell:nth(0) input[type="checkbox"]`).should('be.checked');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 4}px;"] > .slick-cell:nth(0) input[type="checkbox"]`).should('be.checked');
-    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(0) input[type="checkbox"]`).should('be.checked');
+    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0) input[type="checkbox"]`).should('be.checked');
```

---
## rb011 — microsoft/playwright (playwright)

- 测试文件：`tests/page/page-wait-for-navigation.spec.ts` 第 258 行
- 旧定位器：`page.$eval('iframe', frame => window.builtinSetTimeout(()`
- 旧测试行：`server.waitForRequest('/one-style.css').then(() => page.$eval('iframe', frame => window.builtinSetTimeout(() => frame.remove(), 0)))`
- 新定位器：`page.$eval('iframe', frame => window.builtins.setTimeout(()`
- Commit：chore: builtins (#35197)
- Commit 说明：---
   eslint.config.mjs                             |  22 +-
   .../src/server/bidi/bidiExecutionContext.ts   |   3 +-
   .../src/server/browserContext.ts              |   5 +-
   .../src/server/chromium/crExecutionContext.ts |   3 +-
   .../src/server/firefox/ffBrowser.ts           |   5 +-
   .../src/server/firefox/ffExecutionContext.ts  |   3 +-
   packages/playwright-core/src/server/frames.ts |   4 +-
   .../src/server/injected/ariaSnapshot.ts       |  29 +-
   .../src/server/injected/clock.ts              |  20 +-
   .../src/server/injected/highlight.ts          |   6 +-
   .../src/server/injected/injectedScript.ts     | 269 ++++++++----------
   .../server/injected/reactSelectorEngine.ts    |   7 +-
   .../injected/recorder/pollingRecorder.ts      |   6 +-
   .../src/server/injected/recorder/recorder.ts  |  19 +-
   .../src/server/injected/roleSelectorEngine.ts |  11 +-
   .../src/server/injected/roleUtils.ts          |  84 +++---
   .../src/server/injected/selectorEvaluator.ts  |  54 ++--
   .../src/server/injected/selectorGenerator.ts  |  40 +--
   .../src/server/injected/selectorUtils.ts      |   7 +-
   .../src/server/injected/utilityScript.ts      |  71 ++---
   .../src/server/injected/vueSelectorEngine.ts  |  15 +-
   .../src/server/injected/webSocketMock.ts      |   6 +-
   .../src/server/isomorphic/builtins.ts         |  67 +++++
   .../isomorphic/utilityScriptSerializers.ts    |  22 +-
   .../playwright-core/src/server/javascript.ts  |   7 +-
   packages/playwright-core/src/server/page.ts   |  78 +----
   .../playwright-core/src/server/pageBinding.ts |  92 ++++++
   .../src/server/storageScript.ts               |  15 +-
   .../src/server/webkit/wkExecutionContext.ts   |   3 +-
   tests/assets/input/handle-locator.html        |   2 +-
   tests/config/baseTest.ts                      |  10 +-
   tests/library/browsercontext-events.spec.ts   |   2 +-
   tests/library/browsertype-launch.spec.ts      |   2 +-
   tests/library/chromium/css-coverage.spec.ts   |   2 +-
   tests/library/chromium/js-coverage.spec.ts    |   6 +-
   tests/library/inspector/cli-codegen-3.spec.ts |   2 +-
   tests/library/popup.spec.ts                   |   8 +-
   tests/library/role-utils.spec.ts              |   8 +-
   tests/library/trace-viewer.spec.ts            |   4 +-
   tests/library/tracing.spec.ts                 |   6 +-
   tests/library/unit/clock.spec.ts              |   7 +-
   tests/library/video.spec.ts                   |   4 +-
   tests/page/page-click.spec.ts                 |   2 +-
   tests/page/page-close.spec.ts                 |   4 +-
   tests/page/page-dialog.spec.ts                |   2 +-
   tests/page/page-drag.spec.ts                  |   2 +-
   tests/page/page-evaluate.spec.ts              |  40 ++-
   tests/page/page-event-console.spec.ts         |   4 +-
   tests/page/page-event-pageerror.spec.ts       |  10 +-
   tests/page/page-expose-function.spec.ts       |  40 ++-
   tests/page/page-filechooser.spec.ts           |   2 +-
   tests/page/page-screenshot.spec.ts            |   4 +-
   tests/page/page-wait-for-function.spec.ts     |   4 +-
   tests/page/page-wait-for-navigation.spec.ts   |   2 +-
   tests/page/page-wait-for-request.spec.ts      |   2 +-
   tests/page/page-wait-for-response.spec.ts     |   2 +-
   tests/page/pageTest.ts                        |   2 +-
   .../ui-mode-test-output.spec.ts               |   4 +-
   58 files changed, 670 insertions(+), 492 deletions(-)
   create mode 100644 packages/playwright-core/src/server/isomorphic/builtins.ts
   create mode 100644 packages/playwright-core/src/server/pageBinding.ts
- 应用源码改动文件（29）：eslint.config.mjs, packages/playwright-core/src/server/bidi/bidiExecutionContext.ts, packages/playwright-core/src/server/browserContext.ts, packages/playwright-core/src/server/chromium/crExecutionContext.ts, packages/playwright-core/src/server/firefox/ffBrowser.ts, packages/playwright-core/src/server/firefox/ffExecutionContext.ts, packages/playwright-core/src/server/frames.ts, packages/playwright-core/src/server/injected/ariaSnapshot.ts, packages/playwright-core/src/server/injected/clock.ts, packages/playwright-core/src/server/injected/highlight.ts, packages/playwright-core/src/server/injected/injectedScript.ts, packages/playwright-core/src/server/injected/reactSelectorEngine.ts, packages/playwright-core/src/server/injected/recorder/pollingRecorder.ts, packages/playwright-core/src/server/injected/recorder/recorder.ts, packages/playwright-core/src/server/injected/roleSelectorEngine.ts, packages/playwright-core/src/server/injected/roleUtils.ts, packages/playwright-core/src/server/injected/selectorEvaluator.ts, packages/playwright-core/src/server/injected/selectorGenerator.ts, packages/playwright-core/src/server/injected/selectorUtils.ts, packages/playwright-core/src/server/injected/utilityScript.ts, packages/playwright-core/src/server/injected/vueSelectorEngine.ts, packages/playwright-core/src/server/injected/webSocketMock.ts, packages/playwright-core/src/server/isomorphic/builtins.ts, packages/playwright-core/src/server/isomorphic/utilityScriptSerializers.ts, packages/playwright-core/src/server/javascript.ts, packages/playwright-core/src/server/page.ts, packages/playwright-core/src/server/pageBinding.ts, packages/playwright-core/src/server/storageScript.ts, packages/playwright-core/src/server/webkit/wkExecutionContext.ts

### 断言级测试 diff（未遮蔽）

> 断言增删：+0 / -0；来源：compare_cache。

```diff
（包含该定位器的 hunk 内未改动断言级代码。）
```

---
## rb012 — microsoft/playwright (playwright)

- 测试文件：`tests/playwright-test/ui-mode-test-update.spec.ts` 第 218 行
- 旧定位器：`page.getByRole('treeitem')`
- 旧测试行：`const passesItemLocator = page.getByRole('treeitem').filter({ hasText: 'passes' });`
- 新定位器：`page.getByRole('treeitem', { name: 'passes' })`
- Commit：chore: implement tree w/o list (#33169)
- Commit 说明：---
   .../src/matchers/toMatchAriaSnapshot.ts       |  18 +-
   packages/trace-viewer/src/ui/actionList.tsx   |  36 ++-
   .../src/ui/uiModeTestListView.tsx             |   3 +-
   packages/web/src/components/toolbarButton.tsx |   2 +-
   packages/web/src/components/treeView.tsx      | 231 +++++++++++-------
   tests/page/to-match-aria-snapshot.spec.ts     |   8 +-
   tests/playwright-test/ui-mode-fixtures.ts     |  11 +-
   .../ui-mode-test-annotations.spec.ts          |   2 +-
   .../playwright-test/ui-mode-test-run.spec.ts  |   8 +-
   .../ui-mode-test-setup.spec.ts                |  26 +-
   .../ui-mode-test-update.spec.ts               |   2 +-
   .../ui-mode-test-watch.spec.ts                |  16 +-
   12 files changed, 221 insertions(+), 142 deletions(-)
- 应用源码改动文件（5）：packages/playwright/src/matchers/toMatchAriaSnapshot.ts, packages/trace-viewer/src/ui/actionList.tsx, packages/trace-viewer/src/ui/uiModeTestListView.tsx, packages/web/src/components/toolbarButton.tsx, packages/web/src/components/treeView.tsx

### 断言级测试 diff（未遮蔽）

> 断言增删：+0 / -0；来源：compare_cache。

```diff
（包含该定位器的 hunk 内未改动断言级代码。）
```

---
## rb013 — microsoft/playwright (playwright)

- 测试文件：`tests/playwright-test/ui-mode-test-update.spec.ts` 第 218 行
- 旧定位器：`page.getByRole('listitem')`
- 旧测试行：`const passesItemLocator = page.getByRole('listitem').filter({ hasText: 'passes' });`
- 新定位器：`page.getByRole('treeitem')`
- Commit：chore: implement tree w/o list (#33167)
- Commit 说明：---
   .../src/ui/uiModeTestListView.css             |  12 +-
   .../src/ui/uiModeTestListView.tsx             |   6 +-
   packages/web/src/components/gridView.tsx      |   3 -
   packages/web/src/components/listView.tsx      |  31 +--
   packages/web/src/components/treeView.css      |  91 +++++++
   packages/web/src/components/treeView.tsx      | 240 ++++++++++++++----
   packages/web/src/uiUtils.ts                   |   9 +
   tests/config/traceViewerFixtures.ts           |   4 +-
   tests/playwright-test/ui-mode-fixtures.ts     |  16 +-
   .../ui-mode-test-annotations.spec.ts          |   2 +-
   .../ui-mode-test-filters.spec.ts              |   2 +-
   .../ui-mode-test-progress.spec.ts             |  22 +-
   .../playwright-test/ui-mode-test-run.spec.ts  |   4 +-
   .../ui-mode-test-setup.spec.ts                |   2 +-
   .../ui-mode-test-update.spec.ts               |   4 +-
   .../ui-mode-test-watch.spec.ts                |  16 +-
   tests/playwright-test/ui-mode-trace.spec.ts   |  14 +-
   17 files changed, 339 insertions(+), 139 deletions(-)
   create mode 100644 packages/web/src/components/treeView.css
- 应用源码改动文件（7）：packages/trace-viewer/src/ui/uiModeTestListView.css, packages/trace-viewer/src/ui/uiModeTestListView.tsx, packages/web/src/components/gridView.tsx, packages/web/src/components/listView.tsx, packages/web/src/components/treeView.css, packages/web/src/components/treeView.tsx, packages/web/src/uiUtils.ts

### 断言级测试 diff（未遮蔽）

> 断言增删：+0 / -0；来源：compare_cache。

```diff
（包含该定位器的 hunk 内未改动断言级代码。）
```

---
## rb014 — microsoft/playwright (playwright)

- 测试文件：`tests/playwright-test/ui-mode-test-watch.spec.ts` 第 107 行
- 旧定位器：`page.getByRole('treeitem')`
- 旧测试行：`await page.getByRole('treeitem').filter({ hasText: 'b.test.ts' }).getByTitle('Watch').click();`
- 新定位器：`page.getByRole('treeitem', { name: 'b.test.ts' })`
- Commit：chore: implement tree w/o list (#33169)
- Commit 说明：---
   .../src/matchers/toMatchAriaSnapshot.ts       |  18 +-
   packages/trace-viewer/src/ui/actionList.tsx   |  36 ++-
   .../src/ui/uiModeTestListView.tsx             |   3 +-
   packages/web/src/components/toolbarButton.tsx |   2 +-
   packages/web/src/components/treeView.tsx      | 231 +++++++++++-------
   tests/page/to-match-aria-snapshot.spec.ts     |   8 +-
   tests/playwright-test/ui-mode-fixtures.ts     |  11 +-
   .../ui-mode-test-annotations.spec.ts          |   2 +-
   .../playwright-test/ui-mode-test-run.spec.ts  |   8 +-
   .../ui-mode-test-setup.spec.ts                |  26 +-
   .../ui-mode-test-update.spec.ts               |   2 +-
   .../ui-mode-test-watch.spec.ts                |  16 +-
   12 files changed, 221 insertions(+), 142 deletions(-)
- 应用源码改动文件（5）：packages/playwright/src/matchers/toMatchAriaSnapshot.ts, packages/trace-viewer/src/ui/actionList.tsx, packages/trace-viewer/src/ui/uiModeTestListView.tsx, packages/web/src/components/toolbarButton.tsx, packages/web/src/components/treeView.tsx

### 断言级测试 diff（未遮蔽）

> 断言增删：+0 / -0；来源：compare_cache。

```diff
（包含该定位器的 hunk 内未改动断言级代码。）
```

---
## rb015 — microsoft/playwright (playwright)

- 测试文件：`tests/playwright-test/ui-mode-test-watch.spec.ts` 第 109 行
- 旧定位器：`page.getByRole('treeitem')`
- 旧测试行：`await page.getByRole('treeitem').filter({ hasText: 'c.test.ts' }).getByTitle('Watch').click();`
- 新定位器：`page.getByRole('treeitem', { name: 'c.test.ts' })`
- Commit：chore: implement tree w/o list (#33169)
- Commit 说明：---
   .../src/matchers/toMatchAriaSnapshot.ts       |  18 +-
   packages/trace-viewer/src/ui/actionList.tsx   |  36 ++-
   .../src/ui/uiModeTestListView.tsx             |   3 +-
   packages/web/src/components/toolbarButton.tsx |   2 +-
   packages/web/src/components/treeView.tsx      | 231 +++++++++++-------
   tests/page/to-match-aria-snapshot.spec.ts     |   8 +-
   tests/playwright-test/ui-mode-fixtures.ts     |  11 +-
   .../ui-mode-test-annotations.spec.ts          |   2 +-
   .../playwright-test/ui-mode-test-run.spec.ts  |   8 +-
   .../ui-mode-test-setup.spec.ts                |  26 +-
   .../ui-mode-test-update.spec.ts               |   2 +-
   .../ui-mode-test-watch.spec.ts                |  16 +-
   12 files changed, 221 insertions(+), 142 deletions(-)
- 应用源码改动文件（5）：packages/playwright/src/matchers/toMatchAriaSnapshot.ts, packages/trace-viewer/src/ui/actionList.tsx, packages/trace-viewer/src/ui/uiModeTestListView.tsx, packages/web/src/components/toolbarButton.tsx, packages/web/src/components/treeView.tsx

### 断言级测试 diff（未遮蔽）

> 断言增删：+0 / -0；来源：compare_cache。

```diff
（包含该定位器的 hunk 内未改动断言级代码。）
```

---
## rb016 — microsoft/playwright (playwright)

- 测试文件：`tests/playwright-test/ui-mode-test-watch.spec.ts` 第 78 行
- 旧定位器：`page.getByRole('listitem')`
- 旧测试行：`await page.getByRole('listitem').filter({ hasText: 'answer' }).getByTitle('Watch').click();`
- 新定位器：`page.getByRole('treeitem')`
- Commit：chore: implement tree w/o list (#33167)
- Commit 说明：---
   .../src/ui/uiModeTestListView.css             |  12 +-
   .../src/ui/uiModeTestListView.tsx             |   6 +-
   packages/web/src/components/gridView.tsx      |   3 -
   packages/web/src/components/listView.tsx      |  31 +--
   packages/web/src/components/treeView.css      |  91 +++++++
   packages/web/src/components/treeView.tsx      | 240 ++++++++++++++----
   packages/web/src/uiUtils.ts                   |   9 +
   tests/config/traceViewerFixtures.ts           |   4 +-
   tests/playwright-test/ui-mode-fixtures.ts     |  16 +-
   .../ui-mode-test-annotations.spec.ts          |   2 +-
   .../ui-mode-test-filters.spec.ts              |   2 +-
   .../ui-mode-test-progress.spec.ts             |  22 +-
   .../playwright-test/ui-mode-test-run.spec.ts  |   4 +-
   .../ui-mode-test-setup.spec.ts                |   2 +-
   .../ui-mode-test-update.spec.ts               |   4 +-
   .../ui-mode-test-watch.spec.ts                |  16 +-
   tests/playwright-test/ui-mode-trace.spec.ts   |  14 +-
   17 files changed, 339 insertions(+), 139 deletions(-)
   create mode 100644 packages/web/src/components/treeView.css
- 应用源码改动文件（7）：packages/trace-viewer/src/ui/uiModeTestListView.css, packages/trace-viewer/src/ui/uiModeTestListView.tsx, packages/web/src/components/gridView.tsx, packages/web/src/components/listView.tsx, packages/web/src/components/treeView.css, packages/web/src/components/treeView.tsx, packages/web/src/uiUtils.ts

### 断言级测试 diff（未遮蔽）

> 断言增删：+0 / -0；来源：compare_cache。

```diff
（包含该定位器的 hunk 内未改动断言级代码。）
```

---
## rb017 — microsoft/playwright (playwright)

- 测试文件：`tests/playwright-test/ui-mode-test-watch.spec.ts` 第 107 行
- 旧定位器：`page.getByRole('listitem')`
- 旧测试行：`await page.getByRole('listitem').filter({ hasText: 'b.test.ts' }).getByTitle('Watch').click();`
- 新定位器：`page.getByRole('treeitem')`
- Commit：chore: implement tree w/o list (#33167)
- Commit 说明：---
   .../src/ui/uiModeTestListView.css             |  12 +-
   .../src/ui/uiModeTestListView.tsx             |   6 +-
   packages/web/src/components/gridView.tsx      |   3 -
   packages/web/src/components/listView.tsx      |  31 +--
   packages/web/src/components/treeView.css      |  91 +++++++
   packages/web/src/components/treeView.tsx      | 240 ++++++++++++++----
   packages/web/src/uiUtils.ts                   |   9 +
   tests/config/traceViewerFixtures.ts           |   4 +-
   tests/playwright-test/ui-mode-fixtures.ts     |  16 +-
   .../ui-mode-test-annotations.spec.ts          |   2 +-
   .../ui-mode-test-filters.spec.ts              |   2 +-
   .../ui-mode-test-progress.spec.ts             |  22 +-
   .../playwright-test/ui-mode-test-run.spec.ts  |   4 +-
   .../ui-mode-test-setup.spec.ts                |   2 +-
   .../ui-mode-test-update.spec.ts               |   4 +-
   .../ui-mode-test-watch.spec.ts                |  16 +-
   tests/playwright-test/ui-mode-trace.spec.ts   |  14 +-
   17 files changed, 339 insertions(+), 139 deletions(-)
   create mode 100644 packages/web/src/components/treeView.css
- 应用源码改动文件（7）：packages/trace-viewer/src/ui/uiModeTestListView.css, packages/trace-viewer/src/ui/uiModeTestListView.tsx, packages/web/src/components/gridView.tsx, packages/web/src/components/listView.tsx, packages/web/src/components/treeView.css, packages/web/src/components/treeView.tsx, packages/web/src/uiUtils.ts

### 断言级测试 diff（未遮蔽）

> 断言增删：+0 / -0；来源：compare_cache。

```diff
（包含该定位器的 hunk 内未改动断言级代码。）
```

---
## rb018 — microsoft/playwright (playwright)

- 测试文件：`tests/playwright-test/ui-mode-test-watch.spec.ts` 第 109 行
- 旧定位器：`page.getByRole('listitem')`
- 旧测试行：`await page.getByRole('listitem').filter({ hasText: 'c.test.ts' }).getByTitle('Watch').click();`
- 新定位器：`page.getByRole('treeitem')`
- Commit：chore: implement tree w/o list (#33167)
- Commit 说明：---
   .../src/ui/uiModeTestListView.css             |  12 +-
   .../src/ui/uiModeTestListView.tsx             |   6 +-
   packages/web/src/components/gridView.tsx      |   3 -
   packages/web/src/components/listView.tsx      |  31 +--
   packages/web/src/components/treeView.css      |  91 +++++++
   packages/web/src/components/treeView.tsx      | 240 ++++++++++++++----
   packages/web/src/uiUtils.ts                   |   9 +
   tests/config/traceViewerFixtures.ts           |   4 +-
   tests/playwright-test/ui-mode-fixtures.ts     |  16 +-
   .../ui-mode-test-annotations.spec.ts          |   2 +-
   .../ui-mode-test-filters.spec.ts              |   2 +-
   .../ui-mode-test-progress.spec.ts             |  22 +-
   .../playwright-test/ui-mode-test-run.spec.ts  |   4 +-
   .../ui-mode-test-setup.spec.ts                |   2 +-
   .../ui-mode-test-update.spec.ts               |   4 +-
   .../ui-mode-test-watch.spec.ts                |  16 +-
   tests/playwright-test/ui-mode-trace.spec.ts   |  14 +-
   17 files changed, 339 insertions(+), 139 deletions(-)
   create mode 100644 packages/web/src/components/treeView.css
- 应用源码改动文件（7）：packages/trace-viewer/src/ui/uiModeTestListView.css, packages/trace-viewer/src/ui/uiModeTestListView.tsx, packages/web/src/components/gridView.tsx, packages/web/src/components/listView.tsx, packages/web/src/components/treeView.css, packages/web/src/components/treeView.tsx, packages/web/src/uiUtils.ts

### 断言级测试 diff（未遮蔽）

> 断言增删：+0 / -0；来源：compare_cache。

```diff
（包含该定位器的 hunk 内未改动断言级代码。）
```

---
## rb019 — microsoft/playwright (playwright)

- 测试文件：`tests/playwright-test/ui-mode-test-watch.spec.ts` 第 111 行
- 旧定位器：`page.getByRole('listitem')`
- 旧测试行：`await page.getByRole('listitem').filter({ hasText: 'd.test.ts' }).getByTitle('Watch').click();`
- 新定位器：`page.getByRole('treeitem')`
- Commit：chore: implement tree w/o list (#33167)
- Commit 说明：---
   .../src/ui/uiModeTestListView.css             |  12 +-
   .../src/ui/uiModeTestListView.tsx             |   6 +-
   packages/web/src/components/gridView.tsx      |   3 -
   packages/web/src/components/listView.tsx      |  31 +--
   packages/web/src/components/treeView.css      |  91 +++++++
   packages/web/src/components/treeView.tsx      | 240 ++++++++++++++----
   packages/web/src/uiUtils.ts                   |   9 +
   tests/config/traceViewerFixtures.ts           |   4 +-
   tests/playwright-test/ui-mode-fixtures.ts     |  16 +-
   .../ui-mode-test-annotations.spec.ts          |   2 +-
   .../ui-mode-test-filters.spec.ts              |   2 +-
   .../ui-mode-test-progress.spec.ts             |  22 +-
   .../playwright-test/ui-mode-test-run.spec.ts  |   4 +-
   .../ui-mode-test-setup.spec.ts                |   2 +-
   .../ui-mode-test-update.spec.ts               |   4 +-
   .../ui-mode-test-watch.spec.ts                |  16 +-
   tests/playwright-test/ui-mode-trace.spec.ts   |  14 +-
   17 files changed, 339 insertions(+), 139 deletions(-)
   create mode 100644 packages/web/src/components/treeView.css
- 应用源码改动文件（7）：packages/trace-viewer/src/ui/uiModeTestListView.css, packages/trace-viewer/src/ui/uiModeTestListView.tsx, packages/web/src/components/gridView.tsx, packages/web/src/components/listView.tsx, packages/web/src/components/treeView.css, packages/web/src/components/treeView.tsx, packages/web/src/uiUtils.ts

### 断言级测试 diff（未遮蔽）

> 断言增删：+0 / -0；来源：compare_cache。

```diff
（包含该定位器的 hunk 内未改动断言级代码。）
```

---
## rb020 — microsoft/playwright (playwright)

- 测试文件：`tests/playwright-test/ui-mode-test-watch.spec.ts` 第 232 行
- 旧定位器：`page.getByRole('listitem')`
- 旧测试行：`await page.getByRole('listitem').filter({ hasText: 'a.test.ts' }).getByTitle('Watch').click();`
- 新定位器：`page.getByRole('treeitem')`
- Commit：chore: implement tree w/o list (#33167)
- Commit 说明：---
   .../src/ui/uiModeTestListView.css             |  12 +-
   .../src/ui/uiModeTestListView.tsx             |   6 +-
   packages/web/src/components/gridView.tsx      |   3 -
   packages/web/src/components/listView.tsx      |  31 +--
   packages/web/src/components/treeView.css      |  91 +++++++
   packages/web/src/components/treeView.tsx      | 240 ++++++++++++++----
   packages/web/src/uiUtils.ts                   |   9 +
   tests/config/traceViewerFixtures.ts           |   4 +-
   tests/playwright-test/ui-mode-fixtures.ts     |  16 +-
   .../ui-mode-test-annotations.spec.ts          |   2 +-
   .../ui-mode-test-filters.spec.ts              |   2 +-
   .../ui-mode-test-progress.spec.ts             |  22 +-
   .../playwright-test/ui-mode-test-run.spec.ts  |   4 +-
   .../ui-mode-test-setup.spec.ts                |   2 +-
   .../ui-mode-test-update.spec.ts               |   4 +-
   .../ui-mode-test-watch.spec.ts                |  16 +-
   tests/playwright-test/ui-mode-trace.spec.ts   |  14 +-
   17 files changed, 339 insertions(+), 139 deletions(-)
   create mode 100644 packages/web/src/components/treeView.css
- 应用源码改动文件（7）：packages/trace-viewer/src/ui/uiModeTestListView.css, packages/trace-viewer/src/ui/uiModeTestListView.tsx, packages/web/src/components/gridView.tsx, packages/web/src/components/listView.tsx, packages/web/src/components/treeView.css, packages/web/src/components/treeView.tsx, packages/web/src/uiUtils.ts

### 断言级测试 diff（未遮蔽）

> 断言增删：+0 / -0；来源：compare_cache。

```diff
（包含该定位器的 hunk 内未改动断言级代码。）
```

---
## rb021 — nasa/openmct (playwright)

- 测试文件：`e2e/tests/functional/plugins/lad/lad.e2e.spec.js` 第 71 行
- 旧定位器：`page.getByRole('cell', { name: 'Timestamp', exact: true }))`
- 旧测试行：`await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();`
- 新定位器：`page.getByRole('columnheader', { name: 'Units' }))`
- Commit：test(e2e): Major refactor and stabilization of e2e tests (#7581)
- Commit 说明：* fix: update broken locator
  
  * update eslint package
  
  * first pass of lint fixes
  
  * update package
  
  * change ruleset
  
  * update component tests to match linting rules
  
  * driveby
  
  * start to factor out bad locators
  
  * update gauge component
  
  * update notebook snapshot drop area
  
  * Update plot aria
  
  * add draggable true to tree items
  
  * update package
  
  * driveby to remove dead code
  
  * unneeded
  
  * unneeded
  
  * tells a screenreader that this is a row and a cell
  
  * adds an id for dragondrops
  
  * this should be a button
  
  * first pass at fixing tooltip selectors
  
  * review comments
  
  * Updating more tests
  
  * update to remove expect expect given our use of check functions
  
  * add expand component
  
  * move role around
  
  * update more locators
  
  * force
  
  * new local storage
  
  * remove choochoo steps
  
  * test: do `lint:fix` and also add back accidentally removed code
  
  * test: add back more removed code
  
  * test: remove `unstable` annotation from tests which are not unstable
  
  * test: remove invalid test-- the "new" time conductor doesn't allow for millisecond changes in fixed time
  
  * test: fix unstable gauge test
  
  * test: remove useless asserts-- this was secretly non-functional. now that we've fixed it, it makes no sense and just fails
  
  * test: add back accidentally removed changes
  
  * test: revert changes that break test
  
  * test: more fixes
  
  * Remove all notion of the unstable/stable e2e tests
  
  * test: eviscerate the flake with FACTS and LOGIC
  
  * test: fix anotha one
  
  * lint fixes
  
  * test: no need to wait for save dialog
  
  * test: fix more tests
  
  * lint: fix more warnings
  
  * test: fix anotha one
  
  * test: use `toHaveLength` instead of `.length).toBe()`
  
  * test: stabilize tabs view example imagery test
  
  * fix: more tests be fixed
  
  * test: more `toHaveCount()`s please
  
  * test: revert more accidentally removed fixes
  
  * test: fix selector
  
  * test: fix anotha one
  
  * update lint rules to clean up bad locators in shared fixtures
  
  * update and remove bad appActions
  
  * test: fix some restricted notebook tests
  
  * test: mass find/replace to enforce `toHaveCount()` instead of `.count()).toBe()`
  
  * Remove some bad appActions and update text
  
  * test: fix da tree tests
  
  * test: await not await await
  
  * test: fix upload plan appAction and add a11y
  
  * Updating externalFixtures with best practice locators and add missing appAction framework tests
  
  * test: fix test
  
  * test: fix appAction test for plans
  
  * test: yum yum fix'em up and get rid of some dragon drops
  
  * fix: alas, a `.only()` got my hopes up that i was done fixing tests
  
  * test: add `setTimeConductorMode` test "suite" which covers most TC related appActions
  
  * test: fix arg
  
  * test(couchdb): fix some network tests via expect polling
  
  * Stabalize visual test
  
  * getCanasPixels
  
  * test: stabilize tooltip telemetry table test, better a11y for tooltips
  
  * chore: update to use `docker compose` instead of `docker-compose`
  
  * New rules, new tests, new me
  
  * fix sort order
  
  * test: add `waitForPlotsToRender` framework test, passthru timeout override
  
  * test: remove `clockOptions` test as we have `page.clock` now
  
  * test: refactor out `overrideClock`
  
  * test: use `clock.install` instead
  
  * test: use `clock.install` instead
  
  * time clock fix
  
  * test: fix timer tests
  
  * remove ever reference to old base fixture
  
  * test: stabilize restricted notebook test
  
  * lint fixes
  
  * test: use clock.install
  
  * update timelist
  
  * test: update visual tests to use `page.clock()`, update snapshots
  
  * test: stabilize tree renaming/reordering test
  
  * a11y: add aria-label and role=region to object view
  
  * refactor: use `dragTo`
  
  * refactor: use `dragTo`, other small fixes
  
  * test: use `page.clock()` to stabilize tooltip telemetry table test
  
  * test: use web-first assertion to stabilize staleness test
  
  * test: knock out a few more `page.click`s
  
  * test: destroy all `page.click()`s
  
  * refactor: consistently use `'Ok'` instead of `'OK'` and `'Ok'` mixed
  
  * test: remove gauge aria label
  
  * test: more test fixes
  
  * test: more fixes and refactors
  
  * docs: add comment
  
  * test: refactor all instances of `dragAndDrop`
  
  * test: remove redundant test (covered in previous test steps)
  
  * test: stabilize imagery operations tests for display layout
  
  * chore: remove bad unicorn rule
  
  * chore(lint): remove unused disable directives
  
  ---------
  
  Co-authored-by: Jesse Mazzella <jesse.d.mazzella@nasa.gov>
  ---
   .circleci/config.yml                          |   8 +-
   .cspell.json                                  |  17 +-
   .eslintrc.cjs                                 |   5 +-
   .github/workflows/e2e-couchdb.yml             |   2 +-
   .github/workflows/e2e-flakefinder.yml         |   2 +-
   README.md                                     |   2 +-
   TESTING.md                                    |   4 +-
   codecov.yml                                   |   6 +-
   e2e/.eslintrc.cjs                             |  18 +-
   e2e/README.md                                 |  55 +--
   e2e/appActions.js                             | 177 +++----
   e2e/baseFixtures.js                           | 110 +----
   e2e/helper/faultUtils.js                      |   5 +-
   e2e/helper/notebookUtils.js                   |  10 +-
   e2e/helper/planningUtils.js                   |  13 +-
   e2e/package.json                              |   6 +-
   .../display_layout_with_child_layouts.json    |  10 +-
   ...isplay_layout_with_child_overlay_plot.json |   4 +-
   .../flexible_layout_with_child_layouts.json   |  10 +-
   e2e/test-data/overlay_plot_storage.json       |  10 +-
   .../overlay_plot_with_delay_storage.json      |   2 +-
   e2e/test-data/recycled_local_storage.json     |   4 +-
   e2e/tests/framework/appActions.e2e.spec.js    | 198 ++++++--
   e2e/tests/framework/baseFixtures.e2e.spec.js  |  41 +-
   .../framework/exampleTemplate.e2e.spec.js     |  41 +-
   .../generateLocalStorageData.e2e.spec.js      |  36 +-
   .../framework/pluginFixtures.e2e.spec.js      |   2 +-
   .../functional/clearDataAction.e2e.spec.js    |   2 +-
   e2e/tests/functional/couchdb.e2e.spec.js      |   6 +-
   .../sineWaveLimitProvider.e2e.spec.js         |  10 +-
   e2e/tests/functional/forms.e2e.spec.js        |  58 ++-
   e2e/tests/functional/notification.e2e.spec.js |  10 +-
   .../functional/planning/plan.e2e.spec.js      |   6 +-
   .../functional/planning/timelist.e2e.spec.js  |  22 +-
   .../timelistControlledClock.e2e.spec.js       |  56 +--
   .../functional/planning/timestrip.e2e.spec.js |  29 +-
   .../conditionSet/conditionSet.e2e.spec.js     |  80 ++--
   .../conditionSetOperations.e2e.spec.js        | 368 ++++++++++++++
   .../displayLayout/displayLayout.e2e.spec.js   | 143 +++---
   .../faultManagement.e2e.spec.js               |  16 +-
   .../flexibleLayout/flexibleLayout.e2e.spec.js |   8 +-
   .../plugins/gauge/gauge.e2e.spec.js           |  71 ++-
   .../imagery/exampleImagery.e2e.spec.js        |  31 +-
   .../exportAsJson.e2e.spec.js                  |  23 +-
   .../numericData.e2e.spec.js                   |   6 +-
   .../functional/plugins/lad/lad.e2e.spec.js    | 241 +++++-----
   .../plugins/lad/ladTable.e2e.spec.js          |   2 +-
   .../plugins/notebook/notebook.e2e.spec.js     |  38 +-
   .../notebookSnapshotImage.e2e.spec.js         |   4 +-
   .../notebook/notebookWithCouchDB.e2e.spec.js  |  24 +-
   .../notebook/restrictedNotebook.e2e.spec.js   |  54 ++-
   .../plugins/plot/autoscale.e2e.spec.js        |  15 +-
   .../plugins/plot/logPlot.e2e.spec.js          | 143 +++---
   .../plugins/plot/overlayPlot.e2e.spec.js      |  58 +--
   .../plugins/plot/plotControls.e2e.spec.js     |  11 +-
   .../plugins/plot/plotRendering.e2e.spec.js    |   8 +-
   .../plugins/plot/scatterPlot.e2e.spec.js      |  36 +-
   .../plugins/plot/stackedPlot.e2e.spec.js      |  19 +-
   .../plugins/plot/tagging.e2e.spec.js          |   2 +-
   .../reloadAction/reloadAction.e2e.spec.js     |  44 +-
   .../styling/flexLayoutStyling.e2e.spec.js     |   2 +-
   .../functional/plugins/tabs/tabs.e2e.spec.js  |   4 +-
   .../telemetryTable/telemetryTable.e2e.spec.js |  21 +-
   .../timeConductor/datepicker.e2e.spec.js      |  13 +-
   .../timeConductor/timeConductor.e2e.spec.js   |  26 -
   .../plugins/timer/timer.e2e.spec.js           |  70 +--
   .../functional/recentObjects.e2e.spec.js      |  42 +-
   e2e/tests/functional/renaming.e2e.spec.js     |  34 +-
   e2e/tests/functional/search.e2e.spec.js       |   8 +-
   e2e/tests/functional/staleness.e2e.spec.js    |   6 +-
   e2e/tests/functional/tooltips.e2e.spec.js     | 447 +++++++++---------
   e2e/tests/functional/tree.e2e.spec.js         | 161 ++++---
   e2e/tests/mobile/smoke.e2e.spec.js            |  12 +-
   .../contract/imagery.contract.perf.spec.js    |  14 +-
   .../contract/notebook.contract.perf.spec.js   |  19 +-
   .../memory/navigation.memory.perf.spec.js     |   4 +-
   e2e/tests/performance/tabs.perf.spec.js       |   2 +-
   e2e/tests/performance/tagging.perf.spec.js    |   2 +-
   .../components/header.visual.spec.js          |   1 +
   .../components/inspector.visual.spec.js       |  13 +-
   .../components/timeConductor.visual.spec.js   |  12 +-
   ...me-conductor-axis-resized-chrome-linux.png | Bin 33614 -> 31101 bytes
   .../time-conductor-realtime-chrome-linux.png  | Bin 29757 -> 27354 bytes
   .../components/tree.visual.spec.js            |  29 +-
   .../controlledClock.visual.spec.js            |   8 +-
   .../visual-a11y/displayLayout.visual.spec.js  |   8 +-
   e2e/tests/visual-a11y/notebook.visual.spec.js |  12 +-
   .../planning-timelist.visual.spec.js          |  13 +-
   .../planning-timestrip.visual.spec.js         |   6 +-
   .../visual-a11y/planning-view.visual.spec.js  |  13 +-
   package-lock.json                             | 184 ++-----
   package.json                                  |  11 +-
   src/api/forms/components/FormProperties.vue   |   2 +-
   .../forms/components/controls/FileInput.vue   |   1 +
   .../tooltips/components/TooltipComponent.vue  |  13 +-
   src/exporters/ImageExporter.js                |   2 +-
   src/plugins/LADTable/components/LadRow.vue    |   1 +
   src/plugins/LADTable/components/LadTable.vue  |  20 +-
   .../displayLayout/DisplayLayoutToolbar.js     |   2 +-
   .../components/DisplayLayout.vue              |   3 +-
   .../components/DisplayLayoutGrid.vue          |   2 +-
   src/plugins/flexibleLayout/toolbarProvider.js |   4 +-
   src/plugins/formActions/pluginSpec.js         |   4 +-
   .../gauge/components/GaugeComponent.vue       |   9 +-
   .../components/Compass/CompassRose.vue        |   5 +-
   .../styles/SavedStyleSelector.vue             |   2 +-
   .../inspectorViews/styles/SavedStylesView.vue |   4 +-
   .../notebook/components/NotebookComponent.vue |   7 +-
   .../notebook/components/NotebookEntry.vue     |   1 +
   src/plugins/persistence/couch/README.md       |  33 +-
   src/plugins/plot/MctPlot.vue                  |  21 +-
   .../plot/inspector/PlotOptionsItem.vue        |   3 +-
   .../plot/inspector/forms/SeriesForm.vue       |   3 +-
   src/plugins/plot/legend/PlotLegend.vue        |  11 +-
   src/plugins/remove/RemoveAction.js            |   2 +-
   src/plugins/tabs/components/TabsComponent.vue |   2 +-
   src/ui/components/ObjectView.vue              |  11 +-
   src/ui/layout/BrowseBar.vue                   |   2 +-
   src/ui/layout/MctTree.vue                     |   1 +
   src/ui/layout/RecentObjectsList.vue           |   2 +-
   120 files changed, 1978 insertions(+), 1834 deletions(-)
   create mode 100644 e2e/tests/functional/plugins/conditionSet/conditionSetOperations.e2e.spec.js
- 应用源码改动文件（38）：.circleci/config.yml, .cspell.json, .eslintrc.cjs, .github/workflows/e2e-couchdb.yml, .github/workflows/e2e-flakefinder.yml, README.md, TESTING.md, codecov.yml, package-lock.json, package.json, src/api/forms/components/FormProperties.vue, src/api/forms/components/controls/FileInput.vue, src/api/tooltips/components/TooltipComponent.vue, src/exporters/ImageExporter.js, src/plugins/LADTable/components/LadRow.vue, src/plugins/LADTable/components/LadTable.vue, src/plugins/displayLayout/DisplayLayoutToolbar.js, src/plugins/displayLayout/components/DisplayLayout.vue, src/plugins/displayLayout/components/DisplayLayoutGrid.vue, src/plugins/flexibleLayout/toolbarProvider.js, src/plugins/formActions/pluginSpec.js, src/plugins/gauge/components/GaugeComponent.vue, src/plugins/imagery/components/Compass/CompassRose.vue, src/plugins/inspectorViews/styles/SavedStyleSelector.vue, src/plugins/inspectorViews/styles/SavedStylesView.vue, src/plugins/notebook/components/NotebookComponent.vue, src/plugins/notebook/components/NotebookEntry.vue, src/plugins/persistence/couch/README.md, src/plugins/plot/MctPlot.vue, src/plugins/plot/inspector/PlotOptionsItem.vue, src/plugins/plot/inspector/forms/SeriesForm.vue, src/plugins/plot/legend/PlotLegend.vue, src/plugins/remove/RemoveAction.js, src/plugins/tabs/components/TabsComponent.vue, src/ui/components/ObjectView.vue, src/ui/layout/BrowseBar.vue, src/ui/layout/MctTree.vue, src/ui/layout/RecentObjectsList.vue

### 断言级测试 diff（未遮蔽）

> 断言增删：+88 / -88；来源：compare_cache。

```diff
@@ -56,61 +56,61 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
@@ -118,27 +118,27 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
@@ -148,27 +148,27 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
@@ -185,14 +185,14 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
@@ -201,25 +201,25 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
+    await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeHidden();
+    await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeHidden();
```

---
## rb022 — nasa/openmct (playwright)

- 测试文件：`e2e/tests/functional/plugins/lad/lad.e2e.spec.js` 第 153 行
- 旧定位器：`page.getByRole('cell', { name: 'Type' }))`
- 旧测试行：`await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();`
- 新定位器：`page.getByRole('cell', { name: 'Type', exact: true }))`
- Commit：Provide `renderWhenVisible` to LadTableSets (#7384)
- Commit 说明：* Provide renderWhenVisible for LadTables
  
  * fix open in new tab
  
  * add test for open in new tab
  
  * fix test to include renderWhenVisible
  
  * refactor test
  
  * fix tests
  
  * fix tests
  
  * having timing issues now
  ---
   .../numericData.e2e.spec.js                   | 13 +++-
   .../functional/plugins/lad/lad.e2e.spec.js    | 52 +++++++--------
   .../functional/plugins/lad/ladSet.e2e.spec.js | 66 +++++++++++++++++++
   src/plugins/LADTable/LadTableSetView.js       |  5 +-
   src/plugins/LADTable/components/LadRow.vue    | 15 +++--
   .../components/LadTableConfiguration.vue      |  3 +
   src/plugins/LADTable/pluginSpec.js            |  2 +-
   .../TelemetryFrame.vue                        | 12 ++--
   8 files changed, 127 insertions(+), 41 deletions(-)
   create mode 100644 e2e/tests/functional/plugins/lad/ladSet.e2e.spec.js
- 应用源码改动文件（5）：src/plugins/LADTable/LadTableSetView.js, src/plugins/LADTable/components/LadRow.vue, src/plugins/LADTable/components/LadTableConfiguration.vue, src/plugins/LADTable/pluginSpec.js, src/plugins/inspectorDataVisualization/TelemetryFrame.vue

### 断言级测试 diff（未遮蔽）

> 断言增删：+22 / -22；来源：compare_cache。

```diff
@@ -56,9 +56,9 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -66,10 +66,10 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -78,10 +78,10 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
@@ -90,9 +90,9 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
@@ -103,9 +103,9 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
@@ -117,10 +117,10 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
@@ -132,8 +132,8 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
@@ -146,11 +146,11 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -161,9 +161,9 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -185,9 +185,9 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -206,8 +206,8 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
```

---
## rb023 — nasa/openmct (playwright)

- 测试文件：`e2e/tests/functional/plugins/lad/lad.e2e.spec.js` 第 190 行
- 旧定位器：`page.getByRole('cell', { name: 'Type' }))`
- 旧测试行：`await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();`
- 新定位器：`page.getByRole('cell', { name: 'Type', exact: true }))`
- Commit：Provide `renderWhenVisible` to LadTableSets (#7384)
- Commit 说明：* Provide renderWhenVisible for LadTables
  
  * fix open in new tab
  
  * add test for open in new tab
  
  * fix test to include renderWhenVisible
  
  * refactor test
  
  * fix tests
  
  * fix tests
  
  * having timing issues now
  ---
   .../numericData.e2e.spec.js                   | 13 +++-
   .../functional/plugins/lad/lad.e2e.spec.js    | 52 +++++++--------
   .../functional/plugins/lad/ladSet.e2e.spec.js | 66 +++++++++++++++++++
   src/plugins/LADTable/LadTableSetView.js       |  5 +-
   src/plugins/LADTable/components/LadRow.vue    | 15 +++--
   .../components/LadTableConfiguration.vue      |  3 +
   src/plugins/LADTable/pluginSpec.js            |  2 +-
   .../TelemetryFrame.vue                        | 12 ++--
   8 files changed, 127 insertions(+), 41 deletions(-)
   create mode 100644 e2e/tests/functional/plugins/lad/ladSet.e2e.spec.js
- 应用源码改动文件（5）：src/plugins/LADTable/LadTableSetView.js, src/plugins/LADTable/components/LadRow.vue, src/plugins/LADTable/components/LadTableConfiguration.vue, src/plugins/LADTable/pluginSpec.js, src/plugins/inspectorDataVisualization/TelemetryFrame.vue

### 断言级测试 diff（未遮蔽）

> 断言增删：+22 / -22；来源：compare_cache。

```diff
@@ -56,9 +56,9 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -66,10 +66,10 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -78,10 +78,10 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
@@ -90,9 +90,9 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
@@ -103,9 +103,9 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
@@ -117,10 +117,10 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
@@ -132,8 +132,8 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
@@ -146,11 +146,11 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -161,9 +161,9 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -185,9 +185,9 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -206,8 +206,8 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
```

---
## rb024 — nasa/openmct (playwright)

- 测试文件：`e2e/tests/functional/plugins/lad/lad.e2e.spec.js` 第 210 行
- 旧定位器：`page.getByRole('cell', { name: 'Timestamp' }))`
- 旧测试行：`await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();`
- 新定位器：`page.getByRole('cell', { name: 'Type', exact: true }))`
- Commit：Provide `renderWhenVisible` to LadTableSets (#7384)
- Commit 说明：* Provide renderWhenVisible for LadTables
  
  * fix open in new tab
  
  * add test for open in new tab
  
  * fix test to include renderWhenVisible
  
  * refactor test
  
  * fix tests
  
  * fix tests
  
  * having timing issues now
  ---
   .../numericData.e2e.spec.js                   | 13 +++-
   .../functional/plugins/lad/lad.e2e.spec.js    | 52 +++++++--------
   .../functional/plugins/lad/ladSet.e2e.spec.js | 66 +++++++++++++++++++
   src/plugins/LADTable/LadTableSetView.js       |  5 +-
   src/plugins/LADTable/components/LadRow.vue    | 15 +++--
   .../components/LadTableConfiguration.vue      |  3 +
   src/plugins/LADTable/pluginSpec.js            |  2 +-
   .../TelemetryFrame.vue                        | 12 ++--
   8 files changed, 127 insertions(+), 41 deletions(-)
   create mode 100644 e2e/tests/functional/plugins/lad/ladSet.e2e.spec.js
- 应用源码改动文件（5）：src/plugins/LADTable/LadTableSetView.js, src/plugins/LADTable/components/LadRow.vue, src/plugins/LADTable/components/LadTableConfiguration.vue, src/plugins/LADTable/pluginSpec.js, src/plugins/inspectorDataVisualization/TelemetryFrame.vue

### 断言级测试 diff（未遮蔽）

> 断言增删：+22 / -22；来源：compare_cache。

```diff
@@ -56,9 +56,9 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -66,10 +66,10 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -78,10 +78,10 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
@@ -90,9 +90,9 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
@@ -103,9 +103,9 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
@@ -117,10 +117,10 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
@@ -132,8 +132,8 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
@@ -146,11 +146,11 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -161,9 +161,9 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -185,9 +185,9 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -206,8 +206,8 @@ test.describe('Testing LAD table configuration', () => {
-    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
-    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
+    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
```

---
## rb025 — nasa/openmct (playwright)

- 测试文件：`e2e/tests/functional/plugins/plot/autoscale.e2e.spec.js` 第 77 行
- 旧定位器：`page.waitForSelector('.c-message-banner__message')`
- 旧测试行：`page.waitForSelector('.c-message-banner__message')`
- 新定位器：`page.locator('.c-message-banner__message')`
- Commit：test(e2e): Major refactor and stabilization of e2e tests (#7581)
- Commit 说明：* fix: update broken locator
  
  * update eslint package
  
  * first pass of lint fixes
  
  * update package
  
  * change ruleset
  
  * update component tests to match linting rules
  
  * driveby
  
  * start to factor out bad locators
  
  * update gauge component
  
  * update notebook snapshot drop area
  
  * Update plot aria
  
  * add draggable true to tree items
  
  * update package
  
  * driveby to remove dead code
  
  * unneeded
  
  * unneeded
  
  * tells a screenreader that this is a row and a cell
  
  * adds an id for dragondrops
  
  * this should be a button
  
  * first pass at fixing tooltip selectors
  
  * review comments
  
  * Updating more tests
  
  * update to remove expect expect given our use of check functions
  
  * add expand component
  
  * move role around
  
  * update more locators
  
  * force
  
  * new local storage
  
  * remove choochoo steps
  
  * test: do `lint:fix` and also add back accidentally removed code
  
  * test: add back more removed code
  
  * test: remove `unstable` annotation from tests which are not unstable
  
  * test: remove invalid test-- the "new" time conductor doesn't allow for millisecond changes in fixed time
  
  * test: fix unstable gauge test
  
  * test: remove useless asserts-- this was secretly non-functional. now that we've fixed it, it makes no sense and just fails
  
  * test: add back accidentally removed changes
  
  * test: revert changes that break test
  
  * test: more fixes
  
  * Remove all notion of the unstable/stable e2e tests
  
  * test: eviscerate the flake with FACTS and LOGIC
  
  * test: fix anotha one
  
  * lint fixes
  
  * test: no need to wait for save dialog
  
  * test: fix more tests
  
  * lint: fix more warnings
  
  * test: fix anotha one
  
  * test: use `toHaveLength` instead of `.length).toBe()`
  
  * test: stabilize tabs view example imagery test
  
  * fix: more tests be fixed
  
  * test: more `toHaveCount()`s please
  
  * test: revert more accidentally removed fixes
  
  * test: fix selector
  
  * test: fix anotha one
  
  * update lint rules to clean up bad locators in shared fixtures
  
  * update and remove bad appActions
  
  * test: fix some restricted notebook tests
  
  * test: mass find/replace to enforce `toHaveCount()` instead of `.count()).toBe()`
  
  * Remove some bad appActions and update text
  
  * test: fix da tree tests
  
  * test: await not await await
  
  * test: fix upload plan appAction and add a11y
  
  * Updating externalFixtures with best practice locators and add missing appAction framework tests
  
  * test: fix test
  
  * test: fix appAction test for plans
  
  * test: yum yum fix'em up and get rid of some dragon drops
  
  * fix: alas, a `.only()` got my hopes up that i was done fixing tests
  
  * test: add `setTimeConductorMode` test "suite" which covers most TC related appActions
  
  * test: fix arg
  
  * test(couchdb): fix some network tests via expect polling
  
  * Stabalize visual test
  
  * getCanasPixels
  
  * test: stabilize tooltip telemetry table test, better a11y for tooltips
  
  * chore: update to use `docker compose` instead of `docker-compose`
  
  * New rules, new tests, new me
  
  * fix sort order
  
  * test: add `waitForPlotsToRender` framework test, passthru timeout override
  
  * test: remove `clockOptions` test as we have `page.clock` now
  
  * test: refactor out `overrideClock`
  
  * test: use `clock.install` instead
  
  * test: use `clock.install` instead
  
  * time clock fix
  
  * test: fix timer tests
  
  * remove ever reference to old base fixture
  
  * test: stabilize restricted notebook test
  
  * lint fixes
  
  * test: use clock.install
  
  * update timelist
  
  * test: update visual tests to use `page.clock()`, update snapshots
  
  * test: stabilize tree renaming/reordering test
  
  * a11y: add aria-label and role=region to object view
  
  * refactor: use `dragTo`
  
  * refactor: use `dragTo`, other small fixes
  
  * test: use `page.clock()` to stabilize tooltip telemetry table test
  
  * test: use web-first assertion to stabilize staleness test
  
  * test: knock out a few more `page.click`s
  
  * test: destroy all `page.click()`s
  
  * refactor: consistently use `'Ok'` instead of `'OK'` and `'Ok'` mixed
  
  * test: remove gauge aria label
  
  * test: more test fixes
  
  * test: more fixes and refactors
  
  * docs: add comment
  
  * test: refactor all instances of `dragAndDrop`
  
  * test: remove redundant test (covered in previous test steps)
  
  * test: stabilize imagery operations tests for display layout
  
  * chore: remove bad unicorn rule
  
  * chore(lint): remove unused disable directives
  
  ---------
  
  Co-authored-by: Jesse Mazzella <jesse.d.mazzella@nasa.gov>
  ---
   .circleci/config.yml                          |   8 +-
   .cspell.json                                  |  17 +-
   .eslintrc.cjs                                 |   5 +-
   .github/workflows/e2e-couchdb.yml             |   2 +-
   .github/workflows/e2e-flakefinder.yml         |   2 +-
   README.md                                     |   2 +-
   TESTING.md                                    |   4 +-
   codecov.yml                                   |   6 +-
   e2e/.eslintrc.cjs                             |  18 +-
   e2e/README.md                                 |  55 +--
   e2e/appActions.js                             | 177 +++----
   e2e/baseFixtures.js                           | 110 +----
   e2e/helper/faultUtils.js                      |   5 +-
   e2e/helper/notebookUtils.js                   |  10 +-
   e2e/helper/planningUtils.js                   |  13 +-
   e2e/package.json                              |   6 +-
   .../display_layout_with_child_layouts.json    |  10 +-
   ...isplay_layout_with_child_overlay_plot.json |   4 +-
   .../flexible_layout_with_child_layouts.json   |  10 +-
   e2e/test-data/overlay_plot_storage.json       |  10 +-
   .../overlay_plot_with_delay_storage.json      |   2 +-
   e2e/test-data/recycled_local_storage.json     |   4 +-
   e2e/tests/framework/appActions.e2e.spec.js    | 198 ++++++--
   e2e/tests/framework/baseFixtures.e2e.spec.js  |  41 +-
   .../framework/exampleTemplate.e2e.spec.js     |  41 +-
   .../generateLocalStorageData.e2e.spec.js      |  36 +-
   .../framework/pluginFixtures.e2e.spec.js      |   2 +-
   .../functional/clearDataAction.e2e.spec.js    |   2 +-
   e2e/tests/functional/couchdb.e2e.spec.js      |   6 +-
   .../sineWaveLimitProvider.e2e.spec.js         |  10 +-
   e2e/tests/functional/forms.e2e.spec.js        |  58 ++-
   e2e/tests/functional/notification.e2e.spec.js |  10 +-
   .../functional/planning/plan.e2e.spec.js      |   6 +-
   .../functional/planning/timelist.e2e.spec.js  |  22 +-
   .../timelistControlledClock.e2e.spec.js       |  56 +--
   .../functional/planning/timestrip.e2e.spec.js |  29 +-
   .../conditionSet/conditionSet.e2e.spec.js     |  80 ++--
   .../conditionSetOperations.e2e.spec.js        | 368 ++++++++++++++
   .../displayLayout/displayLayout.e2e.spec.js   | 143 +++---
   .../faultManagement.e2e.spec.js               |  16 +-
   .../flexibleLayout/flexibleLayout.e2e.spec.js |   8 +-
   .../plugins/gauge/gauge.e2e.spec.js           |  71 ++-
   .../imagery/exampleImagery.e2e.spec.js        |  31 +-
   .../exportAsJson.e2e.spec.js                  |  23 +-
   .../numericData.e2e.spec.js                   |   6 +-
   .../functional/plugins/lad/lad.e2e.spec.js    | 241 +++++-----
   .../plugins/lad/ladTable.e2e.spec.js          |   2 +-
   .../plugins/notebook/notebook.e2e.spec.js     |  38 +-
   .../notebookSnapshotImage.e2e.spec.js         |   4 +-
   .../notebook/notebookWithCouchDB.e2e.spec.js  |  24 +-
   .../notebook/restrictedNotebook.e2e.spec.js   |  54 ++-
   .../plugins/plot/autoscale.e2e.spec.js        |  15 +-
   .../plugins/plot/logPlot.e2e.spec.js          | 143 +++---
   .../plugins/plot/overlayPlot.e2e.spec.js      |  58 +--
   .../plugins/plot/plotControls.e2e.spec.js     |  11 +-
   .../plugins/plot/plotRendering.e2e.spec.js    |   8 +-
   .../plugins/plot/scatterPlot.e2e.spec.js      |  36 +-
   .../plugins/plot/stackedPlot.e2e.spec.js      |  19 +-
   .../plugins/plot/tagging.e2e.spec.js          |   2 +-
   .../reloadAction/reloadAction.e2e.spec.js     |  44 +-
   .../styling/flexLayoutStyling.e2e.spec.js     |   2 +-
   .../functional/plugins/tabs/tabs.e2e.spec.js  |   4 +-
   .../telemetryTable/telemetryTable.e2e.spec.js |  21 +-
   .../timeConductor/datepicker.e2e.spec.js      |  13 +-
   .../timeConductor/timeConductor.e2e.spec.js   |  26 -
   .../plugins/timer/timer.e2e.spec.js           |  70 +--
   .../functional/recentObjects.e2e.spec.js      |  42 +-
   e2e/tests/functional/renaming.e2e.spec.js     |  34 +-
   e2e/tests/functional/search.e2e.spec.js       |   8 +-
   e2e/tests/functional/staleness.e2e.spec.js    |   6 +-
   e2e/tests/functional/tooltips.e2e.spec.js     | 447 +++++++++---------
   e2e/tests/functional/tree.e2e.spec.js         | 161 ++++---
   e2e/tests/mobile/smoke.e2e.spec.js            |  12 +-
   .../contract/imagery.contract.perf.spec.js    |  14 +-
   .../contract/notebook.contract.perf.spec.js   |  19 +-
   .../memory/navigation.memory.perf.spec.js     |   4 +-
   e2e/tests/performance/tabs.perf.spec.js       |   2 +-
   e2e/tests/performance/tagging.perf.spec.js    |   2 +-
   .../components/header.visual.spec.js          |   1 +
   .../components/inspector.visual.spec.js       |  13 +-
   .../components/timeConductor.visual.spec.js   |  12 +-
   ...me-conductor-axis-resized-chrome-linux.png | Bin 33614 -> 31101 bytes
   .../time-conductor-realtime-chrome-linux.png  | Bin 29757 -> 27354 bytes
   .../components/tree.visual.spec.js            |  29 +-
   .../controlledClock.visual.spec.js            |   8 +-
   .../visual-a11y/displayLayout.visual.spec.js  |   8 +-
   e2e/tests/visual-a11y/notebook.visual.spec.js |  12 +-
   .../planning-timelist.visual.spec.js          |  13 +-
   .../planning-timestrip.visual.spec.js         |   6 +-
   .../visual-a11y/planning-view.visual.spec.js  |  13 +-
   package-lock.json                             | 184 ++-----
   package.json                                  |  11 +-
   src/api/forms/components/FormProperties.vue   |   2 +-
   .../forms/components/controls/FileInput.vue   |   1 +
   .../tooltips/components/TooltipComponent.vue  |  13 +-
   src/exporters/ImageExporter.js                |   2 +-
   src/plugins/LADTable/components/LadRow.vue    |   1 +
   src/plugins/LADTable/components/LadTable.vue  |  20 +-
   .../displayLayout/DisplayLayoutToolbar.js     |   2 +-
   .../components/DisplayLayout.vue              |   3 +-
   .../components/DisplayLayoutGrid.vue          |   2 +-
   src/plugins/flexibleLayout/toolbarProvider.js |   4 +-
   src/plugins/formActions/pluginSpec.js         |   4 +-
   .../gauge/components/GaugeComponent.vue       |   9 +-
   .../components/Compass/CompassRose.vue        |   5 +-
   .../styles/SavedStyleSelector.vue             |   2 +-
   .../inspectorViews/styles/SavedStylesView.vue |   4 +-
   .../notebook/components/NotebookComponent.vue |   7 +-
   .../notebook/components/NotebookEntry.vue     |   1 +
   src/plugins/persistence/couch/README.md       |  33 +-
   src/plugins/plot/MctPlot.vue                  |  21 +-
   .../plot/inspector/PlotOptionsItem.vue        |   3 +-
   .../plot/inspector/forms/SeriesForm.vue       |   3 +-
   src/plugins/plot/legend/PlotLegend.vue        |  11 +-
   src/plugins/remove/RemoveAction.js            |   2 +-
   src/plugins/tabs/components/TabsComponent.vue |   2 +-
   src/ui/components/ObjectView.vue              |  11 +-
   src/ui/layout/BrowseBar.vue                   |   2 +-
   src/ui/layout/MctTree.vue                     |   1 +
   src/ui/layout/RecentObjectsList.vue           |   2 +-
   120 files changed, 1978 insertions(+), 1834 deletions(-)
   create mode 100644 e2e/tests/functional/plugins/conditionSet/conditionSetOperations.e2e.spec.js
- 应用源码改动文件（38）：.circleci/config.yml, .cspell.json, .eslintrc.cjs, .github/workflows/e2e-couchdb.yml, .github/workflows/e2e-flakefinder.yml, README.md, TESTING.md, codecov.yml, package-lock.json, package.json, src/api/forms/components/FormProperties.vue, src/api/forms/components/controls/FileInput.vue, src/api/tooltips/components/TooltipComponent.vue, src/exporters/ImageExporter.js, src/plugins/LADTable/components/LadRow.vue, src/plugins/LADTable/components/LadTable.vue, src/plugins/displayLayout/DisplayLayoutToolbar.js, src/plugins/displayLayout/components/DisplayLayout.vue, src/plugins/displayLayout/components/DisplayLayoutGrid.vue, src/plugins/flexibleLayout/toolbarProvider.js, src/plugins/formActions/pluginSpec.js, src/plugins/gauge/components/GaugeComponent.vue, src/plugins/imagery/components/Compass/CompassRose.vue, src/plugins/inspectorViews/styles/SavedStyleSelector.vue, src/plugins/inspectorViews/styles/SavedStylesView.vue, src/plugins/notebook/components/NotebookComponent.vue, src/plugins/notebook/components/NotebookEntry.vue, src/plugins/persistence/couch/README.md, src/plugins/plot/MctPlot.vue, src/plugins/plot/inspector/PlotOptionsItem.vue, src/plugins/plot/inspector/forms/SeriesForm.vue, src/plugins/plot/legend/PlotLegend.vue, src/plugins/remove/RemoveAction.js, src/plugins/tabs/components/TabsComponent.vue, src/ui/components/ObjectView.vue, src/ui/layout/BrowseBar.vue, src/ui/layout/MctTree.vue, src/ui/layout/RecentObjectsList.vue

### 断言级测试 diff（未遮蔽）

> 断言增删：+0 / -0；来源：compare_cache。

```diff
（包含该定位器的 hunk 内未改动断言级代码。）
```

---
## rb026 — nasa/openmct (playwright)

- 测试文件：`e2e/tests/functional/plugins/plot/autoscale.e2e.spec.js` 第 81 行
- 旧定位器：`page.waitForSelector('.c-message-banner__message', { state: 'detached' })`
- 旧测试行：`await page.waitForSelector('.c-message-banner__message', { state: 'detached' });`
- 新定位器：`page.locator('.c-message-banner__message')`
- Commit：test(e2e): Major refactor and stabilization of e2e tests (#7581)
- Commit 说明：* fix: update broken locator
  
  * update eslint package
  
  * first pass of lint fixes
  
  * update package
  
  * change ruleset
  
  * update component tests to match linting rules
  
  * driveby
  
  * start to factor out bad locators
  
  * update gauge component
  
  * update notebook snapshot drop area
  
  * Update plot aria
  
  * add draggable true to tree items
  
  * update package
  
  * driveby to remove dead code
  
  * unneeded
  
  * unneeded
  
  * tells a screenreader that this is a row and a cell
  
  * adds an id for dragondrops
  
  * this should be a button
  
  * first pass at fixing tooltip selectors
  
  * review comments
  
  * Updating more tests
  
  * update to remove expect expect given our use of check functions
  
  * add expand component
  
  * move role around
  
  * update more locators
  
  * force
  
  * new local storage
  
  * remove choochoo steps
  
  * test: do `lint:fix` and also add back accidentally removed code
  
  * test: add back more removed code
  
  * test: remove `unstable` annotation from tests which are not unstable
  
  * test: remove invalid test-- the "new" time conductor doesn't allow for millisecond changes in fixed time
  
  * test: fix unstable gauge test
  
  * test: remove useless asserts-- this was secretly non-functional. now that we've fixed it, it makes no sense and just fails
  
  * test: add back accidentally removed changes
  
  * test: revert changes that break test
  
  * test: more fixes
  
  * Remove all notion of the unstable/stable e2e tests
  
  * test: eviscerate the flake with FACTS and LOGIC
  
  * test: fix anotha one
  
  * lint fixes
  
  * test: no need to wait for save dialog
  
  * test: fix more tests
  
  * lint: fix more warnings
  
  * test: fix anotha one
  
  * test: use `toHaveLength` instead of `.length).toBe()`
  
  * test: stabilize tabs view example imagery test
  
  * fix: more tests be fixed
  
  * test: more `toHaveCount()`s please
  
  * test: revert more accidentally removed fixes
  
  * test: fix selector
  
  * test: fix anotha one
  
  * update lint rules to clean up bad locators in shared fixtures
  
  * update and remove bad appActions
  
  * test: fix some restricted notebook tests
  
  * test: mass find/replace to enforce `toHaveCount()` instead of `.count()).toBe()`
  
  * Remove some bad appActions and update text
  
  * test: fix da tree tests
  
  * test: await not await await
  
  * test: fix upload plan appAction and add a11y
  
  * Updating externalFixtures with best practice locators and add missing appAction framework tests
  
  * test: fix test
  
  * test: fix appAction test for plans
  
  * test: yum yum fix'em up and get rid of some dragon drops
  
  * fix: alas, a `.only()` got my hopes up that i was done fixing tests
  
  * test: add `setTimeConductorMode` test "suite" which covers most TC related appActions
  
  * test: fix arg
  
  * test(couchdb): fix some network tests via expect polling
  
  * Stabalize visual test
  
  * getCanasPixels
  
  * test: stabilize tooltip telemetry table test, better a11y for tooltips
  
  * chore: update to use `docker compose` instead of `docker-compose`
  
  * New rules, new tests, new me
  
  * fix sort order
  
  * test: add `waitForPlotsToRender` framework test, passthru timeout override
  
  * test: remove `clockOptions` test as we have `page.clock` now
  
  * test: refactor out `overrideClock`
  
  * test: use `clock.install` instead
  
  * test: use `clock.install` instead
  
  * time clock fix
  
  * test: fix timer tests
  
  * remove ever reference to old base fixture
  
  * test: stabilize restricted notebook test
  
  * lint fixes
  
  * test: use clock.install
  
  * update timelist
  
  * test: update visual tests to use `page.clock()`, update snapshots
  
  * test: stabilize tree renaming/reordering test
  
  * a11y: add aria-label and role=region to object view
  
  * refactor: use `dragTo`
  
  * refactor: use `dragTo`, other small fixes
  
  * test: use `page.clock()` to stabilize tooltip telemetry table test
  
  * test: use web-first assertion to stabilize staleness test
  
  * test: knock out a few more `page.click`s
  
  * test: destroy all `page.click()`s
  
  * refactor: consistently use `'Ok'` instead of `'OK'` and `'Ok'` mixed
  
  * test: remove gauge aria label
  
  * test: more test fixes
  
  * test: more fixes and refactors
  
  * docs: add comment
  
  * test: refactor all instances of `dragAndDrop`
  
  * test: remove redundant test (covered in previous test steps)
  
  * test: stabilize imagery operations tests for display layout
  
  * chore: remove bad unicorn rule
  
  * chore(lint): remove unused disable directives
  
  ---------
  
  Co-authored-by: Jesse Mazzella <jesse.d.mazzella@nasa.gov>
  ---
   .circleci/config.yml                          |   8 +-
   .cspell.json                                  |  17 +-
   .eslintrc.cjs                                 |   5 +-
   .github/workflows/e2e-couchdb.yml             |   2 +-
   .github/workflows/e2e-flakefinder.yml         |   2 +-
   README.md                                     |   2 +-
   TESTING.md                                    |   4 +-
   codecov.yml                                   |   6 +-
   e2e/.eslintrc.cjs                             |  18 +-
   e2e/README.md                                 |  55 +--
   e2e/appActions.js                             | 177 +++----
   e2e/baseFixtures.js                           | 110 +----
   e2e/helper/faultUtils.js                      |   5 +-
   e2e/helper/notebookUtils.js                   |  10 +-
   e2e/helper/planningUtils.js                   |  13 +-
   e2e/package.json                              |   6 +-
   .../display_layout_with_child_layouts.json    |  10 +-
   ...isplay_layout_with_child_overlay_plot.json |   4 +-
   .../flexible_layout_with_child_layouts.json   |  10 +-
   e2e/test-data/overlay_plot_storage.json       |  10 +-
   .../overlay_plot_with_delay_storage.json      |   2 +-
   e2e/test-data/recycled_local_storage.json     |   4 +-
   e2e/tests/framework/appActions.e2e.spec.js    | 198 ++++++--
   e2e/tests/framework/baseFixtures.e2e.spec.js  |  41 +-
   .../framework/exampleTemplate.e2e.spec.js     |  41 +-
   .../generateLocalStorageData.e2e.spec.js      |  36 +-
   .../framework/pluginFixtures.e2e.spec.js      |   2 +-
   .../functional/clearDataAction.e2e.spec.js    |   2 +-
   e2e/tests/functional/couchdb.e2e.spec.js      |   6 +-
   .../sineWaveLimitProvider.e2e.spec.js         |  10 +-
   e2e/tests/functional/forms.e2e.spec.js        |  58 ++-
   e2e/tests/functional/notification.e2e.spec.js |  10 +-
   .../functional/planning/plan.e2e.spec.js      |   6 +-
   .../functional/planning/timelist.e2e.spec.js  |  22 +-
   .../timelistControlledClock.e2e.spec.js       |  56 +--
   .../functional/planning/timestrip.e2e.spec.js |  29 +-
   .../conditionSet/conditionSet.e2e.spec.js     |  80 ++--
   .../conditionSetOperations.e2e.spec.js        | 368 ++++++++++++++
   .../displayLayout/displayLayout.e2e.spec.js   | 143 +++---
   .../faultManagement.e2e.spec.js               |  16 +-
   .../flexibleLayout/flexibleLayout.e2e.spec.js |   8 +-
   .../plugins/gauge/gauge.e2e.spec.js           |  71 ++-
   .../imagery/exampleImagery.e2e.spec.js        |  31 +-
   .../exportAsJson.e2e.spec.js                  |  23 +-
   .../numericData.e2e.spec.js                   |   6 +-
   .../functional/plugins/lad/lad.e2e.spec.js    | 241 +++++-----
   .../plugins/lad/ladTable.e2e.spec.js          |   2 +-
   .../plugins/notebook/notebook.e2e.spec.js     |  38 +-
   .../notebookSnapshotImage.e2e.spec.js         |   4 +-
   .../notebook/notebookWithCouchDB.e2e.spec.js  |  24 +-
   .../notebook/restrictedNotebook.e2e.spec.js   |  54 ++-
   .../plugins/plot/autoscale.e2e.spec.js        |  15 +-
   .../plugins/plot/logPlot.e2e.spec.js          | 143 +++---
   .../plugins/plot/overlayPlot.e2e.spec.js      |  58 +--
   .../plugins/plot/plotControls.e2e.spec.js     |  11 +-
   .../plugins/plot/plotRendering.e2e.spec.js    |   8 +-
   .../plugins/plot/scatterPlot.e2e.spec.js      |  36 +-
   .../plugins/plot/stackedPlot.e2e.spec.js      |  19 +-
   .../plugins/plot/tagging.e2e.spec.js          |   2 +-
   .../reloadAction/reloadAction.e2e.spec.js     |  44 +-
   .../styling/flexLayoutStyling.e2e.spec.js     |   2 +-
   .../functional/plugins/tabs/tabs.e2e.spec.js  |   4 +-
   .../telemetryTable/telemetryTable.e2e.spec.js |  21 +-
   .../timeConductor/datepicker.e2e.spec.js      |  13 +-
   .../timeConductor/timeConductor.e2e.spec.js   |  26 -
   .../plugins/timer/timer.e2e.spec.js           |  70 +--
   .../functional/recentObjects.e2e.spec.js      |  42 +-
   e2e/tests/functional/renaming.e2e.spec.js     |  34 +-
   e2e/tests/functional/search.e2e.spec.js       |   8 +-
   e2e/tests/functional/staleness.e2e.spec.js    |   6 +-
   e2e/tests/functional/tooltips.e2e.spec.js     | 447 +++++++++---------
   e2e/tests/functional/tree.e2e.spec.js         | 161 ++++---
   e2e/tests/mobile/smoke.e2e.spec.js            |  12 +-
   .../contract/imagery.contract.perf.spec.js    |  14 +-
   .../contract/notebook.contract.perf.spec.js   |  19 +-
   .../memory/navigation.memory.perf.spec.js     |   4 +-
   e2e/tests/performance/tabs.perf.spec.js       |   2 +-
   e2e/tests/performance/tagging.perf.spec.js    |   2 +-
   .../components/header.visual.spec.js          |   1 +
   .../components/inspector.visual.spec.js       |  13 +-
   .../components/timeConductor.visual.spec.js   |  12 +-
   ...me-conductor-axis-resized-chrome-linux.png | Bin 33614 -> 31101 bytes
   .../time-conductor-realtime-chrome-linux.png  | Bin 29757 -> 27354 bytes
   .../components/tree.visual.spec.js            |  29 +-
   .../controlledClock.visual.spec.js            |   8 +-
   .../visual-a11y/displayLayout.visual.spec.js  |   8 +-
   e2e/tests/visual-a11y/notebook.visual.spec.js |  12 +-
   .../planning-timelist.visual.spec.js          |  13 +-
   .../planning-timestrip.visual.spec.js         |   6 +-
   .../visual-a11y/planning-view.visual.spec.js  |  13 +-
   package-lock.json                             | 184 ++-----
   package.json                                  |  11 +-
   src/api/forms/components/FormProperties.vue   |   2 +-
   .../forms/components/controls/FileInput.vue   |   1 +
   .../tooltips/components/TooltipComponent.vue  |  13 +-
   src/exporters/ImageExporter.js                |   2 +-
   src/plugins/LADTable/components/LadRow.vue    |   1 +
   src/plugins/LADTable/components/LadTable.vue  |  20 +-
   .../displayLayout/DisplayLayoutToolbar.js     |   2 +-
   .../components/DisplayLayout.vue              |   3 +-
   .../components/DisplayLayoutGrid.vue          |   2 +-
   src/plugins/flexibleLayout/toolbarProvider.js |   4 +-
   src/plugins/formActions/pluginSpec.js         |   4 +-
   .../gauge/components/GaugeComponent.vue       |   9 +-
   .../components/Compass/CompassRose.vue        |   5 +-
   .../styles/SavedStyleSelector.vue             |   2 +-
   .../inspectorViews/styles/SavedStylesView.vue |   4 +-
   .../notebook/components/NotebookComponent.vue |   7 +-
   .../notebook/components/NotebookEntry.vue     |   1 +
   src/plugins/persistence/couch/README.md       |  33 +-
   src/plugins/plot/MctPlot.vue                  |  21 +-
   .../plot/inspector/PlotOptionsItem.vue        |   3 +-
   .../plot/inspector/forms/SeriesForm.vue       |   3 +-
   src/plugins/plot/legend/PlotLegend.vue        |  11 +-
   src/plugins/remove/RemoveAction.js            |   2 +-
   src/plugins/tabs/components/TabsComponent.vue |   2 +-
   src/ui/components/ObjectView.vue              |  11 +-
   src/ui/layout/BrowseBar.vue                   |   2 +-
   src/ui/layout/MctTree.vue                     |   1 +
   src/ui/layout/RecentObjectsList.vue           |   2 +-
   120 files changed, 1978 insertions(+), 1834 deletions(-)
   create mode 100644 e2e/tests/functional/plugins/conditionSet/conditionSetOperations.e2e.spec.js
- 应用源码改动文件（38）：.circleci/config.yml, .cspell.json, .eslintrc.cjs, .github/workflows/e2e-couchdb.yml, .github/workflows/e2e-flakefinder.yml, README.md, TESTING.md, codecov.yml, package-lock.json, package.json, src/api/forms/components/FormProperties.vue, src/api/forms/components/controls/FileInput.vue, src/api/tooltips/components/TooltipComponent.vue, src/exporters/ImageExporter.js, src/plugins/LADTable/components/LadRow.vue, src/plugins/LADTable/components/LadTable.vue, src/plugins/displayLayout/DisplayLayoutToolbar.js, src/plugins/displayLayout/components/DisplayLayout.vue, src/plugins/displayLayout/components/DisplayLayoutGrid.vue, src/plugins/flexibleLayout/toolbarProvider.js, src/plugins/formActions/pluginSpec.js, src/plugins/gauge/components/GaugeComponent.vue, src/plugins/imagery/components/Compass/CompassRose.vue, src/plugins/inspectorViews/styles/SavedStyleSelector.vue, src/plugins/inspectorViews/styles/SavedStylesView.vue, src/plugins/notebook/components/NotebookComponent.vue, src/plugins/notebook/components/NotebookEntry.vue, src/plugins/persistence/couch/README.md, src/plugins/plot/MctPlot.vue, src/plugins/plot/inspector/PlotOptionsItem.vue, src/plugins/plot/inspector/forms/SeriesForm.vue, src/plugins/plot/legend/PlotLegend.vue, src/plugins/remove/RemoveAction.js, src/plugins/tabs/components/TabsComponent.vue, src/ui/components/ObjectView.vue, src/ui/layout/BrowseBar.vue, src/ui/layout/MctTree.vue, src/ui/layout/RecentObjectsList.vue

### 断言级测试 diff（未遮蔽）

> 断言增删：+0 / -0；来源：compare_cache。

```diff
（包含该定位器的 hunk 内未改动断言级代码。）
```

---
## rb027 — nasa/openmct (playwright)

- 测试文件：`e2e/tests/functional/plugins/plot/overlayPlot.e2e.spec.js` 第 384 行
- 旧定位器：`page.waitForSelector('.js-limit-area', { state: 'attached' })`
- 旧测试行：`await page.waitForSelector('.js-limit-area', { state: 'attached' });`
- 新定位器：`page.locator('.js-limit-area')`
- Commit：test(e2e): Major refactor and stabilization of e2e tests (#7581)
- Commit 说明：* fix: update broken locator
  
  * update eslint package
  
  * first pass of lint fixes
  
  * update package
  
  * change ruleset
  
  * update component tests to match linting rules
  
  * driveby
  
  * start to factor out bad locators
  
  * update gauge component
  
  * update notebook snapshot drop area
  
  * Update plot aria
  
  * add draggable true to tree items
  
  * update package
  
  * driveby to remove dead code
  
  * unneeded
  
  * unneeded
  
  * tells a screenreader that this is a row and a cell
  
  * adds an id for dragondrops
  
  * this should be a button
  
  * first pass at fixing tooltip selectors
  
  * review comments
  
  * Updating more tests
  
  * update to remove expect expect given our use of check functions
  
  * add expand component
  
  * move role around
  
  * update more locators
  
  * force
  
  * new local storage
  
  * remove choochoo steps
  
  * test: do `lint:fix` and also add back accidentally removed code
  
  * test: add back more removed code
  
  * test: remove `unstable` annotation from tests which are not unstable
  
  * test: remove invalid test-- the "new" time conductor doesn't allow for millisecond changes in fixed time
  
  * test: fix unstable gauge test
  
  * test: remove useless asserts-- this was secretly non-functional. now that we've fixed it, it makes no sense and just fails
  
  * test: add back accidentally removed changes
  
  * test: revert changes that break test
  
  * test: more fixes
  
  * Remove all notion of the unstable/stable e2e tests
  
  * test: eviscerate the flake with FACTS and LOGIC
  
  * test: fix anotha one
  
  * lint fixes
  
  * test: no need to wait for save dialog
  
  * test: fix more tests
  
  * lint: fix more warnings
  
  * test: fix anotha one
  
  * test: use `toHaveLength` instead of `.length).toBe()`
  
  * test: stabilize tabs view example imagery test
  
  * fix: more tests be fixed
  
  * test: more `toHaveCount()`s please
  
  * test: revert more accidentally removed fixes
  
  * test: fix selector
  
  * test: fix anotha one
  
  * update lint rules to clean up bad locators in shared fixtures
  
  * update and remove bad appActions
  
  * test: fix some restricted notebook tests
  
  * test: mass find/replace to enforce `toHaveCount()` instead of `.count()).toBe()`
  
  * Remove some bad appActions and update text
  
  * test: fix da tree tests
  
  * test: await not await await
  
  * test: fix upload plan appAction and add a11y
  
  * Updating externalFixtures with best practice locators and add missing appAction framework tests
  
  * test: fix test
  
  * test: fix appAction test for plans
  
  * test: yum yum fix'em up and get rid of some dragon drops
  
  * fix: alas, a `.only()` got my hopes up that i was done fixing tests
  
  * test: add `setTimeConductorMode` test "suite" which covers most TC related appActions
  
  * test: fix arg
  
  * test(couchdb): fix some network tests via expect polling
  
  * Stabalize visual test
  
  * getCanasPixels
  
  * test: stabilize tooltip telemetry table test, better a11y for tooltips
  
  * chore: update to use `docker compose` instead of `docker-compose`
  
  * New rules, new tests, new me
  
  * fix sort order
  
  * test: add `waitForPlotsToRender` framework test, passthru timeout override
  
  * test: remove `clockOptions` test as we have `page.clock` now
  
  * test: refactor out `overrideClock`
  
  * test: use `clock.install` instead
  
  * test: use `clock.install` instead
  
  * time clock fix
  
  * test: fix timer tests
  
  * remove ever reference to old base fixture
  
  * test: stabilize restricted notebook test
  
  * lint fixes
  
  * test: use clock.install
  
  * update timelist
  
  * test: update visual tests to use `page.clock()`, update snapshots
  
  * test: stabilize tree renaming/reordering test
  
  * a11y: add aria-label and role=region to object view
  
  * refactor: use `dragTo`
  
  * refactor: use `dragTo`, other small fixes
  
  * test: use `page.clock()` to stabilize tooltip telemetry table test
  
  * test: use web-first assertion to stabilize staleness test
  
  * test: knock out a few more `page.click`s
  
  * test: destroy all `page.click()`s
  
  * refactor: consistently use `'Ok'` instead of `'OK'` and `'Ok'` mixed
  
  * test: remove gauge aria label
  
  * test: more test fixes
  
  * test: more fixes and refactors
  
  * docs: add comment
  
  * test: refactor all instances of `dragAndDrop`
  
  * test: remove redundant test (covered in previous test steps)
  
  * test: stabilize imagery operations tests for display layout
  
  * chore: remove bad unicorn rule
  
  * chore(lint): remove unused disable directives
  
  ---------
  
  Co-authored-by: Jesse Mazzella <jesse.d.mazzella@nasa.gov>
  ---
   .circleci/config.yml                          |   8 +-
   .cspell.json                                  |  17 +-
   .eslintrc.cjs                                 |   5 +-
   .github/workflows/e2e-couchdb.yml             |   2 +-
   .github/workflows/e2e-flakefinder.yml         |   2 +-
   README.md                                     |   2 +-
   TESTING.md                                    |   4 +-
   codecov.yml                                   |   6 +-
   e2e/.eslintrc.cjs                             |  18 +-
   e2e/README.md                                 |  55 +--
   e2e/appActions.js                             | 177 +++----
   e2e/baseFixtures.js                           | 110 +----
   e2e/helper/faultUtils.js                      |   5 +-
   e2e/helper/notebookUtils.js                   |  10 +-
   e2e/helper/planningUtils.js                   |  13 +-
   e2e/package.json                              |   6 +-
   .../display_layout_with_child_layouts.json    |  10 +-
   ...isplay_layout_with_child_overlay_plot.json |   4 +-
   .../flexible_layout_with_child_layouts.json   |  10 +-
   e2e/test-data/overlay_plot_storage.json       |  10 +-
   .../overlay_plot_with_delay_storage.json      |   2 +-
   e2e/test-data/recycled_local_storage.json     |   4 +-
   e2e/tests/framework/appActions.e2e.spec.js    | 198 ++++++--
   e2e/tests/framework/baseFixtures.e2e.spec.js  |  41 +-
   .../framework/exampleTemplate.e2e.spec.js     |  41 +-
   .../generateLocalStorageData.e2e.spec.js      |  36 +-
   .../framework/pluginFixtures.e2e.spec.js      |   2 +-
   .../functional/clearDataAction.e2e.spec.js    |   2 +-
   e2e/tests/functional/couchdb.e2e.spec.js      |   6 +-
   .../sineWaveLimitProvider.e2e.spec.js         |  10 +-
   e2e/tests/functional/forms.e2e.spec.js        |  58 ++-
   e2e/tests/functional/notification.e2e.spec.js |  10 +-
   .../functional/planning/plan.e2e.spec.js      |   6 +-
   .../functional/planning/timelist.e2e.spec.js  |  22 +-
   .../timelistControlledClock.e2e.spec.js       |  56 +--
   .../functional/planning/timestrip.e2e.spec.js |  29 +-
   .../conditionSet/conditionSet.e2e.spec.js     |  80 ++--
   .../conditionSetOperations.e2e.spec.js        | 368 ++++++++++++++
   .../displayLayout/displayLayout.e2e.spec.js   | 143 +++---
   .../faultManagement.e2e.spec.js               |  16 +-
   .../flexibleLayout/flexibleLayout.e2e.spec.js |   8 +-
   .../plugins/gauge/gauge.e2e.spec.js           |  71 ++-
   .../imagery/exampleImagery.e2e.spec.js        |  31 +-
   .../exportAsJson.e2e.spec.js                  |  23 +-
   .../numericData.e2e.spec.js                   |   6 +-
   .../functional/plugins/lad/lad.e2e.spec.js    | 241 +++++-----
   .../plugins/lad/ladTable.e2e.spec.js          |   2 +-
   .../plugins/notebook/notebook.e2e.spec.js     |  38 +-
   .../notebookSnapshotImage.e2e.spec.js         |   4 +-
   .../notebook/notebookWithCouchDB.e2e.spec.js  |  24 +-
   .../notebook/restrictedNotebook.e2e.spec.js   |  54 ++-
   .../plugins/plot/autoscale.e2e.spec.js        |  15 +-
   .../plugins/plot/logPlot.e2e.spec.js          | 143 +++---
   .../plugins/plot/overlayPlot.e2e.spec.js      |  58 +--
   .../plugins/plot/plotControls.e2e.spec.js     |  11 +-
   .../plugins/plot/plotRendering.e2e.spec.js    |   8 +-
   .../plugins/plot/scatterPlot.e2e.spec.js      |  36 +-
   .../plugins/plot/stackedPlot.e2e.spec.js      |  19 +-
   .../plugins/plot/tagging.e2e.spec.js          |   2 +-
   .../reloadAction/reloadAction.e2e.spec.js     |  44 +-
   .../styling/flexLayoutStyling.e2e.spec.js     |   2 +-
   .../functional/plugins/tabs/tabs.e2e.spec.js  |   4 +-
   .../telemetryTable/telemetryTable.e2e.spec.js |  21 +-
   .../timeConductor/datepicker.e2e.spec.js      |  13 +-
   .../timeConductor/timeConductor.e2e.spec.js   |  26 -
   .../plugins/timer/timer.e2e.spec.js           |  70 +--
   .../functional/recentObjects.e2e.spec.js      |  42 +-
   e2e/tests/functional/renaming.e2e.spec.js     |  34 +-
   e2e/tests/functional/search.e2e.spec.js       |   8 +-
   e2e/tests/functional/staleness.e2e.spec.js    |   6 +-
   e2e/tests/functional/tooltips.e2e.spec.js     | 447 +++++++++---------
   e2e/tests/functional/tree.e2e.spec.js         | 161 ++++---
   e2e/tests/mobile/smoke.e2e.spec.js            |  12 +-
   .../contract/imagery.contract.perf.spec.js    |  14 +-
   .../contract/notebook.contract.perf.spec.js   |  19 +-
   .../memory/navigation.memory.perf.spec.js     |   4 +-
   e2e/tests/performance/tabs.perf.spec.js       |   2 +-
   e2e/tests/performance/tagging.perf.spec.js    |   2 +-
   .../components/header.visual.spec.js          |   1 +
   .../components/inspector.visual.spec.js       |  13 +-
   .../components/timeConductor.visual.spec.js   |  12 +-
   ...me-conductor-axis-resized-chrome-linux.png | Bin 33614 -> 31101 bytes
   .../time-conductor-realtime-chrome-linux.png  | Bin 29757 -> 27354 bytes
   .../components/tree.visual.spec.js            |  29 +-
   .../controlledClock.visual.spec.js            |   8 +-
   .../visual-a11y/displayLayout.visual.spec.js  |   8 +-
   e2e/tests/visual-a11y/notebook.visual.spec.js |  12 +-
   .../planning-timelist.visual.spec.js          |  13 +-
   .../planning-timestrip.visual.spec.js         |   6 +-
   .../visual-a11y/planning-view.visual.spec.js  |  13 +-
   package-lock.json                             | 184 ++-----
   package.json                                  |  11 +-
   src/api/forms/components/FormProperties.vue   |   2 +-
   .../forms/components/controls/FileInput.vue   |   1 +
   .../tooltips/components/TooltipComponent.vue  |  13 +-
   src/exporters/ImageExporter.js                |   2 +-
   src/plugins/LADTable/components/LadRow.vue    |   1 +
   src/plugins/LADTable/components/LadTable.vue  |  20 +-
   .../displayLayout/DisplayLayoutToolbar.js     |   2 +-
   .../components/DisplayLayout.vue              |   3 +-
   .../components/DisplayLayoutGrid.vue          |   2 +-
   src/plugins/flexibleLayout/toolbarProvider.js |   4 +-
   src/plugins/formActions/pluginSpec.js         |   4 +-
   .../gauge/components/GaugeComponent.vue       |   9 +-
   .../components/Compass/CompassRose.vue        |   5 +-
   .../styles/SavedStyleSelector.vue             |   2 +-
   .../inspectorViews/styles/SavedStylesView.vue |   4 +-
   .../notebook/components/NotebookComponent.vue |   7 +-
   .../notebook/components/NotebookEntry.vue     |   1 +
   src/plugins/persistence/couch/README.md       |  33 +-
   src/plugins/plot/MctPlot.vue                  |  21 +-
   .../plot/inspector/PlotOptionsItem.vue        |   3 +-
   .../plot/inspector/forms/SeriesForm.vue       |   3 +-
   src/plugins/plot/legend/PlotLegend.vue        |  11 +-
   src/plugins/remove/RemoveAction.js            |   2 +-
   src/plugins/tabs/components/TabsComponent.vue |   2 +-
   src/ui/components/ObjectView.vue              |  11 +-
   src/ui/layout/BrowseBar.vue                   |   2 +-
   src/ui/layout/MctTree.vue                     |   1 +
   src/ui/layout/RecentObjectsList.vue           |   2 +-
   120 files changed, 1978 insertions(+), 1834 deletions(-)
   create mode 100644 e2e/tests/functional/plugins/conditionSet/conditionSetOperations.e2e.spec.js
- 应用源码改动文件（38）：.circleci/config.yml, .cspell.json, .eslintrc.cjs, .github/workflows/e2e-couchdb.yml, .github/workflows/e2e-flakefinder.yml, README.md, TESTING.md, codecov.yml, package-lock.json, package.json, src/api/forms/components/FormProperties.vue, src/api/forms/components/controls/FileInput.vue, src/api/tooltips/components/TooltipComponent.vue, src/exporters/ImageExporter.js, src/plugins/LADTable/components/LadRow.vue, src/plugins/LADTable/components/LadTable.vue, src/plugins/displayLayout/DisplayLayoutToolbar.js, src/plugins/displayLayout/components/DisplayLayout.vue, src/plugins/displayLayout/components/DisplayLayoutGrid.vue, src/plugins/flexibleLayout/toolbarProvider.js, src/plugins/formActions/pluginSpec.js, src/plugins/gauge/components/GaugeComponent.vue, src/plugins/imagery/components/Compass/CompassRose.vue, src/plugins/inspectorViews/styles/SavedStyleSelector.vue, src/plugins/inspectorViews/styles/SavedStylesView.vue, src/plugins/notebook/components/NotebookComponent.vue, src/plugins/notebook/components/NotebookEntry.vue, src/plugins/persistence/couch/README.md, src/plugins/plot/MctPlot.vue, src/plugins/plot/inspector/PlotOptionsItem.vue, src/plugins/plot/inspector/forms/SeriesForm.vue, src/plugins/plot/legend/PlotLegend.vue, src/plugins/remove/RemoveAction.js, src/plugins/tabs/components/TabsComponent.vue, src/ui/components/ObjectView.vue, src/ui/layout/BrowseBar.vue, src/ui/layout/MctTree.vue, src/ui/layout/RecentObjectsList.vue

### 断言级测试 diff（未遮蔽）

> 断言增删：+3 / -2；来源：compare_cache。

```diff
@@ -136,8 +136,8 @@ test.describe('Overlay Plot', () => {
-    expect(await page.locator('.c-plot-limit-line').count()).toBe(0);
+    await expect(page.locator('.c-plot-limit-line')).toHaveCount(0);
@@ -200,8 +200,8 @@ test.describe('Overlay Plot', () => {
-    expect(await page.locator('.c-plot-limit-line').count()).toBe(0);
+    await expect(page.locator('.js-limit-area')).toBeAttached();
+    await expect(page.locator('.c-plot-limit-line')).toHaveCount(0);
```

---
## rb028 — nasa/openmct (playwright)

- 测试文件：`e2e/tests/functional/plugins/plot/overlayPlot.e2e.spec.js` 第 56 行
- 旧定位器：`page.locator('.gl-plot-label > .plot-series-color-swatch')`
- 旧测试行：`const seriesColorSwatch = page.locator('.gl-plot-label > .plot-series-color-swatch');`
- 新定位器：`page.locator('.gl-plot-y-label-swatch-container > .plot-series-color-swatch')`
- Commit：[Plots] Fix wrapping of Y Axis when height is small  (#6264)
- Commit 说明：* New branch to fix y-axis icons
  
  * test: fix locator
  
  ---------
  
  Co-authored-by: Jesse Mazzella <jesse.d.mazzella@nasa.gov>
  ---
   .../plugins/plot/overlayPlot.e2e.spec.js         |  2 +-
   src/plugins/plot/axis/YAxis.vue                  | 16 +++++++++-------
   src/styles/_legacy-plots.scss                    |  8 ++++++--
   3 files changed, 16 insertions(+), 10 deletions(-)
- 应用源码改动文件（2）：src/plugins/plot/axis/YAxis.vue, src/styles/_legacy-plots.scss

### 断言级测试 diff（未遮蔽）

> 断言增删：+0 / -0；来源：compare_cache。

```diff
（包含该定位器的 hunk 内未改动断言级代码。）
```

---
## rb029 — nasa/openmct (playwright)

- 测试文件：`e2e/tests/functional/plugins/plot/plotRendering.e2e.spec.js` 第 81 行
- 旧定位器：`page.getByRole('button', { name: 'OK', exact: true })`
- 旧测试行：`await page.getByRole('button', { name: 'OK', exact: true }).click();`
- 新定位器：`page.getByRole('button', { name: 'Ok', exact: true })`
- Commit：test(e2e): Major refactor and stabilization of e2e tests (#7581)
- Commit 说明：* fix: update broken locator
  
  * update eslint package
  
  * first pass of lint fixes
  
  * update package
  
  * change ruleset
  
  * update component tests to match linting rules
  
  * driveby
  
  * start to factor out bad locators
  
  * update gauge component
  
  * update notebook snapshot drop area
  
  * Update plot aria
  
  * add draggable true to tree items
  
  * update package
  
  * driveby to remove dead code
  
  * unneeded
  
  * unneeded
  
  * tells a screenreader that this is a row and a cell
  
  * adds an id for dragondrops
  
  * this should be a button
  
  * first pass at fixing tooltip selectors
  
  * review comments
  
  * Updating more tests
  
  * update to remove expect expect given our use of check functions
  
  * add expand component
  
  * move role around
  
  * update more locators
  
  * force
  
  * new local storage
  
  * remove choochoo steps
  
  * test: do `lint:fix` and also add back accidentally removed code
  
  * test: add back more removed code
  
  * test: remove `unstable` annotation from tests which are not unstable
  
  * test: remove invalid test-- the "new" time conductor doesn't allow for millisecond changes in fixed time
  
  * test: fix unstable gauge test
  
  * test: remove useless asserts-- this was secretly non-functional. now that we've fixed it, it makes no sense and just fails
  
  * test: add back accidentally removed changes
  
  * test: revert changes that break test
  
  * test: more fixes
  
  * Remove all notion of the unstable/stable e2e tests
  
  * test: eviscerate the flake with FACTS and LOGIC
  
  * test: fix anotha one
  
  * lint fixes
  
  * test: no need to wait for save dialog
  
  * test: fix more tests
  
  * lint: fix more warnings
  
  * test: fix anotha one
  
  * test: use `toHaveLength` instead of `.length).toBe()`
  
  * test: stabilize tabs view example imagery test
  
  * fix: more tests be fixed
  
  * test: more `toHaveCount()`s please
  
  * test: revert more accidentally removed fixes
  
  * test: fix selector
  
  * test: fix anotha one
  
  * update lint rules to clean up bad locators in shared fixtures
  
  * update and remove bad appActions
  
  * test: fix some restricted notebook tests
  
  * test: mass find/replace to enforce `toHaveCount()` instead of `.count()).toBe()`
  
  * Remove some bad appActions and update text
  
  * test: fix da tree tests
  
  * test: await not await await
  
  * test: fix upload plan appAction and add a11y
  
  * Updating externalFixtures with best practice locators and add missing appAction framework tests
  
  * test: fix test
  
  * test: fix appAction test for plans
  
  * test: yum yum fix'em up and get rid of some dragon drops
  
  * fix: alas, a `.only()` got my hopes up that i was done fixing tests
  
  * test: add `setTimeConductorMode` test "suite" which covers most TC related appActions
  
  * test: fix arg
  
  * test(couchdb): fix some network tests via expect polling
  
  * Stabalize visual test
  
  * getCanasPixels
  
  * test: stabilize tooltip telemetry table test, better a11y for tooltips
  
  * chore: update to use `docker compose` instead of `docker-compose`
  
  * New rules, new tests, new me
  
  * fix sort order
  
  * test: add `waitForPlotsToRender` framework test, passthru timeout override
  
  * test: remove `clockOptions` test as we have `page.clock` now
  
  * test: refactor out `overrideClock`
  
  * test: use `clock.install` instead
  
  * test: use `clock.install` instead
  
  * time clock fix
  
  * test: fix timer tests
  
  * remove ever reference to old base fixture
  
  * test: stabilize restricted notebook test
  
  * lint fixes
  
  * test: use clock.install
  
  * update timelist
  
  * test: update visual tests to use `page.clock()`, update snapshots
  
  * test: stabilize tree renaming/reordering test
  
  * a11y: add aria-label and role=region to object view
  
  * refactor: use `dragTo`
  
  * refactor: use `dragTo`, other small fixes
  
  * test: use `page.clock()` to stabilize tooltip telemetry table test
  
  * test: use web-first assertion to stabilize staleness test
  
  * test: knock out a few more `page.click`s
  
  * test: destroy all `page.click()`s
  
  * refactor: consistently use `'Ok'` instead of `'OK'` and `'Ok'` mixed
  
  * test: remove gauge aria label
  
  * test: more test fixes
  
  * test: more fixes and refactors
  
  * docs: add comment
  
  * test: refactor all instances of `dragAndDrop`
  
  * test: remove redundant test (covered in previous test steps)
  
  * test: stabilize imagery operations tests for display layout
  
  * chore: remove bad unicorn rule
  
  * chore(lint): remove unused disable directives
  
  ---------
  
  Co-authored-by: Jesse Mazzella <jesse.d.mazzella@nasa.gov>
  ---
   .circleci/config.yml                          |   8 +-
   .cspell.json                                  |  17 +-
   .eslintrc.cjs                                 |   5 +-
   .github/workflows/e2e-couchdb.yml             |   2 +-
   .github/workflows/e2e-flakefinder.yml         |   2 +-
   README.md                                     |   2 +-
   TESTING.md                                    |   4 +-
   codecov.yml                                   |   6 +-
   e2e/.eslintrc.cjs                             |  18 +-
   e2e/README.md                                 |  55 +--
   e2e/appActions.js                             | 177 +++----
   e2e/baseFixtures.js                           | 110 +----
   e2e/helper/faultUtils.js                      |   5 +-
   e2e/helper/notebookUtils.js                   |  10 +-
   e2e/helper/planningUtils.js                   |  13 +-
   e2e/package.json                              |   6 +-
   .../display_layout_with_child_layouts.json    |  10 +-
   ...isplay_layout_with_child_overlay_plot.json |   4 +-
   .../flexible_layout_with_child_layouts.json   |  10 +-
   e2e/test-data/overlay_plot_storage.json       |  10 +-
   .../overlay_plot_with_delay_storage.json      |   2 +-
   e2e/test-data/recycled_local_storage.json     |   4 +-
   e2e/tests/framework/appActions.e2e.spec.js    | 198 ++++++--
   e2e/tests/framework/baseFixtures.e2e.spec.js  |  41 +-
   .../framework/exampleTemplate.e2e.spec.js     |  41 +-
   .../generateLocalStorageData.e2e.spec.js      |  36 +-
   .../framework/pluginFixtures.e2e.spec.js      |   2 +-
   .../functional/clearDataAction.e2e.spec.js    |   2 +-
   e2e/tests/functional/couchdb.e2e.spec.js      |   6 +-
   .../sineWaveLimitProvider.e2e.spec.js         |  10 +-
   e2e/tests/functional/forms.e2e.spec.js        |  58 ++-
   e2e/tests/functional/notification.e2e.spec.js |  10 +-
   .../functional/planning/plan.e2e.spec.js      |   6 +-
   .../functional/planning/timelist.e2e.spec.js  |  22 +-
   .../timelistControlledClock.e2e.spec.js       |  56 +--
   .../functional/planning/timestrip.e2e.spec.js |  29 +-
   .../conditionSet/conditionSet.e2e.spec.js     |  80 ++--
   .../conditionSetOperations.e2e.spec.js        | 368 ++++++++++++++
   .../displayLayout/displayLayout.e2e.spec.js   | 143 +++---
   .../faultManagement.e2e.spec.js               |  16 +-
   .../flexibleLayout/flexibleLayout.e2e.spec.js |   8 +-
   .../plugins/gauge/gauge.e2e.spec.js           |  71 ++-
   .../imagery/exampleImagery.e2e.spec.js        |  31 +-
   .../exportAsJson.e2e.spec.js                  |  23 +-
   .../numericData.e2e.spec.js                   |   6 +-
   .../functional/plugins/lad/lad.e2e.spec.js    | 241 +++++-----
   .../plugins/lad/ladTable.e2e.spec.js          |   2 +-
   .../plugins/notebook/notebook.e2e.spec.js     |  38 +-
   .../notebookSnapshotImage.e2e.spec.js         |   4 +-
   .../notebook/notebookWithCouchDB.e2e.spec.js  |  24 +-
   .../notebook/restrictedNotebook.e2e.spec.js   |  54 ++-
   .../plugins/plot/autoscale.e2e.spec.js        |  15 +-
   .../plugins/plot/logPlot.e2e.spec.js          | 143 +++---
   .../plugins/plot/overlayPlot.e2e.spec.js      |  58 +--
   .../plugins/plot/plotControls.e2e.spec.js     |  11 +-
   .../plugins/plot/plotRendering.e2e.spec.js    |   8 +-
   .../plugins/plot/scatterPlot.e2e.spec.js      |  36 +-
   .../plugins/plot/stackedPlot.e2e.spec.js      |  19 +-
   .../plugins/plot/tagging.e2e.spec.js          |   2 +-
   .../reloadAction/reloadAction.e2e.spec.js     |  44 +-
   .../styling/flexLayoutStyling.e2e.spec.js     |   2 +-
   .../functional/plugins/tabs/tabs.e2e.spec.js  |   4 +-
   .../telemetryTable/telemetryTable.e2e.spec.js |  21 +-
   .../timeConductor/datepicker.e2e.spec.js      |  13 +-
   .../timeConductor/timeConductor.e2e.spec.js   |  26 -
   .../plugins/timer/timer.e2e.spec.js           |  70 +--
   .../functional/recentObjects.e2e.spec.js      |  42 +-
   e2e/tests/functional/renaming.e2e.spec.js     |  34 +-
   e2e/tests/functional/search.e2e.spec.js       |   8 +-
   e2e/tests/functional/staleness.e2e.spec.js    |   6 +-
   e2e/tests/functional/tooltips.e2e.spec.js     | 447 +++++++++---------
   e2e/tests/functional/tree.e2e.spec.js         | 161 ++++---
   e2e/tests/mobile/smoke.e2e.spec.js            |  12 +-
   .../contract/imagery.contract.perf.spec.js    |  14 +-
   .../contract/notebook.contract.perf.spec.js   |  19 +-
   .../memory/navigation.memory.perf.spec.js     |   4 +-
   e2e/tests/performance/tabs.perf.spec.js       |   2 +-
   e2e/tests/performance/tagging.perf.spec.js    |   2 +-
   .../components/header.visual.spec.js          |   1 +
   .../components/inspector.visual.spec.js       |  13 +-
   .../components/timeConductor.visual.spec.js   |  12 +-
   ...me-conductor-axis-resized-chrome-linux.png | Bin 33614 -> 31101 bytes
   .../time-conductor-realtime-chrome-linux.png  | Bin 29757 -> 27354 bytes
   .../components/tree.visual.spec.js            |  29 +-
   .../controlledClock.visual.spec.js            |   8 +-
   .../visual-a11y/displayLayout.visual.spec.js  |   8 +-
   e2e/tests/visual-a11y/notebook.visual.spec.js |  12 +-
   .../planning-timelist.visual.spec.js          |  13 +-
   .../planning-timestrip.visual.spec.js         |   6 +-
   .../visual-a11y/planning-view.visual.spec.js  |  13 +-
   package-lock.json                             | 184 ++-----
   package.json                                  |  11 +-
   src/api/forms/components/FormProperties.vue   |   2 +-
   .../forms/components/controls/FileInput.vue   |   1 +
   .../tooltips/components/TooltipComponent.vue  |  13 +-
   src/exporters/ImageExporter.js                |   2 +-
   src/plugins/LADTable/components/LadRow.vue    |   1 +
   src/plugins/LADTable/components/LadTable.vue  |  20 +-
   .../displayLayout/DisplayLayoutToolbar.js     |   2 +-
   .../components/DisplayLayout.vue              |   3 +-
   .../components/DisplayLayoutGrid.vue          |   2 +-
   src/plugins/flexibleLayout/toolbarProvider.js |   4 +-
   src/plugins/formActions/pluginSpec.js         |   4 +-
   .../gauge/components/GaugeComponent.vue       |   9 +-
   .../components/Compass/CompassRose.vue        |   5 +-
   .../styles/SavedStyleSelector.vue             |   2 +-
   .../inspectorViews/styles/SavedStylesView.vue |   4 +-
   .../notebook/components/NotebookComponent.vue |   7 +-
   .../notebook/components/NotebookEntry.vue     |   1 +
   src/plugins/persistence/couch/README.md       |  33 +-
   src/plugins/plot/MctPlot.vue                  |  21 +-
   .../plot/inspector/PlotOptionsItem.vue        |   3 +-
   .../plot/inspector/forms/SeriesForm.vue       |   3 +-
   src/plugins/plot/legend/PlotLegend.vue        |  11 +-
   src/plugins/remove/RemoveAction.js            |   2 +-
   src/plugins/tabs/components/TabsComponent.vue |   2 +-
   src/ui/components/ObjectView.vue              |  11 +-
   src/ui/layout/BrowseBar.vue                   |   2 +-
   src/ui/layout/MctTree.vue                     |   1 +
   src/ui/layout/RecentObjectsList.vue           |   2 +-
   120 files changed, 1978 insertions(+), 1834 deletions(-)
   create mode 100644 e2e/tests/functional/plugins/conditionSet/conditionSetOperations.e2e.spec.js
- 应用源码改动文件（38）：.circleci/config.yml, .cspell.json, .eslintrc.cjs, .github/workflows/e2e-couchdb.yml, .github/workflows/e2e-flakefinder.yml, README.md, TESTING.md, codecov.yml, package-lock.json, package.json, src/api/forms/components/FormProperties.vue, src/api/forms/components/controls/FileInput.vue, src/api/tooltips/components/TooltipComponent.vue, src/exporters/ImageExporter.js, src/plugins/LADTable/components/LadRow.vue, src/plugins/LADTable/components/LadTable.vue, src/plugins/displayLayout/DisplayLayoutToolbar.js, src/plugins/displayLayout/components/DisplayLayout.vue, src/plugins/displayLayout/components/DisplayLayoutGrid.vue, src/plugins/flexibleLayout/toolbarProvider.js, src/plugins/formActions/pluginSpec.js, src/plugins/gauge/components/GaugeComponent.vue, src/plugins/imagery/components/Compass/CompassRose.vue, src/plugins/inspectorViews/styles/SavedStyleSelector.vue, src/plugins/inspectorViews/styles/SavedStylesView.vue, src/plugins/notebook/components/NotebookComponent.vue, src/plugins/notebook/components/NotebookEntry.vue, src/plugins/persistence/couch/README.md, src/plugins/plot/MctPlot.vue, src/plugins/plot/inspector/PlotOptionsItem.vue, src/plugins/plot/inspector/forms/SeriesForm.vue, src/plugins/plot/legend/PlotLegend.vue, src/plugins/remove/RemoveAction.js, src/plugins/tabs/components/TabsComponent.vue, src/ui/components/ObjectView.vue, src/ui/layout/BrowseBar.vue, src/ui/layout/MctTree.vue, src/ui/layout/RecentObjectsList.vue

### 断言级测试 diff（未遮蔽）

> 断言增删：+0 / -0；来源：compare_cache。

```diff
（包含该定位器的 hunk 内未改动断言级代码。）
```

---
## rb030 — nasa/openmct (playwright)

- 测试文件：`e2e/tests/functional/plugins/plot/plotRendering.e2e.spec.js` 第 76 行
- 旧定位器：`page.locator('[title="More options"]')`
- 旧测试行：`await page.locator('[title="More options"]').click();`
- 新定位器：`page.locator('[title="More actions"]')`
- Commit：[Flexible Layouts] Flexible Layout styling fixes (#7319)
- Commit 说明：---
   .cspell.json                                  |   4 +-
   .git-blame-ignore-revs                        |   4 +
   e2e/.percy.ci.yml                             |   7 +-
   e2e/.percy.nightly.yml                        |   4 +
   e2e/helper/stylingUtils.js                    | 104 +++++
   .../framework/exampleTemplate.e2e.spec.js     |   2 +-
   .../generateLocalStorageData.e2e.spec.js      |   4 +-
   .../functional/clearDataAction.e2e.spec.js    |   2 +-
   e2e/tests/functional/forms.e2e.spec.js        |   2 +-
   .../conditionSet/conditionSet.e2e.spec.js     |   4 +-
   .../flexibleLayout/flexibleLayout.e2e.spec.js |  19 +-
   .../plugins/gauge/gauge.e2e.spec.js           |   4 +-
   .../plugins/notebook/notebook.e2e.spec.js     |   2 +-
   .../notebook/notebookSnapshots.e2e.spec.js    |   6 +-
   .../notebook/restrictedNotebook.e2e.spec.js   |  10 +-
   .../plugins/notebook/tags.e2e.spec.js         |   2 +-
   .../plugins/plot/plotRendering.e2e.spec.js    |   2 +-
   .../styling/conditionalStyling.e2e.spec.js    |  48 ++
   .../styling/flexLayoutStyling.e2e.spec.js     | 414 ++++++++++++++++++
   .../styling/stackedPlotStyling.e2e.spec.js    | 246 +++++++++++
   .../styling/styleInspectorOptions.e2e.spec.js |  90 ++++
   .../plugins/timer/timer.e2e.spec.js           |   6 +-
   e2e/tests/visual-a11y/ladTable.visual.spec.js |   2 +-
   e2e/tests/visual-a11y/styling.visual.spec.js  | 194 ++++++++
   src/api/menu/components/MenuComponent.vue     |  10 +-
   src/api/menu/components/SuperMenu.vue         |  13 +-
   .../components/ContainerComponent.vue         |   9 +-
   .../components/FlexibleLayout.vue             |   3 +-
   .../TelemetryFrame.vue                        |   3 +-
   .../inspectorViews/styles/FontStyleEditor.vue |   7 +-
   .../styles/StylesInspectorViewProvider.js     |   9 +-
   .../notebook/components/NotebookEmbed.vue     |   3 +-
   src/plugins/plot/stackedPlot/StackedPlot.vue  |   3 +-
   src/ui/components/ObjectView.vue              |   6 +-
   src/ui/layout/BrowseBar.vue                   |   7 +-
   src/ui/preview/PreviewHeader.vue              |   3 +-
   src/ui/toolbar/ToolbarContainer.vue           |   2 +-
   src/ui/toolbar/components/ToolbarButton.vue   |   2 +
   .../toolbar/components/ToolbarColorPicker.vue |  16 +-
   .../toolbar/components/ToolbarSeparator.vue   |   2 +-
   40 files changed, 1222 insertions(+), 58 deletions(-)
   create mode 100644 e2e/helper/stylingUtils.js
   create mode 100644 e2e/tests/functional/plugins/styling/conditionalStyling.e2e.spec.js
   create mode 100644 e2e/tests/functional/plugins/styling/flexLayoutStyling.e2e.spec.js
   create mode 100644 e2e/tests/functional/plugins/styling/stackedPlotStyling.e2e.spec.js
   create mode 100644 e2e/tests/functional/plugins/styling/styleInspectorOptions.e2e.spec.js
   create mode 100644 e2e/tests/visual-a11y/styling.visual.spec.js
- 应用源码改动文件（18）：.cspell.json, .git-blame-ignore-revs, src/api/menu/components/MenuComponent.vue, src/api/menu/components/SuperMenu.vue, src/plugins/flexibleLayout/components/ContainerComponent.vue, src/plugins/flexibleLayout/components/FlexibleLayout.vue, src/plugins/inspectorDataVisualization/TelemetryFrame.vue, src/plugins/inspectorViews/styles/FontStyleEditor.vue, src/plugins/inspectorViews/styles/StylesInspectorViewProvider.js, src/plugins/notebook/components/NotebookEmbed.vue, src/plugins/plot/stackedPlot/StackedPlot.vue, src/ui/components/ObjectView.vue, src/ui/layout/BrowseBar.vue, src/ui/preview/PreviewHeader.vue, src/ui/toolbar/ToolbarContainer.vue, src/ui/toolbar/components/ToolbarButton.vue, src/ui/toolbar/components/ToolbarColorPicker.vue, src/ui/toolbar/components/ToolbarSeparator.vue

### 断言级测试 diff（未遮蔽）

> 断言增删：+0 / -0；来源：compare_cache。

```diff
（包含该定位器的 hunk 内未改动断言级代码。）
```

---
## rb031 — tryghost/koenig (playwright)

- 测试文件：`packages/koenig-lexical/test/e2e/floating-toolbar.test.js` 第 13 行
- 旧定位器：`page.$('[data-kg-floating-toolbar]'))`
- 旧测试行：`expect(await page.$('[data-kg-floating-toolbar]')).toBeNull();`
- 新定位器：`page.locator('[data-kg-floating-toolbar]'))`
- Commit：Migration to playwright (#647)
- Commit 说明：refs TryGhost/Team#3124
  - Migration from vitest to playwright runner for e2e tests. The main reason is to enable playwright debugging tools for local development and CI.
  ---
   .github/workflows/test.yml                    |   9 +-
   packages/koenig-lexical/.gitignore            |   3 +
   packages/koenig-lexical/README.md             |  53 ++++-
   packages/koenig-lexical/package.json          |  12 +-
   packages/koenig-lexical/playwright.config.js  |  53 +++++
   packages/koenig-lexical/test/e2e-setup.js     |  15 --
   .../test/e2e/card-behaviour.test.js           | 222 ++++++++----------
   .../test/e2e/cards/audio-card.test.js         |  66 +++---
   .../test/e2e/cards/bookmark-card.test.js      |  46 ++--
   .../test/e2e/cards/button-card.test.js        |  38 +--
   .../test/e2e/cards/callout-card.test.js       |  62 ++---
   .../test/e2e/cards/code-block-card.test.js    |  28 +--
   .../test/e2e/cards/email-card.test.js         |  36 +--
   .../test/e2e/cards/email-cta-card.test.js     |  52 ++--
   .../test/e2e/cards/embed-card.test.js         |  46 ++--
   .../test/e2e/cards/file-card.test.js          |  44 ++--
   .../test/e2e/cards/gallery-card.test.js       |  40 ++--
   .../test/e2e/cards/header-card.test.js        |  45 ++--
   .../test/e2e/cards/html-card.test.js          |  27 +--
   .../test/e2e/cards/image-card.test.js         | 116 ++++-----
   .../test/e2e/cards/markdown-card.test.js      |  93 ++++----
   .../test/e2e/cards/paywall-card.test.js       |  27 +--
   .../test/e2e/cards/product-card.test.js       |  48 ++--
   .../test/e2e/cards/toggle-card.test.js        |  42 ++--
   ...ard.test.js => video-card.firefox.test.js} |  63 ++---
   .../test/e2e/editors/basic-editor.test.js     |  59 ++---
   .../test/e2e/editors/minimal-editor.test.js   |  55 ++---
   .../test/e2e/floating-toolbar.test.js         |  43 ++--
   .../test/e2e/list-behaviour.test.js           |  37 +--
   .../test/e2e/modals/UnsplashSelector.test.js  |  44 ++--
   ...js => DragDropPastePlugin.firefox.test.js} |  30 +--
   .../e2e/plugins/DragDropPastePlugin.test.js   |  34 +--
   .../e2e/plugins/DragDropReorderPlugin.test.js |  33 +--
   .../test/e2e/plugins/HtmlOutputPlugin.test.js |  23 +-
   .../e2e/plugins/RestrictContentPlugin.test.js |  37 +--
   .../test/e2e/plus-button.test.js              | 168 ++++++-------
   .../koenig-lexical/test/e2e/selection.test.js |  23 +-
   .../test/e2e/slash-menu.test.js               |  76 +++---
   .../e2e/text-transforms/code-block.test.js    |  21 +-
   .../test/e2e/text-transforms/headings.test.js |  61 ++---
   .../horizontal-line-rule.test.js              |  21 +-
   .../test/e2e/text-transforms/links.test.js    |  23 +-
   .../test/e2e/title-behaviour.test.js          |  87 +++----
   .../test/e2e/utils/getImageDimensions.test.js |  32 +--
   .../test/utils/createDataTransfer.js          |  26 --
   packages/koenig-lexical/test/utils/e2e.js     |  64 ++---
   packages/koenig-lexical/vite.config.demo.js   |   2 +-
   packages/koenig-lexical/vite.config.js        |   2 +-
   yarn.lock                                     |   3 +-
   49 files changed, 969 insertions(+), 1321 deletions(-)
   create mode 100644 packages/koenig-lexical/playwright.config.js
   delete mode 100644 packages/koenig-lexical/test/e2e-setup.js
   rename packages/koenig-lexical/test/e2e/cards/{video-card.test.js => video-card.firefox.test.js} (90%)
   rename packages/koenig-lexical/test/e2e/plugins/{DragDropPastePluginFirefox.test.js => DragDropPastePlugin.firefox.test.js} (87%)
   delete mode 100644 packages/koenig-lexical/test/utils/createDataTransfer.js
- 应用源码改动文件（8）：.github/workflows/test.yml, packages/koenig-lexical/.gitignore, packages/koenig-lexical/README.md, packages/koenig-lexical/package.json, packages/koenig-lexical/playwright.config.js, packages/koenig-lexical/vite.config.demo.js, packages/koenig-lexical/vite.config.js, yarn.lock

### 断言级测试 diff（未遮蔽）

> 断言增删：+5 / -5；来源：compare_cache。

```diff
@@ -1,27 +1,16 @@
-import {afterAll, beforeAll, beforeEach, describe, expect, it, test} from 'vitest';
+import {expect, test} from '@playwright/test';
-        expect(await page.$('[data-kg-floating-toolbar]')).toBeNull();
+        await expect(await page.locator('[data-kg-floating-toolbar]')).toHaveCount(0);
@@ -29,24 +18,24 @@ describe('Floating format toolbar', async () => {
-        expect(await page.$('[data-kg-floating-toolbar]')).not.toBeNull();
+        expect(await page.locator('[data-kg-floating-toolbar]')).not.toBeNull();
-        expect(await page.$('[data-kg-floating-toolbar]')).not.toBeNull();
+        expect(await page.locator('[data-kg-floating-toolbar]')).not.toBeNull();
-        expect(await page.$('[data-kg-floating-toolbar]')).toBeNull();
+        await expect(await page.locator('[data-kg-floating-toolbar]')).toHaveCount(0);
```

---
## rb032 — tryghost/koenig (playwright)

- 测试文件：`packages/koenig-lexical/test/e2e/floating-toolbar.test.js` 第 35 行
- 旧定位器：`page.$('[data-kg-floating-toolbar]'))`
- 旧测试行：`expect(await page.$('[data-kg-floating-toolbar]')).toBeNull();`
- 新定位器：`page.locator('[data-kg-floating-toolbar]'))`
- Commit：Migration to playwright (#647)
- Commit 说明：refs TryGhost/Team#3124
  - Migration from vitest to playwright runner for e2e tests. The main reason is to enable playwright debugging tools for local development and CI.
  ---
   .github/workflows/test.yml                    |   9 +-
   packages/koenig-lexical/.gitignore            |   3 +
   packages/koenig-lexical/README.md             |  53 ++++-
   packages/koenig-lexical/package.json          |  12 +-
   packages/koenig-lexical/playwright.config.js  |  53 +++++
   packages/koenig-lexical/test/e2e-setup.js     |  15 --
   .../test/e2e/card-behaviour.test.js           | 222 ++++++++----------
   .../test/e2e/cards/audio-card.test.js         |  66 +++---
   .../test/e2e/cards/bookmark-card.test.js      |  46 ++--
   .../test/e2e/cards/button-card.test.js        |  38 +--
   .../test/e2e/cards/callout-card.test.js       |  62 ++---
   .../test/e2e/cards/code-block-card.test.js    |  28 +--
   .../test/e2e/cards/email-card.test.js         |  36 +--
   .../test/e2e/cards/email-cta-card.test.js     |  52 ++--
   .../test/e2e/cards/embed-card.test.js         |  46 ++--
   .../test/e2e/cards/file-card.test.js          |  44 ++--
   .../test/e2e/cards/gallery-card.test.js       |  40 ++--
   .../test/e2e/cards/header-card.test.js        |  45 ++--
   .../test/e2e/cards/html-card.test.js          |  27 +--
   .../test/e2e/cards/image-card.test.js         | 116 ++++-----
   .../test/e2e/cards/markdown-card.test.js      |  93 ++++----
   .../test/e2e/cards/paywall-card.test.js       |  27 +--
   .../test/e2e/cards/product-card.test.js       |  48 ++--
   .../test/e2e/cards/toggle-card.test.js        |  42 ++--
   ...ard.test.js => video-card.firefox.test.js} |  63 ++---
   .../test/e2e/editors/basic-editor.test.js     |  59 ++---
   .../test/e2e/editors/minimal-editor.test.js   |  55 ++---
   .../test/e2e/floating-toolbar.test.js         |  43 ++--
   .../test/e2e/list-behaviour.test.js           |  37 +--
   .../test/e2e/modals/UnsplashSelector.test.js  |  44 ++--
   ...js => DragDropPastePlugin.firefox.test.js} |  30 +--
   .../e2e/plugins/DragDropPastePlugin.test.js   |  34 +--
   .../e2e/plugins/DragDropReorderPlugin.test.js |  33 +--
   .../test/e2e/plugins/HtmlOutputPlugin.test.js |  23 +-
   .../e2e/plugins/RestrictContentPlugin.test.js |  37 +--
   .../test/e2e/plus-button.test.js              | 168 ++++++-------
   .../koenig-lexical/test/e2e/selection.test.js |  23 +-
   .../test/e2e/slash-menu.test.js               |  76 +++---
   .../e2e/text-transforms/code-block.test.js    |  21 +-
   .../test/e2e/text-transforms/headings.test.js |  61 ++---
   .../horizontal-line-rule.test.js              |  21 +-
   .../test/e2e/text-transforms/links.test.js    |  23 +-
   .../test/e2e/title-behaviour.test.js          |  87 +++----
   .../test/e2e/utils/getImageDimensions.test.js |  32 +--
   .../test/utils/createDataTransfer.js          |  26 --
   packages/koenig-lexical/test/utils/e2e.js     |  64 ++---
   packages/koenig-lexical/vite.config.demo.js   |   2 +-
   packages/koenig-lexical/vite.config.js        |   2 +-
   yarn.lock                                     |   3 +-
   49 files changed, 969 insertions(+), 1321 deletions(-)
   create mode 100644 packages/koenig-lexical/playwright.config.js
   delete mode 100644 packages/koenig-lexical/test/e2e-setup.js
   rename packages/koenig-lexical/test/e2e/cards/{video-card.test.js => video-card.firefox.test.js} (90%)
   rename packages/koenig-lexical/test/e2e/plugins/{DragDropPastePluginFirefox.test.js => DragDropPastePlugin.firefox.test.js} (87%)
   delete mode 100644 packages/koenig-lexical/test/utils/createDataTransfer.js
- 应用源码改动文件（8）：.github/workflows/test.yml, packages/koenig-lexical/.gitignore, packages/koenig-lexical/README.md, packages/koenig-lexical/package.json, packages/koenig-lexical/playwright.config.js, packages/koenig-lexical/vite.config.demo.js, packages/koenig-lexical/vite.config.js, yarn.lock

### 断言级测试 diff（未遮蔽）

> 断言增删：+5 / -5；来源：compare_cache。

```diff
@@ -1,27 +1,16 @@
-import {afterAll, beforeAll, beforeEach, describe, expect, it, test} from 'vitest';
+import {expect, test} from '@playwright/test';
-        expect(await page.$('[data-kg-floating-toolbar]')).toBeNull();
+        await expect(await page.locator('[data-kg-floating-toolbar]')).toHaveCount(0);
@@ -29,24 +18,24 @@ describe('Floating format toolbar', async () => {
-        expect(await page.$('[data-kg-floating-toolbar]')).not.toBeNull();
+        expect(await page.locator('[data-kg-floating-toolbar]')).not.toBeNull();
-        expect(await page.$('[data-kg-floating-toolbar]')).not.toBeNull();
+        expect(await page.locator('[data-kg-floating-toolbar]')).not.toBeNull();
-        expect(await page.$('[data-kg-floating-toolbar]')).toBeNull();
+        await expect(await page.locator('[data-kg-floating-toolbar]')).toHaveCount(0);
```

---
## rb033 — tryghost/koenig (playwright)

- 测试文件：`packages/koenig-lexical/test/e2e/plus-button.test.js` 第 385 行
- 旧定位器：`page.locator('[data-kg-card="markdown"]'))`
- 旧测试行：`await expect(page.locator('[data-kg-card="markdown"]')).toBeVisible();`
- 新定位器：`page.locator('[data-kg-card="codeblock"]'))`
- Commit：Another fix attempt for flaky plus card button test
- Commit 说明：no issue
  
  - switched to markdown card on the assumption that the plus menu sometimes appears above the card before it collapses when leaving exit mode and so the card appears "hidden" to playwright
  ---
   packages/koenig-lexical/test/e2e/plus-button.test.js | 12 ++++++------
   1 file changed, 6 insertions(+), 6 deletions(-)
- 应用源码改动文件（0）：（无）

### 断言级测试 diff（未遮蔽）

> 断言增删：+1 / -1；来源：compare_cache。

```diff
@@ -372,21 +372,21 @@ test.describe('Plus button', async () => {
-            await expect(page.locator('[data-kg-card="markdown"]')).toBeVisible();
+            await expect(page.locator('[data-kg-card="codeblock"]')).toBeVisible();
```

---
## rb034 — tryghost/koenig (playwright)

- 测试文件：`packages/koenig-lexical/test/e2e/plus-button.test.js` 第 276 行
- 旧定位器：`page.$('[data-kg-plus-menu]'))`
- 旧测试行：`expect(await page.$('[data-kg-plus-menu]')).toBeNull();`
- 新定位器：`page.locator('[data-kg-plus-menu]'))`
- Commit：Migration to playwright (#647)
- Commit 说明：refs TryGhost/Team#3124
  - Migration from vitest to playwright runner for e2e tests. The main reason is to enable playwright debugging tools for local development and CI.
  ---
   .github/workflows/test.yml                    |   9 +-
   packages/koenig-lexical/.gitignore            |   3 +
   packages/koenig-lexical/README.md             |  53 ++++-
   packages/koenig-lexical/package.json          |  12 +-
   packages/koenig-lexical/playwright.config.js  |  53 +++++
   packages/koenig-lexical/test/e2e-setup.js     |  15 --
   .../test/e2e/card-behaviour.test.js           | 222 ++++++++----------
   .../test/e2e/cards/audio-card.test.js         |  66 +++---
   .../test/e2e/cards/bookmark-card.test.js      |  46 ++--
   .../test/e2e/cards/button-card.test.js        |  38 +--
   .../test/e2e/cards/callout-card.test.js       |  62 ++---
   .../test/e2e/cards/code-block-card.test.js    |  28 +--
   .../test/e2e/cards/email-card.test.js         |  36 +--
   .../test/e2e/cards/email-cta-card.test.js     |  52 ++--
   .../test/e2e/cards/embed-card.test.js         |  46 ++--
   .../test/e2e/cards/file-card.test.js          |  44 ++--
   .../test/e2e/cards/gallery-card.test.js       |  40 ++--
   .../test/e2e/cards/header-card.test.js        |  45 ++--
   .../test/e2e/cards/html-card.test.js          |  27 +--
   .../test/e2e/cards/image-card.test.js         | 116 ++++-----
   .../test/e2e/cards/markdown-card.test.js      |  93 ++++----
   .../test/e2e/cards/paywall-card.test.js       |  27 +--
   .../test/e2e/cards/product-card.test.js       |  48 ++--
   .../test/e2e/cards/toggle-card.test.js        |  42 ++--
   ...ard.test.js => video-card.firefox.test.js} |  63 ++---
   .../test/e2e/editors/basic-editor.test.js     |  59 ++---
   .../test/e2e/editors/minimal-editor.test.js   |  55 ++---
   .../test/e2e/floating-toolbar.test.js         |  43 ++--
   .../test/e2e/list-behaviour.test.js           |  37 +--
   .../test/e2e/modals/UnsplashSelector.test.js  |  44 ++--
   ...js => DragDropPastePlugin.firefox.test.js} |  30 +--
   .../e2e/plugins/DragDropPastePlugin.test.js   |  34 +--
   .../e2e/plugins/DragDropReorderPlugin.test.js |  33 +--
   .../test/e2e/plugins/HtmlOutputPlugin.test.js |  23 +-
   .../e2e/plugins/RestrictContentPlugin.test.js |  37 +--
   .../test/e2e/plus-button.test.js              | 168 ++++++-------
   .../koenig-lexical/test/e2e/selection.test.js |  23 +-
   .../test/e2e/slash-menu.test.js               |  76 +++---
   .../e2e/text-transforms/code-block.test.js    |  21 +-
   .../test/e2e/text-transforms/headings.test.js |  61 ++---
   .../horizontal-line-rule.test.js              |  21 +-
   .../test/e2e/text-transforms/links.test.js    |  23 +-
   .../test/e2e/title-behaviour.test.js          |  87 +++----
   .../test/e2e/utils/getImageDimensions.test.js |  32 +--
   .../test/utils/createDataTransfer.js          |  26 --
   packages/koenig-lexical/test/utils/e2e.js     |  64 ++---
   packages/koenig-lexical/vite.config.demo.js   |   2 +-
   packages/koenig-lexical/vite.config.js        |   2 +-
   yarn.lock                                     |   3 +-
   49 files changed, 969 insertions(+), 1321 deletions(-)
   create mode 100644 packages/koenig-lexical/playwright.config.js
   delete mode 100644 packages/koenig-lexical/test/e2e-setup.js
   rename packages/koenig-lexical/test/e2e/cards/{video-card.test.js => video-card.firefox.test.js} (90%)
   rename packages/koenig-lexical/test/e2e/plugins/{DragDropPastePluginFirefox.test.js => DragDropPastePlugin.firefox.test.js} (87%)
   delete mode 100644 packages/koenig-lexical/test/utils/createDataTransfer.js
- 应用源码改动文件（8）：.github/workflows/test.yml, packages/koenig-lexical/.gitignore, packages/koenig-lexical/README.md, packages/koenig-lexical/package.json, packages/koenig-lexical/playwright.config.js, packages/koenig-lexical/vite.config.demo.js, packages/koenig-lexical/vite.config.js, yarn.lock

### 断言级测试 diff（未遮蔽）

> 断言增删：+14 / -14；来源：compare_cache。

```diff
@@ -203,51 +191,51 @@ describe('Plus button', async () => {
-            expect(await page.$('[data-kg-plus-menu]')).toBeNull();
+            await expect(await page.locator('[data-kg-plus-menu]')).toHaveCount(0);
-            expect(await page.$('[data-kg-plus-menu]')).not.toBeNull();
+            expect(await page.locator('[data-kg-plus-menu]')).not.toBeNull();
-            expect(await page.$('[data-kg-plus-menu]')).not.toBeNull();
+            expect(await page.locator('[data-kg-plus-menu]')).not.toBeNull();
-            expect(await page.$('[data-kg-plus-menu]')).toBeNull();
+            await expect(await page.locator('[data-kg-plus-menu]')).toHaveCount(0);
-            expect(await page.$('[data-kg-plus-menu]')).not.toBeNull();
+            expect(await page.locator('[data-kg-plus-menu]')).not.toBeNull();
-            expect(await page.$('[data-kg-plus-menu]')).not.toBeNull();
+            expect(await page.locator('[data-kg-plus-menu]')).not.toBeNull();
-            expect(await page.$('[data-kg-plus-menu]')).toBeNull();
+            await expect(await page.locator('[data-kg-plus-menu]')).toHaveCount(0);
-            expect(await page.$('[data-kg-plus-menu]')).not.toBeNull();
+            expect(await page.locator('[data-kg-plus-menu]')).not.toBeNull();
@@ -279,22 +267,22 @@ describe('Plus button', async () => {
-            expect(await page.$('[data-kg-plus-menu]')).not.toBeNull();
+            expect(await page.locator('[data-kg-plus-menu]')).not.toBeNull();
-            expect(await page.$('[data-kg-plus-menu]')).toBeNull();
+            await expect(await page.locator('[data-kg-plus-menu]')).toHaveCount(0);
-            expect(await page.$('[data-kg-plus-menu]')).not.toBeNull();
+            expect(await page.locator('[data-kg-plus-menu]')).not.toBeNull();
@@ -305,8 +293,8 @@ describe('Plus button', async () => {
-            expect(await page.$('[data-kg-plus-menu]')).toBeNull();
-            expect(await page.$('[data-kg-plus-button]')).not.toBeNull();
+            await expect(await page.locator('[data-kg-plus-menu]')).toHaveCount(0);
+            expect(await page.locator('[data-kg-plus-button]')).not.toBeNull();
@@ -315,17 +303,17 @@ describe('Plus button', async () => {
-            expect(await page.$('[data-kg-plus-menu]')).toBeNull();
+            await expect(await page.locator('[data-kg-plus-menu]')).toHaveCount(0);
```

---
## rb035 — tryghost/koenig (playwright)

- 测试文件：`packages/koenig-lexical/test/e2e/cards/audio-card.test.js` 第 361 行
- 旧定位器：`page.waitForSelector('[data-kg-cardmenu-selected="true"]')`
- 旧测试行：`await page.waitForSelector('[data-kg-cardmenu-selected="true"]');`
- 新定位器：`page.locator('[data-kg-cardmenu-selected="true"]')`
- Commit：Fixed flaky E2E tests for snippet insertion, toolbar clicks, and emoji picker
- Commit 说明：- Fixed snippet menu race condition across 13 test files by waiting for the
    correct menu item text instead of any selected item (the unfiltered menu
    briefly appears before React re-renders with filtered results)
  - Fixed toolbar button instability in createSnippet helper and product card
    test by adding stabilization waits after card state transitions
  - Fixed emoji picker punctuation test by adding typing delay and processing
    wait to match other emoji tests
  - Fixed email card display mode test by waiting for editing state before
    pressing ArrowDown
  ---
   packages/koenig-lexical/test/e2e/cards/audio-card.test.js | 2 +-
   .../test/e2e/cards/bookmark-card-with-search.test.js      | 2 +-
   .../test/e2e/cards/bookmark-card-without-search.test.js   | 2 +-
   .../koenig-lexical/test/e2e/cards/button-card.test.js     | 2 +-
   .../koenig-lexical/test/e2e/cards/callout-card.test.js    | 2 +-
   packages/koenig-lexical/test/e2e/cards/email-card.test.js | 7 +++++--
   .../koenig-lexical/test/e2e/cards/email-cta-card.test.js  | 2 +-
   packages/koenig-lexical/test/e2e/cards/embed-card.test.js | 2 +-
   packages/koenig-lexical/test/e2e/cards/html-card.test.js  | 2 +-
   packages/koenig-lexical/test/e2e/cards/image-card.test.js | 2 +-
   .../koenig-lexical/test/e2e/cards/product-card.test.js    | 8 ++++++--
   .../koenig-lexical/test/e2e/cards/toggle-card.test.js     | 2 +-
   .../test/e2e/cards/video-card.firefox.test.js             | 2 +-
   .../test/e2e/plugins/EmojiPickerPlugin.test.js            | 4 +++-
   .../test/e2e/plugins/KoenigSnippetPlugin.test.js          | 2 +-
   packages/koenig-lexical/test/utils/e2e.js                 | 3 +++
   16 files changed, 29 insertions(+), 17 deletions(-)
- 应用源码改动文件（0）：（无）

### 断言级测试 diff（未遮蔽）

> 断言增删：+1 / -0；来源：compare_cache。

```diff
@@ -358,7 +358,7 @@ test.describe('Audio card', async () => {
+        await expect(page.locator('[data-kg-cardmenu-selected="true"]').filter({hasText: 'snippet'})).toBeVisible();
```

---
## rb036 — tryghost/koenig (playwright)

- 测试文件：`packages/koenig-lexical/test/e2e/cards/audio-card.test.js` 第 176 行
- 旧定位器：`page.getByTestId('audio-caption')`
- 旧测试行：`expect(await page.getByTestId('audio-caption').inputValue()).toEqual('Audio sample 1');`
- 新定位器：`page.getByTestId('audio-title')`
- Commit：Swapped audio-caption testid for more accurately named audio-title
- Commit 说明：no issue
  
  - insurance against confusion if a caption field is added to audio cards in the future
  ---
   .../src/components/ui/cards/AudioCard.jsx     |  2 +-
   .../test/e2e/cards/audio-card.test.js         | 22 +++++++++----------
   2 files changed, 12 insertions(+), 12 deletions(-)
- 应用源码改动文件（1）：packages/koenig-lexical/src/components/ui/cards/AudioCard.jsx

### 断言级测试 diff（未遮蔽）

> 断言增删：+10 / -10；来源：compare_cache。

```diff
@@ -77,8 +77,8 @@ test.describe('Audio card', async () => {
-        await expect(await page.getByTestId('audio-caption')).toBeVisible();
-        expect(await page.getByTestId('audio-caption').inputValue()).toEqual('Audio sample');
+        await expect(await page.getByTestId('audio-title')).toBeVisible();
+        expect(await page.getByTestId('audio-title').inputValue()).toEqual('Audio sample');
@@ -168,12 +168,12 @@ test.describe('Audio card', async () => {
-        await expect(await page.getByTestId('audio-caption')).toBeVisible();
+        await expect(await page.getByTestId('audio-title')).toBeVisible();
-        expect(await page.getByTestId('audio-caption').inputValue()).toEqual('Audio sample 1');
+        expect(await page.getByTestId('audio-title').inputValue()).toEqual('Audio sample 1');
@@ -254,7 +254,7 @@ test.describe('Audio card', async () => {
-        await expect(await page.getByTestId('audio-caption')).toBeVisible();
+        await expect(await page.getByTestId('audio-title')).toBeVisible();
@@ -266,7 +266,7 @@ test.describe('Audio card', async () => {
-        await expect(await page.getByTestId('audio-caption')).toBeVisible();
+        await expect(await page.getByTestId('audio-title')).toBeVisible();
@@ -292,8 +292,8 @@ test.describe('Audio card', async () => {
-        // Caption input should be read only
-        await expect(await page.getByTestId('audio-caption')).toHaveAttribute('readOnly', '');
+        // Title input should be read only
+        await expect(await page.getByTestId('audio-title')).toHaveAttribute('readOnly', '');
@@ -348,8 +348,8 @@ test.describe('Audio card', async () => {
-        await expect(await page.getByTestId('audio-caption')).toBeVisible();
-        expect(await page.getByTestId('audio-caption').inputValue()).toEqual('Audio sample');
+        await expect(await page.getByTestId('audio-title')).toBeVisible();
+        expect(await page.getByTestId('audio-title').inputValue()).toEqual('Audio sample');
```

---
## rb037 — tryghost/koenig (playwright)

- 测试文件：`packages/koenig-lexical/test/e2e/cards/audio-card.test.js` 第 257 行
- 旧定位器：`page.getByTestId('audio-caption'))`
- 旧测试行：`await expect(await page.getByTestId('audio-caption')).toBeVisible();`
- 新定位器：`page.getByTestId('audio-title'))`
- Commit：Swapped audio-caption testid for more accurately named audio-title
- Commit 说明：no issue
  
  - insurance against confusion if a caption field is added to audio cards in the future
  ---
   .../src/components/ui/cards/AudioCard.jsx     |  2 +-
   .../test/e2e/cards/audio-card.test.js         | 22 +++++++++----------
   2 files changed, 12 insertions(+), 12 deletions(-)
- 应用源码改动文件（1）：packages/koenig-lexical/src/components/ui/cards/AudioCard.jsx

### 断言级测试 diff（未遮蔽）

> 断言增删：+10 / -10；来源：compare_cache。

```diff
@@ -77,8 +77,8 @@ test.describe('Audio card', async () => {
-        await expect(await page.getByTestId('audio-caption')).toBeVisible();
-        expect(await page.getByTestId('audio-caption').inputValue()).toEqual('Audio sample');
+        await expect(await page.getByTestId('audio-title')).toBeVisible();
+        expect(await page.getByTestId('audio-title').inputValue()).toEqual('Audio sample');
@@ -168,12 +168,12 @@ test.describe('Audio card', async () => {
-        await expect(await page.getByTestId('audio-caption')).toBeVisible();
+        await expect(await page.getByTestId('audio-title')).toBeVisible();
-        expect(await page.getByTestId('audio-caption').inputValue()).toEqual('Audio sample 1');
+        expect(await page.getByTestId('audio-title').inputValue()).toEqual('Audio sample 1');
@@ -254,7 +254,7 @@ test.describe('Audio card', async () => {
-        await expect(await page.getByTestId('audio-caption')).toBeVisible();
+        await expect(await page.getByTestId('audio-title')).toBeVisible();
@@ -266,7 +266,7 @@ test.describe('Audio card', async () => {
-        await expect(await page.getByTestId('audio-caption')).toBeVisible();
+        await expect(await page.getByTestId('audio-title')).toBeVisible();
@@ -292,8 +292,8 @@ test.describe('Audio card', async () => {
-        // Caption input should be read only
-        await expect(await page.getByTestId('audio-caption')).toHaveAttribute('readOnly', '');
+        // Title input should be read only
+        await expect(await page.getByTestId('audio-title')).toHaveAttribute('readOnly', '');
@@ -348,8 +348,8 @@ test.describe('Audio card', async () => {
-        await expect(await page.getByTestId('audio-caption')).toBeVisible();
-        expect(await page.getByTestId('audio-caption').inputValue()).toEqual('Audio sample');
+        await expect(await page.getByTestId('audio-title')).toBeVisible();
+        expect(await page.getByTestId('audio-title').inputValue()).toEqual('Audio sample');
```

---
## rb038 — tryghost/koenig (playwright)

- 测试文件：`packages/koenig-lexical/test/e2e/cards/audio-card.test.js` 第 269 行
- 旧定位器：`page.getByTestId('audio-caption'))`
- 旧测试行：`await expect(await page.getByTestId('audio-caption')).toBeVisible();`
- 新定位器：`page.getByTestId('audio-title'))`
- Commit：Swapped audio-caption testid for more accurately named audio-title
- Commit 说明：no issue
  
  - insurance against confusion if a caption field is added to audio cards in the future
  ---
   .../src/components/ui/cards/AudioCard.jsx     |  2 +-
   .../test/e2e/cards/audio-card.test.js         | 22 +++++++++----------
   2 files changed, 12 insertions(+), 12 deletions(-)
- 应用源码改动文件（1）：packages/koenig-lexical/src/components/ui/cards/AudioCard.jsx

### 断言级测试 diff（未遮蔽）

> 断言增删：+10 / -10；来源：compare_cache。

```diff
@@ -77,8 +77,8 @@ test.describe('Audio card', async () => {
-        await expect(await page.getByTestId('audio-caption')).toBeVisible();
-        expect(await page.getByTestId('audio-caption').inputValue()).toEqual('Audio sample');
+        await expect(await page.getByTestId('audio-title')).toBeVisible();
+        expect(await page.getByTestId('audio-title').inputValue()).toEqual('Audio sample');
@@ -168,12 +168,12 @@ test.describe('Audio card', async () => {
-        await expect(await page.getByTestId('audio-caption')).toBeVisible();
+        await expect(await page.getByTestId('audio-title')).toBeVisible();
-        expect(await page.getByTestId('audio-caption').inputValue()).toEqual('Audio sample 1');
+        expect(await page.getByTestId('audio-title').inputValue()).toEqual('Audio sample 1');
@@ -254,7 +254,7 @@ test.describe('Audio card', async () => {
-        await expect(await page.getByTestId('audio-caption')).toBeVisible();
+        await expect(await page.getByTestId('audio-title')).toBeVisible();
@@ -266,7 +266,7 @@ test.describe('Audio card', async () => {
-        await expect(await page.getByTestId('audio-caption')).toBeVisible();
+        await expect(await page.getByTestId('audio-title')).toBeVisible();
@@ -292,8 +292,8 @@ test.describe('Audio card', async () => {
-        // Caption input should be read only
-        await expect(await page.getByTestId('audio-caption')).toHaveAttribute('readOnly', '');
+        // Title input should be read only
+        await expect(await page.getByTestId('audio-title')).toHaveAttribute('readOnly', '');
@@ -348,8 +348,8 @@ test.describe('Audio card', async () => {
-        await expect(await page.getByTestId('audio-caption')).toBeVisible();
-        expect(await page.getByTestId('audio-caption').inputValue()).toEqual('Audio sample');
+        await expect(await page.getByTestId('audio-title')).toBeVisible();
+        expect(await page.getByTestId('audio-title').inputValue()).toEqual('Audio sample');
```

---
## rb039 — tryghost/koenig (playwright)

- 测试文件：`packages/koenig-lexical/test/e2e/cards/bookmark-card-with-search.test.js` 第 244 行
- 旧定位器：`page.waitForSelector('[data-kg-cardmenu-selected="true"]')`
- 旧测试行：`await page.waitForSelector('[data-kg-cardmenu-selected="true"]');`
- 新定位器：`page.locator('[data-kg-cardmenu-selected="true"]')`
- Commit：Fixed flaky E2E tests for snippet insertion, toolbar clicks, and emoji picker
- Commit 说明：- Fixed snippet menu race condition across 13 test files by waiting for the
    correct menu item text instead of any selected item (the unfiltered menu
    briefly appears before React re-renders with filtered results)
  - Fixed toolbar button instability in createSnippet helper and product card
    test by adding stabilization waits after card state transitions
  - Fixed emoji picker punctuation test by adding typing delay and processing
    wait to match other emoji tests
  - Fixed email card display mode test by waiting for editing state before
    pressing ArrowDown
  ---
   packages/koenig-lexical/test/e2e/cards/audio-card.test.js | 2 +-
   .../test/e2e/cards/bookmark-card-with-search.test.js      | 2 +-
   .../test/e2e/cards/bookmark-card-without-search.test.js   | 2 +-
   .../koenig-lexical/test/e2e/cards/button-card.test.js     | 2 +-
   .../koenig-lexical/test/e2e/cards/callout-card.test.js    | 2 +-
   packages/koenig-lexical/test/e2e/cards/email-card.test.js | 7 +++++--
   .../koenig-lexical/test/e2e/cards/email-cta-card.test.js  | 2 +-
   packages/koenig-lexical/test/e2e/cards/embed-card.test.js | 2 +-
   packages/koenig-lexical/test/e2e/cards/html-card.test.js  | 2 +-
   packages/koenig-lexical/test/e2e/cards/image-card.test.js | 2 +-
   .../koenig-lexical/test/e2e/cards/product-card.test.js    | 8 ++++++--
   .../koenig-lexical/test/e2e/cards/toggle-card.test.js     | 2 +-
   .../test/e2e/cards/video-card.firefox.test.js             | 2 +-
   .../test/e2e/plugins/EmojiPickerPlugin.test.js            | 4 +++-
   .../test/e2e/plugins/KoenigSnippetPlugin.test.js          | 2 +-
   packages/koenig-lexical/test/utils/e2e.js                 | 3 +++
   16 files changed, 29 insertions(+), 17 deletions(-)
- 应用源码改动文件（0）：（无）

### 断言级测试 diff（未遮蔽）

> 断言增删：+1 / -0；来源：compare_cache。

```diff
@@ -241,7 +241,7 @@ test.describe('Bookmark card (with searchLinks)', async () => {
+        await expect(page.locator('[data-kg-cardmenu-selected="true"]').filter({hasText: 'snippet'})).toBeVisible();
```

---
## rb040 — tryghost/koenig (playwright)

- 测试文件：`packages/koenig-lexical/test/e2e/cards/bookmark-card-without-search.test.js` 第 238 行
- 旧定位器：`page.waitForSelector('[data-kg-cardmenu-selected="true"]')`
- 旧测试行：`await page.waitForSelector('[data-kg-cardmenu-selected="true"]');`
- 新定位器：`page.locator('[data-kg-cardmenu-selected="true"]')`
- Commit：Fixed flaky E2E tests for snippet insertion, toolbar clicks, and emoji picker
- Commit 说明：- Fixed snippet menu race condition across 13 test files by waiting for the
    correct menu item text instead of any selected item (the unfiltered menu
    briefly appears before React re-renders with filtered results)
  - Fixed toolbar button instability in createSnippet helper and product card
    test by adding stabilization waits after card state transitions
  - Fixed emoji picker punctuation test by adding typing delay and processing
    wait to match other emoji tests
  - Fixed email card display mode test by waiting for editing state before
    pressing ArrowDown
  ---
   packages/koenig-lexical/test/e2e/cards/audio-card.test.js | 2 +-
   .../test/e2e/cards/bookmark-card-with-search.test.js      | 2 +-
   .../test/e2e/cards/bookmark-card-without-search.test.js   | 2 +-
   .../koenig-lexical/test/e2e/cards/button-card.test.js     | 2 +-
   .../koenig-lexical/test/e2e/cards/callout-card.test.js    | 2 +-
   packages/koenig-lexical/test/e2e/cards/email-card.test.js | 7 +++++--
   .../koenig-lexical/test/e2e/cards/email-cta-card.test.js  | 2 +-
   packages/koenig-lexical/test/e2e/cards/embed-card.test.js | 2 +-
   packages/koenig-lexical/test/e2e/cards/html-card.test.js  | 2 +-
   packages/koenig-lexical/test/e2e/cards/image-card.test.js | 2 +-
   .../koenig-lexical/test/e2e/cards/product-card.test.js    | 8 ++++++--
   .../koenig-lexical/test/e2e/cards/toggle-card.test.js     | 2 +-
   .../test/e2e/cards/video-card.firefox.test.js             | 2 +-
   .../test/e2e/plugins/EmojiPickerPlugin.test.js            | 4 +++-
   .../test/e2e/plugins/KoenigSnippetPlugin.test.js          | 2 +-
   packages/koenig-lexical/test/utils/e2e.js                 | 3 +++
   16 files changed, 29 insertions(+), 17 deletions(-)
- 应用源码改动文件（0）：（无）

### 断言级测试 diff（未遮蔽）

> 断言增删：+1 / -0；来源：compare_cache。

```diff
@@ -235,7 +235,7 @@ test.describe('Bookmark card', async () => {
+        await expect(page.locator('[data-kg-cardmenu-selected="true"]').filter({hasText: 'snippet'})).toBeVisible();
```

---

