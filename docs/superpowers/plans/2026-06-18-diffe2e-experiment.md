# DiffE2E 完整实验 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. 本计划设计为**全自动执行**：每阶段结束须 (a) 跑通验证命令，(b) `git commit`，(c) 自动进入下一阶段。无外部依赖即可跑通核心结论（RQ1）。

**Goal:** 实现并跑通 DiffE2E（面向 Code Diff 的 Playwright E2E 针对性回归测试）的完整实验，产出 RQ1（选择）/RQ2（生成）/RQ3（修复）/RQ4（成本）的真实指标、统计检验、图表与可复现包。

**Architecture:** Node ESM 纯函数管线（零运行时依赖，`node:test` 做 TDD）+ Playwright/istanbul 覆盖采集。**主实验对象 = 受控多文件应用 + 真实脚本化 git 历史（20–30 commit）**，保证 RQ1 全自动产出真实数字；真实 E2EGit 项目作为外部效度增强（尽力而为）。生成/修复用**可插拔 LLM 客户端**：无 API key 时走**确定性 stub**（基于邻居用例 + Semantic UI Diff 的模板合成），有 key 时切真实模型。

**Tech Stack:** Node 24 (ESM, `node:test`), Playwright + Chromium, istanbul/CDP coverage, TypeScript Compiler API（JSX 语义抽取）, git。

---

## 文件结构（决定分解边界）

```text
diffe2e/pipeline/                 # 受测核心库（零依赖、可单测）
├── package.json                  # type:module; scripts: test
├── src/
│   ├── diff.mjs                  # 解析 git diff -> {files, hunks, addedLines, removedLines}
│   ├── astEntities.mjs           # TS 编译器 API: 变更文件 -> 变更符号/函数/JSX 实体
│   ├── uidiff.mjs                # Semantic UI Diff（从 real/uidiff.mjs 移植 + 导出函数）
│   ├── coverageMap.mjs           # istanbul/CDP 覆盖 -> cov[test]={files,lines}
│   ├── selector.mjs              # 双信号选择: 覆盖 ∪ UI-locator
│   ├── oracle.mjs                # V_new 全量覆盖 -> Affected oracle
│   ├── metrics.mjs               # Reduction/Safety/Precision/SelChangeCov/FinalChangeCov/Usability
│   ├── gap.mjs                   # 覆盖缺口分析
│   ├── llm/client.mjs            # 可插拔 LLM 客户端（env 决定 stub|openai|anthropic|deepseek）
│   ├── generate.mjs              # diff 约束生成（用 client + 邻居用例 + uidiff）
│   ├── staleness.mjs             # 过时三分类（STRUCTURAL_ONLY/EXPECTATION_CHANGE/SUSPECTED_REGRESSION）
│   ├── repair.mjs                # locator/断言修复（uidiff 候选 + client）
│   ├── stats.mjs                 # McNemar / Wilcoxon / bootstrap CI / Cliff's δ
│   └── reporter.mjs              # JSON + Markdown 报告
├── test/                         # node:test 单测（每模块一份）
└── fixtures/                     # 单测用最小输入（含 cand_coverage JSX 副本）

diffe2e/subject/                  # 主实验对象：多文件应用 + 脚本化 git 历史
├── app/                          # 多路由可插桩应用（src/*.js + index.html + server.mjs）
├── tests/                        # Playwright spec + CDP 覆盖 fixture
├── playwright.config.ts
├── history/seed.mjs              # 生成 20–30 个带类型标签的 commit（UI/路由/逻辑/locator-break）
└── README.md

diffe2e/experiments/
├── replay.mjs                    # commit-replay 引擎: 遍历 commit -> 指标 -> 数据集行
├── baselines.mjs                 # retest-all / random / static-heuristic / coverage-only
├── run_rq1.mjs                   # RQ1 主实验入口
├── run_rq2.mjs                   # RQ2 生成
├── run_rq3.mjs                   # RQ3 修复
├── run_rq4.mjs                   # RQ4 成本聚合
├── analyze.mjs                   # 统计 + 表格 + 简单 SVG 图
└── out/                          # 数据集 csv/jsonl + 指标 + 图（gitignored 大文件，保留汇总）

diffe2e/realproj/                 # 尽力而为的真实 E2EGit 项目
├── gate.mjs                      # 可插桩闸门批量筛查
└── results/
```

