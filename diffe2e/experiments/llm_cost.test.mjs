import assert from 'node:assert/strict';
import test from 'node:test';

import { estimateTokens, estimateCostUsd, summarizeLlmCost } from './llm_cost.mjs';

test('estimateTokens uses a deterministic chars-per-token heuristic', () => {
  assert.equal(estimateTokens('abcd'), 1);
  assert.equal(estimateTokens('abcde'), 2);
  assert.equal(estimateTokens(''), 0);
});

test('estimateCostUsd prices input and output tokens per million', () => {
  assert.equal(estimateCostUsd({
    inputTokens: 1_000_000,
    outputTokens: 500_000,
    inputUsdPerMTok: 0.14,
    outputUsdPerMTok: 0.28,
  }), 0.28);
});

test('summarizeLlmCost aggregates RQ2, RQ3, and ReproBreak LLM calls', () => {
  const summary = summarizeLlmCost({
    rq2: { provider: 'deepseek', summary: { diff: { n: 3 }, nodiff: { n: 3 } } },
    rq2Annotate: [{ spec: 'abcd' }, { spec: 'abcdefgh' }],
    rq3: { provider: 'deepseek', llm_n: 4 },
    reprobreak: { provider: 'deepseek', arms: { llm: { n: 10 } } },
  }, {
    assumedInputTokens: { rq2: 100, rq3: 200, reprobreak: 300 },
    assumedOutputTokens: { rq3: 50, reprobreak: 10 },
  });

  assert.equal(summary.provider, 'deepseek');
  assert.equal(summary.total.calls, 20);
  assert.equal(summary.by_experiment.rq2.calls, 6);
  assert.equal(summary.by_experiment.rq3_controlled.calls, 4);
  assert.equal(summary.by_experiment.reprobreak_e2e.calls, 10);
  assert.ok(summary.total.estimated_usd > 0);
});

