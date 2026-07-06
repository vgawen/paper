import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAdapter, gitIn } from './engine.mjs';
import { extractFromCode, semanticDiffNodes } from '../../pipeline/src/uidiff.mjs';
import { buildPromptNoDiff, cleanGeneratedSpec, extractDomSignals, generateFromUiNodes, specFromUiNodes } from '../../pipeline/src/generate.mjs';
import { createClient } from '../../pipeline/src/llm/client.mjs';

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
      candidates.push({
        project: adapter.name,
        prev: row.prev,
        sha: row.sha,
        file,
        score,
        addNodes: fallbackNodes,
        newCode,
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
  for (const ctx of chosen) {
    const title = `${adapter.name} ${path.basename(ctx.file)} changed UI`;
    console.log(`[${adapter.name}] generating ${ctx.file} (${i / 2 + 1}/${chosen.length})`);
    const diffSpec = ctx.addNodes.length
      ? (await completeWithRetry(() => generateFromUiNodes({ addNodes: ctx.addNodes, title, client }))).spec
      : specFromUiNodes(buildAddNodesFromDomSignals(ctx.newCode), { title });
    const nodiffSpec = cleanGeneratedSpec(await completeWithRetry(() => client.complete(buildPromptNoDiff({ appName: adapter.name }), { fallback: diffSpec })));

    const routeLabel = `${adapter.name}:${ctx.file}`;
    const diffId = `r${String(++i).padStart(3, '0')}`;
    annotate.push({ case_id: diffId, route: routeLabel, gap_file: ctx.file, spec: diffSpec });
    unblind[diffId] = { arm: 'diff', project: adapter.name, prev: ctx.prev, sha: ctx.sha, gap_file: ctx.file, score: ctx.score };

    const ndId = `r${String(++i).padStart(3, '0')}`;
    annotate.push({ case_id: ndId, route: routeLabel, gap_file: ctx.file, spec: nodiffSpec });
    unblind[ndId] = { arm: 'nodiff', project: adapter.name, prev: ctx.prev, sha: ctx.sha, gap_file: ctx.file, score: ctx.score };

    details.push({ project: adapter.name, prev: ctx.prev, sha: ctx.sha, gap_file: ctx.file, score: ctx.score, add_nodes: ctx.addNodes.length });
  }
  return { annotate, unblind, details, contexts: chosen.length };
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
