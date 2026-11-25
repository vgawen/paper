// Real-project RQ1 with the test-code graph: per transition, capture FUNCTION-LEVEL
// coverage on V_old / V_new, attribute the diff (functions / variables / routes),
// and compare graph-selection against the file-level coverage baseline.
//
// Usage: node experiments/real/run_rq1_real_graph.mjs <adapter.json> [maxTransitions]
//
// Requires: repo cloned at adapter.repoDir, deps installed (installLive), Playwright
// browsers available. Writes out/real/<name>_rq1_graph.jsonl.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { loadAdapter, gitIn, checkoutSha, installLive, injectCdpCoverage, runSuiteLive } from './engine.mjs';
import { Graph } from '../../pipeline/src/graph/graph.mjs';
import { addTestEdges } from '../../pipeline/src/graph/testEdges.mjs';
import { selectAffected, routeDiff } from '../../pipeline/src/graph/select.mjs';
import { changedEntitiesFromCode } from '../../pipeline/src/astEntities.mjs';
import { parseUnifiedDiff } from '../../pipeline/src/diff.mjs';
import { nodeId } from '../../pipeline/src/graph/extract.mjs';
import { srcLeaf, mapLeafRelToRepoRel } from '../../pipeline/src/covinject.mjs';
import { discoverWorkspace, collectSrc } from '../../pipeline/src/graph/workspace.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'out', 'real');
const norm = (p) => String(p || '').replace(/^\/+/, '');

const adapterFile = process.argv[2];
const maxN = parseInt(process.argv[3] || '9', 10);
if (!adapterFile) { console.error('usage: run_rq1_real_graph.mjs <adapter.json> [maxN]'); process.exit(1); }
const adapter = loadAdapter(adapterFile);

// read transitions from the existing file-level RQ1 dataset (prev/sha/changed)
const transitions = fs.readFileSync(path.join(outDir, `${adapter.name}_rq1.jsonl`), 'utf8')
  .trim().split('\n').map((l) => JSON.parse(l)).slice(0, maxN);

// function-level coverage: { test: { files:[], funcs:{file:[names]} } }
function loadCovFunc(covAbs) {
  const map = {};
  if (!fs.existsSync(covAbs)) return map;
  for (const f of fs.readdirSync(covAbs)) {
    if (!f.endsWith('.json') || f.startsWith('_')) continue;
    let o; try { o = JSON.parse(fs.readFileSync(path.join(covAbs, f), 'utf8')); } catch { continue; }
    if (!o.test) continue;
    // coverage keys are LEAF-relative (src/…); the diff is REPO-relative
    // (packages/desktop-client/src/…) — map them into the same namespace.
    const toRepo = (p) => mapLeafRelToRepoRel(norm(p), adapter.srcGlob);
    const funcs = {};
    for (const [k, names] of Object.entries(o.funcs || {})) funcs[toRepo(k)] = names;
    map[o.test] = { files: (o.files || []).map(toRepo), funcs };
  }
  return map;
}

function repoFilesAtRun() {
  const srcGlobs = Array.isArray(adapter.srcGlobs) ? adapter.srcGlobs : [adapter.srcGlob];
  const files = [];
  for (const g of srcGlobs) for (const f of collectSrc(adapter.repoAbs, g)) files.push(f);
  // include workspace packages so cross-package calls resolve
  const pkgs = discoverWorkspace(adapter.repoAbs);
  for (const p of pkgs) for (const f of collectSrc(adapter.repoAbs, p.src)) {
    if (!files.some((x) => x.path === f.path)) files.push(f);
  }
  return files;
}

// Fetch a single commit snapshot on demand (depth 1). Required when the local
// clone is partial/shallow: without this, `checkout <sha>` fails on missing blobs.
function ensureCommit(sha) {
  try { gitIn(adapter.repoAbs, `cat-file -e ${sha}^{commit}`); } catch { /* missing */ }
  try {
    gitIn(adapter.repoAbs, `cat-file -e ${sha}^{commit}`);
    return; // already present
  } catch { /* need to fetch */ }
  console.log(`  fetching ${sha.slice(0, 10)} (depth=1)`);
  gitIn(adapter.repoAbs, `fetch --depth=1 origin ${sha}`);
}

// Playwright pins a browser build per version; an old commit needs its own
// Chromium revision (see paper §4.5 "浏览器版本漂移"). Install it after deps.
function ensureBrowser() {
  const cmd = adapter.testOneCmd.replace(/ --?workers?=\d+/, '').replace(/\bplaywright test\b.*$/, 'playwright install chromium');
  try { execSync(cmd, { cwd: adapter.runAbs, stdio: 'pipe', timeout: 600000 }); } catch { /* best effort */ }
}

