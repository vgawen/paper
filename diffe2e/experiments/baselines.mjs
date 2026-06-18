// Selection baselines (pure). All take the full test-id list and return a subset.
import { mulberry32 } from '../pipeline/src/stats.mjs';

export const retestAll = (allTests) => [...allTests];

// Deterministic random subset of size k.
export function randomK(allTests, k, seed = 42) {
  const rng = mulberry32(seed);
  const arr = [...allTests];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.max(0, Math.min(k, arr.length)));
}

const stem = (p) => p.replace(/^.*\//, '').replace(/\.[^.]+$/, '');

// Static heuristic: select tests whose id contains a changed file's stem.
export function staticHeuristic(allTests, changedFiles) {
  const stems = changedFiles.map(stem);
  return allTests.filter((t) => stems.some((s) => t.includes(s)));
}
