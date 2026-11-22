// Discover npm/yarn workspace packages and build a TS `paths` mapping so alias
// imports (`@scope/pkg/*` -> the package's src dir) resolve — the last gap vs
// codegraph's resolution layer. Also returns the packages' src files so the
// typeChecker program can include cross-package symbols.
import fs from 'node:fs';
import path from 'node:path';

function srcDirOf(pkg, dir) {
  // infer the source dir from `exports` or `main`/`types` ("<root>/src|lib/...")
  const vals = [];
  if (pkg.exports) {
    const collect = (v) => {
      if (typeof v === 'string') vals.push(v);
      else if (v && typeof v === 'object') for (const k of Object.values(v)) collect(k);
    };
    collect(pkg.exports);
  }
  for (const k of ['main', 'types']) if (pkg[k]) vals.push(String(pkg[k]));
  for (const v of vals) {
    const m = String(v).match(/^(?:\.\/)?(src|lib)\//);
    if (m) return path.join(dir, m[1]);
  }
  return null;
}

const SRC_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|svelte)$/;

export function discoverWorkspace(repoDir, { packageGlobs = ['packages/*'] } = {}) {
  const packages = [];
  const dirs = [];
  for (const g of packageGlobs) {
    const base = g.replace(/\/\*$/, '');
    const root = path.join(repoDir, base);
    if (!fs.existsSync(root)) continue;
    for (const d of fs.readdirSync(root, { withFileTypes: true })) {
      if (d.isDirectory() && !d.name.startsWith('.')) dirs.push(path.join(root, d.name));
    }
  }
  for (const dir of dirs) {
    const pj = path.join(dir, 'package.json');
    if (!fs.existsSync(pj)) continue;
    let pkg; try { pkg = JSON.parse(fs.readFileSync(pj, 'utf8')); } catch { continue; }
    if (!pkg.name) continue;
    const src = srcDirOf(pkg, dir);
    if (src && fs.existsSync(src)) packages.push({ name: pkg.name, dir: path.relative(repoDir, dir), src: path.relative(repoDir, src) });
  }
  return packages;
}

// TS `paths`-style mapping for the typeChecker: name/* -> src/* (and name -> src/index)
export function buildPaths(packages) {
  const paths = {};
  for (const p of packages) {
    if (!p.src) continue;
    paths[`${p.name}/*`] = [`${p.src}/*`];
    paths[p.name] = [`${p.src}/index`];
  }
  return paths;
}

// collect source files under a package src dir (repo-relative paths)
export function collectSrc(repoDir, srcRel) {
  const out = [];
  const root = path.join(repoDir, srcRel);
  if (!fs.existsSync(root)) return out;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!e.name.startsWith('.')) walk(p); continue; }
      if (SRC_EXT.test(e.name)) out.push({ path: path.relative(repoDir, p), code: fs.readFileSync(p, 'utf8') });
    }
  };
  walk(root);
  return out;
}
