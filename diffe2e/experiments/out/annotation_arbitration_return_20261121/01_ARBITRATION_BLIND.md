# 仲裁第一阶段（盲判）

规则：只看本文件材料，**不要**打开 `02_ARBITRATION_INFORMED.md`；8 条全部填完后记录本文件 SHA-256，再进入第二阶段。

- RQ2 填 `y` 或 `n`（语义相关：生成的测试是否真的验证了这次变更）
- RQ3 填 `STRUCTURAL_ONLY` / `EXPECTATION_CHANGE` / `SUSPECTED_REGRESSION` 三选一
- 两可时按保守规则：RQ2 倾向 `n`；RQ3 倾向 `SUSPECTED_REGRESSION`
- 每条一行理由

## rq2_007

- 变更文件：`packages/desktop-client/src/components/rules/RuleEditor.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/rules/RuleEditor.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/rules/RuleEditor.tsx b/packages/desktop-client/src/components/rules/RuleEditor.tsx
index 77bdc7ed1eb..b1ec683b9a3 100644
--- a/packages/desktop-client/src/components/rules/RuleEditor.tsx
+++ b/packages/desktop-client/src/components/rules/RuleEditor.tsx
@@ -1027,7 +1027,7 @@ type RuleEditorProps = {
 
 export function RuleEditor({
   rule: defaultRule,
-  onSave: originalOnSave = undefined,
+  onSave: originalOnSave,
   onDelete,
   onCancel,
   style,
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('exercises new UI elements and asserts visible outcome', async ({ page }) => {
  // Navigate to the page that contains the rule builder
  await page.goto('/');

  // Interact with the all/any conditions selector
  const conditionsOp = page.locator('[data-testid="conditions-op"]');
  await conditionsOp.selectOption('any');

  // Fill in the first condition: select field, operator, value
  const fieldSelects = page.locator('[data-testid="condition-list"] [data-testid="field-select"]');
  const opSelects = page.locator('[data-testid="condition-list"] [data-testid="op-select"]');
  const editorRows = page.locator('[data-testid="condition-list"] [data-testid="editor-row"]');

  // First condition
  await fieldSelects.nth(0).selectOption('amount');
  await opSelects.nth(0).selectOption('greaterThan');
  await editorRows.nth(0).fill('100');

  // Second condition (the second field-select exists because the list renders multiple conditions)
  await fieldSelects.nth(1).selectOption('date');
  await opSelects.nth(1).selectOption('is');
  await editorRows.nth(1).fill('today');

  // Assert that the condition list contains the entered values
  await expect(page.locator('[data-testid="condition-list"]')).toContainText('100');
  await expect(page.locator('[data-testid="condition-list"]')).toContainText('today');

  // Assert that the action split list and action list are visible
  await expect(page.locator('[data-testid="action-split-list"]')).toBeVisible();
  await expect(page.locator('[data-testid="action-list"]').first()).toBeVisible();
});
```

---

盲判：`final_blind=n`  理由：源码仅移除 RuleEditor 中 onSave 的冗余 = undefined 默认值，生成测试仅操作条件与动作列表且未触发保存逻辑，未验证本次变更。

---

## rq2_019

