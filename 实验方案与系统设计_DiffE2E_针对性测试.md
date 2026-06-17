# 详细系统设计、实现计划与实验方案（DiffE2E）

> 配套开题：《面向代码变更的 Playwright 端到端针对性回归测试方法研究》
> 主线：**diff 驱动的针对性（targeted）E2E 回归测试** —— 对一次 commit/PR，产出"可运行、相关、不过时"的 targeted Playwright E2E 测试集。
> 深度分配：**深做**——测试选择 + diff 约束缺口生成；**中等做**——受影响已有测试的 locator/断言修复；**轻做**——过时/疑似回归判定。
> 工具名：**DiffE2E**。
> 实验主范围（边界）：**前端 Web 项目、Playwright + Chromium、可插桩 JS/TS 应用**；后端/API diff 作为扩展或路由/API 启发式兜底，不承诺同等效果。

---

# 第一部分　系统设计

## 1.1 设计目标与约束
- **输入**：被测应用仓库、一次 Code Diff（`V_old→V_new`）、已有 Playwright E2E 套件。
- **输出**：针对本次 diff 的 targeted E2E 测试集（已选 + 已修 + 新生成）+ 执行/覆盖/成本报告。
- **约束**：仅用开源数据（E2EGit 自建 + ReproBreak 修复子实验）；单机 + LLM API；每环节 token/时间预算；所有修复/生成用例必须经 Playwright 真实执行验证；**选择阶段仅用 `V_old` 覆盖映射与 diff，禁止使用 `V_new` 信息**。

## 1.2 总体架构（编号统一为 M0–M9）

```text
                         Code Diff (V_old→V_new)
                                │
        ┌──────────┐            ▼
        │M0 覆盖映射│      ┌──────────┐ ChangeSet ┌──────────┐ selected ┌──────────┐
        │(E2E→源码, │─────▶│M1 变更   │──────────▶│M2 测试   │─────────▶│M3 运行   │
        │ 仅 V_old) │      │影响分析  │           │选择      │          │ 与分诊   │
        └──────────┘      └──────────┘           └──────────┘          └────┬─────┘
                                                              pass│      fail│
                                                                  ▼          ▼
                                                          入 targeted   ┌──────────┐
                                                            set         │M4 过时   │
                                                                        │判定(轻量)│
                                                                  stale│      │regression
                                                                       ▼      ▼
                                                                 ┌──────────┐ 报告疑似回归
                                                                 │M5 修复   │
                                                                 │locator/  │
                                                                 │断言      │
                                                                 └────┬─────┘
                                                            M8 验证通过│ 入 targeted set
                                                                       ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │ M6 覆盖缺口分析：基于"已有 E2E 覆盖映射 + 已选/已修结果"统一计算未覆盖 diff │
   └───────────────────────────────────┬────────────────────────────────────┘
                                        ▼
                                  ┌──────────┐  M8 验证   ┌──────────┐
                                  │M7 diff   │──────────▶│M9 输出   │
                                  │约束生成  │           │targeted  │
                                  └──────────┘           │set & 报告│
                                                         └──────────┘
```

> 说明：M6 覆盖缺口分析**不只发生在修复之后**，而是基于"已有测试覆盖映射 + 本次已选/已修用例的实际覆盖"统一计算 `V_new` 中仍未被触达的 diff，再交 M7 生成。

## 1.3 模块详细设计

### M0　E2E→源码覆盖映射采集（选择前提，仅 V_old）
- 对被测应用启用覆盖插桩（前端 JS/TS：istanbul/nyc 或 Playwright `coverage` API）。
- 逐个运行已有 E2E 用例，记录触达的源码文件/函数/路由，落库 `cov[test]={files,routes,components}`；增量更新（iJaCoCo 思想）。
- **边界**：后端 API、动态 import、构建后 source map、跨浏览器覆盖不稳定，主范围限定前端可插桩 JS/TS + Chromium；其余用路由/组件静态映射兜底。

### M1　变更影响分析（Change Impact Analyzer）
- `git diff V_old V_new` → 变更文件/行；tree-sitter AST → 变更符号、命中组件/路由/`data-testid`/选择器；区分前端 vs 后端/API。
- 输出 `ChangeSet={files,symbols,routes,components,element-level changes}`，标注可达关联层级 L1/L2/L3。

