// 第二步：5 类变异算子改实现（v2）并重跑。
// 环境固定为 @playwright/test 1.54.0 + Chromium 1181（与阶段三 v1 相同，保证改前/改后可比较）。
// 复用阶段三保存的 diff/nodiff 用例原文，不重新调用 LLM；只改算子实现。
// 输出只写本目录，不改主表、冻结清单、论文。
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..', '..', '..'); // diffe2e/
const OLD = path.join(ROOT, 'experiments', 'out', 'expansion_20261108', 'gaps');
const WORK_EXP = '/tmp/expv2/work_exp';
const WORK_MAIN = '/tmp/expv2/work_main';
const OUT = here;
const PROBE = '--timeout=4000';
const norm = (p) => p.replace(/^\/+/, '');

const git = (args, cwd) => execSync(`git ${args}`, { cwd, stdio: 'pipe', maxBuffer: 20 * 1024 * 1024 }).toString();
const checkout = (cwd, tag) => git(`checkout -q ${tag}`, cwd);
const read = (p) => fs.readFileSync(p, 'utf8');

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
      const file = path.basename(spec.file || suite.file || '');
      if (!spec.ok) failed.add(`${file} > ${spec.title}`);
    }
    for (const s of suite.suites || []) walk(s);
  };
  for (const s of rep.suites || []) walk(s);
  return failed;
}
const findId = (cov, file) => Object.keys(cov).find((k) => k.startsWith(file + ' > ')) || '';

// ---- v2 算子：文本----------------------------------------------------------------
// v1 缺陷：只改第一个文本节点（通常 h1）；追加 " MUT" 后可被子串匹配吸收。
// v2：优先改“结果文本”（状态/计数/列表/结果段落），整段替换为无共享子串的文本。
const TEXT_RULES = {
  x01: ['Compact mode off', 'Mutated status'],
  x02: ['Thanks, ', 'Mutated '],
  x03: ["'Welcome aboard'", "'Mutated message'"],
  x04: ['out.textContent=`Total $', 'out.textContent=`Mutated $'],
  x05: ['Email support@example.com', 'Mutated contact'],
  c03: ["'10% off'", "'Mutated discount'"],
  c13: ['data-testid="wishlist-count">0<', 'data-testid="wishlist-count">9<'],
  c19: ['Use the demo.', 'Mutated answer'],
};

function textMutants(code, gid) {
  const [from, to] = TEXT_RULES[gid];
  const mutated = code.replace(from, to);
  if (mutated === code) throw new Error(`text rule not applied: ${gid}`);
  return [{ class: 'text', kind: 'result-text-replace', token: from, code: mutated }];
}

// ---- v2 算子：属性/可访问性 ------------------------------------------------------
// v1 缺陷：只改第一个 aria-label/placeholder，且追加 " MUT" 仍被 getByLabel/getByRole 子串匹配吸收。
// v2：按“控件”整链替换（label 文本 + aria-label 一起改），并单独覆盖 role、按钮可访问名、禁用态。
function attrMutants(code, gid) {
  const out = [];
  const push = (kind, token, mutated) => {
    if (mutated !== code) out.push({ class: 'attribute', kind, token, code: mutated });
  };

  if (gid === 'x01') {
    let c = code.replace('aria-label="Compact mode"', 'aria-label="MutatedAccessible"');
    c = c.replace('/> Compact mode</label>', '/> MutatedLabel</label>');
    push('label+aria-replace', 'Compact mode', c);
  }
  if (gid === 'x02') {
    let c1 = code.replace('<label for="fb-rating">Rating</label>', '<label for="fb-rating">MutatedLabel</label>');
    c1 = c1.replace('aria-label="Rating"', 'aria-label="MutatedAccessible"');
    push('label+aria-replace', 'Rating', c1);
    let c2 = code.replace('<label for="fb-comment">Comment</label>', '<label for="fb-comment">MutatedLabel</label>');
    c2 = c2.replace('aria-label="Comment"', 'aria-label="MutatedAccessible"');
    push('label+aria-replace', 'Comment', c2);
    push('role-change', 'role=status', code.replace('role="status"', 'role="alert"'));
  }
  if (gid === 'x03') {
    push('placeholder-replace', 'filter messages', code.replace('placeholder="filter messages"', 'placeholder="MutatedAccessible"'));
  }
  if (gid === 'x04') {
    let c = code.replace('<label for="qty">Quantity</label>', '<label for="qty">MutatedLabel</label>');
    c = c.replace('aria-label="Quantity"', 'aria-label="MutatedAccessible"');
    push('label+aria-replace', 'Quantity', c);
    push('role-change', 'role=status', code.replace('role="status"', 'role="alert"'));
  }
  if (gid === 'x05') {
    push('aria-replace', 'Contact details', code.replace('aria-label="Contact details"', 'aria-label="MutatedAccessible"'));
  }

  const BTN = {
    x02: '>Send feedback</button>', x04: '>Calculate total</button>', x05: '>Show contact details</button>',
    c03: '>Apply</button>', c13: '>Save</button>', c19: '>Show answer</button>',
  };
  if (BTN[gid]) {
    const token = BTN[gid];
    push('button-name-replace', token, code.replace(token, '>Mutated action</button>'));
  }
  for (const g of ['c03', 'c13', 'c19']) {
    if (gid === g) {
      const m = code.match(/<button/);
      if (m) push('disable-button', 'button', code.replace('<button', '<button disabled'));
    }
  }
  return out;
}

