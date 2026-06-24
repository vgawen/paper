# DiffE2E 论文前补实验 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐 RQ1–RQ4 在「真实项目 + 真实 LLM + 人工校验」三个维度的证据，使每个研究问题都有可在硕士论文中直接引用的真实数据、统计检验与图表。

**Architecture:** 复用已落地的纯函数模块（`pipeline/src/*`：diff/coverageMap/selector/oracle/gap/metrics/stats/uidiff/domdiff/generate/repair/staleness）。新增一个**项目无关的真实 replay 引擎**（按 per-project adapter 配置驱动），把现有「写死 subject/work」的 `lib.mjs` 泛化；新增 ReproBreak **端到端**适配器（读其 SQLite、按 commit 取 AUT 源码、跑 diff→信号→修复并比对 ground truth）；新增真实 LLM 对照臂、人工标注与 Cohen's κ 工具、真实项目成本计量与统计聚合。

**Tech Stack:** Node.js (ESM, `node:test`)、Playwright + Chromium、istanbul/`vite-plugin-istanbul` 与 CDP `page.coverage`、git、Python3（仅用于读 SQLite，标准库 `sqlite3`）、可插拔 LLM 客户端（OpenAI/DeepSeek/Anthropic，无 key 时确定性 stub）。

**前置依赖（需用户提供，非代码可解决）：**
- 一个 LLM API key（推荐 `DEEPSEEK_API_KEY`，成本最低）用于 RQ2/RQ3 真实臂。
- ReproBreak 的 SQLite 工件 `data/locator_break.db`（含 commit_sha / test_file_path，用于端到端修复）——从其 GitHub release/Zenodo 工件获取，或用其 `create_*` 脚本生成。
- RQ1 真实项目：目标 ≥3 个可插桩 Playwright 项目（`real/cand_coverage` 已可用作 1 个，其余需筛选）。

**完成判据（达到即可开始写论文）：**
1. RQ1：合成主体（含消融）+ **≥2 个真实项目**真实 commit 选择结果（Safety/Precision/Reduction + 三路消融 + 基线 + 统计）。**量化下限**（避免 dual 用多选刷 Safety）：dual 在每个真实项目上 **Safety ≥ 0.95、Reduction ≥ 0.30、Precision ≥ 0.50**，且 Precision 显著高于 retest-all、Safety 显著高于同规模 random。任一项不达标须如实记录并分析原因，不得掩盖。
2. RQ2：**真实 LLM** 生成 + 无 diff 约束基线 + 小标注集语义有效率（双标注 + κ ≥ 0.6）。
3. RQ3：ReproBreak **端到端（无泄漏）**（≥1 个 AUT）+ 规则 vs LLM；过时三分类 κ。
4. RQ4：≥1 个真实项目的真实执行时延数据（公平对比，见 Task 4.1）。
5. 全部真实数据的统计检验 + 图 + 表，落进 `EXPERIMENT_REPORT.md` 与论文章节映射表。

**评审修订要点（v2，务必遵守）：**
- **无信息泄漏（RQ3/ReproBreak 关键）**：修复输入只能用「旧（断裂）测试 + AUT 应用源码 old/new diff + DOM/trace/候选元素」；**V_new 的测试文件与 `new_locator` 只能用于评估，绝不可进入规则修复输入或 LLM prompt**。
- **闭环评估顺序**：各 task 的开发顺序可并行（先生成后修复无妨），但**最终闭环评估顺序固定为：选择 → 运行/修复 → 缺口分析 → 生成**（与开题方案一致）。
- **提交授权**：下文每个 task 末尾的 `git commit` 均为**可选提交点**；agent 执行时**必须先获用户明确授权**才提交，否则只暂存改动、由用户审阅后提交。
- **真实 replay 严谨性**：只有 V_old 与 V_new 全量覆盖**都成功产出**的 transition 才进入主结果；其余写入 skip log 并说明原因。

---

## File Structure

新增/修改文件及职责（按依赖顺序）：

- `diffe2e/pipeline/src/stats.mjs`（修改）：新增 `cohenKappa`（标注一致性）。
- `diffe2e/pipeline/src/covpath.mjs`（新建）：把任意覆盖记录的绝对/构建路径**归一化为仓库相对源码路径**，并与变更文件求交（真实项目覆盖映射的通用层）。
- `diffe2e/experiments/real/engine.mjs`（新建）：项目无关的 commit-replay 引擎；输入一个 adapter（如何 checkout、如何带覆盖跑单个 spec、覆盖落点、源码 glob），输出每个过渡的选择指标（coverage/uidiff/dual）、oracle、失败集。
- `diffe2e/experiments/real/engine.test.mjs`（新建）：用 fixtures 测引擎的纯逻辑（过渡枚举、覆盖→文件归一、指标计算）。
- `diffe2e/experiments/real/adapters/cand_coverage.json`（新建）：第一个真实项目 adapter。
- `diffe2e/experiments/real/adapters/<proj2>.json`、`<proj3>.json`（新建，onboarding 产出）。
- `diffe2e/experiments/real/run_rq1_real.mjs`（新建）：驱动真实项目 RQ1，写 `out/real/<proj>_rq1.{jsonl,json,md}`。
- `diffe2e/experiments/real/ONBOARDING.md`（新建）：真实项目筛选/接入协议 + 评分标准。
- `diffe2e/pipeline/src/generate.mjs`（修改）：新增 `buildPromptNoDiff`（无 diff 约束基线 prompt）。
- `diffe2e/experiments/run_rq2.mjs`（修改）：双臂（diff 约束 vs 无约束）+ 真实 LLM provider 记录 + 扩大缺口集。
- `diffe2e/experiments/annotate/make_sheet.mjs`（新建）：从 `rq2_to_annotate.jsonl` 生成双标注 CSV。
- `diffe2e/experiments/annotate/score.mjs`（新建）：读回标注，算语义有效率 + Cohen's κ + 仲裁。
- `diffe2e/experiments/annotate/PROTOCOL.md`（新建）：标注规范（评分维度、判定标准）。
- `diffe2e/realproj/reprobreak_db.mjs`（新建）：用 python3 把 SQLite 导出为 JSON（locator_change ⋈ git_commit ⋈ locator_break）。
- `diffe2e/realproj/reprobreak_e2e.mjs`（新建）：端到端——按 commit 克隆/取 AUT 源码，跑 `signalMap`/`textSegMap`/`repair`（规则）与 LLM 臂，比对 ground truth；可选执行验证。
- `diffe2e/experiments/run_rq3.mjs`（修改）：增加 LLM 臂 + 过时分类标注挂钩。
- `diffe2e/experiments/run_rq4_cost.mjs`（新建）：真实项目 wall-clock：retest-all vs 选择子集的执行时延。
- `diffe2e/experiments/analyze_real.mjs`（新建）：真实数据统计（bootstrap/Wilcoxon/McNemar/Cliff + κ）+ SVG。
- `diffe2e/experiments/aggregate.mjs`（修改）：纳入真实 RQ1/RQ2 双臂/RQ3 端到端/RQ4 真实/κ 小节。
- `diffe2e/docs/THESIS_MAPPING.md`（新建）：数据产物 → 论文章节/图表 的映射表。

---

## Phase 0：标注一致性与通用覆盖路径（纯函数，先 TDD 打底）

### Task 0.1: `cohenKappa` 统计函数

**Files:**
- Modify: `diffe2e/pipeline/src/stats.mjs`
- Test: `diffe2e/pipeline/test/stats.test.mjs`

- [ ] **Step 1: 写失败测试**

在 `diffe2e/pipeline/test/stats.test.mjs` 末尾追加：

```js
import { cohenKappa } from '../src/stats.mjs';

test('cohenKappa perfect agreement = 1', () => {
  const k = cohenKappa([['y', 'y'], ['n', 'n'], ['y', 'y']]);
  assert.equal(k.kappa, 1);
});

test('cohenKappa chance-level ~ 0', () => {
  // 2x2 with observed == expected agreement
  const pairs = [['y','y'],['y','n'],['n','y'],['n','n']];
  const k = cohenKappa(pairs);
  assert.ok(Math.abs(k.kappa) < 1e-9);
  assert.equal(k.po, 0.5);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd diffe2e && node --test pipeline/test/stats.test.mjs`
Expected: FAIL（`cohenKappa is not a function`）

- [ ] **Step 3: 实现**

在 `diffe2e/pipeline/src/stats.mjs` 追加：

```js
// Cohen's kappa for two annotators over categorical labels.
// pairs: [[a1,a2], ...]. Returns { kappa, po, pe, n }.
export function cohenKappa(pairs) {
  const n = pairs.length;
  if (!n) return { kappa: 0, po: 0, pe: 0, n: 0 };
  const labels = [...new Set(pairs.flat())];
  let agree = 0;
  const m1 = {}, m2 = {};
  for (const [a, b] of pairs) {
    if (a === b) agree++;
    m1[a] = (m1[a] || 0) + 1;
    m2[b] = (m2[b] || 0) + 1;
  }
  const po = agree / n;
  let pe = 0;
  for (const l of labels) pe += ((m1[l] || 0) / n) * ((m2[l] || 0) / n);
  const kappa = pe === 1 ? 1 : (po - pe) / (1 - pe);
  return { kappa: +kappa.toFixed(4), po: +po.toFixed(4), pe: +pe.toFixed(4), n };
}
```

- [ ] **Step 4: 运行确认通过**

Run: `cd diffe2e && node --test pipeline/test/stats.test.mjs`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add diffe2e/pipeline/src/stats.mjs diffe2e/pipeline/test/stats.test.mjs
git commit -m "feat(diffe2e): add Cohen's kappa for annotation agreement"
```

### Task 0.2: 通用覆盖路径归一化 `covpath.mjs`

**Files:**
- Create: `diffe2e/pipeline/src/covpath.mjs`
- Test: `diffe2e/pipeline/test/covpath.test.mjs`

- [ ] **Step 1: 写失败测试**

创建 `diffe2e/pipeline/test/covpath.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { toRepoRel, selectByGenericCoverage } from '../src/covpath.mjs';

test('toRepoRel strips repo root and leading slash', () => {
  assert.equal(toRepoRel('/abs/repo/src/App.tsx', '/abs/repo'), 'src/App.tsx');
  assert.equal(toRepoRel('file:///abs/repo/src/a.ts', '/abs/repo'), 'src/a.ts');
  assert.equal(toRepoRel('src/a.ts', '/abs/repo'), 'src/a.ts');
});

