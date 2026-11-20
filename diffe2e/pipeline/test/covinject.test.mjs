import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  srcLeaf, cdpUrlToLeafRel, mapLeafRelToRepoRel, rewriteSpecImport, rewriteImportFrom,
  relImportPath, covFixtureSource, covFixtureSourceUrlRoot, covFixtureSourceMulti, covWrapFixtureSource,
} from '../src/covinject.mjs';

// Turn a regex literal embedded in generated fixture source into a RegExp.
const literal = (s) => new Function(`return ${s}`)();

test('srcLeaf returns last path segment', () => {
  assert.equal(srcLeaf('src'), 'src');
  assert.equal(srcLeaf('apps/examples/src'), 'src');
  assert.equal(srcLeaf(''), 'src');
});

test('cdpUrlToLeafRel extracts origin-root leaf source, skips deps/crosspkg', () => {
  assert.equal(cdpUrlToLeafRel('http://localhost:5173/src/a.tsx?t=1', 'src'), 'src/a.tsx');
  assert.equal(cdpUrlToLeafRel('http://localhost:3001/src/dir/b.js', 'src'), 'src/dir/b.js');
  assert.equal(cdpUrlToLeafRel('http://localhost:5173/node_modules/react/index.js', 'src'), null);
  assert.equal(cdpUrlToLeafRel('http://localhost:5173/.vite/deps/x.js', 'src'), null);
  assert.equal(cdpUrlToLeafRel('http://localhost:5173/@vite/client', 'src'), null);
  assert.equal(cdpUrlToLeafRel('http://localhost:5173/assets/logo.svg', 'src'), null);
  // cross-package source served via Vite /@fs/ must NOT be mis-attributed
  assert.equal(cdpUrlToLeafRel('http://localhost:3001/@fs/x/packages/loot-core/src/q.ts', 'src'), null);
  // framework single-file components (Svelte/Vue) are valid source too
  assert.equal(cdpUrlToLeafRel('http://localhost:3000/src/lib/components/Actions.svelte', 'src'), 'src/lib/components/Actions.svelte');
});

test('mapLeafRelToRepoRel re-attaches the srcGlob prefix', () => {
  assert.equal(mapLeafRelToRepoRel('src/a.tsx', 'src'), 'src/a.tsx');
  assert.equal(mapLeafRelToRepoRel('src/a.tsx', 'apps/examples/src'), 'apps/examples/src/a.tsx');
});

test('rewriteSpecImport redirects @playwright/test imports only', () => {
  const code = `import { test, expect } from '@playwright/test';\nconst s = "@playwright/test";`;
  const r = rewriteSpecImport(code, './__cov_fixtures');
  assert.ok(r.changed);
  assert.match(r.code, /from '\.\/__cov_fixtures'/);
  assert.match(r.code, /const s = "@playwright\/test"/); // non-import literal untouched
  assert.equal(rewriteSpecImport(`import x from './local';`, './__cov_fixtures').changed, false);
});

test('relImportPath computes posix relative path without extension', () => {
  assert.equal(relImportPath('/repo/e2e/foo.spec.ts', '/repo/e2e/__cov_fixtures.ts'), './__cov_fixtures');
  assert.equal(relImportPath('/repo/e2e/sub/bar.spec.ts', '/repo/e2e/__cov_fixtures.ts'), '../__cov_fixtures');
});

test('rewriteImportFrom redirects custom fixture sources', () => {
  const code = `import { test, expect } from './fixtures';\nimport x from "./fixtures";`;
  const r = rewriteImportFrom(code, ['./fixtures'], './__cov_fixtures');
  assert.ok(r.changed);
  assert.equal((r.code.match(/__cov_fixtures/g) || []).length, 2);
  assert.equal(rewriteImportFrom(`import a from './other';`, ['./fixtures'], './__cov_fixtures').changed, false);
});

test('covWrapFixtureSource wraps newPage and re-exports app test', () => {
  const src = covWrapFixtureSource('src', './fixtures');
  assert.match(src, /from '\.\/fixtures'/);
  assert.match(src, /appTest\.extend/);
  assert.match(src, /\.newPage = async/);
  assert.match(src, /startJSCoverage/);
  assert.match(src, /auto: true/);
});

test('covFixtureSource embeds leaf regex and overrides test', () => {
  const src = covFixtureSource('src');
  assert.match(src, /startJSCoverage/);
  assert.match(src, /stopJSCoverage/);
  assert.match(src, /export \* from '@playwright\/test'/);
  assert.match(src, /export const test = base\.extend/);
  assert.match(src, /src\\\//); // leaf baked into RE
});

test('covFixtureSourceUrlRoot maps root-relative URLs and skips vite ids', () => {
  const src = covFixtureSourceUrlRoot('apps/examples/src', '../fixtures/fixtures', true);
  assert.match(src, /@id\\\//); // vite optimized ids excluded
  assert.match(src, /files.add\('apps\/examples\/src\/' \+ m\[1\]\)/);
  assert.match(src, /import appDefault from '\.\.\/fixtures\/fixtures'/);
  assert.match(src, /export default test/);
});

test('covFixtureSourceMulti attributes dev root and /@fs/ workspace sources', () => {
  const src = covFixtureSourceMulti({
    urlRoot: 'apps/examples/src',
    fsRoots: ['packages/tldraw/src'],
    repoAbs: '/repo/root',
    appImport: '../fixtures/fixtures',
    defaultExport: true,
  });
  assert.match(src, /import appDefault from '\.\.\/fixtures\/fixtures'/);
  assert.match(src, /export \* from '@playwright\/test'/);
  assert.match(src, /export default test/);
  assert.match(src, /rel = 'apps\/examples\/src\/' \+ m\[1\]/);
  assert.match(src, /const FS: Array<\[string, string\]>/);
  assert.match(src, /'\/@fs\/repo\/root\/packages\/tldraw\/src\/'/);

  const reRoot = literal(src.match(/const RE_ROOT = (\/[^;]+?\/);/)[1]);

  // dev-server root -> repo-relative example-app path
  const m0 = 'http://localhost:5420/misc/EndToEndApi.ts?t=1'.match(reRoot);
  assert.equal('apps/examples/src/' + m0[1], 'apps/examples/src/misc/EndToEndApi.ts');

  // Vite emits /@fs/<abs>; Unix abs paths make /@fs//<abs> also possible; the
  // fixture collapses repeated slashes then matches the string prefix.
  const fsPrefix = '/@fs/repo/root/packages/tldraw/src/';
  for (const u of [
    'http://localhost:5420/@fs/repo/root/packages/tldraw/src/editor/Editor.tsx?import',
    'http://localhost:5420/@fs//repo/root/packages/tldraw/src/editor/Editor.tsx',
  ]) {
    const norm = u.split(/[?#]/)[0].replace(/\/{2,}/g, '/');
    const i = norm.indexOf(fsPrefix);
    assert.ok(i >= 0, u);
    assert.equal('packages/tldraw/src/' + norm.slice(i + fsPrefix.length), 'packages/tldraw/src/editor/Editor.tsx');
  }
  // /@fs/ URLs are never attributed to the app root; other packages stay out.
  assert.equal('http://localhost:5420/@fs//repo/root/packages/tldraw/src/x.ts'.match(reRoot), null);
  assert.equal('http://localhost:5420/@fs//repo/root/packages/other/src/x.ts'.indexOf(fsPrefix), -1);
  assert.equal('http://localhost:5420/node_modules/x/index.js'.match(reRoot), null);
});
