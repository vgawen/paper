// Safety / recall stress test via controlled mutation (SAFETY.md §4.1).
//
// Natural diffs may yield a small observed-affected set, giving weak statistical
// power for the recall claim. Here we ACTIVELY inject a small, controlled
// semantic mutation into a single app-source file F (the known Δ = {F}), then
// verify the coverage arm SelCov still contains EVERY test whose observed
// outcome changed because of the mutation:  A_obs^mut ⊆ SelCov(Δ={F}).
//
// This is non-circular: A_obs^mut is measured from real pass/fail/outcome diff
// before vs after the mutation, NOT from coverage.
//
// Protocol per file F:
//   1. baseline: full suite at current checkout -> covBase, failedBase
//   2. mutate F (flip a user-visible string literal), full suite -> covMut, failedMut
//   3. A_obs^mut = outcome diff(base, mut)
//   4. SelCov = tests whose baseline coverage touched F
//   5. SafetyEmp(SelCov, A_obs^mut) must be 1.0; misses are recorded
//   6. restore F from git (no commit)
import fs from 'node:fs';
import path from 'node:path';
import { WORK, OUT, runSuite, loadCov, parseFailed, git, ensureOut } from './lib.mjs';
import { selectByCoverage } from '../pipeline/src/selector.mjs';
import { buildAffectedByOutcome, safetyEmp } from '../pipeline/src/outcome_oracle.mjs';

const SRC_DIR = path.join(WORK, 'app', 'public', 'src');
const COV_NS = (basename) => `src/${basename}`; // coverage namespace for a src file

function outcomeMap(cov, failedSet) {
  const m = {};
  for (const id of Object.keys(cov)) m[id] = failedSet.has(id) ? 'fail' : 'pass';
  return m;
}

// Mutate a user-VISIBLE text so that any test asserting it observes a different
// outcome. We target tag text `>Your Cart<` first (what E2E tests assert via
// toHaveText/getByText), then fall back to quoted UI-text literals. Kebab-case
// identifiers (data-testid values etc.) are excluded so we hit rendered text,
// not selectors. Returns { mutated, before, token } .
function mutateFile(absFile) {
  const before = fs.readFileSync(absFile, 'utf8');
  // 1) visible tag text: >Some Visible Text< (prefer phrases with a space)
  const tagText = [...before.matchAll(/>([A-Za-z][A-Za-z .!?]{2,40})</g)].map((m) => m[1]);
  // 2) quoted UI-text literals without hyphens (avoid kebab testids)
  const quoted = [...before.matchAll(/(['"`])([A-Za-z][A-Za-z .!?]{2,40})\1/g)].map((m) => m[2]);
  const candidates = [...tagText, ...quoted];
  // prefer a phrase containing a space (clearly visible copy), else the longest.
  const withSpace = candidates.filter((c) => c.includes(' ') && !c.includes('MUT'));
  const pool = withSpace.length ? withSpace : candidates.filter((c) => !c.includes('MUT'));
  if (!pool.length) return { mutated: false };
  const token = pool.sort((a, b) => b.length - a.length)[0];
  // replace the first textual occurrence of the chosen token.
  const replaced = before.replace(token, `${token} MUT`);
  if (replaced === before) return { mutated: false };
  fs.writeFileSync(absFile, replaced);
  return { mutated: true, before, token };
}

function restoreFile(relFromWork) {
  try { git(`checkout -- ${relFromWork}`); } catch { /* */ }
}

function main() {
  ensureOut();
  const maxFiles = parseInt(process.argv[2] || '4', 10);
  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.js')).slice(0, maxFiles);

  // baseline once (shared across mutations since each mutation is restored)
  const base = runSuite('cov/mut/base');
  const covBase = loadCov(base.covDir);
  const failedBase = parseFailed(base.report);

  const rows = [];
  const misses = [];
  for (const f of files) {
    const abs = path.join(SRC_DIR, f);
    const rel = `app/public/src/${f}`;
    const mut = mutateFile(abs);
    if (!mut.mutated) { rows.push({ file: COV_NS(f), skipped: 'no_string_literal' }); continue; }

    const after = runSuite('cov/mut/after');
    const covMut = loadCov(after.covDir);
    const failedMut = parseFailed(after.report);
    restoreFile(rel);

    const delta = [COV_NS(f)];
    const selCov = selectByCoverage(covBase, delta);
    const affectedObs = buildAffectedByOutcome({
      resVold: outcomeMap(covBase, failedBase),
      resVnew: outcomeMap(covMut, failedMut),
    });
    const s = safetyEmp({ selected: selCov, affectedObs });
    if (s.misses.length) misses.push({ file: COV_NS(f), mutated_token: mut.token, missed: s.misses, affected_obs: affectedObs, selcov: selCov });
    rows.push({ file: COV_NS(f), mutated_token: mut.token, selcov_count: selCov.length, affected_obs_count: affectedObs.length, SafetyEmp: s.SafetyEmp });
    console.log(`${COV_NS(f)} token="${mut.token}" SelCov=${selCov.length} A_obs^mut=${affectedObs.length} SafetyEmp=${s.SafetyEmp}`);
  }

  const evaluated = rows.filter((r) => typeof r.SafetyEmp === 'number');
  const withEffect = evaluated.filter((r) => r.affected_obs_count > 0);
  const meanSafety = evaluated.length ? +(evaluated.reduce((a, r) => a + r.SafetyEmp, 0) / evaluated.length).toFixed(4) : 1;
  const out = {
    files_evaluated: evaluated.length,
    files_with_observable_effect: withEffect.length,
    mean_SafetyEmp: meanSafety,
    all_safe: misses.length === 0,
    total_misses: misses.reduce((a, m) => a + m.missed.length, 0),
    rows,
  };
  fs.writeFileSync(path.join(OUT, 'safety_mutation.json'), JSON.stringify(out, null, 2));
  fs.writeFileSync(path.join(OUT, 'safety_mutation_misses.json'), JSON.stringify(misses, null, 2));
  console.log(`\n=== Mutation recall stress ===\nfiles=${evaluated.length} (with effect=${withEffect.length}) mean SafetyEmp=${meanSafety} all_safe=${out.all_safe} misses=${out.total_misses}`);
}
main();
