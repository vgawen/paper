import test from 'node:test';
import assert from 'node:assert/strict';
import { parseUnifiedDiff } from '../src/diff.mjs';

test('diff: metadata lines (diff --git / index / new file mode / --- /dev/null) not counted', () => {
  const diff = `diff --git a/src/main.js b/src/main.js
index abc1234..def5678 100644
--- a/src/main.js
+++ b/src/main.js
@@ -10,1 +10,2 @@
   '/coupon': () => import('./coupon.js'),
+  '/wishlist': () => import('./wishlist.js'),
diff --git a/src/wishlist.js b/src/wishlist.js
new file mode 100644
index 0000000..121667a
--- /dev/null
+++ b/src/wishlist.js
@@ -0,0 +1 @@
+export function render(){}
`;
  const parsed = parseUnifiedDiff(diff);
  // main.js: pure add, no spurious `removed` from the trailing `diff --git`/`index` lines
  assert.deepEqual([...parsed.byFile['src/main.js'].added], [11]);
  assert.deepEqual([...parsed.byFile['src/main.js'].removed], []);
  // wishlist.js: new file, its single line is added
  assert.deepEqual([...parsed.byFile['src/wishlist.js'].added], [1]);
  assert.deepEqual([...parsed.byFile['src/wishlist.js'].removed], []);
});