### M2　已有 E2E 测试选择（深做核心，无泄漏）
- `Sel = { t | cov_Vold[t].files ∩ ChangeSet.files ≠ ∅ }`；无覆盖数据用路由/组件静态启发式兜底。
- **仅使用 `V_old` 覆盖映射与 diff**；安全性兜底可对不确定用例保守纳入并报告权衡。

### M3　运行与分诊（Runner & Triage）
- 运行 `Sel`；通过→入 targeted set；失败→ M4，采集 trace/DOM/screenshot/堆栈。

### M4　过时判定（Staleness Classifier，轻做）
- 仅三类：`STRUCTURAL_ONLY`→M5 修脚本；`EXPECTATION_CHANGE`（文本/URL/可见性）→M5 改断言；`SUSPECTED_REGRESSION`→报告。低置信度同时尝试并由 M8 裁决；**不声称理解复杂业务意图**。

### M5　受影响测试修复（中等做支撑模块）
- 上下文 = 失效用例 + 失败 trace + 失效时刻 DOM 候选 + **引发失效 Code Diff 切片（L1/L2/L3）**。
- 定位符断裂：多属性候选匹配 + LLM 重写为 Playwright 语义定位；断言失配：结合变更与新页面状态更新期望；解释一致性校验抑制幻觉；交 M8 验证。

### M6　覆盖缺口分析（统一计算）
- `gap = ChangeSet 中未被"已有覆盖映射 ∪ 本次已选已修用例实际覆盖"触达的源码/路由/页面/新交互`。

### M7　diff 约束缺口生成（深做核心）
- 以 `gap` 涉及功能/页面为种子，覆盖率/变更导向多阶段提示（SymPrompt）+ 页面语义抽象（VISCA）+ 特性驱动（AutoE2E）生成 Playwright 用例。
- **生成目标收窄三条**：(a) 触达 diff 相关页面/路由/组件；(b) 完成关键用户路径；(c) 至少含可解释 UI 断言（文本/URL/可见性/role）。

### M8　执行验证与迭代（Validator / Loop）
- 修复补丁与生成用例在 `V_new` 实跑；失败反馈 trace 增强上下文迭代（上限 `N_iter`，默认 3–5）；预算耗尽保留最优并标注。

### M9　targeted set 输出与报告（Reporter）
- 输出 targeted 集（已选/已修/新生成分类）+ 报告：精简比例、SelectionChangeCoverage、FinalChangeCoverage、TargetedSetUsability、生成相关性/可执行率/语义有效率、token/时间成本、可解释依据（JSON+Markdown）。

## 1.4 核心数据结构

```json
{
  "change_id": "proj2_pr_318",
  "app_version": {"old": "f3a1", "new": "f3b7"},
  "change_set": {"files": ["src/Cart.tsx","src/api/cart.ts"], "routes": ["/cart"],
                 "components": ["CartItem"], "assoc_level": "L3"},
  "selection": {"full_suite": 240, "selected": 12, "reduction": 0.95,
                "selection_change_coverage": 0.78},
  "oracle": {"affected_tests": ["cart.spec.ts::add","cart.spec.ts::remove","..."],
             "safety_recall": 0.92, "precision": 0.83},
  "run": {"passed": ["..."], "failed": [{"test":"cart.spec.ts::remove","error":"LOCATOR_NOT_FOUND"}]},
  "staleness": {"cart.spec.ts::remove": {"label":"STRUCTURAL_ONLY","conf":0.9}},
  "repair": [{"test":"cart.spec.ts::remove","type":"LOCATOR","verified": true}],
  "gap": {"uncovered_routes": ["/cart/coupon"]},
  "generated": [{"test":"cart_coupon.spec.ts","touches_diff": true,"verified": true,
                 "has_ui_assertion": true,"human_semantic_valid": true}],
  "final": {"final_change_coverage": 0.95, "targeted_set_usability": 0.92},
  "cost": {"llm_tokens": 18230, "wall_sec": 142, "iters": 2},
  "targeted_set": {"selected_pass": 11, "repaired": 1, "generated": 1, "total": 13}
}
```

