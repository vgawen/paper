// Offline scan: for the last N commits touching srcGlob, report which adjacent
// transitions yield non-empty UI signals (the uidiff arm) — using the SAME
// extraction the replay driver uses. No install / no test run.
// Usage: node experiments/real/scan_ui.mjs <adapter.json> [N=80]
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAdapter, gitIn, changedSrcFiles } from './engine.mjs';
import { extractFromCode, semanticDiffNodes } from '../../pipeline/src/uidiff.mjs';
import { changedUiSignals, selectByDomDiff } from '../../pipeline/src/domdiff.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const safeShow = (repo, ref, f) => { try { return gitIn(repo, `show ${ref}:${f}`); } catch { return ''; } };

function specBundle(repo, ref, specRel, depth = 2, seen = new Set()) {
  if (seen.has(specRel) || depth < 0) return '';
  seen.add(specRel);
  const src = safeShow(repo, ref, specRel);
  if (!src) return '';
  let out = src;
  if (depth > 0) {
    const dir = path.posix.dirname(specRel);
    for (const m of src.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
      const base = path.posix.normalize(path.posix.join(dir, m[1]));
      const cands = /\.[tj]sx?$/.test(base) ? [base]
        : ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'].map((e) => base + e);
      for (const c of cands) { if (seen.has(c)) continue; const sub = specBundle(repo, ref, c, depth - 1, seen); if (sub) { out += '\n' + sub; break; } }
    }
  }
  return out;
}

function uiSignals(adapter, prev, sha, changed) {
  const sigs = [];
  for (const f of changed) {
    const oldC = safeShow(adapter.repoAbs, prev, f), newC = safeShow(adapter.repoAbs, sha, f);
    if (/\.(t|j)sx$/.test(f)) {
      try {
        const d = semanticDiffNodes(extractFromCode(oldC, f), extractFromCode(newC, f));
        for (const e of [...d.REMOVE, ...d.MODIFY]) {
          const node = e.node || null;
          if (node?.testId) sigs.push(node.testId);
          if (node?.text) sigs.push(node.text);
          for (const field of ['testId', 'text', 'ariaLabel', 'href', 'name']) {
            const ch = e.changes?.[field];
            if (ch && ch.from) sigs.push(ch.from);
          }
        }
      } catch { /* parser miss */ }
    } else {
      sigs.push(...changedUiSignals(oldC, newC));
    }
  }
  return [...new Set(sigs.filter(Boolean))];
}

const adapter = loadAdapter(path.join(here, 'adapters', process.argv[2]));
const N = parseInt(process.argv[3] || '80', 10);
const log = gitIn(adapter.repoAbs, `log --format=%H -n 400 -- ${adapter.srcGlob}`).trim().split('\n').filter(Boolean);
const shas = log.slice(0, N + 1).reverse();
let hits = 0;
for (let i = 1; i < shas.length; i++) {
  const prev = shas[i - 1], sha = shas[i];
  const changed = changedSrcFiles(adapter.repoAbs, prev, sha, adapter.srcGlob);
  if (!changed.length) continue;
  const tsx = changed.filter((f) => /\.(t|j)sx$/.test(f)).length;
  const ui = uiSignals(adapter, prev, sha, changed);
  if (ui.length) {
    hits++;
    // Would the uidiff arm actually SELECT any test? Match signals against spec
    // sources at `sha` (same as the replay driver's selectByDomDiff step).
    const specRoot = [adapter.runRel, adapter.specGlob].filter(Boolean).join('/');
    const specs = gitIn(adapter.repoAbs, `ls-tree -r --name-only ${sha} ${specRoot}`)
      .trim().split('\n').filter((f) => /\.(test|spec)\.[tj]sx?$/.test(f));
    const testSources = {};
    for (const f of specs) testSources[f] = specBundle(adapter.repoAbs, sha, f);
    const selected = selectByDomDiff(ui, testSources);
    const subj = gitIn(adapter.repoAbs, `log -1 --format=%s ${sha}`).trim().slice(0, 55);
    console.log(`${sha.slice(0, 8)} changed=${changed.length} tsx=${tsx} ui=${ui.length} selects=${selected.length} ${selected.length ? JSON.stringify(selected) : ''} :: ${JSON.stringify(ui.slice(0, 4))} | ${subj}`);
  }
}
console.log(`\n${hits} transitions with non-empty UI signals (of last ${N}).`);
