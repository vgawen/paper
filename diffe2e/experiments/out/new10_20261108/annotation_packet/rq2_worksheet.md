# 生成用例语义相关性盲评工作表（独立编号）

> 规则见 `diffe2e/experiments/annotate/ANNOTATION_GUIDE.md`。本表独立编号，不与其它材料共用编号或哈希。

## 怎么看、怎么判

每条看四样：`变更文件`、`路由`、**应用源码 diff**（本次变更的实际代码改动，已排除测试文件）、`spec`（生成出来的测试）。

问四个问题，四个都过才填 `y`：

| 问题 | 倾向 |
|---|---|
| 它有没有真的打开应用？还是 `page.setContent(...)` 自己造了假 DOM？ | `setContent` → `n` |
| 它操作/断言的元素，和 `变更文件` 里的改动对得上吗？ | 对不上 → `n` |
| 断言是不是具体到“变更后的结果”？还是只断言 body/页面/通用 header 可见？ | 空泛 → `n` |
| 如果这次变更不存在，这条测试会不会失败？ | 不会 → `n` |

**不需要跑测试。** 只读 spec 与源码 diff 做判断。

## 怎么填

在每节末尾把 `annotator2_yn=___` 改成 `annotator2_yn=y` 或 `annotator2_yn=n`。只填小写 `y` / `n`；`final` 留空，仅由第三人在两列不一致时填写。

---

## nb001

- 变更文件：`app/public/src/notifications.js`
- 路由：`/notifications`

### 这次变更的应用源码 diff（父提交..本次提交，已排除测试文件）

```diff
diff --git a/app/public/src/main.js b/app/public/src/main.js
index 46c36eb..c038954 100644
--- a/app/public/src/main.js
+++ b/app/public/src/main.js
@@ -13,6 +13,7 @@ const routes = {
   '/inbox': () => import('./inbox.js'),
   '/checkout': () => import('./checkout.js'),
   '/help': () => import('./help.js'),
+  '/notifications': () => import('./notifications.js'),
 };
 
 async function render() {
diff --git a/app/public/src/notifications.js b/app/public/src/notifications.js
new file mode 100644
index 0000000..655b5c9
--- /dev/null
+++ b/app/public/src/notifications.js
@@ -0,0 +1,10 @@
+export function render(root){
+  root.innerHTML=`<section><h1 data-testid="notif-title">Notifications</h1>
+  <label><input type="checkbox" data-testid="notif-toggle" aria-label="Enable alerts"/> Enable alerts</label>
+  <span data-testid="notif-status">Alerts disabled</span></section>`;
+  const box=root.querySelector('[data-testid="notif-toggle"]');
+  const status=root.querySelector('[data-testid="notif-status"]');
+  box.addEventListener('change',()=>{
+    status.textContent=box.checked?'Alerts enabled':'Alerts disabled';
+  });
+}
```

### 生成用例

```ts
import { test, expect } from './fixtures';

test('notifications toggle enables alerts and updates status', async ({ page }) => {
  await page.goto('/#/notifications');

  await expect(page.getByTestId('notif-title')).toBeVisible();

  const toggle = page.getByTestId('notif-toggle');
  const status = page.getByTestId('notif-status');

  await expect(status).toHaveText('Alerts disabled');

  await toggle.check();

  await expect(status).toHaveText('Alerts enabled');
  await expect(status).toBeVisible();
});
```

**annotator2_yn=___**

---

## nb002

- 变更文件：`app/public/src/survey.js`
- 路由：`/survey`

### 这次变更的应用源码 diff（父提交..本次提交，已排除测试文件）