## 1.5 技术栈选型
| 关注点 | 选型 |
|--------|------|
| 测试运行/采集 | Node.js + Playwright（Test Runner、Trace、coverage），Chromium 主 |
| 覆盖映射 | istanbul/nyc（前端 JS/TS）/ Playwright coverage；增量更新 |
| 编排 | Python 核心 + 子进程调用 Playwright；可选 LangGraph |
| Diff/AST | git + tree-sitter（JS/TS/HTML） |
| DOM 解析/匹配 | lxml / BeautifulSoup + 相似度 |
| LLM | API 模型 + 1 个开源模型对照；结构化 JSON 输出；全程缓存 |

---

# 第二部分　实现计划

## 2.1 仓库结构
```text
diffe2e/
├── coverage/   # M0 E2E→源码覆盖映射采集与增量更新
├── impact/     # M1 变更影响分析
├── selector/   # M2 已有 E2E 选择
├── oracle/     # 受影响测试 oracle 构造（V_new 全量覆盖）
├── runner/     # M3 运行与分诊
├── staleness/  # M4 过时/回归判定
├── repair/     # M5 locator/断言修复
├── gap/        # M6 覆盖缺口分析
├── generate/   # M7 diff 约束生成
├── validator/  # M8 执行验证与迭代
├── reporter/   # M9 targeted set 与报告
├── llm/        # LLM 客户端/模板/缓存/结构化输出
├── datasets/   # E2EGit 自建集 + ReproBreak 适配器
├── experiments/
└── tests/
```

## 2.2 里程碑

| 里程碑 | 模块 | 关键交付 | 验收 |
|--------|------|----------|------|
| MS1 数据/覆盖就绪 | coverage + datasets | 2–3 个可插桩 E2EGit Playwright 项目；E2E→源码覆盖映射建成 | 映射覆盖主要用例；可增量更新 |
| MS2 选择+oracle | impact + selector + oracle | diff→选择 + V_new 全量 oracle | Reduction/Safety/Precision/SelectionChangeCoverage 可统计（RQ1） |
| MS3 生成 | gap + generate + validator | 缺口识别 + diff 约束生成 + 验证 + 人工抽检 | 变更相关性/可执行率/语义有效率（RQ2） |
| MS4 修复支撑 | runner + staleness + repair | 受影响失效测试修复入集 | ReproBreak 修复成功率 + TargetedSetUsability（RQ3） |
| MS5 闭环+成本 | reporter + experiments | 端到端 targeted set + FinalChangeCoverage + 成本/泛化 | RQ4 成本/泛化/CI 时延 |
| MS6 实验完备 | experiments | 全指标/消融/统计/复现包 | 一键复现主表 |

## 2.3 开发顺序与依赖
`M0→M1→M2→oracle`（选择最小闭环 + 评测）→`M6→M7→M8`（生成）→`M3→M4→M5`（修复支撑）→`M9`。
先打通"单 diff → 选相关用例 → 运行 → 输出 targeted set"最小闭环，再加生成、修复。

## 2.4 工程实践
成本控制（LLM 缓存、先小子集）、可复现（固定模型/Playwright/浏览器版本、中间产物落盘）、每变更一份 JSON 轨迹（见 1.4）、关键模块单元测试 + 端到端冒烟。

---

# 第三部分　实验方案

## 3.1 研究问题（4 个主问题）
- **RQ1（选择，核心）**：基于 Code Diff 的 E2E 测试选择能否减少执行开销，同时保持较高变更覆盖能力？
- **RQ2（生成，核心）**：相比无 diff 的 E2E 生成，diff 约束生成是否产生更高变更相关性与可执行率（及语义有效率）的测试？
- **RQ3（修复，支撑）**：对已存在但因变更失效的测试，引入修复模块能否提升 targeted test set 的可用性（TargetedSetUsability）？
- **RQ4（成本/泛化）**：方法在真实开源项目上的成本（token/迭代/wall-clock）、泛化性与 CI 可集成性如何？
- **（附加/讨论）**：过时/回归判定在小规模标注集上的质量（Precision/Recall/F1 + κ），不强行全量。

## 3.2 受影响测试 Oracle（Ground Truth，关键）
- **构造**：在 `V_new` 上**全量运行 E2E 并采集覆盖**，凡触达 diff 行/路由/组件的测试构成"受影响测试 oracle" `Affected`。
- **无泄漏原则**：选择器 M2 **只允许使用 `V_old` 覆盖映射与 diff**；`V_new` 全量覆盖**仅用于事后构造 oracle 与评测**，不得回流给选择器。
- 失败而无法采覆盖的用例，结合修复后覆盖与人工核对补全 oracle，并报告 oracle 不确定度。

