// Collect the second annotator's labels from the Markdown worksheets into
// the blind CSV sheets used by merge_second_annotator.mjs + score.mjs.
//
// Default (dry run):
//   node experiments/annotate/collect_annotator2_md.mjs
// Write the labels into the blind CSVs:
//   node experiments/annotate/collect_annotator2_md.mjs --write
//
// RQ2 worksheet line format:  判定：`annotator2_yn=y`   (or n)
// RQ3 context line format:    判定：`human2=STRUCTURAL_ONLY`  备注：
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'out');
const rq2Md = process.env.RQ2_MD || path.join(outDir, 'rq2_annotator2_worksheet.md');
const rq3Md = process.env.RQ3_MD || path.join(outDir, 'rq3_annotator_context_blind.md');
const rq2Csv = process.env.RQ2_CSV || path.join(outDir, 'rq2_annotator2_blind.csv');
const rq3Csv = process.env.RQ3_CSV || path.join(outDir, 'rq3_annotator2_blind.csv');

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

function sections(file, idPattern) {
  const text = fs.readFileSync(file, 'utf8');
  const heads = [...text.matchAll(/^##\s+([A-Za-z0-9_]+)\b[^\n]*$/gm)];
  const out = [];
  for (let i = 0; i < heads.length; i++) {
    const id = heads[i][1];
    if (!idPattern.test(id)) continue;
    const start = heads[i].index + heads[i][0].length;
    const end = i + 1 < heads.length ? heads[i + 1].index : text.length;
    const body = text.slice(start, end);
    const judge = body.split('\n').find((l) => l.includes('判定：')) || '';
    out.push({ id, judge });
  }
  return out;
}

function labelOf(judge, key, allowed) {
  const m = judge.match(new RegExp(`${key}\\s*=\\s*([A-Za-z_]+)`));
  if (!m) return null;
  const v = m[1];
  if (/^_+$/.test(v)) return null; // still a blank worksheet line
  return allowed.includes(v) ? v : `INVALID:${v}`;
}

function collect(mdFile, csvFile, idPattern, key, allowed, column) {
  const found = sections(mdFile, idPattern);
  const sheet = parseCSV(fs.readFileSync(csvFile, 'utf8'));
  const byId = new Map(sheet.rows.map((r) => [r.case_id, r]));
  let filled = 0, invalid = 0;
  const unknown = [];
  for (const { id, judge } of found) {
    const label = labelOf(judge, key, allowed);
    if (!label) continue;
    const row = byId.get(id);
    if (!row) { unknown.push(id); continue; }
    if (label.startsWith('INVALID:')) { invalid++; console.error(`${id}: invalid ${key} value ${label.slice(8)}`); continue; }
    row[column] = label;
    filled++;
  }
  const missing = sheet.rows.filter((r) => !r[column]).map((r) => r.case_id);
  console.log(`${path.basename(csvFile)}: ${filled}/${sheet.rows.length} labeled, ${missing.length} missing`);
  if (unknown.length) console.error(`unknown case_id: ${unknown.join(', ')}`);
  if (invalid) console.error(`${invalid} invalid label(s)`);
  return { sheet, missing, filled, invalid, unknown };
}

const write = process.argv.includes('--write');
const rq2 = collect(rq2Md, rq2Csv, /^rq2_\d+$/, 'annotator2_yn', ['y', 'n'], 'annotator2_yn');
const rq3 = collect(rq3Md, rq3Csv, /^rb\d+$/, 'human2',
  ['STRUCTURAL_ONLY', 'EXPECTATION_CHANGE', 'SUSPECTED_REGRESSION'], 'human2');

if (write) {
  writeCSV(rq2Csv, rq2.sheet.headers, rq2.sheet.rows);
  writeCSV(rq3Csv, rq3.sheet.headers, rq3.sheet.rows);
  console.log('wrote labels into the blind CSVs; next run merge_second_annotator.mjs + score.mjs.');
} else {
  console.log('dry run; add --write to persist the labels.');
}
