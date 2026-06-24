// DOM-signal diff for vanilla-JS innerHTML templates (the structural analog of
// the JSX Semantic UI Diff for non-JSX subjects). Yields the OLD signals
// (data-testid / visible text) that changed or disappeared -> tests referencing
// them are impacted.
import { extractDomSignals } from './generate.mjs';

export function changedUiSignals(oldCode, newCode) {
  const o = extractDomSignals(oldCode), n = extractDomSignals(newCode);
  const nIds = new Set(n.map((s) => s.testId).filter(Boolean));
  const nText = new Set(n.map((s) => s.text).filter(Boolean));
  const sigs = new Set();
  for (const s of o) {
    if (s.testId && !nIds.has(s.testId)) sigs.add(s.testId); // removed/renamed testid
    if (s.text && !nText.has(s.text)) sigs.add(s.text);      // removed/changed visible text
  }
  return [...sigs];
}

// A signal is "referenced" by a test only when it appears as a *quoted literal*
// ('sig' / "sig" / `sig`) — the form real locators use (getByTestId('x'),
// getByText("y")). Bare-substring matching mis-fires badly on short/common
// signals (e.g. "date" hitting "update"/"validate"); quote-anchoring removes
// that noise while still matching genuine selector anchors.
function referenced(src, s) {
  if (!s || s.length < 2) return false;
  return src.includes(`'${s}'`) || src.includes(`"${s}"`) || src.includes(`\`${s}\``);
}

// testSources: { testId: sourceText }. Returns ids whose source references a
// changed UI signal.
export function selectByDomDiff(signals, testSources) {
  const sel = new Set();
  for (const [id, src] of Object.entries(testSources)) {
    if (signals.some((s) => referenced(src, s))) sel.add(id);
  }
  return [...sel];
}
