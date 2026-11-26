#!/usr/bin/env node
// 实验准备（阶段 0）：一次性完成所有依赖安装与**全量**仓库克隆。
//
// 设计目标：准备完成后，所有实验脚本可直接运行，不再在实验中途 clone / install，
// 消除网络与版本漂移带来的不确定性。
//
// 用法：
//   node prepare.mjs                # 幂等：已就绪的步骤自动跳过
//   node prepare.mjs --force        # 强制重装/重克隆
//   node prepare.mjs --only=deps    # 只做依赖（deps|browsers|repos）
//   node prepare.mjs --skip=actual  # 跳过指定仓库
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').split('=')[1] || null;
const SKIP = (args.find((a) => a.startsWith('--skip=')) || '').split('=')[1] || '';

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const info = (m) => console.log(`  \x1b[36m·\x1b[0m ${m}`);
const warn = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`);
const bad = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);

const rel = (p) => path.relative(ROOT, p) || '.';
const exists = (p) => fs.existsSync(p);

function run(cmd, cwd = ROOT, timeout = 1800000) {
  return execSync(cmd, { cwd, stdio: 'pipe', timeout, env: { ...process.env, COREPACK_ENABLE_DOWNLOAD_PROMPT: '0' } }).toString();
}

// 克隆：全量（不用 --depth / --filter），失败重试 3 次并退避。
// 已有仓库可能处于"工作区被删文件/稀疏检出残留"的损坏状态（例如之前的 sparse-checkout
// 实验留下了大量未恢复的删除）。检测到只有删除、没有本地修改时自动 reset --hard 修复。
function repairWorktree(dest) {
  try {
    const st = run('git status --porcelain', dest).trim();
    if (!st) return true;
    const lines = st.split('\n');
    const onlyDeletions = lines.every((l) => /^\s*D\s/.test(l) || /^D\s/.test(l));
    if (!onlyDeletions) { warn(`${rel(dest)} 有本地修改，未自动修复`); return true; }
    info(`${rel(dest)} 工作区有 ${lines.length} 个缺失文件（损坏/残留），自动 git reset --hard`);
    run('git reset --hard HEAD', dest);
    ok(`${rel(dest)} 工作区已修复`);
    return true;
  } catch { return true; }
}

function cloneFull(url, dest, { retries = 3 } = {}) {
  if (exists(path.join(dest, '.git'))) {
    if (!FORCE) { ok(`${rel(dest)} 已存在，跳过`); repairWorktree(dest); return true; }
    info(`${rel(dest)} 已存在，--force 重新克隆`);
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  for (let i = 1; i <= retries; i++) {
    try {
      info(`克隆 ${url} → ${rel(dest)}（第 ${i}/${retries} 次，全量）`);
      execSync(`git clone --quiet ${url} ${JSON.stringify(dest)}`, { stdio: 'pipe', timeout: 3600000 });
      ok(`${rel(dest)} 克隆完成`);
      return true;
    } catch (e) {
      warn(`第 ${i} 次失败：${String(e.message).split('\n')[0].slice(0, 120)}`);
      fs.rmSync(dest, { recursive: true, force: true });
      if (i < retries) execSync('sleep 5');
    }
  }
  bad(`${rel(dest)} 克隆失败（网络问题？可稍后重跑本脚本，已完成的步骤会跳过）`);
  return false;
}

const steps = [];
const failures = [];

// ---------- 1. 运行时 ----------
steps.push({
  group: 'deps', name: 'Node 版本',
  check: () => {
    const major = parseInt(process.versions.node.split('.')[0], 10);
    if (major < 24) throw new Error(`需要 Node 24+，当前 ${process.versions.node}`);
  },
});

// ---------- 2. 依赖安装 ----------
for (const dir of ['pipeline', 'subject/base', 'subject/sideeffect']) {
  steps.push({
    group: 'deps', name: `npm install · ${dir}`,
    check: () => {
      if (!exists(path.join(ROOT, dir, 'package.json'))) { warn(`${dir} 无 package.json，跳过`); return; }
      if (exists(path.join(ROOT, dir, 'node_modules')) && !FORCE) { ok(`${dir}/node_modules 已存在，跳过`); return; }
      run('npm install', path.join(ROOT, dir));
      ok(`${dir} 依赖安装完成`);
    },
  });
}

// tree-sitter 原生模块自检（原生构建失败是最常见的环境坑）
steps.push({
  group: 'deps', name: 'tree-sitter 自检',
  check: () => {
    // 写临时探针脚本再执行，避免 shell 引号转义问题
    const probePath = path.join(ROOT, 'pipeline', '.tree-sitter-probe.mjs');
    fs.writeFileSync(probePath, [
      "import Parser from 'tree-sitter';",
      "import TS from 'tree-sitter-typescript';",
      "const p = new Parser(); p.setLanguage(TS.tsx);",
      "if (p.parse('const a=1').rootNode.type !== 'program') process.exit(2);",
      "console.log('ok');",
    ].join('\n'));
    try { run(`node ${JSON.stringify(path.basename(probePath))}`, path.join(ROOT, 'pipeline'), 120000); }
    catch { fs.rmSync(probePath, { force: true }); throw new Error('tree-sitter 原生模块加载失败（需 C++ 构建链：Xcode CLT / build-essential）'); }
    fs.rmSync(probePath, { force: true });
    ok('tree-sitter 可用（原生模块加载正常）');
  },
});

// ---------- 3. 浏览器 ----------
steps.push({
  group: 'browsers', name: 'Playwright Chromium',
  check: () => {
    try {
      const v = run('npx playwright --version', path.join(ROOT, 'subject/base')).trim();
      info(v);
      run('npx playwright install chromium', path.join(ROOT, 'subject/base'), 1800000);
      ok('Chromium 就绪（HEAD 版本）');
    } catch (e) {
      bad(`浏览器安装失败：${String(e.message).split('\n')[0].slice(0, 120)}`);
    }
  },
});

// ---------- 4. 全量仓库克隆 ----------
const REPOS = [
  // 真实项目回放（RQ1 real / RQ2 real 样本）
  { key: 'mermaid', url: 'https://github.com/mermaid-js/mermaid-live-editor.git', dest: path.join(ROOT, 'real/mermaid-live-editor') },
  { key: 'actual', url: 'https://github.com/actualbudget/actual.git', dest: path.join(ROOT, 'real/actual'),
    after: () => { info('actual: corepack yarn install'); run('corepack yarn install', path.join(ROOT, 'real/actual'), 3600000); ok('actual 依赖安装完成'); } },
  // ReproBreak 端到端修复（RQ3）的 4 个被测仓库
  { key: 'slickgrid', url: 'https://github.com/ghiscoding/angular-slickgrid.git', dest: path.join(ROOT, 'realproj/clones/aut/ghiscoding__angular-slickgrid') },
  { key: 'koenig', url: 'https://github.com/tryghost/koenig.git', dest: path.join(ROOT, 'realproj/clones/aut/tryghost__koenig') },
  { key: 'openmct', url: 'https://github.com/nasa/openmct.git', dest: path.join(ROOT, 'realproj/clones/aut/nasa__openmct') },
  { key: 'playwright', url: 'https://github.com/microsoft/playwright.git', dest: path.join(ROOT, 'realproj/clones/aut/microsoft__playwright') },
];

for (const r of REPOS) {
  if (SKIP.split(',').includes(r.key)) { info(`跳过 ${r.key}（--skip）`); continue; }
  steps.push({
    group: 'repos', name: `克隆 · ${r.key}`,
    check: () => { if (cloneFull(r.url, r.dest) && r.after) r.after(); },
  });
}

// ---------- 5. 数据文件自检 ----------
steps.push({
  group: 'data', name: 'ReproBreak 断裂数据',
  check: () => {
    const p = path.join(ROOT, 'realproj/results/reprobreak_breaks.json');
    if (!exists(p)) throw new Error('缺少 realproj/results/reprobreak_breaks.json（应随仓库提交；如需重建见 reprobreak_db.mjs）');
    const n = JSON.parse(fs.readFileSync(p, 'utf8')).length;
    ok(`reprobreak_breaks.json：${n} 条断裂`);
  },
});

steps.push({
  group: 'data', name: '受控主体 git 历史',
  check: () => {
    if (exists(path.join(ROOT, 'subject/work/.git')) && !FORCE) { ok('subject/work 已存在（node experiments/seed 可重建）'); return; }
    run('node subject/history/seed.mjs', ROOT, 600000);
    ok('subject/work 已生成（25 commit）');
  },
});

// ---------- 执行 ----------
const groups = ['deps', 'browsers', 'repos', 'data'];
for (const g of groups) {
  if (ONLY && ONLY !== g) continue;
  console.log(`\n\x1b[1m[${g}]\x1b[0m`);
  for (const s of steps.filter((x) => x.group === g)) {
    try { await s.check(); }
    catch (e) { bad(`${s.name}: ${String(e.message).split('\n')[0].slice(0, 160)}`); failures.push(s.name); }
  }
}

console.log('\n\x1b[1m=== 准备结果 ===\x1b[0m');
const summary = [
  ['pipeline/node_modules', exists(path.join(ROOT, 'pipeline/node_modules'))],
  ['subject/base/node_modules', exists(path.join(ROOT, 'subject/base/node_modules'))],
  ['subject/work（25 commit）', exists(path.join(ROOT, 'subject/work/.git'))],
  ['real/mermaid-live-editor', exists(path.join(ROOT, 'real/mermaid-live-editor/.git'))],
  ['real/actual', exists(path.join(ROOT, 'real/actual/.git'))],
  ['ReproBreak 4 仓', REPOS.slice(2).every((r) => exists(path.join(r.dest, '.git')))],
  ['reprobreak_breaks.json（449 条）', exists(path.join(ROOT, 'realproj/results/reprobreak_breaks.json'))],
];
for (const [k, v] of summary) (v ? ok : warn)(k);

if (failures.length) {
  console.log(`\n\x1b[33m${failures.length} 个步骤未完成\x1b[0m（网络问题可重跑本脚本，已完成项会自动跳过）：`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exitCode = 1;
} else {
  console.log('\n\x1b[32m全部就绪\x1b[0m → 可直接运行实验，见 REPRODUCE.md「主实验」一节。');
}
