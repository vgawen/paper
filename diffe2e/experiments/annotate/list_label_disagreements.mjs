// List rows where the CURRENT pre-label (protocol-B majority) disagrees with
// the human second column, so a third annotator can adjudicate `final`.
//
// The retired `annotator1_yn` / `human1` columns are NOT read here. They stay
// in the main CSV as historical records only.
//
// First column source: b-majority by default (variance_report.json masked
// three-run majority); can be overridden with --first-source=b-run1|file:<json>.
//
//   node experiments/annotate/list_label_disagreements.mjs            # dry run
//   node experiments/annotate/list_label_disagreements.mjs --write    # write CSVs
//
// Read-only on the main tables. Missing columns/files are reported as notes,
// not errors; invalid values and main/blind conflicts are reported and set
// exit code 1. RQ2 (binary) and RQ3 (three-way) are written separately.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFirstLabels } from './score.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'out');
const WRITE = process.argv.includes('--write');
const FIRST_SOURCE = process.argv.find((a) => a.startsWith('--first-source='))?.slice('--first-source='.length)
  || (process.argv.includes('--first-source') ? process.argv[process.argv.indexOf('--first-source') + 1] : 'b-majority');

const RQ2_MAIN = process.env.RQ2_MAIN || path.join(outDir, 'rq2_real_to_annotate.csv');
const RQ2_BLIND = process.env.RQ2_BLIND || path.join(outDir, 'rq2_annotator2_blind.csv');
const RQ3_MAIN = process.env.RQ3_MAIN || path.join(outDir, 'rq3_reprobreak_to_annotate.csv');
const RQ3_BLIND = process.env.RQ3_BLIND || path.join(outDir, 'rq3_annotator2_blind.csv');

const RQ2_ALLOWED = ['y', 'n'];
const RQ3_ALLOWED = ['STRUCTURAL_ONLY', 'EXPECTATION_CHANGE', 'SUSPECTED_REGRESSION'];

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift() || [];
  return { headers, rows: rows.filter((r) => r.length === headers.length).map((r) => Object.fromEntries(headers.map((h, j) => [h, r[j]]))) };
}

function readCsv(file) {
  return parseCSV(fs.readFileSync(file, 'utf8'));
}

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function writeCsv(file, headers, rows) {
  const lines = [headers.join(',')].concat(rows.map((r) => headers.map((h) => csvCell(r[h])).join(',')));
  fs.writeFileSync(file, lines.join('\n') + '\n');
}

const blank = (v) => String(v ?? '').trim() === '';
const sourceValue = (row, key) => (key && Object.prototype.hasOwnProperty.call(row, key) ? String(row[key] ?? '').trim() : '');

