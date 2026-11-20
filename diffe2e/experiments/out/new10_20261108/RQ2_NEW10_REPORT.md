# 第三步：受控缺口扩样 5 → 10

生成时间：2026-11-08（Asia/Shanghai）
范围：扩展历史新增 y01–y05 共 5 个缺口；与第二步已完成的 x01–x05 合并为 10 缺口表。
约束：主表（n=3，c03/c13/c19）、冻结清单、论文正文均未改动；本表与第二步表分开存放、可分别对应。

---

## 1. 预注册（先于实验）

| 项目 | 值 |
|---|---|
| 预注册清单 | `manifest_expansion_v2.json` |
| 落盘时间 | 2026-11-08T12:41:15Z（本地 20:41） |
| 清单 SHA256 | `f6927d288343b2936c1bfef0c5eb6c764520877b53f2fdea027526881c0812f8` |
| 实验开始时间 | 2026-11-08T12:45:41Z（本地 20:45），晚于预注册 4 分钟 |
| 纳入规则 | 扩展历史中所有“新增路由且无测试”的 commit 全部纳入；不做结果驱动筛选 |
| 历史基线 | 从阶段三 `work_exp.bundle` 恢复（sha256 `6de585ce…`），父标签 x05（`eb57c55`） |

5 个新缺口在 x05 之后依次提交，每个 commit 只新增一个路由源文件并在 `main.js` 注册路由，不加测试：

| 缺口 | 路由 | 类型 | 交互 | 信号密度 | commit |
|---|---|---|---|---|---|
| y01 | `/notifications` | 通知开关（toggle） | 点击复选框（change） | testid 富集 + aria | `180af2b` |
| y02 | `/survey` | 表单提交 | 下拉选择 + 文本域 + 提交 | 仅文本/role/aria（无 testid） | `7990e05` |
| y03 | `/downloads` | 列表清空 | 点击按钮清空并更新计数 | testid 容器 + 可见文本 | `e9634c0` |
| y04 | `/support` | 长度阈值校验 | 填写文本 + 点击检查（阈值分支） | 仅 role/aria（无 testid） | `be0b2dd` |
| y05 | `/reports` | 报表生成 | 选择周期 + 点击生成（结果串含周期） | testid + role | `b702e90` |

新历史 bundle：`work_exp_v2.bundle`（sha256 `81e392ae6c2ad0c75ae6991821de5c7742a81cc0f860647dd4109cec2c07d8c9`）。

---

## 2. RQ1 基线（新增 5 缺口）

| 缺口 | 既有 spec 数 | 基线失败 | 覆盖到缺口文件的既有 spec | 预期受影响 |
|---|---|---|---|---|
| y01 | 6 | 0 | 0 | [] |
| y02 | 6 | 0 | 0 | [] |
| y03 | 6 | 0 | 0 | [] |
| y04 | 6 | 0 | 0 | [] |
| y05 | 6 | 0 | 0 | [] |

说明：新增路由不被既有 6 个 spec 覆盖，覆盖映射为空，符合“新增功能且无测试”的缺口定义。首轮运行曾受上一轮残留 `_gen_*.spec.ts` 污染（full=16），已清理后重跑，上表为干净结果。

---

## 3. 用例生成

- provider：deepseek（真实调用）；每个缺口生成 diff 臂与 nodiff 臂各 1 条，共 10 条 spec，原文已落盘在 `rq2_new10_results.json`。
- diff 臂提示词包含缺口路由与源码；nodiff 臂只给应用名，不给 diff/路由。
- 生成调用沿用阶段三同一 client，未显式固定 temperature；同一缺口重跑可能得到不同 spec，正式结果以本批落盘文本为准。
- 调用记录：`llm_usage.jsonl` 共 20 次（含首轮脚本中断前的 10 次；正式结果取第二轮落盘的 10 条）。

---

## 4. diff 臂逐缺口（v2 五类算子）

| 缺口 | 路由 | 可执行 | change-relevant | 注入 | 杀伤 | 分数 | 版本敏感 | 自动语义有效 | 来源 |
|---|---|---|---|---|---|---|---|---|---|
| x01 | /settings | true | true | 5 | 4 | 0.8 | true | true | 第二步沿用 |
| x02 | /feedback | true | true | 7 | 7 | 1 | true | true | 第二步沿用 |
| x03 | /inbox | true | true | 5 | 4 | 0.8 | true | true | 第二步沿用 |
| x04 | /checkout | true | true | 6 | 6 | 1 | true | true | 第二步沿用 |
| x05 | /help | true | true | 5 | 4 | 0.8 | true | true | 第二步沿用 |
| y01 | /notifications | true | true | 5 | 4 | 0.8 | true | true | 本批新增 |
| y02 | /survey | true | true | 7 | 7 | 1 | true | true | 本批新增 |
| y03 | /downloads | true | true | 6 | 5 | 0.8333 | true | true | 本批新增 |
| y04 | /support | true | true | 6 | 5 | 0.8333 | true | true | 本批新增 |
| y05 | /reports | true | true | 7 | 4 | 0.5714 | true | true | 本批新增 |

