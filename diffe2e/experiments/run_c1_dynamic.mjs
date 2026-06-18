// Dynamic C1 case study on a REAL React+Vite+Playwright project (cand_coverage).
// Actually runs the e2e suite at V_old and V_new, builds the affected oracle
// from real pass/fail flips, and shows the JSX Semantic UI Diff driving:
//   - selection (coverage-only vs uidiff)  -> precision gain
//   - repair (broken selected test re-passes)
//   - generation (ADD button -> executable test)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { semanticDiff } from '../pipeline/src/uidiff.mjs';
import { selectByUiLocator } from '../pipeline/src/selector.mjs';
import { repairFromUiDiff } from '../pipeline/src/repair.mjs';
import { selectionMetrics } from '../pipeline/src/metrics.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..', 'real', 'cand_coverage');
const OUT = path.join(here, 'out');
const APP = path.join(ROOT, 'src', 'App.tsx');
const TMP = path.join(OUT, '_c1dyn');

const TESTS = [
  { id: 'App.test.ts::default-turquoise', file: 'e2e/App.test.ts', title: 'use Turquoise as a default background color' },
  { id: 'App.test.ts::red', file: 'e2e/App.test.ts', title: 'use Red as a background color' },
  { id: 'App2.test.ts::turquoise', file: 'e2e/App2.test.ts', title: 'use Turquoise as a background color' },
];

function makeNew(oldSrc) {
  let s = oldSrc.replace('>Red</button>', '>Crimson</button>');
  s = s.replace(
    '  const handleMakeYellow = () => {\n    setBackgroundColor("#f1c40f")\n  }',
    '  const handleMakeYellow = () => {\n    setBackgroundColor("#f1c40f")\n  }\n  const handleMakeGreen = () => {\n    setBackgroundColor("#2ecc71")\n  }');
  s = s.replace('<button onClick={handleMakeYellow}>Yellow</button>',
    '<button onClick={handleMakeYellow}>Yellow</button>\n          <button onClick={handleMakeGreen}>Green</button>');
  return s;
}

