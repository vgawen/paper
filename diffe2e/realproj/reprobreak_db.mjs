// Export ReproBreak SQLite into JSON: validated locator breaks joined with
// commit info. Uses python3 stdlib sqlite3 (no extra deps).
//
// The execution-validated breaks live in ReproBreak's SQLite DB (data/ReproBreak.db,
// produced via its create_reproducible_dataset.py / Docker reproduction; gitignored).
// Set REPRO_BREAK_DB to override the path.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const CANDIDATES = [
  process.env.REPRO_BREAK_DB,
  path.join(here, 'clones', 'ReproBreak', 'data', 'ReproBreak.db'),
  path.join(here, 'clones', 'ReproBreak', 'data', 'locator_break.db'),
].filter(Boolean);
const DB = CANDIDATES.find((p) => fs.existsSync(p)) || CANDIDATES[CANDIDATES.length - 1];
const OUT = path.join(here, 'results', 'reprobreak_breaks.json');

const PY = `
import sqlite3, json, sys
db = sqlite3.connect(sys.argv[1]); db.row_factory = sqlite3.Row
q = '''SELECT lc.id, lc.old_locator, lc.new_locator, lc.repository_name, lc.commit_sha,
              lc.test_file_path, lc.line_no, lc.framework, gc.previous_sha
       FROM locator_change lc
       JOIN locator_break lb ON lb.locator_change_id = lc.id
       JOIN git_commit gc ON gc.sha = lc.commit_sha AND gc.repository_name = lc.repository_name'''
rows = [dict(r) for r in db.execute(q)]
json.dump(rows, sys.stdout)
`;

function main() {
  if (!fs.existsSync(DB)) { console.log(`SKIPPED: DB not found at ${DB}`); return; }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const pyFile = path.join(here, 'results', '_export.py');
  fs.writeFileSync(pyFile, PY);
  try {
    const out = execSync(`python3 ${JSON.stringify(pyFile)} ${JSON.stringify(DB)}`, { maxBuffer: 256 * 1024 * 1024 }).toString();
    const rows = JSON.parse(out);
    fs.writeFileSync(OUT, JSON.stringify(rows, null, 2));
    console.log(`ReproBreak DB: ${rows.length} validated breaks -> ${path.relative(here, OUT)}`);
  } finally {
    fs.rmSync(pyFile, { force: true });
  }
}
main();
