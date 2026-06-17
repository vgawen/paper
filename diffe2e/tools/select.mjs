// RQ1 minimal pipeline:
//   - load V_old per-test coverage maps  -> selector input (NO V_new info)
//   - load V_new per-test coverage maps  -> affected-test ORACLE (eval only)
//   - given changed files (the diff), compute:
//       Sel      = tests whose V_old coverage intersects changed files
//       Affected = tests whose V_new coverage intersects changed files (oracle)
//       Reduction = 1 - |Sel|/|S|
//       Safety    = |Sel & Affected| / |Affected|     (recall of affected)
//       Precision = |Sel & Affected| / |Sel|
//
// Usage:
//   node tools/select.mjs --vold cov/vold --vnew cov/vnew --diff src/cart.js[,src/x.js]

import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const a = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith('--')) { a[k.slice(2)] = argv[i + 1]; i++; }
  }
  return a;
}

function loadCov(dir) {
  const map = {}; // testId -> Set(files)
  if (!fs.existsSync(dir)) throw new Error(`coverage dir not found: ${dir}`);
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    const obj = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
    map[obj.test] = new Set((obj.files || []).map(normFile));
  }
  return map;
}

// normalize "/src/cart.js" and "src/cart.js" to "src/cart.js"
function normFile(p) { return p.replace(/^\/+/, ''); }

function intersects(set, changed) {
  for (const c of changed) if (set.has(c)) return true;
  return false;
}

function select(cov, changed) {
  return new Set(Object.keys(cov).filter((t) => intersects(cov[t], changed)));
}

function inter(a, b) { return new Set([...a].filter((x) => b.has(x))); }

function main() {
  const args = parseArgs(process.argv);
  const voldDir = args.vold || 'cov/vold';
  const vnewDir = args.vnew || 'cov/vnew';
  const changed = (args.diff || '').split(',').map((s) => normFile(s.trim())).filter(Boolean);
  if (!changed.length) { console.error('provide --diff a,b,c'); process.exit(2); }

  const vold = loadCov(voldDir);
  const vnew = loadCov(vnewDir);

  const allTests = new Set([...Object.keys(vold), ...Object.keys(vnew)]);
  const S = allTests.size;

  const Sel = select(vold, changed);                 // selection uses V_old only
  const Affected = select(vnew, changed);            // oracle uses V_new
  const hit = inter(Sel, Affected);

  const Reduction = S ? 1 - Sel.size / S : 0;
  const Safety = Affected.size ? hit.size / Affected.size : 1;
  const Precision = Sel.size ? hit.size / Sel.size : 1;

  const report = {
    changed_files: changed,
    full_suite: S,
    selected: [...Sel].sort(),
    affected_oracle: [...Affected].sort(),
    metrics: {
      Reduction: +Reduction.toFixed(4),
      Safety: +Safety.toFixed(4),
      Precision: +Precision.toFixed(4),
      selected_count: Sel.size,
      affected_count: Affected.size,
    },
  };
  console.log(JSON.stringify(report, null, 2));
}

main();
