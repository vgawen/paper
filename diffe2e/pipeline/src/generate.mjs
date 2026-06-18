// Generate a Playwright test for an uncovered (gap) route/file.
// Extracts DOM signals from the source (data-testid + tag + text), builds a
// deterministic spec template (the offline fallback) AND an LLM prompt; the
// client returns the LLM output when a key is present, else the template.

// Extract interactive DOM signals from innerHTML template source via regex.
export function extractDomSignals(code) {
  const signals = [];
  const re = /<(\w+)([^>]*?)data-testid="([^"]+)"([^>]*?)>([^<]*)/g;
  let m;
  while ((m = re.exec(code))) {
    const [, tag, pre, testId, post, text] = m;
    const attrs = pre + post;
    signals.push({
      tag: tag.toLowerCase(),
      testId,
      text: (text || '').trim(),
      isButton: tag.toLowerCase() === 'button',
      isInput: tag.toLowerCase() === 'input',
      placeholder: (attrs.match(/placeholder="([^"]*)"/) || [])[1] || null,
    });
  }
  return signals;
}

export function buildSpecTemplate({ route, signals, title }) {
  const button = signals.find((s) => s.isButton);
  const input = signals.find((s) => s.isInput);
  const result = signals.find((s) => !s.isButton && !s.isInput);
  const lines = [];
  lines.push(`import { test, expect } from './fixtures';`, '');
  lines.push(`test('${title}', async ({ page }) => {`);
  lines.push(`  await page.goto('/#${route}');`);
  if (result) lines.push(`  await expect(page.getByTestId('${result.testId}')).toBeVisible();`);
  if (input) lines.push(`  await page.getByTestId('${input.testId}').fill('test');`);
  if (button) {
    lines.push(`  await page.getByTestId('${button.testId}').click();`);
    const after = signals.find((s) => !s.isButton && !s.isInput && (!result || s.testId !== result.testId)) || result;
    if (after) lines.push(`  await expect(page.getByTestId('${after.testId}')).toBeVisible();`);
  }
  lines.push('});', '');
  return lines.join('\n');
}

function buildPrompt({ route, code }) {
  return `A new route "${route}" was added with no E2E test. Source:\n\n${code}\n\n` +
    `Write ONE Playwright test (TypeScript) importing { test, expect } from './fixtures', ` +
    `navigating to '/#${route}', exercising the main interaction, and asserting a visible outcome.`;
}

export async function generateForGap({ route, code, title, client }) {
  const signals = extractDomSignals(code);
  const fallback = buildSpecTemplate({ route, signals, title });
  const prompt = buildPrompt({ route, code });
  const out = await client.complete(prompt, { fallback });
  return { signals, spec: out || fallback };
}
