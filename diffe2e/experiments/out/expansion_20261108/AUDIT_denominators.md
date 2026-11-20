# 分母核查报告：RQ2 三次重复的 “n=29 / n=28” 与论文分母

> 时间：2026-11-08
> 性质：只核查、只报告。未修改论文、主表、冻结清单或任何运行产物。
> 结论先行：**论文没有任何分母需要改；“29 / 28”不是可用条数，而是标签值 `n` 的计数。实际每次运行都是 30/30 条，无排除条目。**

---

## 1. “可用 n=29 / 28” 是怎么算出来的

### 1.1 根因：`distribution` 统计的是标签值，不是可用条数

`out/repeats/variance_report.json` 中：

- `conditions.masked.families.rq2.n = 30`（这是该族的样本总数，明确为 30）。
- 每个 run 的 `distribution` 来自 `analyze_repeats.mjs`：

```js
// analyze_repeats.mjs:189-192
per_run_distribution: runs.map((r) => ({
  run: r.run,
  file: r.file,
  distribution: dist(rows.map(({ case_id }) => r.data[family].rows[case_id]?.label)),
}))
```

`dist` 的定义（`analyze_repeats.mjs:107`）是按标签值计数的字典：

- run1 的 `{"n": 29, "y": 1}` = **29 条标签 `n` + 1 条标签 `y` = 30 条**；
- run2 的 `{"n": 28, "y": 2}` = **28 条标签 `n` + 2 条标签 `y` = 30 条**；
- run3 同 run2。

因此 “n=29 / n=28” 中的 `n` 是**负类标签的计数**，不是 “usable n / 有效 n / 分母”。“29 / 28” 被误读为可用条数，才产生了“分母可能缩水”的担心。

### 1.2 逐条排除清单

**排除清单为空。** 三份 B 条件运行文件均为：30 条 RQ2、40 条 RQ3，全部 `status="ok"`、`label` 非空、`failures=0`、`failures_list=[]`。

| 运行 | 文件 | RQ2 行数 | 失败 | 缺失标签 | 排除条目 | 标签分布（计数） |
|---|---|---:|---:|---:|---|---|
| run1 | `out/annotator1_masked.json` | 30 | 0 | 0 | 无 | `n=29, y=1`（合计 30） |
| run2 | `out/repeats/masked_run2.json` | 30 | 0 | 0 | 无 | `n=28, y=2`（合计 30） |
| run3 | `out/repeats/masked_run3.json` | 30 | 0 | 0 | 无 | `n=28, y=2`（合计 30） |
| 多数票 | `out/repeats/variance_report.json` | 30 | — | 0（平票 0） | 无 | `n=28, y=2`（合计 30） |

- 没有“失败条目”：每份 JSON 的 `failures_list` 为空，`rq2.failures=0`、`rq3.failures=0`。
- 没有“未配对条目”：30 个 `case_id` 在三次运行中全部存在，与工作表条目一一对应。
- 没有“不可用条目”：所有 RQ2 标签均为 `y` 或 `n`，无空值、无异常值。

### 1.3 逐条标签（30 条全表）

| case_id | 臂 | run1 | run2 | run3 | 多数票 |
|---|---|---|---|---|---|
| rq2_001 | diff | n | n | n | n |
| rq2_002 | nodiff | n | n | n | n |
| rq2_003 | diff | n | n | n | n |
| rq2_004 | nodiff | n | n | n | n |
| rq2_005 | diff | n | n | n | n |
| rq2_006 | nodiff | n | n | n | n |
| rq2_007 | diff | n | n | n | n |
| rq2_008 | nodiff | n | n | n | n |
| rq2_009 | diff | n | n | n | n |
| rq2_010 | nodiff | n | n | n | n |
| rq2_011 | diff | n | n | n | n |
| rq2_012 | nodiff | n | n | n | n |
| rq2_013 | diff | n | n | n | n |
| rq2_014 | nodiff | n | n | n | n |
| rq2_015 | diff | n | n | n | n |
| rq2_016 | nodiff | n | n | n | n |
| rq2_017 | diff | n | n | n | n |
| rq2_018 | nodiff | n | n | n | n |
| rq2_019 | diff | n | n | n | n |
| rq2_020 | nodiff | n | n | n | n |
| rq2_021 | diff | n | n | n | n |
| rq2_022 | nodiff | n | n | n | n |
| **rq2_023** | **diff** | **n** | **y** | **y** | **y** |
| rq2_024 | nodiff | n | n | n | n |
| rq2_025 | diff | n | n | n | n |
| rq2_026 | nodiff | n | n | n | n |
| rq2_027 | diff | n | n | n | n |
| rq2_028 | nodiff | n | n | n | n |
| **rq2_029** | **diff** | **y** | **y** | **y** | **y** |
| rq2_030 | nodiff | n | n | n | n |

