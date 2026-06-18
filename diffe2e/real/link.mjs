// Link a Semantic UI Diff to existing Playwright tests via locator references
// (the USES_LOCATOR edge). This is an E2E-native selection signal that does
// NOT need coverage sourcemaps, and it simultaneously yields:
//   - selection (which tests touch the changed UI)
//   - repair triggers (REMOVE / text-change -> broken locator + candidate fix)
//   - generation triggers (ADD with no test referencing it -> coverage gap)
//
// Usage:
//   node link.mjs <uidiff.json> <testsDir>

import fs from 'node:fs';
import path from 'node:path';

const diff = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const testsDir = process.argv[3];

function readTests(dir) {
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    if (/\.(test|spec)\.(t|j)sx?$/.test(f)) {
      out.push({ file: f, text: fs.readFileSync(path.join(dir, f), 'utf8') });
    }
  }
  return out;
}

// signals a test might reference a UI node by
function nodeSignals(n) {
  const s = [];
  if (n.text) s.push(n.text);
  if (n.testId) s.push(n.testId);
  if (n.ariaLabel) s.push(n.ariaLabel);
  if (n.name) s.push(n.name);
  return s;
}

function testsReferencing(tests, signals) {
  const hits = [];
  for (const t of tests) {
    for (const sig of signals) {
      // match the literal appearing inside a quote/locator in the test source
      if (sig && t.text.includes(sig)) { hits.push(t.file); break; }
    }
  }
  return hits;
}

const tests = readTests(testsDir);

const selected = new Set();
const repairs = [];
const gaps = [];

// REMOVE + MODIFY(text) -> broken locator -> select + repair
for (const r of diff.REMOVE) {
  const sigs = nodeSignals(r.node);
  const hits = testsReferencing(tests, sigs);
  hits.forEach((h) => selected.add(h));
  if (hits.length) {
    // suggest the structural-neighbor ADD as repair target (same tag/handler family)
    const candidate = diff.ADD.find((a) => a.node.tag === r.node.tag);
    repairs.push({
      reason: 'removed UI node -> broken locator',
      old_node: r.key,
      affected_tests: hits,
      repair_candidate: candidate ? candidate.key : null,
    });
  }
}
for (const m of diff.MODIFY) {
  if (m.changes && m.changes.text) {
    const oldText = m.changes.text.from;
    const hits = testsReferencing(tests, [oldText]);
    hits.forEach((h) => selected.add(h));
    if (hits.length) repairs.push({
      reason: 'UI text changed -> stale locator/assertion',
      change: m.changes.text, affected_tests: hits,
    });
  }
}

// ADD with no referencing test -> coverage gap -> generation target
for (const a of diff.ADD) {
  const sigs = nodeSignals(a.node);
  const hits = testsReferencing(tests, sigs);
  if (!hits.length) gaps.push({ reason: 'new UI node, no E2E touches it', node: a.key });
}

console.log(JSON.stringify({
  tests_scanned: tests.map((t) => t.file),
  selected_for_rerun: [...selected],
  repair_triggers: repairs,
  generation_gaps: gaps,
}, null, 2));
