// Shared pieces for the two LLM pre-annotation runs (plan C):
//   - run_annotator1_masked.mjs  (protocol-B blind material)
//   - run_annotator1_condA.mjs   (approximate original-information material)
//
// The system prompt, label rubric, label sets, sampling params and JSON parser
// live here so both conditions use literally the same prompt text. Only the
// material inside `--- BEGIN CASE ---` differs between the two runs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const PROVIDERS = {
  deepseek: {
    model: 'deepseek-v4-flash',
    endpoint: 'https://api.deepseek.com/chat/completions',
    keyEnv: 'DEEPSEEK_API_KEY',
  },
  openai: {
    model: 'gpt-4o-mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    keyEnv: 'OPENAI_API_KEY',
  },
};

export const LABELS = {
  rq2: ['y', 'n'],
  rq3: ['STRUCTURAL_ONLY', 'EXPECTATION_CHANGE', 'SUSPECTED_REGRESSION'],
};

export const TEMPERATURE = 0;
export const MAX_TOKENS = 2000;
// The reasoning model counts reasoning_tokens in completion_tokens.  When it
// exhausts the budget before emitting JSON, finish_reason is "length" and the
// content is empty.  Treat that as "budget too small", not as a call failure,
// and escalate the budget before giving up.
export const BUDGET_LADDER = [MAX_TOKENS, MAX_TOKENS * 2, MAX_TOKENS * 4];
export const RETRIES = 3;

export const SYSTEM_PROMPT = [
  '你是软件测试研究者，正在对一批“变更后的测试用例”做独立预标注。',
  '只依据用户消息中给出的材料判断；不要使用外部知识，也不要猜测材料之外的信息。',
  '理由必须引用材料中的具体证据；材料是否充分、以及保守项如何选取，按各研究问题的判定规则处理。',
].join('\n');

// Neutral wording: the same template is used for both conditions, so it must
// not claim that a specific artifact (app diff / redacted diff) is present.
const TEMPLATES = {
  rq2: [
    '下面是一条真实项目中由变更生成/待复核的 Playwright 用例，以及本次变更的已知信息。',
    '材料以 `--- BEGIN CASE ---` 与 `--- END CASE ---` 之间实际给出的内容为准；不要假设未给出的材料存在。',
    '请判断该用例是否满足：打开应用并实际执行/断言了这次变更引入或改变的 UI 或行为。',
    '',
    '判定规则：',
    '- y：用例打开应用并确实操作或断言了这次变更引入/改变的具体 UI 或行为；即使选择器、文案或断言细节不完全一致，只要能建立与变更的直接关联，也判 y。',
    '- n：仅当无法在材料中建立测试与本次变更的关联时才判 n，例如测试只访问无关页面、只做与变更元素无关的泛泛可访问性检查，或断言对象与变更完全无关。',
    '注意：不要因为用例还包含一些通用检查就判 n；关键看它是否操作/断言了变更直接涉及的元素或行为。',
    '',
    '材料（标注者可见内容的原文）：',
    '--- BEGIN CASE ---',
    '{SECTION}',
    '--- END CASE ---',
    '',
    '只输出一个 JSON 对象，不要代码围栏、不要额外解释：',
    '{"label":"y|n","reason":"不超过 80 字的中文理由，指出材料中的具体证据"}',
  ].join('\n'),
  rq3: [
    '下面是一条真实项目中因 locator 断裂而失效的测试，以及本次失效的已知信息。',
    '材料以 `--- BEGIN CASE ---` 与 `--- END CASE ---` 之间实际给出的内容为准；不要假设未给出的材料存在。',
    '请判断这次失效属于哪种过时类型。',
    '',
    '标签定义：',
    '- STRUCTURAL_ONLY：有证据表明测试意图与断言值/断言目标均未变，只是 locator / DOM 结构 / 文案锚点 / 测试 API 迁移导致旧定位器失效。',
    '- EXPECTATION_CHANGE：断言值、matcher 或断言目标（期望的业务结果）发生了实质变化，旧断言在新版本中不应按原样成立。',
    '- SUSPECTED_REGRESSION：改动可能改变用户可见行为，且材料不足以区分“测试过时”与“真实回归”。',
    '',
    '保守项：当材料无法区分 STRUCTURAL_ONLY 与 EXPECTATION_CHANGE，或无法排除真实回归时，选 SUSPECTED_REGRESSION，并在理由中说明不确定点；不要把 STRUCTURAL_ONLY 当作默认项。仅当定位方式/测试 API 变化明确、且断言值未变时，才判 STRUCTURAL_ONLY。',
    '',
    '材料（标注者可见内容的原文）：',
    '--- BEGIN CASE ---',
    '{SECTION}',
    '--- END CASE ---',
    '',
    '只输出一个 JSON 对象，不要代码围栏、不要额外解释：',
    '{"label":"STRUCTURAL_ONLY|EXPECTATION_CHANGE|SUSPECTED_REGRESSION","reason":"不超过 80 字的中文理由，指出材料中的具体证据"}',
  ].join('\n'),
};