```diff
diff --git a/app/public/src/main.js b/app/public/src/main.js
index c038954..6243d36 100644
--- a/app/public/src/main.js
+++ b/app/public/src/main.js
@@ -14,6 +14,7 @@ const routes = {
   '/checkout': () => import('./checkout.js'),
   '/help': () => import('./help.js'),
   '/notifications': () => import('./notifications.js'),
+  '/survey': () => import('./survey.js'),
 };
 
 async function render() {
diff --git a/app/public/src/survey.js b/app/public/src/survey.js
new file mode 100644
index 0000000..6099802
--- /dev/null
+++ b/app/public/src/survey.js
@@ -0,0 +1,13 @@
+export function render(root){
+  root.innerHTML=`<section><h1>Survey</h1>
+  <label for="sv-color">Favorite color</label>
+  <select id="sv-color" name="color" aria-label="Favorite color"><option>Red</option><option>Blue</option></select>
+  <label for="sv-note">Note</label>
+  <textarea id="sv-note" name="note" aria-label="Note"></textarea>
+  <button type="button">Submit survey</button>
+  <p role="status"></p></section>`;
+  const choice=root.querySelector('#sv-color');
+  const btn=root.querySelector('button');
+  const msg=root.querySelector('[role="status"]');
+  btn.addEventListener('click',()=>{msg.textContent=`Recorded ${choice.value} choice`;});
+}
```

### 生成用例

```ts
import { test, expect } from './fixtures';

test('survey records the selected favorite color', async ({ page }) => {
  await page.goto('/#/survey');

  await page.getByLabel('Favorite color').selectOption({ label: 'Blue' });
  await page.getByLabel('Note').fill('A short note');
  await page.getByRole('button', { name: 'Submit survey' }).click();

  const status = page.getByRole('status');
  await expect(status).toBeVisible();
  await expect(status).toHaveText('Recorded Blue choice');
});
```

**annotator2_yn=___**

---

## nb003

- 变更文件：`app/public/src/downloads.js`
- 路由：`/downloads`

### 这次变更的应用源码 diff（父提交..本次提交，已排除测试文件）

```diff
diff --git a/app/public/src/downloads.js b/app/public/src/downloads.js
new file mode 100644
index 0000000..dc1abee
--- /dev/null
+++ b/app/public/src/downloads.js
@@ -0,0 +1,14 @@
+const FILES=['report.pdf','invoice.pdf','manual.pdf'];
+export function render(root){
+  root.innerHTML=`<section><h1 data-testid="downloads-title">Downloads</h1>
+  <ul data-testid="downloads-list">${FILES.map(f=>`<li>${f}</li>`).join('')}</ul>
+  <button type="button">Clear list</button>
+  <span data-testid="downloads-count">3 files</span></section>`;
+  const btn=root.querySelector('button');
+  const list=root.querySelector('[data-testid="downloads-list"]');
+  const count=root.querySelector('[data-testid="downloads-count"]');
+  btn.addEventListener('click',()=>{
+    list.innerHTML='';
+    count.textContent='0 files';
+  });
+}
diff --git a/app/public/src/main.js b/app/public/src/main.js
index 6243d36..c80296d 100644
--- a/app/public/src/main.js
+++ b/app/public/src/main.js
@@ -15,6 +15,7 @@ const routes = {
   '/help': () => import('./help.js'),
   '/notifications': () => import('./notifications.js'),
   '/survey': () => import('./survey.js'),
+  '/downloads': () => import('./downloads.js'),
 };
 
 async function render() {
```

### 生成用例

```ts
import { test, expect } from './fixtures';

test('downloads route clears the file list', async ({ page }) => {
  await page.goto('/#/downloads');

  await expect(page.getByTestId('downloads-title')).toBeVisible();

  const list = page.getByTestId('downloads-list');
  await expect(list.getByRole('listitem')).toHaveCount(3);

  await page.getByRole('button', { name: 'Clear list' }).click();

  await expect(list.getByRole('listitem')).toHaveCount(0);
  await expect(page.getByTestId('downloads-count')).toHaveText('0 files');
});
```

**annotator2_yn=___**

---

## nb004

- 变更文件：`app/public/src/support.js`
- 路由：`/support`

