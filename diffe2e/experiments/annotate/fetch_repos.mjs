// Restore the six AUT clones at the project's conventional locations.
//
// Full `git clone --filter=blob:none` is retried first. If the network resets
// mid-pack (observed with the large repos), fall back to a minimal repo that
// fetches only the commits actually needed by the 30/40 annotation samples.
// Every missing commit is reported, never skipped silently.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', '..');
const outDir = path.join(root, 'experiments', 'out');

const REPOS = [
  {
    name: 'actualbudget/actual',
    dir: path.join(root, 'real', 'actual'),
    jsonl: path.join(outDir, 'real', 'actual_desktop_rq2_to_annotate.jsonl'),
    unblind: path.join(outDir, 'real', 'actual_desktop_rq2_unblind.json'),
  },
  {
    name: 'mermaid-js/mermaid-live-editor',
    dir: path.join(root, 'real', 'mermaid-live-editor'),
    jsonl: path.join(outDir, 'real', 'mermaid_live_rq2_to_annotate.jsonl'),
    unblind: path.join(outDir, 'real', 'mermaid_live_rq2_unblind.json'),
  },
  { name: 'ghiscoding/angular-slickgrid', dir: path.join(root, 'realproj', 'clones', 'aut', 'ghiscoding__angular-slickgrid'), rq3: true },
  { name: 'tryghost/koenig', dir: path.join(root, 'realproj', 'clones', 'aut', 'tryghost__koenig'), rq3: true },
  { name: 'nasa/openmct', dir: path.join(root, 'realproj', 'clones', 'aut', 'nasa__openmct'), rq3: true },
  { name: 'microsoft/playwright', dir: path.join(root, 'realproj', 'clones', 'aut', 'microsoft__playwright'), rq3: true },
];

function run(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: 'pipe', maxBuffer: 32 * 1024 * 1024 });
}

function tryGit(args, cwd) {
  try { run('git', args, cwd); return true; } catch (e) { return { error: e.stderr || e.message }; }
}

function sleep(ms) { execFileSync('sleep', [String(ms / 1000)]); }

function shasFor(rq2, rq3, repoName) {
  const shas = new Set();
  if (rq2) {
    const u = JSON.parse(fs.readFileSync(rq2.unblind, 'utf8'));
    for (const v of Object.values(u)) { shas.add(v.prev); shas.add(v.sha); }
  }
  if (rq3) {
    const breaks = JSON.parse(fs.readFileSync(path.join(root, 'realproj', 'results', 'reprobreak_breaks.json'), 'utf8'));
    const csv = fs.readFileSync(path.join(outDir, 'rq3_reprobreak_to_annotate.csv'), 'utf8').trim().split('\n').slice(1);
    const ids = csv.map((l) => l.split(',')[1]);
    // Only this repository's sampled breaks: the CSV ids are global across
    // repos, so an unfiltered match would fetch other repos' commits here.
    for (const b of breaks) if (b.repository_name === repoName && ids.includes(String(b.id))) { shas.add(b.previous_sha); shas.add(b.commit_sha); }
  }
  return [...shas];
}

const report = [];
for (const repo of REPOS) {
  const rel = path.relative(root, repo.dir);
  fs.mkdirSync(path.dirname(repo.dir), { recursive: true });
  const shas = shasFor(repo.jsonl ? { unblind: repo.unblind } : null, repo.rq3, repo.name);
  let ready = false;

  if (fs.existsSync(path.join(repo.dir, '.git'))) {
    const missing = [];
    for (const s of shas) {
      try { run('git', ['cat-file', '-e', `${s}^{commit}`], repo.dir); } catch { missing.push(s); }
    }
    ready = missing.length === 0;
    report.push({ repo: repo.name, dir: rel, mode: 'existing', needed: shas.length, missing: missing.length });
    if (ready) { console.log(`READY ${rel} (${shas.length} commits)`); continue; }
  } else {
    report.push({ repo: repo.name, dir: rel, mode: 'init+fetch', needed: shas.length });
  }

  // Try a normal shallow clone first (cheap; we only need these commits).
  if (!fs.existsSync(path.join(repo.dir, '.git'))) {
    fs.rmSync(repo.dir, { recursive: true, force: true });
    fs.mkdirSync(repo.dir, { recursive: true });
    const ok = tryGit(['init', '-q'], repo.dir);
    if (ok === true) tryGit(['remote', 'add', 'origin', `https://github.com/${repo.name}`], repo.dir);
  }

  const failed = [];
  for (const s of shas) {
    try { run('git', ['cat-file', '-e', `${s}^{commit}`], repo.dir); continue; } catch {}
    let ok = false;
    for (let attempt = 1; attempt <= 5 && !ok; attempt++) {
      const r = tryGit(['fetch', '--depth=1', '--filter=blob:none', 'origin', s], repo.dir);
      if (r === true) ok = true;
      else { console.error(`RETRY ${repo.name} ${s.slice(0, 10)} attempt ${attempt}: ${String(r.error).split('\n')[0]}`); sleep(3000 * attempt); }
    }
    if (!ok) failed.push(s);
  }
  report[report.length - 1].failed = failed.length;
  report[report.length - 1].failed_shas = failed;
  console.log(`${failed.length ? 'PARTIAL' : 'READY'} ${rel}: ${shas.length - failed.length}/${shas.length} commits`);
}

fs.mkdirSync(path.join(here, 'context'), { recursive: true });
fs.writeFileSync(path.join(here, 'context', 'clone_report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.filter((r) => r.failed), null, 2));
