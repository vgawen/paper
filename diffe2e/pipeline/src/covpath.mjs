// Generic coverage-path utilities for arbitrary real projects (any source
// layout). Coverage records may carry absolute paths, file:// URLs, or
// already-relative paths; normalize all to repo-relative POSIX paths.
import path from 'node:path';

export function toRepoRel(p, repoRoot) {
  let s = String(p).replace(/^file:\/\//, '');
  s = s.split('?')[0];
  const root = repoRoot.replace(/\/+$/, '') + '/';
  if (s.startsWith(root)) s = s.slice(root.length);
  return s.replace(/^\/+/, '').split(path.sep).join('/');
}

// cov: { testId: [repoRelFile,...] }; changed: [repoRelFile,...]
export function selectByGenericCoverage(cov, changed) {
  const ch = new Set(changed);
  const sel = [];
  for (const [id, files] of Object.entries(cov)) {
    if ((files || []).some((f) => ch.has(f))) sel.push(id);
  }
  return sel;
}