function splitTests(src) {
  const blocks = {};
  const re = /test\(\s*(['"])(.*?)\1[\s\S]*?\n\}\)/g;
  let m;
  while ((m = re.exec(src))) blocks[m[2]] = m[0];
  return blocks;
}

// run a SINGLE test; pass/fail from exit code, coverage from .nyc_output
function runOne(file, title) {
  const nyc = path.join(ROOT, '.nyc_output');
  fs.rmSync(nyc, { recursive: true, force: true });
  let pass = true;
  try {
    execSync(`npx playwright test ${file} -g ${JSON.stringify(title)}`, { cwd: ROOT, stdio: 'pipe' });
  } catch { pass = false; }
  let coversApp = false;
  if (fs.existsSync(nyc)) {
    for (const f of fs.readdirSync(nyc)) {
      const cov = JSON.parse(fs.readFileSync(path.join(nyc, f), 'utf8'));
      for (const [p, e] of Object.entries(cov)) {
        if (p.endsWith('src/App.tsx') && Object.values(e.s || {}).some((v) => v > 0)) coversApp = true;
      }
    }
  }
  return { pass, coversApp };
}

function runVersion(src) {
  fs.writeFileSync(APP, src);
  const res = {};
  for (const t of TESTS) res[t.id] = runOne(t.file, t.title);
  return res;
}

function main() {
  fs.mkdirSync(TMP, { recursive: true });
  const OLD = fs.readFileSync(APP, 'utf8');
  const NEW = makeNew(OLD);
  const appTestPath = path.join(ROOT, 'e2e', 'App.test.ts');
  const appTestOrig = fs.readFileSync(appTestPath, 'utf8');

  // write old/new App for uidiff
  fs.writeFileSync(path.join(TMP, 'App.old.tsx'), OLD);
  fs.writeFileSync(path.join(TMP, 'App.new.tsx'), NEW);
  const uidiff = semanticDiff(path.join(TMP, 'App.old.tsx'), path.join(TMP, 'App.new.tsx'));

  // per-test sources (granularity = test)
  const blocksByFile = {
    'e2e/App.test.ts': splitTests(appTestOrig),
    'e2e/App2.test.ts': splitTests(fs.readFileSync(path.join(ROOT, 'e2e', 'App2.test.ts'), 'utf8')),
  };
  const perTestSrc = {};
  for (const t of TESTS) perTestSrc[t.id] = blocksByFile[t.file][t.title] || '';

  try {
    console.log('running V_old ...');
    const oldRes = runVersion(OLD);
    console.log('running V_new ...');
    const newRes = runVersion(NEW);

    // oracle: tests whose outcome flips
    const affected = TESTS.filter((t) => oldRes[t.id].pass !== newRes[t.id].pass).map((t) => t.id);
    // coverage-only selection (tests covering App.tsx in V_old)
    const covSel = TESTS.filter((t) => oldRes[t.id].coversApp).map((t) => t.id);
    // uidiff selection (per-test source references a changed node)
    const uiSel = selectByUiLocator(uidiff, perTestSrc);

    const full = TESTS.map((t) => t.id);
    const mCov = selectionMetrics({ full, selected: covSel, affected });
    const mUi = selectionMetrics({ full, selected: uiSel, affected });

    // repair the broken selected test (App.test.ts) via uidiff, re-run on V_new
    const repaired = repairFromUiDiff(appTestOrig, uidiff);
    fs.writeFileSync(APP, NEW);
    fs.writeFileSync(appTestPath, repaired.text);
    const redAfter = runOne('e2e/App.test.ts', 'use Red as a background color');

    // generation: ADD'd Green button -> executable test (covers App)
    const addGreen = (uidiff.ADD || []).find((a) => a.node.text === 'Green');
    const genPath = path.join(ROOT, 'e2e', '_gen_green.test.ts');
    const genSpec = `import { test } from './baseFixtures';\n` +
      `test.beforeEach(async ({ page }) => { await page.goto('/'); });\n` +
      `test('generated green', async ({ page }) => {\n  await page.click("text=Green");\n  await page.waitForSelector("text=Current color:");\n});\n`;
    fs.writeFileSync(genPath, genSpec);
    const genRun = runOne('e2e/_gen_green.test.ts', 'generated green');
    fs.rmSync(genPath, { force: true });

    const report = { uidiff, oldRes, newRes, affected, covSel, uiSel, mCov, mUi,
      repair: { edits: repaired.edits, red_after_pass: redAfter.pass },
      generation: { add: addGreen ? addGreen.node.text : null, executable: genRun.pass, covers_app: genRun.coversApp } };
    fs.writeFileSync(path.join(OUT, 'c1_dynamic.json'), JSON.stringify(report, null, 2));

    const L = ['# C1 动态实测：真实 React 项目 (cand_coverage)', '',
      '变更：按钮 Red→Crimson（同 handler/颜色）+ 新增 Green 按钮。', '',
      '## Semantic UI Diff',
      `- MODIFY: ${(uidiff.MODIFY || []).map((m) => `${m.key}{${Object.keys(m.changes).join(',')}}`).join(', ') || '-'}`,
      `- ADD: ${(uidiff.ADD || []).map((a) => a.key).join(', ') || '-'}`,
      `- REMOVE: ${(uidiff.REMOVE || []).map((a) => a.key).join(', ') || '-'}`, '',
      '## 实跑结果（V_old → V_new）',
      '| test | V_old | V_new | 覆盖App |', '|---|---|---|---|',
      ...TESTS.map((t) => `| ${t.id} | ${oldRes[t.id].pass ? 'pass' : 'FAIL'} | ${newRes[t.id].pass ? 'pass' : 'FAIL'} | ${oldRes[t.id].coversApp} |`),
      '', `- affected oracle（结果翻转）: ${affected.join(', ') || '-'}`, '',
      '## 选择：覆盖 vs Semantic UI Diff',
      '| 方法 | 选中 | Reduction | Safety | Precision |', '|---|---|---|---|---|',
      `| coverage-only | ${covSel.length} | ${mCov.Reduction} | ${mCov.Safety} | ${mCov.Precision} |`,
      `| uidiff (ours) | ${uiSel.length} | ${mUi.Reduction} | ${mUi.Safety} | ${mUi.Precision} |`,
      '', '## 修复（uidiff 驱动）',
      `- edits: ${JSON.stringify(repaired.edits)}`,
      `- 修复后 "use Red" 重跑: ${redAfter.pass ? 'PASS' : 'FAIL'}`,
      '', '## 生成（ADD 缺口）',
      `- 新增按钮 ${report.generation.add}: 可执行=${genRun.pass}，覆盖App=${genRun.coversApp}`, ''];
    fs.writeFileSync(path.join(OUT, 'c1_dynamic.md'), L.join('\n') + '\n');
    console.log('\n' + L.join('\n'));
  } finally {
    fs.writeFileSync(APP, OLD);
    fs.writeFileSync(appTestPath, appTestOrig);
    fs.rmSync(path.join(ROOT, '.nyc_output'), { recursive: true, force: true });
    console.log('\n[restored App.tsx + App.test.ts]');
  }
}

main();