export function buildPrompt(family, section) {
  return TEMPLATES[family].replace('{SECTION}', section);
}

export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- DeepSeek credential loading (no third-party dotenv) ---------------------
// Priority: DEEPSEEK_API_KEY env var -> DEEPSEEK_API_KEY_FILE -> repo-root .env.
// Only DeepSeek is accepted; this module never falls back to another provider.

function cleanValue(raw) {
  let v = String(raw ?? '').trim();
  if (!v) return '';
  const q = v[0];
  if ((q === '"' || q === "'") && v.length >= 2 && v.endsWith(q)) {
    return v.slice(1, -1).trim();
  }
  const hash = v.search(/\s#/);
  if (hash >= 0) v = v.slice(0, hash).trim();
  return v;
}

// Minimal .env line parser: ignores blank lines and comments, accepts
// `KEY=value`, `export KEY=value`, and optional single/double quotes.
export function lookupEnvKey(text, name = 'DEEPSEEK_API_KEY') {
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m || m[1] !== name) continue;
    return { found: true, value: cleanValue(m[2]) };
  }
  return { found: false, value: '' };
}

export function envFileCandidates(rootDir) {
  const candidates = [];
  try {
    const top = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (top) candidates.push(path.join(top, '.env'));
  } catch {
    // no git or not a repo; the explicit candidates below still apply
  }
  candidates.push(path.join(rootDir, '.env'));
  candidates.push(path.join(process.cwd(), '.env'));
  return [...new Set(candidates)];
}

export function loadDeepSeekKey({ rootDir, env = process.env }) {
  const fromEnv = cleanValue(env.DEEPSEEK_API_KEY);
  if (fromEnv) return { ok: true, key: fromEnv, source: 'env:DEEPSEEK_API_KEY' };

  const keyFile = String(env.DEEPSEEK_API_KEY_FILE ?? '').trim();
  if (keyFile) {
    const abs = path.resolve(process.cwd(), keyFile);
    if (!fs.existsSync(abs)) {
      return {
        ok: false,
        code: 'file_not_found',
        message: `读取 DEEPSEEK_API_KEY 失败：DEEPSEEK_API_KEY_FILE 指向的文件不存在：${abs}`,
      };
    }
    const text = fs.readFileSync(abs, 'utf8');
    if (text.trim() === '') {
      return {
        ok: false,
        code: 'file_empty',
        message: `读取 DEEPSEEK_API_KEY 失败：DEEPSEEK_API_KEY_FILE 指向的文件内容为空：${abs}`,
      };
    }
    const byKey = lookupEnvKey(text);
    let value = byKey.found ? byKey.value : '';
    if (!byKey.found) {
      const first = text.split(/\r?\n/).map((l) => l.trim()).find((l) => l && !l.startsWith('#'));
      value = cleanValue(first || '');
    }
    if (!value) {
      return {
        ok: false,
        code: 'file_empty',
        message: `读取 DEEPSEEK_API_KEY 失败：DEEPSEEK_API_KEY_FILE 指向的文件内容为空（未找到非空 key 值）：${abs}`,
      };
    }
    return { ok: true, key: value, source: `file:${abs}` };
  }

  const candidates = envFileCandidates(rootDir);
  const existing = candidates.filter((p) => fs.existsSync(p));
  if (!existing.length) {
    return {
      ok: false,
      code: 'missing',
      message: `读取 DEEPSEEK_API_KEY 失败：环境变量未设置，DEEPSEEK_API_KEY_FILE 未设置，且以下位置没有 .env：${candidates.join(', ')}`,
    };
  }

  let sawEmptyFile = false;
  let sawNoKey = false;
  let sawEmptyValue = false;
  for (const file of existing) {
    const text = fs.readFileSync(file, 'utf8');
    if (text.trim() === '') { sawEmptyFile = true; continue; }
    const found = lookupEnvKey(text);
    if (!found.found) { sawNoKey = true; continue; }
    if (!found.value) { sawEmptyValue = true; continue; }
    return { ok: true, key: found.value, source: `env-file:${file}` };
  }

  if (sawEmptyValue) {
    return {
      ok: false,
      code: 'empty_value',
      message: `读取 DEEPSEEK_API_KEY 失败：.env 中 DEEPSEEK_API_KEY 值为空：${existing.join(', ')}`,
    };
  }
  if (sawNoKey) {
    return {
      ok: false,
      code: 'missing_key',
      message: `读取 DEEPSEEK_API_KEY 失败：.env 存在但未找到 DEEPSEEK_API_KEY：${existing.join(', ')}`,
    };
  }
  return {
    ok: false,
    code: 'empty_file',
    message: `读取 DEEPSEEK_API_KEY 失败：.env 内容为空：${existing.join(', ')}`,
  };
}

