// List rows where any two available pre-labels disagree, so a third annotator
// can adjudicate `final`.
//
// Sources (three):
//   1. original LLM pre-label: main `annotator1_yn` / `human1`
//   2. masked redo:           out/annotator1_masked.json (plan C)
//   3. human blind label:     main `annotator2_yn` / `human2`, with the
//                             post-collect blind CSV as fallback
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

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'out');
const WRITE = process.argv.includes('--write');

const RQ2_MAIN = process.env.RQ2_MAIN || path.join(outDir, 'rq2_real_to_annotate.csv');
const RQ2_BLIND = process.env.RQ2_BLIND || path.join(outDir, 'rq2_annotator2_blind.csv');
const RQ3_MAIN = process.env.RQ3_MAIN || path.join(outDir, 'rq3_reprobreak_to_annotate.csv');
const RQ3_BLIND = process.env.RQ3_BLIND || path.join(outDir, 'rq3_annotator2_blind.csv');
const MASKED_JSON = process.env.MASKED_JSON || path.join(outDir, 'annotator1_masked.json');

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

// The masked redo is a JSON produced by run_annotator1_masked.mjs:
// { rq2: { rows: { case_id: {label,...} } }, rq3: {...} }.
function readMasked(file, family) {
  if (!fs.existsSync(file)) return { status: 'not_run', map: new Map(), file };
  try {
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    const rows = j?.[family]?.rows;
    if (!rows || typeof rows !== 'object') return { status: 'missing_section', map: new Map(), file };
    const map = new Map(Object.entries(rows).map(([id, r]) => [id, String(r?.label ?? '').trim()]));
    return { status: 'ok', map, file };
  } catch (e) {
    return { status: `unreadable: ${e.message}`, map: new Map(), file };
  }
}

function sourceValue(row, key) {
  return key && Object.prototype.hasOwnProperty.call(row, key) ? String(row[key] ?? '').trim() : '';
}

