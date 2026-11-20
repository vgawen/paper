// Plan C: redo the LLM pre-annotation under the aligned information condition.
//
// Input is ONLY the annotator-visible content of the two blind packet files:
//   out/annotation_packet/rq2_worksheet.md
//   out/annotation_packet/rq3_context.md
// The script refuses to run if those sections contain forbidden material
// (`new_locator`, `arm`, `annotator1`, metrics/score). It never reads the main
// annotation tables or the original first column.
//
//   MASKED_PROVIDER=deepseek DEEPSEEK_API_KEY=... node run_annotator1_masked.mjs
//
// Outputs (never overwrites the original first column):
//   out/annotator1_masked.json           per-case prompt, prompt hash, raw output, label/reason
//   out/annotator1_masked_manifest.json  params, input hashes, run status, failures
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROVIDERS, LABELS, TEMPERATURE, MAX_TOKENS, BUDGET_LADDER, RETRIES, SYSTEM_PROMPT,
  buildPrompt, callModel, parseAnswer, parseSections, sha256, loadDeepSeekKey,
} from './annotator1_shared.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const packetDir = path.join(root, 'experiments', 'out', 'annotation_packet');
const outDir = path.join(root, 'experiments', 'out');

const RQ2_FILE = path.join(packetDir, 'rq2_worksheet.md');
const RQ3_FILE = path.join(packetDir, 'rq3_context.md');
const OUT_RESULTS = path.join(outDir, 'annotator1_masked.json');
const OUT_MANIFEST = path.join(outDir, 'annotator1_masked_manifest.json');

const REQUESTED_PROVIDER = (process.env.MASKED_PROVIDER || 'deepseek').toLowerCase();
if (REQUESTED_PROVIDER !== 'deepseek') {
  fail(`本任务只允许 DeepSeek；检测到 MASKED_PROVIDER=${REQUESTED_PROVIDER}，已中止。`);
}
const PROVIDER = 'deepseek';

const RQ2_ALLOWED = LABELS.rq2;
const RQ3_ALLOWED = LABELS.rq3;

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exit(1);
}

const cfg = PROVIDERS[PROVIDER];
let apiKey;
let keySource;
const DRY_PARSE = process.argv.includes('--dry-parse');

// Guard: the model input must never carry the answer or experiment metadata.
function assertNoForbidden(section, caseId) {
  const checks = [
    ['new_locator 字符串', /new_locator/i],
    ['第一列/预标注标识', /annotator1/i],
    ['arm 字段', /"arm"\s*:|\barm\s*[:=]|\bnodiff\b/i],
    ['自动指标/score', /自动指标|automatic\s+(?:semantic|metric)|semantic_valid|executable[-_ ]rate|change[-_ ]relevant|mutation\s+kill/i],
  ];
  for (const [name, re] of checks) {
    if (re.test(section)) fail(`${caseId} 的可见材料中出现禁用内容（${name}），已中止；请先清洗材料。`);
  }
}

async function runFamily(family, parsed, allowed) {
  const rows = {};
  let failures = 0;
  for (const { case_id: caseId, section } of parsed.rows) {
    assertNoForbidden(section, caseId);
    const prompt = buildPrompt(family, section);
    const promptSha = sha256(prompt);
    console.log(`[${family}] ${caseId} prompt_sha=${promptSha.slice(0, 12)}`);
    try {
      const { raw, usage, attempts, budget_used, finish_reason, budgets_tried } = await callModel({ provider: PROVIDER, cfg, apiKey, userPrompt: prompt });
      const { label, reason } = parseAnswer(raw, allowed);
      rows[caseId] = {
        case_id: caseId,
        status: 'ok',
        label,
        reason,
        prompt,
        prompt_sha256: promptSha,
        params: { provider: PROVIDER, model: cfg.model, temperature: TEMPERATURE, max_tokens: MAX_TOKENS },
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
        prompt,
        prompt_sha256: promptSha,
        params: { provider: PROVIDER, model: cfg.model, temperature: TEMPERATURE, max_tokens: MAX_TOKENS },
        raw_output: null,
        error: e.message,
        attempts: e.attempts ?? null,
        budgets_tried: e.budgetsTried ?? null,
        finish_reason: e.finishReason ?? null,
      };
      console.error(`[${family}] ${caseId} FAILED: ${e.message}`);
    }
  }
  return { rows, failures };
}

