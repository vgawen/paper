// Project-agnostic real commit-replay engine.
//
// PURE core (computeTransition): given per-test coverage on V_old / V_new, the
// changed source files, and any UI-signal-selected tests, assemble the three
// selection variants (coverage_only / uidiff_only / dual) and their metrics
// against an affected oracle derived from V_new coverage (eval-only).
//
// LIVE helpers (loadAdapter/checkout/install/runSuite/loadCov) are driven by an
// adapter JSON and exercised only by run_rq1_real.mjs, never by the unit test.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { selectByGenericCoverage, toRepoRel } from '../../pipeline/src/covpath.mjs';
import { buildAffected } from '../../pipeline/src/oracle.mjs';
import { selectionMetrics } from '../../pipeline/src/metrics.mjs';
import { srcLeaf, mapLeafRelToRepoRel, rewriteSpecImport, relImportPath, covFixtureSource } from '../../pipeline/src/covinject.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

// ---- pure: assemble selection + metrics for one transition ----
export function computeTransition({ covVold, covVnew, changed, uiSelected = [] }) {
  const all = [...new Set([...Object.keys(covVold), ...Object.keys(covVnew)])];
  const affected = buildAffected(covVnew, changed);
  const coverage_only = selectByGenericCoverage(covVold, changed);
  const uidiff_only = uiSelected.filter((t) => all.includes(t));
  const dual = [...new Set([...coverage_only, ...uidiff_only])];
  const methods = { coverage_only, uidiff_only, dual };
  const metrics = {};
  for (const [k, sel] of Object.entries(methods)) metrics[k] = selectionMetrics({ full: all, selected: sel, affected });
  return { all, affected, methods, metrics };
}

// ---- live helpers (driven by adapter; exercised by run_rq1_real.mjs) ----
export function loadAdapter(file) {
  const a = JSON.parse(fs.readFileSync(file, 'utf8'));
  a.repoAbs = path.resolve(here, a.repoDir);
  return a;
}
export function gitIn(repo, args) { return execSync(`git ${args}`, { cwd: repo, stdio: 'pipe' }).toString(); }
export function checkoutSha(repo, sha) { gitIn(repo, `checkout -q ${sha}`); }

// best-effort install at the current checkout; returns false on failure so the
// driver can skip the transition instead of polluting results with empty cov.
export function installLive(adapter) {
  if (!adapter.installCmd) return true;
  try { execSync(adapter.installCmd, { cwd: adapter.repoAbs, stdio: 'pipe', timeout: 600000 }); return true; }
  catch { return false; }
}

// Recursively collect Playwright spec files under a directory.
function walkSpecs(root, acc = []) {
  if (!fs.existsSync(root)) return acc;
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    const f = path.join(root, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walkSpecs(f, acc); }
    else if (/\.(spec|e2e|test)\.[mc]?[jt]sx?$/.test(e.name)) acc.push(f);
  }
  return acc;
}

// Inject a CDP coverage fixture and codemod spec imports to use it. Idempotent;
// must be re-run after every `git checkout` (which reverts tracked specs). The
// untracked fixture file survives checkout but is rewritten anyway. No-op unless
// adapter.injectCoverage === 'cdp'.
export function injectCdpCoverage(adapter) {
  if (adapter.injectCoverage !== 'cdp') return false;
  const leaf = srcLeaf(adapter.srcGlob || 'src');
  const dir = path.join(adapter.repoAbs, adapter.injectDir || adapter.specGlob || '.');
  fs.mkdirSync(dir, { recursive: true });
  const fixtureAbs = path.join(dir, '__cov_fixtures.ts');
  fs.writeFileSync(fixtureAbs, covFixtureSource(leaf));
  const specRoot = path.join(adapter.repoAbs, adapter.specGlob || adapter.injectDir || '.');
  let n = 0;
  for (const f of walkSpecs(specRoot)) {
    if (f === fixtureAbs) continue;
    const { code, changed } = rewriteSpecImport(fs.readFileSync(f, 'utf8'), relImportPath(f, fixtureAbs));
    if (changed) { fs.writeFileSync(f, code); n++; }
  }
  return n;
}

export function changedSrcFiles(repo, prev, sha, srcGlob) {
  const diff = gitIn(repo, `diff ${prev} ${sha} -- ${srcGlob}`);
  const files = [...diff.matchAll(/^\+\+\+ b\/(.+)$/gm)].map((m) => m[1]);
  return [...new Set(files.filter((f) => f.startsWith(srcGlob)))];
}

export function runSuiteLive(adapter, spec = '') {
  const cmd = (spec ? adapter.testOneCmd.replace('{spec}', spec) : adapter.testAllCmd);
  const covAbs = path.join(adapter.repoAbs, adapter.covRel);
  fs.rmSync(covAbs, { recursive: true, force: true });
  let ok = true;
  try { execSync(cmd, { cwd: adapter.repoAbs, stdio: 'pipe' }); } catch { ok = false; }
  return { ok, covAbs };
}

// Reads a coverage directory into { testId: [repoRelFile,...] }. Two layouts:
//  - 'json:files'  : each *.json = { test, files: [path,...] }
//  - 'istanbul'    : each <testId>.json = { "<absPath>": {istanbul...}, ... }
//                    (testId = filename stem; files = the object keys)
export function loadCovLive(adapter, covAbs) {
  const map = {};
  if (!fs.existsSync(covAbs)) return map;
  const injected = adapter.injectCoverage === 'cdp';
  const mode = injected ? 'json:files' : (adapter.covEntryToPath || 'json:files');
  for (const f of fs.readdirSync(covAbs)) {
    if (!f.endsWith('.json')) continue;
    let o;
    try { o = JSON.parse(fs.readFileSync(path.join(covAbs, f), 'utf8')); } catch { continue; }
    if (mode === 'istanbul') {
      const id = f.replace(/\.json$/, '');
      map[id] = Object.keys(o).map((p) => toRepoRel(p, adapter.repoAbs));
    } else {
      // injected CDP coverage already writes LEAF-relative paths -> re-attach
      // the srcGlob prefix so they share the git-diff namespace.
      map[o.test] = (o.files || []).map((p) => injected ? mapLeafRelToRepoRel(p, adapter.srcGlob) : toRepoRel(p, adapter.repoAbs));
    }
  }
  return map;
}
