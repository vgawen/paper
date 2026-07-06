import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

export function buildRq2BlindedRows(sources) {
  const rows = [];
  const unblind = {};
  const stats = { total: 0, by_source: {} };
  let i = 0;
  for (const src of sources) {
    const name = src.source;
    for (const row of src.rows) {
      const caseId = `rq2_${String(++i).padStart(3, '0')}`;
      rows.push({
        case_id: caseId,
        route: row.route,
        gap_file: row.gap_file,
        spec: row.spec,
      });
      unblind[caseId] = {
        arm: row.arm,
        source: name,
      };
      stats.by_source[name] = (stats.by_source[name] || 0) + 1;
    }
  }
  stats.total = rows.length;
  return { rows, unblind, stats };
}

function defaultSources() {
  const candidates = [
    {
      source: 'controlled_rq2',
      jsonl: path.join(outDir, 'rq2_to_annotate.jsonl'),
      unblind: path.join(outDir, 'rq2_unblind.json'),
    },
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

  const found = [];
  const missing = [];
  for (const c of candidates) {
    if (!fs.existsSync(c.jsonl) || !fs.existsSync(c.unblind)) {
      missing.push(c);
      continue;
    }
    const rows = readJsonl(c.jsonl);
    const key = readJson(c.unblind);
    found.push({
      source: c.source,
      rows: rows.map((r) => ({ ...r, arm: key[r.case_id] })),
    });
  }
  return { found, missing };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { found, missing } = defaultSources();
  const { rows, unblind, stats } = buildRq2BlindedRows(found);

  const csvLines = ['case_id,route,gap_file,spec,annotator1_yn,annotator2_yn,final'];
  for (const r of rows) csvLines.push([r.case_id, esc(r.route), esc(r.gap_file), esc(r.spec), '', '', ''].join(','));

  const csvOut = path.join(outDir, 'rq2_combined_to_annotate.csv');
  const keyOut = path.join(outDir, 'rq2_combined_to_annotate_unblind.json');
  const statusOut = path.join(outDir, 'rq2_combined_to_annotate_status.json');

  fs.writeFileSync(csvOut, csvLines.join('\n') + '\n');
  fs.writeFileSync(keyOut, JSON.stringify(unblind, null, 2) + '\n');
  fs.writeFileSync(statusOut, JSON.stringify({
    found: found.map((f) => ({ source: f.source, rows: f.rows.length })),
    missing: missing.map((m) => ({ source: m.source, jsonl: path.relative(outDir, m.jsonl), unblind: path.relative(outDir, m.unblind) })),
    stats,
  }, null, 2) + '\n');

  console.log(`wrote ${rows.length} rows -> ${path.relative(path.join(here, '..', '..'), csvOut)}`);
  console.log(`wrote key -> ${path.relative(path.join(here, '..', '..'), keyOut)}`);
  console.log(`wrote status -> ${path.relative(path.join(here, '..', '..'), statusOut)}`);
  if (missing.length) console.log(`missing sources: ${missing.map((m) => m.source).join(', ')}`);
}
