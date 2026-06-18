// Best-effort ReproBreak adapter. ReproBreak ships broken/fixed E2E test pairs.
// Set REPRO_BREAK_URL (a git repo) to enable; otherwise this records SKIPPED so
// the experiment remains fully reproducible offline and is honest about it.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { repair } from '../pipeline/src/repair.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const RESULTS = path.join(here, 'results');
const CLONES = path.join(here, 'clones');

function main() {
  fs.mkdirSync(RESULTS, { recursive: true });
  const url = process.env.REPRO_BREAK_URL;
  if (!url) {
    fs.writeFileSync(path.join(RESULTS, 'reprobreak.md'),
      '# ReproBreak adapter\n\nSTATUS: SKIPPED\n\nReason: REPRO_BREAK_URL not configured. ' +
      'The deterministic repair pipeline (pipeline/src/repair.mjs) is validated on the ' +
      'controlled subject (RQ3). To run on ReproBreak, set REPRO_BREAK_URL to a clone-able ' +
      'repo of broken/fixed (old,new) source + spec pairs; this adapter will apply repair() ' +
      'to each broken spec and report fix-rate.\n');
    console.log('ReproBreak: SKIPPED (no REPRO_BREAK_URL)');
    return;
  }
  fs.mkdirSync(CLONES, { recursive: true });
  const dest = path.join(CLONES, 'reprobreak');
  if (!fs.existsSync(dest)) execSync(`git clone --depth 1 ${url} ${dest}`, { stdio: 'pipe' });
  // Expect cases/<id>/{old.js,new.js,broken.spec.ts,expected.spec.ts}
  const casesDir = path.join(dest, 'cases');
  const cases = fs.existsSync(casesDir) ? fs.readdirSync(casesDir) : [];
  const rows = [];
  for (const id of cases) {
    const c = path.join(casesDir, id);
    try {
      const oldCode = fs.readFileSync(path.join(c, 'old.js'), 'utf8');
      const newCode = fs.readFileSync(path.join(c, 'new.js'), 'utf8');
      const broken = fs.readFileSync(path.join(c, 'broken.spec.ts'), 'utf8');
      const expected = fs.readFileSync(path.join(c, 'expected.spec.ts'), 'utf8');
      const rep = repair(broken, oldCode, newCode);
      rows.push({ id, edits: rep.edits.length, matches_expected: normalize(rep.text) === normalize(expected) });
    } catch { rows.push({ id, error: true }); }
  }
  const ok = rows.filter((r) => r.matches_expected).length;
  fs.writeFileSync(path.join(RESULTS, 'reprobreak.json'), JSON.stringify({ n: rows.length, ok, rows }, null, 2));
  console.log(`ReproBreak: ${ok}/${rows.length} repaired to expected`);
}
const normalize = (s) => s.replace(/\s+/g, ' ').trim();

main();
