// Route-level demonstration on a real route-change commit (d05bd03 in actual-budget):
// extract routes from FinancesApp.tsx before/after, diff them (ADD/MODIFY), and show
// that the new route's component is executed by 0 of the runtime tests (vs file-level
// which selects all tests touching FinancesApp.tsx).
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { extractFile } from '../pipeline/src/graph/extract.mjs';

const repo = 'real/actual';
const FILE = 'packages/desktop-client/src/components/FinancesApp.tsx';
const COMMIT = process.argv[2] || 'd05bd03';
const covDir = 'real/actual/packages/desktop-client/cov_pertest';
const git = (args) => execSync(`git ${args}`, { cwd: repo, stdio: 'pipe' }).toString();

function routesAt(sha) {
  const code = git(`show ${sha}:${FILE}`);
  const { nodes } = extractFile(FILE, code);
  return nodes.filter((n) => n.kind === 'route').map((n) => n.name);
}

const oldR = routesAt(`${COMMIT}^`);
const newR = routesAt(COMMIT);
const oldSet = new Set(oldR), newSet = new Set(newR);
const added = newR.filter((r) => !oldSet.has(r));
const removed = oldR.filter((r) => !newSet.has(r));
console.log(`${COMMIT} (${git(`log -1 --format=%s ${COMMIT}`).trim()})`);
console.log(`routes before: ${oldR.length}  after: ${newR.length}`);
console.log(`ADDED:   ${added.join(', ') || '(none)'}`);
console.log(`REMOVED: ${removed.join(', ') || '(none)'}`);

// runtime: how many tests execute MobileTagEditPage (the new route's deep component)
const component = 'MobileTagEditPage';
let execCount = 0, totalTests = 0;
for (const f of fs.readdirSync(covDir)) {
  if (!f.endsWith('.json')) continue;
  totalTests++;
  const o = JSON.parse(fs.readFileSync(path.join(covDir, f), 'utf8'));
  const hit = Object.values(o.funcs || {}).some((names) => names.includes(component));
  if (hit) execCount++;
}
console.log(`\nruntime: ${execCount}/${totalTests} tests execute ${component} (the new /tags/:id page)`);
console.log(`file-level for a FinancesApp.tsx change would select ~all ${totalTests} tests (every test loads App).`);