## 5. nodiff 臂逐缺口

| 缺口 | 可执行 | change-relevant | 注入 | 杀伤 | 分数 | 版本敏感 | 自动语义有效 | 来源 |
|---|---|---|---|---|---|---|---|---|
| x01 | false | false | 0 | 0 | 0 | false | false | 第二步沿用 |
| x02 | false | false | 0 | 0 | 0 | false | false | 第二步沿用 |
| x03 | true | false | 5 | 0 | 0 | false | false | 第二步沿用 |
| x04 | false | false | 0 | 0 | 0 | false | false | 第二步沿用 |
| x05 | false | false | 0 | 0 | 0 | false | false | 第二步沿用 |
| y01 | false | false | 0 | 0 | 0 | false | false | 本批新增 |
| y02 | false | false | 0 | 0 | 0 | false | false | 本批新增 |
| y03 | false | false | 0 | 0 | 0 | false | false | 本批新增 |
| y04 | true | false | 6 | 0 | 0 | false | false | 本批新增 |
| y05 | false | false | 0 | 0 | 0 | false | false | 本批新增 |

nodiff 只有 2/10 可执行（x03、y04），均落在既有路由（home/cart 冒烟），不覆盖新增缺口文件，故 change-relevant 全为 0、变异杀伤全为 0。

---

## 6. 汇总（n=10）

| 指标 | diff | nodiff |
|---|---|---|
| n | 10 | 10 |
| executable-rate | 1.0 | 0.2 |
| change-relevant-rate | 1.0 | 0.0 |
| 变异杀伤均值 | 0.8438 | 0.0 |
| 版本敏感率 | 1.0 | 0.0 |
| 自动语义有效率 | 1.0 | 0.0 |

## 7. 算子类合计（diff）

| 算子类 | 注入 | 杀伤 | 杀伤率 |
|---|---:|---:|---:|
| testid | 5 | 5 | 1.0000 |
| 文本 | 10 | 8 | 0.8000 |
| 属性-可访问性 | 24 | 18 | 0.7500 |
| 结构-可见性 | 10 | 10 | 1.0000 |
| 条件逻辑-状态 | 10 | 9 | 0.9000 |

---

## 8. 未杀伤点解释（均为用例信号覆盖，不是算子失效）

- y03 文本（`3 files` → 变异计数）：用例断言的是清空后的 `0 files`，未断言初始计数，故初始文本变异不被杀。
- y04 文本（`Waiting for input` → 变异占位文案）：用例只断言点击后的结果文案，未断言初始状态。
- y05 属性 2 条（Period 的 label+aria、role=status）：用例用 testid 定位且未切换周期，故这两条信号未被使用。
- y05 逻辑（固定返回 Week）：用例直接使用默认周期 Week，行为等价，变异不改变可观察结果；这是用例未覆盖“切换周期”路径，不是算子缺陷。
- y01 属性（Enable alerts 的 label+aria）：用例用 testid 定位复选框，未使用可访问名，与 x01 同类。

## 9. 边界

- n=10，每个缺口一条 diff 用例；结果只能描述为样本内的比率，不做显著性声明。
- 生成未固定 temperature，spec 存在重跑波动；本表数值对应落盘 spec。
- 主实验 3 个缺口（c03/c13/c19）仍只出现在主表，未并入本表，避免把主表 n=3 与扩样 n=10 混统计。

---

## 10. 产物

| 文件 | 内容 |
|---|---|
| `manifest_expansion_v2.json` | 预注册清单（5 个新缺口、来源 commit、源码哈希） |
| `work_exp_v2.bundle` | 扩展历史（x00–x05 + y01–y05）完整 bundle |
| `rq1_new10.json` | 新增 5 缺口 RQ1 基线 |
| `rq2_new10_results.json` | 新增 5 缺口两臂明细、spec 原文、逐变异结果、内嵌 RQ1 |
| `rq2_new10_combined.json` | 10 缺口合并数据（x01–x05 + y01–y05） |
| `rq2_new10_table.md` | 10 缺口单表（diff/nodiff、汇总、算子类） |
| `RQ2_NEW10_REPORT.md` | 本报告 |
| `build_work_exp_v2.mjs` / `run_new10_v2.mjs` / `fix_new10_aggregate.mjs` | 构造、运行、收尾修正脚本 |
| `llm_usage.jsonl` | DeepSeek 调用记录 |
| `SHA256SUMS` | 产物哈希 |

## 11. 复现

```bash
# 1) 构造扩展历史并预注册（实验前）
node build_work_exp_v2.mjs
# 2) 运行（需 DEEPSEEK_API_KEY；工作树 /tmp/expv3/work_exp 安装 1.54.0）
node run_new10_v2.mjs
# 3) 干净 RQ1 与 10 缺口合并表
node fix_new10_aggregate.mjs
```
