// 第三步收尾修正：
// 1) 首轮 RQ1 基线受上一轮残留的 _gen_*.spec.ts 污染（full_suite=16），重跑干净基线；
// 2) 合并表误把第二步结果中的主 3 缺口（c03/c13/c19）计入，n 变成 13；按计划只取
//    x01–x05 + y01–y05，n=10。主 3 缺口仍只属于主表，不并入本表。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

const here = path.dirname(new URL(import.meta.url).pathname);
const WORK = '/tmp/expv3/work_exp';
const read = (p) => fs.readFileSync(p, 'utf8');
const writeJson = (n, o) => fs.writeFileSync(path.join(here, n), JSON.stringify(o, null, 2) + '\n');
const git = (args) => execSync(`git ${args}`, { cwd: WORK, stdio: 'pipe', maxBuffer: 20 * 1024 * 1024 }).toString();

function runSuite(covRel) {
  const abs = path.join(WORK, covRel);
  fs.rmSync(abs, { recursive: true, force: true });
  fs.rmSync(path.join(WORK, 'pw-report.json'), { force: true });
  try {
    execSync(`COV_OUT=${covRel} PW_JSON=pw-report.json npx playwright test`,
      { cwd: WORK, stdio: 'pipe', timeout: 180000, maxBuffer: 50 * 1024 * 1024 });
  } catch {}
  return { covDir: abs, report: path.join(WORK, 'pw-report.json') };
}
function loadCov(dir) {
  const map = {};
  if (!fs.existsSync(dir)) return map;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    const o = JSON.parse(read(path.join(dir, f)));
    map[o.test] = (o.files || []).map((p) => p.replace(/^\/+/, ''));
  }
  return map;
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

const GAPS = [
  { id: 'y01', tag: 'y01', prev: 'x05', cov: 'src/notifications.js' },
  { id: 'y02', tag: 'y02', prev: 'y01', cov: 'src/survey.js' },
  { id: 'y03', tag: 'y03', prev: 'y02', cov: 'src/downloads.js' },
  { id: 'y04', tag: 'y04', prev: 'y03', cov: 'src/support.js' },
  { id: 'y05', tag: 'y05', prev: 'y04', cov: 'src/reports.js' },
];

const rq2 = JSON.parse(read(path.join(here, 'rq2_new10_results.json')));
const manifest = JSON.parse(read(path.join(here, 'manifest_expansion_v2.json')));

// 1) 干净 RQ1（tests/ 此时仅有 6 个既有 spec）
const rq1 = { generated_at: new Date().toISOString(), gaps: [], note: '首轮受残留 _gen_*.spec.ts 污染后重跑；tests/ 仅含 6 个既有 spec' };
for (const g of GAPS) {
  git(`checkout -q ${g.tag}`);
  const changed = git(`diff --diff-filter=AM ${g.prev} ${g.tag} -- app/public/src`)
    .split('\n').filter((l) => l.startsWith('+++ b/app/public/src/'))
    .map((l) => 'src/' + l.slice('+++ b/app/public/src/'.length));
  const run = runSuite(`cov/rq1/${g.tag}`);
  const cov = loadCov(run.covDir);
  const failed = [...parseFailed(run.report)];
  const affected = Object.entries(cov).filter(([, files]) => files.includes(g.cov)).map(([id]) => id);
  rq1.gaps.push({
    gap_id: g.id, tag: g.tag, parent_tag: g.prev, changed_files: changed,
    full_suite: Object.keys(cov).length, baseline_failed: failed,
    affected_existing_specs: affected, coverage: cov,
    expected_affected: manifest.gaps.find((x) => x.gap_id === g.id).expected_affected,
  });
  console.log(`RQ1 ${g.tag}: full=${Object.keys(cov).length} failed=${failed.length} affected=${affected.length}`);
}
writeJson('rq1_new10.json', rq1);
rq2.rq1 = rq1;
rq2.rq1_fixed_at = new Date().toISOString();
writeJson('rq2_new10_results.json', rq2);

// 2) 合并 10 缺口（仅 x01–x05 + y01–y05）
const prev = JSON.parse(read(path.join(here, '..', 'new5_v2_20261108', 'rq2_new5_v2_results.json')));
const prevX = prev.gaps.filter((g) => /^x0[1-5]$/.test(g.gap_id));
const combined = [];
for (const g of prevX) {
  combined.push({
    gap_id: g.gap_id, route: g.route, batch: 'stage3_v2_reused',
    arms: {
      diff: { ...pick(g.arms.diff) }, nodiff: { ...pick(g.arms.nodiff) },
    },
  });
}
function pick(a) {
  return {
    executable: a.executable, change_relevant: a.change_relevant,
    injected: a.new5_v2.injected, killed: a.new5_v2.killed,
    mutation_score: a.new5_v2.mutation_score, by_class: a.new5_v2.by_class,
    change_sensitive: a.change_sensitive, semantic_auto: a.semantic_auto,
  };
}
for (const g of rq2.gaps) {
  combined.push({
    gap_id: g.gap_id, route: g.route, batch: 'new10',
    arms: { diff: { ...pick(g.arms.diff) }, nodiff: { ...pick(g.arms.nodiff) } },
  });
}

