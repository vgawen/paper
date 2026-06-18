// Parse `git diff --unified` output into changed files + per-file line sets.
// added = new-file line numbers added; removed = old-file line numbers removed.

export function parseUnifiedDiff(text) {
  const byFile = {};
  let current = null;
  let oldLine = 0, newLine = 0;
  for (const line of text.split('\n')) {
    let m;
    if (line.startsWith('--- a/')) continue;
    if ((m = line.match(/^\+\+\+ b\/(.+)$/))) {
      const path = m[1].trim();
      current = path === '/dev/null' ? null : path;
      if (current && !byFile[current]) byFile[current] = { added: new Set(), removed: new Set() };
      continue;
    }
    if ((m = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/))) {
      oldLine = +m[1]; newLine = +m[2];
      continue;
    }
    if (!current) continue;
    if (line.startsWith('+')) { byFile[current].added.add(newLine); newLine++; }
    else if (line.startsWith('-')) { byFile[current].removed.add(oldLine); oldLine++; }
    else { oldLine++; newLine++; }
  }
  return { files: Object.keys(byFile), byFile };
}

export const changedFiles = (text) => parseUnifiedDiff(text).files;
