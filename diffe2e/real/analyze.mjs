// Statement/line-level RQ1 analyzer for a real istanbul-instrumented repo.
//
// Reads per-test istanbul coverage (one JSON per test in a dir), and for a
// target source file computes, per test, the set of EXECUTED source lines.
// Then, given a set of changed lines (the diff), computes selection + oracle
// metrics:
//     Sel      = tests whose V_old executed-lines intersect changed lines
//     Affected = tests whose V_new executed-lines intersect changed lines (oracle)
//     Reduction / Safety / Precision
//
// Usage:
//   node analyze.mjs --vold DIR --vnew DIR --file src/App.tsx --lines 10-11[,20]
//   node analyze.mjs --show --cov DIR --file src/App.tsx     (just print per-test lines)

import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const a = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith('--')) {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) { a[k.slice(2)] = true; }
      else { a[k.slice(2)] = next; i++; }
    }
  }
  return a;
}

function parseLines(spec) {
  const set = new Set();
  for (const part of String(spec).split(',')) {
    const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!m) continue;
    const lo = +m[1], hi = m[2] ? +m[2] : lo;
    for (let l = lo; l <= hi; l++) set.add(l);
  }
  return set;
}

// per coverage file -> executed line set for the target file
function executedLines(covObj, fileSuffix) {
  const out = new Set();
  for (const key of Object.keys(covObj)) {
    if (!key.replace(/\\/g, '/').endsWith(fileSuffix)) continue;
    const c = covObj[key];
    const sm = c.statementMap || {};
    const s = c.s || {};
    // Attribute by the START line of each executed statement. Using the full
    // span would let one big JSX `return` statement (executed by every test)
    // cover the whole file and wash out handler-level differences.
    for (const id of Object.keys(s)) {
      if (s[id] > 0 && sm[id]) out.add(sm[id].start.line);
    }
  }
  return out;
}

// dir of per-test coverage -> { testLabel: Set(lines) }
function loadCovDir(dir, fileSuffix) {
  const map = {};
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    const obj = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    map[f.replace(/\.json$/, '')] = executedLines(obj, fileSuffix);
  }
  return map;
}

function intersects(set, other) {
  for (const x of other) if (set.has(x)) return true;
  return false;
}

function main() {
  const args = parseArgs(process.argv);
  const file = args.file || 'src/App.tsx';
  const suffix = file.replace(/^\.?\//, '');

  if (args.show) {
    const cov = loadCovDir(args.cov, suffix);
    for (const t of Object.keys(cov).sort()) {
      const lines = [...cov[t]].sort((a, b) => a - b);
      console.log(`${t}: lines ${JSON.stringify(lines)}`);
    }
    return;
  }

  const changed = parseLines(args.lines || '');
  if (!changed.size) { console.error('provide --lines a-b,c'); process.exit(2); }

  const vold = loadCovDir(args.vold, suffix);
  const vnew = loadCovDir(args.vnew, suffix);
  const tests = new Set([...Object.keys(vold), ...Object.keys(vnew)]);
  const S = tests.size;

  const Sel = new Set([...Object.keys(vold)].filter((t) => intersects(vold[t], changed)));
  const Affected = new Set([...Object.keys(vnew)].filter((t) => intersects(vnew[t], changed)));
  const hit = new Set([...Sel].filter((t) => Affected.has(t)));

  const report = {
    file,
    changed_lines: [...changed].sort((a, b) => a - b),
    full_suite: S,
    selected: [...Sel].sort(),
    affected_oracle: [...Affected].sort(),
    metrics: {
      Reduction: +(S ? 1 - Sel.size / S : 0).toFixed(4),
      Safety: +(Affected.size ? hit.size / Affected.size : 1).toFixed(4),
      Precision: +(Sel.size ? hit.size / Sel.size : 1).toFixed(4),
      selected_count: Sel.size,
      affected_count: Affected.size,
    },
  };
  console.log(JSON.stringify(report, null, 2));
}

main();