- 变更文件：`packages/desktop-client/src/components/formula/codeMirror-excelLanguage.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/formula/codeMirror-excelLanguage.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/formula/codeMirror-excelLanguage.tsx b/packages/desktop-client/src/components/formula/codeMirror-excelLanguage.tsx
index 41037fcb9c4..16b91360bc3 100644
--- a/packages/desktop-client/src/components/formula/codeMirror-excelLanguage.tsx
+++ b/packages/desktop-client/src/components/formula/codeMirror-excelLanguage.tsx
@@ -13,7 +13,12 @@ import {
 } from '@codemirror/language';
 import type { StreamParser } from '@codemirror/language';
 import type { Extension } from '@codemirror/state';
-import { EditorView, hoverTooltip, tooltips } from '@codemirror/view';
+import {
+  EditorView,
+  hoverTooltip,
+  tooltips,
+  ViewPlugin,
+} from '@codemirror/view';
 import type { Tooltip } from '@codemirror/view';
 import { tags } from '@lezer/highlight';
 import { t } from 'i18next';
@@ -70,20 +75,11 @@ function FieldTooltip({ label, info }: { label: string; info: string }) {
 
 type FormulaMode = 'query' | 'transaction';
 
-// Function categories for different syntax highlighting
 const MATH_FUNCTIONS = new Set([
   'SUM',
   'AVERAGE',
-  'AVERAGEA',
-  'COUNT',
-  'COUNTA',
-  'COUNTBLANK',
-  'COUNTIF',
-  'COUNTIFS',
   'MAX',
-  'MAXA',
   'MIN',
-  'MINA',
   'ABS',
   'ROUND',
   'ROUNDUP',
@@ -105,19 +101,6 @@ const MATH_FUNCTIONS = new Set([
   'LOG10',
   'EXP',
   'PRODUCT',
-  'SUMIF',
-  'SUMIFS',
-  'SUMPRODUCT',
-  'SUMSQ',
-  'MEDIAN',
-  'MODE',
-  'STDEV',
-  'STDEVP',
-  'VAR',
-  'VARP',
-  'PERCENTILE',
-  'QUARTILE',
-  'RANK',
   'PMT',
   'FV',
   'PV',
@@ -143,6 +126,8 @@ const LOGICAL_FUNCTIONS = new Set([
 const TEXT_FUNCTIONS = new Set([
   'TEXT',
   'FIXED',
+  'FORMATNUMBER',
+  'FORMATCURRENCY',
   'CONCATENATE',
   'LEFT',
   'RIGHT',
@@ -192,11 +177,6 @@ const QUERY_FUNCTIONS = new Set([
   'QUERY_EXTRACT_CATEGORIES',
   'QUERY_EXTRACT_TIMEFRAME_START',
   'QUERY_EXTRACT_TIMEFRAME_END',
-  'LOOKUP',
-  'VLOOKUP',
-  'HLOOKUP',
-  'INDEX',
-  'MATCH',
   'CHOOSE',
   'ISBLANK',
   'ISERROR',
@@ -204,7 +184,6 @@ const QUERY_FUNCTIONS = new Set([
   'ISNUMBER',
   'ISTEXT',
   'ISLOGICAL',
-  'ISREF',
   'ISEVEN',
   'ISODD',
 ]);
@@ -296,7 +275,7 @@ const transactionFields: Completion[] = [
     section: '💰 Transaction Fields',
     boost: 5,
     info: t(
-      'Transaction amount in cents. Use for calculations and comparisons.\n\nExample: `=amount / 100` to get dollar value',
+      'Transaction amount in cents. Use for calculations and comparisons.\n\nExample: =amount / 100 to get dollar value',
     ),
   },
   {
@@ -305,7 +284,7 @@ const transactionFields: Completion[] = [
     section: '💰 Transaction Fields',
     boost: 5,
     info: t(
-      'Transaction date in YYYY-MM-DD format. Use with date functions.\n\nExample: `=TEXT(date, "MMMM")` to get month name',
+      'Transaction date in YYYY-MM-DD format. Use with date functions.\n\nExample: =TEXT(date, "MMMM") to get month name',
     ),
   },
   {
@@ -314,7 +293,7 @@ const transactionFields: Completion[] = [
     section: '💰 Transaction Fields',
     boost: 5,
     info: t(
-      'Transaction notes/memo text. Use for string operations.\n\nExample: `=UPPER(notes)` to convert to uppercase',
+      'Transaction notes/memo text. Use for string operations.\n\nExample: =UPPER(notes) to convert to uppercase',
     ),
   },
   {
@@ -323,7 +302,7 @@ const transactionFields: Completion[] = [
     section: '💰 Transaction Fields',
     boost: 5,
     info: t(
-      'Original imported payee name from bank import. Contains the raw text before matching.\n\nExample: `=LEFT(imported_payee, 10)` to get first 10 characters',
+      'Original imported payee name from bank import. Contains the raw text before matching.\n\nExample: =LEFT(imported_payee, 10) to get first 10 characters',
     ),
   },
   {
@@ -332,7 +311,7 @@ const transactionFields: Completion[] = [
     section: '💰 Transaction Fields',
     boost: 5,
     info: t(
-      'Payee ID (string). The ID of the payee.\n\nExample: `=CONCATENATE("Payment to ", payee)`',
+      'Payee ID (string). The ID of the payee.\n\nExample: =CONCATENATE("Payment to ", payee)',
     ),
   },
   {
@@ -341,7 +320,7 @@ const transactionFields: Completion[] = [
     section: '💰 Transaction Fields',
     boost: 5,
     info: t(
-      'Payee name (string). The human-readable name of the payee.\n\nExample: `=UPPER(payee_name)` or `=CONCATENATE("Payment to ", payee_name)`',
+      'Payee name (string). The human-readable name of the payee.\n\nExample: =UPPER(payee_name) or =CONCATENATE("Payment to ", payee_name)',
     ),
   },
   {
@@ -350,7 +329,7 @@ const transactionFields: Completion[] = [
     section: '💰 Transaction Fields',
     boost: 5,
     info: t(
-      'Account ID (string). The ID of the account.\n\nExample: `=CONCATENATE("Paid from ", account)`',
+      'Account ID (string). The ID of the account.\n\nExample: =CONCATENATE("Paid from ", account)',
     ),
   },
   {
@@ -359,7 +338,7 @@ const transactionFields: Completion[] = [
     section: '💰 Transaction Fields',
     boost: 5,
     info: t(
-      'Account name (string). The human-readable name of the account.\n\nExample: `=CONCATENATE("Paid from ", account_name)`',
+      'Account name (string). The human-readable name of the account.\n\nExample: =CONCATENATE("Paid from ", account_name)',
     ),
   },
   {
@@ -368,7 +347,7 @@ const transactionFields: Completion[] = [
     section: '💰 Transaction Fields',
     boost: 5,
     info: t(
-      'Category ID (string). The ID of the category.\n\nExample: `=IF(category="Groceries", "Food", "Other")`',
+      'Category ID (string). The ID of the category.\n\nExample: =IF(category="Groceries", "Food", "Other")',
     ),
   },
   {
@@ -377,7 +356,7 @@ const transactionFields: Completion[] = [
     section: '💰 Transaction Fields',
     boost: 5,
     info: t(
-      'Category Name (string). The human-readable name of the category.\n\nExample: `=IF(category_name="Groceries", "Food", "Other")`',
+      'Category Name (string). The human-readable name of the category.\n\nExample: =IF(category_name="Groceries", "Food", "Other")',
     ),
   },
   {
@@ -386,7 +365,7 @@ const transactionFields: Completion[] = [
     section: '💰 Transaction Fields',
     boost: 5,
     info: t(
-      'Boolean cleared status. TRUE if transaction is cleared, FALSE otherwise.\n\nExample: `=IF(cleared, "Cleared", "Pending")`',
+      'Boolean cleared status. TRUE if transaction is cleared, FALSE otherwise.\n\nExample: =IF(cleared, "Cleared", "Pending")',
     ),
   },
   {
@@ -404,7 +383,7 @@ const transactionFields: Completion[] = [
     section: '💰 Transaction Fields',
     boost: 5,
     info: t(
-      'Account balance as of the date of the transaction, excluding the transaction amount. Use for calculations and comparisons.\n\nExample: `=IF(balance < 0, "Negative Balance", "Positive Balance")`',
+      'Account balance as of the date of the transaction, excluding the transaction amount. Use for calculations and comparisons.\n\nExample: =IF(balance < 0, "Negative Balance", "Positive Balance")',
     ),
   },
   {
@@ -413,7 +392,7 @@ const transactionFields: Completion[] = [
     section: '💰 Transaction Fields',
     boost: 5,
     info: t(
-      'The amount of the parent transaction in cents in split transactions.\n\nExample: `=(parent_amount / 100) * .05`',
+      'The amount of the parent transaction in cents in split transactions.\n\nExample: =(parent_amount / 100) * .05',
     ),
   },
 ];
@@ -710,6 +689,7 @@ const tooltipPortalConfig =
 const autocompletePopoverTheme = EditorView.baseTheme({
   // Wrapper: keep transparent; the list and info panel are the actual "cards".
   '.cm-tooltip.cm-tooltip-autocomplete': {
+    ...styles.darkScrollbar,
     backgroundColor: 'transparent',
     border: 'none',
     boxShadow: 'none',
@@ -724,13 +704,12 @@ const autocompletePopoverTheme = EditorView.baseTheme({
   '.cm-tooltip.cm-tooltip-autocomplete > ul': {
     ...styles.shadowLarge,
     margin: 0,
-    // Outer inset gutter for the whole list (so content never hugs the edges)
-    padding: '12px',
+    padding: '5px 0',
     maxHeight: '260px',
     minWidth: '280px',
     listStyle: 'none',
-    backgroundColor: theme.menuBackground,
-    color: theme.menuItemText,
+    backgroundColor: theme.menuAutoCompleteBackground,
+    color: theme.menuAutoCompleteText,
     borderRadius: '6px',
     overflow: 'hidden',
     overflowY: 'auto',
@@ -748,44 +727,64 @@ const autocompletePopoverTheme = EditorView.baseTheme({
   },
 
   // Section headers
-  '.cm-tooltip.cm-tooltip-autocomplete li.cm-completionSection': {
-    padding: '6px 10px 4px',
-    fontSize: '11px',
-    lineHeight: '1em',
-    textTransform: 'uppercase',
-    letterSpacing: '0.03em',
-    color: theme.menuItemTextHeader,
-    opacity: 0.9,
-    marginTop: '8px',
-  },
-  '.cm-tooltip.cm-tooltip-autocomplete li.cm-completionSection:first-child': {
-    marginTop: 0,
-  },
-
+  '.cm-tooltip.cm-tooltip-autocomplete > ul > completion-section, .cm-tooltip.cm-tooltip-autocomplete li.cm-completionSection':
+    {
+      padding: '7px 12px 3px !important',
+      paddingLeft: '12px !important',
+      paddingRight: '12px !important',
+      fontSize: '11px',
+      lineHeight: '1em',
+      textTransform: 'uppercase',
+      letterSpacing: '0.03em',
+      color: theme.menuItemTextHeader,
+      opacity: '1 !important',
+      marginTop: '8px',
+      position: 'sticky',
+      top: 0,
+      backgroundColor: theme.menuAutoCompleteBackground,
+      borderTop: 'none !important',
+      borderBottom: 'none !important',
+      zIndex: 1,
+    },
+  '.cm-tooltip.cm-tooltip-autocomplete > ul > completion-section:first-child, .cm-tooltip.cm-tooltip-autocomplete li.cm-completionSection:first-child':
+    {
+      marginTop: 0,
+    },
+  '.cm-tooltip.cm-tooltip-autocomplete > ul > completion-section::before, .cm-tooltip.cm-tooltip-autocomplete > ul > completion-section::after, .cm-tooltip.cm-tooltip-autocomplete li.cm-completionSection::before, .cm-tooltip.cm-tooltip-autocomplete li.cm-completionSection::after':
+    {
+      display: 'none !important',
+    },
   // Completion rows
+  '.cm-tooltip.cm-tooltip-autocomplete li.cm-completionItem, .cm-tooltip.cm-tooltip-autocomplete li[role="option"]':
+    {
+      padding: '5px 14px !important',
+      paddingLeft: '14px !important',
+      paddingRight: '14px !important',
+      lineHeight: '1.2',
+      cursor: 'default',
+      display: 'flex',
+      alignItems: 'baseline',
+      gap: '8px',
+      borderRadius: 0,
+    },
+
   '.cm-tooltip.cm-tooltip-autocomplete li.cm-completionItem': {
-    padding: '8px 10px',
     lineHeight: '1.2',
     cursor: 'default',
     display: 'flex',
     alignItems: 'baseline',
     gap: '8px',
-    borderRadius: '4px',
+    borderRadius: 0,
   },
 
-  '.cm-tooltip.cm-tooltip-autocomplete > ul > completion-section, .cm-tooltip.cm-tooltip-autocomplete li.cm-completionSection':
+  '.cm-tooltip.cm-tooltip-autocomplete li.cm-completionItem[aria-selected], .cm-tooltip.cm-tooltip-autocomplete li.cm-completionItem:hover, .cm-tooltip.cm-tooltip-autocomplete li.cm-completionItem-hover':
     {
-      padding: '0 !important',
-      position: 'sticky',
-      top: 0,
-      backgroundColor: theme.menuBackground,
-      opacity: '1 !important',
-      zIndex: 1,
+      backgroundColor: theme.menuAutoCompleteBackgroundHover,
+      color: theme.menuAutoCompleteItemTextHover,
     },
-
-  '.cm-tooltip.cm-tooltip-autocomplete li.cm-completionItem[aria-selected]': {
-    backgroundColor: theme.menuItemBackgroundHover,
-    color: theme.menuItemTextHover,
+  '.cm-tooltip.cm-tooltip-autocomplete li[role="option"]:hover': {
+    backgroundColor: theme.menuAutoCompleteBackgroundHover,
+    color: theme.menuAutoCompleteItemTextHover,
   },
 
   // Matched text within a label
@@ -811,7 +810,7 @@ const autocompletePopoverTheme = EditorView.baseTheme({
   },
   '.cm-tooltip.cm-tooltip-autocomplete li.cm-completionItem[aria-selected] .cm-completionDetail':
     {
-      color: theme.menuItemTextHover,
+      color: theme.menuAutoCompleteItemTextHover,
     },
 
   // Docs panel for selected completion
@@ -830,6 +829,202 @@ const autocompletePopoverTheme = EditorView.baseTheme({
   },
 });
 
+//hack: this is a workaround to forward the pointer events to the completion item.
+//isPointInsideRect / findAutocompleteElementAtPoint / autocompletePopoverPointerHandler are needed to forward the pointer events to the completion item.
+//Otherwise the mouse interactions will not work as expected.
+function isPointInsideRect(x: number, y: number, rect: DOMRect) {
+  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
+}
+
+function findAutocompleteElementAtPoint(
+  document: Document,
+  selector: string,
+  x: number,
+  y: number,
+) {
+  return Array.from(document.querySelectorAll(selector)).find(element =>
+    isPointInsideRect(x, y, element.getBoundingClientRect()),
+  );
+}
+
+const autocompletePopoverPointerHandler = ViewPlugin.define(view => {
+  let hoveredCompletionItem: HTMLElement | null = null;
+
+  function setHoveredCompletionItem(completionItem: HTMLElement | null) {
+    if (hoveredCompletionItem === completionItem) {
+      return;
+    }
+
+    hoveredCompletionItem?.classList.remove('cm-completionItem-hover');
+    hoveredCompletionItem = completionItem;
+    hoveredCompletionItem?.classList.add('cm-completionItem-hover');
+  }
+
+  const handleWheel = (event: WheelEvent) => {
+    if (!(event.target instanceof Element)) {
+      return;
+    }
+
+    let scrollContainer: Element | null | undefined = event.target.closest(
+      '.cm-tooltip.cm-tooltip-autocomplete > ul',
+    );
+    if (!(scrollContainer instanceof HTMLElement)) {
+      // React Aria modals use the browser top layer, so wheel events can target
+      // modal content even when the autocomplete list is visually under the pointer.
+      scrollContainer = findAutocompleteElementAtPoint(
+        view.dom.ownerDocument,
+        '.cm-tooltip.cm-tooltip-autocomplete > ul',
+        event.clientX,
+        event.clientY,
+      );
+    }
+
+    if (!(scrollContainer instanceof HTMLElement)) {
+      return;
+    }
+
+    const canScrollY =
+      scrollContainer.scrollHeight > scrollContainer.clientHeight;
+    const canScrollX =
+      scrollContainer.scrollWidth > scrollContainer.clientWidth;
+    if (!canScrollY && !canScrollX) {
+      return;
+    }
+
+    const deltaMultiplier =
+      event.deltaMode === WheelEvent.DOM_DELTA_LINE
+        ? 16
+        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
+          ? scrollContainer.clientHeight
+          : 1;
+
+    const previousScrollTop = scrollContainer.scrollTop;
+    const previousScrollLeft = scrollContainer.scrollLeft;
+
+    scrollContainer.scrollTop += event.deltaY * deltaMultiplier;
+    scrollContainer.scrollLeft += event.deltaX * deltaMultiplier;
+
+    if (
+      scrollContainer.scrollTop !== previousScrollTop ||
+      scrollContainer.scrollLeft !== previousScrollLeft
+    ) {
+      event.preventDefault();
+      event.stopPropagation();
+    }
+  };
+
+  const handleMouseDown = (event: MouseEvent) => {
+    if (!(event.target instanceof Element)) {
+      return;
+    }
+
+    if (event.target.closest('.cm-tooltip.cm-tooltip-autocomplete')) {
+      return;
+    }
+
+    const completionItem = findAutocompleteElementAtPoint(
+      view.dom.ownerDocument,
+      '.cm-tooltip.cm-tooltip-autocomplete li[role="option"], .cm-tooltip.cm-tooltip-autocomplete li.cm-completionItem',
+      event.clientX,
+      event.clientY,
+    );
+
+    if (!(completionItem instanceof HTMLElement)) {
+      setHoveredCompletionItem(null);
+      return;
+    }
+
+    setHoveredCompletionItem(completionItem);
+
+    completionItem.dispatchEvent(
+      new MouseEvent(event.type, {
+        bubbles: true,
+        cancelable: true,
+        view: view.dom.ownerDocument.defaultView,
+        clientX: event.clientX,
+        clientY: event.clientY,
+        screenX: event.screenX,
+        screenY: event.screenY,
+        button: event.button,
+        buttons: event.buttons,
+        ctrlKey: event.ctrlKey,
+        shiftKey: event.shiftKey,
+        altKey: event.altKey,
+        metaKey: event.metaKey,
+      }),
+    );
+    event.preventDefault();
+    event.stopPropagation();
+  };
+
+  const handleMouseMove = (event: MouseEvent) => {
+    if (!(event.target instanceof Element)) {
+      return;
+    }
+
+    if (event.target.closest('.cm-tooltip.cm-tooltip-autocomplete')) {
+      return;
+    }
+
+    const completionItem = findAutocompleteElementAtPoint(
+      view.dom.ownerDocument,
+      '.cm-tooltip.cm-tooltip-autocomplete li[role="option"], .cm-tooltip.cm-tooltip-autocomplete li.cm-completionItem',
+      event.clientX,
+      event.clientY,
+    );
+
+    if (!(completionItem instanceof HTMLElement)) {
+      return;
+    }
+
+    completionItem.dispatchEvent(
+      new MouseEvent(event.type, {
+        bubbles: true,
+        cancelable: true,
+        view: view.dom.ownerDocument.defaultView,
+        clientX: event.clientX,
+        clientY: event.clientY,
+        screenX: event.screenX,
+        screenY: event.screenY,
+        button: event.button,
+        buttons: event.buttons,
+        ctrlKey: event.ctrlKey,
+        shiftKey: event.shiftKey,
+        altKey: event.altKey,
+        metaKey: event.metaKey,
+      }),
+    );
+  };
+
+  view.dom.ownerDocument.addEventListener('wheel', handleWheel, {
+    capture: true,
+    passive: false,
+  });
+  view.dom.ownerDocument.addEventListener('mousedown', handleMouseDown, {
+    capture: true,
+    passive: false,
+  });
+  view.dom.ownerDocument.addEventListener('mousemove', handleMouseMove, {
+    capture: true,
+    passive: true,
+  });
+
+  return {
+    destroy() {
+      view.dom.ownerDocument.removeEventListener('wheel', handleWheel, {
+        capture: true,
+      });
+      view.dom.ownerDocument.removeEventListener('mousedown', handleMouseDown, {
+        capture: true,
+      });
+      view.dom.ownerDocument.removeEventListener('mousemove', handleMouseMove, {
+        capture: true,
+      });
+      setHoveredCompletionItem(null);
+    },
+  };
+});
+
 // Custom theme for categorized function highlighting (light)
 const functionCategoryTheme = EditorView.baseTheme({
   '&light .cm-keyword': { color: '#0066CC' }, // Math functions in blue
@@ -890,5 +1085,6 @@ export function excelFormulaExtension(
     tooltipZIndexTheme,
     tooltipPortalConfig,
     autocompletePopoverTheme,
+    autocompletePopoverPointerHandler,
   ];
 }
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('functiontooltip is visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('functiontooltip')).toBeVisible();
});
```