function audit({ name, mainFile, blindFile, firstKey, secondKey, maskedKey, allowed, contextFields, family }) {
  if (!fs.existsSync(mainFile)) throw new Error(`missing file: ${mainFile}`);
  const main = readCsv(mainFile);
  const hasFirst = main.headers.includes(firstKey);
  const hasSecond = main.headers.includes(secondKey);
  const hasMaskedCol = !!maskedKey && main.headers.includes(maskedKey);

  let blindMap = new Map();
  let blindHasSecond = false;
  if (fs.existsSync(blindFile)) {
    const blind = readCsv(blindFile);
    blindHasSecond = blind.headers.includes(secondKey);
    blindMap = new Map(blind.rows.map((r) => [r.case_id, r]));
  }

  const masked = readMasked(MASKED_JSON, family);
  const stats = {
    total: main.rows.length,
    orig: { labeled: 0, blank: 0, invalid: 0, blankIds: [] },
    masked: { labeled: 0, blank: 0, invalid: 0, blankIds: [] },
    human: { labeled: 0, blank: 0, invalid: 0, blankIds: [] },
    pairs: { orig_masked: 0, orig_human: 0, masked_human: 0 },
    disagreements: 0,
  };
  const problems = [];
  const disagreements = [];

  const notes = [];
  if (!hasFirst) notes.push(`主表缺少第一列 ${firstKey}`);
  if (!hasSecond) notes.push(`主表缺少第二列 ${secondKey}`);
  if (masked.status !== 'ok') notes.push(`masked 重做不可用（${masked.status}）：${path.relative(path.join(here, '..', '..'), masked.file)}`);
  if (!hasSecond && !blindHasSecond) notes.push(`人工第二列在 main 与盲表中都缺失（${secondKey}）`);
  if (stats.total === 0) notes.push('主表为空');

  for (const row of main.rows) {
    const caseId = String(row.case_id ?? '').trim();
    const orig = sourceValue(row, firstKey);
    const maskedLabel = masked.map.has(caseId) ? masked.map.get(caseId) : sourceValue(row, maskedKey);
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

    const okOrig = check('orig', orig, firstKey);
    const okMasked = check('masked', maskedLabel, maskedKey || `${family}_masked`);
    const okHuman = check('human', human, secondKey);

    if (humanConflict) {
      problems.push({ case_id: caseId, source: 'human', field: secondKey, kind: 'conflict', detail: `主表=${JSON.stringify(humanMain)} 盲表=${JSON.stringify(humanBlind)}` });
    }

    const pairs = [];
    if (okOrig && okMasked) { stats.pairs.orig_masked++; if (orig !== maskedLabel) pairs.push('orig≠masked'); }
    if (okOrig && okHuman) { stats.pairs.orig_human++; if (orig !== human) pairs.push('orig≠human'); }
    if (okMasked && okHuman) { stats.pairs.masked_human++; if (maskedLabel !== human) pairs.push('masked≠human'); }

    if (pairs.length) {
      stats.disagreements++;
      const item = { case_id: caseId };
      for (const f of contextFields) item[f] = row[f] ?? '';
      item.orig_label = orig || '';
      item.masked_label = maskedLabel || '';
      item.human_label = human || '';
      item.masked_source = masked.map.has(caseId) ? 'json' : (hasMaskedCol ? 'main_csv' : 'missing');
      item.human_source = humanMain ? 'main' : (humanBlind ? 'blind_csv' : 'missing');
      item.mismatch_pairs = pairs.join(';');
      item.final = String(row.final ?? '').trim();
      disagreements.push(item);
    }
  }

  const header = ['case_id'].concat(contextFields, ['orig_label', 'masked_label', 'human_label', 'masked_source', 'human_source', 'mismatch_pairs', 'final']);
  const outFile = path.join(outDir, `${name}_label_disagreements.csv`);
  const fmt = (s) => `${s.labeled} 已标 / ${s.blank} 空 / ${s.invalid} 非法`;

  console.log(`\n== ${name} ==`);
  console.log(`main: ${path.relative(path.join(here, '..', '..'), mainFile)}`);
  console.log(`masked: ${masked.status} (${path.relative(path.join(here, '..', '..'), masked.file)})`);
  console.log(`human fallback: ${fs.existsSync(blindFile) ? path.relative(path.join(here, '..', '..'), blindFile) : '（不存在）'}`);
  console.log(`rows=${stats.total}`);
  console.log(`  orig:   ${fmt(stats.orig)}`);
  console.log(`  masked: ${fmt(stats.masked)}`);
  console.log(`  human:  ${fmt(stats.human)}`);
  console.log(`pairs: orig-masked=${stats.pairs.orig_masked} orig-human=${stats.pairs.orig_human} masked-human=${stats.pairs.masked_human}`);
  console.log(`disagreements=${stats.disagreements}`);
  if (notes.length) {
    console.log('notes:');
    for (const n of notes) console.log(`  - ${n}`);
  }
  for (const source of ['orig', 'masked', 'human']) {
    const s = stats[source];
    if (s.labeled > 0 && s.blank > 0) {
      const shown = s.blankIds.slice(0, 10).join(', ');
      console.log(`  - ${source} 部分缺失 ${s.blank} 条：${shown}${s.blank > 10 ? ' …' : ''}`);
    }
  }
  if (problems.length) {
    console.log(`problems=${problems.length}:`);
    for (const p of problems) console.log(`  - ${p.case_id || '(no id)'} [${p.source}] ${p.field} ${p.kind}: ${p.detail}`);
  } else {
    console.log('problems=0');
  }
  if (disagreements.length) {
    console.log('disagreements:');
    for (const d of disagreements) {
      console.log(`  - ${d.case_id}: orig=${d.orig_label || '—'} masked=${d.masked_label || '—'} human=${d.human_label || '—'} (${d.mismatch_pairs})`);
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
  firstKey: 'annotator1_yn',
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
  firstKey: 'human1',
  secondKey: 'human2',
  maskedKey: 'annotator1_masked',
  allowed: RQ3_ALLOWED,
  contextFields: ['rb_id', 'repo', 'test_file_path', 'line_no', 'old_locator'],
  family: 'rq3',
});

if (!WRITE) console.log('\ndry run; add --write to persist the disagreement lists.');
const hasInvalid = [...rq2.problems, ...rq3.problems].some((p) => p.kind === 'invalid' || p.kind === 'conflict');
if (hasInvalid) process.exitCode = 1;
