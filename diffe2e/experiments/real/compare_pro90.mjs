// Like-for-like comparison of the ReproBreak semantic subset under two models.
//
//   flash: realproj/results/reprobreak_e2e_v2.json  (full pool, n_sem=90)
//   pro:   realproj/results/reprobreak_e2e_pro90.json (RB_SUBSET=semantic)
//
// The semantic subset is defined identically in both runs:
//   sem_applicable && !pre_had_equiv
// Exact-match = row.llm; semantic-equivalence = row.llm_sem.
// We report each run on its own subset AND on the intersection, because the two
// runs may not select exactly the same 90 cases (RB_LIMIT order).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const results = path.join(here, '..', '..', 'realproj', 'results');
const read = (f) => JSON.parse(fs.readFileSync(path.join(results, f), 'utf8'));

const flash = read('reprobreak_e2e_v2.json');
const pro = read('reprobreak_e2e_pro90.json');

const inSem = (r) => r.sem_applicable === true && r.pre_had_equiv === false;
const rowsFlash = (flash.rows || []).filter(inSem);
const rowsPro = (pro.rows || []).filter(inSem);

const byId = (rows) => new Map(rows.map((r) => [String(r.id), r]));
const mf = byId(rowsFlash), mp = byId(rowsPro);
const common = [...mf.keys()].filter((id) => mp.has(id));

function rates(rows) {
  const n = rows.length;
  const ok = rows.filter((r) => r.llm === true).length;
  const okSem = rows.filter((r) => r.llm_sem === true).length;
  const errors = rows.filter((r) => r.llm_error).length;
  return { n, exact: n ? +(ok / n).toFixed(4) : 0, semantic: n ? +(okSem / n).toFixed(4) : 0, errors };
}
const ratesFor = (ids, map) => rates(ids.map((id) => map.get(id)));

// Exact two-sided McNemar (binomial, p=0.5) on paired outcomes.
function choose(n, k) { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - i + 1) / i; return r; }
function mcnemar(b, c) {
  const n = b + c;
  if (!n) return { b, c, p: 1 };
  const k = Math.min(b, c);
  let tail = 0;
  for (let i = 0; i <= k; i++) tail += choose(n, i) / 2 ** n;
  return { b, c, p: +Math.min(1, 2 * tail).toFixed(4) };
}
function paired(key) {
  let b = 0, c = 0;
  for (const id of common) {
    const f = mf.get(id)[key] === true, p = mp.get(id)[key] === true;
    if (f && !p) b++; else if (!f && p) c++;
  }
  return mcnemar(b, c);
}

const report = {
  flash: { model: flash.model || 'deepseek-v4-flash', subset_n: rowsFlash.length, ...rates(rowsFlash) },
  pro: { model: pro.model || 'deepseek-v4-pro', subset_n: rowsPro.length, ...rates(rowsPro) },
  intersection_n: common.length,
  flash_on_intersection: ratesFor(common, mf),
  pro_on_intersection: ratesFor(common, mp),
  mcnemar: { exact: paired('llm'), semantic: paired('llm_sem') },
  only_flash: [...mf.keys()].filter((id) => !mp.has(id)),
  only_pro: [...mp.keys()].filter((id) => !mf.has(id)),
};

fs.writeFileSync(path.join(results, 'reprobreak_pro90_compare.json'), JSON.stringify(report, null, 2) + '\n');

const pct = (x) => `${(x * 100).toFixed(2)}%`;
const md = [
  '# ReproBreak 语义子集：flash vs pro 对照',
  '',
  '> 子集定义：`sem_applicable && !pre_had_equiv`（distinctive 锚点，且旧测试不含等价写法）。',
  '> exact = 修复结果包含真值 `new_locator`；semantic = 含语义等价定位器。',
  '',
  '| 口径 | 模型 | n | exact | semantic | 调用错误 |',
  '|---|---|---:|---:|---:|---:|',
  `| 各自子集 | flash | ${report.flash.n} | ${pct(report.flash.exact)} | ${pct(report.flash.semantic)} | ${report.flash.errors} |`,
  `| 各自子集 | pro | ${report.pro.n} | ${pct(report.pro.exact)} | ${pct(report.pro.semantic)} | ${report.pro.errors} |`,
  `| 交集 | flash | ${report.flash_on_intersection.n} | ${pct(report.flash_on_intersection.exact)} | ${pct(report.flash_on_intersection.semantic)} | ${report.flash_on_intersection.errors} |`,
  `| 交集 | pro | ${report.pro_on_intersection.n} | ${pct(report.pro_on_intersection.exact)} | ${pct(report.pro_on_intersection.semantic)} | ${report.pro_on_intersection.errors} |`,
  '',
  `- 仅 flash 子集包含：${report.only_flash.length} 条`,
  `- 仅 pro 子集包含：${report.only_pro.length} 条`,
  '',
  `- McNemar（语义等价，配对）：b=${report.mcnemar.semantic.b}、c=${report.mcnemar.semantic.c}、exact p=${report.mcnemar.semantic.p}`,
  `- McNemar（exact-match，配对）：b=${report.mcnemar.exact.b}、c=${report.mcnemar.exact.c}、exact p=${report.mcnemar.exact.p}`,
  '',
  '> 解读原则：若 pro 与 flash 在交集上接近（且 McNemar 不显著），说明全池低修复率主要不是模型降级造成的；',
  '> 若 pro 显著更高，则把 pro 作为该子集的上界报告，并改写"修复困难"的归因。',
].join('\n');
fs.writeFileSync(path.join(results, 'reprobreak_pro90_compare.md'), md + '\n');
console.log(md);