---

## 全局约定

- **每个任务 = 2–5 分钟一步**：写失败测试 → 跑失败 → 最小实现 → 跑通过 → commit。
- **验证命令统一**：`cd diffe2e/pipeline && node --test`（或指定文件）。
- **提交规范**：每阶段一个 commit，消息 `feat(diffe2e): <phase> ...`；阶段内可多次小 commit。
- **无泄漏铁律**：selector 只吃 `V_old` 覆盖 + diff；`V_new` 全量覆盖只用于 oracle。
- **确定性**：stub LLM、固定随机种子（random baseline 用 seedrandom 思路的可复现 PRNG）。

---

# 阶段 0：骨架与 gitignore（全自动）

**Files:**
- Create: `diffe2e/pipeline/package.json`, `diffe2e/pipeline/src/metrics.mjs`, `diffe2e/pipeline/test/metrics.test.mjs`
- Modify: `diffe2e/.gitignore`

- [ ] **Step 1: gitignore 外部克隆与产物**

把以下加入 `diffe2e/.gitignore`：
```
real/cand_coverage/
real/cand_movies/
realproj/clones/
experiments/out/*.zip
**/.nyc_output/
**/test-results/
```

- [ ] **Step 2: 建 pipeline 包**

`diffe2e/pipeline/package.json`：
```json
{
  "name": "diffe2e-pipeline",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test" }
}
```

- [ ] **Step 3: 写第一个失败测试（metrics）**

`diffe2e/pipeline/test/metrics.test.mjs`：
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { selectionMetrics } from '../src/metrics.mjs';

test('selectionMetrics computes Reduction/Safety/Precision', () => {
  const m = selectionMetrics({
    full: ['a', 'b', 'c', 'd'],
    selected: ['a'],
    affected: ['a'],
  });
  assert.equal(m.Reduction, 0.75);
  assert.equal(m.Safety, 1);
  assert.equal(m.Precision, 1);
});
```

- [ ] **Step 4: 跑测试确认失败**

Run: `cd diffe2e/pipeline && node --test test/metrics.test.mjs`
Expected: FAIL（找不到 `../src/metrics.mjs`）。

- [ ] **Step 5: 最小实现 metrics.selectionMetrics**

`diffe2e/pipeline/src/metrics.mjs`：
```js
const inter = (a, b) => a.filter((x) => new Set(b).has(x));
export function selectionMetrics({ full, selected, affected }) {
  const S = full.length, sel = selected.length, aff = affected.length;
  const hit = inter(selected, affected).length;
  return {
    Reduction: S ? +(1 - sel / S).toFixed(4) : 0,
    Safety: aff ? +(hit / aff).toFixed(4) : 1,
    Precision: sel ? +(hit / sel).toFixed(4) : 1,
    selected_count: sel, affected_count: aff, full_suite: S,
  };
}
```

- [ ] **Step 6: 跑测试确认通过**

Run: `cd diffe2e/pipeline && node --test`
Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add diffe2e/.gitignore diffe2e/pipeline
git commit -m "feat(diffe2e): phase0 pipeline skeleton + metrics core (TDD)"
```

**阶段验收**：`node --test` 全绿；commit 成功。

---

# 阶段 1：核心确定性模块（TDD）

逐模块（diff / coverageMap / uidiff / astEntities / selector / oracle / gap / reporter / stats）：每个先写失败测试再实现。下面给出关键模块的契约与代表性测试；其余同构。

### Task 1.1 — coverageMap

**Files:** Create `src/coverageMap.mjs`, `test/coverageMap.test.mjs`

- [ ] **Step 1: 失败测试**
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileLevelFromCDP, intersectsChange } from '../src/coverageMap.mjs';

