import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runC1Loop, TEST_SOURCES } from './uidiff_loop.mjs';
import { createClient } from '../pipeline/src/llm/client.mjs';
import { specFromUiNodes } from '../pipeline/src/generate.mjs';
import { repairFromUiDiff } from '../pipeline/src/repair.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(dir, '..', 'pipeline', 'fixtures');

test('specFromUiNodes builds spec for ADD buttons', () => {
  const spec = specFromUiNodes([{ tag: 'button', text: 'Crimson' }, { tag: 'button', text: 'Green' }], { title: 't' });
  assert.match(spec, /getByRole\('button', \{ name: 'Crimson' \}\)/);
  assert.match(spec, /getByRole\('button', \{ name: 'Green' \}\)/);
});

test('repairFromUiDiff retargets REMOVE->ADD, updates MODIFY href, hardens locator', () => {
  const uidiff = {
    ADD: [{ node: { tag: 'button', text: 'Crimson' } }],
    REMOVE: [{ node: { tag: 'button', text: 'Red' } }],
    MODIFY: [
      { key: 'a:text:Learn React', changes: { href: { from: 'https://reactjs.org', to: 'https://react.dev' } } },
      { key: 'testid:turquoise-btn', matchedOld: 'button:text:Turquoise', changes: { testId: { from: null, to: 'turquoise-btn' } } },
    ],
  };
  const spec = `getByRole('button', { name: 'Red' }); toHaveAttribute('href', 'https://reactjs.org'); getByText('Turquoise')`;
  const { text } = repairFromUiDiff(spec, uidiff);
  assert.match(text, /name: 'Crimson'/);
  assert.match(text, /https:\/\/react\.dev/);
  assert.match(text, /getByTestId\('turquoise-btn'\)/);
});

test('runC1Loop on real JSX drives selection/generation/repair', async () => {
  const r = await runC1Loop({
    oldFile: path.join(FIX, 'App.old.tsx'),
    newFile: path.join(FIX, 'App.new.tsx'),
    testSources: TEST_SOURCES,
    client: createClient({}),
  });
  // diff is real
  assert.ok(r.uidiff.REMOVE.some((x) => x.key === 'button:text:Red'));
  // selection: impacted specs in, unrelated home out
  assert.ok(r.selected.includes('paint.spec.ts'));
  assert.ok(r.selected.includes('link.spec.ts'));
  assert.ok(r.selected.includes('turquoise.spec.ts'));
  assert.ok(!r.selected.includes('home.spec.ts'));
  // generation: Crimson + Green added, none covered
  assert.match(r.generated, /Crimson/);
  assert.match(r.generated, /Green/);
  // repair: paint retargeted Red->Crimson, link href updated
  assert.match(r.repaired['paint.spec.ts'].text, /Crimson/);
  assert.match(r.repaired['link.spec.ts'].text, /react\.dev/);
});
