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

const here = path.dirname(fileURLToPath(import.meta.url));
const BREAKS = path.join(here, 'results', 'reprobreak_breaks.json');
const CLONES = path.join(here, 'clones', 'aut');
const OUT = path.join(here, 'results', 'reprobreak_e2e.json');
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

function ensureClone(repoName) {
  const dest = path.join(CLONES, repoName.replace('/', '__'));
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(CLONES, { recursive: true });
    execSync(`git clone --filter=blob:none https://github.com/${repoName} ${JSON.stringify(dest)}`, { stdio: 'pipe' });
  }
  return dest;
}
const show = (repo, ref, file) => { try { return execSync(`git show ${ref}:${JSON.stringify(file).slice(1, -1)}`, { cwd: repo, stdio: 'pipe' }).toString(); } catch { return ''; } };
const isTestPath = (f, testFile) => f === testFile || /(\.spec\.|\.test\.|(^|\/)(tests?|e2e|cypress|__tests__)\/)/i.test(f);

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
  const arms = { rule: { ok: 0, n: 0 }, llm: { ok: 0, n: 0 } };
  const rows = [];
  let skipped = 0;
  for (const b of breaks.slice(0, limit)) {
    let repo;
    try { repo = ensureClone(b.repository_name); } catch { skipped++; continue; }
    const brokenTest = show(repo, b.previous_sha, b.test_file_path); // OLD test (input)
    if (!brokenTest || !brokenTest.includes(b.old_locator)) { skipped++; continue; } // need broken locator present
    if (brokenTest.includes(b.new_locator)) { skipped++; continue; } // OLD test must NOT already contain the answer
    const { appFiles, appOld, appNew } = appDiff(repo, b.previous_sha, b.commit_sha, b.test_file_path);

    // RULE arm: signals derived from APP-source diff only (no new test file)
    const ruleOut = repair(brokenTest, appOld, appNew);
    const ruleFixed = ruleOut.text.includes(b.new_locator);
    arms.rule.n++; if (ruleFixed) arms.rule.ok++;

    // LLM arm: old broken test + APP diff context only (answer excluded)
    let llmFixed = false;
    if (client.provider !== 'stub') {
      const prompt = [
        'A Playwright/Cypress test locator broke after a structural change in the application UI.',
        `Broken locator (currently in the test): ${b.old_locator}`,
        'The BROKEN test file (do not assume the fix is here):', brokenTest.slice(0, 3500),
        'Application source BEFORE the change:', appOld.slice(0, 3500),
        'Application source AFTER the change:', appNew.slice(0, 3500),
        'Using ONLY the application change above, output ONLY the single corrected locator string.',
      ].join('\n');
      const ans = await client.complete(prompt, { fallback: b.old_locator });
      llmFixed = norm(ans).includes(norm(b.new_locator));
    }
    arms.llm.n++; if (llmFixed) arms.llm.ok++;
    rows.push({ id: b.id, repo: b.repository_name, app_files: appFiles.length, rule: ruleFixed, llm: llmFixed });
    console.log(`#${b.id} ${b.repository_name} appFiles=${appFiles.length} rule=${ruleFixed} llm=${llmFixed}`);
  }
  const rate = (a) => (a.n ? +(a.ok / a.n).toFixed(4) : 0);
  // app-signal subset: rows where the structural change IS in this commit's app diff
  const withApp = rows.filter((r) => r.app_files > 0);
  const ruleWithApp = withApp.filter((r) => r.rule).length;
  fs.writeFileSync(OUT, JSON.stringify({
    provider: client.provider, n: rows.length, skipped, leakage_free: true,
    rule_rate: rate(arms.rule), llm_rate: rate(arms.llm), arms,
    app_signal_subset: { n: withApp.length, rule_ok: ruleWithApp, rule_rate: withApp.length ? +(ruleWithApp / withApp.length).toFixed(4) : 0 },
    rows,
  }, null, 2));
  console.log(`\nReproBreak e2e (leakage-free): rule=${rate(arms.rule)} llm=${rate(arms.llm)} (provider=${client.provider}, n=${rows.length}, skipped=${skipped})`);
}
main();