唯一不稳定条目是 `rq2_023`（`n / y / y`，2/3，多数票 `y`）。其余 29 条为 3/3 一致，无 1/3 条目。

- RQ3 同样无排除：三次运行均为 40 条、全部 `STRUCTURAL_ONLY`，多数票 `SO=40, EC=0, SR=0`。

---

## 2. 与 “280 次重复调用全部成功、失败清单为空” 是否冲突

**不冲突。两者统计的是不同集合。**

| 口径 | 计算方式 | 次数 | 依据 |
|---|---|---:|---|
| 论文 §5.6 的 210 次 | 条件 B 的 3 次运行 × 70 条（RQ2 30 + RQ3 40） | 210 | 论文第 445、458 行；`variance_report.json` 的 `conditions.masked.runs` |
| 重复运行的 280 次 | 4 个 repeat 文件 × 70 条：B 的 run2/run3 + A 的 run2/run3 | 280 | `masked_run2.json`、`masked_run3.json`、`condA_run2.json`、`condA_run3.json` |
| 全部调用 | 2 个条件 × 3 次运行 × 70 条（含每个条件的 run1） | 420 | 上述 280 + `annotator1_masked.json` 70 + `annotator1_condA.json` 70 |

- 4 个 repeat 文件逐一核对：RQ2 30 条、RQ3 40 条，`failures_list=[]`、`rq2.failures=0`、`rq3.failures=0` → **280 次重复调用确实全部成功**。
- 论文的 “210 次” 是**条件 B 的正式三次运行**（run1 为正式首跑，run2/run3 为重复），不含条件 A；条件 A 已撤下，不作为论文结果。
- `distribution` 的 `n=29/28` 既不是调用数，也不是可用条数，只是标签 `n` 的计数；因此与 “280 次成功、失败清单为空” 没有冲突。

---

## 3. 多数票在不同口径下的 RQ2 y 数与分臂数字

**前提：不存在合法的 29 条或 28 条分母。** 30 条在三次运行中都完整存在；若有人把 `n` 计数误当分母，就会错误地丢掉条目。正确口径只有 30 条。

| 口径 | 总 y | diff 臂 | nodiff 臂 | 说明 |
|---|---|---|---|---|
| run1 单次（非正式） | 1/30 | **1/15** | 0/15 | 唯一 y 为 `rq2_029` |
| run2 单次（非正式） | 2/30 | **2/15** | 0/15 | y 为 `rq2_023`、`rq2_029` |
| run3 单次（非正式） | 2/30 | **2/15** | 0/15 | 同上 |
| **三次多数票（正式）** | **2/30** | **2/15** | **0/15** | `rq2_023` 由 run1 的 n 翻为 y，故比 run1 多 1 条 |

- 论文 §5.2 的 “diff 2/15、nodiff 0/15” 与三次多数票一致；
- 若误用 run1 单次，会得到 1/15，**少计 `rq2_023`**；这正是“单次运行只作运行记录、不作为正式数值”的原因（论文第 445 行）。
- 若按错误的 “29/28 可用分母” 计算，会人为删掉条目，得到 1/29 或 2/28 等不成立的数字；本文不采用。

---

## 4. 论文全部分母核对

### 4.1 §5.2（RQ2 人工校准）

| 位置 | 论文写法 | 实际可用 | 结论 |
|---|---|---|---|
| 第 362 行 | 30 条人工复核样本 | 30/30 | 一致 |
| 第 362 行 | diff/nodiff 各 15 条 | 15/15 | 一致 |
| 第 362 行 | diff 臂 2/15 | 2/15（`rq2_023`、`rq2_029`） | 一致 |
| 第 362 行 | nodiff 臂 0/15 | 0/15 | 一致 |
| 第 362 行 | 29 条完全一致、1 条 2/3、无 1/3 | 29 + 1 = 30 | 一致 |
| 表 5-5 | 受控 RQ2 每臂 n=3 | 3/3 | 不受本次影响 |

**应改处：0 处。**

### 4.2 §5.3（RQ3 与 ReproBreak）

