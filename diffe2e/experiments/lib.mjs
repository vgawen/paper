// IO / live helpers for commit-replay against subject/work.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseUnifiedDiff } from '../pipeline/src/diff.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const WORK = path.join(here, '..', 'subject', 'work');
export const OUT = path.join(here, 'out');

const norm = (p) => p.replace(/^\/+/, '');

export function git(args, cwd = WORK) {
  return execSync(`git ${args}`, { cwd, stdio: 'pipe' }).toString();
}

export function checkout(tag) { git(`checkout -q ${tag}`); }

export function readManifest() {
  return JSON.parse(fs.readFileSync(path.join(WORK, 'manifest.json'), 'utf8'));
}

// changed app source files between two tags, mapped to coverage namespace src/*.js
export function changedAppFiles(oldTag, newTag) {
  const diff = git(`diff ${oldTag} ${newTag} -- app/public/src`);
  const parsed = parseUnifiedDiff(diff);
  return parsed.files
    .filter((f) => f.includes('app/public/src/'))
    .map((f) => 'src/' + f.split('app/public/src/')[1]);
}

// run Playwright (full suite, or a single spec via `spec`), writing per-test
// coverage into WORK/<covRel>.
export function runSuite(covRel, spec = '') {
  const abs = path.join(WORK, covRel);
  fs.rmSync(abs, { recursive: true, force: true });
  let ok = true;
  try {
    execSync(`COV_OUT=${covRel} PW_JSON=pw-report.json npx playwright test ${spec}`, { cwd: WORK, stdio: 'pipe' });
  } catch (e) { ok = false; } // non-zero exit when some tests fail (expected for breaks)
  return { ok, covDir: abs, report: path.join(WORK, 'pw-report.json') };
}

// load per-test coverage dir -> { testId: [files...] }
export function loadCov(covDir) {
  const map = {};
  if (!fs.existsSync(covDir)) return map;
  for (const f of fs.readdirSync(covDir)) {
    if (!f.endsWith('.json')) continue;
    const o = JSON.parse(fs.readFileSync(path.join(covDir, f), 'utf8'));
    map[o.test] = (o.files || []).map(norm);
  }
  return map;
}

// parse Playwright JSON report -> Set of failed test ids "<basename file> > <title>"
export function parseFailed(reportPath) {
  const failed = new Set();
  if (!fs.existsSync(reportPath)) return failed;
  const rep = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const walk = (suite) => {
    for (const spec of suite.specs || []) {
      const status = spec.ok ? 'passed' : 'failed';
      const file = path.basename(spec.file || suite.file || '');
      if (status !== 'passed') failed.add(`${file} > ${spec.title}`);
    }
    for (const s of suite.suites || []) walk(s);
  };
  for (const s of rep.suites || []) walk(s);
  return failed;
}

// `git show <tag>:<path>` returning '' for absent files (e.g. newly added).
export function showFile(tag, relpath) {
  try { return git(`show ${tag}:${relpath}`); } catch { return ''; }
}

// read a test spec source from the work tree (current checkout) by basename.
export function readTestSource(file) {
  const p = path.join(WORK, 'tests', file);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

export function ensureOut() { fs.mkdirSync(OUT, { recursive: true }); }