function changedEntities(prev, sha) {
  const srcGlobs = Array.isArray(adapter.srcGlobs) ? adapter.srcGlobs : [adapter.srcGlob];
  const diff = gitIn(adapter.repoAbs, `diff ${prev} ${sha} -- ${srcGlobs.join(' ')}`);
  const parsed = parseUnifiedDiff(diff);
  const fns = new Set(), vars = new Set(), routes = new Set();
  for (const f of parsed.files) {
    let newCode = '';
    try { newCode = gitIn(adapter.repoAbs, `show ${sha}:${f}`); } catch { continue; }
    const lines = parsed.byFile[f] ? [...parsed.byFile[f].added, ...parsed.byFile[f].removed] : [];
    for (const e of changedEntitiesFromCode(newCode, lines, f)) {
      if (e.kind === 'variable') vars.add(nodeId(f, e.name));
      else if (e.kind === 'route') routes.add(nodeId(f, `route:${e.name}`));
      else fns.add(nodeId(f, e.name));
    }
  }
  return { files: parsed.files, fns, vars, routes };
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const out = [];
  for (const t of transitions) {
    const tag = `${t.prev.slice(0, 7)}→${t.sha.slice(0, 7)}`;
    try {
      // V_old: function-level coverage
      ensureCommit(t.prev);
      ensureCommit(t.sha);
      checkoutSha(adapter.repoAbs, t.prev);
      if (!installLive(adapter)) { out.push({ tag, skipped: 'install_vold' }); console.log(`${tag} SKIP install_vold`); continue; }
      ensureBrowser();
      injectCdpCoverage(adapter);
      const rOld = runSuiteLive(adapter);
      const covOld = loadCovFunc(rOld.covAbs);
      if (!Object.keys(covOld).length) { out.push({ tag, skipped: 'no_cov_vold' }); console.log(`${tag} SKIP no_cov_vold`); continue; }

      // V_new: file-level coverage for the affected oracle + pass/fail
      checkoutSha(adapter.repoAbs, t.sha);
      if (!installLive(adapter)) { out.push({ tag, skipped: 'install_vnew' }); console.log(`${tag} SKIP install_vnew`); continue; }
      ensureBrowser();
      injectCdpCoverage(adapter);
      const rNew = runSuiteLive(adapter);
      const covNew = loadCovFunc(rNew.covAbs);

      // graph on V_old source + V_old evidence
      checkoutSha(adapter.repoAbs, t.prev);
      const files = repoFilesAtRun();
      const evidence = Object.entries(covOld).map(([test, v]) => ({ test, funcs: v.funcs }));
      const graph = addTestEdges(Graph.build(files).toJSON(), evidence);
      // routes at V_new (for ADD/REMOVE/MODIFY), then return to V_old for graph building
      checkoutSha(adapter.repoAbs, t.sha);
      const filesNew = repoFilesAtRun();
      const graphNew = addTestEdges(Graph.build(filesNew).toJSON(), []);
      checkoutSha(adapter.repoAbs, t.prev);

      const ch = changedEntities(t.prev, t.sha);
      const allTests = [...new Set([...Object.keys(covOld), ...Object.keys(covNew)])];
      // affected oracle (coverage-based, V_new only) — same definition as the file-level run
      const affected = allTests.filter((id) => (covNew[id]?.files || []).some((f) => ch.files.includes(f)));
      const selGraph = selectAffected(graph, {
        changedFns: ch.fns, changedVars: ch.vars, changedRoutes: ch.routes,
        routeChanges: routeDiff(graph, graphNew), allTests: allTests.map((x) => `test::${x}`),
      });
      const selFile = allTests.filter((id) => (covOld[id]?.files || []).some((f) => ch.files.includes(f)));

      const S = allTests.length;
      const m = (sel) => {
        const s = new Set([...sel].map((x) => String(x).replace(/^test::/, '')));
        const hit = affected.filter((t) => s.has(t)).length;
        return { selected: s.size, Reduction: S ? +(1 - s.size / S).toFixed(4) : 0, Safety: affected.length ? +(hit / affected.length).toFixed(4) : 1, Precision: s.size ? +(hit / s.size).toFixed(4) : 1 };
      };
      out.push({ tag, full: S, changed_files: ch.files.length, cov_only: m(selFile), graph: m(selGraph) });
      console.log(`${tag} full=${S} files=${ch.files.length} | cov R=${m(selFile).Reduction} S=${m(selFile).Safety} | graph R=${m(selGraph).Reduction} S=${m(selGraph).Safety}`);
    } catch (e) {
      out.push({ tag, error: e.message });
      console.log(`${tag} ERROR ${e.message}`);
    }
  }
  const outFile = path.join(outDir, `${adapter.name}_rq1_graph.jsonl`);
  fs.writeFileSync(outFile, out.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const ok = out.filter((r) => r.graph);
  if (ok.length) {
    const mean = (a) => +(a.reduce((s, x) => s + x, 0) / a.length).toFixed(4);
    console.log(`\n=== ${adapter.name} graph-selection (n=${ok.length}) ===`);
    console.log(`coverage_only: Reduction=${mean(ok.map((r) => r.cov_only.Reduction))} Safety=${mean(ok.map((r) => r.cov_only.Safety))}`);
    console.log(`graph        : Reduction=${mean(ok.map((r) => r.graph.Reduction))} Safety=${mean(ok.map((r) => r.graph.Safety))}`);
  }
  console.log(`written: ${outFile}`);
}

main();
