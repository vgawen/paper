// Test repair: locator repair via structural UI-signal matching, and assertion
// repair via localized source text-literal diff. Both produce candidate edits;
// an LLM client can refine, but the deterministic path stands alone.
import { extractDomSignals } from './generate.mjs';

// Map removed-testId -> new-testId by matching tag + visible text (structural).
export function signalMap(oldCode, newCode) {
  const oldS = extractDomSignals(oldCode);
  const newS = extractDomSignals(newCode);
  const newIds = new Set(newS.map((s) => s.testId));
  const map = {};
  for (const o of oldS) {
    if (newIds.has(o.testId)) continue; // unchanged id
    const cand = newS.find((n) => n.tag === o.tag && n.text === o.text && !oldS.some((x) => x.testId === n.testId));
    if (cand) map[o.testId] = cand.testId;
  }
  return map;
}

export function repairLocators(specText, sigMap) {
  let text = specText;
  const edits = [];
  for (const [from, to] of Object.entries(sigMap)) {
    if (text.includes(`'${from}'`) || text.includes(`"${from}"`)) {
      text = text.split(`'${from}'`).join(`'${to}'`).split(`"${from}"`).join(`"${to}"`);
      edits.push({ kind: 'locator', from, to });
    }
  }
  return { text, edits };
}

const lineSet = (code) => code.split('\n').map((l) => l.trim());

function extractTextSegments(line) {
  const segs = [];
  // template-literal static parts (strip ${...} and HTML tags)
  for (const m of line.matchAll(/`([^`]*)`/g)) {
    const stripped = m[1].replace(/\$\{[^}]*\}/g, '|').replace(/<[^>]*>/g, '|');
    for (const part of stripped.split('|')) push(segs, part);
  }
  for (const m of line.matchAll(/'([^']*)'/g)) push(segs, m[1]);
  for (const m of line.matchAll(/"([^"]*)"/g)) push(segs, m[1]);
  return segs;
}
function push(arr, s) {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= 1 || !/[A-Za-z]/.test(t)) return;
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(t)) return; // kebab-case identifier (e.g. data-testid), not UI text
  arr.push(t);
}

// Map changed static UI text (old -> new) from localized line diff.
export function textSegMap(oldCode, newCode) {
  const oldL = lineSet(oldCode), newL = lineSet(newCode);
  const newSet = new Set(newL), oldSet = new Set(oldL);
  const removedLines = oldL.filter((l) => !newSet.has(l));
  const addedLines = newL.filter((l) => !oldSet.has(l));
  const removed = [...new Set(removedLines.flatMap(extractTextSegments))];
  const added = [...new Set(addedLines.flatMap(extractTextSegments))];
  const remOnly = removed.filter((s) => !added.includes(s));
  const addOnly = added.filter((s) => !removed.includes(s));
  const map = {};
  for (let i = 0; i < Math.min(remOnly.length, addOnly.length); i++) map[remOnly[i]] = addOnly[i];
  return map;
}

export function repairAssertions(specText, segMap) {
  let text = specText;
  const edits = [];
  for (const [from, to] of Object.entries(segMap)) {
    if (text.includes(from)) { text = text.split(from).join(to); edits.push({ kind: 'assertion', from, to }); }
  }
  return { text, edits };
}

export function repair(specText, oldCode, newCode) {
  const loc = repairLocators(specText, signalMap(oldCode, newCode));
  const asr = repairAssertions(loc.text, textSegMap(oldCode, newCode));
  return { text: asr.text, edits: [...loc.edits, ...asr.edits] };
}
