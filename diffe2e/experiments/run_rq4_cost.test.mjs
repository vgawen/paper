import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const diffe2e = path.resolve(here, '..');
const adapterPath = path.join(here, 'real', 'adapters', '.tmp-rq4-cost-test.json');
const outPath = path.join(here, 'out', 'real', 'tmp_rq4_cost_test_rq4.json');

test('RQ4 cost runner resolves real adapter repoDir and uses testAllCmd for full suite', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'diffe2e-rq4-'));
  const repoDir = path.join(diffe2e, 'tmp-rq4-cost-test-repo');
  const marker = path.join(tmpRoot, 'marker.txt');
  const writer = path.join(repoDir, 'write-marker.cjs');

  fs.rmSync(repoDir, { recursive: true, force: true });
  fs.mkdirSync(repoDir, { recursive: true });
  fs.writeFileSync(writer, `
const fs = require('fs');
const [label, ...args] = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(marker)}, label + ':' + args.join(' ') + '\\n');
`);
  fs.writeFileSync(adapterPath, JSON.stringify({
    name: 'tmp_rq4_cost_test',
    repoDir: '../../tmp-rq4-cost-test-repo',
    specGlob: 'e2e',
    testOneCmd: 'node write-marker.cjs one {spec}',
    testAllCmd: 'node write-marker.cjs full',
    covRel: 'cov_pertest'
  }, null, 2));

  try {
    execFileSync('node', [
      'experiments/run_rq4_cost.mjs',
      'experiments/real/adapters/.tmp-rq4-cost-test.json',
      'alpha.spec.ts',
      '2',
      '1',
      '4'
    ], { cwd: diffe2e, stdio: 'pipe' });

    const lines = fs.readFileSync(marker, 'utf8').trim().split('\n');
    assert.deepEqual(lines, [
      'full:',
      'one:e2e/alpha.spec.ts --workers=2'
    ]);

    const result = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    assert.equal(result.project, 'tmp_rq4_cost_test');
    assert.equal(result.full_count, 4);
    assert.equal(result.selected_count, 1);
    assert.equal(result.Reduction, 0.75);
  } finally {
    fs.rmSync(repoDir, { recursive: true, force: true });
    fs.rmSync(adapterPath, { force: true });
    fs.rmSync(outPath, { force: true });
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('RQ4 cost runner treats an empty selected set as zero selected-run time', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'diffe2e-rq4-empty-'));
  const repoDir = path.join(diffe2e, 'tmp-rq4-cost-test-repo');
  const marker = path.join(tmpRoot, 'marker.txt');
  const writer = path.join(repoDir, 'write-marker.cjs');

  fs.rmSync(repoDir, { recursive: true, force: true });
  fs.mkdirSync(repoDir, { recursive: true });
  fs.writeFileSync(writer, `
const fs = require('fs');
const [label, ...args] = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(marker)}, label + ':' + args.join(' ') + '\\n');
`);
  fs.writeFileSync(adapterPath, JSON.stringify({
    name: 'tmp_rq4_cost_test',
    repoDir: '../../tmp-rq4-cost-test-repo',
    specGlob: 'e2e',
    testOneCmd: 'node write-marker.cjs one {spec}',
    testAllCmd: 'node write-marker.cjs full',
    covRel: 'cov_pertest'
  }, null, 2));

  try {
    execFileSync('node', [
      'experiments/run_rq4_cost.mjs',
      'experiments/real/adapters/.tmp-rq4-cost-test.json',
      '',
      '2',
      '1',
      '4'
    ], { cwd: diffe2e, stdio: 'pipe' });

    const lines = fs.readFileSync(marker, 'utf8').trim().split('\n');
    assert.deepEqual(lines, ['full:']);

    const result = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    assert.equal(result.selected_count, 0);
    assert.equal(result.T_run_sel_ms.median, 0);
    assert.equal(result.Reduction, 1);
  } finally {
    fs.rmSync(repoDir, { recursive: true, force: true });
    fs.rmSync(adapterPath, { force: true });
    fs.rmSync(outPath, { force: true });
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
