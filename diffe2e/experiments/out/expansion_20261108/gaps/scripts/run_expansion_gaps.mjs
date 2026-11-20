// 阶段三驱动：扩展 RQ1 覆盖基线 + 8 缺口 × 2 臂（diff/nodiff）生成与评测。
//
// 两套变异算子严格分开：
//   old  : 与主实验 run_rq2.mjs#mutantsForGap 完全相同（testid 重命名 + 可见文本追加 MUT，k=3）
//   new5 : 5 类算子（testid / 文本 / 属性-可访问性 / 结构-可见性 / 条件逻辑-状态），每缺口 4–5 个
// 只写 expansion_20261108/gaps/，不覆盖主实验文件。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { generateForGap, buildPromptNoDiff, cleanGeneratedSpec } from '../../../../../pipeline/src/generate.mjs';
import { createClient } from '../../../../../pipeline/src/llm/client.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..', '..', '..', '..', '..'); // diffe2e/
const EXP = path.join(here, '..'); // out/expansion_20261108/gaps
const WORK_EXP = path.join(ROOT, 'subject', 'work_exp');
const WORK_MAIN = path.join(ROOT, 'subject', 'work_main_replica');
const OUT = EXP;

const norm = (p) => p.replace(/^\/+/, '');
const PROBE = '--timeout=4000';
const now = () => new Date().toISOString();

function git(args, cwd) { return execSync(`git ${args}`, { cwd, stdio: 'pipe', maxBuffer: 20 * 1024 * 1024 }).toString(); }
function checkout(cwd, tag) { git(`checkout -q ${tag}`, cwd); }
function read(p) { return fs.readFileSync(p, 'utf8'); }
function writeJson(name, obj) { fs.writeFileSync(path.join(OUT, name), JSON.stringify(obj, null, 2) + '\n'); }

function runSuite(cwd, covRel, spec = '') {
  const abs = path.join(cwd, covRel);
  fs.rmSync(abs, { recursive: true, force: true });
  fs.rmSync(path.join(cwd, 'pw-report.json'), { force: true });
  try {
    execSync(`COV_OUT=${covRel} PW_JSON=pw-report.json npx playwright test ${spec}`,
      { cwd, stdio: 'pipe', timeout: 180000, maxBuffer: 50 * 1024 * 1024 });
  } catch { /* 变异/旧版本运行失败是预期结果 */ }
  return { covDir: abs, report: path.join(cwd, 'pw-report.json') };
}

function loadCov(covDir) {
  const map = {};
  if (!fs.existsSync(covDir)) return map;
  for (const f of fs.readdirSync(covDir)) {
    if (!f.endsWith('.json')) continue;
    const o = JSON.parse(read(path.join(covDir, f)));
    map[o.test] = (o.files || []).map(norm);
  }
  return map;
}

function parseFailed(reportPath) {
  const failed = new Set();
  if (!fs.existsSync(reportPath)) return failed;
  const rep = JSON.parse(read(reportPath));
  const walk = (suite) => {
    for (const spec of suite.specs || []) {
      const status = spec.ok ? 'passed' : 'failed';
      const file = path.basename(spec.file || suite.file || '');
      if (status !== 'passed') failed.add(`${file} > ${spec.title}`);
    }
    for (const s of suite.suites || []) walk(s);
  };
  for (const s of rep.suites || []) walk(s);
  return failed;
}

const findId = (cov, file) => Object.keys(cov).find((k) => k.startsWith(file + ' > ')) || '';

// ---- 旧算子集：与主实验逐字一致 --------------------------------------------
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

// ---- 5 类算子集 -------------------------------------------------------------
function attrMutant(code) {
  for (const re of [/aria-label="([^"]+)"/, /placeholder="([^"]+)"/, /role="([^"]+)"/, /name="([^"]+)"/]) {
    const m = code.match(re);
    if (m) return { class: 'attribute', kind: re.source.split('=')[0].replace('/', ''), token: m[1], code: code.replace(m[0], m[0].replace(`"${m[1]}"`, `"${m[1]} MUT"`)) };
  }
  const btn = code.match(/<button([^>]*)>/);
  if (btn) return { class: 'attribute', kind: 'disable', token: 'button', code: code.replace(btn[0], `<button disabled${btn[1]}>`) };
  return null;
}

