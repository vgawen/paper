# 详细实验方案、系统设计与实现计划

> 配套开题：《基于 Code Diff 的 Playwright E2E 测试自动生成与修复方法研究（以修复为实验重心）》
> 定位：修复为深度主线（内容一/二/三），生成为补全与小规模验证（内容四）。
> 工具暂命名 **DiffMend**（Diff-driven E2E Test Mending）。

---

# 第一部分　系统设计

## 1.1 设计目标与约束

- **输入**：一对应用版本 `V_old → V_new` 及其 Code Diff（commit/PR）、在 `V_new` 上失效的 Playwright 用例及其失败 trace。
- **输出**：修复后的 Playwright 脚本（或"更新断言"/"如实报告回归"决策）、可解释修复报告；对变更引入的覆盖缺口，输出补充生成的用例。
- **核心约束**：仅依赖开源数据（ReproBreak、E2EGit）；可在单机 + LLM API 下运行；每个修复任务有 token/时间预算；所有修复必须经 Playwright 真实执行验证。

## 1.2 总体架构

```text
            ┌─────────────────────────────────────────────────────────────┐
            │                      DiffMend Pipeline                       │
            │                                                              │
  V_old/V_new┌────────┐  diff   ┌────────┐  ctx   ┌────────┐ intent ┌──────┐
  + 用例 + ──▶│M1 采集 │───────▶ │M2 Diff │──────▶ │M3 上下 │──────▶ │M4 意 │
  trace      │ /触发  │         │提取切片 │        │文构造  │        │图判定│
            └────────┘         └────────┘        └────────┘        └──┬───┘
                                                                       │
                       ┌───────────────────────────────┬──────────────┤
                       ▼ (real regression)             ▼ (intended)    ▼ (gap)
                  ┌─────────┐                     ┌─────────┐     ┌─────────┐
                  │M5 定位符│                     │M6 断言  │     │M7 补充  │
                  │  修复   │                     │  修复   │     │  生成   │
                  └────┬────┘                     └────┬────┘     └────┬────┘
                       └───────────┬───────────────────┴───────────────┘
                                   ▼
                          ┌─────────────────┐  fail (反馈上下文) 
                          │M8 执行验证&迭代  │───────────────────┐
                          │(Playwright 运行) │                   │
                          └────────┬────────┘                   │
                                   │ pass / budget exhausted     │
                                   ▼                             ▲
                          ┌─────────────────┐                    │
                          │M9 报告&可解释   │◀───────────────────┘
                          └─────────────────┘
```

## 1.3 模块详细设计

### M1　失效采集与触发（Harness）
- 在 `V_old` 运行用例集，记录通过用例 `T_pass`；checkout `V_new`，重跑 `T_pass`，得到**失效集** `T_fail`（区分 error 类型：locator not found / timeout / assertion failed）。
- 采集每个失效用例的：失败 trace（Playwright `--trace on`）、报错堆栈、失败步骤、失败时刻页面 `DOM snapshot` 与 `screenshot`、控制台/网络日志。
- 对 ReproBreak：直接复用其复现脚本得到 `V_old/V_new` 与断裂用例；对 E2EGit：从仓库历史挖掘"前一 commit 通过、后一 commit 失败"的用例对。

### M2　Code Diff 提取与切片（Diff Slicer）
- `git diff V_old V_new` 得到文件级/行级变更；用 tree-sitter 解析为 AST，得到**语法级变更单元**（重命名、属性删改、组件结构调整、路由变化）。
- 关联失效用例：以失败步骤操作的元素为锚，回溯到与该元素相关的前端源码变更（HTML 模板/JSX/组件/CSS 选择器/data-testid）。
- 输出**变更切片** `DiffSlice`：与本失效因果相关的最小变更集合（借鉴 UTFix 切片思想）。
- 兜底：若无法把失效精确关联到源码 diff，退化为"变更文件清单 + 全 diff 摘要"。