const summarize = (arm) => {
  const a = combined.map((g) => g.arms[arm]);
  return {
    n: a.length,
    execRate: +(a.filter((r) => r.executable).length / a.length).toFixed(4),
    relRate: +(a.filter((r) => r.change_relevant).length / a.length).toFixed(4),
    mutKillMean: +(a.reduce((s, r) => s + r.mutation_score, 0) / a.length).toFixed(4),
    changeSensRate: +(a.filter((r) => r.change_sensitive).length / a.length).toFixed(4),
    semanticAutoRate: +(a.filter((r) => r.semantic_auto).length / a.length).toFixed(4),
    injectedTotal: a.reduce((s, r) => s + r.injected, 0),
    killedTotal: a.reduce((s, r) => s + r.killed, 0),
  };
};
const classTotals = (arm) => {
  const o = {};
  for (const g of combined) for (const [c, v] of Object.entries(g.arms[arm].by_class || {})) {
    o[c] = o[c] || { injected: 0, killed: 0 };
    o[c].injected += v.injected;
    o[c].killed += v.killed;
  }
  for (const c of Object.values(o)) c.killRate = c.injected ? +(c.killed / c.injected).toFixed(4) : 0;
  return o;
};
const summary10 = { diff: summarize('diff'), nodiff: summarize('nodiff') };
const class10 = { diff: classTotals('diff'), nodiff: classTotals('nodiff') };

writeJson('rq2_new10_combined.json', {
  generated_at: new Date().toISOString(),
  sample: {
    n: combined.length, gaps: combined.map((g) => g.gap_id),
    composition: { stage3_v2_reused: prevX.map((g) => g.gap_id), new10: rq2.gaps.map((g) => g.gap_id) },
    excluded: { main_n3: ['c03', 'c13', 'c19'], reason: '主表 n=3 未改动，不属于扩样 10 缺口表' },
  },
  environment: { playwright: '1.54.0', chromium: '1181' },
  operator_set: 'v2 五类算子（testid / 文本 / 属性-可访问性 / 结构-可见性 / 条件逻辑-状态）',
  summary: summary10, by_class: class10, gaps: combined,
});

const fmt = (v) => (typeof v === 'number' ? v.toFixed(4).replace(/0+$/, '').replace(/\.$/, '') : v);
const gapTable = (arm) => [
  '| 缺口 | 路由 | 可执行 | change-relevant | 注入 | 杀伤 | 分数 | 版本敏感 | 自动语义有效 | 来源 |',
  '|---|---|---|---|---|---|---|---|---|---|',
  ...combined.map((g) => {
    const r = g.arms[arm];
    return `| ${g.gap_id} | ${g.route} | ${r.executable} | ${r.change_relevant} | ${r.injected} | ${r.killed} | ${fmt(r.mutation_score)} | ${r.change_sensitive} | ${r.semantic_auto} | ${g.batch === 'new10' ? '本批新增' : '第二步沿用'} |`;
  }),
].join('\n');
const sumTable = [
  '| 指标 | diff | nodiff |', '|---|---|---|',
  `| n | ${summary10.diff.n} | ${summary10.nodiff.n} |`,
  `| executable-rate | ${summary10.diff.execRate} | ${summary10.nodiff.execRate} |`,
  `| change-relevant-rate | ${summary10.diff.relRate} | ${summary10.nodiff.relRate} |`,
  `| 变异杀伤均值 | ${summary10.diff.mutKillMean} | ${summary10.nodiff.mutKillMean} |`,
  `| 版本敏感率 | ${summary10.diff.changeSensRate} | ${summary10.nodiff.changeSensRate} |`,
  `| 自动语义有效率 | ${summary10.diff.semanticAutoRate} | ${summary10.nodiff.semanticAutoRate} |`,
].join('\n');
const classTable = [
  '| 算子类 | 注入 | 杀伤 | 杀伤率 |', '|---|---:|---:|---:|',
  ...Object.entries(class10.diff).map(([c, v]) => `| ${c} | ${v.injected} | ${v.killed} | ${v.killRate} |`),
].join('\n');

fs.writeFileSync(path.join(here, 'rq2_new10_table.md'), [
  '# 表：受控缺口扩样 5 → 10（v2 五类算子）', '',
  '- 样本构成：10 个缺口 = 阶段三 x01–x05（5 个，第二步 v2 结果沿用）+ 本批新增 y01–y05（5 个）。',
  '- 主实验 c03/c13/c19（n=3）不在本表；主表未改动、不合并。',
  '- 环境：@playwright/test 1.54.0 + Chromium 1181；算子集与第二步 v2 一致。', '',
  '## 1. diff 臂逐缺口', '', gapTable('diff'), '',
  '## 2. nodiff 臂逐缺口', '', gapTable('nodiff'), '',
  '## 3. 汇总（n=10）', '', sumTable, '',
  '## 4. 算子类合计（diff）', '', classTable, '',
].join('\n') + '\n');

console.log('\n=== summary (n=10) ===\n' + sumTable);
console.log('\n=== diff by class ===');
for (const [c, v] of Object.entries(class10.diff)) console.log(`${c}: ${v.killed}/${v.injected} (${v.killRate})`);

const hashes = {};
for (const f of ['manifest_expansion_v2.json', 'rq1_new10.json', 'rq2_new10_results.json', 'rq2_new10_combined.json', 'rq2_new10_table.md', 'run_new10_v2.mjs', 'build_work_exp_v2.mjs', 'work_exp_v2.bundle', 'llm_usage.jsonl']) {
  hashes[f] = crypto.createHash('sha256').update(fs.readFileSync(path.join(here, f))).digest('hex');
}
writeJson('SHA256SUMS_NEW10.json', hashes);