function structureMutant(code) {
  const open = [...code.matchAll(/<(p|span|ul|section)([^>]*)>/g)]
    .filter((m) => /data-testid="[^"]*(status|msg|count|total|body|list|results)[^"]*"/.test(m[0]) ||
      /role="status"/.test(m[0]) || /\bhidden\b/.test(m[0]));
  const target = open[open.length - 1];
  if (!target) return null;
  const tag = target[1];
  const full = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`);
  const m = code.match(full);
  if (!m) return null;
  return { class: 'structure', kind: 'remove', token: `<${tag}>`, code: code.replace(m[0], '') };
}

const LOGIC_RULES = {
  x01: { desc: '三元分支对调', apply: (s) => s.replace("box.checked?'Compact mode on':'Compact mode off'", "box.checked?'Compact mode off':'Compact mode on'") },
  x02: { desc: '忽略用户选择，固定返回 Good', apply: (s) => s.replace('`Thanks, ${rating.value}`', '"Thanks, Good"') },
  x03: { desc: 'includes → startsWith（过滤语义改变）', apply: (s) => s.replace('includes(q)', 'startsWith(q)') },
  x04: { desc: '边界 >=3 → >3', apply: (s) => s.replace('n>=3', 'n>3') },
  x05: { desc: 'toggle → 强制保持隐藏', apply: (s) => s.replace('details.hidden=!details.hidden;', 'details.hidden=true;') },
  c03: { desc: '三元分支对调', apply: (s) => s.replace("c.value==='SAVE10'?'10% off':'invalid'", "c.value==='SAVE10'?'invalid':'10% off'") },
  c13: { desc: 'n++ → n+=2', apply: (s) => s.replace('n++;', 'n+=2;') },
  c19: { desc: 'toggle → 强制保持隐藏', apply: (s) => s.replace('p.hidden=!p.hidden;', 'p.hidden=true;') },
};

function new5MutantsForGap(code, gapId) {
  const res = [];
  const tid = code.match(/data-testid="([^"]+)"/);
  if (tid) res.push({ class: 'testid', kind: 'rename', token: tid[1], code: code.replace(`data-testid="${tid[1]}"`, `data-testid="${tid[1]}-MUT"`) });

  const textToken = [...code.matchAll(/>([A-Za-z][A-Za-z .!?]{2,40})</g)].map((m) => m[1]).find((t) => !t.includes('MUT'));
  if (textToken) res.push({ class: 'text', kind: 'append', token: textToken, code: code.replace(textToken, `${textToken} MUT`) });

  const attr = attrMutant(code);
  if (attr) res.push(attr);
  const st = structureMutant(code);
  if (st) res.push(st);

  const rule = LOGIC_RULES[gapId];
  if (rule) {
    const mutated = rule.apply(code);
    if (mutated !== code) res.push({ class: 'logic', kind: rule.desc, token: '', code: mutated });
  }
  return res;
}

// ---- 缺口描述 ---------------------------------------------------------------
const MAIN_GAPS = [
  { gap_id: 'c03', tag: 'c03', prev_tag: 'c02', route: '/coupon', gapRel: 'app/public/src/coupon.js', gapCovFile: 'src/coupon.js', work: WORK_MAIN, origin: '主实验缺口（扩展批次内重跑，不替换主表）' },
  { gap_id: 'c13', tag: 'c13', prev_tag: 'c12', route: '/wishlist', gapRel: 'app/public/src/wishlist.js', gapCovFile: 'src/wishlist.js', work: WORK_MAIN, origin: '主实验缺口（扩展批次内重跑，不替换主表）' },
  { gap_id: 'c19', tag: 'c19', prev_tag: 'c18', route: '/faq', gapRel: 'app/public/src/faq.js', gapCovFile: 'src/faq.js', work: WORK_MAIN, origin: '主实验缺口（扩展批次内重跑，不替换主表）' },
];

function loadMainSpecs() {
  const base = path.join(ROOT, 'experiments', 'out');
  const key = JSON.parse(read(path.join(base, 'rq2_unblind.json')));
  const rows = read(path.join(base, 'rq2_to_annotate.jsonl')).split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const byRoute = {};
  for (const r of rows) {
    const arm = key[r.case_id];
    if (!arm) continue;
    byRoute[r.route] = byRoute[r.route] || {};
    byRoute[r.route][arm] = r.spec;
  }
  return byRoute;
}

function rq1Baseline(gap) {
  checkout(WORK_EXP, gap.tag);
  const changed = git(`diff --diff-filter=AM ${gap.prev_tag} ${gap.tag} -- app/public/src`, WORK_EXP)
    .split('\n').filter((l) => l.startsWith('+++ b/app/public/src/')).map((l) => 'src/' + l.slice('+++ b/app/public/src/'.length));
  const run = runSuite(WORK_EXP, `cov/rq1/${gap.tag}`);
  const cov = loadCov(run.covDir);
  const failed = [...parseFailed(run.report)];
  const affected = Object.entries(cov).filter(([, files]) => files.map(norm).includes(gap.gapCovFile)).map(([id]) => id);
  return {
    tag: gap.tag, prev_tag: gap.prev_tag, changed_files: changed,
    full_suite: Object.keys(cov).length, baseline_failed: failed,
    affected_existing_specs: affected, coverage: cov,
  };
}

const exists = (s) => !!(s && s.trim());

async function main() {
  const manifest = JSON.parse(read(path.join(OUT, 'manifest_expansion.json')));
  const client = createClient();
  const oldBase = path.join(ROOT, 'experiments', 'out');
  const mainRef = JSON.parse(read(path.join(oldBase, 'rq2_results.json')).replace(/\n/g, ''));
  const mainSpecs = loadMainSpecs();

  const xGaps = manifest.gaps.map((g) => ({
    gap_id: g.gap_id, tag: g.tag, prev_tag: g.parent_tag, route: g.route,
    gapRel: g.source_file, gapCovFile: 'src/' + g.source_file.split('/').pop(),
    work: WORK_EXP, origin: '扩展历史新缺口', source_commit: g.source_commit,
    route_type: g.route_type, interaction: g.interaction, signal_density: g.signal_density,
  }));
  const allGaps = [...xGaps, ...MAIN_GAPS.map((g) => ({ ...g, route_type: '', interaction: '', signal_density: '' }))];

  // 1) 扩展 RQ1 覆盖基线
  const rq1 = { generated_at: now(), gaps: [] };
  for (const g of xGaps) {
    const b = rq1Baseline(g);
    rq1.gaps.push({ gap_id: g.gap_id, route: g.route, ...b, expected_affected: manifest.gaps.find((x) => x.gap_id === g.gap_id).expected_affected });
    console.log(`RQ1 ${g.tag} ${g.route}: full_suite=${b.full_suite} failed=${b.baseline_failed.length} affected=${b.affected_existing_specs.length}`);
  }
  writeJson('rq1_expansion.json', rq1);

  // 2) 生成两臂（x 缺口用 DeepSeek；主 3 缺口复用已冻结的主实验 spec）
  const gens = {};
  for (const g of xGaps) {
    checkout(WORK_EXP, g.tag);
    const code = read(path.join(WORK_EXP, g.gapRel));
    const title = `generated ${g.route} smoke`;
    const { spec } = await generateForGap({ route: g.route, code, title, client });
    const nodiffSpec = cleanGeneratedSpec(await client.complete(buildPromptNoDiff({ appName: 'demo-app' }), { fallback: spec }));
    const diffFile = `_gen_${g.gap_id}.spec.ts`;
    const ndFile = `_gen_nodiff_${g.gap_id}.spec.ts`;
    fs.writeFileSync(path.join(WORK_EXP, 'tests', diffFile), spec);
    fs.writeFileSync(path.join(WORK_EXP, 'tests', ndFile), nodiffSpec);
    gens[g.gap_id] = { diff: { file: diffFile, spec }, nodiff: { file: ndFile, spec: nodiffSpec } };
  }
  for (const g of MAIN_GAPS) {
    if (!exists(mainSpecs[g.route]?.diff) || !exists(mainSpecs[g.route]?.nodiff)) throw new Error(`missing main spec for ${g.route}`);
    checkout(WORK_MAIN, g.tag);
    const diffFile = `_gen_${g.gap_id}.spec.ts`;
    const ndFile = `_gen_nodiff_${g.gap_id}.spec.ts`;
    fs.writeFileSync(path.join(WORK_MAIN, 'tests', diffFile), mainSpecs[g.route].diff);
    fs.writeFileSync(path.join(WORK_MAIN, 'tests', ndFile), mainSpecs[g.route].nodiff);
    gens[g.gap_id] = { diff: { file: diffFile, spec: mainSpecs[g.route].diff, reused_main_spec: true },
      nodiff: { file: ndFile, spec: mainSpecs[g.route].nodiff, reused_main_spec: true } };
  }

  // 3) 逐缺口逐臂评测
  const gapsOut = [];
  for (const g of allGaps) {
    checkout(g.work, g.tag);
    const gapCode = read(path.join(g.work, g.gapRel));
    const arms = {};
    for (const arm of ['diff', 'nodiff']) {
      const specFile = gens[g.gap_id][arm].file;
      checkout(g.work, g.tag);
      const run = runSuite(g.work, `cov/rq2/${g.tag}_${arm}`, `tests/${specFile}`);
      const cov = loadCov(run.covDir);
      const failed = parseFailed(run.report);
      const genId = findId(cov, specFile);
      const executable = !!genId && !failed.has(genId);
      const change_relevant = (cov[genId] || []).map(norm).includes(g.gapCovFile);
      const rec = { spec_file: specFile, spec: gens[g.gap_id][arm].spec, reused_main_spec: !!gens[g.gap_id][arm].reused_main_spec,
        executable, change_relevant, gen_id: genId };

      for (const [setName, mutFn] of [['old', (code) => oldMutantsForGap(code, 3)], ['new5', (code, gid) => new5MutantsForGap(code, gid)]]) {
        const mutants = executable ? mutFn(gapCode, g.gap_id) : [];
        const details = [];
        for (const m of mutants) {
          fs.writeFileSync(path.join(g.work, g.gapRel), m.code);
          const r = runSuite(g.work, `cov/rq2mut/${g.tag}_${arm}_${setName}_${details.length}`, `tests/${specFile} ${PROBE}`);
          const killed = parseFailed(r.report).has(genId);
          details.push({ class: m.class, kind: m.kind, token: m.token, killed });
          git(`checkout -- ${g.gapRel}`, g.work);
        }
        const killed = details.filter((d) => d.killed).length;
        rec[setName] = {
          mutants: details, injected: details.length, killed,
          mutation_score: details.length ? +(killed / details.length).toFixed(4) : 0,
          by_class: Object.fromEntries([...new Set(details.map((d) => d.class))].map((c) => {
            const arr = details.filter((d) => d.class === c);
            return [c, { injected: arr.length, killed: arr.filter((d) => d.killed).length }];
          })),
        };
      }

      if (executable) {
        checkout(g.work, g.prev_tag);
        const old = runSuite(g.work, `cov/rq2diff/${g.tag}_${arm}`, `tests/${specFile} ${PROBE}`);
        rec.change_sensitive = parseFailed(old.report).has(genId);
        checkout(g.work, g.tag);
      } else {
        rec.change_sensitive = false;
      }
      rec.semantic_auto_old = executable && rec.change_sensitive && rec.old.killed > 0;
      rec.semantic_auto_new5 = executable && rec.change_sensitive && rec.new5.killed > 0;
      arms[arm] = rec;
      console.log(`${g.tag} ${g.route} [${arm}]: exec=${executable} rel=${change_relevant} old=${rec.old.killed}/${rec.old.injected} new5=${rec.new5.killed}/${rec.new5.injected} sens=${rec.change_sensitive} autoOld=${rec.semantic_auto_old} autoNew=${rec.semantic_auto_new5}`);
    }
    const meta = manifest.gaps.find((x) => x.gap_id === g.gap_id) || {};
    gapsOut.push({
      gap_id: g.gap_id, tag: g.tag, source_commit: g.source_commit || meta.source_commit || null,
      prev_tag: g.prev_tag, route: g.route, route_type: g.route_type || null,
      interaction: g.interaction || null, signal_density: g.signal_density || null,
      gap_rel: g.gapRel, gap_cov_file: g.gapCovFile, origin: g.origin,
      expected_affected: meta.expected_affected || null,
      rq1_reference: rq1.gaps.find((x) => x.gap_id === g.gap_id) || null,
      arms,
    });
  }

  // 4) 汇总（两套算子分别出表，不合并）
  const byArm = (rows, arm) => rows.map((g) => g.arms[arm]);
  const rate = (arr, k) => arr.length ? +(arr.filter((r) => r[k]).length / arr.length).toFixed(4) : 0;
  const mean = (arr, k) => arr.length ? +(arr.reduce((s, r) => s + r[k], 0) / arr.length).toFixed(4) : 0;
  const summary = {};
  for (const setName of ['old', 'new5']) {
    summary[setName] = {};
    for (const arm of ['diff', 'nodiff']) {
      const a = byArm(gapsOut, arm);
      summary[setName][arm] = {
        n: a.length,
        execRate: rate(a, 'executable'),
        relRate: rate(a, 'change_relevant'),
        mutKillMean: a.length ? +(a.reduce((s, r) => s + r[setName].mutation_score, 0) / a.length).toFixed(4) : 0,
        changeSensRate: rate(a, 'change_sensitive'),
        semanticAutoRate: rate(a, setName === 'old' ? 'semantic_auto_old' : 'semantic_auto_new5'),
      };
    }
  }
  // 逐类算子汇总（new5）
  const classAgg = {};
  for (const g of gapsOut) for (const arm of ['diff', 'nodiff']) {
    for (const m of g.arms[arm].new5.mutants) {
      classAgg[m.class] = classAgg[m.class] || { injected: 0, killed: 0 };
      classAgg[m.class].injected++;
      if (m.killed) classAgg[m.class].killed++;
    }
  }
  for (const c of Object.values(classAgg)) c.killRate = c.injected ? +(c.killed / c.injected).toFixed(4) : 0;

  const out = {
    generated_at: now(),
    provider: client.provider,
    batch: 'expansion_20261108/gaps',
    sample_sizes: {
      old_operators: { n: gapsOut.length, gaps: gapsOut.map((g) => g.gap_id), definition: 'testid 重命名 + 可见文本追加 MUT，每缺口最多 3 个（与主实验一致）' },
      new5_operators: { n: gapsOut.length, gaps: gapsOut.map((g) => g.gap_id), definition: '5 类算子：testid / 文本 / 属性-可访问性 / 结构-可见性 / 条件逻辑-状态，每缺口 4–5 个' },
      main_experiment: { n: 3, gaps: ['c03', 'c13', 'c19'], note: '主表 n=3 未改动；本批次 c03/c13/c19 为重跑结果，仅用于扩展表' },
    },
    main_reference_do_not_merge: mainRef.summary,
    summary,
    new5_by_class: classAgg,
    gaps: gapsOut,
  };
  writeJson('rq2_expansion_results.json', out);
  writeJson('rq2_expansion_mutants.json', gapsOut.map((g) => ({
    gap_id: g.gap_id, route: g.route,
    arms: Object.fromEntries(['diff', 'nodiff'].map((arm) => [arm, {
      old: g.arms[arm].old.mutants, new5: g.arms[arm].new5.mutants,
    }])),
  })));

  const rowsMd = (setName) => ['| arm | n | executable | change-relevant | mutation-kill (mean) | change-sensitive | semantic-valid (auto) |', '|---|---|---|---|---|---|---|',
    ...['diff', 'nodiff'].map((arm) => {
      const x = summary[setName][arm];
      return `| ${arm} | ${x.n} | ${x.execRate} | ${x.relRate} | ${x.mutKillMean} | ${x.changeSensRate} | ${x.semanticAutoRate} |`;
    })].join('\n');

  fs.writeFileSync(path.join(OUT, 'rq2_expansion_old.md'), [
    '# 表 5-5b（扩展批次，旧 2 类算子）', '',
    `- 样本量：n=${gapsOut.length}（5 个新缺口 + 主 3 缺口扩展重跑）`,
    '- 算子集与主实验 `run_rq2.mjs#mutantsForGap` 逐字一致；主表 n=3 不改，不合并统计。', '',
    rowsMd('old'), '',
    '> 主实验参考（只读，不并入本表）：diff 1.0 / 1.0 / 0.6667 / 1.0 / 1.0；nodiff 0.3333 / 0 / 0.2222 / 0.3333 / 0.3333（n=3）。',
  ].join('\n') + '\n');

  fs.writeFileSync(path.join(OUT, 'rq2_expansion_new5.md'), [
    '# 表 5-5c（扩展批次，5 类算子）', '',
    `- 样本量：n=${gapsOut.length}（5 个新缺口 + 主 3 缺口扩展重跑）`,
    '- 5 类算子：testid 重命名 / 可见文本修改 / 属性-可访问性 / 结构-可见性 / 条件逻辑-状态；每缺口注入 4–5 个。',
    '- 主表 n=3（2 类算子）不替换；本表为独立算子口径，不与表 5-5/5-5b 合并。', '',
    rowsMd('new5'), '',
    '| 算子类 | 注入 | 杀死 | 杀伤率 |', '|---|---:|---:|---:|',
    ...Object.entries(classAgg).map(([c, v]) => `| ${c} | ${v.injected} | ${v.killed} | ${v.killRate} |`),
  ].join('\n') + '\n');

  // 清理生成用例（保留 spec 文本在 JSON 中）
  for (const g of xGaps) {
    fs.rmSync(path.join(WORK_EXP, 'tests', `_gen_${g.gap_id}.spec.ts`), { force: true });
    fs.rmSync(path.join(WORK_EXP, 'tests', `_gen_nodiff_${g.gap_id}.spec.ts`), { force: true });
  }
  for (const g of MAIN_GAPS) {
    fs.rmSync(path.join(WORK_MAIN, 'tests', `_gen_${g.gap_id}.spec.ts`), { force: true });
    fs.rmSync(path.join(WORK_MAIN, 'tests', `_gen_nodiff_${g.gap_id}.spec.ts`), { force: true });
  }

  console.log('\n=== old operators ===\n' + rowsMd('old'));
  console.log('\n=== new5 operators ===\n' + rowsMd('new5'));
  console.log('\n=== new5 by class ===');
  for (const [c, v] of Object.entries(classAgg)) console.log(`${c}: ${v.killed}/${v.injected} (${v.killRate})`);

  // 完整性记录
  const hashes = {};
  for (const f of ['manifest_expansion.json', 'rq1_expansion.json', 'rq2_expansion_results.json', 'rq2_expansion_mutants.json', 'rq2_expansion_old.md', 'rq2_expansion_new5.md']) {
    hashes[f] = crypto.createHash('sha256').update(fs.readFileSync(path.join(OUT, f))).digest('hex');
  }
  writeJson('SHA256SUMS_EXPANSION_GAPS.json', hashes);
}

main();