---

盲判：`final_blind=n`  理由：测试仅在首页断言不存在的自定义标签 functiontooltip 可见，未进入公式编辑器，也未验证函数列表、补全弹窗样式或指针事件转发等任何本次变更。

---

## rq2_023

- 变更文件：`packages/desktop-client/src/components/reports/reports/FormulaCard.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/reports/reports/FormulaCard.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/reports/reports/FormulaCard.tsx b/packages/desktop-client/src/components/reports/reports/FormulaCard.tsx
index a81103c3279..903c3bea74e 100644
--- a/packages/desktop-client/src/components/reports/reports/FormulaCard.tsx
+++ b/packages/desktop-client/src/components/reports/reports/FormulaCard.tsx
@@ -39,6 +39,7 @@ export function FormulaCard({
   const fontSize = meta?.fontSize;
   const fontSizeMode = meta?.fontSizeMode || 'dynamic';
   const staticFontSize = meta?.staticFontSize || 32;
+  const showTitle = meta?.showTitle ?? true;
   const colorFormula = meta?.colorFormula || '';
 
   const { result, isLoading, error } = useFormulaExecution(
@@ -77,10 +78,14 @@ export function FormulaCard({
       disableClick={nameMenuOpen}
       to={`/reports/formula/${widgetId}`}
       menuItems={[
-        {
-          name: 'rename',
-          text: t('Rename'),
-        },
+        ...(showTitle
+          ? [
+              {
+                name: 'rename',
+                text: t('Rename'),
+              },
+            ]
+          : []),
         {
           name: 'remove',
           text: t('Remove'),
@@ -102,20 +107,22 @@ export function FormulaCard({
       }}
     >
       <View style={{ flex: 1, overflow: 'hidden' }}>
-        <View style={{ flexGrow: 0, flexShrink: 0, padding: 20 }}>
-          <ReportCardName
-            name={meta?.name || t('Formula')}
-            isEditing={nameMenuOpen}
-            onChange={newName => {
-              onMetaChange({
-                ...meta,
-                name: newName,
-              });
-              setNameMenuOpen(false);
-            }}
-            onClose={() => setNameMenuOpen(false)}
-          />
-        </View>
+        {showTitle && (
+          <View style={{ flexGrow: 0, flexShrink: 0, padding: 20 }}>
+            <ReportCardName
+              name={meta?.name || t('Formula')}
+              isEditing={nameMenuOpen}
+              onChange={newName => {
+                onMetaChange({
+                  ...meta,
+                  name: newName,
+                });
+                setNameMenuOpen(false);
+              }}
+              onClose={() => setNameMenuOpen(false)}
+            />
+          </View>
+        )}
         <View
           ref={containerRef}
           style={{
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('should interact with reportcardname element and show visible outcome', async ({ page }) => {
  await page.goto('/');
  const reportCardName = page.locator('[tag="reportcardname"]');
  await expect(reportCardName).toBeVisible();
  await reportCardName.fill('Math Report');
  await expect(reportCardName).toHaveValue('Math Report');
});
```

---

盲判：`final_blind=n`  理由：本次变更核心是 showTitle 控制标题与重命名菜单的条件渲染，而测试使用伪定位器 [tag="reportcardname"] 执行填值断言，未验证 showTitle 显隐逻辑。

---

## rq2_025

- 变更文件：`packages/desktop-client/src/components/autocomplete/CategoryAutocomplete.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/autocomplete/CategoryAutocomplete.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/autocomplete/CategoryAutocomplete.tsx b/packages/desktop-client/src/components/autocomplete/CategoryAutocomplete.tsx
index 4f7980c1c11..8eeebb4924f 100644
--- a/packages/desktop-client/src/components/autocomplete/CategoryAutocomplete.tsx
+++ b/packages/desktop-client/src/components/autocomplete/CategoryAutocomplete.tsx
@@ -1,4 +1,4 @@
-import React, { Fragment, useCallback, useMemo } from 'react';
+import React, { Fragment, useMemo } from 'react';
 import type {
   ComponentProps,
   ComponentPropsWithoutRef,
@@ -23,7 +23,6 @@ import type {
   CategoryGroupEntity,
 } from '@actual-app/core/types/models';
 import { css, cx } from '@emotion/css';
-import { Fzf } from 'fzf';
 
 import { useEnvelopeSheetValue } from '#components/budget/envelope/EnvelopeBudgetComponents';
 import { makeAmountFullStyle } from '#components/budget/util';
@@ -34,6 +33,7 @@ import { useSyncedPref } from '#hooks/useSyncedPref';
 import { envelopeBudget, trackingBudget } from '#spreadsheet/bindings';
 
 import { Autocomplete } from './Autocomplete';
+import { filterCategorySuggestions } from './filterCategorySuggestions';
 import { ItemHeader } from './ItemHeader';
 
 type CategoryAutocompleteItem = Omit<CategoryEntity, 'group'> & {
@@ -249,32 +249,6 @@ export function CategoryAutocomplete({
     showHiddenCategories,
   ]);
 
-  const filterSuggestions = useCallback(
-    (
-      suggestions: CategoryAutocompleteItem[],
-      value: string,
-    ): CategoryAutocompleteItem[] => {
-      const splitItem = suggestions.find(s => s.id === 'split');
-      const realSuggestions = suggestions.filter(s => s.id !== 'split');
-
-      if (!value) {
-        return suggestions;
-      }
-
-      const filtered = new Fzf(realSuggestions, {
-        selector: item =>
-          item.group ? item.group.name + ' ' + item.name : item.name,
-        limit: 100,
-        casing: 'case-insensitive',
-      })
-        .find(value)
-        .map(result => result.item);
-
-      return splitItem ? [splitItem, ...filtered] : filtered;
-    },
-    [],
-  );
-
   return (
     <Autocomplete
       strict
@@ -290,7 +264,7 @@ export function CategoryAutocomplete({
         }
         return 0;
       }}
-      filterSuggestions={filterSuggestions}
+      filterSuggestions={filterCategorySuggestions}
       suggestions={categorySuggestions}
       renderItems={(items, getItemProps, highlightedIndex) => (
         <CategoryList
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('should display split transaction dialog after clicking the button', async ({ page }) => {
  // Locate the button using its test ID
  const splitButton = page.getByTestId('split-transaction-button');
  
  // Assert the button is visible before interaction
  await expect(splitButton).toBeVisible();
  
  // Click the button
  await splitButton.click();
  
  // Assert that a dialog (expected to appear on click) is now visible
  // Replace 'split-transaction-dialog' with the actual test ID of the visible element
  const splitDialog = page.getByTestId('split-transaction-dialog');
  await expect(splitDialog).toBeVisible();
});
```