## 3.3 数据集

| 用途 | 来源 | 规模目标 | 构造 |
|------|------|----------|------|
| 选择/生成主实验 | **自建**（挖 E2EGit Playwright 项目 commit 历史） | 2–3 项目、数十–上百变更点 | commit→变更文件→受影响/失效/新增 E2E；采集 E2E→源码覆盖映射 |
| 修复子实验 | ReproBreak | 449 个 locator break（4 项目） | 复用复现脚本；抽取应用侧 diff 切片 |
| 泛化 | E2EGit 其余 Playwright 项目 | ≥1–2 项目 | 半自动构造变更点 |
| 过时判定标注 | 失效样本子集 | ≥100 | 双人标注 + Cohen's κ + 仲裁 |

- **防泄漏**：提示工程/调参在 dev 项目，主结果在 held-out 项目报告。

## 3.4 基线
- **选择（RQ1）**：retest-all（全量，上界对照）、随机选同规模子集、纯静态路由/组件启发式选择。
- **生成（RQ2）**：无 diff 约束的页面/功能驱动生成（参考 AutoE2E 思路实现，不要求完整复现其系统）、随机/未定向生成。
- **修复（RQ3）**：B0 纯属性 self-healing（无 LLM，兜底）、B1 无 diff 上下文纯 LLM 修复；条件性纳入可复现 Web UI 修复工作。

## 3.5 评估指标（形式化，已按 review 拆分）

设全量套件 `S`，选出子集 `Sel`，受影响 oracle `Affected`，变更 `c`。

**选择阶段（RQ1）**
- `Reduction = 1 − |Sel|/|S|`（并报告 wall-clock 时间下降）。
- `Safety（召回）= |Sel ∩ Affected| / |Affected|`。
- `Precision = |Sel ∩ Affected| / |Sel|`。
- `SelectionChangeCoverage` = **仅已选已有测试中无需修复即可在 V_new 通过者**实际触达的 `c` 变更行/路由占比。说明：`Safety/Precision` 评价"选择是否选对"，`SelectionChangeCoverage` 评价"无需修复即可执行的已选测试覆盖能力"；因 locator/断言过时而失败的相关测试不在此体现，另由 `TargetedSetUsability` 反映。

**闭环阶段（RQ3 / 总体）**
- `FinalChangeCoverage` = 选择 + 修复 + 生成后，targeted 集最终触达 `c` 的占比。
- `TargetedSetUsability = (selected_pass + repaired_pass) / |Sel ∩ Affected|`，即"可运行的已选相关测试数 / 初始选中的相关测试数"；**生成用例不计入分母**（避免与 FinalChangeCoverage 混淆）。核心闭环指标，体现修复服务于 targeted regression testing。

**生成阶段（RQ2）**
- 变更相关性 = 生成用例触达 `c` 变更代码/路由比例；可执行率 = 生成用例成功运行比例；功能覆盖率（E2EBench 口径）；**语义有效率 = 人工抽检中"确实在有意义地测试变更行为"的比例**（回应"可执行≠正确测试"）。

**成本（RQ4）**：平均 token、迭代次数、wall-clock、单变更估算花费、CI 单 PR 端到端时延。
**过时判定（附加）**：三类 Precision/Recall/F1、混淆矩阵、标注 κ。

## 3.6 实验流程（按 review 重排，避免信息泄漏）
1. 在 `V_old` 上采集每个 E2E 的覆盖映射（M0）。
2. 给定 diff，用选择器（仅用 V_old 覆盖 + diff）选出 `Sel`（M1, M2）。
3. 在 `V_new` 上**全量运行 + 全量覆盖一次**，构造受影响测试 oracle `Affected`（§3.2）。
4. 比较 `Sel` 与 `Affected`，得到 `Safety/Precision/Reduction/SelectionChangeCoverage`（RQ1）。
5. **先**对选中但失败的测试做修复（M3, M4, M5, M8），计算 `TargetedSetUsability`（RQ3，含 ReproBreak 修复子实验）。
6. **基于"已选通过 + 修复通过"的实际覆盖统一计算覆盖缺口 `gap`（M6）**——避免把"修复后即可覆盖的 diff"误判为缺口而生成冗余测试。
7. 对 `gap` 做 diff 约束生成（M7, M8），评估变更相关性/可执行率/语义有效率（RQ2）；报告最终 targeted set 的 `FinalChangeCoverage`、可用率与成本（M9, RQ4）。

