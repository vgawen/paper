# 成本模型与量化目标（净收益）

> 本文回应评审意见 #4（实验缺设计、缺可信量化结果；在问题定义之初就量化目标）。核心判据由导师明确给出：**「测试选择算法执行时间 + 选中用例执行时间」是否远小于「全量执行时间」**。本文给出量化目标、时间分解、净收益与盈亏平衡定义、非时间资源指标，以及公平对比协议。对应代码：`experiments/run_rq4_cost.mjs`（单场景 wall-clock）与 `experiments/run_rq4_batch.mjs`（多过渡平均）。

## 1. 量化目标（在问题定义之初给出）

设回归测试集 `S`，本次变更选中子集 `Sel ⊆ S`。目标是在**召回约束**下最小化执行成本：

```
目标：   min  Cost(Sel)
约束：   SafetyEmp(Sel) = 1        （不漏测，见 SAFETY.md §4，硬约束、不可妥协）
次目标： max  Reduction = 1 − |Sel| / |S|
```

直觉示例（导师原话）：若 `|S| = 10000`、`|Sel| = 200`，则 `Reduction = 98%`——**少跑 98% 的用例**。但这只是"用例数比例"，不等于时间节省，见 §2–§3。

## 2. 时间分解

```
T_full            = 全量执行 S 的 wall-clock
T_select          = T_mapper_update + T_diff_analyze + T_select_compute
T_run(Sel)        = 执行选中子集 Sel 的 wall-clock
T_ours_total      = T_select + T_run(Sel)        # 本方法端到端
```

- `T_mapper_update`：映射器**增量**更新（见 `MAPPER.md` §3），长期 CI 中远小于首次全量构建 `C_build`；
- `T_diff_analyze`：解析 diff、抽变更实体、Semantic UI Diff；
- `T_select_compute`：在映射器上做邻居查询并取并集/闭包。

## 3. 净收益与盈亏平衡

```
NetSaving      = 1 − T_ours_total / T_full
                = 1 − (T_select + T_run(Sel)) / T_full
TimeReduction  = 1 − T_run(Sel) / T_full        # 只看执行，不含选择开销
SelectionTax   = T_select / T_full              # 选择本身占的"税"
```

- **关键诚实点（导师强调）**：`Reduction`（用例数）≫ `TimeReduction`（时间）是常态——E2E 用例时长高度不均，少跑的多是短用例；且 `T_select > 0` 进一步吃掉收益。论文必须把三者**解耦报告**，并给出导师的反例直觉："200 个跑 10 分钟、其余 9800 个也跑 10 分钟"⇒ 时间只省一半甚至更少。
- **盈亏平衡**：当 `NetSaving > 0`，即 `T_select + T_run(Sel) < T_full`，方法才划算。报告在何种 `|S|` 规模 / 选择率 / 用例时长分布下越过平衡点。
- **摊销**：`T_mapper_update` 的成本应按"长期 CI 多次提交"摊销；首次 `C_build` 单列，不计入单次提交的 `T_select`（但需如实披露）。

## 4. 非时间资源指标（时间不是唯一指标）

| 指标 | 含义 | 为什么关注 |
|---|---|---|
| machine-minutes | Σ(并行 worker 数 × 各自 wall-clock) | CI 计费与真实资源占用，比单一 wall-clock 更贴近成本 |
| 峰值并行度 | 峰值 worker / 浏览器实例数 | E2E 启动浏览器开销大，决定内存/CPU 峰值 |
| 峰值内存 | 运行期 RSS 峰值 | 资源上限与可调度性 |
| LLM token / $ | 修复+生成臂的 token 与费用 | 本方法引入 LLM，必须计入端到端成本 |
| 能耗（可选） | 估算 kWh | 绿色 CI 视角 |

报告原则：**至少 machine-minutes + 一项 LLM 成本**与 wall-clock 并列，说明哪些是主关注指标及理由。当前产物 `experiments/out/llm_cost.{json,md}` 给出已完成真实 LLM 实验的 token/$ 估算；因早期运行未持久化 provider usage 字段，该表按调用次数与 prompt/output 大小估算。后续真实调用可设置 `LLM_USAGE_OUT=<jsonl>`，由 LLM client 自动记录 API 返回的精确 usage。

## 5. 公平对比协议（避免不公平比较）

1. `full` 与 `selected` 用**同一条 Playwright 命令模板**、同 `--workers=W`、同 `COV_OUT` 覆盖设置；
2. `selected` 的多个 spec **一次性**传入单次调用（让其按同样并行度跑），而非逐个冷启动顺序执行；
3. 每个 arm 重复 `R ≥ 3` 次，报告 **median 与 IQR**（而非单次或求和）；
4. `T_select` 单独计时并显式纳入 `T_ours_total`，不得"假装选择免费"。
5. 多过渡平均不得只用一个空选集边界案例代表项目收益；应报告 empty/partial/full 过渡分布、mean/median NetSaving 与 break-even rate。

## 6. 报告模板（run_rq4_cost.mjs 产物）

```jsonc
{
  "project": "...", "workers": 4, "repeats": 3, "selected_count": 12, "full_count": 200,
  "Reduction": 0.94,                          // 用例数比例
  "T_select_ms":  { "median": ..., "iqr": [..] },
  "T_full_ms":    { "median": ..., "iqr": [..], "runs": [..] },
  "T_run_sel_ms": { "median": ..., "iqr": [..], "runs": [..] },
  "TimeReduction": 0.55,                       // 仅执行
  "NetSaving":     0.41,                        // 含选择开销
  "SelectionTax":  0.06,
  "break_even": true,
  "machine_minutes": { "full": ..., "ours": ... },
  "llm_cost": { "tokens": ..., "usd": ... }     // 若涉及修复/生成
}
```

`run_rq4_batch.mjs` 产物补充报告：

```jsonc
{
  "project": "...",
  "method": "dual batch-estimated from RQ1 transitions and one RQ4 cost profile",
  "transitions": 9,
  "buckets": { "empty": 1, "partial": 0, "full": 8 },
  "meanReduction": 0.1111,
  "meanNetSaving": 0.1111,
  "medianNetSaving": 0,
  "breakEvenRate": 0.1111,
  "selectionMeasured": false
}
```

注意：batch-estimated 表示它复用已测 cost profile 对 RQ1 多个 transition 做聚合，不等同于每个 transition 都重新实测 wall-clock；论文中应按此限定表述。

## 7. 论文写作映射

| 论文位置 | 本文对应 | 交付物 |
|---|---|---|
| 问题定义·量化目标 | §1 | 目标式 + 召回硬约束 |
| 实验 RQ4·时间分解与净收益 | §2–§3、§6 | `run_rq4_cost.mjs` 的 NetSaving/盈亏平衡 + `run_rq4_batch.mjs` 的多过渡平均 |
| 实验 RQ4·资源指标 | §4 | machine-minutes / token 成本 |
| 实验·公平性说明 | §5 | 对比协议 |
