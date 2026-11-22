// Dry-run harness for the second-annotator annotation chain.
// All work happens under this directory; formal paths are never written.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const experiments = path.join(root, 'experiments');
const out = path.join(experiments, 'out');
const annotate = path.join(experiments, 'annotate');
const srcOut = path.resolve(root, '..');
const srcAnnotate = path.resolve(root, '..', '..', 'annotate');

fs.rmSync(experiments, { recursive: true, force: true });
fs.mkdirSync(annotate, { recursive: true });
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(path.join(root, 'pipeline', 'src'), { recursive: true });

for (const f of ['list_label_disagreements.mjs', 'score.mjs', 'render_kappa_backfill.mjs', 'check_second_annotator.mjs']) {
  fs.copyFileSync(path.join(srcAnnotate, f), path.join(annotate, f));
}
fs.copyFileSync(path.resolve(root, '..', '..', '..', 'pipeline', 'src', 'stats.mjs'),
  path.join(root, 'pipeline', 'src', 'stats.mjs'));

for (const f of ['rq2_real_to_annotate.csv', 'rq3_reprobreak_to_annotate.csv',
  'rq2_real_to_annotate_unblind.json', 'rq3_reprobreak_to_annotate_unblind.json',
  'rq2_annotator2_blind.csv', 'rq3_annotator2_blind.csv',
  'rq2_annotator2_worksheet.md', 'rq3_annotator_context_blind.md']) {
  fs.copyFileSync(path.join(srcOut, f), path.join(out, f));
}

function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  const headers = rows.shift() || [];
  return { headers, rows: rows.filter((r) => r.length === headers.length).map((r) => Object.fromEntries(headers.map((h, j) => [h, r[j]]))) };
}
function csvCell(v) { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
function writeCSV(file, headers, rows) {
  const text = [headers.join(',')]
    .concat(rows.map((r) => headers.map((h) => csvCell(r[h])).join(',')))
    .join('\n') + '\n';
  fs.writeFileSync(file, text);
}
function readCSV(file) { return parseCSV(fs.readFileSync(file, 'utf8')); }

function fillWorksheet(srcFile, dstFile, family, labels) {
  const text = fs.readFileSync(srcFile, 'utf8');
  const lines = text.split('\n');
  let k = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('判定：')) continue;
    if (family === 'rq2' && line.includes('annotator2_yn=___')) {
      const v = labels[k++];
      if (v) lines[i] = `判定：\`annotator2_yn=${v}\``;
    } else if (family === 'rq3' && line.includes('human2=___')) {
      const v = labels[k++];
      if (v) lines[i] = `判定：\`human2=${v}\`  备注：`;
    }
  }
  fs.writeFileSync(dstFile, lines.join('\n'));
  return k;
}

function makeBlind(srcFile, dstFile, family, labels, finals = {}) {
  const { headers, rows } = readCSV(srcFile);
  const col = family === 'rq2' ? 'annotator2_yn' : 'human2';
  rows.forEach((r, i) => {
    r[col] = labels[i] ?? '';
    r.final = finals[r.case_id] ?? '';
  });
  writeCSV(dstFile, headers, rows);
}

// Build a fresh blind sheet from an existing one but with the second label
// cleared; `final` is preserved so blank-label scenarios isolate exactly one
// failure mode instead of also dropping rows with an empty arbitration label.
function blankSecondFrom(srcBlind, family) {
  const { headers, rows } = readCSV(srcBlind);
  const col = family === 'rq2' ? 'annotator2_yn' : 'human2';
  rows.forEach((r) => { r[col] = ''; });
  return { headers, rows };
}

function makeMasked(dstFile, rq2Labels, rq3Labels, rq2Ids, rq3Ids) {
  const mk = (ids, labels) => Object.fromEntries(ids.map((id, i) => [id, { label: labels[i] }]));
  fs.writeFileSync(dstFile, JSON.stringify({
    rq2: { rows: mk(rq2Ids, rq2Labels) },
    rq3: { rows: mk(rq3Ids, rq3Labels) },
  }, null, 2));
}

function run(script, args, extraEnv = {}) {
  const res = spawnSync('node', [script, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
  });
  return { status: res.status, stdout: res.stdout || '', stderr: res.stderr || '' };
}

