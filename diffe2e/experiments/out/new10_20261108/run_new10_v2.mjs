// 第三步：在扩展历史追加的 y01–y05 上跑 RQ1 基线、两臂生成与 v2 五类算子；
// 再与第二步已完成的 x01–x05 v2 结果合并为 10 缺口单表。
//
// 约束：
// - 预注册清单 manifest_expansion_v2.json 必须先于本脚本生成（已由 build_work_exp_v2.mjs 完成）；
// - 不改主表、冻结清单、论文；不写阶段三目录；本批结果独立存放；
// - 环境与第二步一致（@playwright/test 1.54.0 + Chromium 1181）。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { generateForGap, buildPromptNoDiff, cleanGeneratedSpec } from '../../../pipeline/src/generate.mjs';
import { createClient } from '../../../pipeline/src/llm/client.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..', '..', '..'); // diffe2e/
const WORK = '/tmp/expv3/work_exp';
const OUT = here;
const OLD_V2 = path.join(here, '..', 'new5_v2_20261108', 'rq2_new5_v2_results.json');
const PROBE = '--timeout=4000';

const git = (args, cwd = WORK) => execSync(`git ${args}`, { cwd, stdio: 'pipe', maxBuffer: 20 * 1024 * 1024 }).toString();
const checkout = (tag) => git(`checkout -q ${tag}`);
const read = (p) => fs.readFileSync(p, 'utf8');
const writeJson = (name, obj) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(obj, null, 2) + '\n');

function runSuite(cwd, covRel, spec = '') {
  const abs = path.join(cwd, covRel);
  fs.rmSync(abs, { recursive: true, force: true });
  fs.rmSync(path.join(cwd, 'pw-report.json'), { force: true });
  try {
    execSync(`COV_OUT=${covRel} PW_JSON=pw-report.json npx playwright test ${spec}`,
      { cwd, stdio: 'pipe', timeout: 180000, maxBuffer: 50 * 1024 * 1024 });
  } catch {}
  return { covDir: abs, report: path.join(cwd, 'pw-report.json') };
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
const findId = (cov, file) => Object.keys(cov).find((k) => k.startsWith(file + ' > ')) || '';

// ---- v2 五类算子（与第二步实现一致，新增 y 缺口规则） -------------------------
const TEXT_RULES = {
  y01: ['Alerts disabled', 'Mutated status'],
  y02: ['msg.textContent=`Recorded ${', 'msg.textContent=`Mutated ${'],
  y03: ['>3 files<', '>Mutated count<'],
  y04: ['Waiting for input', 'Mutated status'],
  y05: ['>No report<', '>Mutated report<'],
};

function textMutants(code, gid) {
  const [from, to] = TEXT_RULES[gid];
  const mutated = code.replace(from, to);
  if (mutated === code) throw new Error(`text rule not applied: ${gid}`);
  return [{ class: 'text', kind: 'result-text-replace', token: from, code: mutated }];
}

function attrMutants(code, gid) {
  const out = [];
  const push = (kind, token, mutated) => {
    if (mutated !== code) out.push({ class: 'attribute', kind, token, code: mutated });
  };

  if (gid === 'y01') {
    let c = code.replace('aria-label="Enable alerts"', 'aria-label="MutatedAccessible"');
    c = c.replace('/> Enable alerts</label>', '/> MutatedLabel</label>');
    push('label+aria-replace', 'Enable alerts', c);
  }
  if (gid === 'y02') {
    let c1 = code.replace('<label for="sv-color">Favorite color</label>', '<label for="sv-color">MutatedLabel</label>');
    c1 = c1.replace('aria-label="Favorite color"', 'aria-label="MutatedAccessible"');
    push('label+aria-replace', 'Favorite color', c1);
    let c2 = code.replace('<label for="sv-note">Note</label>', '<label for="sv-note">MutatedLabel</label>');
    c2 = c2.replace('aria-label="Note"', 'aria-label="MutatedAccessible"');
    push('label+aria-replace', 'Note', c2);
    push('role-change', 'role=status', code.replace('role="status"', 'role="alert"'));
  }
  if (gid === 'y03') {
    push('button-name-replace', '>Clear list</button>', code.replace('>Clear list</button>', '>Mutated action</button>'));
    push('disable-button', 'button', code.replace('<button', '<button disabled'));
  }
  if (gid === 'y04') {
    let c = code.replace('<label for="sup-msg">Message</label>', '<label for="sup-msg">MutatedLabel</label>');
    c = c.replace('aria-label="Message"', 'aria-label="MutatedAccessible"');
    push('label+aria-replace', 'Message', c);
    push('role-change', 'role=status', code.replace('role="status"', 'role="alert"'));
  }
  if (gid === 'y05') {
    let c = code.replace('<label for="rp-period">Period</label>', '<label for="rp-period">MutatedLabel</label>');
    c = c.replace('aria-label="Period"', 'aria-label="MutatedAccessible"');
    push('label+aria-replace', 'Period', c);
    push('role-change', 'role=status', code.replace('role="status"', 'role="alert"'));
  }

  const BTN = {
    y02: '>Submit survey</button>',
    y04: '>Check message</button>',
    y05: '>Generate report</button>',
  };
  if (BTN[gid]) push('button-name-replace', BTN[gid], code.replace(BTN[gid], '>Mutated action</button>'));
  return out;
}

function testidMutants(code) {
  const m = code.match(/data-testid="([^"]+)"/);
  if (!m) return [];
  return [{ class: 'testid', kind: 'rename-first', token: m[1], code: code.replace(`data-testid="${m[1]}"`, `data-testid="${m[1]}-MUT"`) }];
}

