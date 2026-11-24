import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAdapter, gitIn } from './engine.mjs';
import { extractFromCode, semanticDiffNodes } from '../../pipeline/src/uidiff.mjs';
import { buildPromptNoDiff, cleanGeneratedSpec, extractDomSignals, generateFromUiNodes, specFromUiNodes } from '../../pipeline/src/generate.mjs';
import { createClient } from '../../pipeline/src/llm/client.mjs';
import { pickFewShotTemplates, buildGapPromptWithFewShot } from '../../pipeline/src/fewshot.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'out', 'real');

export function pickUiBearingContexts(candidates, limit = Infinity) {
  return candidates
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || a.project.localeCompare(b.project) || a.sha.localeCompare(b.sha) || a.file.localeCompare(b.file))
    .slice(0, limit);
}

async function completeWithRetry(run, attempts = 3) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try { return await run(); } catch (e) { lastErr = e; if (i === attempts) throw e; }
  }
  throw lastErr;
}

function safeShow(repoAbs, ref, file) {
  try { return gitIn(repoAbs, `show ${ref}:${file}`); } catch { return ''; }
}

function buildAddNodesFromDomSignals(code) {
  return extractDomSignals(code).map((s) => ({
    tag: s.tag,
    text: s.text || '',
    testId: s.testId || null,
  }));
}

function collectCandidates({ adapter, rq1Rows }) {
  const candidates = [];
  // C1: real gap verification — a changed file is only a *gap* if NO existing
  // test executes any of its functions (else the "gap" premise is false and any
  // generated test is answering a non-question).
  const coveredFiles = coveredFileSet(adapter);
  for (const row of rq1Rows) {
    for (const file of row.changed || []) {
      let oldCode = safeShow(adapter.repoAbs, row.prev, file);
      let newCode = safeShow(adapter.repoAbs, row.sha, file);
      if (!newCode) continue;
      let addNodes = [];
      let nodeCount = 0;
      let newNodeCount = 0;
      try {
        const diff = semanticDiffNodes(extractFromCode(oldCode, file), extractFromCode(newCode, file));
        addNodes = diff.ADD.map((e) => e.node).filter(Boolean);
        nodeCount = addNodes.length + diff.MODIFY.length;
      } catch {
        addNodes = [];
      }
      try { newNodeCount = extractFromCode(newCode, file).length; } catch {}
      const domSignals = extractDomSignals(newCode);
      const domCount = domSignals.length;
      const fallbackNodes = addNodes.length ? addNodes : buildAddNodesFromDomSignals(newCode);
      const score = nodeCount + domCount || newNodeCount;
      if (score <= 0) continue;
      // C1: skip files already exercised by some existing test (not a real gap)
      const covered = coveredFiles.has(file) || coveredFiles.has(`packages/desktop-client/${file}`);
      if (process.env.RQ2_REQUIRE_GAP === '1' && covered) continue;
      candidates.push({
        project: adapter.name,
        prev: row.prev,
        sha: row.sha,
        file,
        score,
        addNodes: fallbackNodes,
        newCode,
        covered,
      });
    }
  }
  return candidates;
}