### M3　修复上下文构造（Context Builder）
将以下要素打包为结构化、token 受控的修复上下文：
1. 失效用例源码 + 失败步骤定位；
2. `DiffSlice`（含变更前后片段）；
3. 失败时刻 DOM 子树（以原定位符目标元素的祖先/兄弟节点为中心裁剪）；
4. 候选元素特征（M5 预计算）；
5. 失败 trace 关键帧与报错信息。
- 采用"分层注入"（借鉴 Hierarchical Knowledge Injection）：先用例/失败上下文，再 diff 切片，再 DOM 候选，按预算截断。

### M4　变更意图判定（Intent Classifier）
- 输入：commit message、PR 标题/描述、`DiffSlice` 语义。
- LLM 分类为三类（借鉴 Testora）：
  - `STRUCTURAL_ONLY`（结构性改动、行为不变）→ 走 M5 修复脚本恢复旧行为；
  - `INTENDED_BEHAVIOR_CHANGE`（有意改功能/UI）→ 走 M6 更新断言/期望；
  - `SUSPECTED_REGRESSION`（疑似真回归）→ 不强行修复，标记并产出回归报告。
- 输出带置信度；低置信度时同时尝试 M5/M6 并由 M8 执行结果裁决。

### M5　定位符修复（Locator Repairer）
- **候选元素匹配**：在 `V_new` DOM 中，以旧定位符目标元素的多属性指纹（tag、id、class、role、text、属性、XPath 路径、视觉位置）计算相似度，召回 Top-k 候选。
- **LLM 重写**：将候选 + diff 切片 + 失败上下文喂给 LLM，生成新定位符，**优先 Playwright 语义定位**（`getByRole`/`getByLabel`/`getByTestId`/`getByText`），降低未来脆弱性。
- 产出多个候选补丁供 M8 验证。

### M6　断言修复（Assertion Repairer）
- 针对 `INTENDED_BEHAVIOR_CHANGE`：依据 diff 语义与 `V_new` 实际页面状态，更新期望文本/数值/可见性/URL 等断言。
- 以"解释一致性校验"约束：LLM 须同时给出"为何这样改"的解释，校验解释与 diff/页面状态一致，抑制幻觉（借鉴 Web UI 修复工作）。

### M7　补充生成（Gap Generator，次要）
- 识别变更引入但无 E2E 覆盖的新行为/路径（结合 diff 涉及的路由/组件与现有用例覆盖）。
- 以 diff 为约束，用覆盖率导向多阶段提示（SymPrompt）+ 页面语义抽象（VISCA 思路）生成 Playwright 用例；执行反馈迭代收敛。

### M8　执行验证与迭代控制（Validator / Loop Controller）
- 对每个候选补丁/生成用例在 `V_new` 实际运行 Playwright；
- 成功判定：用例通过且不破坏其他既有用例（回归校验子集）；
- 失败则把新的失败 trace 反馈给 M3 增强上下文，迭代（上限 `N_iter`，默认 3–5）；
- 预算耗尽则输出"未修复"并保留最优候选与诊断。

### M9　报告与可解释（Reporter）
- 输出：修复 diff（旧→新定位符/断言）、意图判定与依据、迭代轨迹、token/时间开销、最终验证结果；生成 Markdown/JSON 双格式，便于人工评审与实验统计。

## 1.4 核心数据结构

```json
{
  "task_id": "reprobreak_proj3_commit_ab12cd_test_login",
  "app_version": {"old": "ab12cc", "new": "ab12cd"},
  "failed_test": {"file": "tests/login.spec.ts", "name": "user can login",
                  "failing_step": 4, "error_type": "LOCATOR_NOT_FOUND"},
  "diff_slice": [{"file": "src/Login.tsx", "kind": "attr_rename",
                  "before": "class=\"btn-action\"", "after": "class=\"action-btn\""}],
  "failure_context": {"trace_path": "...zip", "dom_snapshot": "...html",
                      "screenshot": "...png", "stack": "..."},
  "old_locator": ".btn-action",
  "candidates": [{"selector": "getByRole('button',{name:'Action'})", "score": 0.93}],
  "intent": {"label": "STRUCTURAL_ONLY", "confidence": 0.88, "evidence": "..."},
  "patch": {"type": "LOCATOR", "before": ".btn-action",
            "after": "getByRole('button',{name:'Action'})", "explanation": "..."},
  "validation": {"passed": true, "iterations": 1, "tokens": 5421, "wall_sec": 23.5}
}
```

