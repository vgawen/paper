// Repeat-run harness for the two pre-annotation conditions.
//
// Same materials, same prompt template, same model/params as the canonical runs;
// this only re-samples to quantify run-to-run variance. It never overwrites the
// canonical result files:
//   out/annotator1_masked.json  / out/annotator1_condA.json
// Repeats land in out/repeats/<condition>_run<N>.json with per-case usage and
// raw output preserved.
//
//   node run_annotator1_repeat.mjs --condition=masked --run=2
//   node run_annotator1_repeat.mjs --condition=condA  --run=2
//
// Guard rails: the material hash and every per-case prompt hash must equal the
// canonical run's, otherwise the harness aborts instead of comparing apples to
// oranges.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROVIDERS, LABELS, TEMPERATURE, MAX_TOKENS, BUDGET_LADDER, RETRIES, SYSTEM_PROMPT,
  buildPrompt, callModel, parseAnswer, parseSections, sha256, loadDeepSeekKey,
} from './annotator1_shared.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const outDir = path.join(root, 'experiments', 'out');
const repeatDir = path.join(outDir, 'repeats');

const CONDITIONS = {
  masked: {
    file: path.join(outDir, 'annotation_packet', 'rq3_context.md'),
    rq2File: path.join(outDir, 'annotation_packet', 'rq2_worksheet.md'),
    canonical: path.join(outDir, 'annotator1_masked.json'),
    label: 'aligned_information',
  },
  condA: {
    file: path.join(outDir, 'condA_material', 'rq3_condA.md'),
    rq2File: path.join(outDir, 'condA_material', 'rq2_condA.md'),
    canonical: path.join(outDir, 'annotator1_condA.json'),
    label: 'approx_original_information',
  },
};

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

function argValue(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
}

const condition = argValue('condition');
if (!condition || !CONDITIONS[condition]) fail(`--condition 必须是 ${Object.keys(CONDITIONS).join(' / ')}`);
const cfgName = CONDITIONS[condition];
if (!fs.existsSync(cfgName.canonical)) fail(`缺少正式结果 ${cfgName.canonical}，无法校验同材料/同 prompt。`);
const canonical = JSON.parse(fs.readFileSync(cfgName.canonical, 'utf8'));

const runArg = argValue('run');
if (!runArg || !/^\d+$/.test(runArg)) fail('需要 --run=N（整数），例如 --run=2。');
const runIndex = Number(runArg);
const OUT_RESULTS = path.join(repeatDir, `${condition}_run${runIndex}.json`);
if (fs.existsSync(OUT_RESULTS) && !process.argv.includes('--overwrite')) {
  fail(`${OUT_RESULTS} 已存在；如需覆盖请显式加 --overwrite。`);
}

const PROVIDER = 'deepseek';
const cfg = PROVIDERS[PROVIDER];
const DRY_PARSE = process.argv.includes('--dry-parse');

const rq2Parsed = parseSections(cfgName.rq2File, 'rq2', fail);
const rq3Parsed = parseSections(cfgName.file, 'rq3', fail);
if (rq2Parsed.rows.length !== 30) fail(`RQ2 解析到 ${rq2Parsed.rows.length} 条，预期 30。`);
if (rq3Parsed.rows.length !== 40) fail(`RQ3 解析到 ${rq3Parsed.rows.length} 条，预期 40。`);

// Material identity: hashes must match the canonical run exactly.
const materialHashes = [
  { path: path.relative(root, cfgName.rq2File), sha256: sha256(rq2Parsed.text) },
  { path: path.relative(root, cfgName.file), sha256: sha256(rq3Parsed.text) },
];
const canonicalHashes = (canonical.input_files || []).map((f) => ({ path: f.path, sha256: f.sha256 }));
if (JSON.stringify(materialHashes) !== JSON.stringify(canonicalHashes)) {
  fail(`材料哈希与正式结果不一致，已中止。\n本次=${JSON.stringify(materialHashes)}\n正式=${JSON.stringify(canonicalHashes)}`);
}

// Prompt identity: every per-case prompt hash must match the canonical run.
for (const [family, parsed] of [['rq2', rq2Parsed], ['rq3', rq3Parsed]]) {
  const canonRows = canonical[family].rows;
  for (const { case_id: caseId, section } of parsed.rows) {
    const prompt = buildPrompt(family, section);
    const canon = canonRows[caseId];
    if (!canon) fail(`${family}/${caseId} 在正式结果中不存在。`);
    if (canon.prompt_sha256 !== sha256(prompt)) fail(`${family}/${caseId} 的 prompt 哈希与正式结果不一致，已中止。`);
  }
}

