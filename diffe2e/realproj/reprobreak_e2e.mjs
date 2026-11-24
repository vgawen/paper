// End-to-end ReproBreak repair — NO GROUND-TRUTH LEAKAGE.
//
// For each validated break at commit C (parent C-1):
//   - INPUT (allowed): the OLD/broken test file (C-1, contains old_locator) +
//     the AUT APPLICATION-source diff between C-1 and C with TEST files EXCLUDED
//     (old & new app source). This is what a repair tool legitimately sees.
//   - EVALUATION-ONLY (never enters rule input or LLM prompt): the NEW test
//     file (C) and the ground-truth new_locator.
// Reports exact-match repair rate per arm (rule vs LLM). Execution validation
// (Docker overwrite mode) is optional and out of scope here.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { repair } from '../pipeline/src/repair.mjs';
import { createClient } from '../pipeline/src/llm/client.mjs';
import { extractCandidates, textHasEquivalentLocator, isDistinctive } from '../pipeline/src/locatorEquiv.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const BREAKS = path.join(here, 'results', 'reprobreak_breaks.json');
const CLONES = path.join(here, 'clones', 'aut');
const OUT = process.env.RB_OUT ? path.resolve(process.env.RB_OUT) : path.join(here, 'results', 'reprobreak_e2e.json');
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function ensureClone(repoName) {
  const dest = path.join(CLONES, repoName.replace('/', '__'));
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(CLONES, { recursive: true });
    // full clone (no --filter=blob:none): the e2e repair does many `git show` calls,
    // and a partial clone would fetch each blob on demand (slow). Full blobs are local.
    execSync(`git clone https://github.com/${repoName} ${JSON.stringify(dest)}`, { stdio: 'pipe' });
  }
  return dest;
}
const show = (repo, ref, file) => { try { return execSync(`git show ${ref}:${JSON.stringify(file).slice(1, -1)}`, { cwd: repo, stdio: 'pipe' }).toString(); } catch { return ''; } };
const isTestPath = (f, testFile) => f === testFile || /(\.spec\.|\.test\.|(^|\/)(tests?|e2e|cypress|__tests__)\/)/i.test(f);

