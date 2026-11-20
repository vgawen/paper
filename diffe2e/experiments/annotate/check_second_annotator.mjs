// Gate the second-annotator return before merge and report the kappa matrix
// after merge. The existing collect/merge/score scripts intentionally do not
// validate label values, so this script is the hard-stop checkpoint.
//
//   node experiments/annotate/check_second_annotator.mjs validate rq2 \
//     experiments/out/rq2_real_to_annotate.csv \
//     experiments/out/rq2_annotator2_blind.csv [30]
//
//   node experiments/annotate/check_second_annotator.mjs matrix rq2 \
//     experiments/out/rq2_real_to_annotate.csv
//
// Exit codes: 0 = pass, 1 = gate failed, 2 = usage/read error.
//
// The first column is the CURRENT pre-label (default: protocol-B three-run
// majority from variance_report.json), not the retired `annotator1_yn` /
// `human1` columns. `final` is consistent when the current pre-label and the
// human second column disagree. RQ3 never reports kappa.
import fs from 'node:fs';
import { loadFirstLabels, scoreClassificationRows, scoreRq2Rows } from './score.mjs';

const FAMILIES = {
  rq2: {
    second: 'annotator2_yn',
    allowed: ['y', 'n'],
    expected: 30,
  },
  rq3: {
    second: 'human2',
    allowed: ['STRUCTURAL_ONLY', 'EXPECTATION_CHANGE', 'SUSPECTED_REGRESSION'],
    expected: 40,
  },
};

function parseCSV(t) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  const headers = rows.shift() || [];
  return { headers, rows: rows.filter((r) => r.length === headers.length).map((r) => Object.fromEntries(headers.map((h, j) => [h, r[j]]))) };
}

function read(file) {
  return parseCSV(fs.readFileSync(file, 'utf8'));
}

function validate(family, mainFile, blindFile, expected, labelsOnly = false, firstSource = 'b-majority') {
  const spec = FAMILIES[family];
  const main = read(mainFile);
  const blind = read(blindFile);
  const errors = [];
  let first = null;

  if (!main.headers.includes(spec.second)) errors.push(`主表缺少 ${spec.second}`);
  if (!blind.headers.includes(spec.second)) errors.push(`盲表缺少 ${spec.second}`);
  if (!blind.headers.includes('final')) errors.push('盲表缺少 final');
  if (main.rows.length !== expected) errors.push(`主表行数=${main.rows.length}，期望 ${expected}`);
  if (blind.rows.length !== expected) errors.push(`盲表行数=${blind.rows.length}，期望 ${expected}`);

  if (!labelsOnly) {
    try {
      first = loadFirstLabels(family, firstSource);
    } catch (e) {
      errors.push(`第一列来源不可用（${firstSource}）：${e.message}`);
    }
  }

  const mainIds = new Set(main.rows.map((r) => r.case_id));
  const seen = new Set();
  for (const r of blind.rows) {
    if (seen.has(r.case_id)) errors.push(`重复 case_id: ${r.case_id}`);
    seen.add(r.case_id);
    if (!mainIds.has(r.case_id)) errors.push(`盲表多出 case_id: ${r.case_id}`);
    const v = (r[spec.second] || '').trim();
    if (!v) errors.push(`空标签: ${r.case_id}`);
    else if (!spec.allowed.includes(v)) errors.push(`非法标签: ${r.case_id}=${JSON.stringify(v)}`);
    const fin = (r.final || '').trim();
    if (fin && !spec.allowed.includes(fin)) errors.push(`非法 final: ${r.case_id}=${JSON.stringify(fin)}`);
  }
  for (const id of mainIds) if (!seen.has(id)) errors.push(`盲表缺少 case_id: ${id}`);

  if (!labelsOnly && first) {
    for (const m of main.rows) {
      const b = blind.rows.find((r) => r.case_id === m.case_id);
      if (!b) continue;
      const h1 = (first.labels.get(m.case_id) || '').trim();
      const h2 = (b[spec.second] || '').trim();
      const fin = (b.final || '').trim();
      if (!h1 && h2) errors.push(`第一列来源缺 case_id: ${m.case_id}`);
      if (h1 && h2 && h1 !== h2 && !fin) errors.push(`分歧未填 final: ${m.case_id} (${h1} vs ${h2})`);
      if (h1 && h2 && h1 === h2 && fin) errors.push(`一致却填了 final: ${m.case_id}=${JSON.stringify(fin)}`);
    }
  }

  if (errors.length) {
    console.error(`FAIL ${family}: ${errors.length} issue(s)`);
    for (const e of errors) console.error(`  - ${e}`);
    return 1;
  }
  console.log(`PASS ${family}: ${expected} rows, labels valid${labelsOnly ? '' : `, final consistent with disagreements (first-source=${firstSource})`}`);
  return 0;
}

