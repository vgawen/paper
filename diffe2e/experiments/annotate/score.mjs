// Score the human second column against the CURRENT pre-label column.
//
// The first column is NOT `annotator1_yn` / `human1` anymore: those are the
// retired early pre-labels (RQ2 y=5/30, RQ3 SO=37/EC=2/SR=1). They stay in the
// main CSV only as historical records and must never enter a kappa or an
// agreement calculation. The default first column is the formal protocol-B
// result = three-run majority vote stored in
// `out/repeats/variance_report.json` (condition `masked`).
//
//   node experiments/annotate/score.mjs <main.csv> [--first-source=b-majority]
//                                                 [--first-source=b-run1]
//                                                 [--first-source=file:<json>]
//                                                 [--out-dir=<dir>]
//
// RQ2 reports Po, Pe, kappa and a 2x2 confusion matrix.
// RQ3 deliberately does NOT report kappa: the pre-label is a constant
// STRUCTURAL_ONLY column, so Pe is degenerate. It reports only Po, the 3x3
// confusion matrix, and the per-case disagreement list. The limit is encoded
// in the output as `kappa: null`, `kappa_reported: false` and `kappa_reason`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cohenKappa } from '../../pipeline/src/stats.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT = path.join(HERE, '..', 'out');

export const FAMILY_LABELS = {
  rq2: ['y', 'n'],
  rq3: ['STRUCTURAL_ONLY', 'EXPECTATION_CHANGE', 'SUSPECTED_REGRESSION'],
};

export const FIRST_SOURCE_DESC = {
  'b-majority': '协议 B 正式结果（masked 三次运行多数票，variance_report.json）',
  'b-run1': '协议 B 首次运行（仅诊断，不作正式数值）',
};

export function applyClassificationUnblind(rows, unblind) {
  return rows.map((r) => {
    if (r.model_label || !r.case_id) return r;
    const key = unblind[r.case_id];
    const modelLabel = typeof key === 'string' ? key : key?.model_label;
    return modelLabel ? { ...r, model_label: modelLabel } : r;
  });
}

export function applyRq2Unblind(rows, unblind) {
  const armOf = (caseId) => {
    const key = unblind[caseId];
    return typeof key === 'string' ? key : key?.arm;
  };
  const by_arm = {};
  for (const arm of ['diff', 'nodiff']) {
    by_arm[arm] = scoreRq2Rows(rows.filter((r) => armOf(r.case_id) === arm));
  }
  return by_arm;
}

function distribution(values) {
  const out = {};
  for (const v of values) out[v] = (out[v] || 0) + 1;
  return out;
}

function confusionMatrix(pairs, labels) {
  const cm = {};
  for (const a of labels) {
    cm[a] = {};
    for (const b of labels) cm[a][b] = 0;
  }
  for (const [a, b] of pairs) {
    if (!cm[a]) cm[a] = {};
    cm[a][b] = (cm[a][b] || 0) + 1;
  }
  return cm;
}

const trimmed = (v) => String(v ?? '').trim();

// RQ2: binary validity. First column = `prelabel` (B majority).
export function scoreRq2Rows(rows) {
  const labeled = rows.filter((r) => trimmed(r.prelabel) && trimmed(r.annotator2_yn));
  const pairs = labeled.map((r) => [trimmed(r.prelabel), trimmed(r.annotator2_yn)]);
  const kappa = cohenKappa(pairs);
  const confusion = confusionMatrix(pairs, FAMILY_LABELS.rq2);

  let valid = 0;
  const unresolved = [];
  for (const r of labeled) {
    const first = trimmed(r.prelabel);
    const second = trimmed(r.annotator2_yn);
    const gold = first === second ? first : trimmed(r.final);
    if (!gold) unresolved.push(r.case_id ?? '(no id)');
    if (gold === 'y') valid++;
  }
  return {
    n: labeled.length,
    po: kappa.po,
    pe: kappa.pe,
    kappa,
    confusion,
    first_distribution: distribution(pairs.map((p) => p[0])),
    second_distribution: distribution(pairs.map((p) => p[1])),
    semantic_validity: labeled.length ? +(valid / labeled.length).toFixed(4) : 0,
    unresolved_final: unresolved,
  };
}