test('fileLevelFromCDP keeps only executed /src/*.js urls', () => {
  const entries = [
    { url: 'http://x/src/cart.js', functions: [{ ranges: [{ count: 1 }] }] },
    { url: 'http://x/src/home.js', functions: [{ ranges: [{ count: 0 }] }] },
  ];
  assert.deepEqual(fileLevelFromCDP(entries).sort(), ['src/cart.js']);
});
test('intersectsChange true when overlap', () => {
  assert.equal(intersectsChange(['src/cart.js'], ['src/cart.js', 'x']), true);
  assert.equal(intersectsChange(['src/home.js'], ['src/cart.js']), false);
});
```
- [ ] **Step 2:** 跑失败。
- [ ] **Step 3: 实现**
```js
export function fileLevelFromCDP(entries) {
  const files = new Set();
  for (const e of entries) {
    const m = (e.url || '').match(/\/src\/[^?#]*\.js/);
    if (!m) continue;
    const exec = (e.functions || []).some((f) => (f.ranges || []).some((r) => r.count > 0));
    if (exec) files.add(m[0].replace(/^\//, ''));
  }
  return [...files];
}
export const intersectsChange = (covFiles, changed) =>
  covFiles.some((f) => new Set(changed.map(n => n.replace(/^\/+/, ''))).has(f.replace(/^\/+/, '')));
```
- [ ] **Step 4:** 跑通过。 
- [ ] **Step 5: commit** `feat(diffe2e): coverageMap module`

### Task 1.2 — diff 解析

**Files:** Create `src/diff.mjs`, `test/diff.test.mjs`
- [ ] 失败测试：给一段 `git diff --unified` 文本，断言解析出 `files=['src/cart.js']`、`added`/`removed` 行号集合。
```js
import { parseUnifiedDiff } from '../src/diff.mjs';
const sample = `diff --git a/src/cart.js b/src/cart.js
--- a/src/cart.js
+++ b/src/cart.js
@@ -10,3 +10,4 @@ function price(q){
-  return q*10
+  return q*12
+  // note
`;
// 断言: files=['src/cart.js']; changedFiles 含 src/cart.js
```
- [ ] 实现 `parseUnifiedDiff(text)`：正则扫 `+++ b/<path>` 收集文件；扫 `@@ -a,b +c,d @@` 推 added/removed 行。返回 `{files, byFile:{file:{added:Set,removed:Set}}}`。
- [ ] 通过 → commit `feat(diffe2e): unified diff parser`。

### Task 1.3 — uidiff（移植 + 导出）

**Files:** Create `src/uidiff.mjs`（从 `diffe2e/real/uidiff.mjs` 提取 `extract/semanticDiff` 为导出函数，typescript 作为 devDep），`test/uidiff.test.mjs`，`fixtures/App.old.tsx`/`App.new.tsx`（复制自 real/_uidiff_fixtures）。
- [ ] devDep：`cd diffe2e/pipeline && npm i -D typescript`。
- [ ] 失败测试：`semanticDiff(old,new)` 断言 `REMOVE` 含 `button:text:Red`，`ADD` 含 `button:text:Crimson`，`MODIFY` 含 href 变化。
- [ ] 实现：移植，`extract(file)`/`semanticDiff(oldFile,newFile)` 导出；`require('typescript')` 用 `createRequire(import.meta.url)`。
- [ ] 通过 → commit `feat(diffe2e): semantic UI diff module`。

### Task 1.4 — astEntities

**Files:** Create `src/astEntities.mjs`, `test/astEntities.test.mjs`
- [ ] 失败测试：给 `App.new.tsx` 与变更行集合，断言能定位被改动的函数名/JSX 节点（如 `handlePaintCrimson`）。
- [ ] 实现：TS 编译器 API 遍历，按行号映射到包含的函数/JSX 元素，返回变更实体列表。
- [ ] 通过 → commit `feat(diffe2e): AST changed-entity extractor`。

### Task 1.5 — selector（双信号）

**Files:** Create `src/selector.mjs`, `test/selector.test.mjs`
- [ ] 失败测试：
  - 覆盖信号：`cov={t1:['src/cart.js'],t2:['src/home.js']}`, changed=`['src/cart.js']` → 选 `t1`。
  - UI 信号：uidiff REMOVE `text:Red` + 测试源 `{App.test.ts: 'click text=Red'}` → 选 `App.test.ts`。
  - 并集 + 去重。
- [ ] 实现 `selectByCoverage(cov,changed)`、`selectByUiLocator(uidiff,testSources)`、`select(...)=并集`。
- [ ] 通过 → commit `feat(diffe2e): dual-signal selector`。

### Task 1.6 — oracle / gap / reporter / stats

- [ ] **oracle.mjs**：`buildAffected(covVnew, changed)` 同 selectByCoverage 但用 V_new。测试：与 selector 对称。commit。
- [ ] **gap.mjs**：`coverageGap(changed, coveredByTargeted)` 返回未被触达的 changed 文件/实体。测试。commit。
- [ ] **stats.mjs**：实现 `mcnemar(b,c)`、`wilcoxonSigned(pairs)`、`bootstrapCI(samples,statFn,n=2000)`、`cliffsDelta(a,b)`。每个配一个已知数值的回归测试（用教科书小样本核对）。commit。
- [ ] **reporter.mjs**：`toMarkdown(report)` / `toJSON(report)`，测试断言关键字段出现。commit。

**阶段 1 验收**：`cd diffe2e/pipeline && node --test` 全绿（≥9 个测试文件）；每模块独立 commit。

---

# 阶段 2：主实验对象（多文件应用 + 真实脚本化 git 历史）

**Files:** `diffe2e/subject/app/**`, `diffe2e/subject/tests/**`, `diffe2e/subject/playwright.config.ts`, `diffe2e/subject/history/seed.mjs`

### Task 2.1 — 多路由可插桩应用
- [ ] 基于 `diffe2e/demo-app` 扩展为 **8–10 个源码文件**、≥6 条路由（home/cart/login/profile/search/checkout/orders…），每路由独立模块 + 共享 `main.js`/`util.js`；`server.mjs` 静态服 `no-store`，端口 5181。
- [ ] 验收：`node app/server.mjs` 起服，浏览器手测各路由可渲染（用 `curl localhost:5181` 看 200）。

### Task 2.2 — Playwright 测试 + CDP 覆盖 fixture
- [ ] 复用 `diffe2e/tests/fixtures.ts` 的 CDP 逐用例覆盖 fixture（写 `COV_OUT/<test>.json`）。
- [ ] 为每条路由写 1–2 个 spec（≥10 个用例）。
- [ ] 验收：`COV_OUT=cov/base npx playwright test` 全绿且产出逐用例覆盖。

### Task 2.3 — 脚本化 git 历史
- [ ] `history/seed.mjs`：编程式产生 **24 个 commit**，每个打 tag `c01..c24` 并记录 `manifest.json`（commit、变更类型 ∈ {UI文案, 路由, 组件逻辑, 新增功能(无测试→缺口), locator-break, 多文件, 无关重构}, changedFiles）。实现方式：函数式地对 `app/src/*` 施加预定义编辑 → `git add -A && git commit`。
- [ ] 验收：`git log --oneline | head -30` 见 24 个 commit；`history/manifest.json` 字段完整。
- [ ] commit（应用与历史脚本入库；注意 seed 产生的是 subject 自身的提交，主仓库提交脚本与 manifest）：`feat(diffe2e): phase2 multi-file subject + scripted history`

**阶段 2 验收**：基线全绿 + 24 commit + manifest。

---

# 阶段 3：commit-replay 引擎 + RQ1

**Files:** `diffe2e/experiments/replay.mjs`, `baselines.mjs`, `run_rq1.mjs`, `test/replay.test.mjs`

### Task 3.1 — replay 引擎（TDD：先用 fixtures 单测纯逻辑）
- [ ] 失败测试：`computeOne({covVold, covVnew, changed})` 返回含 `selected/affected/metrics` 的对象（纯函数，喂假覆盖）。
- [ ] 实现 `computeOne`（组合 selector + oracle + metrics）。通过 → commit。

### Task 3.2 — replay 驱动（集成）
- [ ] `replay.mjs` 对每个 tag 对 `c(i-1)->c(i)`：
  1. `git checkout c(i-1)`；`COV_OUT=cov/vold npx playwright test`（采 V_old 覆盖）。
  2. `git diff c(i-1) c(i) -- app/src` → `parseUnifiedDiff` → changed。
  3. `git checkout c(i)`；`COV_OUT=cov/vnew npx playwright test`（全量 → oracle）。
  4. `computeOne` → 写 `out/rq1_dataset.jsonl` 一行（含 manifest 的变更类型、失败用例及原因）。
- [ ] 验收：`node experiments/run_rq1.mjs` 跑完 24 commit，产出 `out/rq1_dataset.jsonl`（24 行）。

### Task 3.3 — 基线
- [ ] `baselines.mjs`：`retestAll`、`random(seed)` 选同规模、`staticHeuristic`（按文件名/路由名匹配）、`coverageOnly`（关掉 UI 信号）。
- [ ] `run_rq1.mjs` 对每个 commit 同时算各基线指标，写入数据集。
- [ ] 验收：数据集每行含 ours + 4 基线的 Reduction/Safety/Precision。

### Task 3.4 — RQ1 汇总
- [ ] `analyze.mjs`：聚合均值、按变更类型分组、ours vs baselines 差异；输出 `out/rq1_summary.md` + `out/rq1_table.csv`。
- [ ] commit `feat(diffe2e): phase3 commit-replay + RQ1 results`。

**阶段 3 验收**：`out/rq1_dataset.jsonl`(24) + `out/rq1_summary.md`；ours 的 Safety 应≈1 且 Reduction 显著>random/static（在汇总中体现）。

---

# 阶段 4：RQ1 统计与图

**Files:** `experiments/analyze.mjs`(扩展), `out/figs/*.svg`
- [ ] 用 `stats.mjs` 对 ours vs 每基线做配对检验（Reduction/Safety 用 Wilcoxon + Cliff's δ；"是否安全(漏选=0)"用 McNemar）。
- [ ] 生成简单 SVG 柱状/箱线（纯字符串拼 SVG，无依赖）：各方法 Reduction/Safety/Precision。
- [ ] 输出 `out/rq1_stats.md`。
- [ ] commit `feat(diffe2e): phase4 RQ1 stats + figures`。

**阶段 4 验收**：`out/rq1_stats.md` 含 p 值与效应量；`out/figs` 有 SVG。

---

# 阶段 5：缺口生成（RQ2，stub LLM 确定性）

**Files:** `src/llm/client.mjs`, `src/generate.mjs`, `experiments/run_rq2.mjs`, 对应测试
- [ ] **llm/client.mjs**：`createClient()` 读 env：有 `OPENAI/ANTHROPIC/DEEPSEEK_API_KEY` 走真实 HTTP；否则 `stub`。stub 的 `complete(prompt,ctx)` = 基于"最近邻已有用例骨架 + uidiff 的 ADD 节点"模板合成 Playwright 用例（确定性）。单测只测 stub。
- [ ] **generate.mjs**：`generateForGap(gap, neighbors, uidiff, client)` → 候选 spec 文本。单测：ADD `button:text:Green` 无测试 → 生成的 spec 含 `getByText('Green')` 与一个断言。
- [ ] **run_rq2.mjs**：对 replay 中"新增功能(缺口)"类 commit：识别 gap → 生成 → 在 V_new 实跑验证 → 记 `变更相关性/可执行率`（语义有效率标注**留待有 LLM/人工**，先记 NA 并产出待标注清单）。
- [ ] 验收：`node experiments/run_rq2.mjs` 产 `out/rq2_results.md`；生成用例可执行率可统计。
- [ ] commit `feat(diffe2e): phase5 gap generation (stub LLM) + RQ2`。

---

# 阶段 6：修复（RQ3，stub LLM）+ ReproBreak 适配（尽力而为）

**Files:** `src/staleness.mjs`, `src/repair.mjs`, `experiments/run_rq3.mjs`
- [ ] **staleness.mjs**：从失败 trace/错误码 + uidiff 判定三类。单测：`LOCATOR_NOT_FOUND` + REMOVE 命中 → `STRUCTURAL_ONLY`。
- [ ] **repair.mjs**：locator 修复 = uidiff 结构邻居候选 + client 重写为语义定位；断言修复 = 按 EXPECTATION_CHANGE 更新期望。单测：`text=Red` 失效 + REMOVE Red/ADD Crimson → 候选 `getByText('Crimson')`。
- [ ] **run_rq3.mjs**：对 replay 中 locator-break 类 commit：选中失败用例 → 修复 → 重跑验证 → 计 `TargetedSetUsability=(selected_pass+repaired_pass)/|Sel∩Affected|`。
- [ ] **ReproBreak 适配（尽力而为）**：`realproj/gate.mjs` 尝试 clone ReproBreak，若可复现则跑修复子实验；不可得则在结果中记录 SKIPPED 原因。
- [ ] 验收：`out/rq3_results.md` 含 Usability 提升（修复前后对比）。
- [ ] commit `feat(diffe2e): phase6 repair (stub LLM) + RQ3 + reprobreak adapter`。

---

# 阶段 7：真实 E2EGit 项目（外部效度，尽力而为）

**Files:** `diffe2e/realproj/gate.mjs`, `realproj/results/*`
- [ ] `gate.mjs`：对候选列表逐个 `clone --depth 50` → 装依赖 → 跑 Playwright 基线 → 试加 istanbul/CDP 覆盖；输出每项目 `PASS/FAIL + 原因`。
- [ ] 对**通过闸门**的项目（若有）：套用 `replay.mjs` 跑 10–20 个真实 commit，产 `realproj/results/<proj>_rq1.jsonl`。
- [ ] 若**全部不通过**：写 `realproj/results/REPORT.md` 如实记录（项目、失败原因、所需改造），作为有效性威胁与未来工作。**此阶段不阻塞主结论**。
- [ ] commit `feat(diffe2e): phase7 real-project external validity (best-effort)`。

---

# 阶段 8：聚合、可复现包与报告

**Files:** `diffe2e/experiments/aggregate.mjs`, `diffe2e/EXPERIMENT_REPORT.md`, `diffe2e/REPRODUCE.md`
- [ ] `aggregate.mjs`：汇总 RQ1–RQ4 指标 + 成本（wall-clock、用例数、生成/修复成功率）→ `EXPERIMENT_REPORT.md`（中文，含主表、按变更类型分解、统计结论、局限）。
- [ ] `REPRODUCE.md`：一键复现步骤（`npm i` → `seed` → `run_rq1..4` → `aggregate`）。
- [ ] 把关键产物（summary/csv/figs）入库，大文件（覆盖原始 json）gitignore。
- [ ] 终测：`cd diffe2e/pipeline && node --test` 全绿；`node experiments/run_rq1.mjs` 可复跑。
- [ ] commit `feat(diffe2e): phase8 aggregate + experiment report + reproduce pack`。

**最终验收**：`EXPERIMENT_REPORT.md` 给出 RQ1 真实数字（ours vs 4 基线，含统计显著性）、RQ2 生成可执行率/相关性、RQ3 Usability 提升、RQ4 成本；全部可一键复现。

---

## 自检（Self-Review）

1. **Spec 覆盖**：RQ1=阶段3/4；RQ2=阶段5；RQ3=阶段6；RQ4=阶段8 成本；无泄漏 oracle=阶段3；基线/消融=阶段3.3+selector 双信号；统计=阶段4；外部效度=阶段7；可复现=阶段8。✓
2. **占位符**：核心 deterministic 模块给了真实代码/契约；LLM 相关用 stub 保证可跑（非占位）；真实项目/人工标注明确标记"尽力而为/留待"，不阻塞主结论。
3. **类型一致**：`selectByCoverage/selectByUiLocator/select`、`computeOne`、`selectionMetrics` 字段在阶段间一致。

## 执行交接

本计划将**全自动内联执行**（executing-plans）：逐阶段实现→`node --test` 验证→`git commit`→自动进入下一阶段。遇到真实外部阻塞（无 LLM key 的真实模型质量、真实项目不可得）时**走确定性 stub / 如实记录 SKIPPED 并继续**，不停机等待人工。
