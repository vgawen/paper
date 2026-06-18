# C1 闭环：Code Diff → Semantic UI Diff → 选择/生成/修复（真实 JSX）

## 1. Semantic UI Diff
- ADD: button:text:Crimson, button:text:Green
- REMOVE: button:text:Red
- MODIFY: a:text:Learn React{href}, testid:turquoise-btn{testId}

## 2. 选择（UI diff 驱动）
- 选中: paint.spec.ts, link.spec.ts, turquoise.spec.ts
- 未选中(无关): home.spec.ts

## 3. 生成（ADD 缺口）
- 未被任何测试覆盖的新增节点: Crimson, Green
```ts
import { test, expect } from './fixtures';

test('generated: new buttons', async ({ page }) => {
  await page.getByRole('button', { name: 'Crimson' }).click();
  await page.getByRole('button', { name: 'Green' }).click();
  await expect(page.getByText('Crimson')).toBeVisible();
});
```

## 4. 修复（选中失效用例）
### paint.spec.ts
- edits: [{"kind":"locator","from":"Red","to":"Crimson"}]
```ts
import { test, expect } from './fixtures';
test('paint red', async ({ page }) => {
  await page.getByRole('button', { name: 'Crimson' }).click();
  await expect(page.locator('#bg')).toHaveCSS('background-color', 'rgb(231, 76, 60)');
});
```
### link.spec.ts
- edits: [{"kind":"assertion","field":"href","from":"https://reactjs.org","to":"https://react.dev"}]
```ts
import { test, expect } from './fixtures';
test('react link', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Learn React' }))
    .toHaveAttribute('href', 'https://react.dev');
});
```
### turquoise.spec.ts
- edits: [{"kind":"locator-harden","from":"text:Turquoise","to":"testid:turquoise-btn"}]
```ts
import { test, expect } from './fixtures';
test('paint turquoise', async ({ page }) => {
  await page.getByTestId('turquoise-btn').click();
});
```