## 1.5 技术栈选型

| 关注点 | 选型 |
|--------|------|
| 被测/测试运行 | Node.js + Playwright（Test Runner + Trace Viewer） |
| 流水线编排 | Python（核心）+ 子进程调用 Playwright；可选 LangGraph 编排闭环 |
| Diff/AST | git + tree-sitter（JS/TS/HTML）+ 内置 diff |
| DOM 解析/匹配 | lxml / BeautifulSoup + 自定义相似度 |
| LLM | 经 API（如 GPT-4 系列）+ 1 个开源模型作对照；结构化输出（JSON schema/function calling） |
| 缓存/复现 | 全程缓存 LLM 请求与响应（含 seed/温度），保证可复现与降本 |

## 1.6 LLM 交互设计
- 所有 LLM 调用使用**结构化输出**（强制 JSON schema），字段含 `decision/patch/explanation/confidence`。
- 统一 prompt 模板，分槽位注入 M3 上下文；温度低（0–0.3）保证稳定；记录 token。
- 防注入/防幻觉：要求引用 DOM 候选 id 与 diff 行号作为证据，M8 执行兜底。

---

# 第二部分　实现计划

## 2.1 代码仓库结构

```text
diffmend/
├── harness/            # M1 采集与触发：跑用例、抓 trace/DOM/screenshot
├── differ/             # M2 diff 提取与 AST 切片
├── context/            # M3 修复上下文构造（分层注入、预算截断）
├── intent/             # M4 变更意图判定
├── repair/
│   ├── locator.py      # M5 定位符修复（候选匹配 + LLM 重写）
│   └── assertion.py    # M6 断言修复
├── generate/           # M7 补充生成（次要）
├── validator/          # M8 执行验证与迭代控制
├── reporter/           # M9 报告与可解释
├── llm/                # LLM 客户端、prompt 模板、缓存、结构化输出
├── datasets/           # ReproBreak / E2EGit 适配器
├── experiments/        # 实验脚本、配置、指标统计、画图
└── tests/              # 单元测试与端到端冒烟
```

## 2.2 分模块实现任务与里程碑

| 里程碑 | 模块 | 关键交付 | 验收标准 |
|--------|------|----------|----------|
| MS1 数据可跑 | harness + datasets | 跑通 ReproBreak 复现、产出 `T_fail` 与 trace/DOM | 至少 4 个项目、≥200 个失效任务可稳定复现 |
| MS2 上下文打通 | differ + context | 对每个任务产出 `DiffSlice` 与结构化上下文 | diff→失效关联成功率有统计；上下文在 token 预算内 |
| MS3 修复闭环 | repair.locator + validator | 定位符修复 + 执行验证迭代跑通 | 端到端能修复并验证通过若干样本 |
| MS4 断言+意图 | intent + repair.assertion | 三分支决策 + 断言修复 | 意图分类与误报抑制可度量 |
| MS5 生成补全 | generate | 小规模 diff 约束生成 | 能生成可执行用例并验证 |
| MS6 实验完备 | experiments + reporter | 全指标、消融、画图、复现包 | 复现脚本一键产出主表 |

## 2.3 开发顺序与依赖
- 严格按 M1→M2→M3→（M4‖M5‖M6）→M8→M9 依赖推进；M7 最后做、可裁剪。
- 先打通"单样本端到端最小闭环"（一个 locator break 从采集到修复验证），再横向扩规模、纵向加能力。

