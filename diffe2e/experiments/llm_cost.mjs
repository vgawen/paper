import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_DEEPSEEK_V4_FLASH_PRICING = {
  inputUsdPerMTok: 0.14,
  outputUsdPerMTok: 0.28,
  source: 'DeepSeek API pricing page, deepseek-v4-flash cache-miss input and output prices, checked 2026-07-05.',
};

const round = (x, d = 6) => Number.isFinite(x) ? +x.toFixed(d) : 0;

export function estimateTokens(text, charsPerToken = 4) {
  const s = String(text || '');
  return s.length ? Math.ceil(s.length / charsPerToken) : 0;
}

export function estimateCostUsd({ inputTokens, outputTokens, inputUsdPerMTok, outputUsdPerMTok }) {
  return round((inputTokens / 1_000_000) * inputUsdPerMTok + (outputTokens / 1_000_000) * outputUsdPerMTok);
}

function experimentCost({ calls, inputTokens, outputTokens, pricing, basis }) {
  return {
    calls,
    input_tokens_est: inputTokens,
    output_tokens_est: outputTokens,
    estimated_usd: estimateCostUsd({ inputTokens, outputTokens, ...pricing }),
    basis,
  };
}

export function summarizeLlmCost(inputs, options = {}) {
  const pricing = options.pricing || DEFAULT_DEEPSEEK_V4_FLASH_PRICING;
  const assumedInputTokens = options.assumedInputTokens || {};
  const assumedOutputTokens = options.assumedOutputTokens || {};

  const rq2Calls = (inputs.rq2?.summary?.diff?.n || 0) + (inputs.rq2?.summary?.nodiff?.n || 0);
  const rq2Output = (inputs.rq2Annotate || []).reduce((sum, r) => sum + estimateTokens(r.spec), 0);
  const rq2 = experimentCost({
    calls: rq2Calls,
    inputTokens: rq2Calls * (assumedInputTokens.rq2 ?? 900),
    outputTokens: rq2Output,
    pricing,
    basis: 'RQ2 has one LLM call per generated spec; output tokens estimated from rq2_to_annotate specs, input tokens from prompt-size assumption.',
  });

  const rq3Calls = inputs.rq3?.llm_n || 0;
  const rq3 = experimentCost({
    calls: rq3Calls,
    inputTokens: rq3Calls * (assumedInputTokens.rq3 ?? 1800),
    outputTokens: rq3Calls * (assumedOutputTokens.rq3 ?? 450),
    pricing,
    basis: 'RQ3 controlled repair stores call count but not completions; input/output tokens use prompt/template-size assumptions.',
  });

  const rbCalls = inputs.reprobreak?.arms?.llm?.n || 0;
  const reprobreak = experimentCost({
    calls: rbCalls,
    inputTokens: rbCalls * (assumedInputTokens.reprobreak ?? 1800),
    outputTokens: rbCalls * (assumedOutputTokens.reprobreak ?? 40),
    pricing,
    basis: 'ReproBreak LLM arm asks for one corrected locator string per case; call count is exact, tokens are estimated because API usage was not captured.',
  });

  const byExperiment = { rq2, rq3_controlled: rq3, reprobreak_e2e: reprobreak };
  const total = Object.values(byExperiment).reduce((acc, r) => ({
    calls: acc.calls + r.calls,
    input_tokens_est: acc.input_tokens_est + r.input_tokens_est,
    output_tokens_est: acc.output_tokens_est + r.output_tokens_est,
    estimated_usd: round(acc.estimated_usd + r.estimated_usd),
  }), { calls: 0, input_tokens_est: 0, output_tokens_est: 0, estimated_usd: 0 });

  return {
    provider: inputs.rq2?.provider || inputs.rq3?.provider || inputs.reprobreak?.provider || 'unknown',
    model: 'deepseek-v4-flash',
    pricing,
    caveat: 'Estimated from call counts and prompt/output-size assumptions because prior experiment outputs did not persist provider usage fields. Future runs should capture API usage directly.',
    by_experiment: byExperiment,
    total,
  };
}

export function renderCostMarkdown(summary) {
  const usd = (x) => `$${(x ?? 0).toFixed(6)}`;
  const lines = [];
  lines.push('# LLM Token / Cost Estimate', '');
  lines.push(`- provider: ${summary.provider}`);
  lines.push(`- model/pricing basis: ${summary.model}`);
  lines.push(`- caveat: ${summary.caveat}`);
  lines.push(`- pricing source: ${summary.pricing.source}`, '');
  lines.push('| Experiment | calls | input tokens est. | output tokens est. | estimated USD | Basis |');
  lines.push('|---|---:|---:|---:|---:|---|');
  for (const [name, r] of Object.entries(summary.by_experiment)) {
    lines.push(`| ${name} | ${r.calls} | ${r.input_tokens_est} | ${r.output_tokens_est} | ${usd(r.estimated_usd)} | ${r.basis} |`);
  }
  lines.push(`| **total** | **${summary.total.calls}** | **${summary.total.input_tokens_est}** | **${summary.total.output_tokens_est}** | **${usd(summary.total.estimated_usd)}** | estimated, not provider-billed usage |`);
  return `${lines.join('\n')}\n`;
}

export function readJsonl(file) {
  const text = fs.readFileSync(file, 'utf8').trim();
  return text ? text.split('\n').map((line) => JSON.parse(line)) : [];
}

export function writeLlmCost(summary, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const json = path.join(outDir, 'llm_cost.json');
  const md = path.join(outDir, 'llm_cost.md');
  fs.writeFileSync(json, JSON.stringify(summary, null, 2));
  fs.writeFileSync(md, renderCostMarkdown(summary));
  return { json, md };
}

