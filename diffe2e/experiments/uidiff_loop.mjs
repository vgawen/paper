// C1 closed loop driven by the JSX Semantic UI Diff:
//   Code Diff -> Semantic UI Diff -> { selection, generation, repair }
// Static integration on REAL JSX (pipeline/fixtures/App.{old,new}.tsx),
// complementing the dynamic RQ1-RQ3 numbers.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { semanticDiff } from '../pipeline/src/uidiff.mjs';
import { selectByUiLocator } from '../pipeline/src/selector.mjs';
import { generateFromUiNodes } from '../pipeline/src/generate.mjs';
import { repairFromUiDiff } from '../pipeline/src/repair.mjs';
import { createClient } from '../pipeline/src/llm/client.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(here, '..', 'pipeline', 'fixtures');
const OUT = path.join(here, 'out');

// Real Playwright test sources for the App-under-change (text references).
export const TEST_SOURCES = {
  'paint.spec.ts': `import { test, expect } from './fixtures';
test('paint red', async ({ page }) => {
  await page.getByRole('button', { name: 'Red' }).click();
  await expect(page.locator('#bg')).toHaveCSS('background-color', 'rgb(231, 76, 60)');
});`,
  'link.spec.ts': `import { test, expect } from './fixtures';
test('react link', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Learn React' }))
    .toHaveAttribute('href', 'https://reactjs.org');
});`,
  'turquoise.spec.ts': `import { test, expect } from './fixtures';
test('paint turquoise', async ({ page }) => {
  await page.getByText('Turquoise').click();
});`,
  'home.spec.ts': `import { test, expect } from './fixtures';
test('home', async ({ page }) => {
  await expect(page.getByText('Hello world')).toBeVisible();
});`,
};

export async function runC1Loop({ oldFile, newFile, testSources, client }) {
  // 1. Code Diff -> Semantic UI Diff
  const uidiff = semanticDiff(oldFile, newFile);

  // 2. Selection: tests touched by the semantic diff
  const selected = selectByUiLocator(uidiff, testSources);

  // 3. Generation: ADD nodes referenced by no existing test -> new spec
  const allSrc = Object.values(testSources).join('\n');
  const uncoveredAdds = (uidiff.ADD || [])
    .filter((a) => !(a.node.text && allSrc.includes(a.node.text)) && !(a.node.testId && allSrc.includes(a.node.testId)))
    .map((a) => a.node);
  const generated = uncoveredAdds.length
    ? (await generateFromUiNodes({ addNodes: uncoveredAdds, title: 'generated: new buttons', client })).spec
    : null;

  // 4. Repair: each selected spec retargeted/updated via the diff
  const repaired = {};
  for (const f of selected) {
    const { text, edits } = repairFromUiDiff(testSources[f], uidiff);
    if (edits.length) repaired[f] = { edits, text };
  }

  return { uidiff, selected, uncoveredAdds, generated, repaired };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const client = createClient();
  const r = await runC1Loop({
    oldFile: path.join(FIX, 'App.old.tsx'),
    newFile: path.join(FIX, 'App.new.tsx'),
    testSources: TEST_SOURCES,
    client,
  });

  const L = ['# C1 闭环：Code Diff → Semantic UI Diff → 选择/生成/修复（真实 JSX）', ''];
  L.push('## 1. Semantic UI Diff');
  L.push(`- ADD: ${(r.uidiff.ADD || []).map((a) => a.key).join(', ') || '-'}`);
  L.push(`- REMOVE: ${(r.uidiff.REMOVE || []).map((a) => a.key).join(', ') || '-'}`);
  L.push(`- MODIFY: ${(r.uidiff.MODIFY || []).map((a) => `${a.key}{${Object.keys(a.changes).join(',')}}`).join(', ') || '-'}`, '');
  L.push('## 2. 选择（UI diff 驱动）');
  L.push(`- 选中: ${r.selected.join(', ')}`);
  L.push(`- 未选中(无关): ${Object.keys(TEST_SOURCES).filter((f) => !r.selected.includes(f)).join(', ')}`, '');
  L.push('## 3. 生成（ADD 缺口）');
  L.push(`- 未被任何测试覆盖的新增节点: ${r.uncoveredAdds.map((n) => n.text).join(', ') || '-'}`);
  if (r.generated) { L.push('```ts', r.generated.trim(), '```'); }
  L.push('', '## 4. 修复（选中失效用例）');
  for (const [f, v] of Object.entries(r.repaired)) {
    L.push(`### ${f}`);
    L.push(`- edits: ${JSON.stringify(v.edits)}`);
    L.push('```ts', v.text.trim(), '```');
  }
  fs.writeFileSync(path.join(OUT, 'c1_loop.md'), L.join('\n') + '\n');
  fs.writeFileSync(path.join(OUT, 'c1_loop.json'), JSON.stringify({ provider: client.provider, ...r }, null, 2));
  console.log(`C1 loop: selected=${r.selected.length} generated=${r.generated ? 'yes' : 'no'} repaired=${Object.keys(r.repaired).length}`);
  console.log('wrote out/c1_loop.md');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