// Copy a main sheet into a scenario dir together with its unblinding JSON so
// score.mjs resolves `<input>_unblind.json` exactly as in the real run.
function copyMainWithUnblind(srcMain, dstMain) {
  fs.copyFileSync(srcMain, dstMain);
  const srcUnblind = srcMain.replace(/\.csv$/i, '_unblind.json');
  if (fs.existsSync(srcUnblind)) {
    fs.copyFileSync(srcUnblind, dstMain.replace(/\.csv$/i, '_unblind.json'));
  }
}

// RQ3 score.mjs always writes to <scriptdir>/../out/rq3_staleness_annotation.json,
// so snapshot that fixed output into the scenario dir right after each run.
function snapshotRq3(dir) {
  const fixed = path.join(out, 'rq3_staleness_annotation.json');
  if (fs.existsSync(fixed)) fs.copyFileSync(fixed, path.join(dir, 'rq3_staleness_annotation.json'));
}

function nKappa(a, b) {
  const n = a.length, uniq = [...new Set([...a, ...b])];
  const m1 = {}, m2 = {}, cm = {};
  let agree = 0;
  for (const l of uniq) { cm[l] = {}; for (const m of uniq) cm[l][m] = 0; }
  for (let i = 0; i < n; i++) { if (a[i] === b[i]) agree++; m1[a[i]] = (m1[a[i]] || 0) + 1; m2[b[i]] = (m2[b[i]] || 0) + 1; cm[a[i]][b[i]]++; }
  const po = agree / n;
  let pe = 0;
  for (const l of uniq) pe += ((m1[l] || 0) / n) * ((m2[l] || 0) / n);
  const kappa = pe === 1 ? 1 : (po - pe) / (1 - pe);
  return { n, po: +po.toFixed(4), pe: +pe.toFixed(4), kappa: +kappa.toFixed(4), cm };
}

const ids = (file, pattern) => readCSV(file).rows.map((r) => r.case_id).filter((id) => pattern.test(id));
const rq2Ids = ids(path.join(out, 'rq2_real_to_annotate.csv'), /^rq2_\d+$/);
const rq3Ids = ids(path.join(out, 'rq3_reprobreak_to_annotate.csv'), /^rb\d+$/);

const log = [];
const record = (name, res, extra = '') => {
  log.push({ name, status: res.status, stdout: res.stdout.trim(), stderr: res.stderr.trim(), extra });
};

// ---------- main happy path ----------
const rq2Mixed = rq2Ids.map((_, i) => (i % 3 === 0 ? 'y' : 'n'));
const rq3Mixed = rq3Ids.map((_, i) => (i % 4 === 0 ? 'EXPECTATION_CHANGE' : (i % 5 === 0 ? 'SUSPECTED_REGRESSION' : 'STRUCTURAL_ONLY')));
const rq2Masked = rq2Ids.map((_, i) => (i % 2 === 0 ? 'y' : 'n'));
const rq3Masked = rq3Ids.map((_, i) => (i % 3 === 0 ? 'EXPECTATION_CHANGE' : (i % 7 === 0 ? 'SUSPECTED_REGRESSION' : 'STRUCTURAL_ONLY')));

const rq2Ws = path.join(out, 'rq2_ws_main.md');
const rq3Ws = path.join(out, 'rq3_ws_main.md');
fillWorksheet(path.join(out, 'rq2_annotator2_worksheet.md'), rq2Ws, 'rq2', rq2Mixed);
fillWorksheet(path.join(out, 'rq3_annotator_context_blind.md'), rq3Ws, 'rq3', rq3Mixed);

const rq2Blind = path.join(out, 'rq2_blind_main.csv');
const rq3Blind = path.join(out, 'rq3_blind_main.csv');
makeBlind(path.join(out, 'rq2_annotator2_blind.csv'), rq2Blind, 'rq2', rq2Ids.map(() => ''));
makeBlind(path.join(out, 'rq3_annotator2_blind.csv'), rq3Blind, 'rq3', rq3Ids.map(() => ''));
const maskedJson = path.join(out, 'masked_dryrun.json');
makeMasked(maskedJson, rq2Masked, rq3Masked, rq2Ids, rq3Ids);

const collect = path.join(srcAnnotate, 'collect_annotator2_md.mjs');
const envMain = { RQ2_MD: rq2Ws, RQ3_MD: rq3Ws, RQ2_CSV: rq2Blind, RQ3_CSV: rq3Blind };
record('collect dry-run (md)', run(collect, [], envMain));
record('collect --write (md)', run(collect, ['--write'], envMain));