// ---- testid / 结构 / 逻辑：与 v1 相同，保持可比 ------------------------------------
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
  x01: { desc: '三元分支对调', apply: (s) => s.replace("box.checked?'Compact mode on':'Compact mode off'", "box.checked?'Compact mode off':'Compact mode on'") },
  x02: { desc: '忽略用户选择，固定返回 Good', apply: (s) => s.replace('`Thanks, ${rating.value}`', '"Thanks, Good"') },
  x03: { desc: 'includes → startsWith', apply: (s) => s.replace('includes(q)', 'startsWith(q)') },
  x04: { desc: '边界 >=3 → >3', apply: (s) => s.replace('n>=3', 'n>3') },
  x05: { desc: 'toggle → 强制保持隐藏', apply: (s) => s.replace('details.hidden=!details.hidden;', 'details.hidden=true;') },
  c03: { desc: '三元分支对调', apply: (s) => s.replace("c.value==='SAVE10'?'10% off':'invalid'", "c.value==='SAVE10'?'invalid':'10% off'") },
  c13: { desc: 'n++ → n+=2', apply: (s) => s.replace('n++;', 'n+=2;') },
  c19: { desc: 'toggle → 强制保持隐藏', apply: (s) => s.replace('p.hidden=!p.hidden;', 'p.hidden=true;') },
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

// ---- 缺口与用例 ---------------------------------------------------------------
const GAPS = [
  { id: 'x01', route: '/settings', work: WORK_EXP, tag: 'x01', prev: 'x00', file: 'app/public/src/settings.js', cov: 'src/settings.js' },
  { id: 'x02', route: '/feedback', work: WORK_EXP, tag: 'x02', prev: 'x01', file: 'app/public/src/feedback.js', cov: 'src/feedback.js' },
  { id: 'x03', route: '/inbox', work: WORK_EXP, tag: 'x03', prev: 'x02', file: 'app/public/src/inbox.js', cov: 'src/inbox.js' },
  { id: 'x04', route: '/checkout', work: WORK_EXP, tag: 'x04', prev: 'x03', file: 'app/public/src/checkout.js', cov: 'src/checkout.js' },
  { id: 'x05', route: '/help', work: WORK_EXP, tag: 'x05', prev: 'x04', file: 'app/public/src/help.js', cov: 'src/help.js' },
  { id: 'c03', route: '/coupon', work: WORK_MAIN, tag: 'c03', prev: 'c02', file: 'app/public/src/coupon.js', cov: 'src/coupon.js' },
  { id: 'c13', route: '/wishlist', work: WORK_MAIN, tag: 'c13', prev: 'c12', file: 'app/public/src/wishlist.js', cov: 'src/wishlist.js' },
  { id: 'c19', route: '/faq', work: WORK_MAIN, tag: 'c19', prev: 'c18', file: 'app/public/src/faq.js', cov: 'src/faq.js' },
];

const v1 = JSON.parse(read(path.join(OLD, 'rq2_expansion_results.json')));
const v1Gap = Object.fromEntries(v1.gaps.map((g) => [g.gap_id, g]));

