# RQ2 第二标注者盲评工作表

> 完整规则见 `diffe2e/experiments/annotate/ANNOTATION_GUIDE.md`。本页只保留填写时最常用的判断方法。

## 怎么看、怎么判

每条看四样：`gap_file`（本次改的文件）、`route`（项目/页面上下文）、**应用源码 diff**（本次变更的实际代码改动，已排除测试文件）、`spec`（生成出来的测试）。

问四个问题，四个都过才填 `y`：

| 问题 | 倾向 |
|---|---|
| 它有没有真的打开应用？还是 `page.setContent(...)` 自己造了假 DOM？ | `setContent` → `n` |
| 它操作/断言的元素，和 `gap_file` 里的变更对得上吗？ | 对不上 → `n` |
| 断言是不是具体到“变更后的结果”？还是只断言 body/页面/通用 header 可见？ | 空泛 → `n` |
| 如果这次变更不存在，这条测试会不会失败？ | 不会 → `n` |

典型判断：

- `page.setContent('<div>...')` + 一堆 `locator('cell')` → `n`：测的是自己造的假页面。
- `page.goto('/')` + `expect(page.locator('body')).toBeVisible()` → `n`：通用 smoke。
- `page.goto('/budget')` + 点击这次新增的按钮 + 断言新增的行/文本 → `y`。
- 用项目 fixture 并操作真实组件选择器，通常说明打开了应用；但仍要确认它触达的是 `gap_file` 对应的变更。

应用源码 diff 缺失时，不要凭文件名猜变更内容，停下来问协调者。

**不需要跑测试。** 可执行率、版本敏感、变异杀伤已由自动实验测过；人工判的是语义相关性，读代码即可。**不要打开** `rq2_real_to_annotate.csv`、`rq2_annotator1_rationale.md`、`rq2_real_to_annotate_unblind.json`。

## 怎么填

在每节末尾把 `annotator2_yn=___` 改成 `annotator2_yn=y` 或 `annotator2_yn=n`。只填小写 `y` / `n`；`final` 留空（它只由第三人在两列不一致时填写）。

---

## rq2_001

- 变更文件：`packages/desktop-client/src/components/transactions/TransactionsTable.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/transactions/TransactionsTable.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/transactions/TransactionsTable.tsx b/packages/desktop-client/src/components/transactions/TransactionsTable.tsx
index 84e7eeb278f..f2c8449dfff 100644
--- a/packages/desktop-client/src/components/transactions/TransactionsTable.tsx
+++ b/packages/desktop-client/src/components/transactions/TransactionsTable.tsx
@@ -53,6 +53,7 @@ import {
   groupTransaction,
   isPreviewId,
   isTemporaryId,
+  makeChild,
   splitTransaction,
   ungroupTransactions,
   updateTransaction,
@@ -3265,7 +3266,10 @@ export const TransactionTable = forwardRef(
         if (isTemporaryId(id)) {
           const { newNavigator } = latestState.current;
           const newTrans = latestState.current.newTransactions;
-          const { data, diff } = splitTransaction(newTrans, id);
+          const { data, diff } = splitTransaction(newTrans, id, parent => [
+            makeChild(parent),
+            makeChild(parent),
+          ]);
           setNewTransactions(data);
 
           // Jump next to "debit" field if it is empty
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('exercises new UI elements and verifies visibility', async ({ page }) => {
  // Fill the first input cell
  await page.locator('inputcell').first().fill('test data');

  // Click the button
  await page.locator('button').click();

  // Assert that the sheet name provider is visible
  await expect(page.locator('sheetnameprovider')).toBeVisible();

  // Assert that a custom cell is visible
  await expect(page.locator('customcell').first()).toBeVisible();
});
```

判定：`annotator2_yn=___`

---

## rq2_002

- 变更文件：`packages/desktop-client/src/components/transactions/TransactionsTable.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/transactions/TransactionsTable.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/transactions/TransactionsTable.tsx b/packages/desktop-client/src/components/transactions/TransactionsTable.tsx
index 84e7eeb278f..f2c8449dfff 100644
--- a/packages/desktop-client/src/components/transactions/TransactionsTable.tsx
+++ b/packages/desktop-client/src/components/transactions/TransactionsTable.tsx
@@ -53,6 +53,7 @@ import {
   groupTransaction,
   isPreviewId,
   isTemporaryId,
+  makeChild,
   splitTransaction,
   ungroupTransactions,
   updateTransaction,
@@ -3265,7 +3266,10 @@ export const TransactionTable = forwardRef(
         if (isTemporaryId(id)) {
           const { newNavigator } = latestState.current;
           const newTrans = latestState.current.newTransactions;
-          const { data, diff } = splitTransaction(newTrans, id);
+          const { data, diff } = splitTransaction(newTrans, id, parent => [
+            makeChild(parent),
+            makeChild(parent),
+          ]);
           setNewTransactions(data);
 
           // Jump next to "debit" field if it is empty
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('smoke test for actual_desktop', async ({ page }) => {
  await page.goto('/#/');
  // Wait for the application to load
  await page.waitForLoadState('networkidle');
  // Verify key UI elements are present
  await expect(page.locator('[data-testid="budget-header"]')).toBeVisible();
  await expect(page.locator('text=Budget')).toBeVisible();
});
```

判定：`annotator2_yn=___`

---

## rq2_003

