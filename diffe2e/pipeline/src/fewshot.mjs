// Graph-RAG few-shot retrieval for RQ2 generation.
//
// Given a gap (a changed/new route or UI region with no test), find 1-2 EXISTING
// passing tests that exercise a nearby part of the app, and hand them to the LLM
// as templates. This is what lets the generated spec reuse the project's real
// fixtures, login/bootstrap flow and Page-Object idioms instead of inventing them.
//
// Leakage-safe: it only reads tests that already exist in the repo at V_old — it
// never sees the "answer" (no new test file, no ground truth).
import path from 'node:path';

const norm = (p) => String(p || '').replace(/^\/+/, '');

// score: same directory > same route/component dir > shares an imported module
function proximity(a, b) {
  if (a === b) return 100;
  const da = path.posix.dirname(a), db = path.posix.dirname(b);
  if (da === db) return 60;
  const sa = da.split('/'), sb = db.split('/');
  let common = 0;
  while (common < sa.length && common < sb.length && sa[common] === sb[common]) common++;
  return common * 10;
}

// tests: [{ id, file, code, route? }]  gap: { file, route? }
// Returns up to `limit` existing tests whose code is the best template.
export function pickFewShotTemplates(tests, gap, { limit = 2, maxChars = 2500 } = {}) {
  const scored = tests
    .filter((t) => t.code && t.code.length > 0)
    .map((t) => {
      let s = proximity(gap.file || '', t.file || '');
      if (gap.route && t.route && gap.route === t.route) s += 80;
      if (gap.route && t.code.includes(gap.route)) s += 40;
      return { t, s };
    })
    .sort((x, y) => y.s - x.s);
  return scored.slice(0, limit).map(({ t }) => ({ id: t.id, file: t.file, code: t.code.slice(0, maxChars) }));
}

// Assemble the few-shot block for a generation prompt.
export function formatFewShot(shots) {
  if (!shots || !shots.length) return '';
  return 'EXISTING PASSING TESTS in this project (reuse their imports, setup and navigation style):\n' +
    shots.map((s, i) => `--- example ${i + 1} (${s.file})\n${s.code}`).join('\n');
}

// Build the diff-constrained generation prompt WITH few-shot context.
export function buildGapPromptWithFewShot({ addNodes, title, route = null, shots = [], gapFile = null }) {
  const nodeDesc = addNodes.map((n) => ({ tag: n.tag, text: n.text, testId: n.testId }));
  return [
    route ? `A new route "${route}" was added${gapFile ? ` (source: ${gapFile})` : ''} and has no E2E test.` : `New UI elements were added: ${JSON.stringify(nodeDesc)}.`,
    nodeDesc.length ? `New UI elements on it: ${JSON.stringify(nodeDesc)}.` : '',
    formatFewShot(shots),
    'Write ONE Playwright test (TypeScript) that: navigates to the changed route/UI, exercises the primary interaction, and asserts a visible outcome.',
    "Use only this import: import { test, expect } from './fixtures';",
    'API RULES (violating these makes the test invalid):',
    "- If a testId is given, address it as page.getByTestId('<id>'). NEVER write page.locator('<bare-name>').",
    "- NEVER assert on the page body (e.g. expect(page.locator('body')).toBeVisible()); assert the SPECIFIC text/state that changes.",
    "- Prefer page.getByRole('button', { name: '<text>' }) / page.getByText('<text>') for real controls.",
    'Output ONLY the test code.',
  ].filter(Boolean).join('\n\n');
}
