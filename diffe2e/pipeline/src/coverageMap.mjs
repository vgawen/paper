// Coverage map helpers.

const norm = (p) => p.replace(/^\/+/, '');

// CDP JS coverage entries -> executed app source files (file-level, L1).
export function fileLevelFromCDP(entries) {
  const files = new Set();
  for (const e of entries) {
    const m = (e.url || '').match(/\/src\/[^?#]*\.js/);
    if (!m) continue;
    const exec = (e.functions || []).some((f) => (f.ranges || []).some((r) => r.count > 0));
    if (exec) files.add(norm(m[0]));
  }
  return [...files];
}

// True if a test's covered files intersect the changed file set.
export function intersectsChange(covFiles, changed) {
  const set = new Set(changed.map(norm));
  return covFiles.map(norm).some((f) => set.has(f));
}

// Build cov[test]=files map from a dir of CDP-fixture json {test, files:[...]}.
export function normalizeCovRecords(records) {
  const map = {};
  for (const r of records) map[r.test] = (r.files || []).map(norm);
  return map;
}
