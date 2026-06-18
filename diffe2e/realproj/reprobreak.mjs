// ReproBreak real-data sub-experiment (offline, CSV-based).
//
// ReproBreak (arXiv:2605.12158, github.com/rub-sq/ReproBreak) ships
// `locator_analysis.csv`: real structural locator-break pairs (old_locator,
// new_locator) mined from open-source Cypress/Playwright projects. The
// execution-validated 449-break subset lives in a gitignored SQLite DB
// (data/locator_break.db) reproduced via Docker; that heavier path is future
// work. Here we use the CSV ground truth to evaluate, offline and honestly:
//   E1  Characterization: framework / project / locator-type distributions.
//   E2  Semantic-UI-Diff addressability: what fraction of real breaks are a
//       change in a semantic anchor our UI diff tracks (testId/text/role-name/
//       href/label) vs structural CSS reshuffles / strategy switches.
//   E3  Deterministic repair-rewriter exact-match on the addressable subset,
//       GIVEN the oracle semantic signal (oldValue->newValue). This isolates
//       the repair *rewriting* mechanics on real Playwright/Cypress syntax;
//       signal-detection accuracy (deriving oldValue->newValue from the AUT
//       diff) needs source at each commit + execution and is flagged future.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { repairLocators, repairAssertions } from '../pipeline/src/repair.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const RESULTS = path.join(here, 'results');
const DEFAULT_CSV = path.join(here, 'clones', 'ReproBreak', 'locator_analysis.csv');

// --- minimal RFC4180 CSV parser (fields may contain commas, quotes, ""-escapes) ---
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  return rows.filter((r) => r.length === header.length).map((r) => Object.fromEntries(header.map((h, j) => [h, r[j]])));
}

