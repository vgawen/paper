// Merge a second annotator's blind sheet into the main scoring sheet.
//
// Usage:
//   node experiments/annotate/merge_second_annotator.mjs \
//     experiments/out/rq2_annotator2_blind.csv experiments/out/rq2_real_to_annotate.csv
//   node experiments/annotate/merge_second_annotator.mjs \
//     experiments/out/rq3_annotator2_blind.csv experiments/out/rq3_reprobreak_to_annotate.csv
//
// The blind sheet must contain either `annotator2_yn` (RQ2) or `human2` (RQ3),
// plus `final`. Only those columns are copied; the first annotator's labels are
// never read from the blind sheet.
import fs from 'node:fs';
import path from 'node:path';

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
  return { headers: h, rows: rows.filter((r) => r.length === h.length).map((r) => Object.fromEntries(h.map((k, j) => [k, r[j]]))) };
}

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function writeCSV(file, headers, rows) {
  const text = [headers.join(',')]
    .concat(rows.map((r) => headers.map((h) => csvCell(r[h])).join(',')))
    .join('\n') + '\n';
  fs.writeFileSync(file, text);
}

function main() {
  const [blindPath, mainPath] = process.argv.slice(2);
  if (!blindPath || !mainPath) {
    console.error('usage: node merge_second_annotator.mjs <blind.csv> <main.csv>');
    process.exit(2);
  }
  const blind = parseCSV(fs.readFileSync(blindPath, 'utf8'));
  const main = parseCSV(fs.readFileSync(mainPath, 'utf8'));
  const secondCol = blind.headers.includes('annotator2_yn') ? 'annotator2_yn'
    : blind.headers.includes('human2') ? 'human2'
    : null;
  if (!secondCol) {
    console.error(`blind sheet has neither annotator2_yn nor human2: ${blindPath}`);
    process.exit(2);
  }
  if (!blind.headers.includes('final')) {
    console.error(`blind sheet is missing final column: ${blindPath}`);
    process.exit(2);
  }
  const byId = new Map(blind.rows.map((r) => [r.case_id, r]));
  const missing = main.rows.filter((r) => !byId.has(r.case_id)).map((r) => r.case_id);
  const extra = blind.rows.filter((r) => !main.rows.some((m) => m.case_id === r.case_id)).map((r) => r.case_id);
  if (missing.length || extra.length) {
    console.error(`case_id mismatch: missing in blind=${missing.join(',') || '-'} extra in blind=${extra.join(',') || '-'}`);
    process.exit(1);
  }
  let filled = 0, blank = 0;
  for (const row of main.rows) {
    const src = byId.get(row.case_id);
    row[secondCol] = (src[secondCol] || '').trim();
    row.final = (src.final || '').trim();
    if (row[secondCol]) filled++; else blank++;
  }
  if (blank) {
    console.error(`WARNING: ${blank}/${main.rows.length} rows have an empty ${secondCol}; scoring will ignore them.`);
  }
  writeCSV(mainPath, main.headers, main.rows);
  console.log(`merged ${filled}/${main.rows.length} ${secondCol} labels into ${path.relative(process.cwd(), mainPath)}`);
}

main();