const startedAt = new Date().toISOString();
const rq2Parsed = parseSections(RQ2_FILE, 'rq2', fail);
const rq3Parsed = parseSections(RQ3_FILE, 'rq3', fail);
if (rq2Parsed.rows.length !== 30) fail(`RQ2 解析到 ${rq2Parsed.rows.length} 条，预期 30。`);
if (rq3Parsed.rows.length !== 40) fail(`RQ3 解析到 ${rq3Parsed.rows.length} 条，预期 40。`);

if (DRY_PARSE) {
  for (const { case_id: caseId, section } of [...rq2Parsed.rows, ...rq3Parsed.rows]) assertNoForbidden(section, caseId);
  console.log(`dry parse OK: rq2=${rq2Parsed.rows.length} rq3=${rq3Parsed.rows.length}；材料已通过禁用内容检查，未调用模型。`);
  process.exit(0);
}

const keyInfo = loadDeepSeekKey({ rootDir: root });
if (!keyInfo.ok) {
  fail(`${keyInfo.message} 本脚本不会静默退回其他 provider，也不会用本地规则或写死标签冒充 LLM 输出。`);
}
apiKey = keyInfo.key;
keySource = keyInfo.source;

const rq2 = await runFamily('rq2', rq2Parsed, RQ2_ALLOWED);
const rq3 = await runFamily('rq3', rq3Parsed, RQ3_ALLOWED);
const finishedAt = new Date().toISOString();

function failureList(family, rows) {
  return Object.values(rows).filter((r) => r.status !== 'ok').map((r) => ({
    case_id: r.case_id,
    family,
    error: r.error || null,
    attempts: r.attempts ?? null,
    finish_reason: r.finish_reason ?? null,
    budgets_tried: r.budgets_tried ?? null,
  }));
}
const failuresList = [...failureList('rq2', rq2.rows), ...failureList('rq3', rq3.rows)];

const results = {
  schema: 'annotator1_masked/v1',
  condition: 'aligned_information',
  note: '只使用盲评材料中标注者可见的内容重做 LLM 预标注；不覆盖原第一列。',
  provider: PROVIDER,
  model: cfg.model,
  temperature: TEMPERATURE,
  max_tokens: MAX_TOKENS,
  budget_ladder: BUDGET_LADDER,
  key_source: keySource,
  input_files: [
    { path: path.relative(root, RQ2_FILE), sha256: sha256(rq2Parsed.text) },
    { path: path.relative(root, RQ3_FILE), sha256: sha256(rq3Parsed.text) },
  ],
  failures_list: failuresList,
  rq2: { n: rq2Parsed.rows.length, failures: rq2.failures, rows: rq2.rows },
  rq3: { n: rq3Parsed.rows.length, failures: rq3.failures, rows: rq3.rows },
};

const manifest = {
  schema: 'annotator1_masked_manifest/v1',
  status: rq2.failures || rq3.failures ? 'partial_or_failed' : 'ok',
  provider: PROVIDER,
  model: cfg.model,
  endpoint: cfg.endpoint,
  system_prompt: SYSTEM_PROMPT,
  temperature: TEMPERATURE,
  max_tokens: MAX_TOKENS,
  budget_ladder: BUDGET_LADDER,
  retries: RETRIES,
  key_source: keySource,
  started_at: startedAt,
  finished_at: finishedAt,
  failures_list: failuresList,
  rq2: { n: rq2Parsed.rows.length, failures: rq2.failures },
  rq3: { n: rq3Parsed.rows.length, failures: rq3.failures },
  input_files: results.input_files,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(OUT_RESULTS, JSON.stringify(results, null, 2) + '\n');
fs.writeFileSync(OUT_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nwrote ${path.relative(root, OUT_RESULTS)}`);
console.log(`wrote ${path.relative(root, OUT_MANIFEST)}`);
console.log(`rq2 ok=${rq2Parsed.rows.length - rq2.failures}/${rq2Parsed.rows.length} rq3 ok=${rq3Parsed.rows.length - rq3.failures}/${rq3Parsed.rows.length}`);
if (rq2.failures || rq3.failures) process.exitCode = 2;