| 位置 | 论文写法 | 实际可用 | 结论 |
|---|---|---|---|
| 第 390 行 | 449 条执行验证，跳过 35，评估 n=414 | 449 − 35 = 414 | 一致 |
| 表 5-7 | 规则 14/414、LLM 23/414 | 14/414、23/414 | 一致 |
| 第 401 行 | 从 414 条抽 40 条 | 40/40 | 一致 |
| 第 401 行 | 正式列 40/40 有效 | 40/40 | 一致 |
| 表 5-8 | SO=40、EC=0、SR=0 | 三次运行均 40 SO | 一致 |
| 第 401 行 | 40 条三次重复全部一致（40/40 为 3/3） | 40/40 | 一致 |
| 表 5-6 | 受控 RQ3 n=4 | 4/4 | 不受本次影响 |

**应改处：0 处。**

### 4.3 表 5-10（人工一致性校准）

| 位置 | 论文写法 | 实际可用 | 结论 |
|---|---|---|---|
| RQ2 行 | n（有效）30 / 30 | 30/30 | 一致 |
| RQ2 行 | y=2（diff 2/15、nodiff 0/15） | 2/15、0/15 | 一致 |
| RQ3 行 | 40（有效 40） | 40/40 | 一致 |
| RQ3 行 | SO=40、EC=0、SR=0 | 40/0/0 | 一致 |
| 第 458 行 | 70 条中 69 条三次一致、1 条 2/3、无 1/3 | 69 + 1 = 70 | 一致 |
| 第 458 行 | 三次重复共 210 次逐条调用 | 3 × 70 = 210（条件 B） | 一致 |

**应改处：0 处。**

### 4.4 结论

论文 §5.2、§5.3、表 5-8、表 5-10 中的分母 **全部与实际可用条目一致，不需要修改**。真正需要澄清的是 `variance_report.md` / `ANNOTATION_GUIDE.md` 第 30 行的 “y=2/n=28” 写法：它容易被读成 “可用 28 条”，实际是 “28 条 `n` 标签 + 2 条 `y` 标签 = 30 条”。由于这两份文件在冻结清单内，本次**不修改**；本报告作为解释记录放在冻结清单之外。

---

## 5. 核查中另发现的一处非分母问题（仅报告，不改动）

在核对“分母”时发现：分母本身无误，但**“哪一列对哪一列算 κ”在文档之间不一致**，可能影响表 5-10 的 κ 语义，需要作者单独决策：

- 论文 §5.6 第 443、449 行写 “第一标注列 = LLM 预标注”“κ 为 human vs 预标注”；
- 但 `score.mjs` 的 RQ2 分支实际用 `annotator1_yn` 与 `annotator2_yn` 计算（`score.mjs:28-30`），即 **CSV 第一列与第二列**；
- CSV 第一列的 RQ2 是 `y=5/30`（`out/rq2_real_to_annotate.csv`），与 LLM 预标注的 `y=2/30`（`out/annotator1_masked.json`）不同；
- 因此按现有脚本回填，RQ2 得到的是**人工-人工 κ**，不是论文写的“human vs 预标注”。RQ3 的 `score.mjs:39` 同时输出 `human_kappa`（human1 vs human2）与 `model_kappa`（model vs gold），语义也需与论文对齐。

这不是分母问题，**本次未改任何文件**。在进入 κ 回填前，需要作者确认：表 5-10 的 κ 到底报 `human1 vs human2`，还是 `human2 vs LLM 预标注`；若后者，需调整评分脚本或增加一列承载 LLM 预标注，且该决定应先于第二阶段扩样。

---

## 6. 核查方法与可复现命令

```bash
cd /Users/dd/gdb/paper/diffe2e/experiments
python3 - <<'PY'
import json,collections
files=[('run1','out/annotator1_masked.json'),('run2','out/repeats/masked_run2.json'),('run3','out/repeats/masked_run3.json')]
runs={n:json.load(open(f))['rq2']['rows'] for n,f in files}
for n,_ in files:
    print(n, len(runs[n]), collections.Counter(v['label'] for v in runs[n].values()))
PY
```

补充核对文件：

- `out/repeats/variance_report.json`：`conditions.masked.families.rq2.n=30`、`per_run_distribution`、`majority_distribution`；
- `out/repeats/variance_report.md`：逐运行分布与多数票段；
- `out/annotator1_masked.json`：`rq2.rows` 30 条、`status=ok`、`failures=0`；
- `out/rq2_real_to_annotate_unblind.json`：30 条的臂归属（diff/nodiff 各 15）；
- `out/annotator1_condA.json`、`out/repeats/condA_run2.json`、`out/repeats/condA_run3.json`：条件 A 的 210 次调用，`failures=0`（论文不报告条件 A）。