export async function callModel({ provider, cfg, apiKey, userPrompt }) {
  let lastError;
  let totalAttempts = 0;
  const budgetsTried = [];

  for (const budget of BUDGET_LADDER) {
    for (let attempt = 1; attempt <= RETRIES; attempt++) {
      totalAttempts++;
      try {
        const res = await fetch(cfg.endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: cfg.model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            temperature: TEMPERATURE,
            max_tokens: budget,
          }),
        });
        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { json = { raw: text }; }
        if (!res.ok || json?.error) {
          throw new Error(`${provider} HTTP ${res.status}: ${json?.error?.message || json?.message || text.slice(0, 200)}`);
        }
        const choice = json.choices?.[0] || {};
        const finish = choice.finish_reason || null;
        const raw = (choice.message?.content || '').trim();
        const usage = json.usage || null;

        // A reasoning model can spend the whole completion budget before
        // emitting JSON; that is a budget problem, not a model refusal.
        if (finish === 'length' && !raw.endsWith('}')) {
          budgetsTried.push({ max_tokens: budget, finish_reason: finish, completion_tokens: usage?.completion_tokens ?? null, ok: false, why: 'budget_exhausted' });
          const e = new Error(`${provider} 推理预算不足（finish_reason=length，max_tokens=${budget}，content=${raw ? '截断' : '空'}）`);
          e.budgetExhausted = true;
          e.finishReason = finish;
          lastError = e;
          break; // escalate to the next budget immediately
        }
        if (!raw) throw new Error(`${provider} 返回空 completion（finish_reason=${finish}）`);
        budgetsTried.push({ max_tokens: budget, finish_reason: finish, completion_tokens: usage?.completion_tokens ?? null, ok: true, why: 'ok' });
        return {
          raw,
          usage,
          attempts: totalAttempts,
          budget_used: budget,
          finish_reason: finish,
          budgets_tried: budgetsTried,
        };
      } catch (e) {
        lastError = e;
        if (!e.budgetExhausted) {
          budgetsTried.push({ max_tokens: budget, finish_reason: e.finishReason || null, completion_tokens: null, ok: false, why: e.message });
        }
        if (attempt < RETRIES) await sleep(1500 * attempt);
      }
    }
  }
  const err = new Error(lastError?.message || `${provider} 调用失败`);
  err.attempts = totalAttempts;
  err.budgetsTried = budgetsTried;
  err.finishReason = lastError?.finishReason || null;
  throw err;
}

export function parseAnswer(raw, allowed) {
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error(`无法从输出中解析 JSON：${cleaned.slice(0, 120)}`);
  let obj;
  try { obj = JSON.parse(cleaned.slice(start, end + 1)); } catch (e) {
    throw new Error(`JSON 解析失败：${e.message}`);
  }
  const label = String(obj.label ?? '').trim();
  const reason = String(obj.reason ?? '').trim();
  if (!allowed.includes(label)) throw new Error(`非法标签 ${JSON.stringify(label)}，允许值：${allowed.join(' / ')}`);
  if (!reason) throw new Error('缺少 reason');
  return { label, reason };
}

// Case sections are delimited by `## rq2_xxx` / `## rbxxx` headings.
export function parseSections(file, family, fail) {
  if (!fs.existsSync(file)) fail(`缺少标注材料：${file}`);
  const text = fs.readFileSync(file, 'utf8');
  const re = /^## (rq2_\d{3}|rb\d{3})\b[^\n]*$/gm;
  const heads = [...text.matchAll(re)];
  const rows = [];
  for (let i = 0; i < heads.length; i++) {
    const start = heads[i].index;
    const end = i + 1 < heads.length ? heads[i + 1].index : text.length;
    let section = text.slice(start, end).trimEnd();
    section = section.replace(/^\s*判定：.*$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
    const caseId = heads[i][1];
    const expected = family === 'rq2' ? /^rq2_\d{3}$/ : /^rb\d{3}$/;
    if (!expected.test(caseId)) continue;
    rows.push({ case_id: caseId, section });
  }
  return { file, text, rows };
}