function audit({ name, mainFile, blindFile, secondKey, maskedKey, allowed, contextFields, family }) {
  if (!fs.existsSync(mainFile)) throw new Error(`missing file: ${mainFile}`);
  const main = readCsv(mainFile);
  const hasSecond = main.headers.includes(secondKey);
  const hasMaskedCol = !!maskedKey && main.headers.includes(maskedKey);

  let blindMap = new Map();
  let blindHasSecond = false;
  if (fs.existsSync(blindFile)) {
    const blind = readCsv(blindFile);
    blindHasSecond = blind.headers.includes(secondKey);
    blindMap = new Map(blind.rows.map((r) => [r.case_id, r]));
  }

  let first;
  try {
    first = loadFirstLabels(family, FIRST_SOURCE);
  } catch (e) {
    throw new Error(`第一列来源不可用（${FIRST_SOURCE}）：${e.message}`);
  }

  const stats = {
    total: main.rows.length,
    prelabel: { labeled: 0, blank: 0, invalid: 0, blankIds: [] },
    human: { labeled: 0, blank: 0, invalid: 0, blankIds: [] },
    pairs: { prelabel_human: 0 },
    disagreements: 0,
  };
  const problems = [];
  const disagreements = [];
  const notes = [];
  if (!hasSecond) notes.push(`主表缺少第二列 ${secondKey}`);
  if (!hasSecond && !blindHasSecond) notes.push(`人工第二列在 main 与盲表中都缺失（${secondKey}）`);
  if (stats.total === 0) notes.push('主表为空');

  for (const row of main.rows) {
    const caseId = String(row.case_id ?? '').trim();
    const prelabel = (first.labels.get(caseId) || '').trim();
    const run1 = sourceValue(row, maskedKey); // diagnostic only
    const humanMain = sourceValue(row, secondKey);
    const humanBlind = String((blindMap.get(caseId) || {})[secondKey] ?? '').trim();
    const humanConflict = humanMain && humanBlind && humanMain !== humanBlind;
    const human = humanMain || humanBlind;

    if (!caseId) {
      problems.push({ case_id: '', source: 'id', kind: 'missing_id', detail: '缺少 case_id' });
      continue;
    }

    const check = (source, value, labelKey) => {
      if (blank(value)) {
        stats[source].blank++;
        stats[source].blankIds.push(caseId);
        return false;
      }
      if (!allowed.includes(value)) {
        stats[source].invalid++;
        problems.push({ case_id: caseId, source, field: labelKey, kind: 'invalid', detail: `非法取值: ${JSON.stringify(value)}` });
        return false;
      }
      stats[source].labeled++;
      return true;
    };

    const okPrelabel = check('prelabel', prelabel, `prelabel:${FIRST_SOURCE}`);
    const okHuman = check('human', human, secondKey);

    if (humanConflict) {
      problems.push({ case_id: caseId, source: 'human', field: secondKey, kind: 'conflict', detail: `主表=${JSON.stringify(humanMain)} 盲表=${JSON.stringify(humanBlind)}` });
    }

    const mismatch = okPrelabel && okHuman && prelabel !== human;
    if (okPrelabel && okHuman) stats.pairs.prelabel_human++;
    if (mismatch) {
      stats.disagreements++;
      const item = { case_id: caseId };
      for (const f of contextFields) item[f] = row[f] ?? '';
      item.prelabel_label = prelabel;
      item.run1_label = run1 || '';
      item.human_label = human || '';
      item.prelabel_source = `b-majority:${path.relative(path.join(here, '..', '..'), first.file)}`;
      item.human_source = humanMain ? 'main' : (humanBlind ? 'blind_csv' : 'missing');
      item.mismatch = 'prelabel≠human';
      item.final = String(row.final ?? '').trim();
      disagreements.push(item);
      problems.push({ case_id: caseId, source: 'prelabel', field: 'final', kind: 'needs_final', detail: `${prelabel} vs ${human}` });
    }
  }

  const header = ['case_id'].concat(contextFields, ['prelabel_label', 'run1_label', 'human_label', 'prelabel_source', 'human_source', 'mismatch', 'final']);
  const outFile = path.join(outDir, `${name}_label_disagreements.csv`);
  const fmt = (s) => `${s.labeled} 已标 / ${s.blank} 空 / ${s.invalid} 非法`;

  console.log(`\n== ${name} ==`);
  console.log(`main: ${path.relative(path.join(here, '..', '..'), mainFile)}`);
  console.log(`first source: ${FIRST_SOURCE} (${path.relative(path.join(here, '..', '..'), first.file)})`);
  console.log(`human fallback: ${fs.existsSync(blindFile) ? path.relative(path.join(here, '..', '..'), blindFile) : '（不存在）'}`);
  console.log(`rows=${stats.total}`);
  console.log(`  prelabel: ${fmt(stats.prelabel)}`);
  console.log(`  human:    ${fmt(stats.human)}`);
  console.log(`pairs: prelabel-human=${stats.pairs.prelabel_human}`);
  console.log(`disagreements=${stats.disagreements}`);
  if (notes.length) {
    console.log('notes:');
    for (const n of notes) console.log(`  - ${n}`);
  }
  for (const source of ['prelabel', 'human']) {
    const s = stats[source];
    if (s.labeled > 0 && s.blank > 0) {
      const shown = s.blankIds.slice(0, 10).join(', ');
      console.log(`  - ${source} 部分缺失 ${s.blank} 条：${shown}${s.blank > 10 ? ' …' : ''}`);
    }
  }
  const hard = problems.filter((p) => p.kind === 'invalid' || p.kind === 'conflict' || p.kind === 'missing_id');
  const needsFinal = problems.filter((p) => p.kind === 'needs_final');
  console.log(`invalid/conflict/id problems=${hard.length}  rows needing final=${needsFinal.length}`);
  for (const p of hard) console.log(`  - ${p.case_id || '(no id)'} [${p.source}] ${p.field} ${p.kind}: ${p.detail}`);
  if (disagreements.length) {
    console.log('disagreements:');
    for (const d of disagreements) {
      console.log(`  - ${d.case_id}: prelabel=${d.prelabel_label || '—'} human=${d.human_label || '—'} (${d.mismatch})`);
    }
  }

  if (WRITE) {
    writeCsv(outFile, header, disagreements);
    console.log(`wrote ${disagreements.length} rows -> ${path.relative(path.join(here, '..', '..'), outFile)}`);
  }
  return { stats, problems, outFile, header, notes };
}

const rq2 = audit({
  name: 'rq2',
  mainFile: RQ2_MAIN,
  blindFile: RQ2_BLIND,
  secondKey: 'annotator2_yn',
  maskedKey: 'annotator1_masked_yn',
  allowed: RQ2_ALLOWED,
  contextFields: ['route', 'gap_file'],
  family: 'rq2',
});

const rq3 = audit({
  name: 'rq3',
  mainFile: RQ3_MAIN,
  blindFile: RQ3_BLIND,
  secondKey: 'human2',
  maskedKey: 'annotator1_masked',
  allowed: RQ3_ALLOWED,
  contextFields: ['rb_id', 'repo', 'test_file_path', 'line_no', 'old_locator'],
  family: 'rq3',
});

if (!WRITE) console.log('\ndry run; add --write to persist the disagreement lists.');
const hasInvalid = [...rq2.problems, ...rq3.problems].some((p) => p.kind === 'invalid' || p.kind === 'conflict');
if (hasInvalid) process.exitCode = 1;