- 变更文件：`packages/desktop-client/src/components/schedules/SchedulesTable.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/schedules/SchedulesTable.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/schedules/SchedulesTable.tsx b/packages/desktop-client/src/components/schedules/SchedulesTable.tsx
index e85f85e4211..a1c24dd3d18 100644
--- a/packages/desktop-client/src/components/schedules/SchedulesTable.tsx
+++ b/packages/desktop-client/src/components/schedules/SchedulesTable.tsx
@@ -138,8 +138,21 @@ export function ScheduleAmountCell({
 
   const num = getScheduledAmount(amount);
   const currencyAmount = format(Math.abs(num || 0), 'financial');
-  const isApprox = op === 'isapprox' || op === 'isbetween';
-
+  const isApprox = op === 'isapprox';
+  const isBetween = op === 'isbetween';
+  let cellText = '';
+  if (isApprox) {
+    cellText = t('Approximately {{currencyAmount}}', {
+      currencyAmount,
+    });
+  } else if (isBetween && typeof amount != 'number') {
+    cellText = t('{{currency1}} to {{currency2}}', {
+      currency1: format(Math.abs(amount.num1 || 0), 'financial'),
+      currency2: format(Math.abs(amount.num2 || 0), 'financial'),
+    });
+  } else {
+    cellText = currencyAmount;
+  }
   return (
     <Cell
       width={100}
@@ -160,15 +173,24 @@ export function ScheduleAmountCell({
             lineHeight: '1em',
             marginRight: 10,
           }}
-          title={
-            isApprox
-              ? t('Approximately {{currencyAmount}}', { currencyAmount })
-              : currencyAmount
-          }
+          title={cellText}
         >
           ~
         </View>
       )}
+      {isBetween && (
+        <View
+          style={{
+            textAlign: 'left',
+            color: theme.pageTextSubdued,
+            lineHeight: '1em',
+            marginRight: 10,
+          }}
+          title={cellText}
+        >
+          ±
+        </View>
+      )}
       <FinancialText
         style={{
           flex: 1,
@@ -177,11 +199,7 @@ export function ScheduleAmountCell({
           overflow: 'hidden',
           textOverflow: 'ellipsis',
         }}
-        title={
-          isApprox
-            ? t('Approximately {{currencyAmount}}', { currencyAmount })
-            : currencyAmount
-        }
+        title={cellText}
       >
         <PrivacyFilter>
           {num > 0 ? `+${currencyAmount}` : `${currencyAmount}`}
@@ -349,12 +367,14 @@ export function SchedulesTable({
       const payee = payees.find(p => schedule._payee === p.id);
       const account = accounts.find(a => schedule._account === a.id);
       const amount = getScheduledAmount(schedule._amount);
-      const amountStr =
-        (schedule._amountOp === 'isapprox' || schedule._amountOp === 'isbetween'
-          ? '~'
-          : '') +
-        (amount > 0 ? '+' : '') +
-        format(Math.abs(amount || 0), 'financial');
+      let amountStr = '';
+      if (schedule._amountOp === 'isbetween') {
+        amountStr = '±';
+      } else if (schedule._amountOp === 'isapprox') {
+        amountStr = '~';
+      }
+      amountStr +=
+        (amount > 0 ? '+' : '') + format(Math.abs(amount || 0), 'financial');
       const dateStr = schedule.next_date
         ? monthUtilFormat(schedule.next_date, dateFormat)
         : null;
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('exercise new UI elements', async ({ page }) => {
  await page.setContent(`
    <cell></cell>
    <view>±</view>
    <financialtext></financialtext>
    <field></field>
    <field></field>
    <field></field>
    <field></field>
    <field></field>
    <field></field>
  `);

  // Locate all elements
  const cell = page.locator('cell');
  const viewPlusMinus = page.getByText('±');
  const financialText = page.locator('financialtext');
  const fields = page.locator('field');

  // Assert initial visibility
  await expect(cell).toBeVisible();
  await expect(viewPlusMinus).toBeVisible();
  await expect(financialText).toBeVisible();
  await expect(fields.first()).toBeVisible();

  // Interact with the view (±)
  await viewPlusMinus.click();

  // Fill the first field
  await fields.first().fill('123');

  // Verify field value and that view is still visible
  await expect(fields.first()).toHaveValue('123');
  await expect(viewPlusMinus).toBeVisible();
});
```

判定：`annotator2_yn=___`

---

## rq2_004

- 变更文件：`packages/desktop-client/src/components/schedules/SchedulesTable.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/schedules/SchedulesTable.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/schedules/SchedulesTable.tsx b/packages/desktop-client/src/components/schedules/SchedulesTable.tsx
index e85f85e4211..a1c24dd3d18 100644
--- a/packages/desktop-client/src/components/schedules/SchedulesTable.tsx
+++ b/packages/desktop-client/src/components/schedules/SchedulesTable.tsx
@@ -138,8 +138,21 @@ export function ScheduleAmountCell({
 
   const num = getScheduledAmount(amount);
   const currencyAmount = format(Math.abs(num || 0), 'financial');
-  const isApprox = op === 'isapprox' || op === 'isbetween';
-
+  const isApprox = op === 'isapprox';
+  const isBetween = op === 'isbetween';
+  let cellText = '';
+  if (isApprox) {
+    cellText = t('Approximately {{currencyAmount}}', {
+      currencyAmount,
+    });
+  } else if (isBetween && typeof amount != 'number') {
+    cellText = t('{{currency1}} to {{currency2}}', {
+      currency1: format(Math.abs(amount.num1 || 0), 'financial'),
+      currency2: format(Math.abs(amount.num2 || 0), 'financial'),
+    });
+  } else {
+    cellText = currencyAmount;
+  }
   return (
     <Cell
       width={100}
@@ -160,15 +173,24 @@ export function ScheduleAmountCell({
             lineHeight: '1em',
             marginRight: 10,
           }}
-          title={
-            isApprox
-              ? t('Approximately {{currencyAmount}}', { currencyAmount })
-              : currencyAmount
-          }
+          title={cellText}
         >
           ~
         </View>
       )}
+      {isBetween && (
+        <View
+          style={{
+            textAlign: 'left',
+            color: theme.pageTextSubdued,
+            lineHeight: '1em',
+            marginRight: 10,
+          }}
+          title={cellText}
+        >
+          ±
+        </View>
+      )}
       <FinancialText
         style={{
           flex: 1,
@@ -177,11 +199,7 @@ export function ScheduleAmountCell({
           overflow: 'hidden',
           textOverflow: 'ellipsis',
         }}
-        title={
-          isApprox
-            ? t('Approximately {{currencyAmount}}', { currencyAmount })
-            : currencyAmount
-        }
+        title={cellText}
       >
         <PrivacyFilter>
           {num > 0 ? `+${currencyAmount}` : `${currencyAmount}`}
@@ -349,12 +367,14 @@ export function SchedulesTable({
       const payee = payees.find(p => schedule._payee === p.id);
       const account = accounts.find(a => schedule._account === a.id);
       const amount = getScheduledAmount(schedule._amount);
-      const amountStr =
-        (schedule._amountOp === 'isapprox' || schedule._amountOp === 'isbetween'
-          ? '~'
-          : '') +
-        (amount > 0 ? '+' : '') +
-        format(Math.abs(amount || 0), 'financial');
+      let amountStr = '';
+      if (schedule._amountOp === 'isbetween') {
+        amountStr = '±';
+      } else if (schedule._amountOp === 'isapprox') {
+        amountStr = '~';
+      }
+      amountStr +=
+        (amount > 0 ? '+' : '') + format(Math.abs(amount || 0), 'financial');
       const dateStr = schedule.next_date
         ? monthUtilFormat(schedule.next_date, dateFormat)
         : null;
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('smoke test: add an expense and verify budget summary on actual_desktop', async ({ page }) => {
  // Navigate to the main page
  await page.goto('/#/');
  
  // Wait for the app to load (e.g., a budget table or "Add Expense" button)
  await page.waitForSelector('button:has-text("Add Expense")', { timeout: 10000 });

  // Click "Add Expense" to open the form
  await page.click('button:has-text("Add Expense")');

  // Fill in expense details
  await page.fill('input[name="description"]', 'Test Expense');
  await page.fill('input[name="amount"]', '42.50');
  await page.selectOption('select[name="category"]', 'Food');

  // Submit the expense
  await page.click('button[type="submit"]:has-text("Save")');

  // Wait for the table to update
  await page.waitForTimeout(1000);

  // Verify the expense appears in the table
  const expenseRow = page.locator('table tbody tr', { hasText: 'Test Expense' });
  await expect(expenseRow).toBeVisible();
  await expect(expenseRow.locator('td:nth-child(2)')).toHaveText('42.50');
  await expect(expenseRow.locator('td:nth-child(3)')).toHaveText('Food');

  // Navigate to budget summary (assuming a separate route)
  await page.goto('/#/budget');
  await page.waitForSelector('h1:has-text("Budget Summary")', { timeout: 5000 });

  // Verify the total spent includes our expense
  const totalSpent = page.locator('[data-testid="total-spent"]');
  await expect(totalSpent).toHaveText(/\$42\.50/);
});
```