async function generateRowsForProject({ adapter, contexts, client, limit = Infinity }) {
  const chosen = pickUiBearingContexts(contexts, limit);
  const annotate = [];
  const unblind = {};
  const details = [];
  let i = 0;

  // existing passing tests in the project, for Graph-RAG few-shot templates
  const existingTests = collectExistingTests(adapter);

  for (const ctx of chosen) {
    const title = `${adapter.name} ${path.basename(ctx.file)} changed UI`;
    console.log(`[${adapter.name}] generating ${ctx.file} (${i / 2 + 1}/${chosen.length})`);
    // Graph-RAG: pull 1-2 existing tests from the same module/route as templates
    const shots = pickFewShotTemplates(existingTests, { file: ctx.file, route: ctx.route }, { limit: 2 });
    const diffSpec = ctx.addNodes.length
      ? cleanGeneratedSpec(await completeWithRetry(() => client.complete(
        buildGapPromptWithFewShot({ addNodes: ctx.addNodes, title, route: ctx.route, shots, gapFile: ctx.file }),
        { fallback: specFromUiNodes(ctx.addNodes, { title }) },
      )))
      : specFromUiNodes(buildAddNodesFromDomSignals(ctx.newCode), { title });
    // C3: optional bounded execution feedback (default off; Pass@1 stays the headline)
    let fb = null;
    if (process.env.RQ2_EXEC_FEEDBACK === '1') {
      fb = await generateWithFeedback({ adapter, ctx, client, shots, id: `fb_${i + 1}` });
    }
    const nodiffSpec = cleanGeneratedSpec(await completeWithRetry(() => client.complete(buildPromptNoDiff({ appName: adapter.name }), { fallback: diffSpec })));

    const routeLabel = `${adapter.name}:${ctx.file}`;
    const diffId = `r${String(++i).padStart(3, '0')}`;
    annotate.push({ case_id: diffId, route: routeLabel, gap_file: ctx.file, spec: diffSpec });
    unblind[diffId] = { arm: 'diff', project: adapter.name, prev: ctx.prev, sha: ctx.sha, gap_file: ctx.file, score: ctx.score, fewshot: shots.map((s) => s.file), pass_at_1: fb ? fb.passAt1 : null, pass_at_n: fb ? fb.passAtN : null };

    const ndId = `r${String(++i).padStart(3, '0')}`;
    annotate.push({ case_id: ndId, route: routeLabel, gap_file: ctx.file, spec: nodiffSpec });
    unblind[ndId] = { arm: 'nodiff', project: adapter.name, prev: ctx.prev, sha: ctx.sha, gap_file: ctx.file, score: ctx.score };

    details.push({ project: adapter.name, prev: ctx.prev, sha: ctx.sha, gap_file: ctx.file, score: ctx.score, add_nodes: ctx.addNodes.length, fewshot: shots.length, covered: !!ctx.covered, pass_at_1: fb ? fb.passAt1 : null, pass_at_n: fb ? fb.passAtN : null });
  }
  return { annotate, unblind, details, contexts: chosen.length };
}

// Files that at least one existing test executes a named function in (from the
// project's per-test CDP coverage). Empty set when coverage is unavailable, in
// which case RQ2_REQUIRE_GAP=1 falls back to "treat all as gaps".
function coveredFileSet(adapter) {
  const set = new Set();
  const dir = path.join(adapter.runAbs, adapter.covRel || 'cov_pertest');
  if (!fs.existsSync(dir)) return set;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    let o; try { o = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { continue; }
    const funcs = o.funcs || {};
    for (const [file, names] of Object.entries(funcs)) {
      if (Array.isArray(names) && names.length) set.add(file.replace(/^\/+/, ''));
    }
    for (const file of o.files || []) set.add(String(file).replace(/^\/+/, ''));
  }
  return set;
}

// C3: bounded execution-feedback loop. Write the spec into the project, run it,
// and feed the Playwright error back for up to `maxRounds` repairs. Reports both
// Pass@1 (first attempt, the original metric) and Pass@N (after feedback).
function runGeneratedSpec(adapter, specCode, tag) {
  const dir = path.join(adapter.runAbs, adapter.specGlob || 'e2e');
  fs.mkdirSync(dir, { recursive: true });
  const rel = path.join(adapter.specGlob || 'e2e', `__gen_${tag}.spec.ts`);
  const abs = path.join(adapter.runAbs, rel);
  fs.writeFileSync(abs, specCode);
  let out = '', ok = true;
  try {
    execSync(adapter.testOneCmd.replace('{spec}', JSON.stringify(rel)), { cwd: adapter.runAbs, stdio: 'pipe', timeout: 180000 });
  } catch (e) {
    ok = false;
    out = `${e.stdout || ''}\n${e.stderr || ''}`.slice(-3000);
  }
  fs.rmSync(abs, { force: true });
  return { ok, error: out };
}

