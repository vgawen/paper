// RQ4 multi-transition summary.
//
// Usage:
//   node experiments/run_rq4_batch.mjs <rq1.jsonl> <rq4-cost.json> [method]
//
// This script intentionally labels the result as batch-estimated: it combines
// RQ1 transition selections with an already measured RQ4 cost profile. It does
// not claim that every transition was re-run wall-clock unless such per-row
// measurements are later supplied.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readJsonl, summarizeBatch, writeBatchSummary } from './rq4_batch.mjs';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, 'out', 'real');

function main() {
  const rq1File = process.argv[2];
  const costFile = process.argv[3];
  const method = process.argv[4] || 'dual';
  if (!rq1File || !costFile) {
    console.error('usage: run_rq4_batch.mjs <rq1.jsonl> <rq4-cost.json> [method]');
    process.exit(1);
  }

  const rows = readJsonl(rq1File);
  const costProfile = JSON.parse(fs.readFileSync(costFile, 'utf8'));
  const summary = summarizeBatch(rows, costProfile, { method });
  const written = writeBatchSummary(summary, outDir);

  console.log(`RQ4 batch ${summary.project}: transitions=${summary.transitions} empty=${summary.buckets.empty} partial=${summary.buckets.partial} full=${summary.buckets.full}`);
  console.log(`  mean NetSaving=${(summary.meanNetSaving * 100).toFixed(1)}% median NetSaving=${(summary.medianNetSaving * 100).toFixed(1)}% break_even=${(summary.breakEvenRate * 100).toFixed(1)}%`);
  console.log(`  wrote ${path.relative(process.cwd(), written.json)} and ${path.relative(process.cwd(), written.md)}`);
  if (summary.caveats.length) {
    for (const c of summary.caveats) console.log(`  caveat: ${c}`);
  }
}

main();

