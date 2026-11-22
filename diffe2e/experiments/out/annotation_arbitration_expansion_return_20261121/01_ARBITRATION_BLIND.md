# 扩展批次仲裁第一阶段（盲判）

范围：扩展批次两列不一致的 3 条（`rbx016`、`rbx020`、`rbx031`）。规则与主实验仲裁一致：只看本文件材料，不要打开 `02_ARBITRATION_INFORMED.md`；3 条全部填完后记录本文件 SHA-256，再进入第二阶段。

- 填 `STRUCTURAL_ONLY` / `EXPECTATION_CHANGE` / `SUSPECTED_REGRESSION` 三选一
- 两可时按保守规则倾向 `SUSPECTED_REGRESSION`；每条一行理由

## rbx016 — microsoft/playwright (playwright)

- 测试文件：`tests/playwright-test/ui-mode-test-watch.spec.ts` 第 111 行
- 旧定位器：`page.getByRole('treeitem')`
- Commit：chore: implement tree w/o list (#33169)
- Commit 说明：（该 commit 无正文）
- 应用源码改动文件（5）：packages/playwright/src/matchers/toMatchAriaSnapshot.ts, packages/trace-viewer/src/ui/actionList.tsx, packages/trace-viewer/src/ui/uiModeTestListView.tsx, packages/web/src/components/toolbarButton.tsx, packages/web/src/components/treeView.tsx

### 完整旧测试块

> 提取方式：完整 `it/test` 块，第 101–101 行；共 1 行。

```ts
    'd.test.ts': `import { test } from '@playwright/test'; test('test', () => {})
```

> 该块内未检测到断言，以下补充断点前后窗口（第 31–191 行）：

```ts
  await page.getByRole('treeitem').filter({ hasText: 'fails' }).getByTitle('Watch').click();
  await expect.poll(dumpTestTree(page)).toBe(`
    ▼ ◯ a.test.ts
        ◯ passes
        ◯ fails 👁 <=
  `);

  await page.getByRole('treeitem').filter({ hasText: 'fails' }).getByTitle('Run').click();

  await expect.poll(dumpTestTree(page)).toBe(`
    ▼ ❌ a.test.ts
        ◯ passes
        ❌ fails 👁 <=
  `);

  await writeFiles({
    'a.test.ts': `
      import { test, expect } from '@playwright/test';
      test('passes', () => {});
      test('fails', () => { expect(1).toBe(1); });
    `
  });

  await expect.poll(dumpTestTree(page)).toBe(`
    ▼ ◯ a.test.ts
        ◯ passes
        ✅ fails 👁 <=
  `);
});

test('should watch e2e deps', async ({ runUITest, writeFiles }) => {
  const { page } = await runUITest({
    'playwright.config.ts': `
      import { defineConfig } from '@playwright/test';
      export default defineConfig({ testDir: 'tests' });
    `,
    'src/helper.ts': `
      export const answer = 41;
    `,
    'tests/a.test.ts': `
      import { test, expect } from '@playwright/test';
      import { answer } from '../src/helper';
      test('answer', () => { expect(answer).toBe(42); });
    `,
  });

  await page.getByText('answer').click();
  await page.getByRole('treeitem').filter({ hasText: 'answer' }).getByTitle('Watch').click();
  await expect.poll(dumpTestTree(page)).toBe(`
    ▼ ◯ a.test.ts
        ◯ answer 👁 <=
  `);

  await writeFiles({
    'src/helper.ts': `
      export const answer = 42;
    `
  });

  await expect.poll(dumpTestTree(page)).toBe(`
    ▼ ✅ a.test.ts
        ✅ answer 👁 <=
  `);
});

test('should batch watch updates', async ({ runUITest, writeFiles }) => {
  const { page } = await runUITest({
    'a.test.ts': `import { test } from '@playwright/test'; test('test', () => {});`,
    'b.test.ts': `import { test } from '@playwright/test'; test('test', () => {});`,
    'c.test.ts': `import { test } from '@playwright/test'; test('test', () => {});`,
    'd.test.ts': `import { test } from '@playwright/test'; test('test', () => {});`,
  });

  await page.getByText('a.test.ts').click();
  await page.getByRole('treeitem').filter({ hasText: 'a.test.ts' }).getByTitle('Watch').click();
  await page.getByText('b.test.ts').click();
  await page.getByRole('treeitem').filter({ hasText: 'b.test.ts' }).getByTitle('Watch').click();
  await page.getByText('c.test.ts').click();
  await page.getByRole('treeitem').filter({ hasText: 'c.test.ts' }).getByTitle('Watch').click();
  await page.getByText('d.test.ts').click();
  await page.getByRole('treeitem').filter({ hasText: 'd.test.ts' }).getByTitle('Watch').click();

  await expect.poll(dumpTestTree(page)).toBe(`
    ▼ ◯ a.test.ts 👁
        ◯ test
    ▼ ◯ b.test.ts 👁
        ◯ test
    ▼ ◯ c.test.ts 👁
        ◯ test
    ▼ ◯ d.test.ts 👁 <=
        ◯ test
  `);

  await writeFiles({
    'a.test.ts': `import { test } from '@playwright/test'; test('test', () => {});`,
    'b.test.ts': `import { test } from '@playwright/test'; test('test', () => {});`,
    'c.test.ts': `import { test } from '@playwright/test'; test('test', () => {});`,
    'd.test.ts': `import { test } from '@playwright/test'; test('test', () => {});`,
  });

  await expect(page.getByTestId('status-line')).toHaveText('4/4 passed (100%)');

  await expect.poll(dumpTestTree(page)).toBe(`
    ▼ ✅ a.test.ts 👁
        ✅ test
    ▼ ✅ b.test.ts 👁
        ✅ test
    ▼ ✅ c.test.ts 👁
        ✅ test
    ▼ ✅ d.test.ts 👁 <=
        ✅ test
  `);
});

test('should watch all', async ({ runUITest, writeFiles }) => {
  const { page } = await runUITest({
    'a.test.ts': `import { test } from '@playwright/test'; test('test', () => {});`,
    'b.test.ts': `import { test } from '@playwright/test'; test('test', () => {});`,
    'c.test.ts': `import { test } from '@playwright/test'; test('test', () => {});`,
    'd.test.ts': `import { test } from '@playwright/test'; test('test', () => {});`,
  });

  await expect.poll(dumpTestTree(page)).toBe(`
    ▼ ◯ a.test.ts
        ◯ test
    ▼ ◯ b.test.ts
        ◯ test
    ▼ ◯ c.test.ts
        ◯ test
    ▼ ◯ d.test.ts
        ◯ test
  `);
  await page.getByTitle('Watch all').click();

  await writeFiles({
    'a.test.ts': `import { test } from '@playwright/test'; test('test', () => {});`,
    'd.test.ts': `import { test } from '@playwright/test'; test('test', () => {});`,
  });

  await expect(page.getByTestId('status-line')).toHaveText('2/2 passed (100%)');

  await expect.poll(dumpTestTree(page)).toBe(`
    ▼ ✅ a.test.ts
        ✅ test
    ▼ ◯ b.test.ts
        ◯ test
    ▼ ◯ c.test.ts
        ◯ test
    ▼ ✅ d.test.ts
        ✅ test
  `);
});