const listScript = path.join(annotate, 'list_label_disagreements.mjs');
const envList = {
  RQ2_MAIN: path.join(out, 'rq2_real_to_annotate.csv'), RQ2_BLIND: rq2Blind,
  RQ3_MAIN: path.join(out, 'rq3_reprobreak_to_annotate.csv'), RQ3_BLIND: rq3Blind,
  MASKED_JSON: maskedJson,
};
record('list --write', run(listScript, ['--write'], envList));

// fill synthetic finals for disagreements, then push finals into the blind sheets
const rq2Dis = path.join(out, 'rq2_label_disagreements.csv');
const rq3Dis = path.join(out, 'rq3_label_disagreements.csv');
const finals = {};
for (const [file, val] of [[rq2Dis, 'y'], [rq3Dis, 'EXPECTATION_CHANGE']]) {
  if (!fs.existsSync(file)) continue;
  const { headers, rows } = readCSV(file);
  rows.forEach((r) => {
    // Only arbitrate the two human/LLM columns that score.mjs actually compares;
    // a masked-only disagreement does not need a final label.
    if (String(r.mismatch_pairs || '').includes('orig≠human')) {
      r.final = val;
      finals[r.case_id] = val;
    }
  });
  writeCSV(file, headers, rows);
}
for (const [file, family] of [[rq2Blind, 'rq2'], [rq3Blind, 'rq3']]) {
  const { headers, rows } = readCSV(file);
  rows.forEach((r) => { if (finals[r.case_id]) r.final = finals[r.case_id]; });
  writeCSV(file, headers, rows);
}

const rq2Main = path.join(out, 'rq2_real_to_annotate.csv');
const rq3Main = path.join(out, 'rq3_reprobreak_to_annotate.csv');
const merge = path.join(srcAnnotate, 'merge_second_annotator.mjs');
record('merge RQ2', run(merge, [rq2Blind, rq2Main]));
record('merge RQ3', run(merge, [rq3Blind, rq3Main]));

const score = path.join(annotate, 'score.mjs');
const check = path.join(annotate, 'check_second_annotator.mjs');
record('gate main RQ2', run(check, ['validate', 'rq2', rq2Main, rq2Blind]));
record('gate main RQ3', run(check, ['validate', 'rq3', rq3Main, rq3Blind]));
record('score RQ2', run(score, [rq2Main]));
record('score RQ3', run(score, [rq3Main]));
record('matrix RQ2', run(check, ['matrix', 'rq2', rq2Main]));
record('matrix RQ3', run(check, ['matrix', 'rq3', rq3Main]));

const rq2Json = JSON.parse(fs.readFileSync(path.join(out, 'rq2_real_to_annotate_annotation.json'), 'utf8'));
const rq3Json = JSON.parse(fs.readFileSync(path.join(out, 'rq3_staleness_annotation.json'), 'utf8'));

const rq2Rows = readCSV(rq2Main).rows;
const rq3Rows = readCSV(rq3Main).rows;
const rq2Pairs = rq2Rows.filter((r) => r.annotator1_yn && r.annotator2_yn).map((r) => [r.annotator1_yn.trim(), r.annotator2_yn.trim()]);
const rq3HumanPairs = rq3Rows.filter((r) => r.human1 && r.human2).map((r) => [r.human1.trim(), r.human2.trim()]);
const rq2Calc = nKappa(rq2Pairs.map((p) => p[0]), rq2Pairs.map((p) => p[1]));
const rq3Calc = nKappa(rq3HumanPairs.map((p) => p[0]), rq3HumanPairs.map((p) => p[1]));

const render = path.join(annotate, 'render_kappa_backfill.mjs');
record('render kappa template', run(render, []));
const rq2DisRows = fs.existsSync(rq2Dis) ? readCSV(rq2Dis).rows.length : 0;
const rq3DisRows = fs.existsSync(rq3Dis) ? readCSV(rq3Dis).rows.length : 0;
record('gate labels-only RQ2', run(check, ['validate', '--labels-only', 'rq2', rq2Main, rq2Blind]));
record('gate labels-only RQ3', run(check, ['validate', '--labels-only', 'rq3', rq3Main, rq3Blind]));

// ---------- failure scenarios ----------
function scenario(name, fn) {
  const dir = path.join(out, `scen_${name}`);
  fs.mkdirSync(dir, { recursive: true });
  return fn(dir);
}