// Resolve the spec's LOCAL imports (Page Object / helper modules) at `ref`, 1-2
// levels deep — the same import-closure RQ1 uses. These carry the locator
// definitions the test actually uses, so the repair prompt can see them.
function pomClosure(repo, ref, testFile, depth = 2) {
  const seen = new Set();
  const out = [];
  let frontier = [testFile];
  for (let d = 0; d < depth && frontier.length; d++) {
    const next = [];
    for (const file of frontier) {
      const code = show(repo, ref, file);
      if (!code) continue;
      const dir = file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : '';
      const re = /(?:from|require\()\s*['"](\.{1,2}\/[^'"]+)['"]/g;
      let m;
      while ((m = re.exec(code))) {
        let target = m[1].replace(/\.(t|j)sx?$/, '');
        const base = [dir, target].filter(Boolean).join('/');
        const cand = [`${base}.ts`, `${base}.js`, `${base}.tsx`, `${base}.jsx`, `${base}/index.ts`, `${base}/index.js`]
          .find((p) => show(repo, ref, p));
        if (cand && !seen.has(cand)) { seen.add(cand); out.push({ file: cand, code: show(repo, ref, cand) }); next.push(cand); }
      }
    }
    frontier = next;
  }
  return out;
}

// changed APPLICATION (non-test) source files in commit C — the legitimate
// structural-change context. The new TEST file is deliberately excluded.
function appDiff(repo, prev, sha, testFile) {
  let names = [];
  try { names = execSync(`git diff --name-only ${prev} ${sha}`, { cwd: repo, stdio: 'pipe' }).toString().trim().split('\n').filter(Boolean); } catch { /* */ }
  const appFiles = names.filter((f) => !isTestPath(f, testFile) && /\.(t|j)sx?$|\.vue$|\.svelte$|\.html?$|\.css$/.test(f));
  const appOld = appFiles.map((f) => show(repo, prev, f)).join('\n');
  const appNew = appFiles.map((f) => show(repo, sha, f)).join('\n');
  return { appFiles, appOld, appNew };
}

async function main() {
  if (!fs.existsSync(BREAKS)) { console.log('SKIPPED: run reprobreak_db.mjs first'); return; }
  const breaks = JSON.parse(fs.readFileSync(BREAKS, 'utf8'));
  const limit = parseInt(process.env.RB_LIMIT || '60', 10); // cap for cost/time
  const client = createClient();
  const arms = { rule: { ok: 0, ok_sem: 0, n: 0, n_sem: 0 }, llm: { ok: 0, ok_sem: 0, n: 0, n_sem: 0 } };
  const rows = [];
  const llmErrors = [];
  let skipped = 0;
  const writeOut = (partial = false) => {
    const rate = (a) => (a.n ? +(a.ok / a.n).toFixed(4) : 0);
    const withApp = rows.filter((r) => r.app_files > 0);
    const ruleWithApp = withApp.filter((r) => r.rule).length;
    fs.writeFileSync(OUT, JSON.stringify({
      provider: client.provider, n: rows.length, skipped, leakage_free: true, partial,
      rule_rate: rate(arms.rule), llm_rate: rate(arms.llm),
      rule_rate_sem: +(arms.rule.n_sem ? arms.rule.ok_sem / arms.rule.n_sem : 0).toFixed(4),
      llm_rate_sem: +(arms.llm.n_sem ? arms.llm.ok_sem / arms.llm.n_sem : 0).toFixed(4),
      sem_subset_n: arms.llm.n_sem,
      arms,
      app_signal_subset: { n: withApp.length, rule_ok: ruleWithApp, rule_rate: withApp.length ? +(ruleWithApp / withApp.length).toFixed(4) : 0 },
      llm_errors: llmErrors,
      rows,
    }, null, 2));
  };
  const concurrency = Math.max(1, parseInt(process.env.RB_CONCURRENCY || '1', 10));
  const work = breaks.slice(0, limit);
  const outRows = new Array(work.length).fill(null);

  async function processOne(b, idx) {
    let repo;
    try { repo = ensureClone(b.repository_name); } catch { skipped++; return; }
    const brokenTest = show(repo, b.previous_sha, b.test_file_path); // OLD test (input)
    if (!brokenTest || !brokenTest.includes(b.old_locator)) { skipped++; return; } // need broken locator present
    if (brokenTest.includes(b.new_locator)) { skipped++; return; } // OLD test must NOT already contain the answer
    // Whether the OLD test ALREADY has an equivalent form of the answer. Where it
    // does, "repaired text contains an equivalent locator" is trivially true and
    // says nothing about the repair -> semantic metric is only counted where false.
    // (The population is NOT shrunk: exact-match rates keep the same denominator.)
    // Semantic equivalence is only meaningful for DISTINCTIVE anchors (testId/text/
    // label/id...): CSS classes repeat everywhere, so an "equivalent class locator"
    // proves nothing. Non-distinctive targets are excluded from the semantic subset.
    const semanticApplicable = isDistinctive(b.new_locator);
    const preHadEquivalent = semanticApplicable && textHasEquivalentLocator(brokenTest, b.new_locator);
    const { appFiles, appOld, appNew } = appDiff(repo, b.previous_sha, b.commit_sha, b.test_file_path);

    // RULE arm: signals derived from APP-source diff only (no new test file)
    const ruleOut = repair(brokenTest, appOld, appNew);
    const ruleFixed = ruleOut.text.includes(b.new_locator);
    const ruleFixedSem = !preHadEquivalent && textHasEquivalentLocator(ruleOut.text, b.new_locator);
    arms.rule.n++; if (ruleFixed) arms.rule.ok++;
    if (semanticApplicable && !preHadEquivalent) { arms.rule.n_sem++; if (ruleFixedSem) arms.rule.ok_sem++; }

    // LLM arm: old broken test + APP diff context + POM closure + candidate locators
    let llmFixed = false;
    let llmFixedSem = false;
    let llmError = null;
    if (client.provider !== 'stub') {
      const pom = pomClosure(repo, b.previous_sha, b.test_file_path);
      const cands = extractCandidates(appNew).slice(0, 60);
      const candList = cands.map((c) => `${c.kind}: ${c.value}`).join('\n');
      const prompt = [
        'A Playwright/Cypress test locator broke after a structural change in the application UI.',
        `Broken locator (currently in the test): ${b.old_locator}`,
        'The BROKEN test file (do not assume the fix is here):', brokenTest.slice(0, 2000),
        pom.length ? `Imported Page-Object / helper modules (locators live here):\n${pom.map((p) => `--- ${p.file}\n${p.code.slice(0, 800)}`).join('\n').slice(0, 2000)}` : '',
        'Application source BEFORE the change:', appOld.slice(0, 1800),
        'Application source AFTER the change:', appNew.slice(0, 1800),
        candList ? `Candidate locators in the AFTER source (choose one if it fits):\n${candList}` : '',
        'Reply with EXACTLY ONE line containing the corrected locator expression and NOTHING else.',
        'No explanation, no markdown, no code fence, no quotes around the whole line.',
      ].filter(Boolean).join('\n');
      try {
        const ans = await completeWithRetry(client, prompt, { fallback: b.old_locator });
        llmFixed = norm(ans).includes(norm(b.new_locator));
        llmFixedSem = !preHadEquivalent && textHasEquivalentLocator(ans, b.new_locator);
      } catch (e) {
        llmError = e.message || String(e);
        llmErrors.push({ id: b.id, repo: b.repository_name, error: llmError });
      }
    }
    arms.llm.n++; if (llmFixed) arms.llm.ok++;
    if (semanticApplicable && !preHadEquivalent) { arms.llm.n_sem++; if (llmFixedSem) arms.llm.ok_sem++; }
    outRows[idx] = { id: b.id, repo: b.repository_name, app_files: appFiles.length, rule: ruleFixed, rule_sem: semanticApplicable && ruleFixedSem, pre_had_equiv: preHadEquivalent, sem_applicable: semanticApplicable, llm: llmFixed, llm_sem: semanticApplicable && llmFixedSem, llm_error: llmError };
    rows.length = 0; rows.push(...outRows.filter(Boolean));
    writeOut(true);
    console.log(`#${b.id} ${b.repository_name} appFiles=${appFiles.length} rule=${ruleFixed} llm=${llmFixed}${llmFixedSem ? '(sem)' : ''}${llmError ? ' llm_error=' + llmError : ''}`);
  }

  if (concurrency <= 1) {
    for (let i = 0; i < work.length; i++) { if (work[i]) await processOne(work[i], i); }
  } else {
    let cursor = 0;
    const workers = Array.from({ length: concurrency }, async () => {
      while (cursor < work.length) {
        const i = cursor++;
        try { await processOne(work[i], i); } catch { skipped++; }
      }
    });
    await Promise.all(workers);
  }
  rows.length = 0; rows.push(...outRows.filter(Boolean));
  writeOut(false);
  const rate = (a) => (a.n ? +(a.ok / a.n).toFixed(4) : 0);
  console.log(`\nReproBreak e2e (leakage-free): rule=${rate(arms.rule)} llm=${rate(arms.llm)} | semantic-equiv rule=${rate({ n: arms.rule.n_sem, ok: arms.rule.ok_sem })} llm=${rate({ n: arms.llm.n_sem, ok: arms.llm.ok_sem })} (subset n=${arms.llm.n_sem}) (provider=${client.provider}, n=${rows.length}, skipped=${skipped})`);
}
main();

async function completeWithRetry(client, prompt, options, attempts = 3) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      return await client.complete(prompt, options);
    } catch (e) {
      last = e;
      if (i < attempts - 1) await sleep(1000 * (i + 1));
    }
  }
  throw last;
}
