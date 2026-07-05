// Estimate LLM token and dollar cost for already-run RQ2/RQ3/ReproBreak arms.
//
// Usage:
//   node experiments/run_llm_cost.mjs
//
// This is an estimate because the previous experiment runs did not persist API
// usage fields. Future provider calls should capture exact usage from responses.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readJsonl, summarizeLlmCost, writeLlmCost } from './llm_cost.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'out');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

function main() {
  const summary = summarizeLlmCost({
    rq2: readJson(path.join(out, 'rq2_results.json')),
    rq2Annotate: readJsonl(path.join(out, 'rq2_to_annotate.jsonl')),
    rq3: readJson(path.join(out, 'rq3_results.json')),
    reprobreak: readJson(path.join(here, '..', 'realproj', 'results', 'reprobreak_e2e.json')),
  });
  const written = writeLlmCost(summary, out);
  console.log(`LLM cost estimate: calls=${summary.total.calls} input=${summary.total.input_tokens_est} output=${summary.total.output_tokens_est} usd=$${summary.total.estimated_usd.toFixed(6)}`);
  console.log(`  wrote ${path.relative(process.cwd(), written.json)} and ${path.relative(process.cwd(), written.md)}`);
}

main();