test('selectByGenericCoverage selects tests touching a changed file', () => {
  const cov = { 't1': ['src/cart.tsx', 'src/util.ts'], 't2': ['src/home.tsx'] };
  const sel = selectByGenericCoverage(cov, ['src/cart.tsx']);
  assert.deepEqual(sel.sort(), ['t1']);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd diffe2e && node --test pipeline/test/covpath.test.mjs`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现**

创建 `diffe2e/pipeline/src/covpath.mjs`：

```js
// Generic coverage-path utilities for arbitrary real projects (any source
// layout). Coverage records may carry absolute paths, file:// URLs, or
// already-relative paths; normalize all to repo-relative POSIX paths.
import path from 'node:path';

export function toRepoRel(p, repoRoot) {
  let s = String(p).replace(/^file:\/\//, '');
  s = s.split('?')[0];
  const root = repoRoot.replace(/\/+$/, '') + '/';
  if (s.startsWith(root)) s = s.slice(root.length);
  return s.replace(/^\/+/, '').split(path.sep).join('/');
}

// cov: { testId: [repoRelFile,...] }; changed: [repoRelFile,...]
export function selectByGenericCoverage(cov, changed) {
  const ch = new Set(changed);
  const sel = [];
  for (const [id, files] of Object.entries(cov)) {
    if ((files || []).some((f) => ch.has(f))) sel.push(id);
  }
  return sel;
}
```

- [ ] **Step 4: 运行确认通过**

Run: `cd diffe2e && node --test pipeline/test/covpath.test.mjs`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add diffe2e/pipeline/src/covpath.mjs diffe2e/pipeline/test/covpath.test.mjs
git commit -m "feat(diffe2e): generic coverage-path normalization for real projects"
```

---

## Phase 1：真实项目 RQ1 选择（外部效度的核心）

### Task 1.1: 真实项目接入协议文档

**Files:**
- Create: `diffe2e/experiments/real/ONBOARDING.md`

- [ ] **Step 1: 写协议**

创建 `diffe2e/experiments/real/ONBOARDING.md`，内容为筛选评分表（每项 0/1，≥5 分入选）：

```markdown
# 真实项目接入协议（RQ1/RQ4）

候选来源：E2EGit（472 仓库）中 framework=Playwright 的项目，或已知可插桩样本。

## 入选评分（满分 8，≥5 入选）
- [ ] 1 使用 @playwright/test（package.json 可见）
- [ ] 1 前端 JS/TS（Vite/CRA/Next 皆可，优先 Vite）
- [ ] 1 可建立逐用例覆盖：vite-plugin-istanbul 或可注入 CDP page.coverage
- [ ] 1 E2E 用例 ≥ 5 个，且能本地起服务跑通至少 1 个
- [ ] 1 非浅克隆、近 1 年内有 ≥ 20 个改动到被测源码/测试的 commit
- [ ] 1 不强依赖外部 auth/付费 API/私有后端（或可 mock）
- [ ] 1 元素多用 data-testid / role / text（Semantic UI Diff 可用）
- [ ] 1 许可证允许研究使用

## 产出
每个入选项目写一个 adapter（见 adapters/cand_coverage.json 模板），并登记到本文件「已接入」表。

## 已接入
| 项目 | 仓库 | 覆盖方法 | E2E 数 | 选用 commit 数 | 状态 |
|---|---|---|---|---|---|
| cand_coverage | mxschmitt/playwright-test-coverage | istanbul | … | … | 接入中 |
```

- [ ] **Step 2: 提交**

```bash
git add diffe2e/experiments/real/ONBOARDING.md
git commit -m "docs(diffe2e): real-project onboarding protocol for RQ1"
```

### Task 1.2: 项目 adapter schema + 第一个 adapter

**Files:**
- Create: `diffe2e/experiments/real/adapters/cand_coverage.json`

- [ ] **Step 1: 写 adapter**

创建 `diffe2e/experiments/real/adapters/cand_coverage.json`（字段含义见注释，引擎 Task 1.3 消费）：

```json
{
  "name": "cand_coverage",
  "repoDir": "../real/cand_coverage",
  "srcGlob": "src",
  "covRel": "cov_pertest",
  "installCmd": "npm ci",
  "testOneCmd": "COV_OUT=cov_pertest npx playwright test {spec}",
  "testAllCmd": "COV_OUT=cov_pertest npx playwright test",
  "covEntryToPath": "json:files",
  "specGlob": "tests"
}
```

说明：`repoDir` 相对 `experiments/real/`；`testOneCmd` 中 `{spec}` 由引擎替换；`covEntryToPath=json:files` 表示覆盖目录里每个 json 含 `{ test, files: [...] }`（与现有 cand_coverage 约定一致）。

- [ ] **Step 2: 提交**

```bash
git add diffe2e/experiments/real/adapters/cand_coverage.json
git commit -m "feat(diffe2e): adapter for first real RQ1 project (cand_coverage)"
```

### Task 1.3: 项目无关 replay 引擎（纯逻辑 TDD）

**Files:**
- Create: `diffe2e/experiments/real/engine.mjs`
- Test: `diffe2e/experiments/real/engine.test.mjs`

- [ ] **Step 1: 写失败测试（只测纯逻辑：过渡枚举 + 选择指标组装，注入假的 cov/diff）**

创建 `diffe2e/experiments/real/engine.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTransition } from './engine.mjs';

test('computeTransition: dual = coverage ∪ uidiff, metrics vs oracle', () => {
  const r = computeTransition({
    covVold: { t1: ['src/cart.tsx'], t2: ['src/home.tsx'] },
    covVnew: { t1: ['src/cart.tsx'], t2: ['src/home.tsx'] },
    changed: ['src/cart.tsx'],
    uiSelected: ['t2'],
  });
  assert.deepEqual(r.metrics.coverage_only.selected_count, 1); // t1
  assert.deepEqual(r.methods.dual.sort(), ['t1', 't2']);
  assert.equal(r.metrics.dual.Safety, 1); // oracle from covVnew∩changed = [t1] ⊆ dual
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd diffe2e && node --test experiments/real/engine.test.mjs`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现引擎纯逻辑 + 实况 runner（live 部分不被单测触达）**

创建 `diffe2e/experiments/real/engine.mjs`：

```js
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { selectByGenericCoverage, toRepoRel } from '../../pipeline/src/covpath.mjs';
import { buildAffected } from '../../pipeline/src/oracle.mjs';
import { selectionMetrics } from '../../pipeline/src/metrics.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

// ---- pure: assemble selection + metrics for one transition ----
export function computeTransition({ covVold, covVnew, changed, uiSelected = [] }) {
  const all = [...new Set([...Object.keys(covVold), ...Object.keys(covVnew)])];
  const affected = buildAffected(covVnew, changed);
  const coverage_only = selectByGenericCoverage(covVold, changed);
  const uidiff_only = uiSelected.filter((t) => all.includes(t));
  const dual = [...new Set([...coverage_only, ...uidiff_only])];
  const methods = { coverage_only, uidiff_only, dual };
  const metrics = {};
  for (const [k, sel] of Object.entries(methods)) metrics[k] = selectionMetrics({ full: all, selected: sel, affected });
  return { all, affected, methods, metrics };
}

// ---- live helpers (driven by adapter; exercised by run_rq1_real.mjs) ----
export function loadAdapter(file) {
  const a = JSON.parse(fs.readFileSync(file, 'utf8'));
  a.repoAbs = path.resolve(here, a.repoDir);
  return a;
}
export function gitIn(repo, args) { return execSync(`git ${args}`, { cwd: repo, stdio: 'pipe' }).toString(); }
export function checkoutSha(repo, sha) { gitIn(repo, `checkout -q ${sha}`); }

// best-effort install at the current checkout; returns false on failure so the
// driver can skip the transition instead of polluting results with empty cov.
export function installLive(adapter) {
  if (!adapter.installCmd) return true;
  try { execSync(adapter.installCmd, { cwd: adapter.repoAbs, stdio: 'pipe', timeout: 600000 }); return true; }
  catch { return false; }
}

export function changedSrcFiles(repo, prev, sha, srcGlob) {
  const diff = gitIn(repo, `diff ${prev} ${sha} -- ${srcGlob}`);
  const files = [...diff.matchAll(/^\+\+\+ b\/(.+)$/gm)].map((m) => m[1]);
  return [...new Set(files.filter((f) => f.startsWith(srcGlob)))];
}

export function runSuiteLive(adapter, spec = '') {
  const cmd = (spec ? adapter.testOneCmd.replace('{spec}', spec) : adapter.testAllCmd);
  const covAbs = path.join(adapter.repoAbs, adapter.covRel);
  fs.rmSync(covAbs, { recursive: true, force: true });
  let ok = true;
  try { execSync(cmd, { cwd: adapter.repoAbs, stdio: 'pipe' }); } catch { ok = false; }
  return { ok, covAbs };
}

export function loadCovLive(adapter, covAbs) {
  const map = {};
  if (!fs.existsSync(covAbs)) return map;
  for (const f of fs.readdirSync(covAbs)) {
    if (!f.endsWith('.json')) continue;
    const o = JSON.parse(fs.readFileSync(path.join(covAbs, f), 'utf8'));
    map[o.test] = (o.files || []).map((p) => toRepoRel(p, adapter.repoAbs));
  }
  return map;
}
```

- [ ] **Step 4: 运行确认通过**

Run: `cd diffe2e && node --test experiments/real/engine.test.mjs`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add diffe2e/experiments/real/engine.mjs diffe2e/experiments/real/engine.test.mjs
git commit -m "feat(diffe2e): project-agnostic real commit-replay engine (pure core TDD)"
```

### Task 1.4: 真实 RQ1 驱动 + UI 信号

**Files:**
- Create: `diffe2e/experiments/real/run_rq1_real.mjs`

- [ ] **Step 1: 实现驱动（live；用 adapter + commit 列表；UI 信号用 uidiff 或 domdiff）**

创建 `diffe2e/experiments/real/run_rq1_real.mjs`：

```js
// Usage: node experiments/real/run_rq1_real.mjs <adapter.json> [maxTransitions]
// Replays the last N commit transitions that touch source, runs the suite with
// per-test coverage on V_old and V_new, derives an affected oracle from V_new,
// and computes coverage_only / uidiff_only / dual selection metrics per transition.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadAdapter, gitIn, checkoutSha, changedSrcFiles, runSuiteLive, loadCovLive, computeTransition, installLive,
} from './engine.mjs';
import { extractFromCode, semanticDiff } from '../../pipeline/src/uidiff.mjs';
import { changedUiSignals, selectByDomDiff } from '../../pipeline/src/domdiff.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, '..', 'out', 'real');

function skip(skips, prev, sha, reason) { skips.push({ prev, sha, reason }); console.log(`SKIP ${sha.slice(0, 8)}: ${reason}`); }

function uiSignalSelect(adapter, prev, sha, changed) {
  // For JSX/TSX use semanticDiff; else fall back to vanilla DOM-signal diff.
  const sigs = [];
  for (const f of changed) {
    const oldC = safeShow(adapter.repoAbs, prev, f), newC = safeShow(adapter.repoAbs, sha, f);
    if (/\.(t|j)sx$/.test(f)) {
      try {
        const d = semanticDiff(extractFromCode(oldC, f), extractFromCode(newC, f));
        for (const n of [...d.REMOVE, ...d.MODIFY]) { if (n.node?.testId) sigs.push(n.node.testId); if (n.node?.text) sigs.push(n.node.text); }
      } catch { /* parser miss -> skip */ }
    } else {
      sigs.push(...changedUiSignals(oldC, newC));
    }
  }
  return [...new Set(sigs)];
}
const safeShow = (repo, ref, f) => { try { return gitIn(repo, `show ${ref}:${f}`); } catch { return ''; } };

async function main() {
  const adapterFile = process.argv[2];
  const maxN = parseInt(process.argv[3] || '15', 10);
  const adapter = loadAdapter(adapterFile);
  fs.mkdirSync(OUT, { recursive: true });

  // pick commits that touched srcGlob, newest first, then chronological pairs
  const log = gitIn(adapter.repoAbs, `log --format=%H -n 400 -- ${adapter.srcGlob}`).trim().split('\n');
  const shas = log.slice(0, maxN + 1).reverse(); // oldest..newest
  const rows = [];
  const skips = [];
  for (let i = 1; i < shas.length; i++) {
    const prev = shas[i - 1], sha = shas[i];
    const changed = changedSrcFiles(adapter.repoAbs, prev, sha, adapter.srcGlob);
    if (!changed.length) continue;

    // --- V_old: checkout, install (best-effort), full suite w/ coverage ---
    checkoutSha(adapter.repoAbs, prev);
    if (!installLive(adapter)) { skip(skips, prev, sha, 'install_failed_vold'); continue; }
    const voldRun = runSuiteLive(adapter);
    const voldCov = loadCovLive(adapter, voldRun.covAbs);
    const ui = uiSignalSelect(adapter, prev, sha, changed);

    // --- V_new: checkout, install, full suite w/ coverage ---
    checkoutSha(adapter.repoAbs, sha);
    if (!installLive(adapter)) { skip(skips, prev, sha, 'install_failed_vnew'); continue; }
    const vnewRun = runSuiteLive(adapter);
    const vnewCov = loadCovLive(adapter, vnewRun.covAbs);

    // --- stability gate: BOTH ends must have produced coverage, and the V_old
    //     baseline test set must largely survive into V_new (no infra collapse).
    //     NOTE: V_new tests failing (ok=false) is EXPECTED for breaks and is NOT
    //     a skip reason; only missing/empty coverage (infra failure) is. ---
    const voldTests = Object.keys(voldCov), vnewTests = Object.keys(vnewCov);
    if (voldTests.length === 0) { skip(skips, prev, sha, 'empty_cov_vold'); continue; }
    if (vnewTests.length === 0) { skip(skips, prev, sha, 'empty_cov_vnew'); continue; }
    const survived = voldTests.filter((t) => vnewTests.includes(t)).length;
    if (survived / voldTests.length < 0.5) { skip(skips, prev, sha, `unstable_testset(${survived}/${voldTests.length})`); continue; }

    // map UI signals to tests by source reference (read spec sources at sha)
    const testSources = {};
    for (const id of new Set([...voldTests, ...vnewTests])) {
      const specFile = id.split(' > ')[0];
      testSources[id] = safeShow(adapter.repoAbs, sha, path.posix.join(adapter.specGlob, specFile)) || '';
    }
    const uiSelected = selectByDomDiff(ui, testSources);

    const r = computeTransition({ covVold: voldCov, covVnew: vnewCov, changed, uiSelected });
    rows.push({ prev, sha, changed, ui_signals: ui, vold_tests: voldTests.length, vnew_tests: vnewTests.length,
      metrics: r.metrics, selected: r.methods.dual, affected: r.affected });
    console.log(`${sha.slice(0, 8)} changed=${changed.length} cov=${r.metrics.coverage_only.selected_count} ui=${r.metrics.uidiff_only.selected_count} dual Safe=${r.metrics.dual.Safety} Prec=${r.metrics.dual.Precision}`);
  }

  const base = path.join(OUT, adapter.name);
  fs.writeFileSync(`${base}_rq1.jsonl`, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  fs.writeFileSync(`${base}_rq1_skips.json`, JSON.stringify(skips, null, 2));
  console.log(`\nincluded ${rows.length} stable transitions; skipped ${skips.length} (see ${adapter.name}_rq1_skips.json)`);
  const mean = (k, m) => rows.length ? +(rows.reduce((s, r) => s + r.metrics[m][k], 0) / rows.length).toFixed(4) : 0;
  const summary = {};
  for (const m of ['coverage_only', 'uidiff_only', 'dual']) summary[m] = { Reduction: mean('Reduction', m), Safety: mean('Safety', m), Precision: mean('Precision', m) };
  fs.writeFileSync(`${base}_rq1.json`, JSON.stringify({ project: adapter.name, n: rows.length, summary }, null, 2));
  const md = [`# RQ1 real: ${adapter.name} (n=${rows.length})`, '', '| method | Reduction | Safety | Precision |', '|---|---|---|---|',
    ...Object.entries(summary).map(([m, s]) => `| ${m} | ${s.Reduction} | ${s.Safety} | ${s.Precision} |`)].join('\n');
  fs.writeFileSync(`${base}_rq1.md`, md + '\n');
  console.log('\n' + md);
}
main();
```

- [ ] **Step 2: 干跑（cand_coverage 已是浅克隆，先 unshallow）**

Run:
```bash
cd diffe2e/real/cand_coverage && git fetch --unshallow 2>/dev/null; git fetch --depth=400 2>/dev/null; npm ci
cd /Users/DongbiaoGao/SourceCode/Paper/diffe2e && node experiments/real/run_rq1_real.mjs experiments/real/adapters/cand_coverage.json 12
```
Expected: 打印每个**稳定**过渡的 cov/ui/dual 指标；产出 `experiments/out/real/cand_coverage_rq1.{jsonl,json,md}` 与 `cand_coverage_rq1_skips.json`。安装失败、任一端覆盖为空、或测试集塌缩（V_old 测试在 V_new 存活率 < 50%）的过渡被跳过并记入 skip log，不进入主结果。注意：V_new 测试**失败**（断裂）是预期的，不算跳过理由。

- [ ] **Step 3: 接入第 2、3 个项目**

按 `ONBOARDING.md` 评分挑 ≥2 个项目，克隆到 `diffe2e/real/<proj>`，各写一个 `adapters/<proj>.json`，重复 Step 2。验收：每个项目 `n ≥ 8` 个有效过渡，dual Safety 接近 1.0（漏选个案需记录解释）。

- [ ] **Step 4: 提交**

```bash
git add diffe2e/experiments/real/run_rq1_real.mjs diffe2e/experiments/real/adapters/ diffe2e/experiments/out/real/ diffe2e/experiments/real/ONBOARDING.md
git commit -m "feat(diffe2e): real-project RQ1 selection replay (>=2 projects)"
```

---

## Phase 2：真实 LLM 生成（RQ2）+ 无约束基线 + 人工 κ

### Task 2.1: 无 diff 约束生成基线 prompt

**Files:**
- Modify: `diffe2e/pipeline/src/generate.mjs`
- Test: `diffe2e/pipeline/test/generate.test.mjs`

- [ ] **Step 1: 写失败测试**

在 `diffe2e/pipeline/test/generate.test.mjs` 追加：

```js
import { buildPromptNoDiff } from '../src/generate.mjs';

test('buildPromptNoDiff omits diff/route constraints', () => {
  const p = buildPromptNoDiff({ appName: 'demo' });
  assert.ok(!/diff|changed|route /i.test(p) || /no specific change/i.test(p));
  assert.ok(p.length > 0);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `cd diffe2e && node --test pipeline/test/generate.test.mjs`
Expected: FAIL（未定义）

- [ ] **Step 3: 实现**

在 `diffe2e/pipeline/src/generate.mjs` 追加（基线：仅给应用名/页面，不给 diff、不给目标路由约束）：

```js
export function buildPromptNoDiff({ appName = 'the app' } = {}) {
  return [
    `Write a single Playwright smoke test for ${appName}.`,
    'You are given no specific change to target; pick any meaningful user flow.',
    'Output only a TypeScript Playwright test using @playwright/test.',
  ].join('\n');
}
```

- [ ] **Step 4: 运行确认通过**

Run: `cd diffe2e && node --test pipeline/test/generate.test.mjs`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add diffe2e/pipeline/src/generate.mjs diffe2e/pipeline/test/generate.test.mjs
git commit -m "feat(diffe2e): no-diff-constraint generation baseline prompt (RQ2 ablation)"
```

### Task 2.2: RQ2 双臂驱动 + 真实 LLM

**Files:**
- Modify: `diffe2e/experiments/run_rq2.mjs`

- [ ] **Step 1: 改驱动为「diff 约束臂 + 无约束臂」，并记录 provider**

在 `diffe2e/experiments/run_rq2.mjs` 中，对每个缺口 commit 额外生成一个无约束基线 spec（用 `buildPromptNoDiff` + `client.complete` 的 fallback 模板），跑同样的 executable/change_relevant 度量，rows 增加 `arm: 'diff' | 'nodiff'`。汇总按臂分别给 execRate/relRate。保留原 diff 臂逻辑不变（复用 `generateForGap`）。

关键改动（在缺口循环内，原 diff 臂之后追加）：

```js
import { buildPromptNoDiff } from '../pipeline/src/generate.mjs';
// ... after diff-arm rows.push(...) and before fs.rmSync(specAbs):
const nodiffPrompt = buildPromptNoDiff({ appName: 'demo-app' });
const nodiffSpec = await client.complete(nodiffPrompt, { fallback: spec }); // stub returns template; real LLM returns its own
const ndFile = `_gen_nodiff_${stem}.spec.ts`;
fs.writeFileSync(path.join(WORK, 'tests', ndFile), nodiffSpec);
const ndRun = runSuite(`cov/gen/${gapT}_nodiff`);
const ndCov = loadCov(ndRun.covDir); const ndFailed = parseFailed(ndRun.report);
const ndId = Object.keys(ndCov)[0] || '';
const ndExec = !!ndId && !ndFailed.has(ndId);
const ndRel = (ndCov[ndId] || []).map(norm).includes(gapCovFile);
rows.push({ tag: gapT, route, gap_file: gapCovFile, arm: 'nodiff', executable: ndExec, change_relevant: ndRel });

// BOTH arms must be emitted for blinded human annotation, WITH the generated
// spec text. arm label is kept ONLY in an unblinding key, not in the sheet.
toAnnotate.push({ tag: gapT, route, gap_file: gapCovFile, arm: 'diff',   spec });        // diff-arm spec
toAnnotate.push({ tag: gapT, route, gap_file: gapCovFile, arm: 'nodiff', spec: nodiffSpec }); // nodiff-arm spec
fs.rmSync(path.join(WORK, 'tests', ndFile), { force: true });
```

并把原 diff 臂 row 加上 `arm: 'diff'`；汇总段按 `arm` 分组算 execRate/relRate 各一行。

**确保标注链路完整**（关键）：删掉原驱动里只 push 单臂的 `toAnnotate.push(...)`，改为上面的双臂 push；落盘时**拆成两个文件**——
- `out/rq2_to_annotate.jsonl`：每行 `{ case_id, route, gap_file, spec }`（**隐藏 arm**，按固定种子打乱顺序），供盲标注；
- `out/rq2_unblind.json`：`{ case_id: arm }` 的解盲映射，仅评分时使用。

落盘代码（替换原 `rq2_to_annotate.jsonl` 写入处）：

```js
// stable shuffle (seeded) so the blinded order is reproducible
let s = 1234; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const blinded = toAnnotate.map((r, i) => ({ case_id: `c${i}`, ...r })).sort(() => rnd() - 0.5);
fs.writeFileSync(path.join(OUT, 'rq2_to_annotate.jsonl'),
  blinded.map((r) => JSON.stringify({ case_id: r.case_id, route: r.route, gap_file: r.gap_file, spec: r.spec })).join('\n') + '\n');
fs.writeFileSync(path.join(OUT, 'rq2_unblind.json'),
  JSON.stringify(Object.fromEntries(blinded.map((r) => [r.case_id, r.arm])), null, 2));
```

验收：`rq2_to_annotate.jsonl` 每行含非空 `spec/route/gap_file/case_id` 且无 `arm`；`rq2_unblind.json` 一一对应。Task 2.3 的 `make_sheet.mjs` 直接消费此文件。

- [ ] **Step 2: stub 下跑通（回归）**

Run: `cd diffe2e && node subject/history/seed.mjs && node experiments/run_rq2.mjs`
Expected: `provider=stub`，两臂都出数；`rq2_results.json` 含 `arm` 字段。

- [ ] **Step 3: 真实 LLM 跑（需 key）**

Run:
```bash
cd diffe2e && DEEPSEEK_API_KEY=*** node experiments/run_rq2.mjs
```
Expected: `provider=deepseek`；diff 臂的 change-relevant-rate 明显高于 nodiff 臂（核心论点）。结果与 stub 结果分别留存（手动重命名 `rq2_results.json` → `rq2_results_<provider>.json` 备份）。

- [ ] **Step 4: 提交**

```bash
git add diffe2e/experiments/run_rq2.mjs diffe2e/experiments/out/rq2_results.json diffe2e/experiments/out/rq2_results.md
git commit -m "feat(diffe2e): RQ2 two-arm generation (diff-constrained vs no-diff) + real LLM provider"
```

### Task 2.3: 人工标注表生成与 κ 评分

**Files:**
- Create: `diffe2e/experiments/annotate/PROTOCOL.md`
- Create: `diffe2e/experiments/annotate/make_sheet.mjs`
- Create: `diffe2e/experiments/annotate/score.mjs`
- Test: `diffe2e/experiments/annotate/score.test.mjs`

- [ ] **Step 1: 写标注规范**

创建 `diffe2e/experiments/annotate/PROTOCOL.md`：

```markdown
# RQ2 生成用例语义有效率标注规范

对每条生成用例，两名标注者独立给出标签（y/n）：
- semantic_valid = y 当且仅当：该测试断言确实验证了「本次变更引入的新行为/页面」，
  且断言不是恒真/与变更无关（例如只断言 body 可见）。
否则 n。

流程：各自独立填表 → 计算一致率与 Cohen's κ → 不一致项第三人仲裁 → 取仲裁后标签算语义有效率。
目标样本：≥ 30 条（diff 臂 + nodiff 臂混合，隐藏臂别以防偏倚）。
```

- [ ] **Step 2: 写表生成器**

创建 `diffe2e/experiments/annotate/make_sheet.mjs`：

```js
// Build a blinded CSV for two annotators from rq2_to_annotate.jsonl.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, '..', 'out');
const rows = fs.readFileSync(path.join(OUT, 'rq2_to_annotate.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
const esc = (s) => '"' + String(s).replace(/"/g, '""') + '"';
// case_id comes from the (blinded) jsonl so it joins back to rq2_unblind.json.
const lines = ['case_id,route,gap_file,spec,annotator1_yn,annotator2_yn,final'];
rows.forEach((r) => lines.push([r.case_id, esc(r.route), esc(r.gap_file), esc(r.spec), '', '', ''].join(',')));
fs.writeFileSync(path.join(here, 'sheet.csv'), lines.join('\n') + '\n');
console.log(`wrote ${rows.length} rows -> annotate/sheet.csv`);
```

- [ ] **Step 3: 写评分器 + 失败测试**

创建 `diffe2e/experiments/annotate/score.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreRows } from './score.mjs';

test('scoreRows computes validity + kappa', () => {
  const r = scoreRows([
    { annotator1_yn: 'y', annotator2_yn: 'y' },
    { annotator1_yn: 'y', annotator2_yn: 'n' },
    { annotator1_yn: 'n', annotator2_yn: 'n' },
  ]);
  assert.equal(r.n, 3);
  assert.ok(r.kappa.kappa <= 1 && r.kappa.kappa >= -1);
});
```

创建 `diffe2e/experiments/annotate/score.mjs`：

```js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cohenKappa } from '../../pipeline/src/stats.mjs';

export function scoreRows(rows) {
  const labeled = rows.filter((r) => r.annotator1_yn && r.annotator2_yn);
  const pairs = labeled.map((r) => [r.annotator1_yn.trim(), r.annotator2_yn.trim()]);
  const kappa = cohenKappa(pairs);
  // arbitration: agreed label, else require r.final
  const finals = labeled.map((r) => (r.annotator1_yn === r.annotator2_yn ? r.annotator1_yn : (r.final || '').trim()));
  const valid = finals.filter((x) => x === 'y').length;
  return { n: labeled.length, kappa, semantic_validity: labeled.length ? +(valid / labeled.length).toFixed(4) : 0 };
}

function parseCSV(t) { /* reuse minimal RFC4180 parse */
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c; }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  const h = rows.shift(); return rows.filter((r) => r.length === h.length).map((r) => Object.fromEntries(h.map((k, j) => [k, r[j]])));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const rows = parseCSV(fs.readFileSync(path.join(here, 'sheet.csv'), 'utf8'));
  const res = scoreRows(rows);
  // join arm via the unblinding key and report per-arm semantic validity
  const unblindPath = path.join(here, '..', 'out', 'rq2_unblind.json');
  if (fs.existsSync(unblindPath)) {
    const unblind = JSON.parse(fs.readFileSync(unblindPath, 'utf8'));
    res.by_arm = {};
    for (const arm of ['diff', 'nodiff']) {
      res.by_arm[arm] = scoreRows(rows.filter((r) => unblind[r.case_id] === arm));
    }
  }
  fs.writeFileSync(path.join(here, '..', 'out', 'rq2_annotation.json'), JSON.stringify(res, null, 2));
  console.log(`semantic-validity=${res.semantic_validity}  kappa=${res.kappa.kappa} (n=${res.n})` +
    (res.by_arm ? `\n  diff=${res.by_arm.diff.semantic_validity}  nodiff=${res.by_arm.nodiff.semantic_validity}` : ''));
}
```

> 解盲在评分阶段才发生：标注者看不到 arm，`rq2_unblind.json` 仅用于计算分臂语义有效率（diff 臂应显著高于 nodiff 臂）。

- [ ] **Step 4: 运行确认通过 + 生成空表**

Run: `cd diffe2e && node --test experiments/annotate/score.test.mjs && node experiments/annotate/make_sheet.mjs`
Expected: 测试 PASS；生成 `annotate/sheet.csv`。

- [ ] **Step 5: 人工标注（线下，非代码）**

把 `sheet.csv` 发给两名标注者各填 `annotator1_yn/annotator2_yn`（不可见臂别）；不一致项加 `final` 列仲裁。回填后：
Run: `cd diffe2e && node experiments/annotate/score.mjs`
Expected: 输出 `semantic-validity` 与 `kappa`，写入 `out/rq2_annotation.json`。验收：n ≥ 30，κ ≥ 0.6（中等以上一致性）。

- [ ] **Step 6: 提交**

```bash
git add diffe2e/experiments/annotate/ diffe2e/experiments/out/rq2_annotation.json
git commit -m "feat(diffe2e): RQ2 semantic-validity annotation sheet + Cohen's kappa scoring"
```

---

## Phase 3：真实 LLM 修复（RQ3）+ ReproBreak 端到端

### Task 3.1: ReproBreak SQLite → JSON 导出

**Files:**
- Create: `diffe2e/realproj/reprobreak_db.mjs`

**前置：** 获取 `data/locator_break.db`（GitHub release / Zenodo / 运行其 `create_reproducible_dataset.py`），放到 `diffe2e/realproj/clones/ReproBreak/data/locator_break.db`。

- [ ] **Step 1: 实现导出（用 python3 标准库 sqlite3，无第三方依赖）**

创建 `diffe2e/realproj/reprobreak_db.mjs`：

```js
// Export ReproBreak SQLite into JSON: validated locator breaks joined with
// commit info. Uses python3 stdlib sqlite3 (no extra deps).
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DB = process.env.REPRO_BREAK_DB || path.join(here, 'clones', 'ReproBreak', 'data', 'locator_break.db');
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
  const out = execSync(`python3 -c ${JSON.stringify(PY)} ${JSON.stringify(DB)}`).toString();
  const rows = JSON.parse(out);
  fs.writeFileSync(OUT, JSON.stringify(rows, null, 2));
  console.log(`ReproBreak DB: ${rows.length} validated breaks -> ${path.relative(here, OUT)}`);
}
main();
```

- [ ] **Step 2: 运行**

Run: `cd diffe2e && node realproj/reprobreak_db.mjs`
Expected: 若 DB 存在，导出 `realproj/results/reprobreak_breaks.json`（≈449 行，含 commit_sha/test_file_path）；否则打印 SKIPPED（不报错）。

- [ ] **Step 3: 提交**

```bash
git add diffe2e/realproj/reprobreak_db.mjs
git commit -m "feat(diffe2e): export validated ReproBreak breaks from SQLite to JSON"
```

### Task 3.2: ReproBreak 端到端修复（信号检测真实化）

**Files:**
- Create: `diffe2e/realproj/reprobreak_e2e.mjs`

- [ ] **Step 1: 实现端到端（无泄漏：旧测试 + 应用源码 diff 作输入；新测试/new_locator 仅评估）**

创建 `diffe2e/realproj/reprobreak_e2e.mjs`：

```js
// End-to-end ReproBreak repair — NO GROUND-TRUTH LEAKAGE.
//
// For each validated break at commit C (parent C-1):
//   - INPUT (allowed): the OLD/broken test file (C-1, contains old_locator) +
//     the AUT APPLICATION-source diff between C-1 and C with TEST files EXCLUDED
//     (old & new app source). This is what a repair tool legitimately sees.
//   - EVALUATION-ONLY (never enters rule input or LLM prompt): the NEW test
//     file (C) and the ground-truth new_locator.
// Reports exact-match repair rate per arm (rule vs LLM). Execution validation
// (Docker overwrite mode) is optional and out of scope here.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { repair } from '../pipeline/src/repair.mjs';
import { createClient } from '../pipeline/src/llm/client.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const BREAKS = path.join(here, 'results', 'reprobreak_breaks.json');
const CLONES = path.join(here, 'clones', 'aut');
const OUT = path.join(here, 'results', 'reprobreak_e2e.json');
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

function ensureClone(repoName) {
  const dest = path.join(CLONES, repoName.replace('/', '__'));
  if (!fs.existsSync(dest)) execSync(`git clone --filter=blob:none https://github.com/${repoName} ${JSON.stringify(dest)}`, { stdio: 'pipe' });
  return dest;
}
const show = (repo, ref, file) => { try { return execSync(`git show ${ref}:${JSON.stringify(file).slice(1, -1)}`, { cwd: repo, stdio: 'pipe' }).toString(); } catch { return ''; } };
const isTestPath = (f, testFile) => f === testFile || /(\.spec\.|\.test\.|(^|\/)(tests?|e2e|cypress|__tests__)\/)/i.test(f);

// changed APPLICATION (non-test) source files in commit C — the legitimate
// structural-change context. The new TEST file is deliberately excluded.
function appDiff(repo, prev, sha, testFile) {
  let names = [];
  try { names = execSync(`git diff --name-only ${prev} ${sha}`, { cwd: repo, stdio: 'pipe' }).toString().trim().split('\n').filter(Boolean); } catch { /* */ }
  const appFiles = names.filter((f) => !isTestPath(f, testFile) && /\.(t|j)sx?$|\.vue$|\.svelte$|\.html?$|\.css$/.test(f));
  const appOld = appFiles.map((f) => show(repo, prev, f)).join('\n');
  const appNew = appFiles.map((f) => show(repo, sha, f)).join('\n');
  return { appFiles, appOld, appNew };
}

async function main() {
  if (!fs.existsSync(BREAKS)) { console.log('SKIPPED: run reprobreak_db.mjs first'); return; }
  const breaks = JSON.parse(fs.readFileSync(BREAKS, 'utf8'));
  const limit = parseInt(process.env.RB_LIMIT || '60', 10); // cap for cost/time
  const client = createClient();
  const arms = { rule: { ok: 0, n: 0 }, llm: { ok: 0, n: 0 } };
  const rows = [];
  for (const b of breaks.slice(0, limit)) {
    let repo;
    try { repo = ensureClone(b.repository_name); } catch { continue; }
    const brokenTest = show(repo, b.previous_sha, b.test_file_path); // OLD test (input)
    if (!brokenTest || !brokenTest.includes(b.old_locator)) continue;  // need the broken locator present
    // sanity: the OLD test must NOT already contain the answer
    if (brokenTest.includes(b.new_locator)) continue;
    const { appFiles, appOld, appNew } = appDiff(repo, b.previous_sha, b.commit_sha, b.test_file_path);

    // RULE arm: signals derived from APP-source diff only (no new test file)
    const ruleOut = repair(brokenTest, appOld, appNew);
    const ruleFixed = ruleOut.text.includes(b.new_locator);
    arms.rule.n++; if (ruleFixed) arms.rule.ok++;

    // LLM arm: old broken test + APP diff context only (answer excluded)
    let llmFixed = false;
    if (client.provider !== 'stub') {
      const prompt = [
        'A Playwright/Cypress test locator broke after a structural change in the application UI.',
        `Broken locator (currently in the test): ${b.old_locator}`,
        'The BROKEN test file (do not assume the fix is here):', brokenTest.slice(0, 3500),
        'Application source BEFORE the change:', appOld.slice(0, 3500),
        'Application source AFTER the change:', appNew.slice(0, 3500),
        'Using ONLY the application change above, output ONLY the single corrected locator string.',
      ].join('\n');
      const ans = await client.complete(prompt, { fallback: b.old_locator });
      llmFixed = norm(ans).includes(norm(b.new_locator));
    }
    arms.llm.n++; if (llmFixed) arms.llm.ok++;
    rows.push({ id: b.id, repo: b.repository_name, app_files: appFiles.length, rule: ruleFixed, llm: llmFixed });
    console.log(`#${b.id} ${b.repository_name} appFiles=${appFiles.length} rule=${ruleFixed} llm=${llmFixed}`);
  }
  const rate = (a) => (a.n ? +(a.ok / a.n).toFixed(4) : 0);
  fs.writeFileSync(OUT, JSON.stringify({ provider: client.provider, n: rows.length, leakage_free: true,
    rule_rate: rate(arms.rule), llm_rate: rate(arms.llm), arms, rows }, null, 2));
  console.log(`\nReproBreak e2e (leakage-free): rule=${rate(arms.rule)} llm=${rate(arms.llm)} (provider=${client.provider}, n=${rows.length})`);
}
main();
```

> **无泄漏保证**：修复输入只用「旧测试 + 应用源码 old/new（已排除测试文件）」；`new_locator` 与新测试文件仅用于比对评估。代码显式 `continue` 跳过「旧测试里已含答案」的异常样本，并断言旧测试确实含 `old_locator`。
> **已知限制（如实写入论文）**：若结构变更不在该 commit 的应用源码 diff 内（在更早 commit），则 `appFiles=0`，规则臂必然失败、LLM 臂只能靠旧测试推断——这类样本单独统计，不与有 app 信号的样本混算。DOM/trace 候选元素作为更强上下文属后续（需起服务/Docker）。

- [ ] **Step 2: 跑（先 stub 验证管道，再真实 LLM）**

Run:
```bash
cd diffe2e && RB_LIMIT=20 node realproj/reprobreak_e2e.mjs                       # stub: 仅 rule 臂有效
cd diffe2e && RB_LIMIT=60 DEEPSEEK_API_KEY=*** node realproj/reprobreak_e2e.mjs  # 加 LLM 臂
```
Expected: 产出 `reprobreak_e2e.json`，给出规则臂与 LLM 臂的端到端 exact-match 修复率（rule 预计偏低、LLM 明显更高——正是核心对比）。

- [ ] **Step 3: 提交**

```bash
git add diffe2e/realproj/reprobreak_e2e.mjs diffe2e/realproj/results/reprobreak_e2e.json
git commit -m "feat(diffe2e): end-to-end ReproBreak repair (rule vs LLM) on real per-commit source"
```

### Task 3.3: RQ3 合成主体增设 LLM 臂 + 过时分类 κ

**Files:**
- Modify: `diffe2e/experiments/run_rq3.mjs`
- Reuse: `diffe2e/experiments/annotate/score.mjs`（κ 计算）

- [ ] **Step 1: 在 RQ3 驱动中并行跑 LLM 修复臂**

在 `run_rq3.mjs` 的修复处，除规则 `repair(...)` 外，当 `client.provider !== 'stub'` 时调用 LLM 生成修复版 spec（prompt = 原 spec + oldCode/newCode 切片），写入临时 spec 重跑，记录 `after_pass_llm`。汇总加 `repair_rate_rule` 与 `repair_rate_llm`。（`createClient` 已在 import 列表外，需新增 import。）

- [ ] **Step 2: 过时分类 κ（小标注集）**

对 RQ3 各 break 的 `staleness` 分类结果导出为 `out/rq3_staleness_to_annotate.csv`（列：tag, target, model_label, human1, human2）；人工填两列后用 `score.mjs` 的 `cohenKappa` 思路算分类 κ（标签集为 STRUCTURAL_ONLY/EXPECTATION_CHANGE/SUSPECTED_REGRESSION）。验收：模型 vs 人工多数标签一致率与 κ 报告出来。

- [ ] **Step 3: 跑 + 提交**

```bash
cd diffe2e && node experiments/run_rq3.mjs                      # stub: rule 臂
cd diffe2e && DEEPSEEK_API_KEY=*** node experiments/run_rq3.mjs # 加 llm 臂
git add diffe2e/experiments/run_rq3.mjs diffe2e/experiments/out/rq3_results.json diffe2e/experiments/out/rq3_results.md
git commit -m "feat(diffe2e): RQ3 add LLM repair arm + staleness-classification kappa"
```

---

## Phase 4：真实项目成本（RQ4）

### Task 4.1: 真实 wall-clock 成本计量

**Files:**
- Create: `diffe2e/experiments/run_rq4_cost.mjs`

- [ ] **Step 1: 实现（公平对比：同 worker 数、同覆盖设置，selected 一次性传入；各重复 ≥3 次取 median/IQR）**

> 公平性要点（评审修订）：① full 与 selected **用同一条 Playwright 命令模板**、同 `--workers=W`、同 `COV_OUT` 覆盖设置；② selected 的多个 spec **一次性**传给 Playwright（让其按同样并行度跑），而非逐个冷启动顺序执行；③ 每个 arm 重复 R≥3 次，报告 **median 与 IQR**（而非单次或求和）。

创建 `diffe2e/experiments/run_rq4_cost.mjs`：

```js
// RQ4 real cost (fair): same Playwright command, same --workers, same coverage
// for both arms; selected specs passed in ONE invocation; R repeats -> median/IQR.
// Usage: node experiments/run_rq4_cost.mjs <adapter.json> "a.spec.ts,b.spec.ts" [workers] [repeats]
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadAdapter } from './real/engine.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'out', 'real');

function timeRun(adapter, specsStr, workers) {
  // Single invocation; empty specsStr => full suite. Same template+workers+COV both arms.
  const cmd = adapter.testOneCmd.replace('{spec}', `${specsStr} --workers=${workers}`.trim());
  const t = Date.now();
  try { execSync(cmd, { cwd: adapter.repoAbs, stdio: 'pipe' }); } catch { /* breaks may fail; timing still valid */ }
  return Date.now() - t;
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const quantile = (a, q) => { const s = [...a].sort((x, y) => x - y); const i = (s.length - 1) * q; const lo = Math.floor(i); return s[lo] + (s[Math.ceil(i)] - s[lo]) * (i - lo); };

function main() {
  const adapter = loadAdapter(process.argv[2]);
  const selected = (process.argv[3] || '').split(',').map((s) => s.trim()).filter(Boolean);
  const workers = parseInt(process.argv[4] || '4', 10);
  const repeats = parseInt(process.argv[5] || '3', 10);
  fs.mkdirSync(OUT, { recursive: true });

  const specPaths = selected.map((s) => path.posix.join(adapter.specGlob, s)).join(' ');
  const full = [], sel = [];
  for (let r = 0; r < repeats; r++) { full.push(timeRun(adapter, '', workers)); sel.push(timeRun(adapter, specPaths, workers)); }

  const fMed = median(full), sMed = median(sel);
  const res = {
    project: adapter.name, workers, repeats, selected_count: selected.length,
    full_ms: { median: fMed, iqr: [quantile(full, 0.25), quantile(full, 0.75)], runs: full },
    selected_ms: { median: sMed, iqr: [quantile(sel, 0.25), quantile(sel, 0.75)], runs: sel },
    wallclock_saving: fMed ? +(1 - sMed / fMed).toFixed(4) : 0,
  };
  fs.writeFileSync(path.join(OUT, `${adapter.name}_rq4.json`), JSON.stringify(res, null, 2));
  console.log(`RQ4 ${adapter.name}: full med=${fMed}ms sel med=${sMed}ms saving=${(res.wallclock_saving * 100).toFixed(1)}% (W=${workers}, R=${repeats})`);
}
main();
```

- [ ] **Step 2: 跑（selected 取该项目某过渡 dual 选择的 spec 列表；workers 固定）**

Run:
```bash
cd diffe2e && node experiments/run_rq4_cost.mjs experiments/real/adapters/cand_coverage.json "home.spec.ts,cart.spec.ts" 4 3
```
Expected: 打印 full/selected 的 **median** wall-clock 与节省比例（两 arm 同 workers=4、各重复 3 次），写 `out/real/<proj>_rq4.json`（含每次 runs 与 IQR）。

- [ ] **Step 3: 提交**

```bash
git add diffe2e/experiments/run_rq4_cost.mjs diffe2e/experiments/out/real/
git commit -m "feat(diffe2e): RQ4 real wall-clock cost (full vs selected subset)"
```

---

## Phase 5：统计聚合 + 论文映射

### Task 5.1: 真实数据统计与图

**Files:**
- Create: `diffe2e/experiments/analyze_real.mjs`

- [ ] **Step 1: 实现（合并所有 `out/real/*_rq1.jsonl`，跨真实项目算 bootstrap CI / Wilcoxon vs 基线 / 三路消融，输出 md + svg）**

创建 `diffe2e/experiments/analyze_real.mjs`，读取 `out/real/*_rq1.jsonl`，对 `coverage_only/uidiff_only/dual` 三方法分别算 Reduction/Safety/Precision 的均值与 bootstrap 95% CI（复用 `pipeline/src/stats.mjs` 的 `bootstrapCI`/`mean`），并对 dual vs coverage_only 做 Wilcoxon（复用 `wilcoxonP`）；写 `out/real/real_rq1_stats.md` 与 `out/real/figs/real_rq1.svg`（复用 `analyze.mjs` 的 `svgBars` 逻辑，可抽取为共享函数）。

验收：跨 ≥2 项目的真实选择指标 + CI + 与基线显著性，全部落到 `real_rq1_stats.md`。

- [ ] **Step 2: 跑 + 提交**

```bash
cd diffe2e && node experiments/analyze_real.mjs
git add diffe2e/experiments/analyze_real.mjs diffe2e/experiments/out/real/
git commit -m "feat(diffe2e): cross-project real RQ1 statistics + figure"
```

### Task 5.2: 聚合报告纳入真实/LLM/κ 小节

**Files:**
- Modify: `diffe2e/experiments/aggregate.mjs`

- [ ] **Step 1: 在 EXPERIMENT_REPORT 中新增小节**

读取并渲染（存在才渲染，沿用现有 `readJ`/`fs.existsSync` 守卫模式）：
- `## 1.7 真实项目 RQ1`：每个 `out/real/<proj>_rq1.json` 一行 + 跨项目统计摘要（来自 `real_rq1_stats.md` 的关键数）。
- `## 2.1 RQ2 双臂`：diff 臂 vs nodiff 臂 execRate/relRate + `rq2_annotation.json` 的语义有效率与 κ。
- `## 3.6 ReproBreak 端到端`：`reprobreak_e2e.json` 的 rule_rate vs llm_rate。
- `## 4.1 真实成本`：`<proj>_rq4.json` 的 wall-clock 节省。
更新「6. 有效性威胁」：删除「全部 stub / 仅合成主体」表述，改为列出已补的真实证据与仍存的局限（执行验证 449/Docker 等）。

- [ ] **Step 2: 跑 + 提交**

```bash
cd diffe2e && node experiments/aggregate.mjs
git add diffe2e/experiments/aggregate.mjs diffe2e/EXPERIMENT_REPORT.md diffe2e/REPRODUCE.md
git commit -m "feat(diffe2e): aggregate real-project/LLM/kappa results into experiment report"
```

### Task 5.3: 数据 → 论文章节映射表

**Files:**
- Create: `diffe2e/docs/THESIS_MAPPING.md`

- [ ] **Step 1: 写映射表**

创建 `diffe2e/docs/THESIS_MAPPING.md`，列出每个论文章节/图/表对应的产物文件与结论，例如：

```markdown
# 数据产物 → 论文章节映射

| 论文位置 | 数据/图表来源 | 一句话结论 |
|---|---|---|
| 第4章 RQ1 表4-1 | out/rq1_summary.md + out/real/*_rq1.json | 合成+真实项目上 dual 选择 Safety≈1、Reduction 高 |
| 第4章 RQ1 图4-1 | out/figs/rq1_metrics.svg + out/real/figs/real_rq1.svg | 方法 vs 基线 |
| 第4章 RQ1 消融 | out/rq1_stats.md「信号消融」段 | coverage 安全主干、UI 信号在粗覆盖处增益 |
| 第4章 RQ2 表4-2 | out/rq2_results.md（双臂）+ rq2_annotation.json | diff 约束提升相关性/可执行率/语义有效率(κ) |
| 第4章 RQ3 表4-3 | out/rq3_results.md + realproj/results/reprobreak*.json | 规则 vs LLM 修复；真实 locator 断裂端到端 |
| 第4章 RQ4 | out/real/*_rq4.json + aggregate RQ4 | 真实 wall-clock 节省 |
| 第5章 威胁 | EXPERIMENT_REPORT「6.」 | 诚实局限与边界 |
```

- [ ] **Step 2: 提交**

```bash
git add diffe2e/docs/THESIS_MAPPING.md
git commit -m "docs(diffe2e): map experiment artifacts to thesis chapters/figures"
```

---

## Self-Review（作者自查，已执行）

**1. Spec coverage**：RQ1 真实项目（Phase 1）、RQ2 真实 LLM+基线+κ（Phase 2）、RQ3 LLM+ReproBreak 端到端+分类 κ（Phase 3）、RQ4 真实成本（Phase 4）、统计+聚合+论文映射（Phase 5）——覆盖「完成判据」5 项。

**2. Placeholder scan**：代码步骤均给出完整可运行代码；线下/需 key 的步骤（标注、真实 LLM、获取 DB、接入项目）已显式标注为前置依赖与协议，非占位符。

**3. Type/接口一致性**：
- `computeTransition` 返回 `{ all, affected, methods, metrics }`，`run_rq1_real.mjs` 按此消费（`r.methods.dual` / `r.metrics.*`）。
- `selectByGenericCoverage(cov, changed)` / `toRepoRel(p, root)` 签名在 `covpath.mjs` 定义、`engine.mjs` 调用一致。
- `cohenKappa(pairs)` 在 `stats.mjs` 定义，`score.mjs` 与 RQ3 分类 κ 复用。
- `domdiff.mjs` 的 `changedUiSignals`/`selectByDomDiff`、`uidiff.mjs` 的 `extractFromCode`/`semanticDiff`、`repair.mjs` 的 `repair`、`llm/client.mjs` 的 `createClient` 均为现有导出，已在前文代码中确认。

**已知风险/降级**：真实项目逐 commit 装依赖/起服务可能失败 → 引擎按稳定性闸门跳过并写 skip log；ReproBreak DB 不可得 → `reprobreak_db.mjs` 打印 SKIPPED，端到端退化为已完成的 CSV 上界结果；无 LLM key → 仅规则臂，LLM 臂记为 NA。这些降级都不阻塞「合成+ReproBreak CSV+真实 RQ1」这条最小可写论文路径。

---

## 评审修订记录（v2，针对外部评审的 4 个主要问题 + 3 条次要建议）

**主要问题（已修）：**
1. **ReproBreak ground-truth 泄漏（Task 3.2）** → 重写：修复输入仅「旧测试 + 应用源码 old/new diff（排除测试文件）」；`new_locator` 与新测试文件仅评估用；代码断言旧测试含 `old_locator` 且不含答案，否则跳过。`appFiles=0`（结构变更不在本 commit）的样本单独统计。
2. **RQ1 replay 失败/不稳定处理（Task 1.4）** → 加稳定性闸门：仅 V_old 与 V_new 覆盖**均非空**、且 V_old 测试集在 V_new 存活率 ≥ 50% 的 transition 进入主结果；安装失败/空覆盖/测试集塌缩写入 `*_rq1_skips.json`。明确 V_new 测试失败（断裂）不是跳过理由。
3. **RQ2 标注链路断裂（Task 2.2/2.3）** → run_rq2 显式输出双臂盲标注行（含 spec/route/gap_file/case_id，隐藏 arm）到 `rq2_to_annotate.jsonl` + 解盲键 `rq2_unblind.json`；make_sheet 用其 case_id；score 解盲算分臂语义有效率。
4. **RQ4 成本不公平（Task 4.1）** → 重写：full 与 selected 用同一命令模板、同 `--workers`、同覆盖设置；selected 一次性传入单次调用；各 arm 重复 ≥3 次报告 median/IQR。

**次要建议（已纳入顶部「评审修订要点」）：** 开发顺序可并行但**最终闭环评估顺序固定为 选择→运行/修复→缺口→生成**；每个 `git commit` 改为**需用户授权的可选提交点**；RQ1 完成判据补 **Reduction ≥ 0.30 / Precision ≥ 0.50** 的工程价值下限（防止靠多选刷 Safety）。

---

## 导师评审意见（v3）补充计划

> 来源：导师对《研究进展汇报_导师版_核实优化v2.1》的 6 条意见（按导师给出的重要程度排序）。本节先**原样记录意见**，再把每条落成可执行的新阶段/任务（Phase 6–10）与对现有 RQ 框架的修订。这些任务大多产出**论文正文 + 形式化定义 + 实验证据**三类交付物，部分需要新增代码模块。

### 意见原文（按重要程度）

1. **召回率（Safety）不可被 compromise。** 宁可多跑也不能漏测。需要在**理论上证明**方法不会遗漏应执行的测试用例，并用**合理实验**验证确实不漏。当前看不出召回保证是怎么做到的。
2. **副作用 / 间接依赖假设。** 可能存在某测试用例并不直接触达 diff 相关代码，但它影响某一系统状态（存在副作用），从而**间接**影响 diff 相关代码。请验证该假设是否成立，若成立方法需覆盖这种情况。
3. **技术路线与创新点不够清晰严谨。** 目前只用自然语言描述。创新点似乎是"测试用例到代码的映射器"，但它是**什么结构、如何高效构建与维护**没有说清楚。
4. **实验缺设计、缺可信量化结果。** 要在问题定义之初就**量化目标**（例如：只执行必要用例 / 最小变更相关用例集；给出节约比例与时间）。核心问题应表述为：**「测试选择算法执行时间 + 选中用例执行时间」是否远小于「全量执行时间」**？并讨论**时间是否唯一指标**，其他计算资源是否也要测。
5. **相关工作调研偏粗。** 需从两个关注点构造区分维度：**（1）代码变更感知**（要求定向分析与生成）、**（2）浏览器端到端测试**（区别于单元测试等局部测试，需全局上下文分析）。要在技术层面指出现有工作不足并引出本方法。
6. **标题不应突出 Playwright。** 它只是工具，方法理论上可迁移到 Selenium / Cypress。标题应体现"代码变更感知"。建议：**《代码变更感知的 Web 应用端到端回归测试用例选择与生成方法研究》**。

### 对现有计划的总体影响

- **完成判据新增（v3）：** 在原 5 项之外，补 3 项硬指标：
  6. **召回保证**：给出可证明的安全性论证（Phase 6）+ 用**非循环的、基于真实结果差异/变异**的 oracle 验证 Safety（Phase 6），而非用覆盖映射自证覆盖。
  7. **副作用情形被显式处理**：至少 1 个注入副作用的场景，证明 naive 覆盖选择会漏、状态依赖闭包能补回（Phase 7）。
  8. **净收益量化**：报告 `T_select + T_run(Sel)` vs `T_full` 的净节省与盈亏平衡点，并报告时间以外的至少 1 项资源指标（Phase 8）。
- **标题与问题定义全局替换**：去掉 Playwright 限定，改为工具无关表述（Phase 10）。

---

## Phase 6：可证明的召回保证（意见 1）+ 方法形式化（意见 3）

> **核心矛盾（必须正面回应）**：现有 `oracle.mjs` 的 affected 集合是用 `selectByCoverage(covVnew, changed)` 构造的——与选择器同源，导致 Safety 近乎自证、缺乏说服力。Phase 6 要做两件事：(a) 把"应执行的测试集 A\*"用**与选择器无关**的方式定义并经验测量；(b) 给出选择规则 `Sel ⊇ A*` 的安全性论证及其成立假设。

### Task 6.1: 安全性形式化与定理（论文 + 文档）

**Files:**
- Create: `diffe2e/docs/SAFETY.md`（形式化定义、假设、安全性命题与证明草图；后并入论文方法/理论章节）

- [ ] **Step 1: 形式化定义**
  - 变更实体集 `Δ`（文件/函数/路由/组件/UI 节点，多粒度）。
  - 覆盖映射 `cov: T → 2^Δ`（测试触达的实体）。
  - **真正受影响集** `A* = { t ∈ T : outcome_{Vold}(t) ≠ outcome_{Vnew}(t) 在某确定性语义下可能不同 }`——**不依赖选择器**。
  - 选择规则 `Sel = SelCov ∪ SelUI`，其中 `SelCov = { t : cov(t) ∩ Δ ≠ ∅ }`。
- [ ] **Step 2: 安全性命题 + 假设**
  - 命题：在 (H1) 测试确定性、(H2) 覆盖映射完备（执行到的实体都被记录）、(H3) 变更实体粒度覆盖所有语义改动 三个假设下，`A* ⊆ SelCov ⊆ Sel`，即**覆盖信号臂本身即安全**；UI 语义臂只增不减（并集），故 `Sel` 安全。
  - 证明草图：若 `t ∉ SelCov`，则 `cov(t) ∩ Δ = ∅`，t 未执行任何变更实体；在 H1–H3 下其执行轨迹与结果在 V_old/V_new 不变，故 `t ∉ A*`。取逆否即 `A* ⊆ SelCov`。
  - **显式列出假设何时失效**：H1 失效（flaky/时间相关）、H2 失效（动态加载/SSR/未插桩代码）、H3 失效（配置/数据/**副作用**导致的语义改动不在 Δ 内）——其中副作用情形交 Phase 7 专门处理。
- [ ] **Step 3: 把它接到 thesis 映射**：在 `THESIS_MAPPING.md` 增加"理论：安全性命题"行。

### Task 6.2: 非循环的"受影响" oracle（结果差异 oracle）

**Files:**
- Create: `diffe2e/pipeline/src/outcome_oracle.mjs`
- Test: `diffe2e/pipeline/test/outcome_oracle.test.mjs`

- [ ] **Step 1: 写失败测试**：`buildAffectedByOutcome({ resVold, resVnew })` 返回在两版本上 pass/fail 或断言结果发生变化的测试集；与覆盖无关。
- [ ] **Step 2: 实现**：输入两版本的逐用例执行结果（pass/fail/error + 可选断言指纹），输出结果发生变化的测试 id 集合 `A_obs`。
- [ ] **Step 3: 安全性验证指标**：新增 `SafetyEmp = |Sel ∩ A_obs| / |A_obs|`，与原覆盖型 Safety **并列报告**。`A_obs` 即"应执行且不可漏"的经验真值（来自全量跑 V_new 的真实结果差异），打破自证循环。
- [ ] **Step 4: 漏选个案审计**：任何 `A_obs \ Sel ≠ ∅` 的样本，逐条记录到 `out/safety_misses.json`（实体、原因：H1/H2/H3 哪条失效），论文如实分析。

### Task 6.3: 变异 / 故障注入增强真值（强化召回实验）

**Files:**
- Create: `diffe2e/experiments/run_safety_mutation.mjs`

- [ ] **Step 1:** 在受控主体上对变更实体做小型变异（改文案/属性/逻辑分支），重跑全量得到 `A_obs^{mut}`，检验 `Sel` 是否仍覆盖所有结果变化的测试。
- [ ] **Step 2:** 报告 `SafetyEmp`（在自然 diff 与变异两种真值下），目标 **= 1.0**；任何 < 1.0 个案进 `safety_misses.json` 并归因。
- [ ] **Step 3:** 把"覆盖信号臂单独的 SafetyEmp"也报出来，用以支撑 Task 6.1 的"覆盖臂即安全"命题。

### Task 6.4: 映射器（Test↔Code Mapper）的形式化结构（意见 3）

**Files:**
- Create: `diffe2e/docs/MAPPER.md`（数据模型 + 构建算法 + 增量维护 + 复杂度；并入论文方法章节）

- [ ] **Step 1: 数据模型**：把"映射器"明确为一个**带类型的二部索引** `M ⊆ E × T`，其中实体节点 `E = 文件 ∪ 函数 ∪ 路由 ∪ 组件 ∪ UI 语义节点(text/testId/role/aria/href/handler)`，测试节点 `T`。给出 schema（JSON/表）与每条边的来源（动态覆盖边 / 静态 UI 语义边）。
- [ ] **Step 2: 构建算法**：动态边 = 逐用例插桩执行（istanbul / CDP）；静态 UI 边 = AST 抽取 UI 语义节点并与测试定位器做语义匹配（复用 `uidiff.mjs` / `selector.mjs`）。给出伪代码与一次全量构建复杂度。
- [ ] **Step 3: 增量维护（关键，回应"如何高效维护"）**：定义增量更新规则——只对"触达变更文件的测试"重插桩、对变更文件重抽 UI 语义边；其余边复用旧映射。给出增量复杂度，并论证它使 `T_select` 在长期 CI 中**摊销**到很小（接到 Phase 8 的盈亏平衡分析）。
- [ ] **Step 4: 架构图**：画 5 步闭环 + 映射器作为持久化、增量维护的中枢；标注 Semantic UI Diff 作为"源码 diff↔浏览器操作"的桥（创新点定位）。

---

## Phase 7：副作用 / 状态依赖建模（意见 2）

> **假设确认**：导师假设成立。覆盖型 RTS 的经典安全性依赖"测试隔离"（H1/H3）。当测试间通过**共享状态**（DB、localStorage/sessionStorage、cookie、全局变量、后端持久化、外部服务）耦合时，一个不直接触达 Δ 的测试 t 可能：(a) 为受影响测试建立前置状态；(b) 其行为依赖被 Δ 改动的状态写入逻辑。此时 `cov(t) ∩ Δ = ∅` 但 t 实际受影响——naive 文件级覆盖会漏。

### Task 7.1: 状态依赖的形式化与安全闭包

**Files:**
- Modify: `diffe2e/docs/SAFETY.md`（新增"副作用与状态依赖"小节）

- [ ] **Step 1:** 定义状态资源集 `R`（storage key / endpoint / table / 全局符号），测试的**读写足迹** `rw: T → 2^{R×{read,write}}`。
- [ ] **Step 2:** 定义状态依赖关系 `t1 ⤳ t2`（t1 写、t2 读同一资源，或执行序上 t1 先于 t2）。**安全扩展**：`SelClosed = 闭包(Sel) =` 在 `⤳` 关系下，凡与 `Sel ∩ A*` 共享资源者保守纳入。
- [ ] **Step 3:** 给出修订命题：在放宽 H3（允许副作用）后，`A* ⊆ SelClosed`，代价是 Reduction 下降——把"召回不可妥协、宁可多跑"显式编码进方法。

### Task 7.2: 状态足迹采集与依赖图（代码）

**Files:**
- Create: `diffe2e/pipeline/src/statedep.mjs`
- Test: `diffe2e/pipeline/test/statedep.test.mjs`

- [ ] **Step 1: 写失败测试**：`buildStateGraph(footprints)` 输入逐用例 `{ test, reads:[r], writes:[r] }`，输出 `t→t` 依赖边；`closeSelection(sel, graph)` 返回纳入共享资源依赖后的扩展选择集。
- [ ] **Step 2: 实现**：纯函数构图 + 闭包；采集层（运行期 hook localStorage/网络/全局）作为 live helper（单测只测纯逻辑）。
- [ ] **Step 3:** 在选择器中提供可选开关 `--state-closure`，默认 conservative=on（体现"宁可多跑不漏"）。

### Task 7.3: 副作用场景实验（证伪/证实）

**Files:**
- Create: `diffe2e/experiments/run_sideeffect.mjs`

- [ ] **Step 1:** 在受控主体注入一条副作用链：测试 A（写 localStorage/后端状态，不触达 Δ）→ 变更 Δ 改了消费该状态的代码 → 测试 B 行为改变。
- [ ] **Step 2:** 对比：naive 文件级覆盖（漏 A）vs 状态闭包选择（纳入 A）；用 Task 6.2 的结果差异 oracle 证明 A ∈ A_obs。
- [ ] **Step 3:** 报告：副作用场景下两种方法的 SafetyEmp 与 Reduction，量化"安全闭包"的召回收益与成本代价。

---

## Phase 8：量化目标与净收益成本实验（意见 4）

> **问题在定义之初就量化**：目标 = 在 **SafetyEmp = 1** 约束下，最小化执行用例数与端到端时间。核心判据：**`T_select + T_run(Sel) ≪ T_full`**。并报告时间以外的资源。

### Task 8.1: 成本模型与指标定义

**Files:**
- Create: `diffe2e/docs/COST_MODEL.md`

- [ ] **Step 1: 时间分解**：`T_full`、`T_select = T_mapper_update + T_diff_analyze + T_select_compute`、`T_run(Sel)`。定义 **净节省** `NetSaving = 1 − (T_select + T_run(Sel)) / T_full` 与 **盈亏平衡**：在何种 suite 规模 / 选择率下净节省 > 0。
- [ ] **Step 2: 比例指标**：`Reduction`（少跑用例比例，如 200/10000 = 98%）与时间节省解耦报告——强调"少跑 98% 不等于省 98% 时间"（导师原话）。
- [ ] **Step 3: 非时间资源**：CI 机器分钟（machine-minutes）、峰值并行 worker / 浏览器实例数、峰值内存、（修复/生成臂）LLM token 与 $；可选能耗。明确哪些是关注指标及理由。
- [ ] **Step 4: 摊销论证**：结合 Phase 6.4 的增量维护，论证 `T_mapper_update` 在长期 CI 中被摊销，首次全量构建成本单列。

### Task 8.2: 净收益实验（扩展 RQ4）

**Files:**
- Modify: `diffe2e/experiments/run_rq4_cost.mjs`（在 Phase 4 基础上加 `T_select` 计量与净节省）

- [ ] **Step 1:** 在公平对比（同 workers/命令/覆盖设置、各重复 ≥3 取 median/IQR）基础上，**额外计时** `T_select`（映射器增量更新 + diff 分析 + 选择计算），输出 `NetSaving` 与盈亏平衡点。
- [ ] **Step 2: 真实项目报告**：至少 1 个真实项目上给出 `T_full / T_select / T_run(Sel) / NetSaving` 与 Reduction 同表，呈现"少跑比例 vs 实际时间节省"的差距。
- [ ] **Step 3: 资源指标**：记录 machine-minutes 与峰值并行度；LLM 臂记录 token/$。

### Task 8.3: 问题定义量化化（报告/论文）

**Files:**
- Modify: 进展汇报与论文"解决问题/成功标准"章节

- [ ] **Step 1:** 把"少跑/不漏/能跑/相关"改写为带阈值与公式的量化目标（SafetyEmp=1、Reduction、NetSaving、盈亏平衡规模），并在问题陈述处即给出 200/10000 这类直觉示例。

---

## Phase 9：相关工作矩阵与定位（意见 5）

**Files:**
- Create: `diffe2e/docs/RELATED_WORK.md`（结构化对比 + 叙述；并入论文相关工作章节）

- [ ] **Step 1: 两维框架**：维度 A = **代码变更感知程度**（无 / 粗粒度文件级 / 细粒度定向分析与生成）；维度 B = **测试层级与上下文**（单元/集成的局部上下文 vs 浏览器 E2E 的全局上下文：页面/路由/DOM/定位器）。
- [ ] **Step 2: 对比矩阵**：把现有参考文献按 RTS/变更影响分析、E2E 生成、E2E 修复 三族，逐篇标注（变更感知？E2E？全局上下文分析？diff 作为核心输入？闭环？），形成一张表。
- [ ] **Step 3: 技术不足→引出本方法**：对每族指出技术层面缺口——单元 RTS 无法跨越源码↔DOM/定位器鸿沟；E2E 生成多不以 diff 为核心；E2E 修复多"失败后修测试"、不以源码 diff 为上下文，也不服务于 targeted 集整体可用性。由此引出"代码变更感知 + 全局 UI 语义桥接"的定位。
- [ ] **Step 4:** 至少 2–3 个对比维度上明确 SOTA 边界，确保区分度可被审稿人验证。

---

## Phase 10：标题与工具无关化（意见 6）

**Files:**
- Modify: 进展汇报、论文标题与全文工具表述、`THESIS_MAPPING.md`

- [ ] **Step 1: 改标题**为 **《代码变更感知的 Web 应用端到端回归测试用例选择与生成方法研究》**（去 Playwright）。
- [ ] **Step 2: 工具无关化**：正文将 Playwright 降级为"实现实例"，明确方法对 Selenium / Cypress 等同样适用（定位器与覆盖/UI 语义抽象是工具无关的），并说明实现选择 Playwright 的工程原因（trace/coverage 支持好）。
- [ ] **Step 3:** 全文检索替换"Playwright E2E 方法"为"Web 端到端方法（以 Playwright 为实现）"，保持术语一致。

---

## 导师意见 → 计划落点速查表

| 导师意见 | 落点 | 关键交付物 |
|---|---|---|
| 1 召回不可妥协 + 理论证明 + 实验 | Phase 6（6.1–6.3） | `SAFETY.md` 安全性命题；非循环 `A_obs`/变异真值的 `SafetyEmp=1` 证据；漏选审计 |
| 2 副作用/间接依赖 | Phase 7 | 状态依赖闭包形式化 + `statedep.mjs` + 注入副作用实验 |
| 3 技术路线/创新点/映射器结构 | Phase 6.4 + Task 6.1 | `MAPPER.md`（数据模型/构建/增量维护/复杂度）+ 架构图 |
| 4 量化目标与净收益实验 | Phase 8 | `COST_MODEL.md`；`NetSaving`/盈亏平衡；非时间资源；问题定义量化 |
| 5 相关工作 | Phase 9 | `RELATED_WORK.md` 两维对比矩阵 + 技术缺口叙述 |
| 6 标题去 Playwright | Phase 10 | 新标题 + 工具无关化全文修订 |

---

## v3 执行进度（已落地）

> 下表记录 v3 各 Phase 的实际执行状态。代码均通过 `node --test`（50/50 通过），关键召回实验已用真实 Playwright 跑出数据。

| Phase / Task | 状态 | 产物 | 验证结果 |
|---|---|---|---|
| 6.1 安全性形式化 | ✅ 完成 | `diffe2e/docs/SAFETY.md` | 命题 1（覆盖臂即安全，含证明）+ H1–H3 假设边界 + 命题 2（副作用闭包） |
| 6.2 非循环结果差异 oracle | ✅ 完成 | `pipeline/src/outcome_oracle.mjs` + `test/outcome_oracle.test.mjs` | 7/7 单测通过 |
| 6.2′ 接入 RQ1 驱动 | ✅ 完成 | `experiments/run_rq1.mjs`（新增 SafetyEmp + 漏选审计） | 实跑：**SafetyEmp(ours)=1.0、SafetyEmp(coverage_only)=1.0、0 漏选**（4 个有 observed-affected 的过渡）；产物 `out/rq1_summary.json`、`out/safety_misses.json`（空） |
| 6.3 变异召回压力测试 | ✅ 完成 | `experiments/run_safety_mutation.mjs` | 实跑：4 文件 mean SafetyEmp=1.0、all_safe=true、0 漏选；`home.js` 变异产生 1 个 observed-affected 且被覆盖臂命中（非空有效样本）；产物 `out/safety_mutation.json` |
| 6.4 映射器形式化 | ✅ 完成 | `diffe2e/docs/MAPPER.md` | 二部索引数据模型 + 构建/增量维护算法 + 复杂度 + 摊销论证 |
| 7.1 副作用形式化 | ✅ 完成 | `SAFETY.md` §5 + 命题 2 | 确认导师假设成立；给出状态闭包安全性论证 |
| 7.2 状态依赖闭包模块 | ✅ 完成 | `pipeline/src/statedep.mjs` + `test/statedep.test.mjs` | 5/5 单测通过（writer→reader 依赖 + 保守闭包 + 幂等） |
| 7.3 副作用 live 实验 | ⬜ 待做 | `experiments/run_sideeffect.mjs` | **需先制作含副作用链的 fixture**（测试 A 写 localStorage/后端态 → Δ 改消费方 → 测试 B 行为变）；机制已被 7.2 单测与命题 2 证明 |
| 8 成本模型 + 净收益 | ✅ 完成 | `diffe2e/docs/COST_MODEL.md` + `experiments/run_rq4_cost.mjs` | NetSaving/盈亏平衡/SelectionTax + median/IQR + machine-minutes/token 资源位；`T_select` 显式计时（语法校验通过，待真实项目接入跑数） |
| 9 相关工作矩阵 | ✅ 完成 | `diffe2e/docs/RELATED_WORK.md` | 两维框架(A0–A2 × B0/B1) + 三族逐篇标注 + (A2,B1) 空白定位 |
| 10 标题去 Playwright | ✅ 完成 | `研究进展汇报_导师版_核实优化v2.1.md` 题目行 | 改为《代码变更感知的 Web 应用端到端回归测试用例选择与生成方法研究》+ 工具无关说明 |

**关键结论（回应导师意见 1）**：召回保证已从"用覆盖映射自证"升级为"用与选择器无关的真实结果差异 oracle 验证"，并在受控主体上实测 **SafetyEmp = 1.0、0 漏选**，理论侧由 `SAFETY.md` 命题 1 给出条件安全证明。

**下一步（建议）**：① 制作副作用链 fixture 完成 7.3 的 live 证据；② 接入真实项目 adapter 后跑 `run_rq4_cost.mjs` 得到真实 NetSaving；③ 把 `docs/SAFETY.md`、`MAPPER.md`、`COST_MODEL.md`、`RELATED_WORK.md` 正文整合进论文对应章节。
