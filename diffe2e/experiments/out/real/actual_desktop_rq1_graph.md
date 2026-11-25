# 真实项目 RQ1 函数级归因回放（actual-budget，9 个过渡）

**日期**：2026-11-25
**脚本**：`experiments/real/run_rq1_real_graph.mjs`（`--reporter=json` 采集 pass/fail 供非循环 oracle）
**产物**：`actual_desktop_rq1_graph.jsonl`

## 1. 总体结果（n=9 过渡，每过渡 34 条用例）

| 方法 | Reduction | Safety（覆盖 oracle） | SafetyEmp（非循环 oracle） |
|---|---|---|---|
| coverage_only（文件级） | **0.1111** | 1.0 | 1.0（n=1 有效过渡） |
| **graph-selection（四层归因）** | **0.7418** | 0.3693 | **1.0（n=1 有效过渡）** |

- **Reduction 从 0.111 提升到 0.742**（与受控主体 0.625→0.889 同一方向）。
- `Safety=0.3693` 是**相对覆盖 oracle**的口径——该 oracle 把"覆盖了变更文件"当作受影响，与本方法同源（§3.4 已论证的自证循环），故该数字不能读作"漏选 63%"。

## 2. 关键裁决：graph 选 0 的过渡是否正确

9 个过渡中有 2 个 graph 选 0 条、coverage 选 34 条，必须判定谁对：

| 过渡 | 改动内容 | 是否被 e2e 执行 | 判定 |
|---|---|---|---|
| 1279e7c→81ea158 | `HistoricalAutomationReadOnly` 组件内一句文案（"months"→"complete months"） | **否**（无测试渲染该组件） | **graph 对，coverage 过度选择** |
| 674c6f1→fbdad57 | `SelectLinkedAccountsModal` 的 prop 默认值 + 一个组件测试文件 | **否** | 同上 |

**证据有三条**：
1. 这两个过渡的 **`A_obs = ∅`**（非循环 oracle：没有任何 e2e 用例结果翻转）；
2. 文件级 coverage 把该文件计入"已覆盖"，是因为 Vite 在应用启动时**import 该模块并执行了模块级代码**——这是"import 即覆盖"的假阳性；
3. 函数级 `executes` 边要求具名函数 `count>0`，而该组件函数从未被调用。

**含义**：这正是受控主体"加路由选 0"现象在真实项目上的复现——**文件级覆盖在"模块被 import 但组件未渲染"时会过度选择**，函数级归因消除了它。

## 3. 非循环 oracle 的判别力限制（诚实披露）

9 个过渡中只有 **1 个**产生了结果差异（`a_obs=1`），其余 8 个过渡 e2e 结果全 pass——**真实项目上多数代码改动不会翻转任何 E2E 结果**，因此非循环召回在这批样本上几乎无法判别（与受控主体仅 4 个自然 diff 过渡是同一问题）。

该唯一有效过渡上，graph 与 coverage 的 **SafetyEmp 均为 1.0**。

## 4. 对论文的写法

1. 表 5-4 增补 graph-selection 一行（Reduction 0.111 → 0.742）；
2. 必须同时报 `Safety_cov` 下降（0.3693）并解释其为同源自证（与 §5.1.1 一致）；
3. 用本节 §2 的两个过渡作为**函数级归因优于文件级的真实项目证据**（import-即-覆盖的假阳性）；
4. 明确写出非循环 oracle 在真实项目上 8/9 过渡无信号，召回的经验验证仍受限。
