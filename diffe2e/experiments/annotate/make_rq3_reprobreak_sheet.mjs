import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const e2ePath = path.join(root, 'realproj', 'results', 'reprobreak_e2e.json');
const breaksPath = path.join(root, 'realproj', 'results', 'reprobreak_breaks.json');
const outCsv = path.join(root, 'experiments', 'out', 'rq3_reprobreak_to_annotate.csv');
const outKey = path.join(root, 'experiments', 'out', 'rq3_reprobreak_to_annotate_unblind.json');

const SAMPLE_PER_REPO = 10;
const MODEL_LABEL = 'STRUCTURAL_ONLY';

function esc(v) {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const e2e = loadJson(e2ePath);
const breaks = loadJson(breaksPath);
const metaById = new Map(breaks.map((r) => [String(r.id), r]));
const grouped = new Map();

for (const row of e2e.rows) {
  const repo = row.repo;
  const id = String(row.id);
  const meta = metaById.get(id);
  if (!meta) continue;
  const item = {
    id,
    repo,
    framework: meta.framework,
    test_file_path: meta.test_file_path,
    line_no: meta.line_no,
    old_locator: meta.old_locator,
    app_files: row.app_files,
    rule: row.rule,
    llm: row.llm,
  };
  const arr = grouped.get(repo) || [];
  arr.push(item);
  grouped.set(repo, arr);
}

const sample = [];
for (const [repo, rows] of [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  rows.sort((a, b) => hashString(`${repo}:${a.id}`) - hashString(`${repo}:${b.id}`));
  sample.push(...rows.slice(0, SAMPLE_PER_REPO));
}

sample.sort((a, b) => a.repo.localeCompare(b.repo) || Number(a.id) - Number(b.id));

const lines = [[
  'case_id',
  'rb_id',
  'repo',
  'framework',
  'test_file_path',
  'line_no',
  'old_locator',
  'human1',
  'human2',
  'final',
].join(',')];
const unblind = {};

sample.forEach((r, idx) => {
  const caseId = `rb${String(idx + 1).padStart(3, '0')}`;
  lines.push([
    caseId,
    r.id,
    esc(r.repo),
    r.framework,
    esc(r.test_file_path),
    r.line_no,
    esc(r.old_locator),
    '',
    '',
    '',
  ].join(','));
  unblind[caseId] = {
    model_label: MODEL_LABEL,
    rb_id: Number(r.id),
    repo: r.repo,
    app_files: r.app_files,
    rule: r.rule,
    llm: r.llm,
  };
});

fs.writeFileSync(outCsv, lines.join('\n') + '\n');
fs.writeFileSync(outKey, JSON.stringify(unblind, null, 2) + '\n');
console.log(`wrote ${sample.length} rows -> ${path.relative(root, outCsv)}`);
console.log(`wrote unblind key -> ${path.relative(root, outKey)}`);