判定：`annotator2_yn=___`

---

## rq2_005

- 变更文件：`packages/desktop-client/src/components/modals/SelectLinkedAccountsModal.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/modals/SelectLinkedAccountsModal.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/modals/SelectLinkedAccountsModal.tsx b/packages/desktop-client/src/components/modals/SelectLinkedAccountsModal.tsx
index 52fc6e63975..8807c53e0e4 100644
--- a/packages/desktop-client/src/components/modals/SelectLinkedAccountsModal.tsx
+++ b/packages/desktop-client/src/components/modals/SelectLinkedAccountsModal.tsx
@@ -106,7 +106,7 @@ export type SelectLinkedAccountsModalProps =
     };
 
 export function SelectLinkedAccountsModal({
-  requisitionId = undefined,
+  requisitionId,
   externalAccounts,
   syncSource,
   upgradingAccountId,
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('actual_desktop SelectLinkedAccountsModal.tsx changed UI', async ({ page }) => {
  await expect(page.locator('body')).toBeVisible();
});
```

判定：`annotator2_yn=___`

---

## rq2_006

- 变更文件：`packages/desktop-client/src/components/modals/SelectLinkedAccountsModal.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/modals/SelectLinkedAccountsModal.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/modals/SelectLinkedAccountsModal.tsx b/packages/desktop-client/src/components/modals/SelectLinkedAccountsModal.tsx
index 52fc6e63975..8807c53e0e4 100644
--- a/packages/desktop-client/src/components/modals/SelectLinkedAccountsModal.tsx
+++ b/packages/desktop-client/src/components/modals/SelectLinkedAccountsModal.tsx
@@ -106,7 +106,7 @@ export type SelectLinkedAccountsModalProps =
     };
 
 export function SelectLinkedAccountsModal({
-  requisitionId = undefined,
+  requisitionId,
   externalAccounts,
   syncSource,
   upgradingAccountId,
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('smoke test: main page loads correctly', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.locator('body')).toBeVisible();
  await expect(page).toHaveURL('/#/');
});
```

判定：`annotator2_yn=___`

---

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

判定：`annotator2_yn=___`

---

## rq2_008

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

test('smoke test - budget page loads', async ({ page }) => {
  await page.goto('/#/');
  // Wait for the budget page to render (e.g., a heading or key element)
  await expect(page.locator('h1:has-text("Budget")')).toBeVisible({ timeout: 15000 });
});
```

判定：`annotator2_yn=___`

---

## rq2_009

- 变更文件：`packages/desktop-client/src/components/reports/reports/Formula.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/reports/reports/Formula.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/reports/reports/Formula.tsx b/packages/desktop-client/src/components/reports/reports/Formula.tsx
index 8483304e525..5f3ecbbfff9 100644
--- a/packages/desktop-client/src/components/reports/reports/Formula.tsx
+++ b/packages/desktop-client/src/components/reports/reports/Formula.tsx
@@ -9,6 +9,7 @@ import { Input } from '@actual-app/components/input';
 import { Select } from '@actual-app/components/select';
 import { styles } from '@actual-app/components/styles';
 import { theme } from '@actual-app/components/theme';
+import { Toggle } from '@actual-app/components/toggle';
 import { View } from '@actual-app/components/view';
 import type { FormulaWidget } from '@actual-app/core/types/models';
 
@@ -70,6 +71,7 @@ function FormulaInner({ widget }: FormulaInnerProps) {
   const [staticFontSize, setStaticFontSize] = useState<number>(
     widget?.meta?.staticFontSize || 32,
   );
+  const [showTitle, setShowTitle] = useState(widget?.meta?.showTitle ?? true);
   const [colorFormula, setColorFormula] = useState(
     widget?.meta?.colorFormula || '',
   );
@@ -136,6 +138,7 @@ function FormulaInner({ widget }: FormulaInnerProps) {
           queries: queriesRef.current,
           fontSizeMode,
           staticFontSize,
+          showTitle,
           colorFormula,
         },
       },
@@ -165,6 +168,7 @@ function FormulaInner({ widget }: FormulaInnerProps) {
             queries: queriesRef.current,
             fontSizeMode,
             staticFontSize,
+            showTitle,
             colorFormula,
           },
         },
@@ -250,6 +254,24 @@ function FormulaInner({ widget }: FormulaInnerProps) {
             flexDirection: 'column',
           }}
         >