if (DRY_PARSE) {
  console.log(`dry parse OK: condition=${condition} run=${runIndex} rq2=${rq2Parsed.rows.length} rq3=${rq3Parsed.rows.length}；材料与逐条 prompt 哈希均与正式结果一致，未调用模型。`);
  process.exit(0);
}

const keyInfo = loadDeepSeekKey({ rootDir: root });
if (!keyInfo.ok) fail(`${keyInfo.message} 本脚本不会静默退回其他 provider。`);

async function runFamily(family, parsed, allowed) {
  const rows = {};
  let failures = 0;
  for (const { case_id: caseId, section } of parsed.rows) {
    const prompt = buildPrompt(family, section);
    const promptSha = sha256(prompt);
    console.log(`[${condition} run${runIndex}] ${family} ${caseId} prompt_sha=${promptSha.slice(0, 12)}`);
    try {
      const { raw, usage, attempts, budget_used, finish_reason, budgets_tried } = await callModel({ provider: PROVIDER, cfg, apiKey: keyInfo.key, userPrompt: prompt });
      const { label, reason } = parseAnswer(raw, allowed);
      rows[caseId] = {
        case_id: caseId,
        status: 'ok',
        label,
        reason,
        prompt_sha256: promptSha,
        prompt_length: prompt.length,
        material_length: section.length,
        raw_output: raw,
        usage,
        attempts,
        budget_used,
        finish_reason,
        budgets_tried,
      };
    } catch (e) {
      failures++;
      rows[caseId] = {
        case_id: caseId,
        status: 'failed',
        label: null,
        reason: null,
        prompt_sha256: promptSha,
        prompt_length: prompt.length,
        material_length: section.length,
        raw_output: null,
        error: e.message,
        attempts: e.attempts ?? null,
        budgets_tried: e.budgetsTried ?? null,
        finish_reason: e.finishReason ?? null,
      };
      console.error(`[${condition} run${runIndex}] ${family} ${caseId} FAILED: ${e.message}`);
    }
  }
  return { rows, failures };
}

const startedAt = new Date().toISOString();
const rq2 = await runFamily('rq2', rq2Parsed, LABELS.rq2);
const rq3 = await runFamily('rq3', rq3Parsed, LABELS.rq3);
const finishedAt = new Date().toISOString();

const failuresList = [];
for (const [family, fam] of [['rq2', rq2], ['rq3', rq3]]) {
  for (const r of Object.values(fam.rows)) {
    if (r.status !== 'ok') {
      failuresList.push({
        case_id: r.case_id, family, error: r.error || null, attempts: r.attempts ?? null,
        finish_reason: r.finish_reason ?? null, budgets_tried: r.budgets_tried ?? null,
      });
    }
  }
}

const results = {
  schema: 'annotator1_repeat/v1',
  condition: cfgName.label,
  repeat_of: path.relative(root, cfgName.canonical),
  run_index: runIndex,
  note: '同材料、同 prompt、同模型与参数，仅重复采样以量化运行波动；不覆盖正式结果。',
  provider: PROVIDER,
  model: cfg.model,
  temperature: TEMPERATURE,
  max_tokens: MAX_TOKENS,
  budget_ladder: BUDGET_LADDER,
  retries: RETRIES,
  system_prompt_sha256: sha256(SYSTEM_PROMPT),
  key_source: keyInfo.source,
  started_at: startedAt,
  finished_at: finishedAt,
  input_files: materialHashes,
  failures_list: failuresList,
  rq2: { n: rq2Parsed.rows.length, failures: rq2.failures, rows: rq2.rows },
  rq3: { n: rq3Parsed.rows.length, failures: rq3.failures, rows: rq3.rows },
};

fs.mkdirSync(repeatDir, { recursive: true });
fs.writeFileSync(OUT_RESULTS, JSON.stringify(results, null, 2) + '\n');
console.log(`\nwrote ${path.relative(root, OUT_RESULTS)}`);
console.log(`rq2 ok=${rq2Parsed.rows.length - rq2.failures}/${rq2Parsed.rows.length} rq3 ok=${rq3Parsed.rows.length - rq3.failures}/${rq3Parsed.rows.length}`);
if (failuresList.length) process.exitCode = 2;
