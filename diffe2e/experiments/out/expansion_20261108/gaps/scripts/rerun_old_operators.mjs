// 修正旧 2 类算子的 k=3 上限后，仅重跑 old 算子集（复用已保存的生成用例），
// 不重新生成、不改 new5 结果。原因：首轮把缺口 id（如 'x02'）当成了 k，导致
// `res.length >= k` 恒为 NaN、旧算子未按主实验口径截断到 3 个。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..', '..', '..', '..', '..');
const EXP = path.join(here, '..');
const WORK_EXP = path.join(ROOT, 'subject', 'work_exp');
const WORK_MAIN = path.join(ROOT, 'subject', 'work_main_replica');
const PROBE = '--timeout=4000';

const read = (p) => fs.readFileSync(p, 'utf8');
const writeJson = (n, o) => fs.writeFileSync(path.join(EXP, n), JSON.stringify(o, null, 2) + '\n');
function git(args, cwd) { return execSync(`git ${args}`, { cwd, stdio: 'pipe', maxBuffer: 20 * 1024 * 1024 }).toString(); }
function checkout(cwd, tag) { git(`checkout -q ${tag}`, cwd); }

function runSuite(cwd, covRel, spec = '') {
  fs.rmSync(path.join(cwd, covRel), { recursive: true, force: true });
  fs.rmSync(path.join(cwd, 'pw-report.json'), { force: true });
  try {
    execSync(`COV_OUT=${covRel} PW_JSON=pw-report.json npx playwright test ${spec}`,
      { cwd, stdio: 'pipe', timeout: 180000, maxBuffer: 50 * 1024 * 1024 });
  } catch { /* expected */ }
  return path.join(cwd, 'pw-report.json');
}

function parseFailed(reportPath) {
  const failed = new Set();
  if (!fs.existsSync(reportPath)) return failed;
  const rep = JSON.parse(read(reportPath));
  const walk = (suite) => {
    for (const spec of suite.specs || []) {
      const file = path.basename(spec.file || suite.file || '');
      if (!spec.ok) failed.add(`${file} > ${spec.title}`);
    }
    for (const s of suite.suites || []) walk(s);
  };
  for (const s of rep.suites || []) walk(s);
  return failed;
}

// 与主实验 run_rq2.mjs#mutantsForGap 完全一致（k=3）
function oldMutantsForGap(code, k = 3) {
  const out = [];
  for (const m of code.matchAll(/data-testid="([^"]+)"/g)) {
    out.push({ class: 'testid', kind: 'rename', token: m[1], code: code.replace(`data-testid="${m[1]}"`, `data-testid="${m[1]}-MUT"`) });
  }
  for (const t of [...code.matchAll(/>([A-Za-z][A-Za-z .!?]{2,40})</g)].map((m) => m[1])) {
    out.push({ class: 'text', kind: 'append', token: t, code: code.replace(t, `${t} MUT`) });
  }
  const seen = new Set(), res = [];
  for (const o of out) { if (seen.has(o.token)) continue; seen.add(o.token); res.push(o); if (res.length >= k) break; }
  return res;
}