test('should watch new file', async ({ runUITest, writeFiles }) => {
  const { page } = await runUITest({
    'a.test.ts': `import { test } from '@playwright/test'; test('test', () => {});`,
  });

  await page.getByTitle('Watch all').click();

  await expect.poll(dumpTestTree(page)).toBe(`
```

### 应用源码 diff（已排除测试文件）

```diff
diff --git a/packages/playwright/src/matchers/toMatchAriaSnapshot.ts b/packages/playwright/src/matchers/toMatchAriaSnapshot.ts
--- a/packages/playwright/src/matchers/toMatchAriaSnapshot.ts
+++ b/packages/playwright/src/matchers/toMatchAriaSnapshot.ts
@@ -49,8 +49,8 @@ export async function toMatchAriaSnapshot(
 
   const messagePrefix = matcherHint(this, receiver, matcherName, 'locator', undefined, matcherOptions, timedOut ? timeout : undefined);
   const notFound = received === kNoElementsFoundError;
-  const escapedExpected = escapePrivateUsePoints(expected);
-  const escapedReceived = escapePrivateUsePoints(received);
+  const escapedExpected = unshift(escapePrivateUsePoints(expected));
+  const escapedReceived = unshift(escapePrivateUsePoints(received));
   const message = () => {
     if (pass) {
       if (notFound)
@@ -79,3 +79,17 @@ export async function toMatchAriaSnapshot(
 function escapePrivateUsePoints(str: string) {
   return str.replace(/[\uE000-\uF8FF]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
 }
+
+function unshift(snapshot: string): string {
+  const lines = snapshot.split('\n');
+  let whitespacePrefixLength = 100;
+  for (const line of lines) {
+    if (!line.trim())
+      continue;
+    const match = line.match(/^(\s*)/);
+    if (match && match[1].length < whitespacePrefixLength)
+      whitespacePrefixLength = match[1].length;
+    break;
+  }
+  return lines.filter(t => t.trim()).map(line => line.substring(whitespacePrefixLength)).join('\n');
+}
diff --git a/packages/trace-viewer/src/ui/actionList.tsx b/packages/trace-viewer/src/ui/actionList.tsx
--- a/packages/trace-viewer/src/ui/actionList.tsx
+++ b/packages/trace-viewer/src/ui/actionList.tsx
@@ -59,6 +59,30 @@ export const ActionList: React.FC<ActionListProps> = ({
     return { selectedItem };
   }, [itemMap, selectedAction]);
 
+  const isError = React.useCallback((item: ActionTreeItem) => {
+    return !!item.action?.error?.message;
+  }, []);
+
+  const onAccepted = React.useCallback((item: ActionTreeItem) => {
+    return setSelectedTime({ minimum: item.action!.startTime, maximum: item.action!.endTime });
+  }, [setSelectedTime]);
+
+  const render = React.useCallback((item: ActionTreeItem) => {
+    return renderAction(item.action!, { sdkLanguage, revealConsole, isLive, showDuration: true, showBadges: true });
+  }, [isLive, revealConsole, sdkLanguage]);
+
+  const isVisible = React.useCallback((item: ActionTreeItem) => {
+    return !selectedTime || !item.action || (item.action!.startTime <= selectedTime.maximum && item.action!.endTime >= selectedTime.minimum);
+  }, [selectedTime]);
+
+  const onSelectedAction = React.useCallback((item: ActionTreeItem) => {
+    onSelected?.(item.action!);
+  }, [onSelected]);
+
+  const onHighlightedAction = React.useCallback((item: ActionTreeItem | undefined) => {
+    onHighlighted?.(item?.action);
+  }, [onHighlighted]);
+
   return <div className='vbox'>
     {selectedTime && <div className='action-list-show-all' onClick={() => setSelectedTime(undefined)}><span className='codicon codicon-triangle-left'></span>Show all</div>}
     <ActionTreeView
@@ -67,12 +91,12 @@ export const ActionList: React.FC<ActionListProps> = ({
       treeState={treeState}
       setTreeState={setTreeState}
       selectedItem={selectedItem}
-      onSelected={item => onSelected?.(item.action!)}
-      onHighlighted={item => onHighlighted?.(item?.action)}
-      onAccepted={item => setSelectedTime({ minimum: item.action!.startTime, maximum: item.action!.endTime })}
-      isError={item => !!item.action?.error?.message}
-      isVisible={item => !selectedTime || (item.action!.startTime <= selectedTime.maximum && item.action!.endTime >= selectedTime.minimum)}
-      render={item => renderAction(item.action!, { sdkLanguage, revealConsole, isLive, showDuration: true, showBadges: true })}
+      onSelected={onSelectedAction}
+      onHighlighted={onHighlightedAction}
+      onAccepted={onAccepted}
+      isError={isError}
+      isVisible={isVisible}
+      render={render}
     />
   </div>;
 };
diff --git a/packages/trace-viewer/src/ui/uiModeTestListView.tsx b/packages/trace-viewer/src/ui/uiModeTestListView.tsx
--- a/packages/trace-viewer/src/ui/uiModeTestListView.tsx
+++ b/packages/trace-viewer/src/ui/uiModeTestListView.tsx
@@ -161,7 +161,7 @@ export const TestListView: React.FC<{
     render={treeItem => {
       return <div className='hbox ui-mode-tree-item'>
         <div className='ui-mode-tree-item-title'>
-          <span title={treeItem.title}>{treeItem.title}</span>
+          <span>{treeItem.title}</span>
           {treeItem.kind === 'case' ? treeItem.tags.map(tag => <TagView key={tag} tag={tag.slice(1)} onClick={e => handleTagClick(e, tag)} />) : null}
         </div>
         {!!treeItem.duration && treeItem.status !== 'skipped' && <div className='ui-mode-tree-item-time'>{msToString(treeItem.duration)}</div>}
@@ -179,6 +179,7 @@ export const TestListView: React.FC<{
       </div>;
     }}
     icon={treeItem => testStatusIcon(treeItem.status)}
+    title={treeItem => treeItem.title}
     selectedItem={selectedTreeItem}
     onAccepted={runTreeItem}
     onSelected={treeItem => {
diff --git a/packages/web/src/components/toolbarButton.tsx b/packages/web/src/components/toolbarButton.tsx
--- a/packages/web/src/components/toolbarButton.tsx
+++ b/packages/web/src/components/toolbarButton.tsx
@@ -52,7 +52,7 @@ export const ToolbarButton: React.FC<React.PropsWithChildren<ToolbarButtonProps>
     disabled={!!disabled}
     style={style}
     data-testid={testId}
-    aria-label={ariaLabel}
+    aria-label={ariaLabel || title}
   >
     {icon && <span className={`codicon codicon-${icon}`} style={children ? { marginRight: 5 } : {}}></span>}
     {children}
diff --git a/packages/web/src/components/treeView.tsx b/packages/web/src/components/treeView.tsx
--- a/packages/web/src/components/treeView.tsx
+++ b/packages/web/src/components/treeView.tsx
@@ -32,6 +32,7 @@ export type TreeViewProps<T> = {
   name: string,
   rootItem: T,
   render: (item: T) => React.ReactNode,
+  title?: (item: T) => string,
   icon?: (item: T) => string | undefined,
   isError?: (item: T) => boolean,
   isVisible?: (item: T) => boolean,
@@ -52,6 +53,7 @@ export function TreeView<T extends TreeItem>({
   name,
   rootItem,
   render,
+  title,
   icon,
   isError,
   isVisible,
@@ -66,40 +68,12 @@ export function TreeView<T extends TreeItem>({
   autoExpandDepth,
 }: TreeViewProps<T>) {
   const treeItems = React.useMemo(() => {
-    return flattenTree<T>(rootItem, selectedItem, treeState.expandedItems, autoExpandDepth || 0);
-  }, [rootItem, selectedItem, treeState, autoExpandDepth]);
-
-  // Filter visible items.
-  const visibleItems = React.useMemo(() => {
-    if (!isVisible)
-      return [...treeItems.keys()];
-    const cachedVisible = new Map<TreeItem, boolean>();
-    const visit = (item: TreeItem): boolean => {
-      const cachedResult = cachedVisible.get(item);
-      if (cachedResult !== undefined)
-        return cachedResult;
-
-      let hasVisibleChildren = item.children.some(child => visit(child));
-      for (const child of item.children) {
-        const result = visit(child);
-        hasVisibleChildren = hasVisibleChildren || result;
-      }
-      const result = isVisible(item as T) || hasVisibleChildren;
-      cachedVisible.set(item, result);
-      return result;
-    };
-    for (const item of treeItems.keys())
-      visit(item);
-    const result: T[] = [];
-    for (const item of treeItems.keys()) {
-      if (isVisible(item))
-        result.push(item);
-    }
-    return result;
-  }, [treeItems, isVisible]);
+    return indexTree<T>(rootItem, selectedItem, treeState.expandedItems, autoExpandDepth || 0, isVisible);
+  }, [rootItem, selectedItem, treeState, autoExpandDepth, isVisible]);
 
   const itemListRef = React.useRef<HTMLDivElement>(null);
   const [highlightedItem, setHighlightedItem] = React.useState<any>();
+  const [isKeyboardNavigation, setIsKeyboardNavigation] = React.useState(false);
 
   React.useEffect(() => {
     onHighlighted?.(highlightedItem);
@@ -171,53 +145,63 @@ export function TreeView<T extends TreeItem>({
           return;
         }
 
-        const index = selectedItem ? visibleItems.indexOf(selectedItem) : -1;
-        let newIndex = index;
+        let newSelectedItem: T | undefined = selectedItem;
         if (event.key === 'ArrowDown') {
-          if (index === -1)
-            newIndex = 0;
-          else
-            newIndex = Math.min(index + 1, visibleItems.length - 1);
+          if (selectedItem) {
+            const itemData = treeItems.get(selectedItem)!;
+            newSelectedItem = itemData.next as T;
+          } else if (treeItems.size) {
+            const itemList = [...treeItems.keys()];
+            newSelectedItem = itemList[0];
+          }
         }
         if (event.key === 'ArrowUp') {
-          if (index === -1)
-            newIndex = visibleItems.length - 1;
-          else
-            newIndex = Math.max(index - 1, 0);
+          if (selectedItem) {
+            const itemData = treeItems.get(selectedItem)!;
+            newSelectedItem = itemData.prev as T;
+          } else if (treeItems.size) {
+            const itemList = [...treeItems.keys()];
+            newSelectedItem = itemList[itemList.length - 1];
+          }
         }
 
-        const element = itemListRef.current?.children.item(newIndex);
-        scrollIntoViewIfNeeded(element || undefined);
+        // scrollIntoViewIfNeeded(element || undefined);
         onHighlighted?.(undefined);
-        onSelected?.(visibleItems[newIndex]);
+        if (newSelectedItem) {
+          setIsKeyboardNavigation(true);
+          onSelected?.(newSelectedItem);
+        }
         setHighlightedItem(undefined);
       }}
       ref={itemListRef}
     >
-      {noItemsMessage && visibleItems.length === 0 && <div className='tree-view-empty'>{noItemsMessage}</div>}
-      {visibleItems.map(item => {
-        return <div key={item.id} role='treeitem' aria-selected={item === selectedItem}>
-          <TreeItemHeader
-            item={item}
-            itemData={treeItems.get(item)!}
-            selectedItem={selectedItem}
-            onSelected={onSelected}
-            onAccepted={onAccepted}
-            isError={isError}
-            toggleExpanded={toggleExpanded}
-            highlightedItem={highlightedItem}
-            setHighlightedItem={setHighlightedItem}
-            render={render}
-            icon={icon} />
-        </div>;
+      {noItemsMessage && treeItems.size === 0 && <div className='tree-view-empty'>{noItemsMessage}</div>}
+      {rootItem.children.map(child => {
+        const itemData = treeItems.get(child as T);
+        return itemData && <TreeItemHeader
+          key={child.id}
+          item={child}
+          treeItems={treeItems}
+          selectedItem={selectedItem}
+          onSelected={onSelected}
+          onAccepted={onAccepted}
+          isError={isError}
+          toggleExpanded={toggleExpanded}
+          highlightedItem={highlightedItem}
+          setHighlightedItem={setHighlightedItem}
+          render={render}
+          icon={icon}
+          title={title}
+          isKeyboardNavigation={isKeyboardNavigation}
+          setIsKeyboardNavigation={setIsKeyboardNavigation} />;
       })}
     </div>
   </div>;
 }
 
 type TreeItemHeaderProps<T> = {
   item: T,
-  itemData: TreeItemData,
+  treeItems: Map<T, TreeItemData>,
   selectedItem: T | undefined,
   onSelected?: (item: T) => void,
   toggleExpanded: (item: T) => void,
@@ -226,12 +210,15 @@ type TreeItemHeaderProps<T> = {
   onAccepted?: (item: T) => void,
   setHighlightedItem: (item: T | undefined) => void,
   render: (item: T) => React.ReactNode,
+  title?: (item: T) => string,
   icon?: (item: T) => string | undefined,
+  isKeyboardNavigation: boolean,
+  setIsKeyboardNavigation: (value: boolean) => void,
 };
 
 export function TreeItemHeader<T extends TreeItem>({
   item,
-  itemData,
+  treeItems,
   selectedItem,
   onSelected,
   highlightedItem,
@@ -240,68 +227,122 @@ export function TreeItemHeader<T extends TreeItem>({
   onAccepted,
   toggleExpanded,
   render,
-  icon }: TreeItemHeaderProps<T>) {
+  title,
+  icon,
+  isKeyboardNavigation,
+  setIsKeyboardNavigation }: TreeItemHeaderProps<T>) {
+  const itemRef = React.useRef(null);
 
+  React.useEffect(() => {
+    if (selectedItem === item && isKeyboardNavigation && itemRef.current) {
+      scrollIntoViewIfNeeded(itemRef.current);
+      setIsKeyboardNavigation(false);
+    }
+  }, [item, selectedItem, isKeyboardNavigation, setIsKeyboardNavigation]);
+
+  const itemData = treeItems.get(item)!;
   const indentation = itemData.depth;
   const expanded = itemData.expanded;
   let expandIcon = 'codicon-blank';
   if (typeof expanded === 'boolean')
     expandIcon = expanded ? 'codicon-chevron-down' : 'codicon-chevron-right';
   const rendered = render(item);
+  const children = expanded && item.children.length ? item.children as T[] : [];
+  const titled = title?.(item);
 
-  return <div
-    onDoubleClick={() => onAccepted?.(item)}
-    className={clsx(
-        'tree-view-entry',
-        selectedItem === item && 'selected',
-        highlightedItem === item && 'highlighted',
-        isError?.(item) && 'error')}
-    onClick={() => onSelected?.(item)}
-    onMouseEnter={() => setHighlightedItem(item)}
-    onMouseLeave={() => setHighlightedItem(undefined)}
-  >
-    {indentation ? new Array(indentation).fill(0).map((_, i) => <div key={'indent-' + i} className='tree-view-indent'></div>) : undefined}
+  return <div ref={itemRef} role='treeitem' aria-selected={item === selectedItem} aria-expanded={expanded} aria-label={titled} title={titled} className='vbox' style={{ flex: 'none' }}>
     <div
-      className={'codicon ' + expandIcon}
-      style={{ minWidth: 16, marginRight: 4 }}
-      onDoubleClick={e => {
-        e.preventDefault();
-        e.stopPropagation();
-      }}
-      onClick={e => {
-        e.stopPropagation();
-        e.preventDefault();
-        toggleExpanded(item);
-      }}
-    />
-    {icon && <div className={'codicon ' + (icon(item) || 'codicon-blank')} style={{ minWidth: 16, marginRight: 4 }}></div>}
-    {typeof rendered === 'string' ? <div style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{rendered}</div> : rendered}
+      onDoubleClick={() => onAccepted?.(item)}
+      className={clsx(
+          'tree-view-entry',
+          selectedItem === item && 'selected',
+          highlightedItem === item && 'highlighted',
+          isError?.(item) && 'error')}
+      onClick={() => onSelected?.(item)}
+      onMouseEnter={() => setHighlightedItem(item)}
+      onMouseLeave={() => setHighlightedItem(undefined)}
+    >
+      {indentation ? new Array(indentation).fill(0).map((_, i) => <div key={'indent-' + i} className='tree-view-indent'></div>) : undefined}
+      <div
+        aria-hidden='true'
+        className={'codicon ' + expandIcon}
+        style={{ minWidth: 16, marginRight: 4 }}
+        onDoubleClick={e => {
+          e.preventDefault();
+          e.stopPropagation();
+        }}
+        onClick={e => {
+          e.stopPropagation();
+          e.preventDefault();
+          toggleExpanded(item);
+        }}
+      />
+      {icon && <div className={'codicon ' + (icon(item) || 'codicon-blank')} style={{ minWidth: 16, marginRight: 4 }} aria-hidden='true'></div>}
+      {typeof rendered === 'string' ? <div style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{rendered}</div> : rendered}
+    </div>
+    {!!children.length && <div aria-label='group'>
+      {children.map(child => {
+        const itemData = treeItems.get(child);
+        return itemData && <TreeItemHeader
+          key={child.id}
+          item={child}
+          treeItems={treeItems}
+          selectedItem={selectedItem}
+          onSelected={onSelected}
+          onAccepted={onAccepted}
+          isError={isError}
+          toggleExpanded={toggleExpanded}
+          highlightedItem={highlightedItem}
+          setHighlightedItem={setHighlightedItem}
+          render={render}
+          title={title}
+          icon={icon}
+          isKeyboardNavigation={isKeyboardNavigation}
+          setIsKeyboardNavigation={setIsKeyboardNavigation} />;
+      })}
+    </div>}
   </div>;
 }
 
 type TreeItemData = {
-  depth: number,
-  expanded: boolean | undefined,
-  parent: TreeItem | null,
+  depth: number;
+  expanded: boolean | undefined;
+  parent: TreeItem | null;
+  next: TreeItem | null;
+  prev: TreeItem | null;
 };
 
-function flattenTree<T extends TreeItem>(
+function indexTree<T extends TreeItem>(
   rootItem: T,
   selectedItem: T | undefined,
   expandedItems: Map<string, boolean | undefined>,
-  autoExpandDepth: number): Map<T, TreeItemData> {
+  autoExpandDepth: number,
+  isVisible?: (item: T) => boolean): Map<T, TreeItemData> {
 
   const result = new Map<T, TreeItemData>();
   const temporaryExpanded = new Set<string>();
   for (let item: TreeItem | undefined = selectedItem?.parent; item; item = item.parent)
     temporaryExpanded.add(item.id);
+  let lastItem: T | null = null;
 
   const appendChildren = (parent: T, depth: number) => {
+    if (isVisible && !isVisible(parent))
+      return;
     for (const item of parent.children as T[]) {
       const expandState = temporaryExpanded.has(item.id) || expandedItems.get(item.id);
       const autoExpandMatches = autoExpandDepth > depth && result.size < 25 && expandState !== false;
       const expanded = item.children.length ? expandState ?? autoExpandMatches : undefined;
-      result.set(item, { depth, expanded, parent: rootItem === parent ? null : parent });
+      const itemData: TreeItemData = {
+        depth,
+        expanded,
+        parent: rootItem === parent ? null : parent,
+        next: null,
+        prev: lastItem,
+      };
+      if (lastItem)
+        result.get(lastItem)!.next = item;
+      lastItem = item;
+      result.set(item, itemData);
       if (expanded)
         appendChildren(item, depth + 1);
     }
```

### 断言级测试 diff（机械定位方式已遮蔽；语义锚可见）

> 断言增删：+0 / -0。

```diff
（本次提交未改动断言级代码；旧断言保持不变。）
```

判定：`human2=（已按盲评协议填写，盲判阶段不可见）`  备注：

---

盲判：`final_blind=STRUCTURAL_ONLY`  理由：treeView.tsx 将扁平列表重构为嵌套树结构（父 treeitem 包含子 treeitem）并新增 aria-label/title，导致旧定位器作用域/匹配结构变化；断言增删为 +0/-0，批量 watch 测试意图未变。

---

## rbx020 — microsoft/playwright (playwright)

- 测试文件：`tests/playwright-test/ui-mode-trace.spec.ts` 第 179 行
- 旧定位器：`page.getByText(/Log/)`
- Commit：chore: list attachments in the trace (#22919)
- Commit 说明：Fixes https://github.com/microsoft/playwright/issues/22736
- 应用源码改动文件（7）：packages/playwright-core/src/utils/traceUtils.ts, packages/playwright-test/src/worker/testInfo.ts, packages/trace-viewer/src/ui/attachmentsTab.css, packages/trace-viewer/src/ui/attachmentsTab.tsx, packages/trace-viewer/src/ui/callTab.tsx, packages/trace-viewer/src/ui/sourceTab.tsx, packages/trace-viewer/src/ui/workbench.tsx

### 完整旧测试块

> 提取方式：完整 `it/test` 块，第 171–174 行；共 4 行。

```ts
      test('vrt test', async ({ page }) => {
        await page.setViewportSize({ width: 100, height: 100 });
        await expect(page).toHaveScreenshot('snapshot.png', { timeout: 2000 });
      })
```

### 应用源码 diff（已排除测试文件）

```diff
diff --git a/packages/playwright-core/src/utils/traceUtils.ts b/packages/playwright-core/src/utils/traceUtils.ts
--- a/packages/playwright-core/src/utils/traceUtils.ts
+++ b/packages/playwright-core/src/utils/traceUtils.ts
@@ -119,12 +119,12 @@ export async function saveTraceFile(fileName: string, traceEvents: TraceEvent[],
     for (const attachment of (event.attachments || []).filter(a => !!a.path)) {
       await fs.promises.readFile(attachment.path!).then(content => {
         const sha1 = calculateSha1(content);
+        attachment.sha1 = sha1;
+        delete attachment.path;
         if (sha1s.has(sha1))
           return;
         sha1s.add(sha1);
         zipFile.addBuffer(content, 'resources/' + sha1);
-        attachment.sha1 = sha1;
-        delete attachment.path;
       }).catch();
     }
   }
diff --git a/packages/playwright-test/src/worker/testInfo.ts b/packages/playwright-test/src/worker/testInfo.ts
--- a/packages/playwright-test/src/worker/testInfo.ts
+++ b/packages/playwright-test/src/worker/testInfo.ts
@@ -331,7 +331,13 @@ export class TestInfoImpl implements TestInfo {
   // ------------ TestInfo methods ------------
 
   async attach(name: string, options: { path?: string, body?: string | Buffer, contentType?: string } = {}) {
+    const step = this._addStep({
+      title: 'attach',
+      category: 'attach',
+      wallTime: Date.now(),
+    });
     this.attachments.push(await normalizeAndSaveAttachment(this.outputPath(), name, options));
+    step.complete({});
   }
 
   outputPath(...pathSegments: string[]){
diff --git a/packages/trace-viewer/src/ui/attachmentsTab.css b/packages/trace-viewer/src/ui/attachmentsTab.css
--- a/packages/trace-viewer/src/ui/attachmentsTab.css
+++ b/packages/trace-viewer/src/ui/attachmentsTab.css
@@ -0,0 +1,40 @@
+/*
+  Copyright (c) Microsoft Corporation.
+
+  Licensed under the Apache License, Version 2.0 (the "License");
+  you may not use this file except in compliance with the License.
+  You may obtain a copy of the License at
+
+      http://www.apache.org/licenses/LICENSE-2.0
+
+  Unless required by applicable law or agreed to in writing, software
+  distributed under the License is distributed on an "AS IS" BASIS,
+  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
+  See the License for the specific language governing permissions and
+  limitations under the License.
+*/
+
+.attachments-tab {
+  flex: auto;
+  line-height: 24px;
+  white-space: pre;
+  overflow: auto;
+  user-select: text;
+}
+
+.attachments-section {
+  padding-left: 6px;
+  font-weight: bold;
+  text-transform: uppercase;
+  font-size: 10px;
+  color: var(--vscode-sideBarTitle-foreground);
+  line-height: 24px;
+}
+
+.attachments-section:not(:first-child) {
+  border-top: 1px solid var(--vscode-panel-border);
+}
+
+.attachment-item {
+  margin: 4px 8px;
+}
diff --git a/packages/trace-viewer/src/ui/attachmentsTab.tsx b/packages/trace-viewer/src/ui/attachmentsTab.tsx
--- a/packages/trace-viewer/src/ui/attachmentsTab.tsx
+++ b/packages/trace-viewer/src/ui/attachmentsTab.tsx
@@ -0,0 +1,59 @@
+/**
+ * Copyright (c) Microsoft Corporation.
+ *
+ * Licensed under the Apache License, Version 2.0 (the "License");
+ * you may not use this file except in compliance with the License.
+ * You may obtain a copy of the License at
+ *
+ *     http://www.apache.org/licenses/LICENSE-2.0
+ *
+ * Unless required by applicable law or agreed to in writing, software
+ * distributed under the License is distributed on an "AS IS" BASIS,
+ * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
+ * See the License for the specific language governing permissions and
+ * limitations under the License.
+ */
+
+import type { ActionTraceEvent } from '@trace/trace';
+import * as React from 'react';
+import './attachmentsTab.css';
+import { ImageDiffView } from '@web/components/imageDiffView';
+import type { TestAttachment } from '@web/components/imageDiffView';
+
+export const AttachmentsTab: React.FunctionComponent<{
+  action: ActionTraceEvent | undefined,
+}> = ({ action }) => {
+  if (!action)
+    return null;
+  const expected = action.attachments?.find(a => a.name.endsWith('-expected.png') && (a.path || a.sha1)) as TestAttachment | undefined;
+  const actual = action.attachments?.find(a => a.name.endsWith('-actual.png') && (a.path || a.sha1)) as TestAttachment | undefined;
+  const diff = action.attachments?.find(a => a.name.endsWith('-diff.png') && (a.path || a.sha1)) as TestAttachment | undefined;
+
+  return <div className='attachments-tab'>
+    {expected && actual && <div className='attachments-section'>Image diff</div>}
+    {expected && actual && <ImageDiffView imageDiff={{
+      name: 'Image diff',
+      expected: { attachment: { ...expected, path: attachmentURL(expected) }, title: 'Expected' },
+      actual: { attachment: { ...actual, path: attachmentURL(actual) } },
+      diff: diff ? { attachment: { ...diff, path: attachmentURL(diff) } } : undefined,
+    }} />}
+    {<div className='attachments-section'>Attachments</div>}
+    {action.attachments?.map(a => {
+      return <div className='attachment-item'>
+        <a target='_blank' href={`sha1/${a.sha1}`}>{a.name}</a>
+      </div>;
+    })}
+  </div>;
+};
+
+function attachmentURL(attachment: {
+  name: string;
+  contentType: string;
+  path?: string;
+  sha1?: string;
+  body?: string;
+}) {
+  if (attachment.sha1)
+    return 'sha1/' + attachment.sha1;
+  return 'file?path=' + attachment.path;
+}
diff --git a/packages/trace-viewer/src/ui/callTab.tsx b/packages/trace-viewer/src/ui/callTab.tsx
--- a/packages/trace-viewer/src/ui/callTab.tsx
+++ b/packages/trace-viewer/src/ui/callTab.tsx
@@ -23,8 +23,6 @@ import { CopyToClipboard } from './copyToClipboard';
 import { asLocator } from '@isomorphic/locatorGenerators';
 import type { Language } from '@isomorphic/locatorGenerators';
 import { ErrorMessage } from '@web/components/errorMessage';
-import { ImageDiffView } from '@web/components/imageDiffView';
-import type { TestAttachment } from '@web/components/imageDiffView';
 
 export const CallTab: React.FunctionComponent<{
   action: ActionTraceEvent | undefined,
@@ -41,18 +39,7 @@ export const CallTab: React.FunctionComponent<{
   const wallTime = action.wallTime ? new Date(action.wallTime).toLocaleString() : null;
   const duration = action.endTime ? msToString(action.endTime - action.startTime) : 'Timed Out';
 
-  const expected = action.attachments?.find(a => a.name.endsWith('-expected.png') && (a.path || a.sha1)) as TestAttachment | undefined;
-  const actual = action.attachments?.find(a => a.name.endsWith('-actual.png') && (a.path || a.sha1)) as TestAttachment | undefined;
-  const diff = action.attachments?.find(a => a.name.endsWith('-diff.png') && (a.path || a.sha1)) as TestAttachment | undefined;
-
   return <div className='call-tab'>
-    { expected && actual && <div className='call-section'>Image diff</div> }
-    { expected && actual && <ImageDiffView imageDiff={{
-      name: 'Image diff',
-      expected: { attachment: { ...expected, path: attachmentURL(expected) }, title: 'Expected' },
-      actual: { attachment: { ...actual, path: attachmentURL(actual) } },
-      diff: diff ? { attachment: { ...diff, path: attachmentURL(diff) } } : undefined,
-    }} /> }
     {!!error && <ErrorMessage error={error} />}
     {!!error && <div className='call-section'>Call</div>}
     <div className='call-line'>{action.apiName}</div>
@@ -160,15 +147,3 @@ function parseSerializedValue(value: SerializedValue, handles: any[] | undefined
   }
   return '<object>';
 }
-
-function attachmentURL(attachment: {
-  name: string;
-  contentType: string;
-  path?: string;
-  sha1?: string;
-  body?: string;
-}) {
-  if (attachment.sha1)
-    return 'sha1/' + attachment.sha1;
-  return 'file?path=' + attachment.path;
-}
diff --git a/packages/trace-viewer/src/ui/sourceTab.tsx b/packages/trace-viewer/src/ui/sourceTab.tsx
--- a/packages/trace-viewer/src/ui/sourceTab.tsx
+++ b/packages/trace-viewer/src/ui/sourceTab.tsx
@@ -44,7 +44,7 @@ export const SourceTab: React.FunctionComponent<{
   const { source, highlight, targetLine, fileName } = useAsyncMemo<{ source: SourceModel, targetLine?: number, fileName?: string, highlight: SourceHighlight[] }>(async () => {
     const actionLocation = action?.stack?.[selectedFrame];
     const shouldUseFallback = !actionLocation?.file;
-    if (shouldUseFallback && !shouldUseFallback)
+    if (shouldUseFallback && !fallbackLocation)
       return { source: { file: '', errors: [], content: undefined }, targetLine: 0, highlight: [] };
 
     const file = shouldUseFallback ? fallbackLocation!.file : actionLocation.file;
diff --git a/packages/trace-viewer/src/ui/workbench.tsx b/packages/trace-viewer/src/ui/workbench.tsx
--- a/packages/trace-viewer/src/ui/workbench.tsx
+++ b/packages/trace-viewer/src/ui/workbench.tsx
@@ -30,6 +30,7 @@ import type { TabbedPaneTabModel } from '@web/components/tabbedPane';
 import { Timeline } from './timeline';
 import './workbench.css';
 import { MetadataView } from './metadataView';
+import { AttachmentsTab } from './attachmentsTab';
 
 export const Workbench: React.FunctionComponent<{
   model?: MultiTraceModel,
@@ -98,17 +99,24 @@ export const Workbench: React.FunctionComponent<{
     count: networkCount,
     render: () => <NetworkTab action={activeAction} />
   };
+  const attachmentsTab: TabbedPaneTabModel = {
+    id: 'attachments',
+    title: 'Attachments',
+    render: () => <AttachmentsTab action={activeAction} />
+  };
 
   const tabs: TabbedPaneTabModel[] = showSourcesFirst ? [
     sourceTab,
     consoleTab,
     networkTab,
     callTab,
+    attachmentsTab,
   ] : [
     callTab,
     consoleTab,
     networkTab,
     sourceTab,
+    attachmentsTab,
   ];
 
   return <div className='vbox'>
```

### 断言级测试 diff（机械定位方式已遮蔽；语义锚可见）

> 断言增删：+0 / -0。

```diff
（本次提交未改动断言级代码；旧断言保持不变。）
```

判定：`human2=（已按盲评协议填写，盲判阶段不可见）`  备注：

---

盲判：`final_blind=SUSPECTED_REGRESSION`  理由：提供的旧测试块仅截取到内层 vrt test（未包含旧定位器 page.getByText(/Log/) 的上下文），且应用 diff 中仅见 AttachmentsTab/CallTab 与 traceUtils 等改动，未见与 Log 直接相关的结构变更；依据保守原则判为 SUSPECTED_REGRESSION。

---

## rbx031 — tryghost/koenig (playwright)

- 测试文件：`packages/koenig-lexical/test/e2e/content-visibility.test.js` 第 35 行
- 旧定位器：`page.locator('[data-kg-card-toolbar="html"] [aria-label="Visibility"]'))`
- Commit：Aligned settings panel styles with Admin-X design system (#1373)
- Commit 说明：* Aligned settings panel styles with Admin-X design system
  
  REF PLG-187
  - Updated settings panel styles as groundwork for adding visibility settings to the settings panel.
  
  * Fixed tests
  
  REF PLG-187
  
  * Updated dark mode styles
  
  REF PLG-187
  
  * Moved HTML card visibility settings to the SettingsPanel
  
  REF PLG-206
  - Moved HTML card visibility settings to the SettingsPanel
  - Added TabView component
  - Removed VisibilityDropdown component
  
  * Updated label typography for settings panel
  
  REF PLG-187
  
  * Reduced spacing between settings panel elements
  
  REF PLG-187
  
  * Updated settings panel typography
  
  REF PLG-187
  
  * Updated settings panel and tab view styling
  
  REF PLG-187
  
  * Refactored SettingsPanel to use TabView
  
  REF PLG-206
  
  * Updated settings panel and tab view
  
  REF PLG-206
  
  * Updated e2e tests for visibility settings
  
  * Fixed e2e tests for visibility settings
  
  * Fixed e2e tests
  
  * Fix paste behaviour test
  
  * Fixed HTML card test
  
  * Fixed HTML card test
  
  * Updated paste behaviour test to match new HTML card structure
- 应用源码改动文件（41）：packages/koenig-lexical/src/assets/icons/kg-align-center.svg, packages/koenig-lexical/src/assets/icons/kg-align-left.svg, packages/koenig-lexical/src/assets/icons/kg-arrow-down.svg, packages/koenig-lexical/src/assets/icons/kg-card-type-email.svg, packages/koenig-lexical/src/assets/icons/kg-indicator-email.svg, packages/koenig-lexical/src/components/DesignSandbox.jsx, packages/koenig-lexical/src/components/ui/BackgroundImagePicker.jsx, packages/koenig-lexical/src/components/ui/ButtonGroup.jsx, packages/koenig-lexical/src/components/ui/CardVisibilityMessage.jsx, packages/koenig-lexical/src/components/ui/ColorOptionButtons.jsx, packages/koenig-lexical/src/components/ui/ColorPicker.jsx, packages/koenig-lexical/src/components/ui/Dropdown.jsx, packages/koenig-lexical/src/components/ui/DropdownContainer.jsx, packages/koenig-lexical/src/components/ui/Input.jsx, packages/koenig-lexical/src/components/ui/MediaPlaceholder.jsx, packages/koenig-lexical/src/components/ui/MediaPlaceholder.stories.jsx, packages/koenig-lexical/src/components/ui/MediaUploader.jsx, packages/koenig-lexical/src/components/ui/MultiSelectDropdown.jsx, packages/koenig-lexical/src/components/ui/ProgressBar.jsx, packages/koenig-lexical/src/components/ui/SettingsPanel.jsx, packages/koenig-lexical/src/components/ui/SettingsPanel.stories.jsx, packages/koenig-lexical/src/components/ui/SnippetInput/Dropdown.jsx, packages/koenig-lexical/src/components/ui/TabView.jsx, packages/koenig-lexical/src/components/ui/Toggle.jsx, packages/koenig-lexical/src/components/ui/Tooltip.jsx, packages/koenig-lexical/src/components/ui/VisibilityDropdown.jsx, packages/koenig-lexical/src/components/ui/cards/AudioCard.jsx, packages/koenig-lexical/src/components/ui/cards/EmailCtaCard.jsx, packages/koenig-lexical/src/components/ui/cards/HeaderCard/v1/HeaderCard.jsx, packages/koenig-lexical/src/components/ui/cards/HeaderCard/v2/HeaderCard.jsx, packages/koenig-lexical/src/components/ui/cards/HtmlCard.jsx, packages/koenig-lexical/src/components/ui/cards/MarkdownCard/MarkdownHelpDialog.jsx, packages/koenig-lexical/src/components/ui/cards/PaywallCard.jsx, packages/koenig-lexical/src/components/ui/cards/ProductCard.jsx, packages/koenig-lexical/src/components/ui/cards/SignupCard.jsx, packages/koenig-lexical/src/components/ui/cards/VideoCard.jsx, packages/koenig-lexical/src/hooks/useVisibilityToggle.js, packages/koenig-lexical/src/nodes/HtmlNodeComponent.jsx, packages/koenig-lexical/src/plugins/EmojiPickerPlugin.jsx, packages/koenig-lexical/src/plugins/TKPlugin.jsx, packages/koenig-lexical/tailwind.config.cjs

### 完整旧测试块

> 提取方式：完整 `it/test` 块，第 29–36 行；共 8 行。

```js
        test('toolbar shows content visibility icon', async function () {
            await insertHtmlCard();

            await expect(page.locator('[data-kg-card="html"]')).toHaveAttribute('data-kg-card-selected', 'true');
            await expect(page.locator('[data-kg-card="html"]')).toHaveAttribute('data-kg-card-editing', 'false');
            await expect(page.locator('[data-kg-card-toolbar="html"]')).toBeVisible();
            await expect(page.locator('[data-kg-card-toolbar="html"] [aria-label="Visibility"]')).toBeVisible();
        })
```

### 应用源码 diff（已排除测试文件）

```diff
diff --git a/packages/koenig-lexical/src/components/DesignSandbox.jsx b/packages/koenig-lexical/src/components/DesignSandbox.jsx
--- a/packages/koenig-lexical/src/components/DesignSandbox.jsx
+++ b/packages/koenig-lexical/src/components/DesignSandbox.jsx
@@ -222,7 +222,7 @@ const DesignSandbox = () => {
 
     function CardMenuSection({label, ...props}) {
         return (
-            <div className="mb-2 flex shrink-0 flex-col justify-center px-4 pt-3 text-xs font-medium uppercase tracking-[.06rem] text-grey" style={{minWidth: 'calc(100% - 3.2rem)'}} {...props}>
+            <div className="mb-2 flex shrink-0 flex-col justify-center px-4 pt-3 text-2xs font-medium uppercase tracking-[.06rem] text-grey" style={{minWidth: 'calc(100% - 3.2rem)'}} {...props}>
                 {label}
             </div>
         );
@@ -236,7 +236,7 @@ const DesignSandbox = () => {
                 </div>
                 <div className="flex flex-col">
                     <div className="m-0 ml-4 truncate text-[1.3rem] font-normal leading-[1.333em] tracking-[.02rem] text-grey-900">{label}</div>
-                    <div className="m-0 ml-4 truncate text-xs font-normal leading-[1.333em] tracking-[.02rem] text-grey">{desc}</div>
+                    <div className="m-0 ml-4 truncate text-2xs font-normal leading-[1.333em] tracking-[.02rem] text-grey">{desc}</div>
                 </div>
             </div>
         );
diff --git a/packages/koenig-lexical/src/components/ui/BackgroundImagePicker.jsx b/packages/koenig-lexical/src/components/ui/BackgroundImagePicker.jsx
--- a/packages/koenig-lexical/src/components/ui/BackgroundImagePicker.jsx
+++ b/packages/koenig-lexical/src/components/ui/BackgroundImagePicker.jsx
@@ -64,7 +64,7 @@ export function BackgroundImagePicker({onFileChange,
                                             </div>
                                         </>
                                         :
-                                        <button className="group flex h-[120px] w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-grey-300 bg-grey-50 dark:border-grey-800 dark:bg-grey-900" type="button" onClick={openFilePicker}>
+                                        <button className="group flex h-[120px] w-full cursor-pointer flex-col items-center justify-center rounded-md border border-grey-100 bg-grey-50 dark:border-grey-800 dark:bg-grey-900" type="button" onClick={openFilePicker}>
                                             <FileUploadIcon className="size-5 fill-grey-700 stroke-[3px] transition-all ease-linear group-hover:scale-105" />
                                             <span className="px-1 text-[1.35rem] font-medium text-grey-700">Click to upload background image</span>
                                         </button>
diff --git a/packages/koenig-lexical/src/components/ui/ButtonGroup.jsx b/packages/koenig-lexical/src/components/ui/ButtonGroup.jsx
--- a/packages/koenig-lexical/src/components/ui/ButtonGroup.jsx
+++ b/packages/koenig-lexical/src/components/ui/ButtonGroup.jsx
@@ -7,7 +7,7 @@ import {usePreviousFocus} from '../../hooks/usePreviousFocus';
 export function ButtonGroup({buttons = [], selectedName, onClick}) {
     return (
         <div className="flex">
-            <ul className="flex items-center justify-evenly rounded-lg bg-grey-100 font-sans text-md font-normal text-white dark:bg-black">
+            <ul className="flex items-center justify-evenly gap-[.6rem] rounded-lg font-sans text-md font-normal text-white">
                 {buttons.map(({label, name, Icon, dataTestId}) => (
                     <IconButton
                         key={`${name}-${label}`}
@@ -33,13 +33,13 @@ export function IconButton({dataTestId, onClick, label, name, selectedName, Icon
         <li className="mb-0">
             <button
                 aria-label={label}
-                className={`group relative m-[3px] flex h-7 w-8 cursor-pointer items-center justify-center ${isActive ? 'rounded-md bg-white text-black shadow-sm dark:bg-grey-900 dark:text-white' : 'text-grey-700 dark:text-white' } ${Icon || 'text-[1.3rem] font-bold'}`}
+                className={`group relative flex h-7 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-grey-150 dark:hover:bg-grey-900 ${isActive ? 'bg-grey-150 text-green-600 dark:bg-grey-900 dark:text-white' : 'text-black dark:text-white' } ${Icon || 'text-[1.3rem] font-bold'}`}
                 data-testid={dataTestId}
                 type="button"
                 onClick={handleClick}
                 onMouseDown={handleMousedown}
             >
-                {Icon ? <Icon className="size-4 stroke-2 text-black dark:text-white" /> : label}
+                {Icon ? <Icon className="size-4 stroke-2" /> : label}
                 {(Icon && label) && <Tooltip label={label} />}
             </button>
         </li>
diff --git a/packages/koenig-lexical/src/components/ui/CardVisibilityMessage.jsx b/packages/koenig-lexical/src/components/ui/CardVisibilityMessage.jsx
--- a/packages/koenig-lexical/src/components/ui/CardVisibilityMessage.jsx
+++ b/packages/koenig-lexical/src/components/ui/CardVisibilityMessage.jsx
@@ -4,7 +4,7 @@ export function CardVisibilityMessage({message}) {
     }
 
     return (
-        <div className="py-[.6rem] font-sans text-xs font-semibold uppercase leading-8 tracking-normal text-grey dark:text-grey-800" data-testid="visibility-message">
+        <div className="py-[.6rem] font-sans text-2xs font-semibold uppercase leading-8 tracking-normal text-grey dark:text-grey-800" data-testid="visibility-message">
             {message}
         </div>
     );
diff --git a/packages/koenig-lexical/src/components/ui/ColorOptionButtons.jsx b/packages/koenig-lexical/src/components/ui/ColorOptionButtons.jsx
--- a/packages/koenig-lexical/src/components/ui/ColorOptionButtons.jsx
+++ b/packages/koenig-lexical/src/components/ui/ColorOptionButtons.jsx
@@ -44,7 +44,7 @@ export function ColorButton({onClick, label, name, color, selectedName}) {
                 onMouseDown={handleMousedown}
             >
                 <span
-                    className={`${color} size-5 rounded-full border-2 border-black/5`}
+                    className={`${color} size-5 rounded-full border border-black/5`}
                 ></span>
             </button>
         </li>
diff --git a/packages/koenig-lexical/src/components/ui/ColorPicker.jsx b/packages/koenig-lexical/src/components/ui/ColorPicker.jsx
--- a/packages/koenig-lexical/src/components/ui/ColorPicker.jsx
+++ b/packages/koenig-lexical/src/components/ui/ColorPicker.jsx
@@ -3,7 +3,6 @@ import React, {Fragment, useCallback, useEffect, useRef} from 'react';
 import clsx from 'clsx';
 import {Button} from './Button';
 import {HexColorInput, HexColorPicker} from 'react-colorful';
-import {INPUT_CLASSES} from './Input';
 import {getAccentColor} from '../../utils/getAccentColor';
 
 export function ColorPicker({value, eyedropper, hasTransparentOption, onChange}) {
@@ -79,7 +78,7 @@ export function ColorPicker({value, eyedropper, hasTransparentOption, onChange})
         <div className="mt-2" onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
             <HexColorPicker color={hexValue || '#ffffff'} onChange={onChange} onMouseDown={startUsingColorPicker} onTouchStart={startUsingColorPicker} />
             <div className="mt-3 flex gap-2">
-                <div ref={inputWrapperRef} className={`relative flex w-full items-center ${INPUT_CLASSES}`} onClick={focusHexInputOnClick}>
+                <div ref={inputWrapperRef} className={`relative flex w-full items-center rounded-lg border border-grey-100 bg-grey-100 px-3 py-1.5 font-sans text-sm font-normal text-grey-900 transition-colors placeholder:text-grey-500 focus-within:border-green focus-within:bg-white focus-within:shadow-[0_0_0_2px_rgba(48,207,67,.25)] focus-within:outline-none dark:border-transparent dark:bg-grey-900 dark:text-white dark:selection:bg-grey-800 dark:placeholder:text-grey-700 dark:focus-within:border-green dark:hover:bg-grey-925 dark:focus:bg-grey-925`} onClick={focusHexInputOnClick}>
                     <span className='ml-1 mr-2 text-grey-700'>#</span>
                     <HexColorInput aria-label="Color value" className='z-50 w-full bg-transparent' color={hexValue} onChange={onChange} />
                     {eyedropper && !!window.EyeDropper && (
diff --git a/packages/koenig-lexical/src/components/ui/Dropdown.jsx b/packages/koenig-lexical/src/components/ui/Dropdown.jsx
--- a/packages/koenig-lexical/src/components/ui/Dropdown.jsx
+++ b/packages/koenig-lexical/src/components/ui/Dropdown.jsx
@@ -19,8 +19,8 @@ function Item({item, selected, onChange}) {
     };
 
     return (
-        <li key={item.name} className={`${selectionClass} !mb-1 hover:bg-grey-100 dark:hover:bg-grey-950`}>
-            <button className="size-full cursor-pointer px-3 py-1 text-left dark:text-white" data-test-value={item.name} type="button" onMouseDownCapture={event => handleOptionMouseDown(event, item.name)}>{item.label}</button>
+        <li key={item.name} className={`${selectionClass} m-0 hover:bg-grey-100 dark:hover:bg-grey-950`}>
+            <button className="size-full cursor-pointer px-3 py-[7px] text-left dark:text-white" data-test-value={item.name} type="button" onMouseDownCapture={event => handleOptionMouseDown(event, item.name)}>{item.label}</button>
         </li>
     );
 }
@@ -66,15 +66,15 @@ export function Dropdown({value, menu, onChange, dataTestId}) {
     return (
         <div className={`relative ${zIndex} font-sans text-sm font-normal`} data-testid={dataTestId}>
             <button
-                className={`relative w-full cursor-pointer border border-grey-300 px-3 py-2 text-left font-sans font-normal text-grey-900 focus-visible:outline-none dark:border-grey-900 dark:bg-grey-900 dark:text-white dark:placeholder:text-grey-800 ${open ? 'rounded-t-md' : 'rounded-md'}`}
+                className="relative h-9 w-full cursor-pointer rounded-lg border border-grey-150 bg-grey-150 px-3 py-1 pr-5 text-left font-sans font-normal leading-[1.5] text-grey-900 hover:border-grey-100 hover:bg-grey-100 focus-visible:outline-none dark:border-grey-900 dark:bg-grey-900 dark:text-white dark:placeholder:text-grey-800 md:h-[38px] md:py-2"
                 data-testid={`${dataTestId}-value`}
                 type="button"
                 onBlur={handleBlur}
                 onClick={handleOpen}
                 onMouseDownCapture={preventLoseFocus}
             >
                 {trigger}
-                <ArrowIcon className={`absolute right-2 top-4 size-2 text-grey-600 ${open && 'rotate-180'}`} />
+                <ArrowIcon className={`absolute right-3 top-[1.5rem] size-2 text-grey-900 ${open && 'rotate-180'}`} />
             </button>
             {open && (
                 <DropdownContainer>
diff --git a/packages/koenig-lexical/src/components/ui/DropdownContainer.jsx b/packages/koenig-lexical/src/components/ui/DropdownContainer.jsx
--- a/packages/koenig-lexical/src/components/ui/DropdownContainer.jsx
+++ b/packages/koenig-lexical/src/components/ui/DropdownContainer.jsx
@@ -11,9 +11,9 @@ import debounce from 'lodash/debounce';
  */
 export function DropdownContainer({
     dataTestId,
-    className = 'z-[-1] max-h-[30vh] w-full overflow-y-auto border border-grey-200 bg-white py-1 shadow dark:border-grey-800 dark:bg-grey-900',
-    placementTopClass = 'top-[2px] -translate-y-full rounded-t-md border-b-0',
-    placementBottomClass = 'mt-[-2px] rounded-b-md border-t-0',
+    className = 'z-[-1] max-h-[30vh] w-full overflow-y-auto bg-white shadow rounded-lg dark:border-grey-800 dark:bg-grey-900',
+    placementTopClass = '-top-0.5 -translate-y-full',
+    placementBottomClass = 'mt-0.5',
     children,
     ...props
 }) {
diff --git a/packages/koenig-lexical/src/components/ui/Input.jsx b/packages/koenig-lexical/src/components/ui/Input.jsx
--- a/packages/koenig-lexical/src/components/ui/Input.jsx
+++ b/packages/koenig-lexical/src/components/ui/Input.jsx
@@ -1,6 +1,6 @@
 import React from 'react';
 
-export const INPUT_CLASSES = 'rounded-md border border-grey-300 py-2 px-3 font-sans text-sm font-normal text-grey-900 focus:border-green focus:shadow-insetgreen focus-visible:outline-none dark:border-grey-900 dark:bg-grey-900 dark:text-white dark:placeholder:text-grey-700 dark:selection:bg-grey-800';
+export const INPUT_CLASSES = 'h-9 rounded-lg border border-grey-100 bg-grey-100 dark:bg-grey-900 dark:border-transparent dark:focus:border-green dark:hover:bg-grey-925 dark:focus:bg-grey-925 transition-colors px-3 py-1.5 font-sans text-sm font-normal text-grey-900 focus:border-green focus:bg-white focus:shadow-[0_0_0_2px_rgba(48,207,67,.25)] focus-visible:outline-none dark:text-white dark:selection:bg-grey-800 placeholder:text-grey-500 md:h-[38px] md:py-2 dark:placeholder:text-grey-700';
 
 export function Input({autoFocus, className, dataTestId, value, onChange, ...props}) {
     const inputRef = React.useRef(null);
diff --git a/packages/koenig-lexical/src/components/ui/MediaPlaceholder.jsx b/packages/koenig-lexical/src/components/ui/MediaPlaceholder.jsx
--- a/packages/koenig-lexical/src/components/ui/MediaPlaceholder.jsx
+++ b/packages/koenig-lexical/src/components/ui/MediaPlaceholder.jsx
@@ -44,14 +44,14 @@ export function MediaPlaceholder({
             className="not-kg-prose size-full" {...props}
             data-testid={dataTestId}
         >
-            <div className={`relative flex h-full items-center justify-center border bg-grey-50 dark:bg-grey-950 ${size === 'xsmall' ? 'before:pb-[12.5%]' : 'before:pb-[62.5%]'} ${borderStyle === 'dashed' ? 'rounded-md border-dashed border-grey/40' : 'border-grey/20 dark:border-grey/10'}`}>
+            <div className={`relative flex h-full items-center justify-center border bg-grey-50 ${size === 'xsmall' ? 'before:pb-[12.5%] dark:bg-grey-900' : 'before:pb-[62.5%] dark:bg-grey-950'} ${borderStyle === 'rounded' ? 'rounded-lg border-grey/20 dark:border-transparent' : 'border-grey/20 dark:border-grey/10'}`}>
                 {isDraggedOver ?
                     <CardText text={`Drop ${multiple ? '\'em' : 'it'} like it's hot 🔥`} /> :
                     <>
                         <button className={`group flex cursor-pointer select-none items-center justify-center ${size === 'xsmall' ? 'p-4' : 'flex-col p-20'}`} name="placeholder-button" type="button" onClick={filePicker}>
                             {(size === 'xsmall' && errors.length > 0) ||
                                 <>
-                                    <Icon className={`shrink-0 opacity-80 transition-all ease-linear hover:scale-105 group-hover:opacity-100 ${size === 'large' ? 'size-20 text-grey' : size === 'small' ? 'size-14 text-grey' : size === 'xsmall' ? 'size-6 text-grey-700' : 'size-16 text-grey'} ${(size === 'xsmall') && desc ? 'mr-3' : ''}`} />
+                                    <Icon className={`shrink-0 opacity-80 transition-all ease-linear hover:scale-105 group-hover:opacity-100 ${size === 'large' ? 'size-20 text-grey' : size === 'small' ? 'size-14 text-grey' : size === 'xsmall' ? 'size-5 text-grey-700' : 'size-16 text-grey'} ${(size === 'xsmall') && desc ? 'mr-3' : ''}`} />
                                     <p className={`flex min-w-[auto] !font-sans !text-sm !font-normal text-grey-700 opacity-80 transition-all group-hover:opacity-100 ${size === 'xsmall' ? '!mt-0' : '!mt-4'}`}>{desc}</p>
                                 </>
                             }
@@ -74,9 +74,9 @@ MediaPlaceholder.propTypes = {
     icon: PropTypes.oneOf(['image', 'gallery', 'video', 'audio', 'file', 'product']),
     desc: PropTypes.string,
     size: PropTypes.oneOf(['xsmall', 'small', 'medium', 'large']),
-    borderStyle: PropTypes.oneOf(['solid', 'dashed'])
+    borderStyle: PropTypes.oneOf(['squared', 'rounded'])
 };
 
 MediaPlaceholder.defaultProps = {
-    borderStyle: 'solid'
+    borderStyle: 'squared'
 };
diff --git a/packages/koenig-lexical/src/components/ui/MediaPlaceholder.stories.jsx b/packages/koenig-lexical/src/components/ui/MediaPlaceholder.stories.jsx
--- a/packages/koenig-lexical/src/components/ui/MediaPlaceholder.stories.jsx
+++ b/packages/koenig-lexical/src/components/ui/MediaPlaceholder.stories.jsx
@@ -15,7 +15,7 @@ const story = {
             control: {type: 'select'}
         },
         borderStyle: {
-            options: ['solid', 'dashed'],
+            options: ['squared', 'rounded'],
             control: {type: 'radio'}
         }
     },
@@ -38,54 +38,54 @@ Image.args = {
     icon: 'image',
     desc: 'Click to select an image',
     size: 'medium',
-    borderStyle: 'solid'
+    borderStyle: 'squared'
 };
 
 export const Gallery = Template.bind({});
 Gallery.args = {
     icon: 'gallery',
     desc: 'Click to select up to 9 images',
     size: 'large',
-    borderStyle: 'solid'
+    borderStyle: 'squared'
 };
 
 export const Video = Template.bind({});
 Video.args = {
     icon: 'video',
     desc: 'Click to select a video',
     size: 'medium',
-    borderStyle: 'solid'
+    borderStyle: 'squared'
 };
 
 export const Audio = Template.bind({});
 Audio.args = {
     icon: 'audio',
     desc: 'Click to upload an audio file',
     size: 'xsmall',
-    borderStyle: 'solid'
+    borderStyle: 'squared'
 };
 
 export const File = Template.bind({});
 File.args = {
     icon: 'file',
     desc: 'Click to upload a file',
     size: 'xsmall',
-    borderStyle: 'solid'
+    borderStyle: 'squared'
 };
 
 export const Product = Template.bind({});
 Product.args = {
     icon: 'product',
     desc: 'Click to upload a product image',
     size: 'small',
-    borderStyle: 'solid'
+    borderStyle: 'squared'
 };
 
 export const Error = Template.bind({});
 Error.args = {
     icon: 'video',
     desc: 'Click to select a video',
     size: 'medium',
-    borderStyle: 'solid',
+    borderStyle: 'squared',
     errors: [{message: 'The file type you uploaded is not supported. Please use .MP4, .WEBM, .OGV'}]
 };
diff --git a/packages/koenig-lexical/src/components/ui/MediaUploader.jsx b/packages/koenig-lexical/src/components/ui/MediaUploader.jsx
--- a/packages/koenig-lexical/src/components/ui/MediaUploader.jsx
+++ b/packages/koenig-lexical/src/components/ui/MediaUploader.jsx
@@ -17,7 +17,7 @@ export function MediaUploader({
     desc,
     icon,
     size,
-    borderStyle = 'solid',
+    borderStyle = 'squared',
     backgroundSize = 'cover',
     mimeTypes,
     onFileChange,
@@ -79,13 +79,13 @@ export function MediaUploader({
         <div className={clsx('group/image relative flex items-center justify-center', borderStyle === 'dashed' && 'rounded', className)} data-testid="media-upload-filled">
             {src && (
                 <>
-                    <img alt={alt} className={clsx('mx-auto size-full', backgroundSize === 'cover' ? 'object-cover' : 'object-contain', borderStyle === 'dashed' && 'rounded', imgClassName)} src={src} />
-                    <div className={clsx('absolute inset-0 bg-gradient-to-t from-black/0 via-black/5 to-black/30 opacity-0 transition-all group-hover/image:opacity-100', borderStyle === 'dashed' && 'rounded')}></div>
+                    <img alt={alt} className={clsx('mx-auto size-full rounded-lg', backgroundSize === 'cover' ? 'object-cover' : 'object-contain', imgClassName)} src={src} />
+                    <div className={clsx('absolute inset-0 rounded-lg bg-gradient-to-t from-black/0 via-black/5 to-black/30 opacity-0 transition-all group-hover/image:opacity-100', borderStyle === 'dashed' && 'rounded-lg')}></div>
                 </>
             )}
 
             {!isLoading && (
-                <div className="absolute right-2 top-2 flex space-x-2 opacity-0 transition-all group-hover/image:opacity-100">
+                <div className="absolute right-1 top-1 flex space-x-1 opacity-0 transition-all group-hover/image:opacity-100">
                     {additionalActions}
                     { isPinturaEnabled && <IconButton Icon={WandIcon} label="Edit" onClick={() => openImageEditor({
                         image: src,
@@ -103,7 +103,7 @@ export function MediaUploader({
 
             {isLoading && (
                 <div
-                    className={clsx('absolute inset-0 flex min-w-full items-center justify-center overflow-hidden border border-dashed border-grey/20 bg-grey-50', borderStyle === 'dashed' && 'rounded')}
+                    className={clsx('absolute inset-0 flex min-w-full items-center justify-center overflow-hidden border border-grey-100 bg-grey-75', borderStyle === 'rounded' && 'rounded-lg')}
                     data-testid="custom-thumbnail-progress"
                 >
                     <ProgressBar style={progressStyle} />
diff --git a/packages/koenig-lexical/src/components/ui/MultiSelectDropdown.jsx b/packages/koenig-lexical/src/components/ui/MultiSelectDropdown.jsx
--- a/packages/koenig-lexical/src/components/ui/MultiSelectDropdown.jsx
+++ b/packages/koenig-lexical/src/components/ui/MultiSelectDropdown.jsx
@@ -8,7 +8,7 @@ function Item({item, selected, onChange}) {
     let selectionClass = '';
 
     if (selected) {
-        selectionClass = 'bg-grey-100 dark:bg-grey-950';
+        selectionClass = 'bg-grey-100 dark:bg-grey-900';
     }
 
     // We use the capture phase of the mouse down event, otherwise the list option will be removed when blurring the input
@@ -20,9 +20,9 @@ function Item({item, selected, onChange}) {
     };
 
     return (
-        <li key={item.name} className={`${selectionClass} !mb-1 hover:bg-grey-100 dark:hover:bg-grey-950`} >
+        <li key={item.name} className={`${selectionClass} m-0 hover:bg-grey-100 dark:hover:bg-grey-900`} >
             <button
-                className="size-full cursor-pointer px-3 py-1 text-left dark:text-white"
+                className="size-full cursor-pointer px-3 py-[7px] text-left dark:text-white"
                 data-testid="multiselect-dropdown-item"
                 type="button"
                 onMouseDownCapture={handleOptionMouseDown}
@@ -36,6 +36,7 @@ function Item({item, selected, onChange}) {
 export function MultiSelectDropdown({placeholder = '', items = [], availableItems = [], onChange, dataTestId, allowAdd = true}) {
     const [open, setOpen] = React.useState(false);
     const [filter, setFilter] = React.useState('');
+    const [isFocused, setIsFocused] = React.useState(false);
     const inputRef = React.useRef(null);
 
     const handleOpen = (event) => {
@@ -50,6 +51,12 @@ export function MultiSelectDropdown({placeholder = '', items = [], availableItem
     const handleBlur = () => {
         setOpen(false);
         setFilter('');
+        setIsFocused(false);
+    };
+
+    const handleFocus = () => {
+        setIsFocused(true);
+        handleOpen();
     };
 
     const handleSelect = (item) => {
@@ -96,27 +103,25 @@ export function MultiSelectDropdown({placeholder = '', items = [], availableItem
         if (!exactMatch) {
             filteredItems.unshift({name: filter, label: <>Add <strong>&quot;{filter}&quot;...</strong></>});
         }
-    } else if (!filter) {
-        prefixItem = getItem({name: '', label: 'Type to search'}, false);
     }
 
     return (
         <div className="relative z-0 font-sans text-sm font-normal" data-testid={dataTestId}>
             <div
-                className={`relative flex w-full cursor-text flex-wrap gap-1 rounded-md border border-grey-300 bg-white py-2 pl-3 pr-5 text-left font-sans font-normal text-grey-900 focus-within:border-green focus-within:shadow-insetgreen focus-visible:outline-none dark:border-grey-900 dark:bg-grey-900 dark:text-white dark:placeholder:text-grey-800`}
+                className={`relative flex w-full cursor-text flex-wrap gap-1 rounded-lg border ${isFocused ? 'border-green bg-white shadow-[0_0_0_2px_rgba(48,207,67,.25)] dark:bg-grey-925' : 'border-grey-100 bg-grey-100 dark:border-transparent dark:bg-grey-900 dark:hover:bg-grey-925'} px-[10px] py-2 pr-5 font-sans text-sm font-normal leading-[1.5] text-grey-900 placeholder:text-grey-500 focus-visible:outline-none dark:text-white dark:selection:bg-grey-800 dark:placeholder:text-grey-700`}
                 type="button"
                 onClick={() => inputRef.current.focus()}
             >
                 {selectedItems.map(item => (
                     <button
                         key={item.name}
-                        className="flex cursor-pointer items-center rounded-sm bg-black px-[1rem] py-[.6rem] leading-none text-white dark:bg-grey-100 dark:text-grey-900"
+                        className="flex cursor-pointer items-center gap-1.5 rounded bg-black py-px pl-2 pr-1 leading-[1.5] text-white dark:bg-grey-100 dark:text-grey-900"
                         data-testid="multiselect-dropdown-selected"
                         type="button"
                         onMouseDownCapture={event => handleDeselect(event, item)}
                     >
                         {item.label}
-                        <CloseIcon className="ml-2 mt-[1px] size-2" />
+                        <CloseIcon className="mt-px size-[1rem] stroke-[3]" />
                     </button>
                 ))}
 
@@ -128,12 +133,12 @@ export function MultiSelectDropdown({placeholder = '', items = [], availableItem
                         value={filter}
                         onBlur={handleBlur}
                         onChange={event => setFilter(event.target.value)}
-                        onFocus={handleOpen}
+                        onFocus={handleFocus}
                         onKeyDown={handleBackspace}
                     />
                 </div>
 
-                <ArrowIcon className={`absolute right-2 top-4 size-2 text-grey-600 ${open && 'rotate-180'}`} />
+                <ArrowIcon className={`absolute right-3 top-4 size-2 text-grey-900 ${open && 'rotate-180'}`} />
             </div>
             {open && !!filteredItems.length && (
                 <DropdownContainer>
diff --git a/packages/koenig-lexical/src/components/ui/ProgressBar.jsx b/packages/koenig-lexical/src/components/ui/ProgressBar.jsx
--- a/packages/koenig-lexical/src/components/ui/ProgressBar.jsx
+++ b/packages/koenig-lexical/src/components/ui/ProgressBar.jsx
@@ -4,7 +4,7 @@ import React from 'react';
 export function ProgressBar({style, fullWidth, bgStyle}) {
     return (
         <div className={`rounded-full bg-grey-200 dark:bg-black ${fullWidth ? 'w-full' : 'mx-auto w-3/5'} ${bgStyle === 'transparent' ? 'bg-white/30' : 'bg-grey-200'}`} data-testid="progress-bar">
-            <div className="rounded-full bg-green py-1 text-center text-xs leading-none text-white" style={style}></div>
+            <div className="rounded-full bg-green py-1 text-center text-2xs leading-none text-white" style={style}></div>
         </div>
     );
 }
diff --git a/packages/koenig-lexical/src/components/ui/SettingsPanel.jsx b/packages/koenig-lexical/src/components/ui/SettingsPanel.jsx
--- a/packages/koenig-lexical/src/components/ui/SettingsPanel.jsx
+++ b/packages/koenig-lexical/src/components/ui/SettingsPanel.jsx
@@ -11,32 +11,48 @@ import {InputList, InputListItem} from './InputList.jsx';
 import {MediaUploader} from './MediaUploader';
 import {MultiSelectDropdown} from './MultiSelectDropdown';
 import {Slider} from './Slider.jsx';
+import {TabView} from './TabView';
 import {Toggle} from './Toggle';
 
-export function SettingsPanel({children, darkMode, cardWidth}) {
+export function SettingsPanel({children, darkMode, cardWidth, tabs, defaultTab}) {
     const {ref} = useSettingsPanelReposition({}, cardWidth);
 
+    const tabContent = React.useMemo(() => {
+        if (!tabs) {
+            return {default: children};
+        }
+        return typeof children === 'object' && children !== null ? children : {default: children};
+    }, [tabs, children]);
+
     return (
         // Ideally we would use Portal to avoid issues with transformed ancestors (https://bugs.chromium.org/p/chromium/issues/detail?id=20574)
         // However, Portal causes problems with drag/drop, focus, etc
         <div className={`!mt-0 touch-none ${darkMode ? 'dark' : ''}`}>
-            <div ref={ref}
-                className="not-kg-prose fixed left-0 top-0 z-[9999999] m-0 flex w-[320px] flex-col gap-2 rounded-lg bg-white bg-clip-padding p-6 font-sans shadow-lg will-change-transform dark:bg-grey-950 dark:shadow-xl"
-                data-testid="settings-panel"
-            >
-                {children}
-            </div>
+
+            {tabs ? (
+                <div ref={ref}
+                    className="not-kg-prose fixed left-0 top-0 z-[9999999] m-0 flex w-[320px] flex-col rounded-lg bg-white bg-clip-padding font-sans shadow-lg will-change-transform dark:bg-grey-950 dark:shadow-xl"
+                    data-testid="settings-panel"
+                >
+                    <TabView defaultTab={defaultTab} tabContent={tabContent} tabs={tabs} />
+                </div>
+            ) : (
+                <div ref={ref}
+                    className="not-kg-prose fixed left-0 top-0 z-[9999999] m-0 flex w-[320px] flex-col gap-3 rounded-lg bg-white bg-clip-padding p-6 font-sans shadow-lg will-change-transform dark:bg-grey-950 dark:shadow-xl"
+                    data-testid="settings-panel"
+                >{children}</div>
+            )}
         </div>
     );
 }
 
 export function ToggleSetting({label, description, isChecked, onChange, dataTestId}) {
     return (
-        <label className="mt-2 flex min-h-[3rem] w-full cursor-pointer items-center justify-between text-[1.3rem] first:mt-0">
+        <label className="flex w-full cursor-pointer items-center justify-between">
             <div>
-                <div className="font-bold text-grey-900 dark:text-grey-300">{label}</div>
+                <div className="text-sm font-medium tracking-normal text-grey-900 dark:text-grey-300">{label}</div>
                 {description &&
-                    <p className="w-11/12 text-[1.25rem] font-normal leading-snug text-grey-700">{description}</p>
+                    <p className="mt-1 w-11/12 text-xs font-normal leading-snug text-grey-700 dark:text-grey-600">{description}</p>
                 }
             </div>
             <div className="flex shrink-0 pl-2">
@@ -50,24 +66,24 @@ export function SliderSetting({label, onChange, max, min, value, defaultValue, d
     return (
         <div className="my-2 flex w-full flex-col gap-1">
             <div className="flex items-center justify-between font-sans text-[1.3rem] font-normal">
-                <div className="font-bold text-grey-900 dark:text-grey-200">{label}</div>
+                <div className="text-sm font-medium tracking-normal text-grey-900 dark:text-grey-300">{label}</div>
                 <div className="text-grey-900 dark:text-grey-100" data-testid={`${dataTestId}-value`}>{value}</div>
             </div>
             <Slider dataTestId={dataTestId} defaultValue={defaultValue} max={max} min={min} value={value} onChange={onChange} />
             {description &&
-                <p className="mt-1 text-[1.25rem] font-normal leading-snug text-grey-700">{description}</p>
+                <p className="mt-1 text-xs font-normal leading-snug text-grey-700 dark:text-grey-600">{description}</p>
             }
         </div>
     );
 }
 
 export function InputSetting({label, hideLabel, description, onChange, value, placeholder, dataTestId, onBlur}) {
     return (
-        <div className="mt-2 flex w-full flex-col justify-between gap-2 text-[1.3rem] first:mt-0">
-            <div className={hideLabel ? 'sr-only' : 'font-bold text-grey-900 dark:text-grey-200'}>{label}</div>
+        <div className="flex w-full flex-col justify-between">
+            <div className={hideLabel ? 'sr-only' : 'mb-1.5 text-sm font-medium tracking-normal text-grey-900 dark:text-grey-300'}>{label}</div>
             <Input dataTestId={dataTestId} placeholder={placeholder} value={value} onBlur={onBlur} onChange={onChange} />
             {description &&
-                <p className="text-[1.25rem] font-normal leading-snug text-grey-700">{description}</p>
+                <p className="text-xs font-normal leading-snug text-grey-700 dark:text-grey-600">{description}</p>
             }
         </div>
     );
@@ -123,8 +139,8 @@ export function InputListSetting({dataTestId, description, label, listOptions, o
             <InputListItem
                 key={item.value}
                 className={clsx(
-                    selected && 'bg-grey-100',
-                    'cursor-pointer px-4 py-2 text-left hover:bg-grey-100 dark:hover:bg-black'
+                    selected && 'bg-grey-100 dark:bg-grey-925',
+                    'm-0 cursor-pointer px-3 py-[7px] text-left hover:bg-grey-100 dark:hover:bg-grey-925'
                 )}
                 dataTestId={dataTestId}
                 item={item}
@@ -133,7 +149,7 @@ export function InputListSetting({dataTestId, description, label, listOptions, o
                 onClick={onClick}
                 onMouseOver={onMouseOver}
             >
-                <span className="block text-sm font-semibold leading-tight text-black dark:text-white" data-testid={`${dataTestId}-listOption-${item.label}`}>{item.label}</span>
+                <span className="block text-sm font-normal leading-tight text-black dark:text-white" data-testid={`${dataTestId}-listOption-${item.label}`}>{item.label}</span>
                 <span className="block truncate text-xs leading-tight text-grey-700 dark:text-grey-600" data-testid={`${dataTestId}-listOption-${item.value}`}>
                     {item.value}
                 </span>
@@ -142,8 +158,8 @@ export function InputListSetting({dataTestId, description, label, listOptions, o
     };
 
     return (
-        <div className="mt-2 flex w-full flex-col justify-between gap-2 text-[1.3rem] first:mt-0">
-            <div className="font-bold text-grey-900 dark:text-grey-200">{label}</div>
+        <div className="flex w-full flex-col justify-between">
+            <div className="text-sm font-medium tracking-normal text-grey-900 dark:text-grey-300">{label}</div>
             <InputList
                 dataTestId={dataTestId}
                 getItem={getItem}
@@ -153,24 +169,24 @@ export function InputListSetting({dataTestId, description, label, listOptions, o
                 onChange={onChange}
             />
             {description &&
-                <p className="text-[1.25rem] font-normal leading-snug text-grey-700">{description}</p>
+                <p className="text-xs font-normal leading-snug text-grey-700 dark:text-grey-600">{description}</p>
             }
         </div>
     );
 }
 
 export function DropdownSetting({label, description, value, menu, onChange, dataTestId}) {
     return (
-        <div className="mt-2 flex w-full flex-col justify-between gap-2 text-[1.3rem] first:mt-0">
-            <div className="font-bold text-grey-900 dark:text-grey-200" data-testid={`${dataTestId}-label`}>{label}</div>
+        <div className="flex w-full flex-col justify-between gap-1">
+            <div className="text-sm font-medium tracking-normal text-grey-900 dark:text-grey-300" data-testid={`${dataTestId}-label`}>{label}</div>
             <Dropdown
                 dataTestId={dataTestId}
                 menu={menu}
                 value={value}
                 onChange={onChange}
             />
             {description &&
-                    <p className="text-[1.25rem] font-normal leading-snug text-grey-700">{description}</p>
+                    <p className="text-xs font-normal leading-snug text-grey-700 dark:text-grey-600">{description}</p>
             }
         </div>
     );
@@ -186,8 +202,8 @@ export function DropdownSetting({label, description, value, menu, onChange, data
  */
 export function MultiSelectDropdownSetting({label, description, placeholder = '', items, availableItems, onChange, dataTestId, allowAdd = true}) {
     return (
-        <div className="mt-2 flex w-full flex-col justify-between gap-2 text-[1.3rem] first:mt-0">
-            <div className="font-bold text-grey-900 dark:text-grey-200">{label}</div>
+        <div className="flex w-full flex-col justify-between gap-1">
+            <div className="text-sm font-medium tracking-normal text-grey-900 dark:text-grey-300">{label}</div>
             <MultiSelectDropdown
                 allowAdd={allowAdd}
                 availableItems={availableItems}
@@ -197,16 +213,16 @@ export function MultiSelectDropdownSetting({label, description, placeholder = ''
                 onChange={onChange}
             />
             {description &&
-                    <p className="text-[1.25rem] font-normal leading-snug text-grey-700">{description}</p>
+                    <p className="text-xs font-normal leading-snug text-grey-700 dark:text-grey-600">{description}</p>
             }
         </div>
     );
 }
 
 export function ButtonGroupSetting({label, onClick, selectedName, buttons}) {
     return (
-        <div className="mt-2 flex w-full items-center justify-between text-[1.3rem] first:mt-0">
-            <div className="font-bold text-grey-900 dark:text-grey-200">{label}</div>
+        <div className="flex w-full items-center justify-between text-[1.3rem]">
+            <div className="text-sm font-medium tracking-normal text-grey-900 dark:text-grey-300">{label}</div>
 
             <div className="shrink-0 pl-2">
                 <ButtonGroup buttons={buttons} selectedName={selectedName} onClick={onClick} />
@@ -217,8 +233,8 @@ export function ButtonGroupSetting({label, onClick, selectedName, buttons}) {
 
 export function ColorOptionSetting({label, onClick, selectedName, buttons, layout, dataTestId}) {
     return (
-        <div className={`mt-2 flex w-full text-[1.3rem] first:mt-0 ${layout === 'stacked' ? 'flex-col' : 'items-center justify-between'}`} data-testid={dataTestId}>
-            <div className="font-bold text-grey-900 dark:text-grey-200">{label}</div>
+        <div className={`flex w-full text-[1.3rem] ${layout === 'stacked' ? 'flex-col' : 'items-center justify-between'}`} data-testid={dataTestId}>
+            <div className="text-sm font-medium tracking-normal text-grey-900 dark:text-grey-300">{label}</div>
 
             <div className={`shrink-0 ${layout === 'stacked' ? '-mx-1 pt-1' : 'pl-2'}`}>
                 <ColorOptionButtons buttons={buttons} selectedName={selectedName} onClick={onClick} />
@@ -251,9 +267,9 @@ export function ColorPickerSetting({label, isExpanded, onSwatchChange, onPickerC
     }, [isExpanded]);
 
     return (
-        <div className="mt-2 flex-col" data-testid={dataTestId} onClick={markClickedInside}>
-            <div className="flex w-full items-center justify-between text-[1.3rem] first:mt-0">
-                <div className="font-bold text-grey-900 dark:text-grey-200">{label}</div>
+        <div className="flex-col" data-testid={dataTestId} onClick={markClickedInside}>
+            <div className="flex w-full items-center justify-between text-[1.3rem]">
+                <div className="text-sm font-medium tracking-normal text-grey-900 dark:text-grey-300">{label}</div>
 
                 <div className="shrink-0 pl-2">
                     <ColorIndicator
@@ -272,8 +288,8 @@ export function ColorPickerSetting({label, isExpanded, onSwatchChange, onPickerC
 
 export function MediaUploadSetting({className, label, hideLabel, onFileChange, isDraggedOver, placeholderRef, src, alt, isLoading, errors = [], progress, onRemoveMedia, icon, desc = '', size, borderStyle, mimeTypes, isPinturaEnabled, openImageEditor, setFileInputRef}) {
     return (
-        <div className={clsx('mt-2 text-[1.3rem] first:mt-0', className)} data-testid="media-upload-setting">
-            <div className={hideLabel ? 'sr-only' : 'font-bold text-grey-900 dark:text-grey-200'}>{label}</div>
+        <div className={clsx(className)} data-testid="media-upload-setting">
+            <div className={hideLabel ? 'sr-only' : 'mb-2 text-sm font-medium tracking-normal text-grey-900 dark:text-grey-400'}>{label}</div>
 
             <MediaUploader
                 alt={alt}
@@ -297,9 +313,3 @@ export function MediaUploadSetting({className, label, hideLabel, onFileChange, i
         </div>
     );
 }
-
-export function SettingsDivider() {
-    return (
-        <hr className="-mx-6 mt-2 border-grey-250 dark:border-white/5" />
-    );
-}
diff --git a/packages/koenig-lexical/src/components/ui/SettingsPanel.stories.jsx b/packages/koenig-lexical/src/components/ui/SettingsPanel.stories.jsx
--- a/packages/koenig-lexical/src/components/ui/SettingsPanel.stories.jsx
+++ b/packages/koenig-lexical/src/components/ui/SettingsPanel.stories.jsx
@@ -6,12 +6,12 @@ import ImgFullIcon from '../../assets/icons/kg-img-full.svg?react';
 import ImgRegularIcon from '../../assets/icons/kg-img-regular.svg?react';
 import ImgWideIcon from '../../assets/icons/kg-img-wide.svg?react';
 import LeftAlignIcon from '../../assets/icons/kg-align-left.svg?react';
-import {ButtonGroupSetting, ColorOptionSetting, ColorPickerSetting, DropdownSetting, InputSetting, MediaUploadSetting, MultiSelectDropdownSetting, SettingsDivider, SettingsPanel, ToggleSetting} from './SettingsPanel';
+import {ButtonGroupSetting, ColorOptionSetting, ColorPickerSetting, DropdownSetting, InputSetting, MediaUploadSetting, MultiSelectDropdownSetting, SettingsPanel, ToggleSetting} from './SettingsPanel';
 
 const story = {
     title: 'Settings panel/Settings panel',
     component: SettingsPanel,
-    subcomponents: {ToggleSetting, InputSetting, SettingsDivider, ButtonGroupSetting},
+    subcomponents: {ToggleSetting, InputSetting, ButtonGroupSetting},
     parameters: {
         status: {
             type: 'uiReady'
@@ -83,10 +83,8 @@ EmailCtaCard.args = {
             menu={[{label: 'Free members', name: 'status:free'}, {label: 'Paid members', name: 'status:-free'}]}
             value='status:free'
         />,
-        <SettingsDivider />,
         <ButtonGroupSetting buttons={alignmentButtonGroup} label='Content alignment' />,
         <ToggleSetting label='Separators' />,
-        <SettingsDivider />,
         <ToggleSetting label='Button' />,
         <InputSetting label='Button text' placeholder='Add button text' />,
         <InputSetting label='Button URL' placeholder='https://yoursite.com/#/portal/signup/' />
@@ -114,7 +112,6 @@ export const ButtonCard = Template.bind({});
 ButtonCard.args = {
     children: [
         <ButtonGroupSetting buttons={alignmentButtonGroup} label='Content alignment' />,
-        <SettingsDivider />,
         <InputSetting label='Button text' placeholder='Add button text' />,
         <InputSetting label='Button URL' placeholder='https://yoursite.com/#/portal/signup/' />
     ]
@@ -188,7 +185,7 @@ VideoCard.args = {
             label='Loop'
         />,
         <MediaUploadSetting
-            borderStyle='dashed'
+            borderStyle='rounded'
             desc=''
             icon='file'
             label='Custom thumbnail'
@@ -201,7 +198,6 @@ export const ProductCard = Template.bind({});
 ProductCard.args = {
     children: [
         <ToggleSetting label='Rating' />,
-        <SettingsDivider />,
         <ToggleSetting label='Button' />,
         <InputSetting label='Button text' placeholder='Add button text' />,
         <InputSetting label='Button URL' placeholder='https://yoursite.com/#/portal/signup/' />
@@ -228,7 +224,6 @@ HeaderCard.args = {
     children: [
         <ButtonGroupSetting buttons={sizeButtonGroup} label='Size' />,
         <ColorOptionSetting buttons={headerColorPicker} label='Style' />,
-        <SettingsDivider />,
         <ToggleSetting label='Button' />,
         <InputSetting label='Button text' placeholder='Add button text' />,
         <InputSetting label='Button URL' placeholder='https://yoursite.com/#/portal/signup/' />
diff --git a/packages/koenig-lexical/src/components/ui/SnippetInput/Dropdown.jsx b/packages/koenig-lexical/src/components/ui/SnippetInput/Dropdown.jsx
--- a/packages/koenig-lexical/src/components/ui/SnippetInput/Dropdown.jsx
+++ b/packages/koenig-lexical/src/components/ui/SnippetInput/Dropdown.jsx
@@ -13,7 +13,7 @@ export const Dropdown = ({
 }) => {
     return (
         <ul
-            className="absolute mt-[-1px] w-full max-w-[240px] rounded-b border border-grey-200 bg-white shadow dark:border-grey-900 dark:bg-grey-950"
+            className="absolute mt-[-1px] w-full max-w-[240px] rounded-b border border-grey-200 bg-white shadow-md dark:border-grey-900 dark:bg-grey-950"
             tabIndex={0}
             onKeyDown={onKeyDown}
         >
diff --git a/packages/koenig-lexical/src/components/ui/TabView.jsx b/packages/koenig-lexical/src/components/ui/TabView.jsx
--- a/packages/koenig-lexical/src/components/ui/TabView.jsx
+++ b/packages/koenig-lexical/src/components/ui/TabView.jsx
@@ -0,0 +1,48 @@
+import PropTypes from 'prop-types';
+import React, {useState} from 'react';
+
+const TabView = ({tabs, defaultTab, tabContent}) => {
+    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].id);
+
+    const handleTabChange = (tabId) => {
+        setActiveTab(tabId);
+    };
+
+    return (
+        <>
+            <div className="no-scrollbar flex w-full gap-5 border-b border-grey-300 px-6 dark:border-grey-900">
+                {tabs.map(tab => (
+                    <button
+                        key={tab.id}
+                        className={`-mb-px cursor-pointer appearance-none whitespace-nowrap border-b-2 pb-3 pt-4 text-sm font-semibold transition-all ${
+                            activeTab === tab.id
+                                ? 'border-black text-black dark:border-white dark:text-white'
+                                : 'border-transparent text-grey-600 hover:border-grey-500 dark:text-white'
+                        }`}
+                        data-testid={`tab-${tab.id}`}
+                        type="button"
+                        onClick={() => handleTabChange(tab.id)}
+                    >
+                        {tab.label}
+                    </button>
+                ))}
+            </div>
+            <div className="flex flex-col gap-3 p-6">
+                {tabContent[activeTab]}
+            </div>
+        </>
+    );
+};
+
+TabView.propTypes = {
+    tabs: PropTypes.arrayOf(
+        PropTypes.shape({
+            id: PropTypes.string.isRequired,
+            label: PropTypes.string.isRequired
+        })
+    ).isRequired,
+    defaultTab: PropTypes.string,
+    tabContent: PropTypes.objectOf(PropTypes.node).isRequired
+};
+
+export {TabView};
\ No newline at end of file
diff --git a/packages/koenig-lexical/src/components/ui/Toggle.jsx b/packages/koenig-lexical/src/components/ui/Toggle.jsx
--- a/packages/koenig-lexical/src/components/ui/Toggle.jsx
+++ b/packages/koenig-lexical/src/components/ui/Toggle.jsx
@@ -3,14 +3,14 @@ import React from 'react';
 
 export function Toggle({isChecked, onChange, dataTestId}) {
     return (
-        <label className="relative inline-block h-5 w-[34px] outline-none" data-testid={dataTestId} id={dataTestId}>
+        <label className="relative inline-block h-4 w-7 outline-none" data-testid={dataTestId} id={dataTestId}>
             <input
                 checked={isChecked}
                 className="peer absolute hidden"
                 type="checkbox"
                 onChange={onChange}
             />
-            <div className="absolute inset-0 cursor-pointer rounded-full bg-grey-300 transition-all before:absolute before:bottom-[2px] before:left-[2px] before:size-4 before:rounded-full before:bg-white before:transition-all before:duration-200 peer-checked:bg-black peer-checked:before:translate-x-[14px] dark:bg-grey-900 dark:peer-checked:bg-green"></div>
+            <div className="absolute inset-0 cursor-pointer rounded-full bg-grey-300 transition-all before:absolute before:bottom-[2px] before:left-[2px] before:size-3 before:rounded-full before:bg-white before:transition-all before:duration-100 peer-checked:bg-black peer-checked:before:translate-x-[12px] dark:bg-grey-800 dark:peer-checked:bg-green"></div>
         </label>
     );
 }
diff --git a/packages/koenig-lexical/src/components/ui/Tooltip.jsx b/packages/koenig-lexical/src/components/ui/Tooltip.jsx
--- a/packages/koenig-lexical/src/components/ui/Tooltip.jsx
+++ b/packages/koenig-lexical/src/components/ui/Tooltip.jsx
@@ -2,10 +2,10 @@ import React from 'react';
 
 export function Tooltip({label, shortcutKeys}) {
     return (
-        <div className={`invisible absolute -top-8 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-md bg-black py-1 font-sans text-xs font-medium text-white group-hover:visible dark:bg-grey-950 ${shortcutKeys ? 'pl-[1rem] pr-1' : 'px-[1rem]'}`}>
+        <div className={`invisible absolute -top-8 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-md bg-black py-1 font-sans text-2xs font-medium text-white group-hover:visible dark:bg-grey-900 ${shortcutKeys ? 'pl-[1rem] pr-1' : 'px-[1rem]'}`}>
             <span>{label}</span>
             {shortcutKeys && shortcutKeys.map(k => (
-                <div key={k} className="rounded bg-grey-900 px-2 text-xs text-white dark:bg-grey-950">{k}</div>
+                <div key={k} className="rounded bg-grey-900 px-2 text-2xs text-white dark:bg-grey-950">{k}</div>
             ))}
         </div>
     );
diff --git a/packages/koenig-lexical/src/components/ui/VisibilityDropdown.jsx b/packages/koenig-lexical/src/components/ui/VisibilityDropdown.jsx
--- a/packages/koenig-lexical/src/components/ui/VisibilityDropdown.jsx
+++ b/packages/koenig-lexical/src/components/ui/VisibilityDropdown.jsx
@@ -1,54 +0,0 @@
-import React from 'react';
-import {Dropdown} from './Dropdown';
-import {Toggle} from './Toggle';
-// import {useVisibilityToggle} from '../../hooks/useVisibilityToggle.js';
-
-export function VisibilityDropdown({editor, nodeKey, visibility, isActive, visibilityProps}) {
-    const {toggleEmail, toggleSegment, toggleWeb, segment, emailVisibility, webVisibility, dropdownOptions} = visibilityProps;
-    // const [toggleEmail, toggleSegment, toggleWeb, segment, emailVisibility, webVisibility, dropdownOptions] = useVisibilityToggle(editor, nodeKey, visibility);
-
-    if (!isActive) {
-        return <></>;
-    }
-
-    if (isActive) {
-        return (
-            <div className="not-kg-prose absolute left-1/2 top-0 z-[1001] flex w-[254px] -translate-x-1/2 flex-col gap-1 rounded-lg bg-white p-6 shadow-md" data-kg-allow-clickthrough="false" data-testid="visibility-settings">
-                <ToggleSetting
-                    dataTestId='visibility-show-on-web'
-                    isChecked={webVisibility}
-                    label="Show on web"
-                    onChange={e => toggleWeb(e)} />
-                <hr className="-mx-6 my-2 border-grey-250 dark:border-white/5" />
-                <ToggleSetting
-                    dataTestId='visibility-show-on-email'
-                    isChecked={emailVisibility}
-                    label="Show in email"
-                    onChange={e => toggleEmail(e)} />
-                {
-                    emailVisibility && dropdownOptions && (
-                        <>
-                            <Dropdown
-                                dataTestId={'visibility-dropdown-segment'}
-                                menu={dropdownOptions}
-                                value={segment}
-                                onChange={toggleSegment}
-                            />
-                        </>
-                    )
-                }
-            </div>
-        );
-    }
-}
-
-function ToggleSetting({label, isChecked, onChange, dataTestId}) {
-    return (
-        <label className="flex min-h-[3rem] w-full cursor-pointer items-center justify-between text-sm" data-testid={dataTestId}>
-            <span className="block text-grey-900 dark:text-grey-300">{label}</span>
-            <div className="flex shrink-0 pl-2">
-                <Toggle dataTestId={`${dataTestId}-Toggle`} isChecked={isChecked} onChange={onChange} />
-            </div>
-        </label>
-    );
-}
diff --git a/packages/koenig-lexical/src/components/ui/cards/AudioCard.jsx b/packages/koenig-lexical/src/components/ui/cards/AudioCard.jsx
--- a/packages/koenig-lexical/src/components/ui/cards/AudioCard.jsx
+++ b/packages/koenig-lexical/src/components/ui/cards/AudioCard.jsx
@@ -106,7 +106,7 @@ function AudioThumbnail({
         );
     } else if (errors && errors.length > 0) {
         return (
-            <span className="group relative flex aspect-square h-20 items-center justify-center rounded-md bg-grey-200 px-1 text-center font-sans text-xs font-semibold leading-snug text-red" data-testid="thumbnail-errors">
+            <span className="group relative flex aspect-square h-20 items-center justify-center rounded-md bg-grey-200 px-1 text-center font-sans text-2xs font-semibold leading-snug text-red" data-testid="thumbnail-errors">
                 {errors[0].message}
             </span>
         );
@@ -131,7 +131,7 @@ function AudioThumbnail({
         return (
             <div className="group flex aspect-square h-20 items-center justify-center rounded-md bg-purple">
                 <button
-                    className="flex size-20 items-center justify-center"
+                    className="flex size-20 cursor-pointer items-center justify-center"
                     data-testid="upload-thumbnail"
                     type="button"
                     onClick={() => openFileSelection({fileInputRef: fileInputRef})}
diff --git a/packages/koenig-lexical/src/components/ui/cards/EmailCtaCard.jsx b/packages/koenig-lexical/src/components/ui/cards/EmailCtaCard.jsx
--- a/packages/koenig-lexical/src/components/ui/cards/EmailCtaCard.jsx
+++ b/packages/koenig-lexical/src/components/ui/cards/EmailCtaCard.jsx
@@ -5,7 +5,7 @@ import PropTypes from 'prop-types';
 import React from 'react';
 import ReplacementStringsPlugin from '../../../plugins/ReplacementStringsPlugin';
 import {Button} from '../Button';
-import {ButtonGroupSetting, DropdownSetting, InputSetting, InputUrlSetting, SettingsDivider, SettingsPanel, ToggleSetting} from '../SettingsPanel';
+import {ButtonGroupSetting, DropdownSetting, InputSetting, InputUrlSetting, SettingsPanel, ToggleSetting} from '../SettingsPanel';
 import {ReadOnlyOverlay} from '../ReadOnlyOverlay';
 
 export function EmailCtaCard({
@@ -54,7 +54,7 @@ export function EmailCtaCard({
         <>
             <div className="w-full pb-6">
                 {/* Segment */}
-                <div className="pb-7 pt-[.6rem] font-sans text-xs font-semibold uppercase leading-8 tracking-normal text-grey dark:text-grey-800">
+                <div className="pb-7 pt-[.6rem] font-sans text-2xs font-semibold uppercase leading-8 tracking-normal text-grey dark:text-grey-800">
                     {segmentName}
                 </div>
 
@@ -99,7 +99,6 @@ export function EmailCtaCard({
                         value={segment}
                         onChange={handleSegmentChange}
                     />
-                    <SettingsDivider />
 
                     {/* Alignment settings */}
                     <ButtonGroupSetting
@@ -116,7 +115,6 @@ export function EmailCtaCard({
                         label='Separators'
                         onChange={toggleDividers}
                     />
-                    <SettingsDivider />
 
                     {/* Button settings */}
                     <ToggleSetting
diff --git a/packages/koenig-lexical/src/components/ui/cards/HeaderCard/v1/HeaderCard.jsx b/packages/koenig-lexical/src/components/ui/cards/HeaderCard/v1/HeaderCard.jsx
--- a/packages/koenig-lexical/src/components/ui/cards/HeaderCard/v1/HeaderCard.jsx
+++ b/packages/koenig-lexical/src/components/ui/cards/HeaderCard/v1/HeaderCard.jsx
@@ -4,7 +4,7 @@ import React from 'react';
 import clsx from 'clsx';
 import {BackgroundImagePicker} from '../../../BackgroundImagePicker';
 import {Button} from '../../../Button';
-import {ButtonGroupSetting, ColorOptionSetting, InputSetting, InputUrlSetting, SettingsDivider, SettingsPanel, ToggleSetting} from '../../../SettingsPanel';
+import {ButtonGroupSetting, ColorOptionSetting, InputSetting, InputUrlSetting, SettingsPanel, ToggleSetting} from '../../../SettingsPanel';
 import {ReadOnlyOverlay} from '../../../ReadOnlyOverlay';
 import {isEditorEmpty} from '../../../../../utils/isEditorEmpty';
 
@@ -192,7 +192,6 @@ export function HeaderCard({isEditing,
                         type={type}
                         onFileChange={onFileChange}
                     />
-                    <SettingsDivider />
                     <ToggleSetting
                         dataTestId='header-button-toggle'
                         isChecked={button}
diff --git a/packages/koenig-lexical/src/components/ui/cards/HeaderCard/v2/HeaderCard.jsx b/packages/koenig-lexical/src/components/ui/cards/HeaderCard/v2/HeaderCard.jsx
--- a/packages/koenig-lexical/src/components/ui/cards/HeaderCard/v2/HeaderCard.jsx
+++ b/packages/koenig-lexical/src/components/ui/cards/HeaderCard/v2/HeaderCard.jsx
@@ -13,7 +13,7 @@ import ShrinkIcon from '../../../../../assets/icons/kg-shrink.svg?react';
 import clsx from 'clsx';
 import trackEvent from '../../../../../utils/analytics';
 import {Button} from '../../../Button';
-import {ButtonGroupSetting, ColorPickerSetting, InputSetting, InputUrlSetting, MediaUploadSetting, SettingsDivider, SettingsPanel, ToggleSetting} from '../../../SettingsPanel';
+import {ButtonGroupSetting, ColorPickerSetting, InputSetting, InputUrlSetting, MediaUploadSetting, SettingsPanel, ToggleSetting} from '../../../SettingsPanel';
 import {Color, textColorForBackgroundColor} from '@tryghost/color-utils';
 import {FastAverageColor} from 'fast-average-color';
 import {IconButton} from '../../../IconButton';
@@ -374,13 +374,7 @@ export function HeaderCard({alignment,
                         selectedName={layout}
                         onClick={handleLayout}
                     />
-                    <ButtonGroupSetting
-                        buttons={alignmentChildren}
-                        label='Alignment'
-                        selectedName={alignment}
-                        onClick={handleAlignment}
-                    />
-
+                                        
                     {
                         layout === 'split' && (
                             <ToggleSetting
@@ -393,6 +387,13 @@ export function HeaderCard({alignment,
                         )
                     }
 
+                    <ButtonGroupSetting
+                        buttons={alignmentChildren}
+                        label='Alignment'
+                        selectedName={alignment}
+                        onClick={handleAlignment}
+                    />
+
                     <ColorPickerSetting
                         dataTestId='header-background-color'
                         eyedropper={layout === 'split'}
@@ -450,9 +451,8 @@ export function HeaderCard({alignment,
                     />
                     <MediaUploadSetting
                         alt='Background image'
-                        borderStyle={'dashed'}
+                        borderStyle={'rounded'}
                         className={(!showBackgroundImage || layout === 'split') && 'hidden'}
-                        desc='Click to upload'
                         errors={fileUploader?.errors}
                         hideLabel={layout !== 'split'}
                         icon='file'
@@ -475,7 +475,6 @@ export function HeaderCard({alignment,
                     />
 
                     {/* Button settings */}
-                    <SettingsDivider />
                     <ToggleSetting
                         dataTestId='header-button-toggle'
                         isChecked={buttonEnabled}
diff --git a/packages/koenig-lexical/src/components/ui/cards/HtmlCard.jsx b/packages/koenig-lexical/src/components/ui/cards/HtmlCard.jsx
--- a/packages/koenig-lexical/src/components/ui/cards/HtmlCard.jsx
+++ b/packages/koenig-lexical/src/components/ui/cards/HtmlCard.jsx
@@ -15,6 +15,7 @@ export function HtmlCard({html, updateHtml, isEditing, darkMode, visibilityMessa
             {isEditing
                 ? (
                     <>
+                        {isContentVisibilityEnabled && <CardVisibilityMessage message={visibilityMessage} />}
                         <HtmlEditor
                             darkMode={darkMode}
                             html={html}
diff --git a/packages/koenig-lexical/src/components/ui/cards/MarkdownCard/MarkdownHelpDialog.jsx b/packages/koenig-lexical/src/components/ui/cards/MarkdownCard/MarkdownHelpDialog.jsx
--- a/packages/koenig-lexical/src/components/ui/cards/MarkdownCard/MarkdownHelpDialog.jsx
+++ b/packages/koenig-lexical/src/components/ui/cards/MarkdownCard/MarkdownHelpDialog.jsx
@@ -30,7 +30,7 @@ function superSub(value) {
 export function Td({value}) {
     return (
         <td className={`p-2 font-normal ${(value === 'Bold' ? '!font-bold' : (value === 'Emphasize') ? 'italic' : (value === 'Strike-through') ? 'line-through' : (value === 'Link') ? 'cursor-pointer text-green' : '')}`}>
-            <span className={` ${(value === 'Inline code') ? 'rounded-sm border border-grey-300 bg-grey-100 p-[.2rem] font-mono text-xs' : (value === 'Highlight') ? 'bg-[#ff0]' : ''}`}>
+            <span className={` ${(value === 'Inline code') ? 'rounded-sm border border-grey-300 bg-grey-100 p-[.2rem] font-mono text-2xs' : (value === 'Highlight') ? 'bg-[#ff0]' : ''}`}>
                 {superSub(value)}
             </span>
         </td>
diff --git a/packages/koenig-lexical/src/components/ui/cards/PaywallCard.jsx b/packages/koenig-lexical/src/components/ui/cards/PaywallCard.jsx
--- a/packages/koenig-lexical/src/components/ui/cards/PaywallCard.jsx
+++ b/packages/koenig-lexical/src/components/ui/cards/PaywallCard.jsx
@@ -1,6 +1,6 @@
 export function PaywallCard() {
     return (
-        <div className="flex h-3 items-center whitespace-pre text-center font-sans text-xs font-semibold uppercase text-grey-500 before:mr-2 before:flex-1 before:border-t before:border-grey-300 before:content-[''] after:ml-2 after:flex-1 after:border-t after:border-grey-300 dark:text-grey-800">
+        <div className="flex h-3 items-center whitespace-pre text-center font-sans text-2xs font-semibold uppercase text-grey-500 before:mr-2 before:flex-1 before:border-t before:border-grey-300 before:content-[''] after:ml-2 after:flex-1 after:border-t after:border-grey-300 dark:text-grey-800">
             Free public preview
             <span className="mx-2 text-green">↑</span>
             /
diff --git a/packages/koenig-lexical/src/components/ui/cards/ProductCard.jsx b/packages/koenig-lexical/src/components/ui/cards/ProductCard.jsx
--- a/packages/koenig-lexical/src/components/ui/cards/ProductCard.jsx
+++ b/packages/koenig-lexical/src/components/ui/cards/ProductCard.jsx
@@ -2,7 +2,7 @@ import KoenigNestedEditor from '../../KoenigNestedEditor';
 import PropTypes from 'prop-types';
 import React from 'react';
 import {Button} from '../Button';
-import {InputSetting, InputUrlSetting, SettingsDivider, SettingsPanel, ToggleSetting} from '../SettingsPanel';
+import {InputSetting, InputUrlSetting, SettingsPanel, ToggleSetting} from '../SettingsPanel';
 import {ProductCardImage} from './ProductCard/ProductCardImage';
 import {RatingButton} from './ProductCard/RatingButton';
 import {ReadOnlyOverlay} from '../ReadOnlyOverlay';
@@ -105,7 +105,6 @@ export function ProductCard({
                         label='Rating'
                         onChange={onRatingToggle}
                     />
-                    <SettingsDivider />
                     <ToggleSetting
                         dataTestId="product-button-toggle"
                         isChecked={isButtonEnabled}
diff --git a/packages/koenig-lexical/src/components/ui/cards/SignupCard.jsx b/packages/koenig-lexical/src/components/ui/cards/SignupCard.jsx
--- a/packages/koenig-lexical/src/components/ui/cards/SignupCard.jsx
+++ b/packages/koenig-lexical/src/components/ui/cards/SignupCard.jsx
@@ -12,7 +12,7 @@ import React, {useEffect, useState} from 'react';
 import ShrinkIcon from '../../../assets/icons/kg-shrink.svg?react';
 import clsx from 'clsx';
 import trackEvent from '../../../utils/analytics';
-import {ButtonGroupSetting, ColorPickerSetting, InputSetting, MediaUploadSetting, MultiSelectDropdownSetting, SettingsDivider, SettingsPanel, ToggleSetting} from '../SettingsPanel';
+import {ButtonGroupSetting, ColorPickerSetting, InputSetting, MediaUploadSetting, MultiSelectDropdownSetting, SettingsPanel, ToggleSetting} from '../SettingsPanel';
 import {Color, textColorForBackgroundColor} from '@tryghost/color-utils';
 import {FastAverageColor} from 'fast-average-color';
 import {IconButton} from '../IconButton';
@@ -371,12 +371,6 @@ export function SignupCard({alignment,
                         selectedName={layout}
                         onClick={handleLayout}
                     />
-                    <ButtonGroupSetting
-                        buttons={alignmentChildren}
-                        label='Alignment'
-                        selectedName={alignment}
-                        onClick={handleAlignment}
-                    />
 
                     {
                         layout === 'split' && (
@@ -390,6 +384,13 @@ export function SignupCard({alignment,
                         )
                     }
 
+                    <ButtonGroupSetting
+                        buttons={alignmentChildren}
+                        label='Alignment'
+                        selectedName={alignment}
+                        onClick={handleAlignment}
+                    />
+
                     <ColorPickerSetting
                         dataTestId='signup-background-color'
                         eyedropper={layout === 'split'}
@@ -445,11 +446,11 @@ export function SignupCard({alignment,
                             }
                         }}
                     />
+
                     <MediaUploadSetting
                         alt='Background image'
-                        borderStyle={'dashed'}
+                        borderStyle={'rounded'}
                         className={(!showBackgroundImage || layout === 'split') && 'hidden'}
-                        desc='Click to upload'
                         errors={fileUploader?.errors}
                         hideLabel={layout !== 'split'}
                         icon='file'
@@ -470,13 +471,12 @@ export function SignupCard({alignment,
                             handleTextColor(matchingTextColor(backgroundColor));
                         }}
                     />
-                    <SettingsDivider />
 
                     <ColorPickerSetting
                         dataTestId='signup-button-color'
                         eyedropper={layout === 'split'}
                         isExpanded={buttonColorPickerExpanded}
-                        label='Button'
+                        label='Button color'
                         swatches={[
                             {title: 'White', hex: '#ffffff'},
                             {title: 'Black', hex: '#000000'},
@@ -500,7 +500,6 @@ export function SignupCard({alignment,
                         label='Button text'
                         placeholder='Add button text'
                         value={buttonText}
-                        hideLabel
                         onBlur={handleButtonTextBlur}
                         onChange={handleButtonText}
                     />
@@ -511,7 +510,7 @@ export function SignupCard({alignment,
                             description='Added to members created using this form'
                             items={labels}
                             label='Labels'
-                            placeholder='Select'
+                            placeholder='Type to search'
                             onChange={handleLabels}
                         />
                     )}
diff --git a/packages/koenig-lexical/src/components/ui/cards/VideoCard.jsx b/packages/koenig-lexical/src/components/ui/cards/VideoCard.jsx
--- a/packages/koenig-lexical/src/components/ui/cards/VideoCard.jsx
+++ b/packages/koenig-lexical/src/components/ui/cards/VideoCard.jsx
@@ -97,7 +97,7 @@ function PopulatedVideoCard({
                         {!isLoopChecked && (
                             <MediaUploadSetting
                                 alt='Custom thumbnail'
-                                borderStyle={'dashed'}
+                                borderStyle={'rounded'}
                                 dataTestId="custom-thumbnail-replace"
                                 errors={customThumbnailUploader.errors}
                                 icon='file'
diff --git a/packages/koenig-lexical/src/hooks/useVisibilityToggle.js b/packages/koenig-lexical/src/hooks/useVisibilityToggle.js
--- a/packages/koenig-lexical/src/hooks/useVisibilityToggle.js
+++ b/packages/koenig-lexical/src/hooks/useVisibilityToggle.js
@@ -55,21 +55,21 @@ export const useVisibilityToggle = (editor, nodeKey, cardConfig) => {
             message = `Only shown to ${segmentLabel} in email`;
         }
     }
-
-    const toggleEmail = (e) => {
+    
+    const toggleEmail = () => {
         editor.update(() => {
             const node = $getNodeByKey(nodeKey);
-            node.visibility = {...node.visibility, showOnEmail: e.target.checked};
+            node.visibility = {...node.visibility, showOnEmail: !node.visibility.showOnEmail};
         });
     };
-
-    const toggleWeb = (e) => {
+    
+    const toggleWeb = () => {
         editor.update(() => {
             const node = $getNodeByKey(nodeKey);
-            node.visibility = {...node.visibility, showOnWeb: e.target.checked};
+            node.visibility = {...node.visibility, showOnWeb: !node.visibility.showOnWeb};
         });
     };
-
+    
     const toggleSegment = (name) => {
         editor.update(() => {
             const node = $getNodeByKey(nodeKey);
diff --git a/packages/koenig-lexical/src/nodes/HtmlNodeComponent.jsx b/packages/koenig-lexical/src/nodes/HtmlNodeComponent.jsx
--- a/packages/koenig-lexical/src/nodes/HtmlNodeComponent.jsx
+++ b/packages/koenig-lexical/src/nodes/HtmlNodeComponent.jsx
@@ -1,40 +1,77 @@
 import CardContext from '../context/CardContext';
 import KoenigComposerContext from '../context/KoenigComposerContext.jsx';
-import React, {useEffect} from 'react';
+import React from 'react';
 import {$getNodeByKey} from 'lexical';
 import {ActionToolbar} from '../components/ui/ActionToolbar.jsx';
 import {DESELECT_CARD_COMMAND, EDIT_CARD_COMMAND} from '../plugins/KoenigBehaviourPlugin.jsx';
+import {DropdownSetting, SettingsPanel, ToggleSetting} from '../components/ui/SettingsPanel.jsx';
 import {HtmlCard} from '../components/ui/cards/HtmlCard';
 import {SnippetActionToolbar} from '../components/ui/SnippetActionToolbar.jsx';
 import {ToolbarMenu, ToolbarMenuItem, ToolbarMenuSeparator} from '../components/ui/ToolbarMenu.jsx';
-import {VisibilityDropdown} from '../components/ui/VisibilityDropdown.jsx';
 import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
 import {useVisibilityToggle} from '../hooks/useVisibilityToggle.js';
 
-export function HtmlNodeComponent({nodeKey, html, visibility}) {
+export function HtmlNodeComponent({nodeKey, html}) {
     const [editor] = useLexicalComposerContext();
     const cardContext = React.useContext(CardContext);
     const {cardConfig, darkMode} = React.useContext(KoenigComposerContext);
     const [showSnippetToolbar, setShowSnippetToolbar] = React.useState(false);
-    const [showVisibilityDropdown, setShowVisibilityDropdown] = React.useState(false);
 
     const isContentVisibilityEnabled = cardConfig?.feature?.contentVisibility || false;
-    const isContentVisibilityActive = editor.getEditorState().read(() => {
-        return $getNodeByKey(nodeKey).getIsVisibilityActive();
-    });
-
     const [toggleEmail, toggleSegment, toggleWeb, segment, emailVisibility, webVisibility, dropdownOptions, visibilityMessage] = useVisibilityToggle(editor, nodeKey, cardConfig);
-
-    const visibilityProps = {
-        toggleEmail,
-        toggleSegment,
-        toggleWeb,
-        segment,
-        emailVisibility,
-        webVisibility,
-        dropdownOptions
+    const handleSettingChange = settingFunction => (value) => {
+        if (typeof value === 'string') {
+            // This is for the dropdown
+            settingFunction(value);
+        } else {
+            // This is for the toggles
+            settingFunction();
+        }
+        editor.update(() => {
+            const node = $getNodeByKey(nodeKey);
+            if (node.select) {
+                node.select();
+            }
+        });
     };
 
+    const tabs = [
+        {id: 'design', label: 'Design'},
+        {id: 'visibility', label: 'Visibility'}
+    ];
+
+    const visibilitySettings = (
+        <>
+            <ToggleSetting
+                dataTestId="visibility-show-on-web"
+                isChecked={webVisibility}
+                label="Show on web"
+                onChange={handleSettingChange(toggleWeb)}
+            />
+            <ToggleSetting
+                dataTestId="visibility-show-on-email"
+                isChecked={emailVisibility}
+                label="Show in email"
+                onChange={handleSettingChange(toggleEmail)}
+            />
+            {emailVisibility && dropdownOptions && (
+                <DropdownSetting
+                    dataTestId="visibility-dropdown-segment"
+                    label="Email audience"
+                    menu={dropdownOptions}
+                    value={segment}
+                    onChange={value => handleSettingChange(toggleSegment)(value)}
+                />
+            )}
+        </>
+    );
+
+    const designSettings = (
+        <div className="text-sm font-medium tracking-normal text-grey-900 dark:text-grey-300">
+            Some design settings
+        </div>
+    );
+
     const updateHtml = (value) => {
         editor.update(() => {
             const node = $getNodeByKey(nodeKey);
@@ -54,18 +91,6 @@ export function HtmlNodeComponent({nodeKey, html, visibility}) {
         }
     };
 
-    const handleVisibilityToggle = (event) => {
-        event.preventDefault();
-        event.stopPropagation();
-        setShowVisibilityDropdown(!showVisibilityDropdown);
-    };
-
-    useEffect(() => {
-        if (!cardContext.isSelected || !cardContext.isEditing) {
-            setShowVisibilityDropdown(false);
-        }
-    }, [cardContext.isSelected, cardContext.isEditing]);
-
     return (
         <>
             <HtmlCard
@@ -79,19 +104,6 @@ export function HtmlNodeComponent({nodeKey, html, visibility}) {
                 onBlur={onBlur}
             />
 
-            {
-                isContentVisibilityEnabled &&
-                (
-                    <VisibilityDropdown
-                        editor={editor}
-                        isActive={showVisibilityDropdown}
-                        nodeKey={nodeKey}
-                        visibility={visibility}
-                        visibilityProps={visibilityProps}
-                    />
-                )
-            }
-
             <ActionToolbar
                 data-kg-card-toolbar="html"
                 isVisible={showSnippetToolbar}
@@ -101,23 +113,17 @@ export function HtmlNodeComponent({nodeKey, html, visibility}) {
 
             <ActionToolbar
                 data-kg-card-toolbar="html"
-                isVisible={(cardContext.isSelected && !showSnippetToolbar && !cardContext.isEditing) || showVisibilityDropdown}
+                isVisible={(cardContext.isSelected && !showSnippetToolbar && !cardContext.isEditing)}
             >
                 <ToolbarMenu>
-                    <ToolbarMenuItem icon="edit" isActive={false} label="Edit" onClick={handleToolbarEdit} />
+                    <ToolbarMenuItem
+                        dataTestId="edit-html"
+                        icon="edit"
+                        isActive={false}
+                        label="Edit"
+                        onClick={handleToolbarEdit}
+                    />
                     <ToolbarMenuSeparator hide={!cardConfig.createSnippet} />
-                    {
-                        isContentVisibilityEnabled &&
-                        <>
-                            <ToolbarMenuItem
-                                icon="visibility"
-                                isActive={isContentVisibilityActive}
-                                label="Visibility"
-                                onClick={handleVisibilityToggle}
-                            />
-                            <ToolbarMenuSeparator hide={!cardConfig.createSnippet} />
-                        </>
-                    }
                     <ToolbarMenuItem
                         dataTestId="create-snippet"
                         hide={!cardConfig.createSnippet}
@@ -128,6 +134,20 @@ export function HtmlNodeComponent({nodeKey, html, visibility}) {
                     />
                 </ToolbarMenu>
             </ActionToolbar>
+
+            {cardContext.isEditing && isContentVisibilityEnabled && (
+                <SettingsPanel 
+                    darkMode={darkMode} 
+                    defaultTab="visibility"
+                    tabs={tabs}
+                    onMouseDown={e => e.preventDefault()}
+                >
+                    {{
+                        design: designSettings,
+                        visibility: visibilitySettings
+                    }}
+                </SettingsPanel>
+            )}
         </>
     );
-}
+}
\ No newline at end of file
diff --git a/packages/koenig-lexical/src/plugins/EmojiPickerPlugin.jsx b/packages/koenig-lexical/src/plugins/EmojiPickerPlugin.jsx
--- a/packages/koenig-lexical/src/plugins/EmojiPickerPlugin.jsx
+++ b/packages/koenig-lexical/src/plugins/EmojiPickerPlugin.jsx
@@ -177,7 +177,7 @@ export function EmojiPickerPlugin() {
                 }
                 return (
                     <Portal className="w-[240px]" to={anchorElementRef.current}>
-                        <ul className="relative z-10 max-h-[214px] select-none scroll-p-2 list-none overflow-y-auto rounded-md bg-white p-1  shadow dark:bg-grey-950" data-testid="emoji-menu" style={getPositionStyles()}>
+                        <ul className="relative z-10 max-h-[214px] select-none scroll-p-2 list-none overflow-y-auto rounded-md bg-white p-1  shadow-md dark:bg-grey-950" data-testid="emoji-menu" style={getPositionStyles()}>
                             {searchResults.map((emoji, index) => (
                                 <div key={emoji.id}>
                                     <EmojiMenuItem
diff --git a/packages/koenig-lexical/src/plugins/TKPlugin.jsx b/packages/koenig-lexical/src/plugins/TKPlugin.jsx
--- a/packages/koenig-lexical/src/plugins/TKPlugin.jsx
+++ b/packages/koenig-lexical/src/plugins/TKPlugin.jsx
@@ -122,7 +122,7 @@ function TKIndicator({editor, rootElement, parentKey, nodeKeys}) {
 
     return (
         <div
-            className="absolute cursor-pointer p-1 text-xs font-medium text-grey-600"
+            className="absolute cursor-pointer p-1 text-2xs font-medium text-grey-600"
             data-testid="tk-indicator"
             style={style}
             onClick={onClick}
```

### 断言级测试 diff（机械定位方式已遮蔽；语义锚可见）

> 断言增删：+6 / -8。

```diff
@@ -26,89 +26,68 @@ test.describe('Content Visibility', async () => {
-await expect(page.locator('<LOCATOR_REDACTED>')).toBeVisible();
+await expect(page.locator('<LOCATOR_CHANGED>')).toBeVisible();
-await expect(card.getByTestId('visibility-settings')).toBeVisible();
+await expect(card.getByTestId('settings-panel')).toBeVisible();
+await expect(card.getByTestId('visibility-show-on-web')).toBeVisible();
-await expect(card).toHaveAttribute('data-kg-card-editing', 'false');
-await expect(card.locator('[aria-label="Visibility"]')).toHaveAttribute('data-kg-active', 'false');
-await expect(card.locator('[aria-label="Visibility"]')).toHaveAttribute('data-kg-active', 'true');
+await expect(card).toHaveAttribute('data-kg-card-editing', 'true');
-await expect(card.getByTestId('visibility-message')).not.toBeVisible();
@@ -117,8 +96,8 @@ test.describe('Content Visibility', async () => {
@@ -128,8 +107,8 @@ test.describe('Content Visibility', async () => {
@@ -139,10 +118,10 @@ test.describe('Content Visibility', async () => {
@@ -151,18 +130,22 @@ test.describe('Content Visibility', async () => {
-await expect(page.getByTestId('<LOCATOR_REDACTED>').locator('input')).toBeChecked();
+await expect(page.getByTestId('<LOCATOR_CHANGED>').locator('input')).toBeChecked();
-await expect(page.getByTestId('<LOCATOR_REDACTED>').locator('input')).not.toBeChecked();
+await expect(page.getByTestId('<LOCATOR_CHANGED>').locator('input')).not.toBeChecked();
```

判定：`human2=（已按盲评协议填写，盲判阶段不可见）`  备注：

---

盲判：`final_blind=EXPECTATION_CHANGE`  理由：应用侧有意移除了非编辑态工具栏中的 Visibility 图标与 VisibilityDropdown，将可见性设置迁入编辑态的 SettingsPanel；断言级 diff 显示状态断言从 data-kg-card-editing="false" 变为 "true" 并删改了工具栏图标断言，属于业务交互与断言目标的实质变化。

---
