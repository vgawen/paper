// Build a blinded CSV for two annotators from rq2_to_annotate.jsonl.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, '..', 'out');
const rows = fs.readFileSync(path.join(OUT, 'rq2_to_annotate.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
const esc = (s) => '"' + String(s).replace(/"/g, '""') + '"';
// case_id comes from the (blinded) jsonl so it joins back to rq2_unblind.json.
const lines = ['case_id,route,gap_file,spec,annotator1_yn,annotator2_yn,final'];
rows.forEach((r) => lines.push([r.case_id, esc(r.route), esc(r.gap_file), esc(r.spec), '', '', ''].join(',')));
fs.writeFileSync(path.join(here, 'sheet.csv'), lines.join('\n') + '\n');
console.log(`wrote ${rows.length} rows -> annotate/sheet.csv`);