function main() {
  const res = JSON.parse(read(path.join(EXP, 'rq2_expansion_results.json')));
  const norm = (p) => p.replace(/^\/+/, '');
  const mainWork = (gapId) => (['c03', 'c13', 'c19'].includes(gapId) ? WORK_MAIN : WORK_EXP);
  const prevTag = { c03: 'c02', c13: 'c12', c19: 'c18' };

  for (const g of res.gaps) {
    const work = mainWork(g.gap_id);
    checkout(work, g.tag);
    const gapCode = read(path.join(work, g.gap_rel));
    for (const arm of ['diff', 'nodiff']) {
      const rec = g.arms[arm];
      if (!rec.executable) {
        rec.old = { mutants: [], injected: 0, killed: 0, mutation_score: 0, by_class: {} };
        rec.semantic_auto_old = false;
        continue;
      }
      // 复用已保存的生成用例
      fs.writeFileSync(path.join(work, 'tests', rec.spec_file), rec.spec);
      const mutants = oldMutantsForGap(gapCode, 3);
      const details = [];
      for (const m of mutants) {
        fs.writeFileSync(path.join(work, g.gap_rel), m.code);
        const r = runSuite(work, `cov/rq2mut/${g.tag}_${arm}_old_rerun_${details.length}`, `tests/${rec.spec_file} ${PROBE}`);
        details.push({ class: m.class, kind: m.kind, token: m.token, killed: parseFailed(r).has(rec.gen_id) });
        git(`checkout -- ${g.gap_rel}`, work);
      }
      const killed = details.filter((d) => d.killed).length;
      rec.old = {
        mutants: details, injected: details.length, killed,
        mutation_score: details.length ? +(killed / details.length).toFixed(4) : 0,
        by_class: Object.fromEntries([...new Set(details.map((d) => d.class))].map((c) => {
          const arr = details.filter((d) => d.class === c);
          return [c, { injected: arr.length, killed: arr.filter((d) => d.killed).length }];
        })),
      };
      rec.semantic_auto_old = rec.executable && rec.change_sensitive && killed > 0;
      fs.rmSync(path.join(work, 'tests', rec.spec_file), { force: true });
      console.log(`${g.gap_id} [${arm}] old(k=3): ${killed}/${details.length} ${details.map((d) => d.class + ':' + d.token + '=' + (d.killed ? 'KILL' : '-')).join(' | ')}`);
    }
  }

  // 重算 old 汇总
  const rate = (arr, k) => arr.length ? +(arr.filter((r) => r[k]).length / arr.length).toFixed(4) : 0;
  for (const arm of ['diff', 'nodiff']) {
    const a = res.gaps.map((g) => g.arms[arm]);
    res.summary.old[arm] = {
      n: a.length,
      execRate: rate(a, 'executable'),
      relRate: rate(a, 'change_relevant'),
      mutKillMean: a.length ? +(a.reduce((s, r) => s + r.old.mutation_score, 0) / a.length).toFixed(4) : 0,
      changeSensRate: rate(a, 'change_sensitive'),
      semanticAutoRate: rate(a, 'semantic_auto_old'),
    };
  }
  res.old_operator_fix = {
    applied_at: new Date().toISOString(),
    reason: '首轮旧算子集把缺口 id 误当 k，未按主实验 k=3 截断；本文件中的 old 结果已按 k=3 重跑（复用同一生成用例），new5 结果未变。',
  };

  // 重新计算 classAgg（new5 未变，重算保证一致）
  const classAgg = {};
  for (const g of res.gaps) for (const arm of ['diff', 'nodiff']) {
    for (const m of g.arms[arm].new5.mutants) {
      classAgg[m.class] = classAgg[m.class] || { injected: 0, killed: 0 };
      classAgg[m.class].injected++;
      if (m.killed) classAgg[m.class].killed++;
    }
  }
  for (const c of Object.values(classAgg)) c.killRate = c.injected ? +(c.killed / c.injected).toFixed(4) : 0;
  res.new5_by_class = classAgg;

  writeJson('rq2_expansion_results.json', res);
  writeJson('rq2_expansion_mutants.json', res.gaps.map((g) => ({
    gap_id: g.gap_id, route: g.route,
    arms: Object.fromEntries(['diff', 'nodiff'].map((arm) => [arm, {
      old: g.arms[arm].old.mutants, new5: g.arms[arm].new5.mutants,
    }])),
  })));

  const rowsMd = (setName) => ['| arm | n | executable | change-relevant | mutation-kill (mean) | change-sensitive | semantic-valid (auto) |', '|---|---|---|---|---|---|---|',
    ...['diff', 'nodiff'].map((arm) => {
      const x = res.summary[setName][arm];
      return `| ${arm} | ${x.n} | ${x.execRate} | ${x.relRate} | ${x.mutKillMean} | ${x.changeSensRate} | ${x.semanticAutoRate} |`;
    })].join('\n');

  fs.writeFileSync(path.join(EXP, 'rq2_expansion_old.md'), [
    '# 表 5-5b（扩展批次，旧 2 类算子）', '',
    `- 样本量：n=${res.gaps.length}（5 个新缺口 + 主 3 缺口扩展重跑）`,
    '- 算子集与主实验 `run_rq2.mjs#mutantsForGap` 逐字一致（testid 重命名 + 可见文本追加 MUT，每缺口最多 3 个）；主表 n=3 不改，不合并统计。', '',
    rowsMd('old'), '',
    '> 主实验参考（只读，不并入本表）：diff 1.0 / 1.0 / 0.6667 / 1.0 / 1.0；nodiff 0.3333 / 0 / 0.2222 / 0.3333 / 0.3333（n=3）。',
    '> 注：本表 old 结果已按 k=3 重跑（首轮误把缺口 id 当 k）；生成用例与 new5 结果未变。',
  ].join('\n') + '\n');

  fs.writeFileSync(path.join(EXP, 'rq2_expansion_new5.md'), [
    '# 表 5-5c（扩展批次，5 类算子）', '',
    `- 样本量：n=${res.gaps.length}（5 个新缺口 + 主 3 缺口扩展重跑）`,
    '- 5 类算子：testid 重命名 / 可见文本修改 / 属性-可访问性 / 结构-可见性 / 条件逻辑-状态；每缺口注入 4–5 个。',
    '- 主表 n=3（2 类算子）不替换；本表为独立算子口径，不与表 5-5/5-5b 合并。', '',
    rowsMd('new5'), '',
    '| 算子类 | 注入 | 杀死 | 杀伤率 |', '|---|---:|---:|---:|',
    ...Object.entries(classAgg).map(([c, v]) => `| ${c} | ${v.injected} | ${v.killed} | ${v.killRate} |`),
  ].join('\n') + '\n');

  const hashes = {};
  for (const f of ['manifest_expansion.json', 'rq1_expansion.json', 'rq2_expansion_results.json', 'rq2_expansion_mutants.json', 'rq2_expansion_old.md', 'rq2_expansion_new5.md']) {
    hashes[f] = crypto.createHash('sha256').update(read(path.join(EXP, f))).digest('hex');
  }
  writeJson('SHA256SUMS_EXPANSION_GAPS.json', hashes);

  console.log('\n=== old operators (k=3, corrected) ===\n' + rowsMd('old'));
  console.log('\n=== new5 (unchanged) ===\n' + rowsMd('new5'));
}

main();