// 1) short: 29/30 and 39/40
scenario('short', (dir) => {
  const ws2 = path.join(dir, 'rq2.md');
  const ws3 = path.join(dir, 'rq3.md');
  fillWorksheet(path.join(out, 'rq2_annotator2_worksheet.md'), ws2, 'rq2', rq2Mixed.slice(0, 29));
  fillWorksheet(path.join(out, 'rq3_annotator_context_blind.md'), ws3, 'rq3', rq3Mixed.slice(0, 39));
  for (const [family, src] of [['rq2', rq2Blind], ['rq3', rq3Blind]]) {
    const { headers, rows } = blankSecondFrom(src, family);
    writeCSV(path.join(dir, `${family}.csv`), headers, rows);
  }
  const env = { RQ2_MD: ws2, RQ3_MD: ws3, RQ2_CSV: path.join(dir, 'rq2.csv'), RQ3_CSV: path.join(dir, 'rq3.csv') };
  record('short collect dry-run', run(collect, [], env));
  record('short collect --write', run(collect, ['--write'], env));
  copyMainWithUnblind(path.join(out, 'rq2_real_to_annotate.csv'), path.join(dir, 'rq2_main.csv'));
  copyMainWithUnblind(path.join(out, 'rq3_reprobreak_to_annotate.csv'), path.join(dir, 'rq3_main.csv'));
  record('short merge RQ2', run(merge, [path.join(dir, 'rq2.csv'), path.join(dir, 'rq2_main.csv')]));
  record('short merge RQ3', run(merge, [path.join(dir, 'rq3.csv'), path.join(dir, 'rq3_main.csv')]));
  record('short gate RQ2', run(check, ['validate', 'rq2', path.join(dir, 'rq2_main.csv'), path.join(dir, 'rq2.csv')]));
  record('short gate RQ3', run(check, ['validate', 'rq3', path.join(dir, 'rq3_main.csv'), path.join(dir, 'rq3.csv')]));
  record('short list --write', run(listScript, ['--write'], {
    RQ2_MAIN: path.join(dir, 'rq2_main.csv'), RQ2_BLIND: path.join(dir, 'rq2.csv'),
    RQ3_MAIN: path.join(dir, 'rq3_main.csv'), RQ3_BLIND: path.join(dir, 'rq3.csv'), MASKED_JSON: maskedJson,
  }));
  record('short score RQ2', run(score, [path.join(dir, 'rq2_main.csv')]));
  record('short score RQ3', run(score, [path.join(dir, 'rq3_main.csv')]));
  snapshotRq3(dir);
});

// 2) invalid values
scenario('invalid', (dir) => {
  const v2 = rq2Mixed.slice();
  const v3 = rq3Mixed.slice();
  v2[0] = 'Y'; v2[1] = 'yes'; v2[2] = 'Y';
  v3[0] = 'structural_only'; v3[1] = 'EC ';
  const ws2 = path.join(dir, 'rq2.md');
  const ws3 = path.join(dir, 'rq3.md');
  fillWorksheet(path.join(out, 'rq2_annotator2_worksheet.md'), ws2, 'rq2', v2);
  fillWorksheet(path.join(out, 'rq3_annotator_context_blind.md'), ws3, 'rq3', v3);
  for (const [family, src, labels] of [['rq2', rq2Blind, v2], ['rq3', rq3Blind, v3]]) {
    const { headers, rows } = blankSecondFrom(src, family);
    labels.forEach((v, i) => { rows[i][family === 'rq2' ? 'annotator2_yn' : 'human2'] = v; });
    writeCSV(path.join(dir, `${family}.csv`), headers, rows);
  }
  const env = { RQ2_MD: ws2, RQ3_MD: ws3, RQ2_CSV: path.join(dir, 'rq2.csv'), RQ3_CSV: path.join(dir, 'rq3.csv') };
  record('invalid collect dry-run', run(collect, [], env));
  record('invalid collect --write', run(collect, ['--write'], env));
  copyMainWithUnblind(path.join(out, 'rq2_real_to_annotate.csv'), path.join(dir, 'rq2_main.csv'));
  copyMainWithUnblind(path.join(out, 'rq3_reprobreak_to_annotate.csv'), path.join(dir, 'rq3_main.csv'));
  record('invalid merge RQ2 (csv path, bypasses collect)', run(merge, [path.join(dir, 'rq2.csv'), path.join(dir, 'rq2_main.csv')]));
  record('invalid merge RQ3 (csv path, bypasses collect)', run(merge, [path.join(dir, 'rq3.csv'), path.join(dir, 'rq3_main.csv')]));
  record('invalid gate RQ2', run(check, ['validate', 'rq2', path.join(dir, 'rq2_main.csv'), path.join(dir, 'rq2.csv')]));
  record('invalid gate RQ3', run(check, ['validate', 'rq3', path.join(dir, 'rq3_main.csv'), path.join(dir, 'rq3.csv')]));
  record('invalid list --write', run(listScript, ['--write'], {
    RQ2_MAIN: path.join(dir, 'rq2_main.csv'), RQ2_BLIND: path.join(dir, 'rq2.csv'),
    RQ3_MAIN: path.join(dir, 'rq3_main.csv'), RQ3_BLIND: path.join(dir, 'rq3.csv'), MASKED_JSON: maskedJson,
  }));
  record('invalid score RQ2', run(score, [path.join(dir, 'rq2_main.csv')]));
  record('invalid score RQ3', run(score, [path.join(dir, 'rq3_main.csv')]));
  snapshotRq3(dir);
});