const framework = (loc) => (loc.startsWith('cy.') ? 'cypress' : (/page\.|getBy|\.locator\(/.test(loc) ? 'playwright' : 'other'));

function locType(loc) {
  if (/getByTestId|data-testid|data-test\b/.test(loc)) return 'testid';
  if (/getByRole/.test(loc)) return 'role';
  if (/getByText|:has-text|\btext=/.test(loc)) return 'text';
  if (/getByLabel|getByPlaceholder|getByAltText/.test(loc)) return 'a11y-label';
  if (/href=|src=/.test(loc)) return 'attr-href';
  if (/#[\w-]/.test(loc)) return 'css-id';
  if (/\/\/|xpath/i.test(loc)) return 'xpath';
  if (/\.[\w-]+['"\)\s]/.test(loc)) return 'css-class';
  return 'css-other';
}

// Extract the single semantic anchor value our UI diff tracks, if the locator
// is anchored on one. Returns { kind, value } or null.
function anchor(loc) {
  let m;
  if ((m = loc.match(/getByTestId\(\s*['"`]([^'"`]+)['"`]/))) return { kind: 'testid', value: m[1] };
  if ((m = loc.match(/data-testid\s*=\s*['"]([^'"]+)['"]/))) return { kind: 'testid', value: m[1] };
  if ((m = loc.match(/getByText\(\s*['"`]([^'"`]+)['"`]/))) return { kind: 'text', value: m[1] };
  if ((m = loc.match(/:has-text\(\s*['"`]([^'"`]+)['"`]/))) return { kind: 'text', value: m[1] };
  if ((m = loc.match(/getByRole\(\s*['"`][^'"`]+['"`]\s*,\s*\{[^}]*\bname:\s*['"`]([^'"`]+)['"`]/))) return { kind: 'role-name', value: m[1] };
  if ((m = loc.match(/getBy(?:Label|Placeholder|AltText)\(\s*['"`]([^'"`]+)['"`]/))) return { kind: 'label', value: m[1] };
  if ((m = loc.match(/(?:href|src)\s*=\s*['"]([^'"]+)['"]/))) return { kind: 'attr', value: m[1] };
  return null;
}

// Same "shell" means the locator string is identical once the anchor value is
// blanked out -> a pure value substitution our signal can drive.
function blanked(loc, a) {
  return a ? loc.split(a.value).join('\u0000') : loc;
}

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

function classify(oldL, newL) {
  const oa = anchor(oldL), na = anchor(newL);
  const ot = locType(oldL), nt = locType(newL);
  // option-only: new = old + extra option (exact/timeout), same anchor
  if (norm(newL).replace(/,\s*\{[^}]*\}\s*\)/g, ')').replace(/,\s*(exact|timeout):[^,)]+/g, '') === norm(oldL).replace(/,\s*\{[^}]*\}\s*\)/g, ')').replace(/,\s*(exact|timeout):[^,)]+/g, '') && norm(newL) !== norm(oldL))
    return { cat: 'option-only', addressable: true, sig: oa && na ? null : null };
  if (oa && na && oa.kind === na.kind && blanked(oldL, oa) === blanked(newL, na)) {
    if (oa.value === na.value) return { cat: 'option-only', addressable: true };
    return { cat: `${oa.kind}-value`, addressable: true, sig: { from: oa.value, to: na.value, kind: oa.kind } };
  }
  if (ot !== nt) return { cat: 'strategy-switch', addressable: false };
  if (ot === 'css-id') return { cat: 'css-id-rename', addressable: false };
  if (ot === 'css-class') return { cat: 'css-class-rename', addressable: false };
  return { cat: 'structural-reshuffle', addressable: false };
}

function bump(map, k) { map[k] = (map[k] || 0) + 1; }

function main() {
  fs.mkdirSync(RESULTS, { recursive: true });
  const csvPath = process.env.REPRO_BREAK_CSV || DEFAULT_CSV;
  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(path.join(RESULTS, 'reprobreak.md'),
      '# ReproBreak sub-experiment\n\nSTATUS: SKIPPED\n\nReason: locator_analysis.csv not found. ' +
      'Clone github.com/rub-sq/ReproBreak into realproj/clones/ReproBreak (or set REPRO_BREAK_CSV).\n');
    console.log('ReproBreak: SKIPPED (no CSV)');
    return;
  }
  const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
  const byFw = {}, byType = {}, byProj = {}, byCat = {}, addrByFw = { playwright: { yes: 0, no: 0 }, cypress: { yes: 0, no: 0 }, other: { yes: 0, no: 0 } };
  const repairable = []; // addressable value substitutions with a signal
  for (const r of rows) {
    const fw = framework(r.old_locator);
    bump(byFw, fw); bump(byType, locType(r.old_locator)); bump(byProj, r.repository);
    const cl = classify(r.old_locator, r.new_locator);
    bump(byCat, cl.cat);
    addrByFw[fw][cl.addressable ? 'yes' : 'no']++;
    if (cl.addressable && cl.sig) repairable.push({ ...r, sig: cl.sig });
  }

  // E3: deterministic repair-rewriter exact-match given oracle signal.
  let ok = 0; const fails = [];
  for (const r of repairable) {
    const { from, to, kind } = r.sig;
    const res = kind === 'testid'
      ? repairLocators(r.old_locator, { [from]: to })
      : repairAssertions(r.old_locator, { [from]: to });
    const match = norm(res.text) === norm(r.new_locator);
    if (match) ok++; else if (fails.length < 12) fails.push({ old: r.old_locator, want: r.new_locator, got: res.text, kind });
  }

  const total = rows.length;
  const addrYes = Object.values(addrByFw).reduce((s, x) => s + x.yes, 0);
  const json = {
    source: path.relative(here, csvPath), n: total,
    framework: byFw, locator_type: byType,
    category: byCat, addressable: { yes: addrYes, no: total - addrYes, ratio: +(addrYes / total).toFixed(4), by_framework: addrByFw },
    repair_rewriter: { n: repairable.length, exact_match: ok, rate: +(ok / Math.max(1, repairable.length)).toFixed(4) },
  };
  fs.writeFileSync(path.join(RESULTS, 'reprobreak.json'), JSON.stringify(json, null, 2));

  const pct = (x, d = total) => `${((100 * x) / d).toFixed(1)}%`;
  const topProj = Object.entries(byProj).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const L = [];
  L.push('# ReproBreak 真实数据子实验（离线 / CSV ground truth）', '');
  L.push(`数据源：\`${json.source}\`（${total} 条真实结构性 locator 断裂对，来自开源 Cypress/Playwright 项目）。`);
  L.push('> 执行验证版（449 个可复现断裂）存于 gitignored 的 SQLite DB，经 Docker 复现，列为后续更重的一步。', '');
  L.push('## E1 数据刻画');
  L.push(`- 框架：Playwright ${byFw.playwright || 0}（${pct(byFw.playwright || 0)}）/ Cypress ${byFw.cypress || 0}（${pct(byFw.cypress || 0)}）。`);
  L.push('- 旧 locator 类型分布：');
  for (const [k, v] of Object.entries(byType).sort((a, b) => b[1] - a[1])) L.push(`  - ${k}: ${v}（${pct(v)}）`);
  L.push('- Top 项目：' + topProj.map(([k, v]) => `${k}(${v})`).join('、') + '。', '');
  L.push('## E2 Semantic UI Diff 可达性（addressability）');
  L.push('变更类别：');
  for (const [k, v] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) L.push(`- ${k}: ${v}（${pct(v)}）`);
  L.push('', `**可被 Semantic UI Diff 信号定位的断裂占比：${addrYes}/${total} = ${pct(addrYes)}**（testId/text/role-name/label/href 值替换 + 选项变更）。`);
  L.push(`其余为 CSS id/class 改名、结构重排或定位策略切换——需 DOM 拓扑或 LLM 推理（本方法 UI 信号不直接覆盖）。`);
  L.push('- 分框架可达性：' + Object.entries(addrByFw).filter(([, x]) => x.yes + x.no > 0)
    .map(([fw, x]) => `${fw} ${pct(x.yes, x.yes + x.no)}`).join('、') + '（Playwright 的语义定位天然更可修）。', '');
  L.push('## E3 确定性修复改写器精确匹配（已知 oracle 信号，上界）');
  L.push(`在「可达且为单一语义锚值替换」的 ${repairable.length} 条上，给定 ground-truth 的 oldValue→newValue 信号，本方法的确定性改写器精确重建开发者修复（归一化精确匹配）：**${ok}/${repairable.length} = ${pct(ok, repairable.length)}**。`);
  L.push('> 该指标隔离的是「改写机制在真实 Playwright/Cypress 语法上的正确性」，假定语义信号已知；信号检测精度（从 AUT diff 还原 oldValue→newValue）需各 commit 源码 + 执行验证，属后续步骤。');
  if (fails.length) {
    L.push('', '改写失败样例（暴露确定性改写的语法盲区，正是 LLM 增益空间）：');
    for (const f of fails.slice(0, 6)) L.push(`- [${f.kind}] \`${f.old}\` →期望 \`${f.want}\`，得到 \`${norm(f.got)}\``);
  }
  L.push('', '## 局限与下一步');
  L.push('- 本子实验用 CSV 的 old/new ground truth，未执行验证；执行验证（ReproBreak overwrite 模式，449 断裂 + Docker）为后续。');
  L.push('- E3 为上界（oracle 信号）；端到端「diff→信号→修复」精度需克隆 4 个可复现 AUT 项目并在对应 commit 取源码，纳入后续真实 LLM 对比。');
  fs.writeFileSync(path.join(RESULTS, 'reprobreak.md'), L.join('\n') + '\n');

  console.log(`ReproBreak: n=${total}, addressable=${pct(addrYes)}, rewriter exact-match=${ok}/${repairable.length}`);
}

main();
