import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRq2BlindedRows } from './make_rq2_combined_sheet.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'out');

function esc(s) {
  return '"' + String(s ?? '').replace(/"/g, '""') + '"';
}

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const sources = [
  {
    source: 'real_actual_rq2',
    jsonl: path.join(outDir, 'real', 'actual_desktop_rq2_to_annotate.jsonl'),
    unblind: path.join(outDir, 'real', 'actual_desktop_rq2_unblind.json'),
  },
  {
    source: 'real_mermaid_rq2',
    jsonl: path.join(outDir, 'real', 'mermaid_live_rq2_to_annotate.jsonl'),
    unblind: path.join(outDir, 'real', 'mermaid_live_rq2_unblind.json'),
  },
];

const found = sources.map((s) => ({
  source: s.source,
  rows: readJsonl(s.jsonl).map((r) => ({ ...r, arm: readJson(s.unblind)[r.case_id]?.arm })),
}));

const { rows, unblind, stats } = buildRq2BlindedRows(found);
const csvOut = path.join(outDir, 'rq2_real_to_annotate.csv');
const keyOut = path.join(outDir, 'rq2_real_to_annotate_unblind.json');
const statusOut = path.join(outDir, 'rq2_real_to_annotate_status.json');

const csvLines = ['case_id,route,gap_file,spec,annotator1_yn,annotator2_yn,final'];
for (const r of rows) csvLines.push([r.case_id, esc(r.route), esc(r.gap_file), esc(r.spec), '', '', ''].join(','));

fs.writeFileSync(csvOut, csvLines.join('\n') + '\n');
fs.writeFileSync(keyOut, JSON.stringify(unblind, null, 2) + '\n');
fs.writeFileSync(statusOut, JSON.stringify({
  found: found.map((f) => ({ source: f.source, rows: f.rows.length })),
  stats,
}, null, 2) + '\n');

console.log(`wrote ${rows.length} rows -> ${path.relative(path.join(here, '..', '..'), csvOut)}`);
console.log(`wrote key -> ${path.relative(path.join(here, '..', '..'), keyOut)}`);
console.log(`wrote status -> ${path.relative(path.join(here, '..', '..'), statusOut)}`);