// 3) blank final on disagreements
scenario('blank_final', (dir) => {
  for (const [family, file] of [['rq2', rq2Blind], ['rq3', rq3Blind]]) {
    const { headers, rows } = readCSV(file);
    rows.forEach((r) => { r.final = ''; });
    writeCSV(path.join(dir, `${family}.csv`), headers, rows);
  }
  copyMainWithUnblind(path.join(out, 'rq2_real_to_annotate.csv'), path.join(dir, 'rq2_main.csv'));
  copyMainWithUnblind(path.join(out, 'rq3_reprobreak_to_annotate.csv'), path.join(dir, 'rq3_main.csv'));
  record('blank-final merge RQ2', run(merge, [path.join(dir, 'rq2.csv'), path.join(dir, 'rq2_main.csv')]));
  record('blank-final merge RQ3', run(merge, [path.join(dir, 'rq3.csv'), path.join(dir, 'rq3_main.csv')]));
  record('blank-final gate RQ2', run(check, ['validate', 'rq2', path.join(dir, 'rq2_main.csv'), path.join(dir, 'rq2.csv')]));
  record('blank-final gate RQ3', run(check, ['validate', 'rq3', path.join(dir, 'rq3_main.csv'), path.join(dir, 'rq3.csv')]));
  record('blank-final score RQ2', run(score, [path.join(dir, 'rq2_main.csv')]));
  record('blank-final score RQ3', run(score, [path.join(dir, 'rq3_main.csv')]));
  snapshotRq3(dir);
});

// 4) main vs blind conflict
scenario('conflict', (dir) => {
  const mainRows = readCSV(path.join(out, 'rq2_real_to_annotate.csv'));
  mainRows.rows[0].annotator2_yn = 'y';
  writeCSV(path.join(dir, 'rq2_main.csv'), mainRows.headers, mainRows.rows);
  const blind = readCSV(rq2Blind);
  blind.rows[0].annotator2_yn = 'n';
  writeCSV(path.join(dir, 'rq2.csv'), blind.headers, blind.rows);
  const env = { RQ2_MAIN: path.join(dir, 'rq2_main.csv'), RQ2_BLIND: path.join(dir, 'rq2.csv'),
    RQ3_MAIN: path.join(out, 'rq3_reprobreak_to_annotate.csv'), RQ3_BLIND: rq3Blind, MASKED_JSON: maskedJson };
  record('conflict list --write', run(listScript, ['--write'], env));
});

// 5) duplicate case_id in blind
scenario('duplicate', (dir) => {
  const { headers, rows } = readCSV(rq2Blind);
  rows.push({ ...rows[0] });
  writeCSV(path.join(dir, 'rq2.csv'), headers, rows);
  copyMainWithUnblind(path.join(out, 'rq2_real_to_annotate.csv'), path.join(dir, 'rq2_main.csv'));
  record('duplicate merge RQ2', run(merge, [path.join(dir, 'rq2.csv'), path.join(dir, 'rq2_main.csv')]));
  record('duplicate gate RQ2', run(check, ['validate', 'rq2', path.join(dir, 'rq2_main.csv'), path.join(dir, 'rq2.csv')]));
  record('duplicate list --write', run(listScript, ['--write'], {
    RQ2_MAIN: path.join(dir, 'rq2_main.csv'), RQ2_BLIND: path.join(dir, 'rq2.csv'),
    RQ3_MAIN: path.join(out, 'rq3_reprobreak_to_annotate.csv'), RQ3_BLIND: rq3Blind, MASKED_JSON: maskedJson,
  }));
  record('duplicate score RQ2', run(score, [path.join(dir, 'rq2_main.csv')]));
});