## 2.4 工程实践
- **成本控制**：LLM 响应缓存；先用小子集（~50 任务）调通，再全量。
- **可复现**：固定随机种子、模型版本、Playwright 版本；所有中间产物落盘。
- **日志/追踪**：每任务一份 JSON 轨迹（见 1.4），支撑实验统计与论文附录。
- **测试**：differ/context/匹配器写单元测试；validator 写端到端冒烟。

---

# 第三部分　实验方案

## 3.1 研究问题（RQ）

- **RQ1（主）**：引入"Code Diff 修复上下文"相比无 diff 基线，能否提升 Playwright E2E 修复成功率？提升多少？
- **RQ2**：对两类失效（定位符断裂 / 断言失配）修复效果差异如何？
- **RQ3（核心创新）**：变更意图判定（三分支）相比"一律尝试修复"，对误报率的抑制效果如何？
- **RQ4（泛化/成本）**：方法在 E2EGit 真实项目挖掘样本上的泛化性、迭代次数与 token/时间开销如何，是否可嵌入 CI？
- **RQ5（次要）**：以 diff 为约束的补充生成相比无约束生成，在用例"变更相关性"与功能覆盖上的提升？

## 3.2 数据集

| 用途 | 来源 | 规模 | 处理 |
|------|------|------|------|
| 修复主实验 | ReproBreak | 449 个可复现 locator break（4 项目） | 复用复现脚本；标注失效类型；抽取应用侧 diff |
| 断言失配样本 | E2EGit 挖掘 + ReproBreak 的 logical change | 目标 ≥100 | "前 commit 过、后 commit 断言失败"对，人工核对修复 |
| 泛化实验 | E2EGit Playwright 子集 | 目标 ≥3 项目、≥100 任务 | 挖掘 commit 对，半自动构造 |
| 生成实验（次要） | E2EGit / E2EBench | 小规模 | 选若干变更，评估补充用例 |

- **数据划分**：意图分类等需 LLM 提示工程的环节，按项目划分 dev/test，避免在同项目调参后又在其上报告主结果（防泄漏）。
- **标注协议**：失效类型、意图标签、"正确修复"的判定由 2 人独立标注，计算 Cohen's κ，分歧仲裁。

## 3.3 基线（Baselines）

1. **B0 纯属性匹配 self-healing**（无 LLM，如 Healenium 式多属性回退）——必备兜底基线。
2. **B1 无 diff 的纯 LLM 修复**（只给失效用例 + DOM + trace，不给 Code Diff）——用于回答 RQ1 的核心对照。
3. **B2 无意图判定的 DiffMend**（给 diff 上下文但"一律尝试修复"）——用于回答 RQ3 的消融对照。
4. **B3（条件）Practical Limits / Web UI 修复工作**：若有可复现实现则纳入；否则在相关工作中定性比较并说明不可复现的威胁。

## 3.4 评估指标（形式化定义）

设失效任务集 `T`，方法对任务 `t` 产出补丁 `p_t`。

- **修复成功率 RepairRate** = |{t∈T : p_t 通过 Playwright 执行且不破坏既有用例}| / |T|
- **Plausible vs Correct**：`Plausible` = 通过执行；`Correct` = 通过执行且与人工/数据集参考修复语义一致（人工核对）。报告两者。
- **定位符精确匹配 ExactMatch_loc** = 生成定位符与参考定位符字符串/语义等价比例。
- **误报率 FalsePositiveRate**（RQ3）= 在 `INTENDED_BEHAVIOR_CHANGE` 与 `SUSPECTED_REGRESSION` 任务中，被错误地"修复脚本恢复旧行为"或把有意改动误报为失败的比例。
- **意图分类**：Precision/Recall/F1（三类），混淆矩阵。
- **成本**：平均迭代次数 `avg_iter`、平均 token、平均 wall-clock、单任务平均花费（API 估算）。
- **生成（RQ5）**：功能覆盖率（E2EBench 口径）、**变更相关性** = 生成用例触达 diff 变更代码/路由的比例、可执行率。

## 3.5 实验流程