function matrix(family, mainFile, expected, firstSource = 'b-majority') {
  const spec = FAMILIES[family];
  let first;
  try {
    first = loadFirstLabels(family, firstSource);
  } catch (e) {
    console.error(`FAIL ${family}: 第一列来源不可用（${firstSource}）：${e.message}`);
    return 1;
  }
  const rows = read(mainFile).rows
    .map((r) => ({ ...r, prelabel: first.labels.get(r.case_id) || '' }))
    .filter((r) => r.prelabel.trim() && (r[spec.second] || '').trim());
  const n = rows.length;
  if (!n) {
    console.error(`FAIL ${family}: no paired labels in ${mainFile}`);
    return 1;
  }

  if (family === 'rq3') {
    const r = scoreClassificationRows(rows);
    console.log(JSON.stringify({
      family, n: r.n, expected, complete: r.n === expected,
      first_source: firstSource,
      po: r.po, confusion: r.confusion,
      disagreements: r.disagreements.length,
      kappa: 'NOT REPORTED',
      kappa_reported: false,
      kappa_reason: r.kappa_reason,
    }, null, 2));
    if (r.n !== expected) {
      console.error(`FAIL ${family}: n=${r.n}, expected ${expected}`);
      return 1;
    }
    return 0;
  }

  const r = scoreRq2Rows(rows);
  console.log(JSON.stringify({
    family, n: r.n, expected, complete: r.n === expected,
    first_source: firstSource,
    po: r.po, pe: r.pe, kappa: r.kappa.kappa, cm: r.confusion,
  }, null, 2));
  if (r.n !== expected) {
    console.error(`FAIL ${family}: n=${r.n}, expected ${expected}`);
    return 1;
  }
  return 0;
}

const rawArgs = process.argv.slice(2);
const labelsOnly = rawArgs.includes('--labels-only');
const withValue = new Set(['--first-source']);
const positional = [];
for (let i = 0; i < rawArgs.length; i++) {
  if (withValue.has(rawArgs[i])) { i++; continue; }
  if (rawArgs[i].startsWith('--')) continue;
  positional.push(rawArgs[i]);
}
const firstSource = rawArgs.find((a) => a.startsWith('--first-source='))?.slice('--first-source='.length)
  || (rawArgs.includes('--first-source') ? rawArgs[rawArgs.indexOf('--first-source') + 1] : 'b-majority');
const [mode, family, ...rest] = positional;
if (!FAMILIES[family] || !['validate', 'matrix'].includes(mode)) {
  console.error('usage: check_second_annotator.mjs validate [--labels-only] [--first-source=b-majority] <rq2|rq3> <main.csv> <blind.csv> [expected]');
  console.error('       check_second_annotator.mjs matrix   [--first-source=b-majority] <rq2|rq3> <main.csv> [expected]');
  process.exit(2);
}
const spec = FAMILIES[family];
const expected = rest[2] !== undefined ? Number(rest[2]) : (rest[1] !== undefined && mode === 'matrix' ? Number(rest[1]) : spec.expected);
if (mode === 'validate') {
  if (rest.length < 2) { console.error('validate needs <main.csv> <blind.csv>'); process.exit(2); }
  process.exit(validate(family, rest[0], rest[1], expected, labelsOnly, firstSource));
} else {
  if (rest.length < 1) { console.error('matrix needs <main.csv>'); process.exit(2); }
  process.exit(matrix(family, rest[0], expected, firstSource));
}
