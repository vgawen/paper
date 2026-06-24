import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cohenKappa } from '../../pipeline/src/stats.mjs';

export function scoreRows(rows) {
  const labeled = rows.filter((r) => r.annotator1_yn && r.annotator2_yn);
  const pairs = labeled.map((r) => [r.annotator1_yn.trim(), r.annotator2_yn.trim()]);
  const kappa = cohenKappa(pairs);
  // arbitration: agreed label, else require r.final
  const finals = labeled.map((r) => (r.annotator1_yn === r.annotator2_yn ? r.annotator1_yn : (r.final || '').trim()));
  const valid = finals.filter((x) => x === 'y').length;
  return { n: labeled.length, kappa, semantic_validity: labeled.length ? +(valid / labeled.length).toFixed(4) : 0 };
}

function parseCSV(t) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  const h = rows.shift();
  return rows.filter((r) => r.length === h.length).map((r) => Object.fromEntries(h.map((k, j) => [k, r[j]])));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const rows = parseCSV(fs.readFileSync(path.join(here, 'sheet.csv'), 'utf8'));
  const res = scoreRows(rows);
  // join arm via the unblinding key and report per-arm semantic validity
  const unblindPath = path.join(here, '..', 'out', 'rq2_unblind.json');
  if (fs.existsSync(unblindPath)) {
    const unblind = JSON.parse(fs.readFileSync(unblindPath, 'utf8'));
    res.by_arm = {};
    for (const arm of ['diff', 'nodiff']) {
      res.by_arm[arm] = scoreRows(rows.filter((r) => unblind[r.case_id] === arm));
    }
  }
  fs.writeFileSync(path.join(here, '..', 'out', 'rq2_annotation.json'), JSON.stringify(res, null, 2));
  console.log(`semantic-validity=${res.semantic_validity}  kappa=${res.kappa.kappa} (n=${res.n})` +
    (res.by_arm ? `\n  diff=${res.by_arm.diff.semantic_validity}  nodiff=${res.by_arm.nodiff.semantic_validity}` : ''));
}