function structureMutants(code) {
  const open = [...code.matchAll(/<(p|span|ul|section)([^>]*)>/g)]
    .filter((m) => /data-testid="[^"]*(status|msg|count|total|body|list|results)[^"]*"/.test(m[0]) ||
      /role="status"/.test(m[0]) || /\bhidden\b/.test(m[0]));
  const target = open[open.length - 1];
  if (!target) return [];
  const tag = target[1];
  const full = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`);
  const m = code.match(full);
  if (!m) return [];
  return [{ class: 'structure', kind: 'remove-result-container', token: `<${tag}>`, code: code.replace(m[0], '') }];
}

const LOGIC_RULES = {
  y01: { desc: '三元分支对调', apply: (s) => s.replace("box.checked?'Alerts enabled':'Alerts disabled'", "box.checked?'Alerts disabled':'Alerts enabled'") },
  y02: { desc: '忽略用户选择，固定返回 Red', apply: (s) => s.replace('`Recorded ${choice.value} choice`', '"Recorded Red choice"') },
  y03: { desc: '清空后计数不回零（0 files → 1 files）', apply: (s) => s.replace("count.textContent='0 files';", "count.textContent='1 files';") },
  y04: { desc: '阈值分支对调（>=20 的长短文案互换）', apply: (s) => s.replace("n>=20?'Message long enough':'Message too short'", "n>=20?'Message too short':'Message long enough'") },
  y05: { desc: '忽略周期选择，固定返回 Week', apply: (s) => s.replace('`Report for ${period.value}: 12 rows`', '"Report for Week: 12 rows"') },
};

function logicMutants(code, gid) {
  const rule = LOGIC_RULES[gid];
  if (!rule) return [];
  const mutated = rule.apply(code);
  return mutated === code ? [] : [{ class: 'logic', kind: rule.desc, token: '', code: mutated }];
}

function v2Mutants(code, gid) {
  return [...testidMutants(code), ...textMutants(code, gid), ...attrMutants(code, gid), ...structureMutants(code), ...logicMutants(code, gid)];
}

// ---- y 缺口 ----------------------------------------------------------------
const GAPS = [
  { id: 'y01', route: '/notifications', tag: 'y01', prev: 'x05', file: 'app/public/src/notifications.js', cov: 'src/notifications.js' },
  { id: 'y02', route: '/survey', tag: 'y02', prev: 'y01', file: 'app/public/src/survey.js', cov: 'src/survey.js' },
  { id: 'y03', route: '/downloads', tag: 'y03', prev: 'y02', file: 'app/public/src/downloads.js', cov: 'src/downloads.js' },
  { id: 'y04', route: '/support', tag: 'y04', prev: 'y03', file: 'app/public/src/support.js', cov: 'src/support.js' },
  { id: 'y05', route: '/reports', tag: 'y05', prev: 'y04', file: 'app/public/src/reports.js', cov: 'src/reports.js' },
];

function rq1Baseline(gap) {
  checkout(gap.tag);
  const changed = git(`diff --diff-filter=AM ${gap.prev} ${gap.tag} -- app/public/src`)
    .split('\n').filter((l) => l.startsWith('+++ b/app/public/src/'))
    .map((l) => 'src/' + l.slice('+++ b/app/public/src/'.length));
  const run = runSuite(WORK, `cov/rq1/${gap.tag}`);
  const cov = loadCov(run.covDir);
  const failed = [...parseFailed(run.report)];
  const affected = Object.entries(cov).filter(([, files]) => files.includes(gap.cov)).map(([id]) => id);
  return {
    tag: gap.tag, parent_tag: gap.prev, changed_files: changed,
    full_suite: Object.keys(cov).length, baseline_failed: failed,
    affected_existing_specs: affected, coverage: cov,
  };
}

async function main() {
  const started = new Date().toISOString();
  const manifest = JSON.parse(read(path.join(OUT, 'manifest_expansion_v2.json')));
  const client = createClient();
  const out = { generated_at: new Date().toISOString(), started_at: started, provider: client.provider,
    environment: { playwright: '1.54.0', chromium: '1181' }, manifest_sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(OUT, 'manifest_expansion_v2.json'))).digest('hex') };

  // 1) RQ1 基线
  const rq1 = { generated_at: new Date().toISOString(), gaps: [] };
  for (const g of GAPS) {
    const b = rq1Baseline(g);
    rq1.gaps.push({ gap_id: g.id, route: g.route, ...b, expected_affected: manifest.gaps.find((x) => x.gap_id === g.id).expected_affected });
    console.log(`RQ1 ${g.tag} ${g.route}: full=${b.full_suite} failed=${b.baseline_failed.length} affected=${b.affected_existing_specs.length}`);
  }
  writeJson('rq1_new10.json', rq1);

  // 2) 两臂生成（DeepSeek，temperature 默认；无 key 时 client 为 stub 并在报告中披露）
  const gens = {};
  for (const g of GAPS) {
    checkout(g.tag);
    const code = read(path.join(WORK, g.file));
    const { spec } = await generateForGap({ route: g.route, code, title: `generated ${g.route} smoke`, client });
    const nodiffSpec = cleanGeneratedSpec(await client.complete(buildPromptNoDiff({ appName: 'demo-app' }), { fallback: spec }));
    const diffFile = `_gen_diff_${g.id}.spec.ts`;
    const ndFile = `_gen_nodiff_${g.id}.spec.ts`;
    fs.writeFileSync(path.join(WORK, 'tests', diffFile), spec);
    fs.writeFileSync(path.join(WORK, 'tests', ndFile), nodiffSpec);
    gens[g.id] = { diff: { file: diffFile, spec }, nodiff: { file: ndFile, spec: nodiffSpec } };
    console.log(`generated ${g.id}: diff=${spec.split('\n').length} 行, nodiff=${nodiffSpec.split('\n').length} 行`);
  }

  // 3) 逐缺口逐臂评测（v2 五类算子）
  const rows = [];
  for (const g of GAPS) {
    checkout(g.tag);
    const gapCode = read(path.join(WORK, g.file));
    const arms = {};
    for (const arm of ['diff', 'nodiff']) {
      const specFile = gens[g.id][arm].file;
      checkout(g.tag);
      const run = runSuite(WORK, `cov/new10/${g.tag}_${arm}`, `tests/${specFile}`);
      const cov = loadCov(run.covDir);
      const failed = parseFailed(run.report);
      const genId = findId(cov, specFile);
      const executable = !!genId && !failed.has(genId);
      const change_relevant = (cov[genId] || []).includes(g.cov);

      const details = [];
      if (executable) {
        for (const m of v2Mutants(gapCode, g.id)) {
          fs.writeFileSync(path.join(WORK, g.file), m.code);
          const r = runSuite(WORK, `cov/new10/${g.tag}_${arm}_${details.length}`, `tests/${specFile} ${PROBE}`);
          details.push({ class: m.class, kind: m.kind, token: m.token, killed: parseFailed(r.report).has(genId) });
          git(`checkout -- ${g.file}`);
        }
      }
      const killed = details.filter((d) => d.killed).length;
      const rec = {
        spec_file: specFile, spec: gens[g.id][arm].spec,
        executable, change_relevant, gen_id: genId,
        new5_v2: {
          mutants: details, injected: details.length, killed,
          mutation_score: details.length ? +(killed / details.length).toFixed(4) : 0,
          by_class: Object.fromEntries([...new Set(details.map((d) => d.class))].map((c) => {
            const a = details.filter((d) => d.class === c);
            return [c, { injected: a.length, killed: a.filter((d) => d.killed).length }];
          })),
        },
      };
      if (executable) {
        checkout(g.prev);
        const old = runSuite(WORK, `cov/new10/${g.tag}_${arm}_sens`, `tests/${specFile} ${PROBE}`);
        rec.change_sensitive = parseFailed(old.report).has(genId);
        checkout(g.tag);
      } else rec.change_sensitive = false;
      rec.semantic_auto = executable && rec.change_sensitive && rec.new5_v2.killed > 0;
      arms[arm] = rec;
      console.log(`${g.id} ${arm}: exec=${executable} rel=${change_relevant} v2=${killed}/${details.length} sens=${rec.change_sensitive} auto=${rec.semantic_auto}`);
    }
    rows.push({ gap_id: g.id, route: g.route, prev_tag: g.prev, tag: g.tag, source_commit: manifest.gaps.find((x) => x.gap_id === g.id).source_commit, arms });
  }
  out.gaps = rows;
  out.rq1 = rq1;
  writeJson('rq2_new10_results.json', out);

  // 4) 合并 10 缺口（x01–x05 沿用第二步 v2 结果）
  const prev = JSON.parse(read(OLD_V2));
  const prevGaps = Object.fromEntries(prev.gaps.map((g) => [g.gap_id, g]));
  const combined = [];
  for (const g of prev.gaps) {
    combined.push({
      gap_id: g.gap_id, route: g.route, batch: 'stage3_v2_reused',
      arms: {
        diff: {
          executable: g.arms.diff.executable, change_relevant: g.arms.diff.change_relevant,
          injected: g.arms.diff.new5_v2.injected, killed: g.arms.diff.new5_v2.killed,
          mutation_score: g.arms.diff.new5_v2.mutation_score, by_class: g.arms.diff.new5_v2.by_class,
          change_sensitive: g.arms.diff.change_sensitive, semantic_auto: g.arms.diff.semantic_auto,
        },
        nodiff: {
          executable: g.arms.nodiff.executable, change_relevant: g.arms.nodiff.change_relevant,
          injected: g.arms.nodiff.new5_v2.injected, killed: g.arms.nodiff.new5_v2.killed,
          mutation_score: g.arms.nodiff.new5_v2.mutation_score, by_class: g.arms.nodiff.new5_v2.by_class,
          change_sensitive: g.arms.nodiff.change_sensitive, semantic_auto: g.arms.nodiff.semantic_auto,
        },
      },
    });
  }
  for (const g of rows) {
    combined.push({
      gap_id: g.gap_id, route: g.route, batch: 'new10',
      arms: {
        diff: {
          executable: g.arms.diff.executable, change_relevant: g.arms.diff.change_relevant,
          injected: g.arms.diff.new5_v2.injected, killed: g.arms.diff.new5_v2.killed,
          mutation_score: g.arms.diff.new5_v2.mutation_score, by_class: g.arms.diff.new5_v2.by_class,
          change_sensitive: g.arms.diff.change_sensitive, semantic_auto: g.arms.diff.semantic_auto,
        },
        nodiff: {
          executable: g.arms.nodiff.executable, change_relevant: g.arms.nodiff.change_relevant,
          injected: g.arms.nodiff.new5_v2.injected, killed: g.arms.nodiff.new5_v2.killed,
          mutation_score: g.arms.nodiff.new5_v2.mutation_score, by_class: g.arms.nodiff.new5_v2.by_class,
          change_sensitive: g.arms.nodiff.change_sensitive, semantic_auto: g.arms.nodiff.semantic_auto,
        },
      },
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
    sample: { n: combined.length, gaps: combined.map((g) => g.gap_id),
      composition: { stage3_v2_reused: prev.gaps.map((g) => g.gap_id), new10: rows.map((g) => g.gap_id) },
      note: '主 3 缺口 c03/c13/c19 不属于本表；主表 n=3 未改动，不与本表合并' },
    environment: { playwright: '1.54.0', chromium: '1181' },
    operator_set: 'v2 五类算子（testid / 文本 / 属性-可访问性 / 结构-可见性 / 条件逻辑-状态）',
    summary: summary10, by_class: class10, gaps: combined,
  });

  // 5) 表与报告
  const fmt = (v) => (typeof v === 'number' ? v.toFixed(4).replace(/0+$/, '').replace(/\.$/, '') : v);
  const gapTable = (arm) => [
    `| 缺口 | 路由 | 可执行 | change-relevant | 注入 | 杀伤 | 分数 | 版本敏感 | 自动语义有效 | 来源 |`,
    `|---|---|---|---|---|---|---|---|---|---|`,
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

  fs.writeFileSync(path.join(OUT, 'rq2_new10_table.md'), [
    '# 表：受控缺口扩样 5 → 10（v2 五类算子）', '',
    `- 样本构成：10 个缺口 = 阶段三 x01–x05（5 个，第二步 v2 结果沿用）+ 本批新增 y01–y05（5 个）。`,
    '- 主实验 c03/c13/c19（n=3）不在本表；主表未改动、不合并。',
    '- 环境：@playwright/test 1.54.0 + Chromium 1181；算子集与第二步 v2 一致。', '',
    '## 1. diff 臂逐缺口', '', gapTable('diff'), '',
    '## 2. nodiff 臂逐缺口', '', gapTable('nodiff'), '',
    '## 3. 汇总（n=10）', '', sumTable, '',
    '## 4. 算子类合计（diff）', '', classTable, '',
  ].join('\n') + '\n');

  // 清理生成用例（spec 文本已保存在 JSON）
  for (const g of GAPS) {
    fs.rmSync(path.join(WORK, 'tests', `_gen_diff_${g.id}.spec.ts`), { force: true });
    fs.rmSync(path.join(WORK, 'tests', `_gen_nodiff_${g.id}.spec.ts`), { force: true });
  }
  for (const g of GAPS) git(`checkout -- ${g.file}`);

  console.log('\n=== summary (n=10) ===\n' + sumTable);
  console.log('\n=== diff by class ===');
  for (const [c, v] of Object.entries(class10.diff)) console.log(`${c}: ${v.killed}/${v.injected} (${v.killRate})`);

  // 完整性记录
  const hashes = {};
  for (const f of ['manifest_expansion_v2.json', 'rq1_new10.json', 'rq2_new10_results.json', 'rq2_new10_combined.json', 'rq2_new10_table.md', 'run_new10_v2.mjs', 'build_work_exp_v2.mjs', 'work_exp_v2.bundle']) {
    hashes[f] = crypto.createHash('sha256').update(fs.readFileSync(path.join(OUT, f))).digest('hex');
  }
  writeJson('SHA256SUMS_NEW10.json', hashes);
}

main();