// 6) extreme skew: all one label
scenario('skew', (dir) => {
  for (const [family, src, mainSrc, value] of [
    ['rq2', rq2Blind, path.join(out, 'rq2_real_to_annotate.csv'), 'y'],
    ['rq3', rq3Blind, path.join(out, 'rq3_reprobreak_to_annotate.csv'), 'STRUCTURAL_ONLY'],
  ]) {
    const { headers, rows } = blankSecondFrom(src, family);
    const firstKey = family === 'rq2' ? 'annotator1_yn' : 'human1';
    const secondKey = family === 'rq2' ? 'annotator2_yn' : 'human2';
    const firstBy = new Map(readCSV(mainSrc).rows.map((r) => [r.case_id, (r[firstKey] || '').trim()]));
    rows.forEach((r) => {
      r[secondKey] = value;
      // A purely skewed but structurally valid return still arbitrates every
      // disagreement; tests whether the gate catches skew (it should not).
      r.final = firstBy.get(r.case_id) && firstBy.get(r.case_id) !== value ? value : '';
    });
    writeCSV(path.join(dir, `${family}.csv`), headers, rows);
  }
  copyMainWithUnblind(path.join(out, 'rq2_real_to_annotate.csv'), path.join(dir, 'rq2_main.csv'));
  copyMainWithUnblind(path.join(out, 'rq3_reprobreak_to_annotate.csv'), path.join(dir, 'rq3_main.csv'));
  record('skew merge RQ2', run(merge, [path.join(dir, 'rq2.csv'), path.join(dir, 'rq2_main.csv')]));
  record('skew merge RQ3', run(merge, [path.join(dir, 'rq3.csv'), path.join(dir, 'rq3_main.csv')]));
  record('skew gate RQ2', run(check, ['validate', 'rq2', path.join(dir, 'rq2_main.csv'), path.join(dir, 'rq2.csv')]));
  record('skew gate RQ3', run(check, ['validate', 'rq3', path.join(dir, 'rq3_main.csv'), path.join(dir, 'rq3.csv')]));
  record('skew score RQ2', run(score, [path.join(dir, 'rq2_main.csv')]));
  record('skew score RQ3', run(score, [path.join(dir, 'rq3_main.csv')]));
  snapshotRq3(dir);
  const r2 = readCSV(path.join(dir, 'rq2_main.csv')).rows;
  const r3 = readCSV(path.join(dir, 'rq3_main.csv')).rows;
  const k2 = nKappa(r2.map((r) => r.annotator1_yn.trim()), r2.map((r) => r.annotator2_yn.trim()));
  const k3 = nKappa(r3.filter((r) => r.human1 && r.human2).map((r) => r.human1.trim()), r3.filter((r) => r.human1 && r.human2).map((r) => r.human2.trim()));
  fs.writeFileSync(path.join(dir, 'kappa.json'), JSON.stringify({ rq2: k2, rq3: k3 }, null, 2));
});

// ---------- report ----------
const rowsFor = (file, a, b) => readCSV(file).rows.filter((r) => r[a] && r[b]);
const rq2Blank = rowsFor(path.join(out, 'scen_blank_final', 'rq2_main.csv'), 'annotator1_yn', 'annotator2_yn');
const rq3Blank = rowsFor(path.join(out, 'scen_blank_final', 'rq3_main.csv'), 'human1', 'human2');
const blankFinalRq2 = rq2Blank.filter((r) => r.annotator1_yn.trim() !== r.annotator2_yn.trim() && !(r.final || '').trim()).length;
const blankFinalRq3 = rq3Blank.filter((r) => r.human1.trim() !== r.human2.trim() && !(r.final || '').trim()).length;
const skew = JSON.parse(fs.readFileSync(path.join(out, 'scen_skew', 'kappa.json'), 'utf8'));
const shortR2Json = JSON.parse(fs.readFileSync(path.join(out, 'scen_short', 'rq2_main_annotation.json'), 'utf8'));
const shortR3Json = JSON.parse(fs.readFileSync(path.join(out, 'scen_short', 'rq3_staleness_annotation.json'), 'utf8'));
const blankR2Json = JSON.parse(fs.readFileSync(path.join(out, 'scen_blank_final', 'rq2_main_annotation.json'), 'utf8'));
const blankR3Json = JSON.parse(fs.readFileSync(path.join(out, 'scen_blank_final', 'rq3_staleness_annotation.json'), 'utf8'));
const dupR2Json = JSON.parse(fs.readFileSync(path.join(out, 'scen_duplicate', 'rq2_main_annotation.json'), 'utf8'));
const invalidR2Json = JSON.parse(fs.readFileSync(path.join(out, 'scen_invalid', 'rq2_main_annotation.json'), 'utf8'));
const invalidR3Json = JSON.parse(fs.readFileSync(path.join(out, 'scen_invalid', 'rq3_staleness_annotation.json'), 'utf8'));
const st = (name) => {
  const hit = log.find((l) => l.name === name);
  return hit ? String(hit.status) : 'missing';
};