// RQ3: no kappa. First column = `prelabel` (B majority), second = `human2`.
export function scoreClassificationRows(rows) {
  const labeled = rows.filter((r) => trimmed(r.prelabel || r.model_label) && trimmed(r.human2));
  const pairs = labeled.map((r) => [trimmed(r.prelabel || r.model_label), trimmed(r.human2)]);
  const confusion = confusionMatrix(pairs, FAMILY_LABELS.rq3);
  const agree = pairs.filter(([a, b]) => a === b).length;
  const disagreements = labeled
    .filter((r) => trimmed(r.prelabel || r.model_label) !== trimmed(r.human2))
    .map((r) => ({
      case_id: r.case_id ?? '(no id)',
      prelabel: trimmed(r.prelabel || r.model_label),
      human2: trimmed(r.human2),
      final: trimmed(r.final),
    }));
  return {
    n: labeled.length,
    po: pairs.length ? +(agree / pairs.length).toFixed(4) : 0,
    confusion,
    disagreements,
    first_distribution: distribution(pairs.map((p) => p[0])),
    second_distribution: distribution(pairs.map((p) => p[1])),
    // Explicit policy guard: do not compute or report kappa for RQ3.
    kappa: null,
    kappa_reported: false,
    kappa_reason: 'RQ3 预标注为常量 STRUCTURAL_ONLY，Pe 退化；按既定口径只报 Po、混淆矩阵与逐条分歧，不报 κ。',
  };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function labelFromValue(v) {
  return typeof v === 'string' ? v : (v?.label ?? v?.model_label ?? '');
}

// Load the first-column labels. Source is explicit and validated.
//   b-majority : variance_report.json -> conditions.masked.families[family].cases[].majority
//   b-run1     : annotator1_masked.json -> [family].rows[case_id].label
//   file:<json>: object map or array of {case_id, label}
export function loadFirstLabels(family, source = 'b-majority', outDir = DEFAULT_OUT) {
  if (!FAMILY_LABELS[family]) throw new Error(`unknown family: ${family}`);
  if (source === 'csv' || source === 'legacy' || source === 'annotator1') {
    throw new Error('旧列 annotator1_yn / human1 已作废，不能作为第一列；请使用 b-majority（默认）。');
  }

  if (source === 'b-majority') {
    const file = path.join(outDir, 'repeats', 'variance_report.json');
    if (!fs.existsSync(file)) throw new Error(`缺少 ${file}；无法读取 B 正式多数票`);
    const j = readJson(file);
    const cases = j?.conditions?.masked?.families?.[family]?.cases;
    if (!Array.isArray(cases) || !cases.length) throw new Error(`${file} 缺少 conditions.masked.families.${family}.cases`);
    const map = new Map();
    const ties = [];
    for (const c of cases) {
      if (c.majority_tie || !c.majority) { ties.push(c.case_id); continue; }
      map.set(c.case_id, String(c.majority).trim());
    }
    return {
      labels: map,
      source,
      file,
      note: FIRST_SOURCE_DESC[source],
      runs: cases[0]?.labels?.length ?? 0,
      ties,
    };
  }

  if (source === 'b-run1') {
    const file = path.join(outDir, 'annotator1_masked.json');
    if (!fs.existsSync(file)) throw new Error(`缺少 ${file}；无法读取 B run1`);
    const j = readJson(file);
    const rows = j?.[family]?.rows;
    if (!rows) throw new Error(`${file} 缺少 ${family}.rows`);
    const map = new Map(Object.entries(rows).map(([id, r]) => [id, String(labelFromValue(r)).trim()]));
    return { labels: map, source, file, note: FIRST_SOURCE_DESC[source], runs: 1, ties: [] };
  }

  if (source.startsWith('file:')) {
    const file = source.slice('file:'.length);
    if (!fs.existsSync(file)) throw new Error(`缺少第一列文件: ${file}`);
    const j = readJson(file);
    const raw = j?.labels ?? j;
    const map = new Map();
    if (Array.isArray(raw)) {
      for (const r of raw) map.set(String(r.case_id), String(labelFromValue(r)).trim());
    } else if (raw && typeof raw === 'object') {
      for (const [id, v] of Object.entries(raw)) map.set(String(id), String(labelFromValue(v)).trim());
    } else {
      throw new Error(`无法解析第一列文件: ${file}`);
    }
    return { labels: map, source, file, note: `外部第一列文件 ${file}`, runs: 0, ties: [] };
  }

  throw new Error(`unknown --first-source: ${source}；允许 b-majority（默认）、b-run1、file:<json>`);
}

function validateLabels(map, family) {
  const allowed = FAMILY_LABELS[family];
  const bad = [];
  for (const [id, v] of map) if (!allowed.includes(v)) bad.push(`${id}=${JSON.stringify(v)}`);
  if (bad.length) throw new Error(`${family} 第一列含非法标签: ${bad.slice(0, 8).join(', ')}${bad.length > 8 ? ' …' : ''}`);
}

function legacyWarning(family, dist) {
  if (family === 'rq2' && dist.y === 5 && dist.n === 25) {
    console.warn('WARNING: 第一列分布 y=5/n=25 与已作废旧列一致；确认没有误用 annotator1_yn。');
  }
  if (family === 'rq3' && dist.STRUCTURAL_ONLY === 37 && dist.EXPECTATION_CHANGE === 2 && dist.SUSPECTED_REGRESSION === 1) {
    console.warn('WARNING: 第一列分布 SO=37/EC=2/SR=1 与已作废旧列一致；确认没有误用 human1。');
  }
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
  const h = rows.shift() || [];
  return rows.filter((r) => r.length === h.length).map((r) => Object.fromEntries(h.map((k, j) => [k, r[j]])));
}

function opt(name, fallback) {
  const eq = process.argv.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) return process.argv[i + 1];
  return fallback;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const optsWithValue = new Set(['--first-source', '--out-dir']);
  const positional = [];
  for (let i = 0; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (i < 2) continue;
    if (optsWithValue.has(a)) { i++; continue; }
    if (a.startsWith('--')) continue;
    positional.push(a);
  }
  const input = positional[0] || path.join(HERE, 'sheet.csv');
  const outDir = opt('--out-dir', DEFAULT_OUT);
  const firstSource = opt('--first-source', 'b-majority');
  let rows = parseCSV(fs.readFileSync(input, 'utf8'));

  const isRq3 = rows.length && 'human1' in rows[0] && 'human2' in rows[0];
  const family = isRq3 ? 'rq3' : 'rq2';
  const first = loadFirstLabels(family, firstSource, outDir);
  validateLabels(first.labels, family);
  rows = rows.map((r) => ({ ...r, prelabel: first.labels.get(r.case_id) || '' }));
  const missingFirst = rows
    .filter((r) => (family === 'rq3' ? trimmed(r.human2) : trimmed(r.annotator2_yn)) && !trimmed(r.prelabel))
    .map((r) => r.case_id);

  if (isRq3 && !('model_label' in rows[0])) {
    const unblindPath = input.replace(/\.csv$/i, '_unblind.json');
    if (fs.existsSync(unblindPath)) rows = applyClassificationUnblind(rows, readJson(unblindPath));
  }

  if (isRq3) {
    const res = scoreClassificationRows(rows);
    res.first_source = first.source;
    res.first_source_note = first.note;
    res.first_source_file = path.relative(path.join(HERE, '..', '..'), first.file);
    res.missing_first = missingFirst;
    res.kappa = null;
    res.kappa_reported = false;
    res.kappa_reason = 'RQ3 预标注为常量 STRUCTURAL_ONLY，Pe 退化；按既定口径只报 Po、混淆矩阵与逐条分歧，不报 κ。';
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'rq3_staleness_annotation.json'), JSON.stringify(res, null, 2));
    legacyWarning('rq3', res.first_distribution);
    console.log(`first-source=${res.first_source} (${first.note})`);
    console.log(`first-label-distribution=${JSON.stringify(res.first_distribution)}  n=${res.n}  Po=${res.po}`);
    console.log(`confusion=${JSON.stringify(res.confusion)}`);
    console.log(`disagreements=${res.disagreements.length}${missingFirst.length ? `  missing-first=${missingFirst.join(',')}` : ''}`);
    console.log('kappa=NOT REPORTED (RQ3 policy: constant pre-label; report Po + confusion + disagreements only)');
    process.exit(0);
  }

  const res = scoreRq2Rows(rows);
  res.first_source = first.source;
  res.first_source_note = first.note;
  res.first_source_file = path.relative(path.join(HERE, '..', '..'), first.file);
  res.missing_first = missingFirst;

  const unblindPath = fs.existsSync(input.replace(/\.csv$/i, '_unblind.json'))
    ? input.replace(/\.csv$/i, '_unblind.json')
    : path.join(outDir, 'rq2_unblind.json');
  if (fs.existsSync(unblindPath)) {
    const unblind = readJson(unblindPath);
    res.by_arm = applyRq2Unblind(rows, unblind);
  }

  const outJson = input.replace(/\.csv$/i, '_annotation.json');
  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify(res, null, 2));
  legacyWarning('rq2', res.first_distribution);
  console.log(`first-source=${res.first_source} (${first.note})`);
  console.log(`first-label-distribution=${JSON.stringify(res.first_distribution)}  second-label-distribution=${JSON.stringify(res.second_distribution)}`);
  console.log(`semantic-validity=${res.semantic_validity}  Po=${res.po}  Pe=${res.pe}  kappa=${res.kappa.kappa} (n=${res.n})`);
  console.log(`confusion=${JSON.stringify(res.confusion)}`);
  if (missingFirst.length) console.log(`missing-first=${missingFirst.join(',')}`);
  if (res.unresolved_final.length) console.log(`unresolved-final=${res.unresolved_final.join(',')}`);
  if (res.by_arm) {
    console.log(`  diff=${res.by_arm.diff.semantic_validity} (n=${res.by_arm.diff.n})  nodiff=${res.by_arm.nodiff.semantic_validity} (n=${res.by_arm.nodiff.n})`);
  }
}