## 3.7 消融（用消融比单纯按失效类型比较更有说服力）

| 配置 | 去除 | 目的 |
|------|------|------|
| 选择 w/o coverage-map | 仅静态启发式 | 覆盖映射对选择精简度/安全性贡献 |
| 生成 w/o diff 约束 | 去掉 diff 约束 | diff 约束对相关性/可执行率贡献（=RQ2 对照） |
| 修复 w/o diff 切片 | 不注入 Code Diff 切片 | diff 上下文对修复贡献 |
| 修复 w/o 候选匹配 | 纯 LLM | 候选元素匹配贡献 |
| 修复 w/o 语义 locator | 不强制语义定位 | 对未来脆弱性影响 |
| w/o 迭代 | N_iter=1 | 执行反馈迭代贡献 |

## 3.8 参数与环境
LLM 温度 0.2、Top-k 候选 k=5、`N_iter≤5`、每环节 token/时间预算上限；固定 Node/Playwright/Chromium 版本、容器化复现；记录硬件与模型版本。

## 3.9 统计分析
**配对的二元结果**（如同一测试是否修复成功、是否被选中）用 McNemar 检验；**覆盖率/成本/比例等连续或比例指标**优先用 Wilcoxon 符号秩检验或 bootstrap 置信区间，并报告效应量（Cliff's δ）；因 LLM 随机性≥3 次运行报告均值±std。

## 3.10 有效性威胁
- **内部**：覆盖映射不全 / diff→失效关联（L1/L2/L3）不稳定 / oracle 受插桩准确性影响 → 报告关联成功率与 oracle 不确定度、退化兜底、人工抽检。
- **外部**：自建数据集项目数有限、ReproBreak 集中 4 项目、限定 Chromium+JS/TS → 明确泛化局限并以 E2EGit 扩充。
- **构造**：标注主观 → 双人 + κ + 仲裁；生成"语义有效率"依赖人工判断。
- **可复现**：Practical Limits 不可得 → 以可复现基线为主，定性讨论。

---

# 第四部分　实验计划与时间表（与开题 12 个月对齐）

| 月 | 任务 | 模块/RQ | 里程碑 |
|----|------|---------|--------|
| 1–2 | 精读对标；选 2–3 个可插桩 E2EGit Playwright 项目；建覆盖采集与 harness；复现 ReproBreak | M0, datasets | MS1 |
| 3–4 | 变更影响分析 + 选择 + V_new oracle 构造；RQ1 | M1,M2,oracle / RQ1 | MS2 |
| 5–7 | 缺口分析 + diff 约束生成 + 验证迭代 + 人工抽检；RQ2 | M6,M7,M8 / RQ2 | MS3 |
| 8–9 | 分诊 + 过时判定 + 修复；ReproBreak 修复子实验 + TargetedSetUsability；RQ3 | M3,M4,M5 / RQ3 | MS4 |
| 10 | 端到端闭环；FinalChangeCoverage；E2EGit 泛化 + 成本/CI 时延；RQ4；过时判定标注 | M9 / RQ4 | MS5 |
| 11–12 | 全实验整理、统计、画图、论文与投稿、开源数据/复现包 | experiments | MS6 |

**关键路径与裁剪**：硬路径 = MS1→MS3（守住 RQ1 选择 + RQ2 生成两个核心结论）。进度紧张时裁剪顺序：过时判定标注规模 → 修复消融数量 → E2EGit 泛化项目数；务必保住 RQ1 + RQ2。

---

> 备注：主线"选择/生成"无开箱基准、需自建小而可靠的针对性 E2E 数据集（最大工程风险），已在 MS1 与数据集构造重点安排；修复子实验依托现成 ReproBreak，确保该环节低风险、可量化。Oracle 采用 V_new 全量覆盖事后构造、选择器仅用 V_old 信息，杜绝信息泄漏。
