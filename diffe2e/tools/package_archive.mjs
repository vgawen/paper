#!/usr/bin/env node
// Build a clean submission archive from git, with a single top-level `diffe2e/`.
//
// Why git archive: it contains only TRACKED files, so `.git/`, `node_modules/`,
// `.DS_Store`, `__MACOSX/` and stale root-level `cov/vold|vnew` never enter the zip.
// Commit your changes first — the archive is built from HEAD, not the working tree.
//
// Usage:
//   node tools/package_archive.mjs [out.zip]        # default: <repo>/Archive.zip
//   node tools/package_archive.mjs --force          # overwrite an existing zip
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const force = args.includes('--force');
const outArg = args.find((a) => !a.startsWith('--'));

const repoRoot = execSync('git rev-parse --show-toplevel', { stdio: 'pipe' }).toString().trim();
const out = path.resolve(outArg || path.join(repoRoot, 'Archive.zip'));
if (fs.existsSync(out) && !force) {
  console.error(`refusing to overwrite ${out} (pass --force)`);
  process.exit(1);
}

const dirty = execSync('git status --porcelain -- diffe2e', { cwd: repoRoot, stdio: 'pipe' }).toString().trim();
if (dirty) {
  console.warn('WARNING: uncommitted changes under diffe2e will NOT be included (archive is built from HEAD).');
  console.warn('         Commit first, then re-run, for a complete archive.');
}

// `HEAD:diffe2e` is the tracked tree of the subdirectory; the prefix restores the
// top-level `diffe2e/` folder expected by appendix A.1/A.2 (`cd diffe2e`).
execSync(`git archive --format=zip --prefix=diffe2e/ -o ${JSON.stringify(out)} HEAD:diffe2e`, { cwd: repoRoot, stdio: 'inherit' });

const sizeMb = (fs.statSync(out).size / 1024 / 1024).toFixed(1);
console.log(`\nwrote ${out} (${sizeMb} MB)`);
console.log('contents are tracked files only; no .git, node_modules, .DS_Store, __MACOSX, or stale cov/');