async function generateWithFeedback({ adapter, ctx, client, shots, id, maxRounds = 3 }) {
  const basePrompt = buildGapPromptWithFewShot({ addNodes: ctx.addNodes, title: `${adapter.name} ${path.basename(ctx.file)}`, route: ctx.route, shots, gapFile: ctx.file });
  let spec = cleanGeneratedSpec(await completeWithRetry(() => client.complete(basePrompt, { fallback: specFromUiNodes(ctx.addNodes, { title: id }) })));
  const first = runGeneratedSpec(adapter, spec, id);
  const results = [{ round: 1, ok: first.ok }];
  let current = spec;
  for (let r = 2; r <= maxRounds && !results[results.length - 1].ok; r++) {
    const repairPrompt = [
      basePrompt,
      'Your previous attempt FAILED when executed:',
      results[results.length - 1].errorText || first.error,
      'The spec you wrote was:',
      current.slice(0, 3000),
      'Fix it so it runs and passes. Output ONLY the corrected test code.',
    ].join('\n\n');
    current = cleanGeneratedSpec(await completeWithRetry(() => client.complete(repairPrompt, { fallback: current })));
    const res = runGeneratedSpec(adapter, current, `${id}_r${r}`);
    results.push({ round: r, ok: res.ok, errorText: res.error });
  }
  return { spec: current, passAt1: results[0].ok, passAtN: results[results.length - 1].ok, rounds: results.length };
}

// Existing spec files in the project at the CURRENT checkout (leakage-safe:
// they predate the change, they are not the answer).
function collectExistingTests(adapter) {
  const root = path.join(adapter.runAbs, adapter.specGlob || 'e2e');
  const out = [];
  if (!fs.existsSync(root)) return out;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); continue; }
      if (!/\.(spec|test)\.[jt]sx?$/.test(e.name)) continue;
      let code = '';
      try { code = fs.readFileSync(p, 'utf8'); } catch { continue; }
      const route = (code.match(/goto\(\s*['"`]([^'"`?#]+)/) || [])[1] || null;
      out.push({ id: path.relative(adapter.runAbs, p), file: path.relative(adapter.runAbs, p), code, route });
    }
  };
  walk(root);
  return out;
}

async function main() {
  const adapterFile = process.argv[2];
  const rq1Jsonl = process.argv[3];
  const outPrefix = process.argv[4];
  const limit = parseInt(process.argv[5] || '999', 10);
  if (!adapterFile || !rq1Jsonl || !outPrefix) {
    console.error('usage: run_rq2_real.mjs <adapter.json> <rq1.jsonl> <outPrefix> [limit]');
    process.exit(1);
  }
  const adapter = loadAdapter(adapterFile);
  const rq1Rows = fs.readFileSync(rq1Jsonl, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
  const client = createClient();
  const contexts = collectCandidates({ adapter, rq1Rows });
  const { annotate, unblind, details, contexts: picked } = await generateRowsForProject({ adapter, contexts, client, limit });

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${outPrefix}_rq2_to_annotate.jsonl`), annotate.map((r) => JSON.stringify(r)).join('\n') + '\n');
  fs.writeFileSync(path.join(outDir, `${outPrefix}_rq2_unblind.json`), JSON.stringify(unblind, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, `${outPrefix}_rq2_candidates.json`), JSON.stringify({
    project: adapter.name,
    provider: client.provider,
    contexts_found: contexts.length,
    contexts_picked: picked,
    rows: details,
  }, null, 2) + '\n');
  console.log(`project=${adapter.name} provider=${client.provider} contexts_found=${contexts.length} picked=${picked} rows=${annotate.length}`);
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) main();