---

盲判：`final_blind=n`  理由：源码仅将分类补全过滤函数重构提取为 filterCategorySuggestions，而测试点击虚构的拆分交易按钮并断言弹窗，与分类补全过滤行为无关。

---

## rq2_029

- 变更文件：`src/lib/components/Preset.svelte`
- 变更上下文：`mermaid_live:src/lib/components/Preset.svelte`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/src/lib/components/Preset.svelte b/src/lib/components/Preset.svelte
index 079606b2e5..8bc7784a1b 100644
--- a/src/lib/components/Preset.svelte
+++ b/src/lib/components/Preset.svelte
@@ -1,13 +1,20 @@
 <script lang="ts">
   import Card from '$/components/Card/Card.svelte';
-  import { Button } from '$/components/ui/button';
-  import { getSampleDiagrams } from '$/util/mermaid';
+  import { Button, buttonVariants } from '$/components/ui/button';
+  import * as Popover from '$/components/ui/popover';
+  import { getSampleDiagrams, type SampleExample } from '$/util/mermaid';
   import { updateCode } from '$lib/util/state.svelte';
   import { logEvent } from '$lib/util/stats';
+  import { cn } from '$lib/utils';
   import ShapesIcon from '~icons/material-symbols/account-tree-outline-rounded';
+  import ChevronDownIcon from '~icons/material-symbols/keyboard-arrow-down-rounded';
 
-  const extras = {
-    ZenUML: `zenuml
+  const extras: Record<string, SampleExample[]> = {
+    ZenUML: [
+      {
+        title: 'Order Service',
+        isDefault: true,
+        code: `zenuml
     title Order Service
     @Actor Client #FFEBE6
     @Boundary OrderController #0747A6
@@ -25,21 +32,24 @@
         if(order != null) {
           par {
             PurchaseService.createPO(order)
-            InvoiceService.createInvoice(order)      
-          }      
+            InvoiceService.createInvoice(order)
+          }
         }
       }
     }
     `
+      }
+    ]
   };
 
-  const samples = { ...getSampleDiagrams(), ...extras } as const;
-  const loadSampleDiagram = (diagramType: string): void => {
-    updateCode(samples[diagramType as keyof typeof samples], {
+  const samples = { ...getSampleDiagrams(), ...extras };
+
+  const loadSampleDiagram = (diagramType: string, example: SampleExample): void => {
+    updateCode(example.code, {
       resetPanZoom: true,
       updateDiagram: true
     });
-    logEvent('loadSampleDiagram', { diagramType });
+    logEvent('loadSampleDiagram', { diagramType, exampleTitle: example.title });
   };
 
   const mainDiagrams = [
@@ -62,12 +72,39 @@
 <Card title="Sample Diagrams" isOpen isStackable icon={{ component: ShapesIcon }}>
   <div class="flex h-fit max-h-52 flex-wrap gap-2 overflow-y-auto p-2">
     {#each diagramOrder as sample (sample)}
-      <Button
-        size="sm"
-        class="w-fit min-w-20 flex-grow normal-case"
-        onclick={() => loadSampleDiagram(sample)}>
-        {sample}
-      </Button>
+      {@const examples = samples[sample]}
+      <div class="flex min-w-20 flex-grow">
+        <Button
+          size="sm"
+          class={cn('flex-grow normal-case', examples.length > 1 && 'rounded-r-none')}
+          onclick={() => loadSampleDiagram(sample, examples[0])}>
+          {sample}
+        </Button>
+        {#if examples.length > 1}
+          <Popover.Root>
+            <Popover.Trigger
+              aria-label="Choose a {sample} example"
+              class={cn(
+                buttonVariants({ size: 'sm' }),
+                'rounded-l-none border-l border-primary-foreground/30 px-0.5 [&_svg]:size-5'
+              )}>
+              <ChevronDownIcon />
+            </Popover.Trigger>
+            <Popover.Content align="start" class="flex w-fit flex-col gap-1 p-1">
+              {#each examples as example (example.title)}
+                <Popover.Close
+                  class={cn(
+                    buttonVariants({ variant: 'ghost', size: 'sm' }),
+                    'justify-start normal-case'
+                  )}
+                  onclick={() => loadSampleDiagram(sample, example)}>
+                  {example.title}
+                </Popover.Close>
+              {/each}
+            </Popover.Content>
+          </Popover.Root>
+        {/if}
+      </div>
     {/each}
   </div>
 </Card>
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('should open popover when trigger is clicked', async ({ page }) => {
  // Navigate to the page containing the card and popover trigger
  await page.goto('/');

  // Locate the card element (assuming it's a custom tag)
  const card = page.locator('card');
  await expect(card).toBeVisible();

  // Within the card, locate the popover trigger
  const popoverTrigger = card.locator('popover.trigger');
  await expect(popoverTrigger).toBeVisible();

  // Click the trigger to open the popover
  await popoverTrigger.click();

  // Assert that a popover element becomes visible (assuming it's a sibling or appears)
  const popover = page.locator('popover');
  await expect(popover).toBeVisible();
});
```

---

盲判：`final_blind=n`  理由：测试虽意图覆盖新增的 Popover 交互，但直接将 Svelte 组件名当作 DOM 选择器（card、popover.trigger、popover），且未验证选择示例后的图表加载逻辑，按保守规则判 n。

---

## rb021 — nasa/openmct (playwright)

- 测试文件：`e2e/tests/functional/plugins/lad/lad.e2e.spec.js` 第 71 行
- 旧定位器：`page.getByRole('cell', { name: 'Timestamp', exact: true }))`
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

### 完整旧测试块

> 提取方式：完整 `it/test` 块，第 53–172 行；共 120 行。

```js
  test('in edit mode, LAD Tables provide ability to hide columns', async ({ page }) => {
    // Edit LAD table
    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'LAD Table Configuration' }).click();

    // make sure headers are visible initially
    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();

    // hide timestamp column
    await page.getByLabel('Timestamp', { exact: true }).uncheck();
    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();

    // hide units & type column
    await page.getByLabel('Units').uncheck();
    await page.getByLabel('Type', { exact: true }).uncheck();
    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();

    // hide WATCH column
    await page.getByLabel('WATCH').uncheck();
    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();

    // save and reload and verify they columns are still hidden
    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    await page.reload();
    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();

    // Edit LAD table
    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'LAD Table Configuration' }).click();

    // show timestamp column
    await page.getByLabel('Timestamp', { exact: true }).check();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();

    // save and reload and make sure timestamp is still visible
    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    await page.reload();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();

    // Edit LAD table
    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'LAD Table Configuration' }).click();

    // show units, type, and WATCH columns
    await page.getByLabel('Units').check();
    await page.getByLabel('Type', { exact: true }).check();
    await page.getByLabel('WATCH').check();
    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();

    // save and reload and make sure all columns are still visible
    await page.locator('button[title="Save"]').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();
    await page.reload();
    await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
  })
```

### 应用源码 diff（已排除测试文件）