+          <View style={{ padding: 20, paddingBottom: 0 }}>
+            <div
+              style={{
+                fontSize: 13,
+                color: theme.pageTextSubdued,
+                marginBottom: 5,
+              }}
+            >
+              <label htmlFor="formula-show-title">
+                <Trans>Show title:</Trans>
+              </label>
+            </div>
+            <Toggle
+              id="formula-show-title"
+              isOn={showTitle}
+              onToggle={setShowTitle}
+            />
+          </View>
           <View
             style={{
               padding: 20,
@@ -290,7 +312,6 @@ function FormulaInner({ widget }: FormulaInnerProps) {
               />
             </View>
           </View>
-
           <View
             style={{
               flex: 1,
@@ -319,7 +340,6 @@ function FormulaInner({ widget }: FormulaInnerProps) {
               />
             </Suspense>
           </View>
-
           <View
             style={{
               padding: '0 20px 20px 20px',
@@ -372,7 +392,6 @@ function FormulaInner({ widget }: FormulaInnerProps) {
               </View>
             )}
           </View>
-
           <View
             style={{
               padding: 20,
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('exercise new UI elements and assert visibility', async ({ page }) => {
  // Navigate to a page where these elements exist.
  // Adjust the URL as needed for your application.
  await page.goto('/');

  // Locate each element by its tag name.
  const mobilePageHeader = page.locator('mobilepageheader');
  const pageHeader = page.locator('pageheader');
  const editablePageHeaderTitle = page.locator('editablepageheadertitle');
  const button = page.locator('button');
  const label = page.locator('label');
  const select = page.locator('select');
  const input = page.locator('input');

  // Assert all elements are visible.
  await expect(mobilePageHeader).toBeVisible();
  await expect(pageHeader).toBeVisible();
  await expect(editablePageHeaderTitle).toBeVisible();
  await expect(button).toBeVisible();
  await expect(label).toBeVisible();
  await expect(select).toBeVisible();
  await expect(input).toBeVisible();

  // Interact with the elements to exercise them.
  // Fill the input with text.
  await input.fill('Test input value');

  // Select an option from the select (assuming there is at least one option).
  // Use a value or label that exists in your app; fallback to selecting by index.
  const options = await select.locator('option').all();
  if (options.length > 0) {
    await select.selectOption({ index: 0 });
  }

  // Click the button.
  await button.click();

  // After interaction, verify that the elements remain visible.
  // This is a simple visible outcome assertion.
  await expect(mobilePageHeader).toBeVisible();
  await expect(pageHeader).toBeVisible();
  await expect(editablePageHeaderTitle).toBeVisible();
  await expect(button).toBeVisible();
  await expect(label).toBeVisible();
  await expect(select).toBeVisible();
  await expect(input).toBeVisible();
});
```

判定：`annotator2_yn=___`

---

## rq2_010

- 变更文件：`packages/desktop-client/src/components/reports/reports/Formula.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/reports/reports/Formula.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/reports/reports/Formula.tsx b/packages/desktop-client/src/components/reports/reports/Formula.tsx
index 8483304e525..5f3ecbbfff9 100644
--- a/packages/desktop-client/src/components/reports/reports/Formula.tsx
+++ b/packages/desktop-client/src/components/reports/reports/Formula.tsx
@@ -9,6 +9,7 @@ import { Input } from '@actual-app/components/input';
 import { Select } from '@actual-app/components/select';
 import { styles } from '@actual-app/components/styles';
 import { theme } from '@actual-app/components/theme';
+import { Toggle } from '@actual-app/components/toggle';
 import { View } from '@actual-app/components/view';
 import type { FormulaWidget } from '@actual-app/core/types/models';
 
@@ -70,6 +71,7 @@ function FormulaInner({ widget }: FormulaInnerProps) {
   const [staticFontSize, setStaticFontSize] = useState<number>(
     widget?.meta?.staticFontSize || 32,
   );
+  const [showTitle, setShowTitle] = useState(widget?.meta?.showTitle ?? true);
   const [colorFormula, setColorFormula] = useState(
     widget?.meta?.colorFormula || '',
   );
@@ -136,6 +138,7 @@ function FormulaInner({ widget }: FormulaInnerProps) {
           queries: queriesRef.current,
           fontSizeMode,
           staticFontSize,
+          showTitle,
           colorFormula,
         },
       },
@@ -165,6 +168,7 @@ function FormulaInner({ widget }: FormulaInnerProps) {
             queries: queriesRef.current,
             fontSizeMode,
             staticFontSize,
+            showTitle,
             colorFormula,
           },
         },
@@ -250,6 +254,24 @@ function FormulaInner({ widget }: FormulaInnerProps) {
             flexDirection: 'column',
           }}
         >
+          <View style={{ padding: 20, paddingBottom: 0 }}>
+            <div
+              style={{
+                fontSize: 13,
+                color: theme.pageTextSubdued,
+                marginBottom: 5,
+              }}
+            >
+              <label htmlFor="formula-show-title">
+                <Trans>Show title:</Trans>
+              </label>
+            </div>
+            <Toggle
+              id="formula-show-title"
+              isOn={showTitle}
+              onToggle={setShowTitle}
+            />
+          </View>
           <View
             style={{
               padding: 20,
@@ -290,7 +312,6 @@ function FormulaInner({ widget }: FormulaInnerProps) {
               />
             </View>
           </View>
-
           <View
             style={{
               flex: 1,
@@ -319,7 +340,6 @@ function FormulaInner({ widget }: FormulaInnerProps) {
               />
             </Suspense>
           </View>
-
           <View
             style={{
               padding: '0 20px 20px 20px',
@@ -372,7 +392,6 @@ function FormulaInner({ widget }: FormulaInnerProps) {
               </View>
             )}
           </View>
-
           <View
             style={{
               padding: 20,
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('smoke test - add item to cart and verify in cart', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/#/');

  // Wait for product list to be visible
  await page.waitForSelector('[data-testid="product-item"]');

  // Add the first product to the cart
  await page.click('[data-testid="product-item"] [data-testid="add-to-cart"]');

  // Navigate to the cart page
  await page.goto('/#/cart');

  // Verify that a cart item is visible
  await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
});
```

判定：`annotator2_yn=___`

---

## rq2_011

- 变更文件：`packages/desktop-client/src/components/settings/Format.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/settings/Format.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/settings/Format.tsx b/packages/desktop-client/src/components/settings/Format.tsx
index e1e660fa982..9d2cc53c0e9 100644
--- a/packages/desktop-client/src/components/settings/Format.tsx
+++ b/packages/desktop-client/src/components/settings/Format.tsx
@@ -16,6 +16,8 @@ import { useSidebar } from '#components/sidebar/SidebarProvider';
 import { useDateFormat } from '#hooks/useDateFormat';
 import { useDaysOfWeek } from '#hooks/useDaysOfWeek';
 import { useSyncedPref } from '#hooks/useSyncedPref';
+import { saveSyncedPrefs } from '#prefs/prefsSlice';
+import { useDispatch } from '#redux';
 
 import { Column, Setting } from './UI';
 
@@ -30,6 +32,7 @@ const dateFormats: { value: SyncedPrefs['dateFormat']; label: string }[] = [
 
 export function FormatSettings() {
   const { t } = useTranslation();
+  const dispatch = useDispatch();
 
   const sidebar = useSidebar();
   const [_firstDayOfWeekIdx, setFirstDayOfWeekIdxPref] =
@@ -37,7 +40,7 @@ export function FormatSettings() {
   const firstDayOfWeekIdx = _firstDayOfWeekIdx || '0';
   const dateFormat = useDateFormat() || 'MM/dd/yyyy';
   const [, setDateFormatPref] = useSyncedPref('dateFormat');
-  const [_numberFormat, setNumberFormatPref] = useSyncedPref('numberFormat');
+  const [_numberFormat] = useSyncedPref('numberFormat');
   const numberFormat = _numberFormat || 'comma-dot';
   const [hideFraction, setHideFractionPref] = useSyncedPref('hideFraction');
 
@@ -70,7 +73,11 @@ export function FormatSettings() {
             <Select
               key={String(hideFraction)} // needed because label does not update
               value={numberFormat}
-              onChange={format => setNumberFormatPref(format)}
+              onChange={format => {
+                void dispatch(
+                  saveSyncedPrefs({ prefs: { numberFormat: format } }),
+                );
+              }}
               options={numberFormats.map(f => [
                 f.value,
                 String(hideFraction) === 'true' ? f.labelNoFraction : f.label,
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('exercise new UI elements', async ({ page }) => {
  // Navigate to the page (assume it's the current page, or use a baseURL from fixtures)
  // Since no specific URL is given, we assume the test starts on the correct page.
  // If needed, we can add: await page.goto('/');

  // Locate all the new elements by tag (assumed order from the array)
  const elements = page.locator('label, select, [class*="column"]'); // heuristic for column

  // Alternatively, we can use more generic selectors assuming they are direct children or within a container.
  // For simplicity, we'll use page.locator('label, select') and then check columns via role? Not ideal.

  // Better: rely on the fact that we have exactly these elements in the DOM in that order.
  // We can collect them by traversing the DOM structure if known.
  // Since we don't have testIds, we'll assume they are inside a common container.
  // We'll use a more robust approach: iterate over the expected elements.

  // Let's define the expected tags in order
  const expectedTags = [
    { tag: 'column' },
    { tag: 'select' },
    { tag: 'label' },
    { tag: 'column' },
    { tag: 'select' },
    { tag: 'column' },
    { tag: 'select' },
  ];

  // We'll locate all elements that match these tags in the page.
  // For columns, we might need a custom selector if it's a custom element or a class.
  // Assume columns are represented as divs with role='column' or something.
  // Since no details, we'll use a generic approach: query all elements by tag name and filter.

  // Actually, let's use a simpler method: assume each element has a unique index and we can get them by a common parent.
  // We'll suppose the elements are direct children of a container with id 'new-ui'.
  const container = page.locator('#new-ui'); // If not present, we can use body.

  // If we cannot rely on that, we'll just verify visibility of each expected element.
  // For select elements, we can select an option and check value.
  // For label, we can check it is visible.
  // For column, we can check it is visible.

  // Let's proceed with a robust but simple approach: locate all labels, selects, and any element with class containing "column".

  // Check label visibility
  const label = page.locator('label').first();
  await expect(label).toBeVisible();

  // Check all selects
  const selects = page.locator('select');
  const count = await selects.count();
  expect(count).toBeGreaterThanOrEqual(3); // at least the three selects

  // For each select, choose an option and assert it changed
  for (let i = 0; i < await selects.count(); i++) {
    const select = selects.nth(i);
    await select.selectOption({ index: 1 }); // select second option if available
    const value = await select.inputValue();
    expect(value).toBeTruthy();
  }

  // Check columns: we don't know the exact tag, but we can assume they are elements with role='region' or something.
  // Since they are 'column', maybe they are divs with a class or a custom element.
  // Let's use a generic: any element that is not a label or select and is visible.
  // That's not reliable. Instead, we'll rely on the fact that the page now has these elements.
  // We'll assert that the number of elements with a specific class (say 'column') is at least 3.
  const columnElements = page.locator('[class*="column"], column');
  await expect(columnElements.first()).toBeVisible(); // at least one column visible

  // To assert a visible outcome: after interacting, we can check that some text or UI state appears.
  // For example, we can check that the first select's selected option's text is visible.
  const firstSelect = page.locator('select').first();
  const selectedText = await firstSelect.locator('option:checked').innerText();
  await expect(page.locator('body')).toContainText(selectedText); // crude but ensures something visible

  // Or we can check that the page title contains something.
  // Since no specific outcome, we'll just assert that the page has loaded and elements are interactable.
  // More concrete: if there is a submit button or something, we could trigger an event.
  // But we'll keep it simple.

  // Final assertion: all expected tags are present and visible (selects have been interacted with)
  console.log('New UI elements exercised successfully');
});
```

判定：`annotator2_yn=___`

---

## rq2_012

- 变更文件：`packages/desktop-client/src/components/settings/Format.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/settings/Format.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/settings/Format.tsx b/packages/desktop-client/src/components/settings/Format.tsx
index e1e660fa982..9d2cc53c0e9 100644
--- a/packages/desktop-client/src/components/settings/Format.tsx
+++ b/packages/desktop-client/src/components/settings/Format.tsx
@@ -16,6 +16,8 @@ import { useSidebar } from '#components/sidebar/SidebarProvider';
 import { useDateFormat } from '#hooks/useDateFormat';
 import { useDaysOfWeek } from '#hooks/useDaysOfWeek';
 import { useSyncedPref } from '#hooks/useSyncedPref';
+import { saveSyncedPrefs } from '#prefs/prefsSlice';
+import { useDispatch } from '#redux';
 
 import { Column, Setting } from './UI';
 
@@ -30,6 +32,7 @@ const dateFormats: { value: SyncedPrefs['dateFormat']; label: string }[] = [
 
 export function FormatSettings() {
   const { t } = useTranslation();
+  const dispatch = useDispatch();
 
   const sidebar = useSidebar();
   const [_firstDayOfWeekIdx, setFirstDayOfWeekIdxPref] =
@@ -37,7 +40,7 @@ export function FormatSettings() {
   const firstDayOfWeekIdx = _firstDayOfWeekIdx || '0';
   const dateFormat = useDateFormat() || 'MM/dd/yyyy';
   const [, setDateFormatPref] = useSyncedPref('dateFormat');
-  const [_numberFormat, setNumberFormatPref] = useSyncedPref('numberFormat');
+  const [_numberFormat] = useSyncedPref('numberFormat');
   const numberFormat = _numberFormat || 'comma-dot';
   const [hideFraction, setHideFractionPref] = useSyncedPref('hideFraction');
 
@@ -70,7 +73,11 @@ export function FormatSettings() {
             <Select
               key={String(hideFraction)} // needed because label does not update
               value={numberFormat}
-              onChange={format => setNumberFormatPref(format)}
+              onChange={format => {
+                void dispatch(
+                  saveSyncedPrefs({ prefs: { numberFormat: format } }),
+                );
+              }}
               options={numberFormats.map(f => [
                 f.value,
                 String(hideFraction) === 'true' ? f.labelNoFraction : f.label,
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test.describe('Actual Desktop Smoke Test', () => {
  test('should load the main page and display the app', async ({ page }) => {
    await page.goto('/#/');
    
    // Wait for the app to load by checking for a key element
    await expect(page.locator('#root')).toBeVisible();
    
    // Optionally verify the title or a specific text
    await expect(page).toHaveTitle(/Actual/);
  });
});
```

判定：`annotator2_yn=___`

---

## rq2_013

- 变更文件：`packages/desktop-client/src/components/reports/Overview.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/reports/Overview.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/reports/Overview.tsx b/packages/desktop-client/src/components/reports/Overview.tsx
index 581ce581cf2..5c44bc2aaa8 100644
--- a/packages/desktop-client/src/components/reports/Overview.tsx
+++ b/packages/desktop-client/src/components/reports/Overview.tsx
@@ -78,7 +78,11 @@ function isCustomReportWidget(
 }
 
 function getWidgetMinHeight(widget: DashboardWidgetEntity) {
-  if (isCustomReportWidget(widget) || widget.type === 'markdown-card') {
+  if (
+    isCustomReportWidget(widget) ||
+    widget.type === 'markdown-card' ||
+    widget.type === 'formula-card'
+  ) {
     return 1;
   }
 
@@ -90,6 +94,10 @@ function getWidgetMinHeight(widget: DashboardWidgetEntity) {
 }
 
 function getWidgetMinWidth(widget: DashboardWidgetEntity) {
+  if (widget.type === 'formula-card') {
+    return 1;
+  }
+
   if (isCustomReportWidget(widget) || widget.type === 'markdown-card') {
     return 2;
   }
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('exercises new UI elements and asserts visible outcome', async ({ page }) => {
  await page.goto('/');
  const header = page.locator('mobilepageheader');
  await expect(header).toBeVisible();
  
  const buttons = page.locator('button');
  await expect(buttons).toHaveCount(3);
  
  for (let i = 0; i < 3; i++) {
    await buttons.nth(i).click();
  }
  
  // Assert that after interacting, the header remains visible
  await expect(header).toBeVisible();
});
```

判定：`annotator2_yn=___`

---

## rq2_014

- 变更文件：`packages/desktop-client/src/components/reports/Overview.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/reports/Overview.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/reports/Overview.tsx b/packages/desktop-client/src/components/reports/Overview.tsx
index 581ce581cf2..5c44bc2aaa8 100644
--- a/packages/desktop-client/src/components/reports/Overview.tsx
+++ b/packages/desktop-client/src/components/reports/Overview.tsx
@@ -78,7 +78,11 @@ function isCustomReportWidget(
 }
 
 function getWidgetMinHeight(widget: DashboardWidgetEntity) {
-  if (isCustomReportWidget(widget) || widget.type === 'markdown-card') {
+  if (
+    isCustomReportWidget(widget) ||
+    widget.type === 'markdown-card' ||
+    widget.type === 'formula-card'
+  ) {
     return 1;
   }
 
@@ -90,6 +94,10 @@ function getWidgetMinHeight(widget: DashboardWidgetEntity) {
 }
 
 function getWidgetMinWidth(widget: DashboardWidgetEntity) {
+  if (widget.type === 'formula-card') {
+    return 1;
+  }
+
   if (isCustomReportWidget(widget) || widget.type === 'markdown-card') {
     return 2;
   }
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('desktop app loads and displays accounts', async ({ page }) => {
  await page.goto('/#/accounts');
  await expect(page.locator('.accounts-table')).toBeVisible();
});
```

判定：`annotator2_yn=___`

---

## rq2_015

- 变更文件：`packages/desktop-client/src/components/settings/index.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/settings/index.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/settings/index.tsx b/packages/desktop-client/src/components/settings/index.tsx
index e9aa9296019..134ec19e0f2 100644
--- a/packages/desktop-client/src/components/settings/index.tsx
+++ b/packages/desktop-client/src/components/settings/index.tsx
@@ -23,8 +23,7 @@ import { useServerVersion } from '#components/ServerContext';
 import { useFeatureFlag } from '#hooks/useFeatureFlag';
 import { useGlobalPref } from '#hooks/useGlobalPref';
 import { useMetadataPref } from '#hooks/useMetadataPref';
-import { useSyncedPref } from '#hooks/useSyncedPref';
-import { loadPrefs } from '#prefs/prefsSlice';
+import { loadPrefs, saveSyncedPrefs } from '#prefs/prefsSlice';
 import { useDispatch, useSelector } from '#redux';
 
 import { AuthSettings } from './AuthSettings';
@@ -172,7 +171,6 @@ export function Settings() {
   const [budgetName] = useMetadataPref('budgetName');
   const dispatch = useDispatch();
   const isCurrencyExperimentalEnabled = useFeatureFlag('currency');
-  const [_, setDefaultCurrencyCodePref] = useSyncedPref('defaultCurrencyCode');
 
   const onCloseBudget = () => {
     void dispatch(closeBudget());
@@ -189,9 +187,9 @@ export function Settings() {
 
   useEffect(() => {
     if (!isCurrencyExperimentalEnabled) {
-      setDefaultCurrencyCodePref('');
+      void dispatch(saveSyncedPrefs({ prefs: { defaultCurrencyCode: '' } }));
     }
-  }, [isCurrencyExperimentalEnabled, setDefaultCurrencyCodePref]);
+  }, [dispatch, isCurrencyExperimentalEnabled]);
 
   const { isNarrowWidth } = useResponsive();
 
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('exercises new UI elements and asserts visible outcome', async ({ page }) => {
  // Navigate to a page that contains the new elements (adjust URL as needed)
  await page.goto('/');

  // Locate the new elements
  const label = page.locator('label');
  const formlabel = page.locator('formlabel');
  const input = page.locator('input');
  const button = page.locator('button');

  // Verify elements are visible
  await expect(label).toBeVisible();
  await expect(formlabel).toBeVisible();
  await expect(input).toBeVisible();
  await expect(button).toBeVisible();

  // Interact: type text into input and click button
  await input.fill('test value');
  await button.click();

  // Assert a visible outcome, e.g., input is cleared or a success message appears
  // Here we assume clicking the button clears the input (common behavior)
  await expect(input).toHaveValue('');
});
```

判定：`annotator2_yn=___`

---

## rq2_016

- 变更文件：`packages/desktop-client/src/components/settings/index.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/settings/index.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/settings/index.tsx b/packages/desktop-client/src/components/settings/index.tsx
index e9aa9296019..134ec19e0f2 100644
--- a/packages/desktop-client/src/components/settings/index.tsx
+++ b/packages/desktop-client/src/components/settings/index.tsx
@@ -23,8 +23,7 @@ import { useServerVersion } from '#components/ServerContext';
 import { useFeatureFlag } from '#hooks/useFeatureFlag';
 import { useGlobalPref } from '#hooks/useGlobalPref';
 import { useMetadataPref } from '#hooks/useMetadataPref';
-import { useSyncedPref } from '#hooks/useSyncedPref';
-import { loadPrefs } from '#prefs/prefsSlice';
+import { loadPrefs, saveSyncedPrefs } from '#prefs/prefsSlice';
 import { useDispatch, useSelector } from '#redux';
 
 import { AuthSettings } from './AuthSettings';
@@ -172,7 +171,6 @@ export function Settings() {
   const [budgetName] = useMetadataPref('budgetName');
   const dispatch = useDispatch();
   const isCurrencyExperimentalEnabled = useFeatureFlag('currency');
-  const [_, setDefaultCurrencyCodePref] = useSyncedPref('defaultCurrencyCode');
 
   const onCloseBudget = () => {
     void dispatch(closeBudget());
@@ -189,9 +187,9 @@ export function Settings() {
 
   useEffect(() => {
     if (!isCurrencyExperimentalEnabled) {
-      setDefaultCurrencyCodePref('');
+      void dispatch(saveSyncedPrefs({ prefs: { defaultCurrencyCode: '' } }));
     }
-  }, [isCurrencyExperimentalEnabled, setDefaultCurrencyCodePref]);
+  }, [dispatch, isCurrencyExperimentalEnabled]);
 
   const { isNarrowWidth } = useResponsive();
 
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test.describe('Actual Desktop Smoke Test', () => {
  test('should load the budget page and display account balance', async ({ page }) => {
    // Navigate to the budget overview
    await page.goto('/#/budget');

    // Wait for the budget table to be visible
    await page.waitForSelector('[data-testid="budget-table"]', { timeout: 10000 });

    // Verify the page title or header is present
    await expect(page.locator('h1')).toContainText('Budget');

    // Check that at least one account balance is displayed (non-zero or placeholder)
    const balance = page.locator('[data-testid="account-balance"]').first();
    await expect(balance).toBeVisible();
  });
});
```

判定：`annotator2_yn=___`

---

## rq2_017

- 变更文件：`packages/desktop-client/src/components/accounts/AccountSyncCheck.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/accounts/AccountSyncCheck.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/accounts/AccountSyncCheck.tsx b/packages/desktop-client/src/components/accounts/AccountSyncCheck.tsx
index 7a46225c0fd..1a76bea8951 100644
--- a/packages/desktop-client/src/components/accounts/AccountSyncCheck.tsx
+++ b/packages/desktop-client/src/components/accounts/AccountSyncCheck.tsx
@@ -10,6 +10,7 @@ import { View } from '@actual-app/components/view';
 import type { AccountEntity } from '@actual-app/core/types/models';
 
 import { useUnlinkAccountMutation } from '#accounts';
+import { getFailedSyncError, isAccountFailedSync } from '#accounts/syncStatus';
 import { Link } from '#components/common/Link';
 import { authorizeBank as authorizeEnableBanking } from '#enablebanking';
 import { authorizeBank as authorizeGoCardless } from '#gocardless';
@@ -126,20 +127,19 @@ export function AccountSyncCheck() {
     [unlinkAccount],
   );
 
-  if (!failedAccounts || !id) {
-    return null;
-  }
-
-  const error = failedAccounts.get(id);
-  if (!error) {
+  if (!id) {
     return null;
   }
 
   const account = accounts.find(account => account.id === id);
-  if (!account) {
+  if (!account || !isAccountFailedSync(account)) {
     return null;
   }
 
+  // prefer the detailed error from the client that ran the sync, fall back
+  // to the persisted status for failures that happened on another client
+  const error = failedAccounts.get(id) ?? getFailedSyncError(account);
+
   const { type, code } = error;
   const showAuth =
     (type === 'ITEM_ERROR' && code === 'ITEM_LOGIN_REQUIRED') ||
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('actual_desktop AccountSyncCheck.tsx changed UI', async ({ page }) => {
  await expect(page.locator('body')).toBeVisible();
});
```

判定：`annotator2_yn=___`

---

## rq2_018

- 变更文件：`packages/desktop-client/src/components/accounts/AccountSyncCheck.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/accounts/AccountSyncCheck.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/accounts/AccountSyncCheck.tsx b/packages/desktop-client/src/components/accounts/AccountSyncCheck.tsx
index 7a46225c0fd..1a76bea8951 100644
--- a/packages/desktop-client/src/components/accounts/AccountSyncCheck.tsx
+++ b/packages/desktop-client/src/components/accounts/AccountSyncCheck.tsx
@@ -10,6 +10,7 @@ import { View } from '@actual-app/components/view';
 import type { AccountEntity } from '@actual-app/core/types/models';
 
 import { useUnlinkAccountMutation } from '#accounts';
+import { getFailedSyncError, isAccountFailedSync } from '#accounts/syncStatus';
 import { Link } from '#components/common/Link';
 import { authorizeBank as authorizeEnableBanking } from '#enablebanking';
 import { authorizeBank as authorizeGoCardless } from '#gocardless';
@@ -126,20 +127,19 @@ export function AccountSyncCheck() {
     [unlinkAccount],
   );
 
-  if (!failedAccounts || !id) {
-    return null;
-  }
-
-  const error = failedAccounts.get(id);
-  if (!error) {
+  if (!id) {
     return null;
   }
 
   const account = accounts.find(account => account.id === id);
-  if (!account) {
+  if (!account || !isAccountFailedSync(account)) {
     return null;
   }
 
+  // prefer the detailed error from the client that ran the sync, fall back
+  // to the persisted status for failures that happened on another client
+  const error = failedAccounts.get(id) ?? getFailedSyncError(account);
+
   const { type, code } = error;
   const showAuth =
     (type === 'ITEM_ERROR' && code === 'ITEM_LOGIN_REQUIRED') ||
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('desktop smoke test', async ({ page }) => {
  await page.goto('/#/');
  // Verify the app loads by checking the page title
  await expect(page).toHaveTitle(/Actual/);
  // Quick sanity: the navigation or sidebar should be present
  await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
});
```

判定：`annotator2_yn=___`

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

判定：`annotator2_yn=___`

---

## rq2_020

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

test('desktop smoke test - home page loads', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.locator('h1')).toBeVisible();
});
```

判定：`annotator2_yn=___`

---

## rq2_021

- 变更文件：`packages/desktop-client/src/components/reports/FormulaResult.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/reports/FormulaResult.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/reports/FormulaResult.tsx b/packages/desktop-client/src/components/reports/FormulaResult.tsx
index 33941b5f90a..d90dd365722 100644
--- a/packages/desktop-client/src/components/reports/FormulaResult.tsx
+++ b/packages/desktop-client/src/components/reports/FormulaResult.tsx
@@ -81,12 +81,15 @@ export function FormulaResult({
 
     if (width <= 0 || height <= 0) return;
 
-    // Get the actual display value length at calculation time
-    const valueLength = displayValue.length || 1; // Avoid division by zero
+    // Check if the display value contains line breaks and calculate font size accordingly.
+    const lines = displayValue.split(/\r?\n/);
+    const lineCount = lines.length;
+    const longestLineLength = Math.max(...lines.map(line => line.length), 1);
 
+    // Calculate font size based on the longest line and number of lines
     const calculatedFontSize = Math.min(
-      (width * FONT_SIZE_SCALE_FACTOR) / valueLength,
-      height, // Ensure the text fits vertically by using the height as the limiting factor
+      (width * FONT_SIZE_SCALE_FACTOR) / longestLineLength,
+      height / lineCount, // Divide height by number of lines to fit all lines
     );
 
     if (calculatedFontSize > 0) {
@@ -184,7 +187,14 @@ export function FormulaResult({
           {!showContent ? (
             <ReportCardValueSkeleton />
           ) : (
-            <span aria-hidden="true">
+            <span
+              aria-hidden="true"
+              style={{
+                whiteSpace: 'pre-wrap',
+                textAlign: 'center',
+                wordBreak: 'break-word',
+              }}
+            >
               <PrivacyFilter>{displayValue}</PrivacyFilter>
             </span>
           )}
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('actual_desktop FormulaResult.tsx changed UI', async ({ page }) => {
  await expect(page.locator('body')).toBeVisible();
});
```

判定：`annotator2_yn=___`

---

## rq2_022

- 变更文件：`packages/desktop-client/src/components/reports/FormulaResult.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/reports/FormulaResult.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/reports/FormulaResult.tsx b/packages/desktop-client/src/components/reports/FormulaResult.tsx
index 33941b5f90a..d90dd365722 100644
--- a/packages/desktop-client/src/components/reports/FormulaResult.tsx
+++ b/packages/desktop-client/src/components/reports/FormulaResult.tsx
@@ -81,12 +81,15 @@ export function FormulaResult({
 
     if (width <= 0 || height <= 0) return;
 
-    // Get the actual display value length at calculation time
-    const valueLength = displayValue.length || 1; // Avoid division by zero
+    // Check if the display value contains line breaks and calculate font size accordingly.
+    const lines = displayValue.split(/\r?\n/);
+    const lineCount = lines.length;
+    const longestLineLength = Math.max(...lines.map(line => line.length), 1);
 
+    // Calculate font size based on the longest line and number of lines
     const calculatedFontSize = Math.min(
-      (width * FONT_SIZE_SCALE_FACTOR) / valueLength,
-      height, // Ensure the text fits vertically by using the height as the limiting factor
+      (width * FONT_SIZE_SCALE_FACTOR) / longestLineLength,
+      height / lineCount, // Divide height by number of lines to fit all lines
     );
 
     if (calculatedFontSize > 0) {
@@ -184,7 +187,14 @@ export function FormulaResult({
           {!showContent ? (
             <ReportCardValueSkeleton />
           ) : (
-            <span aria-hidden="true">
+            <span
+              aria-hidden="true"
+              style={{
+                whiteSpace: 'pre-wrap',
+                textAlign: 'center',
+                wordBreak: 'break-word',
+              }}
+            >
               <PrivacyFilter>{displayValue}</PrivacyFilter>
             </span>
           )}
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('smoke test: add item to cart and verify', async ({ page }) => {
  // Navigate to the home page
  await page.goto('/#/');
  await expect(page).toHaveTitle(/Actual Desktop/);

  // Find and click the first "Add to Cart" button
  const addToCartButton = page.locator('button:has-text("Add to Cart")').first();
  await addToCartButton.click();

  // Navigate to cart
  await page.goto('/#/cart');

  // Verify that the cart contains an item
  const cartItem = page.locator('.cart-item, .cart-item-row, [data-testid="cart-item"]');
  await expect(cartItem).toHaveCount(1);
});
```

判定：`annotator2_yn=___`

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

判定：`annotator2_yn=___`

---

## rq2_024

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

test('smoke test: application loads and displays budget page', async ({ page }) => {
  await page.goto('/#/');
  // Verify the app root is rendered
  await expect(page.locator('#root')).toBeVisible();
  // Verify a key navigation element is present (e.g., Budget link)
  await expect(page.getByRole('link', { name: /budget/i })).toBeVisible();
  // Confirm page has loaded by checking for a common heading
  await expect(page.locator('h1')).toContainText(/budget/i);
});
```

判定：`annotator2_yn=___`

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

判定：`annotator2_yn=___`

---

## rq2_026

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

test('smoke test: budget page loads correctly', async ({ page }) => {
  // Navigate to the root of the app
  await page.goto('/#/');
  
  // Wait for the app to load and the sidebar to be visible
  await page.waitForSelector('nav');
  
  // Click on the "Budget" link in the sidebar
  await page.click('text=Budget');
  
  // Verify the URL changes to the budget route
  await expect(page).toHaveURL(/\/#\/budget/);
  
  // Assert that the budget table is visible
  await expect(page.locator('[data-testid="budget-table"]')).toBeVisible();
});
```

判定：`annotator2_yn=___`

---

## rq2_027

- 变更文件：`packages/desktop-client/src/components/transactions/TransactionsTable.test.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/transactions/TransactionsTable.test.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/transactions/TransactionsTable.test.tsx b/packages/desktop-client/src/components/transactions/TransactionsTable.test.tsx
index ad567acc404..8473e484405 100644
--- a/packages/desktop-client/src/components/transactions/TransactionsTable.test.tsx
+++ b/packages/desktop-client/src/components/transactions/TransactionsTable.test.tsx
@@ -941,10 +941,7 @@ describe('Transactions', () => {
     await waitForAutocomplete();
     await waitForAutocomplete();
 
-    await userEvent.click(
-      container.querySelector('[data-testid="add-split-button"]')!,
-    );
-
+    // Splitting starts with two empty splits
     input = await editNewField(container, 'debit', 1);
     await userEvent.clear(input);
     await userEvent.type(input, '45.00');
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('actual_desktop TransactionsTable.test.tsx changed UI', async ({ page }) => {
  await expect(page.locator('body')).toBeVisible();
});
```

判定：`annotator2_yn=___`

---

## rq2_028

- 变更文件：`packages/desktop-client/src/components/transactions/TransactionsTable.test.tsx`
- 变更上下文：`actual_desktop:packages/desktop-client/src/components/transactions/TransactionsTable.test.tsx`

### 这次变更的应用源码 diff（`prev..sha`，已排除测试文件）

```diff
diff --git a/packages/desktop-client/src/components/transactions/TransactionsTable.test.tsx b/packages/desktop-client/src/components/transactions/TransactionsTable.test.tsx
index ad567acc404..8473e484405 100644
--- a/packages/desktop-client/src/components/transactions/TransactionsTable.test.tsx
+++ b/packages/desktop-client/src/components/transactions/TransactionsTable.test.tsx
@@ -941,10 +941,7 @@ describe('Transactions', () => {
     await waitForAutocomplete();
     await waitForAutocomplete();
 
-    await userEvent.click(
-      container.querySelector('[data-testid="add-split-button"]')!,
-    );
-
+    // Splitting starts with two empty splits
     input = await editNewField(container, 'debit', 1);
     await userEvent.clear(input);
     await userEvent.type(input, '45.00');
```

### 生成出来的测试

```ts
import { test, expect } from './fixtures';

test('desktop app loads and shows budget page', async ({ page }) => {
  await page.goto('/#/');
  
  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Verify the app is on the budget page by checking for a common element
  // Most Actual Budget views have a table or a heading
  const budgetContent = page.locator('.budget-table, .budget-header, .budget-overview');
  await expect(budgetContent.first()).toBeVisible();
  
  // Also confirm the URL includes the hash route
  await expect(page).toHaveURL(/#\//);
});
```

判定：`annotator2_yn=___`

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

判定：`annotator2_yn=___`

---

## rq2_030

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

test('smoke test: load page and verify default diagram renders', async ({ page }) => {
  await page.goto('/#/');
  // Wait for the CodeMirror editor to be visible
  await page.waitForSelector('.CodeMirror', { timeout: 10000 });
  // Verify the default Mermaid code is present in the editor
  const editorContent = await page.textContent('.CodeMirror-code');
  expect(editorContent).toContain('graph TD');
  // Wait for the preview area to contain a rendered SVG (the diagram output)
  await page.waitForSelector('#preview svg', { timeout: 10000 });
  // Ensure at least one SVG is rendered
  const svgCount = await page.locator('#preview svg').count();
  expect(svgCount).toBeGreaterThan(0);
});
```

判定：`annotator2_yn=___`

---

