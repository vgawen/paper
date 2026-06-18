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

// testSources: { testId: sourceText }. Returns ids whose source references a
// changed UI signal.
export function selectByDomDiff(signals, testSources) {
  const sel = new Set();
  for (const [id, src] of Object.entries(testSources)) {
    if (signals.some((s) => src.includes(s))) sel.add(id);
  }
  return [...sel];
}