```diff
diff --git a/.cspell.json b/.cspell.json
index cc3394b05e..3ba2caaac6 100644
--- a/.cspell.json
+++ b/.cspell.json
@@ -482,19 +482,10 @@
     "composables",
     "countup",
     "darkmatter",
-    "Undeletes"
-  ],
-  "dictionaries": [
-    "npm",
-    "softwareTerms",
-    "node",
-    "html",
-    "css",
-    "bash",
-    "en_US",
-    "en-gb",
-    "misc"
+    "Undeletes",
+    "SSSZ"
   ],
+  "dictionaries": ["npm", "softwareTerms", "node", "html", "css", "bash", "en_US", "en-gb", "misc"],
   "ignorePaths": [
     "package.json",
     "dist/**",
@@ -505,4 +496,4 @@
     "html-test-results",
     "test-results"
   ]
-}
\ No newline at end of file
+}
diff --git a/package.json b/package.json
index 14f0b37fa3..654ddac942 100644
--- a/package.json
+++ b/package.json
@@ -40,7 +40,7 @@
     "eslint-config-prettier": "9.1.0",
     "eslint-plugin-compat": "4.2.0",
     "eslint-plugin-no-unsanitized": "4.0.2",
-    "eslint-plugin-playwright": "0.12.0",
+    "eslint-plugin-playwright": "1.5.2",
     "eslint-plugin-prettier": "5.1.3",
     "eslint-plugin-simple-import-sort": "10.0.0",
     "eslint-plugin-unicorn": "49.0.0",
@@ -116,14 +116,13 @@
     "test:e2e:a11y": "npm test --workspace e2e -- --config=playwright-visual-a11y.config.js --project=chrome --grep @a11y",
     "test:e2e:mobile": "npm test --workspace e2e -- --config=playwright-mobile.config.js",
     "test:e2e:couchdb": "npm test --workspace e2e -- --config=playwright-ci.config.js --project=chrome --grep @couchdb --workers=1",
-    "test:e2e:stable": "npm test --workspace e2e -- --config=playwright-ci.config.js --project=chrome --grep-invert \"@unstable|@couchdb|@generatedata\"",
-    "test:e2e:unstable": "npm test --workspace e2e -- --config=playwright-ci.config.js --project=chrome --grep @unstable",
+    "test:e2e:ci": "npm test --workspace e2e -- --config=playwright-ci.config.js --project=chrome --grep-invert \"@couchdb|@generatedata\"",
     "test:e2e:local": "npm test --workspace e2e -- --config=playwright-local.config.js --project=chrome",
     "test:e2e:generatedata": "npm test --workspace e2e -- --config=playwright-ci.config.js --project=chrome --grep @generatedata",
     "test:e2e:checksnapshots": "npm test --workspace e2e -- --config=playwright-ci.config.js --project=chrome --grep @snapshot --retries=0",
     "test:e2e:updatesnapshots": "npm test --workspace e2e -- --config=playwright-ci.config.js --project=chrome --grep @snapshot --update-snapshots",
-    "test:e2e:visual:ci": "npm run test:visual --workspace e2e -- --config .percy.ci.yml --partial -- npx playwright test --config=playwright-visual-a11y.config.js --project=chrome --grep-invert @unstable",
-    "test:e2e:visual:full": "npm run test:visual --workspace e2e -- --config .percy.nightly.yml -- npx playwright test --config=playwright-visual-a11y.config.js --grep-invert @unstable",
+    "test:e2e:visual:ci": "npm run test:visual --workspace e2e -- --config .percy.ci.yml --partial -- npx playwright test --config=playwright-visual-a11y.config.js --project=chrome",
+    "test:e2e:visual:full": "npm run test:visual --workspace e2e -- --config .percy.nightly.yml -- npx playwright test --config=playwright-visual-a11y.config.js",
     "test:e2e:full": "npm test --workspace e2e -- --config=playwright-ci.config.js --grep-invert @couchdb",
     "test:e2e:watch": "npm test --workspace e2e -- --ui --config=playwright-watch.config.js",
     "test:perf:contract": "npm test --workspace e2e -- --config=playwright-performance-dev.config.js",
@@ -133,7 +132,7 @@
     "update-copyright-date": "npm run update-about-dialog-copyright && grep -lr --null --include=*.{js,scss,vue,ts,sh,html,md,frag} 'Copyright (c) 20' . | xargs -r0 perl -pi -e 's/Copyright\\s\\(c\\)\\s20\\d\\d\\-20\\d\\d/Copyright \\(c\\)\\ 2014\\-2024/gm'",
     "cov:e2e:report": "nyc report --reporter=lcovonly --report-dir=./coverage/e2e",
     "cov:e2e:full:publish": "codecov --disable=gcov -f ./coverage/e2e/lcov.info -F e2e-full",
-    "cov:e2e:stable:publish": "codecov --disable=gcov -f ./coverage/e2e/lcov.info -F e2e-stable",
+    "cov:e2e:ci:publish": "codecov --disable=gcov -f ./coverage/e2e/lcov.info -F e2e-ci",
     "cov:unit:publish": "codecov --disable=gcov -f ./coverage/unit/lcov.info -F unit",
     "prepare": "npm run build:prod && npx tsc"
   },
diff --git a/src/api/forms/components/FormProperties.vue b/src/api/forms/components/FormProperties.vue
index f4ac6b23af..1e4bdf30bb 100644
--- a/src/api/forms/components/FormProperties.vue
+++ b/src/api/forms/components/FormProperties.vue
@@ -115,7 +115,7 @@ export default {
         return this.model.buttons.submit.label;
       }
 
-      return 'OK';
+      return 'Ok';
     },
     cancelLabel() {
       if (this.model.buttons && this.model.buttons.cancel && this.model.buttons.cancel.label) {
diff --git a/src/api/forms/components/controls/FileInput.vue b/src/api/forms/components/controls/FileInput.vue
index 911fdb945a..dd27d6ea3a 100644
--- a/src/api/forms/components/controls/FileInput.vue
+++ b/src/api/forms/components/controls/FileInput.vue
@@ -29,6 +29,7 @@
         type="file"
         :accept="acceptableFileTypes"
         style="display: none"
+        aria-labelledby="fileSelect"
       />
       <button id="fileSelect" class="c-button" @click="selectFile">
         {{ name }}
diff --git a/src/api/tooltips/components/TooltipComponent.vue b/src/api/tooltips/components/TooltipComponent.vue
index 48c1c74dcf..ef323bf211 100644
--- a/src/api/tooltips/components/TooltipComponent.vue
+++ b/src/api/tooltips/components/TooltipComponent.vue
@@ -20,10 +20,17 @@ this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
 -->
 <template>
-  <div ref="tooltip-wrapper" class="c-menu c-tooltip-wrapper" :style="toolTipLocationStyle">
-    <div class="c-tooltip">
+  <div
+    ref="tooltip-wrapper"
+    class="c-menu c-tooltip-wrapper"
+    :style="toolTipLocationStyle"
+    role="tooltip"
+    aria-labelledby="tooltip-text"
+    aria-live="polite"
+  >
+    <span id="tooltip-text" class="c-tooltip">
       {{ toolTipText }}
-    </div>
+    </span>
   </div>
 </template>
 
diff --git a/src/exporters/ImageExporter.js b/src/exporters/ImageExporter.js
index 421782b3c8..b04cc5df07 100644
--- a/src/exporters/ImageExporter.js
+++ b/src/exporters/ImageExporter.js
@@ -120,7 +120,7 @@ class ImageExporter {
           message: 'Image was not captured successfully!',
           buttons: [
             {
-              label: 'OK',
+              label: 'Ok',
               emphasis: true,
               callback: function () {
                 errorDialog.dismiss();
diff --git a/src/plugins/LADTable/components/LadRow.vue b/src/plugins/LADTable/components/LadRow.vue
index bad50bb024..1d27e2bbb4 100644
--- a/src/plugins/LADTable/components/LadRow.vue
+++ b/src/plugins/LADTable/components/LadRow.vue
@@ -30,6 +30,7 @@
   >
     <td
       ref="tableCell"
+      scope="row"
       aria-label="lad name"
       class="js-first-data"
       @mouseover.ctrl="showToolTip"
diff --git a/src/plugins/LADTable/components/LadTable.vue b/src/plugins/LADTable/components/LadTable.vue
index 7e9a52a0c2..fce5ec0aa5 100644
--- a/src/plugins/LADTable/components/LadTable.vue
+++ b/src/plugins/LADTable/components/LadTable.vue
@@ -21,16 +21,20 @@
 -->
 
 <template>
-  <div class="c-lad-table-wrapper u-style-receiver js-style-receiver" :class="staleClass">
-    <table aria-label="lad table" class="c-table c-lad-table" :class="applyLayoutClass">
+  <div
+    id="lad-table-drop-area"
+    class="c-lad-table-wrapper u-style-receiver js-style-receiver"
+    :class="staleClass"
+  >
+    <table class="c-table c-lad-table" :class="applyLayoutClass">
       <thead>
         <tr>
-          <th>Name</th>
-          <th v-if="showTimestamp">Timestamp</th>
-          <th>Value</th>
-          <th v-if="hasUnits">Units</th>
-          <th v-if="showType">Type</th>
-          <th v-for="limitColumn in limitColumnNames" :key="limitColumn.key">
+          <th scope="col">Name</th>
+          <th v-if="showTimestamp" scope="col">Timestamp</th>
+          <th scope="col">Value</th>
+          <th v-if="hasUnits" scope="col">Units</th>
+          <th v-if="showType" scope="col">Type</th>
+          <th v-for="limitColumn in limitColumnNames" :key="limitColumn.key" scope="col">
             {{ limitColumn.label }}
           </th>
         </tr>
diff --git a/src/plugins/displayLayout/DisplayLayoutToolbar.js b/src/plugins/displayLayout/DisplayLayoutToolbar.js
index dc1a882a23..f7d7220f5d 100644
--- a/src/plugins/displayLayout/DisplayLayoutToolbar.js
+++ b/src/plugins/displayLayout/DisplayLayoutToolbar.js
@@ -268,7 +268,7 @@ export default class DisplayLayoutToolbar {
           message: `Warning! This action will remove this item from the Display Layout. Do you want to continue?`,
           buttons: [
             {
-              label: 'OK',
+              label: 'Ok',
               emphasis: 'true',
               callback: () => {
                 this.#openmct.objectViews.emit(
diff --git a/src/plugins/displayLayout/components/DisplayLayout.vue b/src/plugins/displayLayout/components/DisplayLayout.vue
index ecddbe3268..fd5bdb3a80 100644
--- a/src/plugins/displayLayout/components/DisplayLayout.vue
+++ b/src/plugins/displayLayout/components/DisplayLayout.vue
@@ -22,6 +22,7 @@
 
 <template>
   <div
+    id="display-layout-drop-area"
     class="l-layout u-style-receiver js-style-receiver"
     :class="{
       'is-multi-selected': selectedLayoutItems.length > 1,
@@ -453,7 +454,7 @@ export default {
             message: 'This item is already in layout and will not be added again.',
             buttons: [
               {
-                label: 'OK',
+                label: 'Ok',
                 callback: function () {
                   prompt.dismiss();
                 }
diff --git a/src/plugins/displayLayout/components/DisplayLayoutGrid.vue b/src/plugins/displayLayout/components/DisplayLayoutGrid.vue
index 85ac2b18e0..df647ebcef 100644
--- a/src/plugins/displayLayout/components/DisplayLayoutGrid.vue
+++ b/src/plugins/displayLayout/components/DisplayLayoutGrid.vue
@@ -24,7 +24,7 @@
     class="l-layout__grid-holder"
     :class="{ 'c-grid': showGrid }"
     role="grid"
-    :aria-label="'Layout Grid'"
+    aria-label="Layout Grid"
     :aria-hidden="showGrid ? 'false' : 'true'"
     :aria-live="showGrid ? 'polite' : 'off'"
   >
diff --git a/src/plugins/flexibleLayout/toolbarProvider.js b/src/plugins/flexibleLayout/toolbarProvider.js
index c07b19886d..1c01c0f74a 100644
--- a/src/plugins/flexibleLayout/toolbarProvider.js
+++ b/src/plugins/flexibleLayout/toolbarProvider.js
@@ -99,7 +99,7 @@ function ToolbarProvider(openmct) {
               message: `This action will remove this frame from this Flexible Layout. Do you want to continue?`,
               buttons: [
                 {
-                  label: 'OK',
+                  label: 'Ok',
                   emphasis: 'true',
                   callback: function () {
                     openmct.objectViews.emit(
@@ -170,7 +170,7 @@ function ToolbarProvider(openmct) {
                 'This action will permanently delete this container from this Flexible Layout. Do you want to continue?',
               buttons: [
                 {
-                  label: 'OK',
+                  label: 'Ok',
                   emphasis: 'true',
                   callback: function () {
                     openmct.objectViews.emit(
diff --git a/src/plugins/formActions/pluginSpec.js b/src/plugins/formActions/pluginSpec.js
index 10b8ad6172..eaa6f575cb 100644
--- a/src/plugins/formActions/pluginSpec.js
+++ b/src/plugins/formActions/pluginSpec.js
@@ -115,7 +115,7 @@ describe('EditPropertiesAction plugin', () => {
       expect(notes.value).toEqual(domainObject.notes);
 
       const buttons = form.querySelectorAll('button');
-      expect(buttons[0].textContent.trim()).toEqual('OK');
+      expect(buttons[0].textContent.trim()).toEqual('Ok');
       expect(buttons[1].textContent.trim()).toEqual('Cancel');
 
       const clickEvent = createMouseEvent('click');
@@ -159,7 +159,7 @@ describe('EditPropertiesAction plugin', () => {
       const notes = form.querySelector('textArea');
 
       const buttons = form.querySelectorAll('button');
-      expect(buttons[0].textContent.trim()).toEqual('OK');
+      expect(buttons[0].textContent.trim()).toEqual('Ok');
       expect(buttons[1].textContent.trim()).toEqual('Cancel');
 
       expect(title.value).toEqual(domainObject.name);
diff --git a/src/plugins/gauge/components/GaugeComponent.vue b/src/plugins/gauge/components/GaugeComponent.vue
index 0984d34a9c..d14bc6c15c 100644
--- a/src/plugins/gauge/components/GaugeComponent.vue
+++ b/src/plugins/gauge/components/GaugeComponent.vue
@@ -20,18 +20,23 @@
  at runtime from the About dialog for additional information.
 -->
 <template>
+  <!-- TODO: Better a11y for Gauges. See https://github.com/nasa/openmct/issues/7790 -->
   <div
     ref="gaugeWrapper"
     class="c-gauge__wrapper js-gauge-wrapper"
     :class="gaugeClasses"
-    :aria-label="gaugeTitle"
     :title="gaugeTitle"
+    :aria-valuemin="rangeLow"
+    :aria-valuemax="rangeHigh"
+    :aria-valuenow="curVal"
+    :aria-valuetext="`Current value: ${curVal}`"
   >
     <template v-if="typeDial">
       <svg
         ref="gauge"
         class="c-gauge c-dial"
         viewBox="0 0 10 10"
+        role="meter"
         @mouseover.ctrl="showToolTip"
         @mouseleave="hideToolTip"
       >
@@ -233,7 +238,7 @@
     </template>
 
     <template v-if="typeMeter">
-      <div class="c-meter" @mouseover.ctrl="showToolTip" @mouseleave="hideToolTip">
+      <div class="c-meter" role="meter" @mouseover.ctrl="showToolTip" @mouseleave="hideToolTip">
         <div v-if="displayMinMax" class="c-gauge__range c-meter__range js-gauge-meter-range">
           <div class="c-meter__range__high">{{ rangeHigh }}</div>
           <div class="c-meter__range__low">{{ rangeLow }}</div>
diff --git a/src/plugins/imagery/components/Compass/CompassRose.vue b/src/plugins/imagery/components/Compass/CompassRose.vue
index 55f8366025..b1583f1e12 100644
--- a/src/plugins/imagery/components/Compass/CompassRose.vue
+++ b/src/plugins/imagery/components/Compass/CompassRose.vue
@@ -327,10 +327,7 @@ export default {
   },
   mounted() {
     this.debounceResizeSvg = throttle(this.resizeSvg, 100);
-
-    this.$nextTick(() => {
-      this.debounceResizeSvg();
-    });
+    this.debounceResizeSvg();
   },
   methods: {
     resizeSvg() {
diff --git a/src/plugins/inspectorViews/styles/SavedStyleSelector.vue b/src/plugins/inspectorViews/styles/SavedStyleSelector.vue
index 25227365d5..e079bd8869 100644
--- a/src/plugins/inspectorViews/styles/SavedStyleSelector.vue
+++ b/src/plugins/inspectorViews/styles/SavedStyleSelector.vue
@@ -154,7 +154,7 @@ ${font}`;
           message: message,
           buttons: [
             {
-              label: 'OK',
+              label: 'Ok',
               callback: () => {
                 dialog.dismiss();
                 resolve();
diff --git a/src/plugins/inspectorViews/styles/SavedStylesView.vue b/src/plugins/inspectorViews/styles/SavedStylesView.vue
index f62d714eba..b66b539cce 100644
--- a/src/plugins/inspectorViews/styles/SavedStylesView.vue
+++ b/src/plugins/inspectorViews/styles/SavedStylesView.vue
@@ -90,7 +90,7 @@ export default {
         message: message,
         buttons: [
           {
-            label: 'OK',
+            label: 'Ok',
             callback: () => {
               dialog.dismiss();
             }
@@ -109,7 +109,7 @@ export default {
         message: message,
         buttons: [
           {
-            label: 'OK',
+            label: 'Ok',
             callback: () => {
               dialog.dismiss();
             }
diff --git a/src/plugins/notebook/components/NotebookComponent.vue b/src/plugins/notebook/components/NotebookComponent.vue
index 3ec1dce3e3..0d9c988b34 100644
--- a/src/plugins/notebook/components/NotebookComponent.vue
+++ b/src/plugins/notebook/components/NotebookComponent.vue
@@ -98,12 +98,14 @@
           v-if="selectedPage && !selectedPage.isLocked"
           :aria-disabled="activeTransaction"
           class="c-notebook__drag-area icon-plus"
+          aria-dropeffect="link"
+          aria-labelledby="newEntryLabel"
           @click="newEntry(null, $event)"
           @dragover="dragOver"
           @drop.capture="dropCapture"
           @drop="dropOnEntry($event)"
         >
-          <span class="c-notebook__drag-area__label">
+          <span id="newEntryLabel" class="c-notebook__drag-area__label">
             To start a new entry, click here or drag and drop any object
           </span>
         </div>
@@ -150,9 +152,10 @@
           <button
             class="c-button commit-button icon-lock"
             title="Commit entries and lock this page from further changes"
+            aria-labelledby="commitEntriesLabel"
             @click="lockPage()"
           >
-            <span class="c-button__label">Commit Entries</span>
+            <span id="commitEntriesLabel" class="c-button__label">Commit Entries</span>
           </button>
         </div>
       </div>
diff --git a/src/plugins/notebook/components/NotebookEntry.vue b/src/plugins/notebook/components/NotebookEntry.vue
index 18c8860746..7a2df844bf 100644
--- a/src/plugins/notebook/components/NotebookEntry.vue
+++ b/src/plugins/notebook/components/NotebookEntry.vue
@@ -49,6 +49,7 @@
           <button
             class="c-ne__remove c-icon-button c-icon-button--major icon-trash"
             title="Delete this entry"
+            aria-label="Delete this entry"
             tabindex="-1"
             @click.stop.prevent="deleteEntry"
           ></button>
diff --git a/src/plugins/plot/MctPlot.vue b/src/plugins/plot/MctPlot.vue
index 1250e30ff1..76815cc53d 100644
--- a/src/plugins/plot/MctPlot.vue
+++ b/src/plugins/plot/MctPlot.vue
@@ -88,9 +88,15 @@
               <button
                 class="c-button icon-minus"
                 title="Zoom out"
+                aria-label="Zoom out"
                 @click="zoom('out', 0.2)"
               ></button>
-              <button class="c-button icon-plus" title="Zoom in" @click="zoom('in', 0.2)"></button>
+              <button
+                class="c-button icon-plus"
+                title="Zoom in"
+                aria-label="Zoom in"
+                @click="zoom('in', 0.2)"
+              ></button>
             </div>
             <div
               v-if="plotHistory.length && !options.compact"
@@ -98,12 +104,14 @@
             >
               <button
                 class="c-button icon-arrow-left"
-                title="Restore previous pan/zoom"
+                title="Restore previous pan and zoom"
+                aria-label="Restore previous pan and zoom"
                 @click="back()"
               ></button>
               <button
                 class="c-button icon-reset"
-                title="Reset pan/zoom"
+                title="Reset pan and zoom"
+                aria-label="Reset pan and zoom"
                 @click="resumeRealtimeData()"
               ></button>
             </div>
@@ -115,12 +123,14 @@
                 v-if="!isFrozen"
                 class="c-button icon-pause"
                 title="Pause incoming real-time data"
+                aria-label="Pause incoming real-time data"
                 @click="pause()"
               ></button>
               <button
                 v-if="isFrozen"
                 class="c-button icon-arrow-right pause-play is-paused"
                 title="Resume displaying real-time data"
+                aria-label="Resume displaying real-time data"
                 @click="resumeRealtimeData()"
               ></button>
             </div>
@@ -128,6 +138,7 @@
               <button
                 class="c-button icon-clock"
                 title="Synchronize Time Conductor"
+                aria-label="Synchronize Time Conductor"
                 @click="showSynchronizeDialog()"
               ></button>
             </div>
@@ -136,12 +147,14 @@
                 class="c-button icon-crosshair"
                 :class="{ 'is-active': cursorGuide }"
                 title="Toggle cursor guides"
+                aria-label="Toggle cursor guides"
                 @click="toggleCursorGuide"
               ></button>
               <button
                 class="c-button"
                 :class="{ 'icon-grid-on': gridLines, 'icon-grid-off': !gridLines }"
                 title="Toggle grid lines"
+                aria-label="Toggle grid lines"
                 @click="toggleGridLines"
               ></button>
             </div>
@@ -1795,7 +1808,7 @@ export default {
           message: message,
           buttons: [
             {
-              label: 'OK',
+              label: 'Ok',
               callback: () => {
                 dialog.dismiss();
                 this.synchronizeTimeConductor();
diff --git a/src/plugins/plot/inspector/PlotOptionsItem.vue b/src/plugins/plot/inspector/PlotOptionsItem.vue
index fcac8b955f..94a6857776 100644
--- a/src/plugins/plot/inspector/PlotOptionsItem.vue
+++ b/src/plugins/plot/inspector/PlotOptionsItem.vue
@@ -137,9 +137,8 @@ export default {
     },
     ariaLabelExpandCollapse() {
       const name = this.series.domainObject.name ? ` ${this.series.domainObject.name}` : '';
-      const type = this.series.domainObject.type ? ` ${this.series.domainObject.type}` : '';
 
-      return `${this.expanded ? 'Collapse' : 'Expand'}${name}${type}`;
+      return `${this.expanded ? 'Collapse' : 'Expand'}${name} Plot Series Options`;
     },
     isAliasClass() {
       let cssClass = '';
diff --git a/src/plugins/plot/inspector/forms/SeriesForm.vue b/src/plugins/plot/inspector/forms/SeriesForm.vue
index afad59da87..dcefc6d73d 100644
--- a/src/plugins/plot/inspector/forms/SeriesForm.vue
+++ b/src/plugins/plot/inspector/forms/SeriesForm.vue
@@ -175,9 +175,8 @@ export default {
   computed: {
     ariaLabelValue() {
       const name = this.series.domainObject.name ? ` ${this.series.domainObject.name}` : '';
-      const type = this.series.domainObject.type ? ` ${this.series.domainObject.type}` : '';
 
-      return `${this.expanded ? 'Collapse' : 'Expand'}${name}${type}`;
+      return `${this.expanded ? 'Collapse' : 'Expand'}${name} Plot Series Options`;
     },
     colorPalette() {
       return this.series.collection.palette.groups();
diff --git a/src/plugins/plot/legend/PlotLegend.vue b/src/plugins/plot/legend/PlotLegend.vue
index 0c351585b2..72486ab574 100644
--- a/src/plugins/plot/legend/PlotLegend.vue
+++ b/src/plugins/plot/legend/PlotLegend.vue
@@ -27,11 +27,13 @@
       'is-legend-hidden': isLegendHidden
     }"
   >
-    <div
+    <button
       class="c-plot-legend__view-control gl-plot-legend__view-control c-disclosure-triangle is-enabled"
       :class="{ 'c-disclosure-triangle--expanded': isLegendExpanded }"
+      :aria-label="ariaLabelValue"
+      tabindex="0"
       @click="toggleLegend"
-    ></div>
+    ></button>
 
     <div class="c-plot-legend__wrapper" :class="{ 'is-cursor-locked': cursorLocked }">
       <!-- COLLAPSED PLOT LEGEND -->
@@ -127,6 +129,11 @@ export default {
     };
   },
   computed: {
+    ariaLabelValue() {
+      const name = this.domainObject.name ? ` ${this.domainObject.name}` : '';
+
+      return `${this.isLegendExpanded ? 'Collapse' : 'Expand'}${name} Legend`;
+    },
     showUnitsWhenExpanded() {
       return this.loaded && this.legend.get('showUnitsWhenExpanded') === true;
     },
diff --git a/src/plugins/remove/RemoveAction.js b/src/plugins/remove/RemoveAction.js
index 38411f8bcd..e14a72d153 100644
--- a/src/plugins/remove/RemoveAction.js
+++ b/src/plugins/remove/RemoveAction.js
@@ -75,7 +75,7 @@ class RemoveAction {
         message,
         buttons: [
           {
-            label: 'OK',
+            label: 'Ok',
             callback: () => {
               dialog.dismiss();
               resolve();
diff --git a/src/plugins/tabs/components/TabsComponent.vue b/src/plugins/tabs/components/TabsComponent.vue
index a377756dbf..722f8950ad 100644
--- a/src/plugins/tabs/components/TabsComponent.vue
+++ b/src/plugins/tabs/components/TabsComponent.vue
@@ -253,7 +253,7 @@ export default {
         message: `This action will remove this tab from the Tabs Layout. Do you want to continue?`,
         buttons: [
           {
-            label: 'OK',
+            label: 'Ok',
             emphasis: 'true',
             callback: () => {
               this.composition.remove(childDomainObject);
diff --git a/src/ui/components/ObjectView.vue b/src/ui/components/ObjectView.vue
index ceabdf16df..e1633a0ac8 100644
--- a/src/ui/components/ObjectView.vue
+++ b/src/ui/components/ObjectView.vue
@@ -21,7 +21,13 @@
 -->
 <template>
   <div>
-    <div ref="objectViewWrapper" class="c-object-view" :class="viewClasses"></div>
+    <div
+      ref="objectViewWrapper"
+      role="region"
+      :aria-label="ariaLabel"
+      class="c-object-view"
+      :class="viewClasses"
+    ></div>
   </div>
 </template>
 
@@ -71,6 +77,9 @@ export default {
     };
   },
   computed: {
+    ariaLabel() {
+      return this.domainObject ? `${this.domainObject.name} Object View` : 'Object View';
+    },
     path() {
       return this.domainObject && (this.currentObjectPath || this.objectPath);
     },
diff --git a/src/ui/layout/BrowseBar.vue b/src/ui/layout/BrowseBar.vue
index 76b75bbaf3..013682a0f7 100644
--- a/src/ui/layout/BrowseBar.vue
+++ b/src/ui/layout/BrowseBar.vue
@@ -340,7 +340,7 @@ export default {
         message: 'Any unsaved changes will be lost. Are you sure you want to continue?',
         buttons: [
           {
-            label: 'OK',
+            label: 'Ok',
             emphasis: true,
             callback: () => {
               this.openmct.editor.cancel().then(() => {
diff --git a/src/ui/layout/MctTree.vue b/src/ui/layout/MctTree.vue
index 2efb57fc39..3e88d0c049 100644
--- a/src/ui/layout/MctTree.vue
+++ b/src/ui/layout/MctTree.vue
@@ -85,6 +85,7 @@
             v-for="(treeItem, index) in visibleItems"
             :key="`${treeItem.navigationPath}-${index}-${treeItem.object.name}`"
             :node="treeItem"
+            :draggable="true"
             :is-selector-tree="isSelectorTree"
             :selected-item="selectedItem"
             :active-search="activeSearch"
diff --git a/src/ui/layout/RecentObjectsList.vue b/src/ui/layout/RecentObjectsList.vue
index 3a0b78289d..f09fa75cb2 100644
--- a/src/ui/layout/RecentObjectsList.vue
+++ b/src/ui/layout/RecentObjectsList.vue
@@ -272,7 +272,7 @@ export default {
           'This action will clear the Recently Viewed Objects list. Are you sure you want to continue?',
         buttons: [
           {
-            label: 'OK',
+            label: 'Ok',
             callback: () => {
               localStorage.removeItem(LOCAL_STORAGE_KEY__RECENT_OBJECTS);
               Object.values(this.nameChangeListeners).forEach((unlisten) => {
```

### 断言级测试 diff（机械定位方式已遮蔽；语义锚可见）

> 断言增删：+91 / -90。

```diff
@@ -22,7 +22,7 @@
@@ -56,61 +56,61 @@ test.describe('Testing LAD table configuration', () => {
-await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Units' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Units' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'WATCH' })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'WATCH' })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
@@ -118,27 +118,27 @@ test.describe('Testing LAD table configuration', () => {
-await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'WATCH' })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'WATCH' })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
@@ -148,27 +148,27 @@ test.describe('Testing LAD table configuration', () => {
-await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Units' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Units' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
@@ -185,14 +185,14 @@ test.describe('Testing LAD table configuration', () => {
-await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Units' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeVisible();
@@ -201,25 +201,25 @@ test.describe('Testing LAD table configuration', () => {
-await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'WATCH' })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'WARNING' })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Timestamp', exact: true })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Type', exact: true })).toBeVisible();
+await expect(page.getByRole('columnheader', { name: 'Units' })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Limit WATCH' })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Limit WARNING' })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Limit DISTRESS' })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Limit CRITICAL' })).toBeHidden();
+await expect(page.getByRole('columnheader', { name: 'Limit SEVERE' })).toBeHidden();
@@ -237,19 +237,21 @@ test.describe('Testing LAD table configuration', () => {
@@ -261,23 +263,23 @@ test.describe('Testing LAD table @unstable', () => {
+await expect(page.getByLabel('lad value')).toHaveText(subscribeTelemValue);
-expect(ladTableValue).toBe(subscribeTelemValue);
+expect(ladTableValue).toEqual(subscribeTelemValue);
@@ -289,25 +291,23 @@ test.describe('Testing LAD table @unstable', () => {
-expect(ladTableValue).toBe(subscribeTelemValue);
+await expect(page.getByLabel('lad value')).toHaveText(subscribeTelemValue);
@@ -338,3 +338,18 @@ async function subscribeToTelemetry(page, objectIdentifier) {
```

---

盲判：`final_blind=STRUCTURAL_ONLY`  理由：应用源码为 LadTable.vue 表头 <th> 新增 scope="col" 导致可访问性角色由 cell 变为 columnheader，测试仅同步更新定位器角色与列头名称匹配，各列显隐断言语义与旧测试完全一致。

---

## rb024 — nasa/openmct (playwright)

- 测试文件：`e2e/tests/functional/plugins/lad/lad.e2e.spec.js` 第 210 行
- 旧定位器：`page.getByRole('cell', { name: 'Timestamp' }))`
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

### 完整旧测试块

> 提取方式：完整 `it/test` 块，第 174–217 行；共 44 行。

```js
  test('When adding something without Units, do not show Units column', async ({ page }) => {
    // Create Sine Wave Generator
    await createDomainObjectWithDefaults(page, {
      type: 'Event Message Generator',
      parent: ladTable.uuid
    });

    await page.goto(ladTable.url);

    // Edit LAD table
    await page.getByLabel('Edit Object').click();
    await page.getByRole('tab', { name: 'LAD Table Configuration' }).click();

    // make sure Sine Wave headers are visible initially too
    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeVisible();

    // save and reload and verify they columns are still hidden
    await page.getByLabel('Save').click();
    await page.getByRole('listitem', { name: 'Save and Finish Editing' }).click();

    // Remove Sine Wave Generator
    openObjectTreeContextMenu(page, sineWaveObject.url);
    await page.getByRole('menuitem', { name: /Remove/ }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();

    // Ensure Units & Limit columns are gone
    // as Event Generator don't have them
    await page.goto(ladTable.url);
    await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Units' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'WATCH' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'WARNING' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'DISTRESS' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'CRITICAL' })).toBeHidden();
    await expect(page.getByRole('cell', { name: 'SEVERE' })).toBeHidden();
  })
```

### 应用源码 diff（已排除测试文件）

```diff
diff --git a/src/plugins/LADTable/LadTableSetView.js b/src/plugins/LADTable/LadTableSetView.js
index 055693644e..2e8d0a7354 100644
--- a/src/plugins/LADTable/LadTableSetView.js
+++ b/src/plugins/LADTable/LadTableSetView.js
@@ -34,7 +34,7 @@ export default class LadTableSetView {
     this.component = null;
   }
 
-  show(element) {
+  show(element, isEditing, { renderWhenVisible }) {
     let ladTableConfiguration = new LADTableConfiguration(this.domainObject, this.openmct);
 
     const { vNode, destroy } = mount(
@@ -47,7 +47,8 @@ export default class LadTableSetView {
           openmct: this.openmct,
           objectPath: this.objectPath,
           currentView: this,
-          ladTableConfiguration
+          ladTableConfiguration,
+          renderWhenVisible
         },
         data: () => {
           return {
diff --git a/src/plugins/LADTable/components/LadRow.vue b/src/plugins/LADTable/components/LadRow.vue
index 57cfda84ee..ea7e525435 100644
--- a/src/plugins/LADTable/components/LadRow.vue
+++ b/src/plugins/LADTable/components/LadRow.vue
@@ -35,13 +35,20 @@
     >
       {{ domainObject.name }}
     </td>
-    <td v-if="showTimestamp" class="js-second-data">{{ formattedTimestamp }}</td>
-    <td class="js-third-data" :class="valueClasses">{{ value }}</td>
+    <td v-if="showTimestamp" aria-label="lad timestamp" class="js-second-data">
+      {{ formattedTimestamp }}
+    </td>
+    <td aria-label="lad value" class="js-third-data" :class="valueClasses">{{ value }}</td>
     <td v-if="hasUnits" class="js-units">
       {{ unit }}
     </td>
-    <td v-if="showType" class="js-type-data">{{ typeLabel }}</td>
-    <td v-for="limit in formattedLimitValues" :key="limit.key" class="js-limit-data">
+    <td v-if="showType" aria-label="lad type" class="js-type-data">{{ typeLabel }}</td>
+    <td
+      v-for="limit in formattedLimitValues"
+      :key="limit.key"
+      aria-label="lad limit value"
+      class="js-limit-data"
+    >
       {{ limit.value }}
     </td>
   </tr>
diff --git a/src/plugins/LADTable/components/LadTableConfiguration.vue b/src/plugins/LADTable/components/LadTableConfiguration.vue
index fc6a53f354..2c44f6e23b 100644
--- a/src/plugins/LADTable/components/LadTableConfiguration.vue
+++ b/src/plugins/LADTable/components/LadTableConfiguration.vue
@@ -143,6 +143,9 @@ export default {
       ladTable.domainObject = domainObject;
       ladTable.key = this.openmct.objects.makeKeyString(domainObject.identifier);
 
+      if (!this.ladTelemetryObjects) {
+        this.ladTelemetryObjects = {};
+      }
       this.ladTelemetryObjects[ladTable.key] = [];
       this.ladTableObjects.push(ladTable);
 
diff --git a/src/plugins/LADTable/pluginSpec.js b/src/plugins/LADTable/pluginSpec.js
index 495fc0f6ca..22dc6fd167 100644
--- a/src/plugins/LADTable/pluginSpec.js
+++ b/src/plugins/LADTable/pluginSpec.js
@@ -423,7 +423,7 @@ describe('The LAD Table Set', () => {
         (viewProvider) => viewProvider.key === ladTableSetKey
       );
       ladTableSetView = ladTableSetViewProvider.view(mockObj.ladTableSet, [mockObj.ladTableSet]);
-      ladTableSetView.show(child);
+      ladTableSetView.show(child, false, { renderWhenVisible });
 
       return nextTick();
     });
diff --git a/src/plugins/inspectorDataVisualization/TelemetryFrame.vue b/src/plugins/inspectorDataVisualization/TelemetryFrame.vue
index 984386a498..da3a230647 100644
--- a/src/plugins/inspectorDataVisualization/TelemetryFrame.vue
+++ b/src/plugins/inspectorDataVisualization/TelemetryFrame.vue
@@ -93,13 +93,11 @@ export default {
       this.showMenu = !this.showMenu;
     },
     async getTelemetryPath() {
-      let sourceTelem;
-      if (this.telemetryObject.type === 'yamcs.telemetry') {
-        sourceTelem = this.openmct.objects.makeKeyString(this.telemetryObject.identifier);
-      } else if (this.telemetryObject.type === 'yamcs.image') {
-        sourceTelem = this.openmct.objects.makeKeyString(this.telemetryObject.identifier);
-      }
-      const telemetryPath = await this.openmct.objects.getOriginalPath(sourceTelem);
+      const telemetryObjectKeyString = this.openmct.objects.makeKeyString(
+        this.telemetryObject.identifier
+      );
+
+      const telemetryPath = await this.openmct.objects.getOriginalPath(telemetryObjectKeyString);
       return telemetryPath;
     },
     async openInNewTab() {
```

### 断言级测试 diff（机械定位方式已遮蔽；语义锚可见）

> 断言增删：+22 / -22。

```diff
@@ -56,9 +56,9 @@ test.describe('Testing LAD table configuration', () => {
-await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -66,10 +66,10 @@ test.describe('Testing LAD table configuration', () => {
-await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
+await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -78,10 +78,10 @@ test.describe('Testing LAD table configuration', () => {
-await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
+await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
+await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
@@ -90,9 +90,9 @@ test.describe('Testing LAD table configuration', () => {
-await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
+await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
+await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
@@ -103,9 +103,9 @@ test.describe('Testing LAD table configuration', () => {
-await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeHidden();
+await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
+await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
@@ -117,10 +117,10 @@ test.describe('Testing LAD table configuration', () => {
-await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
+await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
@@ -132,8 +132,8 @@ test.describe('Testing LAD table configuration', () => {
-await expect(page.getByRole('cell', { name: 'Type' })).toBeHidden();
-await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeHidden();
+await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
@@ -146,11 +146,11 @@ test.describe('Testing LAD table configuration', () => {
-await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -161,9 +161,9 @@ test.describe('Testing LAD table configuration', () => {
-await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -185,9 +185,9 @@ test.describe('Testing LAD table configuration', () => {
-await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
+await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
@@ -206,8 +206,8 @@ test.describe('Testing LAD table configuration', () => {
-await expect(page.getByRole('cell', { name: 'Timestamp' })).toBeVisible();
-await expect(page.getByRole('cell', { name: 'Type' })).toBeVisible();
+await expect(page.getByRole('cell', { name: 'Timestamp', exact: true })).toBeVisible();
+await expect(page.getByRole('cell', { name: 'Type', exact: true })).toBeVisible();
```

---

盲判：`final_blind=STRUCTURAL_ONLY`  理由：应用源码为 LadRow.vue 数据单元格新增含 timestamp/type 子串的 aria-label，测试仅为避免子串匹配冲突给原有 Timestamp/Type 定位器补充 exact: true，断言目标与预期均未改变。

---

## rb033 — tryghost/koenig (playwright)

- 测试文件：`packages/koenig-lexical/test/e2e/plus-button.test.js` 第 385 行
- 旧定位器：`page.locator('[data-kg-card="markdown"]'))`
- Commit：Another fix attempt for flaky plus card button test
- Commit 说明：no issue
  
  - switched to markdown card on the assumption that the plus menu sometimes appears above the card before it collapses when leaving exit mode and so the card appears "hidden" to playwright
  ---
   packages/koenig-lexical/test/e2e/plus-button.test.js | 12 ++++++------
   1 file changed, 6 insertions(+), 6 deletions(-)
- 应用源码改动文件（0）：（无）

### 完整旧测试块

> 提取方式：完整 `it/test` 块，第 373–394 行；共 22 行。

```js
        test('exits a card\'s edit mode when plus button is clicked', async function () {
            await focusEditor(page);
            await page.keyboard.type('/');
            await page.click('[data-kg-card-menu-item="Markdown"]');
            await page.waitForSelector('[data-kg-card="markdown"] .CodeMirror');
            await page.keyboard.type('# Test');

            const pHandle = await page.locator('[data-lexical-editor] > p').nth(0);
            await pHandle.hover();
            await page.click('[data-kg-plus-button]');
            await page.waitForTimeout(200);
            await expect(page.locator('[data-kg-card="markdown"]')).toBeVisible();

            await assertHTML(page, html`
                <div data-lexical-decorator="true" contenteditable="false">
                    <div><svg></svg></div>
                    <div data-kg-card-editing="false" data-kg-card-selected="false" data-kg-card="markdown">
                    </div>
                </div>
                <p><br /></p>
            `, {ignoreCardContents: true});
        })
```

### 应用源码 diff（已排除测试文件）

_（无应用 diff：本次提交没有可展示的应用源码文件改动（可能仅改测试/文档/锁文件））_

### 断言级测试 diff（机械定位方式已遮蔽；语义锚可见）

> 断言增删：+1 / -1。

```diff
@@ -372,21 +372,21 @@ test.describe('Plus button', async () => {
-await expect(page.locator('<LOCATOR_REDACTED>')).toBeVisible();
+await expect(page.locator('<LOCATOR_CHANGED>')).toBeVisible();
```

---

盲判：`final_blind=EXPECTATION_CHANGE`  理由：本次提交无任何应用源码改动，系测试自身为修复 flaky 主动更换被测卡片类型及对应断言目标，不属于随应用结构变化而做的纯定位器重写。

---
