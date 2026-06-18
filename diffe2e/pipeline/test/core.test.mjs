import test from 'node:test';
import assert from 'node:assert/strict';
import { fileLevelFromCDP, intersectsChange } from '../src/coverageMap.mjs';
import { parseUnifiedDiff, changedFiles } from '../src/diff.mjs';
import { selectByCoverage, selectByUiLocator, select } from '../src/selector.mjs';
import { buildAffected } from '../src/oracle.mjs';
import { coverageGap } from '../src/gap.mjs';
import { mcnemar, cliffsDelta, wilcoxonSigned, bootstrapCI, mean } from '../src/stats.mjs';
import { toMarkdown } from '../src/reporter.mjs';

test('coverageMap: fileLevelFromCDP keeps only executed /src/*.js', () => {
  const entries = [
    { url: 'http://x/src/cart.js', functions: [{ ranges: [{ count: 1 }] }] },
    { url: 'http://x/src/home.js', functions: [{ ranges: [{ count: 0 }] }] },
  ];
  assert.deepEqual(fileLevelFromCDP(entries).sort(), ['src/cart.js']);
});

test('coverageMap: intersectsChange normalizes leading slash', () => {
  assert.equal(intersectsChange(['/src/cart.js'], ['src/cart.js']), true);
  assert.equal(intersectsChange(['src/home.js'], ['src/cart.js']), false);
});

test('diff: parseUnifiedDiff extracts files and changed lines', () => {
  const sample = [
    'diff --git a/src/cart.js b/src/cart.js',
    '--- a/src/cart.js',
    '+++ b/src/cart.js',
    '@@ -10,3 +10,4 @@ function price(q){',
    ' const x = 1',
    '-  return q*10',
    '+  return q*12',
    '+  // note',
  ].join('\n');
  const d = parseUnifiedDiff(sample);
  assert.deepEqual(d.files, ['src/cart.js']);
  assert.ok(d.byFile['src/cart.js'].added.has(11));
  assert.deepEqual(changedFiles(sample), ['src/cart.js']);
});

test('selector: coverage signal', () => {
  const cov = { t1: ['src/cart.js'], t2: ['src/home.js'] };
  assert.deepEqual(selectByCoverage(cov, ['src/cart.js']), ['t1']);
});

test('selector: UI-locator signal selects test referencing removed node', () => {
  const uidiff = { REMOVE: [{ node: { text: 'Red' } }], MODIFY: [], ADD: [] };
  const sources = { 'App.test.ts': 'await page.click("text=Red")', 'App2.test.ts': 'click Turquoise' };
  assert.deepEqual(selectByUiLocator(uidiff, sources), ['App.test.ts']);
});

test('selector: union of both signals dedupes', () => {
  const cov = { 'App.test.ts': ['src/app.js'] };
  const uidiff = { REMOVE: [{ node: { text: 'Red' } }], MODIFY: [], ADD: [] };
  const sources = { 'App.test.ts': 'text=Red' };
  assert.deepEqual(select({ cov, changedFiles: ['src/app.js'], uidiff, testSources: sources }), ['App.test.ts']);
});

test('oracle: buildAffected uses V_new coverage', () => {
  const covVnew = { t1: ['src/cart.js'], t2: ['src/home.js'] };
  assert.deepEqual(buildAffected(covVnew, ['src/home.js']), ['t2']);
});

test('gap: uncovered changed units', () => {
  const cov = { t1: ['src/cart.js'] };
  const g = coverageGap({ changedUnits: ['src/cart.js', 'src/new.js'], targetedTests: ['t1'], coverageOf: (t) => cov[t] });
  assert.deepEqual(g, ['src/new.js']);
});

test('stats: mcnemar continuity-corrected', () => {
  // b=10,c=2 -> (|8|-1)^2/12 = 49/12 = 4.0833
  assert.equal(mcnemar(10, 2).chi2, 4.0833);
});

test('stats: cliffsDelta full dominance = 1', () => {
  assert.equal(cliffsDelta([3, 4, 5], [0, 1, 2]), 1);
});

test('stats: wilcoxonSigned ranks (drop zeros, signed ranks)', () => {
  const r = wilcoxonSigned([[5, 1], [2, 4], [3, 3], [10, 1]]);
  // diffs: +4, -2, 0(dropped), +9 -> |2,4,9| ranks 1,2,3
  // positive: 4(rank2)+9(rank3)=5 ; negative: -2(rank1)=1
  assert.equal(r.n, 3);
  assert.equal(r.wPlus, 5);
  assert.equal(r.wMinus, 1);
});

test('stats: bootstrapCI brackets the mean deterministically', () => {
  const s = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const ci = bootstrapCI(s, mean, 500, 7);
  assert.ok(ci.lo <= ci.point && ci.point <= ci.hi);
});

test('reporter: toMarkdown renders table', () => {
  const md = toMarkdown({ title: 'T', sections: [{ heading: 'H', table: { headers: ['a', 'b'], rows: [['1', '2']] } }] });
  assert.match(md, /\| a \| b \|/);
  assert.match(md, /\| 1 \| 2 \|/);
});
