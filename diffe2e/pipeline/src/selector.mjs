// Dual-signal selection: coverage map signal UNION semantic-UI-diff/locator signal.
import { intersectsChange } from './coverageMap.mjs';

// Coverage signal: tests whose V_old coverage intersects changed files.
export function selectByCoverage(cov, changedFiles) {
  return Object.keys(cov).filter((t) => intersectsChange(cov[t], changedFiles));
}

// Stable signals a test might reference a changed/removed UI node by.
function nodeSignals(node) {
  return [node.text, node.testId, node.ariaLabel, node.name].filter(Boolean);
}

const textFromKey = (s) => { const m = (s || '').match(/:text:(.+)$/); return m ? m[1] : null; };

// UI signal: tests whose source references a node touched by the semantic diff
// (REMOVE'd node, or a MODIFY'd node's old text / href / testId / aria).
export function selectByUiLocator(uidiff, testSources) {
  const sigs = [];
  for (const r of uidiff.REMOVE || []) sigs.push(...nodeSignals(r.node));
  for (const mod of uidiff.MODIFY || []) {
    for (const k of [mod.key, mod.matchedOld]) { const t = textFromKey(k); if (t) sigs.push(t); }
    for (const f of Object.values(mod.changes || {})) if (f && f.from) sigs.push(f.from);
  }
  const selected = new Set();
  for (const [file, text] of Object.entries(testSources)) {
    if (sigs.some((s) => s && text.includes(s))) selected.add(file);
  }
  return [...selected];
}

// Union of both signals (deduped).
export function select({ cov = {}, changedFiles = [], uidiff = null, testSources = {} }) {
  const a = selectByCoverage(cov, changedFiles);
  const b = uidiff ? selectByUiLocator(uidiff, testSources) : [];
  return [...new Set([...a, ...b])];
}