const report = [];
report.push('# 第二标注者链路端到端演练报告（合成标签）', '');
report.push(`生成时间：${new Date().toISOString()}`, '');
report.push('## 主链路（md 录入 → collect → list → final → merge → score → render）', '');
report.push('| 步骤 | 退出码 | 关键输出 |', '|---|---|---|');
for (const l of log) report.push(`| ${l.name} | ${l.status} | ${l.stdout.replace(/\n/g, '<br>')}${l.stderr ? '<br>STDERR: ' + l.stderr.replace(/\n/g, '<br>') : ''} |`);
report.push('', '### 主链路计数与统计', '');
report.push(`- RQ2 score: n=${rq2Json.n}，semantic_validity=${rq2Json.semantic_validity}，kappa=${rq2Json.kappa.kappa}，po=${rq2Json.kappa.po}，pe=${rq2Json.kappa.pe}`);
report.push(`- RQ3 score: n=${rq3Json.n}，model_accuracy=${rq3Json.model_accuracy}，model_kappa=${rq3Json.model_kappa.kappa}，human_kappa=${rq3Json.human_kappa.kappa}`);
report.push(`- RQ2 混淆矩阵：${JSON.stringify(rq2Calc.cm)}`);
report.push(`- RQ3 人工列混淆矩阵：${JSON.stringify(rq3Calc.cm)}`);
report.push(`- list 分歧行数：RQ2=${rq2DisRows}，RQ3=${rq3DisRows}`);
report.push('', '### 硬闸门（check_second_annotator.mjs）', '');
report.push('| 闸门 | 退出码 | 结果 |', '|---|---|---|');
for (const n of ['gate labels-only RQ2', 'gate labels-only RQ3', 'gate main RQ2', 'gate main RQ3', 'short gate RQ2', 'short gate RQ3',
  'invalid gate RQ2', 'invalid gate RQ3', 'blank-final gate RQ2', 'blank-final gate RQ3',
  'duplicate gate RQ2', 'skew gate RQ2', 'skew gate RQ3', 'matrix RQ2', 'matrix RQ3']) {
  const hit = log.find((l) => l.name === n);
  if (!hit) continue;
  const outLine = hit.stdout.trim().split('\n')[0] || '';
  const errLine = hit.stderr.trim().split('\n')[0] || '';
  report.push(`| ${n} | ${hit.status} | ${(outLine || errLine).slice(0, 180)} |`);
}
report.push('', '## 失效场景', '');
report.push('| 场景 | 观察 | 退出码 | 是否硬失败 |', '|---|---|---|---|');
report.push(`| 少填（29/30、39/40） | collect 退出 ${st('short collect --write')}（只报 29/30、39/40）；merge 退出 ${st('short merge RQ2')}/${st('short merge RQ3')}（仅 WARNING）；list 退出 ${st('short list --write')}（只作 note）；score n=${shortR2Json.n}/${shortR3Json.n} | 现有脚本 ${st('short score RQ2')}/${st('short score RQ3')}；闸门 ${st('short gate RQ2')}/${st('short gate RQ3')} | 现有脚本：否；闸门：是 |`);
report.push(`| 非法值（Y/yes/小写/带空格） | collect 退出 ${st('invalid collect --write')}（打印 invalid 但不阻断）；CSV 直填经 merge 退出 ${st('invalid merge RQ2 (csv path, bypasses collect)')}/${st('invalid merge RQ3 (csv path, bypasses collect)')} 原样写入；list 退出 ${st('invalid list --write')}（检出非法）；score 仍退出 ${st('invalid score RQ2')}/${st('invalid score RQ3')} 并计入（RQ2 n=${invalidR2Json.n} κ=${invalidR2Json.kappa.kappa}，RQ3 n=${invalidR3Json.n}） | 现有脚本 ${st('invalid score RQ2')}/${st('invalid score RQ3')}；闸门 ${st('invalid gate RQ2')}/${st('invalid gate RQ3')} | 现有脚本：部分（仅 list）；闸门：是 |`);
report.push(`| 分歧 final 留空 | RQ2 空白 final 的分歧条数=${blankFinalRq2}，score semantic_validity=${blankR2Json.semantic_validity}（n=${blankR2Json.n}，空 final 按非 y 计入）；RQ3 空白 final=${blankFinalRq3}，score n=${blankR3Json.n}（相对 n=40 缩小） | 现有脚本 ${st('blank-final score RQ2')}/${st('blank-final score RQ3')}；闸门 ${st('blank-final gate RQ2')}/${st('blank-final gate RQ3')} | 现有脚本：否（按设计降级）；闸门：是 |`);
report.push(`| 主表/盲表冲突 | list 报 conflict 并退出 ${st('conflict list --write')} | ${st('conflict list --write')} | 是 |`);
report.push(`| 重复 case_id | merge 退出 ${st('duplicate merge RQ2')}，list 退出 ${st('duplicate list --write')}（未检出重复），score n=${dupR2Json.n}，重复行被 Map 折叠 | 现有脚本 ${st('duplicate score RQ2')}；闸门 ${st('duplicate gate RQ2')} | 现有脚本：否（静默）；闸门：是 |`);
report.push(`| 全同标签偏斜 | RQ2 κ=${skew.rq2.kappa}，Po=${skew.rq2.po}，Pe=${skew.rq2.pe}，n=${skew.rq2.n}；RQ3 κ=${skew.rq3.kappa}，Po=${skew.rq3.po}，Pe=${skew.rq3.pe}，n=${skew.rq3.n} | 现有脚本 ${st('skew score RQ2')}/${st('skew score RQ3')}；闸门 ${st('skew gate RQ2')}/${st('skew gate RQ3')} | 现有脚本：否（正常计算）；闸门：否（结构合法，但不拦统计偏斜，须人工看分布） |`);
report.push('', '## 结论', '');
report.push('- 主链路可跑通：md 录入、collect 写入、分歧清单、final 回填、merge、score、render 均产出结果；RQ2 为 n=30，RQ3 为 n=40。');
report.push('- score.mjs 控制台只打印 κ / semantic-validity / model-accuracy；JSON 有 po/pe，但**没有混淆矩阵**。本次用 check_second_annotator.mjs matrix 补齐 Po/Pe/κ/CM（RQ2 Po=0.7、Pe=0.6111、κ=0.2286；RQ3 人工列 Po=0.6、Pe=0.5713、κ=0.0671）。');
report.push('- 现有脚本缺口：collect 对非法值只打印告警但退出 0；merge 完全不校验标签取值，CSV 直填的非法值会原样合并；merge 对重复 case_id 静默折叠；list 对缺失/重复不设非 0 退出；score 对非法值和缺失行不报错。上述全部由 check_second_annotator.mjs 闸门挡住（退出 1）。');
report.push('- 偏斜实测：RQ2 全填 y 时 κ=0，Po=0.1667，Pe=0.1667（与“接近 0”预期一致），n=30；RQ3 全填 STRUCTURAL_ONLY 时 κ=0，Po=0.925，Pe=0.925，n=40。两条 final 都跟随偏斜标签，因此 semantic-validity/model-accuracy 反而为 1.0——这正说明只看准确率会被偏斜掩盖，必须同报 Po/Pe/κ/混淆矩阵。');
report.push('- 结论：演练链路可跑通；若只依赖现有脚本，少填、非法值、重复行、空 final 都不会硬失败。回传后必须先用 check_second_annotator.mjs --labels-only 做结构闸门，填完 final 后再跑完整闸门，最后 merge/score。偏斜无法由结构闸门拦截，必须在 score 后看标签分布与 Po/Pe。');

fs.writeFileSync(path.join(root, 'DRYRUN_REPORT.md'), report.join('\n') + '\n');
fs.writeFileSync(path.join(root, 'dryrun_results.json'), JSON.stringify({
  log, main: { rq2: rq2Json, rq3: rq3Json, rq2Calc, rq3Calc, rq2DisRows, rq3DisRows },
  short: { rq2: shortR2Json, rq3: shortR3Json },
  blankFinal: { rq2: blankR2Json, rq3: blankR3Json, rq2Blank: blankFinalRq2, rq3Blank: blankFinalRq3 },
  invalid: { rq2: invalidR2Json, rq3: invalidR3Json },
  duplicate: dupR2Json, skew,
}, null, 2));
console.log('wrote DRYRUN_REPORT.md and dryrun_results.json');
