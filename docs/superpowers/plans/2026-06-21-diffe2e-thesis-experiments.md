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
