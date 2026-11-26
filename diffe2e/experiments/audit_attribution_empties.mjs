// Attribution-completeness audit for H2'.
//
// For every transition, report each changed source file whose diff yields NO
// function/variable/route entity. Such a file is either comment-only noise
// (selecting 0 is correct) or an unattributed semantic change, which now triggers
// a conservative file-level fallback in run_graph_selection / run_rq1_real_graph.
//
// Usage:
//   node experiments/audit_attribution_empties.mjs                 # controlled subject
//   node experiments/audit_attribution_empties.mjs <adapter.json>  # real project (9/5 transitions)
//
// Writes out/attribution_audit.md and out/attribution_audit.json.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseUnifiedDiff } from '../pipeline/src/diff.mjs';
import { changedEntitiesFromCode } from '../pipeline/src/astEntities.mjs';
import { isCommentOnlyChange, isTestPath } from '../pipeline/src/graph/attribution.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'out');
const git = (cwd, a) => { try { return execSync(`git ${a}`, { cwd, stdio: 'pipe' }).toString(); } catch { return ''; } };

function auditTransition({ label, type, prev, sha, repoAbs, srcPrefix, srcGlob, filterPrefix }) {
  const diff = git(repoAbs, `diff ${prev} ${sha} -- ${srcGlob}`);
  const parsed = parseUnifiedDiff(diff);
  const files = [];
  for (const f of parsed.files) {
    if (filterPrefix && !f.startsWith(filterPrefix)) continue;
    const rel = srcPrefix ? f.replace(srcPrefix, '') : f;
    if (isTestPath(rel)) continue; // test files are not application changes
    const newCode = git(repoAbs, `show ${sha}:${f}`);
    const oldCode = git(repoAbs, `show ${prev}:${f}`);
    const added = parsed.byFile[f]?.added || [];
    const removed = parsed.byFile[f]?.removed || [];
    const ents = changedEntitiesFromCode(newCode || oldCode, [...added, ...removed], rel);
    const empty = ents.length === 0;
    const commentOnly = empty ? isCommentOnlyChange({ addedLines: added, removedLines: removed }, oldCode, newCode, rel) : false;
    files.push({
      file: f, entities: ents.map((e) => `${e.kind}:${e.name}`), empty,
      commentOnly, fallback: empty && !commentOnly,
      added: added.length, removed: removed.length,
    });
  }
  return { label, type, prev, sha, files };
}

function controlled() {
  const WORK = path.join(here, '..', 'subject', 'work');
  const manifest = JSON.parse(fs.readFileSync(path.join(here, '..', 'subject', 'history', 'manifest.json'), 'utf8'));
  const rows = [];
  for (let i = 1; i < manifest.length; i++) {
    const o = manifest[i - 1].tag, n = manifest[i].tag;
    rows.push(auditTransition({
      label: n, type: manifest[i].type, prev: o, sha: n,
      repoAbs: WORK, srcPrefix: 'app/public/', srcGlob: 'app/public/src', filterPrefix: 'app/public/src/',
    }));
  }
  return rows;
}

async function real(adapterFile) {
  const { loadAdapter } = await import('./real/engine.mjs');
  const adapter = loadAdapter(adapterFile);
  const jsonl = path.join(OUT, 'real', `${adapter.name}_rq1.jsonl`);
  const transitions = fs.readFileSync(jsonl, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const srcGlob = Array.isArray(adapter.srcGlobs) ? adapter.srcGlobs.join(' ') : adapter.srcGlob;
  const rows = [];
  for (const t of transitions) {
    rows.push(auditTransition({
      label: `${t.prev.slice(0, 7)}→${t.sha.slice(0, 7)}`, type: 'real',
      prev: t.prev, sha: t.sha, repoAbs: adapter.repoAbs, srcPrefix: '', srcGlob, filterPrefix: '',
    }));
  }
  return rows;
}

function render(rows, title) {
  const lines = [`## ${title}`, '', '| 过渡 | 类型 | 文件 | 实体 | EMPTY | 纯注释 | 回退文件级 |', '|---|---|---|---|---|---|---|'];
  for (const r of rows) {
    if (!r.files.length) { lines.push(`| ${r.label} | ${r.type} | (无源码改动) | — | — | — | — |`); continue; }
    for (const f of r.files) {
      lines.push(`| ${r.label} | ${r.type} | \`${f.file}\` | ${f.entities.length ? f.entities.join(', ') : '—'} | ${f.empty ? '是' : '否'} | ${f.empty ? (f.commentOnly ? '是' : '否') : '—'} | ${f.fallback ? '**是**' : '否'} |`);
    }
  }
  return lines;
}

const adapterFile = process.argv[2];
const rows = adapterFile ? await real(adapterFile) : controlled();
const title = adapterFile ? `真实项目 ${path.basename(adapterFile, '.json')}` : '受控主体（24 过渡）';
const emptyCount = rows.reduce((s, r) => s + r.files.filter((f) => f.empty).length, 0);
const fallbackCount = rows.reduce((s, r) => s + r.files.filter((f) => f.fallback).length, 0);
const commentCount = rows.reduce((s, r) => s + r.files.filter((f) => f.empty && f.commentOnly).length, 0);
const body = render(rows, title);
const md = [
  '# 归因完备性审计（H2′ 兜底）', '',
  `- EMPTY 实体文件：${emptyCount}`,
  `- 其中纯注释/空行（选 0 正确）：${commentCount}`,
  `- 其中不可归因的语义改动（触发文件级回退）：${fallbackCount}`,
  '', ...body, '',
  '> 口径：EMPTY = 行号→实体映射（`changedEntitiesFromCode`）没有返回任何函数/变量/路由；',
  '> 纯注释 = TypeScript scanner 证明每条改动行的非空白字符全部位于注释 trivia 内（模板字符串内的 `//` 不算注释）。',
].join('\n');
fs.mkdirSync(OUT, { recursive: true });
const suffix = adapterFile ? `_${path.basename(adapterFile, '.json')}` : '';
fs.writeFileSync(path.join(OUT, `attribution_audit${suffix}.md`), md + '\n');
fs.writeFileSync(path.join(OUT, `attribution_audit${suffix}.json`), JSON.stringify({ title, rows }, null, 2));
console.log(md);