1. 数据准备：复现 ReproBreak、挖掘 E2EGit 样本、标注。
2. 跑 B0/B1/B2 与 DiffMend（完整）于修复任务集，记录全部指标与轨迹。
3. RQ1：DiffMend vs B1（有/无 diff 上下文）做修复成功率对比 + 显著性检验。
4. RQ2：按失效类型分层报告。
5. RQ3：DiffMend vs B2（有/无意图判定）做误报率对比；报告意图分类质量。
6. RQ4：E2EGit 泛化集报告成功率与成本；估算 CI 单 PR 修复时延。
7. RQ5：生成子实验，DiffMend-gen vs 无约束生成。

## 3.6 消融实验（Ablation）

| 配置 | 去除的组件 | 目的 |
|------|-----------|------|
| w/o Diff | 不注入 Code Diff 切片 | 验证 diff 上下文贡献（=B1） |
| w/o Intent | 去掉意图判定 | 验证误报抑制贡献（=B2） |
| w/o DOM-candidate | 去掉多属性候选匹配，纯 LLM | 验证候选匹配贡献 |
| w/o Iteration | `N_iter=1`，不反馈迭代 | 验证执行反馈迭代贡献 |
| w/o Semantic-locator | 不强制语义定位 | 验证对未来脆弱性的影响 |

## 3.7 参数与运行环境
- LLM：温度 0.2、Top-p 默认、`N_iter≤5`、Top-k 候选 k=5；记录模型版本。
- 每任务 token/时间预算上限固定，超限判失败。
- 环境：固定 Node/Playwright/浏览器版本、容器化复现；硬件配置记录。

## 3.8 统计分析
- 成功率/误报率组间对比用 McNemar 检验（配对、同任务集）；成本类用 Wilcoxon 符号秩检验；报告效应量（如 Cliff's δ）。
- 多次运行（≥3 次，因 LLM 随机性）报告均值 ± 标准差。

## 3.9 有效性威胁（Threats to Validity）
- **内部**：diff→失效关联可能不精确 → 退化上下文 + 人工抽检；LLM 随机性 → 多次运行、缓存固定。
- **外部**：ReproBreak 复现集中在 4 项目 → 用 E2EGit 扩充并明确泛化局限。
- **构造**：自建样本标注主观 → 双人标注 + κ。
- **可复现**：基线（Practical Limits）不可得 → 以可复现的 B0/B1/B2 为主，定性讨论其余。

---

# 第四部分　实验计划与时间表（与开题 12 个月对齐）

| 月 | 阶段任务 | 对应模块/RQ | 里程碑 |
|----|----------|-------------|--------|
| 1–2 | 精读对标；复现 ReproBreak；搭 harness；复现 B0 | M1, datasets, B0 | MS1 |
| 3–4 | differ + context；diff→失效关联实验；构造 E2EGit 样本 | M2, M3 | MS2 |
| 5–7 | locator/assertion 修复 + validator 迭代；跑 RQ1/RQ2 主实验（vs B1） | M5,M6,M8 / RQ1,RQ2 | MS3 |
| 8–9 | intent 判定；RQ3 误报实验（vs B2）；消融 | M4 / RQ3 | MS4 |
| 10 | 补充生成小实验（RQ5）；E2EGit 泛化与成本（RQ4） | M7 / RQ4,RQ5 | MS5 |
| 11–12 | 全实验整理、统计检验、画图、论文与投稿、开源复现包 | experiments, reporter | MS6 |

**关键路径与裁剪策略**：MS1→MS3 是论文成立的硬路径，必须保证；若进度紧张，按优先级裁剪顺序为 RQ5（生成）→ 部分消融 → E2EGit 泛化规模，保住 RQ1+RQ3 两个核心结论。

---

> 备注：本方案以开源数据（ReproBreak、E2EGit）与可复现基线（B0/B1/B2）为基础，确保在约 1 年周期内产出可量化、可复现的核心结论（RQ1 diff 上下文有效性 + RQ3 意图判定降误报）。
