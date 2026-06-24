// Side-effect / indirect-dependency LIVE experiment (SAFETY.md §5, 评审意见 #2).
//
// Scenario (self-contained fixture subject/sideeffect):
//   - PRODUCER test A visits /promo, which POSTs to shared backend state
//     (api:/api/visits). cov(A) = {src/promo.js}; it does NOT touch the
//     diff-related consumer.
//   - CONSUMER test B visits /dashboard (the diff target, Δ={src/dashboard.js}),
//     GETs the shared count and asserts it equals 1 — true ONLY if A ran first.
//
// Hazard: given a diff to dashboard.js, naive file-level coverage selects {B}
// but DROPS A. Running {B} alone hits a fresh backend (visits=0) -> B's verdict
// FLIPS vs the full suite. The state-dependency closure (statedep.mjs) pulls A
// back in because A writes the resource B reads, restoring fidelity.
//
// We MEASURE this live: B's verdict in (full) vs (naive subset) vs (closed
// subset). naive should be UNFAITHFUL (verdict flips); closed FAITHFUL.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseFailed } from './lib.mjs';
import { selectByCoverage } from '../pipeline/src/selector.mjs';
import { buildStateGraph, closeSelection } from '../pipeline/src/statedep.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(here, '..', 'subject', 'sideeffect');
const OUT = path.join(here, 'out');
const DELTA = ['src/dashboard.js']; // the diff-related changed file (given)

function runIn(specPathsArr, covRel) {
  const covAbs = path.join(FIX, covRel);
  fs.rmSync(covAbs, { recursive: true, force: true });
  const specs = specPathsArr.join(' ');
  try {
    execSync(`COV_OUT=${covRel} PW_JSON=pw-report.json npx playwright test ${specs}`, { cwd: FIX, stdio: 'pipe' });
  } catch { /* non-zero when B fails (the whole point) */ }
  return { covAbs, report: path.join(FIX, 'pw-report.json') };
}

function loadRich(covAbs) {
  const map = {};
  if (!fs.existsSync(covAbs)) return map;
  for (const f of fs.readdirSync(covAbs)) {
    if (!f.endsWith('.json')) continue;
    const o = JSON.parse(fs.readFileSync(path.join(covAbs, f), 'utf8'));
    map[o.test] = { files: o.files || [], reads: o.reads || [], writes: o.writes || [] };
  }
  return map;
}

const specOf = (id) => `tests/${id.split(' > ')[0]}`;
const verdict = (id, failedSet) => (failedSet.has(id) ? 'fail' : 'pass');

function main() {
  fs.mkdirSync(OUT, { recursive: true });

  // 1) FULL suite: establishes the reference verdicts + coverage + footprints.
  const full = runIn([], 'cov/full');
  const cov = loadRich(full.covAbs);
  const failedFull = parseFailed(full.report);
  const ids = Object.keys(cov);
  const Bid = ids.find((i) => /dashboard/i.test(i));
  const Aid = ids.find((i) => /promo/i.test(i));
  if (!Bid || !Aid) { console.error('fixture ids not found', ids); process.exit(1); }

  // 2) Selection inputs derived from the LIVE run.
  const filesMap = Object.fromEntries(ids.map((i) => [i, cov[i].files]));
  const footprints = Object.fromEntries(ids.map((i) => [i, { reads: cov[i].reads, writes: cov[i].writes }]));

  // naive: coverage-only selection on Δ (the diff-related file)
  const selCov = selectByCoverage(filesMap, DELTA);
  // closed: extend over the shared-state dependency graph
  const graph = buildStateGraph(footprints);
  const selClosed = closeSelection(selCov, graph);

  // 3) Re-run each selected subset in isolation (fresh backend each time).
  const naive = runIn([...new Set(selCov.map(specOf))], 'cov/naive');
  const failedNaive = parseFailed(naive.report);
  const closed = runIn([...new Set(selClosed.map(specOf))], 'cov/closed');
  const failedClosed = parseFailed(closed.report);

  // 4) Fidelity of each subset vs the full suite, for the affected consumer B.
  const B_full = verdict(Bid, failedFull);
  const B_naive = verdict(Bid, failedNaive);
  const B_closed = verdict(Bid, failedClosed);

  const res = {
    fixture: 'subject/sideeffect',
    delta: DELTA,
    producer: Aid, consumer: Bid,
    shared_resource: 'api:/api/visits',
    dependency_edge: `${Aid}  ⤳  ${Bid}  (A writes, B reads)`,
    selection: {
      coverage_only: selCov,         // misses the producer A
      state_closed: selClosed,       // pulls A back in
      coverage_only_includes_producer: selCov.includes(Aid),
      state_closed_includes_producer: selClosed.includes(Aid),
    },
    consumer_verdict: { full: B_full, naive_subset: B_naive, closed_subset: B_closed },
    fidelity: {
      naive_faithful: B_naive === B_full,   // expected FALSE (verdict flips)
      closed_faithful: B_closed === B_full, // expected TRUE
    },
    conclusion: (B_naive !== B_full && B_closed === B_full)
      ? 'Naive coverage RTS is UNSAFE under shared-state side effects (consumer verdict flips when the producer is dropped); the state-dependency closure restores fidelity.'
      : 'Inconclusive — check fixture/backend isolation.',
  };
  fs.writeFileSync(path.join(OUT, 'sideeffect.json'), JSON.stringify(res, null, 2));

  console.log(`Δ=${JSON.stringify(DELTA)}`);
  console.log(`coverage_only selects: ${JSON.stringify(selCov)}  (includes producer? ${res.selection.coverage_only_includes_producer})`);
  console.log(`state_closed   selects: ${JSON.stringify(selClosed)}  (includes producer? ${res.selection.state_closed_includes_producer})`);
  console.log(`consumer B verdict — full=${B_full}  naive_subset=${B_naive}  closed_subset=${B_closed}`);
  console.log(`fidelity — naive_faithful=${res.fidelity.naive_faithful}  closed_faithful=${res.fidelity.closed_faithful}`);
  console.log(`\n${res.conclusion}`);
}
main();