### 这次变更的应用源码 diff（父提交..本次提交，已排除测试文件）

```diff
diff --git a/app/public/src/main.js b/app/public/src/main.js
index c80296d..9f03acc 100644
--- a/app/public/src/main.js
+++ b/app/public/src/main.js
@@ -16,6 +16,7 @@ const routes = {
   '/notifications': () => import('./notifications.js'),
   '/survey': () => import('./survey.js'),
   '/downloads': () => import('./downloads.js'),
+  '/support': () => import('./support.js'),
 };
 
 async function render() {
diff --git a/app/public/src/support.js b/app/public/src/support.js
new file mode 100644
index 0000000..1ffae10
--- /dev/null
+++ b/app/public/src/support.js
@@ -0,0 +1,14 @@
+export function render(root){
+  root.innerHTML=`<section><h1>Support</h1>
+  <label for="sup-msg">Message</label>
+  <textarea id="sup-msg" aria-label="Message"></textarea>
+  <button type="button">Check message</button>
+  <p role="status">Waiting for input</p></section>`;
+  const msg=root.querySelector('#sup-msg');
+  const btn=root.querySelector('button');
+  const out=root.querySelector('[role="status"]');
+  btn.addEventListener('click',()=>{
+    const n=msg.value.trim().length;
+    out.textContent=n>=20?'Message long enough':'Message too short';
+  });
+}
```

### 生成用例

```ts
import { test, expect } from './fixtures';

test('support route checks message length', async ({ page }) => {
  await page.goto('/#/support');

  await page.getByLabel('Message').fill('This support message is long enough.');
  await page.getByRole('button', { name: 'Check message' }).click();

  const status = page.getByRole('status');
  await expect(status).toBeVisible();
  await expect(status).toHaveText('Message long enough');
});
```

**annotator2_yn=___**

---

## nb005

- 变更文件：`app/public/src/reports.js`
- 路由：`/reports`

### 这次变更的应用源码 diff（父提交..本次提交，已排除测试文件）

```diff
diff --git a/app/public/src/main.js b/app/public/src/main.js
index 9f03acc..ad1c95b 100644
--- a/app/public/src/main.js
+++ b/app/public/src/main.js
@@ -17,6 +17,7 @@ const routes = {
   '/survey': () => import('./survey.js'),
   '/downloads': () => import('./downloads.js'),
   '/support': () => import('./support.js'),
+  '/reports': () => import('./reports.js'),
 };
 
 async function render() {
diff --git a/app/public/src/reports.js b/app/public/src/reports.js
new file mode 100644
index 0000000..d637e46
--- /dev/null
+++ b/app/public/src/reports.js
@@ -0,0 +1,13 @@
+export function render(root){
+  root.innerHTML=`<section><h1 data-testid="reports-title">Reports</h1>
+  <label for="rp-period">Period</label>
+  <select id="rp-period" aria-label="Period"><option>Week</option><option>Month</option></select>
+  <button type="button">Generate report</button>
+  <p data-testid="reports-status" role="status">No report</p></section>`;
+  const period=root.querySelector('#rp-period');
+  const btn=root.querySelector('button');
+  const out=root.querySelector('[data-testid="reports-status"]');
+  btn.addEventListener('click',()=>{
+    out.textContent=`Report for ${period.value}: 12 rows`;
+  });
+}
```

### 生成用例

```ts
import { test, expect } from './fixtures';

test('generates a report for the selected period', async ({ page }) => {
  await page.goto('/#/reports');

  await expect(page.getByTestId('reports-title')).toBeVisible();
  await expect(page.getByTestId('reports-status')).toHaveText('No report');

  await page.getByRole('button', { name: 'Generate report' }).click();

  await expect(page.getByTestId('reports-status')).toBeVisible();
  await expect(page.getByTestId('reports-status')).toHaveText('Report for Week: 12 rows');
});
```

**annotator2_yn=___**

---