function summarize(rows, arm, key) {
  const arr = rows.map((g) => g.arms[arm]);
  const rate = (k) => +(arr.filter((r) => r[k]).length / arr.length).toFixed(4);
  const meanScore = +(arr.reduce((s, r) => s + (r[key].mutation_score || 0), 0) / arr.length).toFixed(4);
  return {
    n: arr.length,
    execRate: rate('executable'),
    relRate: rate('change_relevant'),
    mutKillMean: meanScore,
    changeSensRate: rate('change_sensitive'),
    semanticAutoRate: +(arr.filter((r) => r.executable && r.change_sensitive && r[key].killed > 0).length / arr.length).toFixed(4),
  };
}

function classTotals(rows, arm, key) {
  const out = {};
  for (const g of rows) {
    const r = g.arms[arm];
    for (const [c, v] of Object.entries(r[key].by_class || {})) {
      out[c] = out[c] || { injected: 0, killed: 0 };
      out[c].injected += v.injected;
      out[c].killed += v.killed;
    }
  }
  return out;
}

const rows = [];
for (const g of GAPS) {
  const arms = {};
  for (const arm of ['diff', 'nodiff']) {
    const specFile = `_gen_${arm}_${g.id}.spec.ts`;
    const spec = v1Gap[g.id].arms[arm].spec;
    fs.writeFileSync(path.join(g.work, 'tests', specFile), spec);
    checkout(g.work, g.tag);
    const run = runSuite(g.work, `cov/new5v2/${g.tag}_${arm}`, `tests/${specFile}`);
    const cov = loadCov(run.covDir);
    const failed = parseFailed(run.report);
    const genId = findId(cov, specFile);
    const executable = !!genId && !failed.has(genId);
    const change_relevant = (cov[genId] || []).includes(g.cov);

    let details = [];
    if (executable) {
      const code = read(path.join(g.work, g.file));
      for (const m of v2Mutants(code, g.id)) {
        fs.writeFileSync(path.join(g.work, g.file), m.code);
        const r = runSuite(g.work, `cov/new5v2/${g.tag}_${arm}_${details.length}`, `tests/${specFile} ${PROBE}`);
        details.push({ class: m.class, kind: m.kind, token: m.token, killed: parseFailed(r.report).has(genId) });
        git(`checkout -- ${g.file}`, g.work);
      }
    }
    const killed = details.filter((d) => d.killed).length;
    const rec = {
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
      checkout(g.work, g.prev);
      const old = runSuite(g.work, `cov/new5v2/${g.tag}_${arm}_old`, `tests/${specFile} ${PROBE}`);
      rec.change_sensitive = parseFailed(old.report).has(genId);
      checkout(g.work, g.tag);
    } else rec.change_sensitive = false;
    rec.semantic_auto = executable && rec.change_sensitive && rec.new5_v2.killed > 0;
    arms[arm] = rec;
    console.log(`${g.id} ${arm}: exec=${executable} rel=${change_relevant} v2=${killed}/${details.length} sens=${rec.change_sensitive}`);
  }
  rows.push({ gap_id: g.id, route: g.route, prev_tag: g.prev, tag: g.tag, arms });
}

const summary = { v1: v1.summary.new5, v2: { diff: summarize(rows, 'diff', 'new5_v2'), nodiff: summarize(rows, 'nodiff', 'new5_v2') } };
const v1AsRows = rows.map((g) => ({
  arms: {
    diff: { new5: v1Gap[g.gap_id].arms.diff.new5 },
    nodiff: { new5: v1Gap[g.gap_id].arms.nodiff.new5 },
  },
}));
const byClass = {
  v1: { diff: classTotals(v1AsRows, 'diff', 'new5'), nodiff: classTotals(v1AsRows, 'nodiff', 'new5') },
  v2: { diff: classTotals(rows, 'diff', 'new5_v2'), nodiff: classTotals(rows, 'nodiff', 'new5_v2') },
};

fs.writeFileSync(path.join(OUT, 'rq2_new5_v2_results.json'),
  JSON.stringify({ generated_at: new Date().toISOString(), environment: { playwright: '1.54.0', chromium: '1181' }, summary, by_class: byClass, gaps: rows }, null, 2) + '\n');
console.log('done');
