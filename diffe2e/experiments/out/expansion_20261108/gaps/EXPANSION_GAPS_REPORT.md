# 阶段三报告：受控缺口扩样（3 → 8）

- 批次目录：`diffe2e/experiments/out/expansion_20261108/gaps/`
- 预注册文件：[manifest_expansion.json](./manifest_expansion.json)
- 主实验（c03 / c13 / c19，2 类算子，n=3）与主表、冻结清单、论文均未改动。
- 本报告只描述扩展批次；**不与主实验合并统计，不重算 p 值 / κ**。

## 1. 执行摘要

| 项目 | 扩展批次口径 |
|---|---|
| 新缺口 | 5 个（x01–x05，独立扩展历史 `work_exp`，x00 基线 + 5 个“新增路由且无测试”commit） |
| 纳入规则 | 扩展历史中所有“新增路由且无测试”的 commit 全部纳入，无结果驱动筛选 |
| 待评测缺口 | 8 个（5 新 + 主 3 缺口在扩展批次内重跑；主 3 仅用于扩展表，不替换主表） |
| 旧 2 类算子 | n=8（与主实验 `mutantsForGap` 逐字一致，每缺口最多 3 个） |
| 新 5 类算子 | n=8（每缺口 4–5 个，共 42 个注入） |
| 生成 | DeepSeek `deepseek-v4-flash`，diff/nodiff 两臂，10 次调用（5 新缺口 × 2 臂） |
| 人工标注 | 未做（本阶段只跑自动代理指标） |

核心数字（diff 臂，n=8）：

- 旧 2 类算子：executable 1.0，change-relevant 1.0，平均变异杀伤 0.5，change-sensitive 1.0，自动语义有效 0.625。
- 新 5 类算子：executable 1.0，change-relevant 1.0，平均变异杀伤 0.5625，change-sensitive 1.0，自动语义有效 **1.0**。
- nodiff 臂：两套算子下仅 1/8 可执行，change-relevant 均为 0，自动语义有效均为 0。

## 2. 预注册与独立扩展历史

### 2.1 时间顺序与可查证据

- `manifest_expansion.json` 生成于 `2026-11-08T11:42:21.672Z`（本地 19:42）。
- 扩展 RQ1 覆盖基线 `rq1_expansion.json` 于 19:47 完成。
- 两臂与算子结果 `rq2_expansion_results.json` 于 19:53 完成。
- 即预注册文件先于任何实验结果落盘；文件内每个缺口带 `registered_before_experiment: true`。

扩展历史可恢复验证：`work_exp.bundle`、`work_main_replica.bundle`（见 §7），`git bundle verify` 通过；clone 后标签与预注册 commit 一一对应。

### 2.2 五个新缺口（预注册内容）

| gap | 来源 commit | 变更文件 | 路由 | 交互类型 | 信号密度 | 预期受影响既有用例 | RQ1 实测受损用例 |
|---|---|---|---|---|---|---|---|
| x01 | `ad010ee` | `app/public/src/settings.js`, `app/public/src/main.js` | `/settings` | 设置开关：点击复选框（change） | data-testid 富集（3 个） | `[]` | `0` |
| x02 | `32443f2` | `app/public/src/feedback.js`, `app/public/src/main.js` | `/feedback` | 表单提交：下拉 + 文本域 + 点击 | 仅可见文本 / role / aria（无 testid） | `[]` | `0` |
| x03 | `d49da8d` | `app/public/src/inbox.js`, `app/public/src/main.js` | `/inbox` | 列表筛选：输入框键入（input） | testid 容器 + 可见文本列表项 | `[]` | `0` |
| x04 | `9b0884b` | `app/public/src/checkout.js`, `app/public/src/main.js` | `/checkout` | 条件逻辑 / 边界：数量 + 点击（阈值分支） | 仅 role / aria / 可见文本（无 testid） | `[]` | `0` |
| x05 | `eb57c55` | `app/public/src/help.js`, `app/public/src/main.js` | `/help` | 可展开详情：点击切换可见性 | 仅可见文本 + aria-label（无 testid） | `[]` | `0` |

- 基线 x00 = `09df7e5`，来源为 `subject/base`（主 manifest c00 同源副本，主 manifest 记录 `d78b464`）。
- 5 条缺口的 `changed_files` 均为“新增路由源文件 + `main.js` 注册路由”，**没有新增测试**；完整源码与 SHA256 记录在 `manifest_expansion.json`。
- RQ1 在扩展历史上跑完整套件（6 个 spec）：`full_suite=6`，基线失败 0；5 条缺口的 `affected_existing_specs` 均为空，与预注册一致。
- 主 3 缺口的来源 commit（只读引用，未改动）：c03 `0ddfb1a`（`/coupon`）、c13 `0938e31`（`/wishlist`）、c19 `e345769`（`/faq`）。

### 2.3 为什么这 5 条不是“挑出来的”

- 纳入规则在预注册里固定：扩展历史中所有“新增路由且无测试”的 commit 全部纳入；5 条就是该独立历史的全集。
- 5 条在实验前就固定了路由、交互类型与信号密度；实验后没有增删、没有替换。
- 5 条中有 3 条刻意不含 `data-testid`（x02 / x04 / x05），与主 3 缺口（全部 testid 富集）形成互补，而不是挑“更容易”的样本。

## 3. 变异算子

### 3.1 旧 2 类算子（与主实验逐字一致）

- **testid 重命名**：把缺口源码中的 `data-testid` 值追加 `-MUT`。
- **可见文本修改**：把首个可见文本 token 追加 ` MUT`。
- 每缺口最多 3 个（去重后截断），与 `run_rq2.mjs#mutantsForGap` 完全一致。
- 样本量：n=8；实际注入 26 个（被杀 10 个）；逐用例平均杀伤 0.5，池化杀伤 10/26=0.3846。

> 过程修正（透明记录）：首轮脚本把缺口 id（如 `x02`）误传给 `k`，导致旧算子未按 k=3 截断（得到 5–6 个/缺口，平均杀伤 0.3687）。发现后用 `rerun_old_operators.mjs` **只重跑旧算子**，复用同一批生成用例；新 5 类算子与生成用例均未重跑、未改动。

### 3.2 新 5 类算子（每缺口 4–5 个）

| 类 | 操作定义 | 选择规则 |
|---|---|---|
| testid | 首个 `data-testid` 值追加 `-MUT` | 源码中第一个 testid |
| 文本 | 首个可见文本 token 追加 ` MUT` | 源码中第一个 `>Text<` |
| 属性 / 可访问性 | `aria-label` / `placeholder` / `role` / `name` 值追加 ` MUT`；若无属性，则给首个 `<button>` 加 `disabled` | 按上述优先级取第一个 |
| 结构 / 可见性 | 移除最后一个结果类元素（testid 含 status/msg/count/total/body/list/results，或 `role="status"`，或带 `hidden`） | 源码中最后一个结果元素 |
| 条件逻辑 / 状态 | 按缺口改变比较符、边界、三元分支、toggle 或状态累加 | 每个缺口一条预定义规则（见下表） |

逐缺口逻辑算子：

| gap | 逻辑变异 |
|---|---|
| x01 | `box.checked ? 'on' : 'off'` 三元分支对调 |
| x02 | `Thanks, ${rating.value}` → 固定 `Thanks, Good`（忽略用户选择） |
| x03 | `includes(q)` → `startsWith(q)` |
| x04 | 边界 `n>=3` → `n>3` |
| x05 | `details.hidden=!details.hidden` → `details.hidden=true`（切换失效） |
| c03 | coupon 三元分支对调 |
| c13 | `n++` → `n+=2` |
| c19 | `p.hidden=!p.hidden` → `p.hidden=true` |

- 样本量：n=8；实际注入 42 个（被杀 26 个）；逐用例平均杀伤 0.5625，池化杀伤 26/42=0.6190。

## 4. 结果

### 4.1 表 5-5b：旧 2 类算子（扩展批次，n=8）

| arm | n | executable | change-relevant | mutation-kill (mean) | change-sensitive | semantic-valid (auto) |
|---|---|---|---|---|---|---|
| diff | 8 | 1.0 | 1.0 | 0.5 | 1.0 | 0.625 |
| nodiff | 8 | 0.125 | 0 | 0 | 0 | 0 |

- nodiff 只有 x03 可执行；x03 nodiff 不覆盖 `/inbox`，因此旧算子 0/3、自动语义有效为 0。
- 主实验 n=3 参考（只读，不并入）：diff 1.0 / 1.0 / 0.6667 / 1.0 / 1.0；nodiff 0 / 0 / 0 / 0 / 0（2026-11-08 复核修正，见 `../FREEZE_RECORD.md` §8）。

### 4.2 表 5-5c：新 5 类算子（扩展批次，n=8）

| arm | n | executable | change-relevant | mutation-kill (mean) | change-sensitive | semantic-valid (auto) |
|---|---|---|---|---|---|---|
| diff | 8 | 1.0 | 1.0 | 0.5625 | 1.0 | 1.0 |
| nodiff | 8 | 0.125 | 0 | 0 | 0 | 0 |

### 4.3 逐缺口（diff 臂）

| gap | 信号密度 | 旧算子 杀死/注入 | 旧算子分数 | 旧 semantic | 新 5 类 杀死/注入 | 新 5 类分数 | 新 semantic |
|---|---|---|---|---|---|---|---|
| x01 `/settings` | testid 富集 | 3/3 | 1.0 | ✔ | 3/5 | 0.6 | ✔ |
| x02 `/feedback` | 无 testid | 0/3 | 0 | ✘ | 2/4 | 0.5 | ✔ |
| x03 `/inbox` | testid + 文本 | 3/3 | 1.0 | ✔ | 3/5 | 0.6 | ✔ |
| x04 `/checkout` | 无 testid | 0/3 | 0 | ✘ | 2/4 | 0.5 | ✔ |
| x05 `/help` | 无 testid | 0/2 | 0 | ✘ | 2/4 | 0.5 | ✔ |
| c03 `/coupon` | testid 富集（主） | 2/3 | 0.6667 | ✔ | 3/5 | 0.6 | ✔ |
| c13 `/wishlist` | testid 富集（主） | 2/3 | 0.6667 | ✔ | 3/5 | 0.6 | ✔ |
| c19 `/faq` | testid 富集（主） | 2/3 | 0.6667 | ✔ | 3/5 | 0.6 | ✔ |

- 8 个 diff 用例全部 executable、全部 change-relevant、全部 change-sensitive。
- 旧算子在 3 个无 testid 缺口上全部 0 杀伤；新 5 类算子靠结构/逻辑算子把它们变为可检出（x02/x04/x05 由 ✘ 转 ✔）。
- x05 旧算子只有 2 个可见文本 token，未达到 3 个上限，故注入数为 2。

### 4.4 新 5 类算子逐类杀伤（全部 8 缺口 × 2 臂）

| 算子类 | 注入 | 杀死 | 杀伤率 |
|---|---:|---:|---:|
| testid | 6 | 2 | 0.3333 |
| 文本 | 9 | 0 | 0 |
| 属性 / 可访问性 | 9 | 3 | 0.3333 |
| 结构 / 可见性 | 9 | 8 | 0.8889 |
| 条件逻辑 / 状态 | 9 | 8 | 0.8889 |

解释（重要，避免误读）：

- **testid 2/6**：只有生成用例真的使用 `getByTestId` 并断言该元素时才会杀（x01/x03 的 diff 用例）；x03 nodiff 与主 3 缺口 diff 用例未使用首个 testid 定位，故不杀。
- **文本 0/9**：新算子每缺口只改“第一个可见文本”，多数是标题；Playwright 的 `getByRole(..., { name })` / `getByText` 默认是子串匹配，且部分用例根本不检查标题，所以标题追加 ` MUT` 常常不构成可观测差异。旧算子集因为会遍历到下拉选项文本（x02 的 `Bad`）并触发精确 `toHaveText` 断言，才出现 1 次文本杀伤。
- **属性 3/9**：`aria-label` 改写对 `getByLabel` 无效（后者按 `<label>` 文本解析），对 `getByRole` 又因子串匹配仍能命中；只有主 3 缺口使用的 `disabled` 回退算子（阻断点击）才被杀。属性算子当前实现偏弱，属于算子设计问题，不是“用例没语义”。
- **结构 8/9、逻辑 8/9**：移除结果元素/改变状态逻辑会直接造成交互失败或断言不符，杀伤最稳定；唯一未杀是 x03 nodiff——它可执行但根本没加载 `/inbox`，因此对 inbox 源码变异不敏感。

## 5. 与主实验 3 缺口的可比性

### 5.1 能比的

- **旧 2 类算子、diff 臂、n=8 与主实验 n=3 可比**：算子代码逐字一致、生成提示词/模型（DeepSeek）/受控应用/套件/指标定义一致。
- 主 3 缺口在扩展批次内用同一批冻结用例重跑，旧算子 diff 结果与主表**逐缺口一致**：c03 2/3、c13 2/3、c19 2/3，executable / change-relevant / change-sensitive 全为真；主表 diff 平均 0.6667 与本批主 3 子集一致。
- 因此“旧算子 diff 扩展 n=8”可以作为主表同口径的扩样，但仍与主表**分段报告**，不合并 n。

### 5.2 不能比的

- **新 5 类算子表不能与主表直接比**：算子集不同（5 类 vs 2 类）、注入数不同（42 vs 26）、样本构成不同（含 3 个无 testid 新缺口）。
- **新 5 类表内主 3 缺口的重跑行，不能当作主表替换**：它们只用于给 5 类算子提供 n=8；主表 n=3 保持不变。
- **缺口构成不同**：主 3 缺口全部 testid 富集；扩展 5 个中有 3 个无 testid。扩展批的 1.0 语义有效率不能外推为“主缺口总体也会从 0.625 升到 1.0”，它只说明 5 类算子在更宽的信号密度上能检出更多差异。
- **nodiff 臂不可比**：主实验 nodiff 3 条中 1 条可执行；扩展 8 条中 1 条可执行，且扩展的 1 条（x03）与主实验的 1 条（c03）不是同一缺口。比例接近但样本不同，不能合并。
- **统计不合并**：未把 n=3 与 n=8 拼成 n=11 重算任何 p 值、置信区间或 κ；本阶段没有人对标注。

### 5.3 复现性异常：c03 nodiff（需作者知悉）

- 主实验冻结的 c03 nodiff 用例（`rq2_to_annotate.jsonl` 中 `case_id=c1`，解盲为 nodiff，路由 `/coupon`）实际是一个**购物车冒烟用例**：访问 `/#/` → 点击 Cart 链接 → 断言 URL `/cart` → `expect(page.getByText(/Cart/i)).toBeVisible()`。
- 在 c03 版本运行该用例，`getByText(/Cart/i)` 同时命中 3 个元素（`nav-cart`、`cart-title`、`cart-add`），触发 Playwright strict-mode violation，用例失败。
- 本阶段在同一副本上重复运行均失败，因此扩展批次把 c03 nodiff 记为 `executable=false`。
- 但冻结的主实验结果记 c03 nodiff 为 `executable=true`、`killed=2/3`、`change_sensitive=true`；一个只访问购物车的用例不可能杀死 coupon 源码变异，因此该条主实验记录在现环境下**无法复现**。
- 本阶段**没有改动主表或主实验结果**；建议作者在论文引用 nodiff 时加脚注，或在后续单独复核主实验 c03 nodiff 的生成/判分记录。
- c13 / c19 nodiff 在扩展重跑中均为 `executable=false`，与主实验记录一致，异常仅限 c03 nodiff。

### 5.4 环境差异（如实记录）

- 主仓 `package-lock.json` 固定 `@playwright/test 1.61.0`；本次运行使用 **1.54.0 + Chromium build 1181**（国内镜像只提供该 macOS 构建；主 CDN 下载过慢）。`package.json` / `package-lock.json` 未被修改。
- 由于主 3 缺口 diff 的旧算子结果与主表逐条一致，判断该版本差异对旧算子 diff 对照不构成实质影响；但它对 c03 nodiff 异常的归因没有帮助（strict mode 在各版本均存在）。
- 生成侧 provider=`deepseek`，模型 `deepseek-v4-flash`，10 次调用，用量记录在 `llm_usage.jsonl`。

## 6. 需要作者决策的取舍

1. **5 类算子是否照当前实现定稿**：文本 0/9、属性 3/9 的弱杀伤主要来自“只改第一个标题/aria-label + Playwright 子串匹配”，不是用例无语义。可选：(a) 保持现状并在论文解释；(b) 把文本算子改为优先改“结果/状态文本”，属性算子改为改 `<label>` 文本或 `role`，或对 role name 使用精确断言；(c) 只把结构/逻辑两类作为新增主结果，文本/属性作为补充证据。
2. **5-5c 的样本口径**：当前 n=8 含主 3 缺口重跑；也可只报新 5 缺口 n=5，或用 2 个追加缺口扩到 n=10（方案允许 8–10）。n=8 的好处是与 5-5b 同一样本；代价是其中 3 条依赖主实验冻结用例。
3. **c03 nodiff 异常如何处理**：是否在论文主表加脚注、是否单独复核原始生成与判分日志、是否在附录披露“无法复现”。本阶段按约束未改主表。
4. **semantic-valid 定义是否收紧**：主实验与扩展都定义为 `executable ∧ change-sensitive ∧ killed>0`，**不要求 change-relevant**；c03 nodiff 主记录因此可在 `change_relevant=false` 时仍判 semantic=true。若论文口径希望“语义有效”同时要求覆盖变更文件，应统一修改定义并重算（属于主表口径变更，需作者批准）。
5. **是否补人工盲评**：本阶段 5 个新缺口没有人工标注；若要把 5 类算子的杀伤结果升级为“人工验证的语义有效性”，需要另建盲评包。
6. **是否清理/保留扩展工作树**：本报告已把两棵工作树打包为可验证 bundle（见 §7），工作树本身可作为临时构建物删除。

## 7. 产物与边界

### 7.1 本阶段产物（均在 `expansion_20261108/gaps/`）

| 文件 | SHA256 |
|---|---|
| `manifest_expansion.json` | `7a675361d5429eab553a2dafa26584ab4a8672c016491a8f50c7ca47ff320506` |
| `rq1_expansion.json` | `654736a308b917ed03d608de6d8cefa8f709ade97838ff1ffbc34b7b28485e39` |
| `rq2_expansion_results.json` | `615c260cf694b52d614e3e65e0e2e61ef7a48cf693202cac3e7ed444484898d9` |
| `rq2_expansion_mutants.json` | `d93da95f0b5c27fcded5f0c4f34a821375cf0e88fed47fbdd45bf44b0cbbe22f` |
| `rq2_expansion_old.md` | `b7fdd69991a359d3d370f4d7086c33a93734c0f2e8213c8f7d9c64ad4369b3fe` |
| `rq2_expansion_new5.md` | `6b97adcaa019b3be3e2acfb95fcbb7d5ea9b26eff6ba88512e889e81623f4c0c` |

- 复现脚本：`scripts/build_work_exp.mjs`、`scripts/build_work_main_replica.mjs`、`scripts/run_expansion_gaps.mjs`、`scripts/rerun_old_operators.mjs`。
- 历史 bundle：`work_exp.bundle`（x00 09df7e5 … x05 eb57c55）、`work_main_replica.bundle`（c00…c19）；`git bundle verify` 通过，clone 后标签哈希与预注册一致。
- 生成记录：`llm_usage.jsonl`（10 次调用）。

### 7.2 边界声明

- 主表、冻结清单、论文**未改动**。
- 实验后复核 `SHA256SUMS_MAIN_after_kappa_fix.txt`：36/36 `OK`（exit 0）。
- 关键主资产哈希（未变）：
  - 论文：`511a0131b899f4c2b20aa1149866cc9a41a831b37c279c223c7bf04c5558d380`
  - RQ3 主表：`755a8c08a9e65014ec623c555192d540b77b4c355edb051deb0158c4f54ed8d2`
  - RQ2 主表：`fcdf084a17bc317a69e1932ce1f2e46ac248f3bb3209e9a2c5eeebfd8ffa58cf`
  - 主 RQ2 结果 `rq2_results.json`：`3cb697e9913bc69ddfa3a059b3827e5f8ac074f5b45edfc4f09280fd97bc32af`
- 主 `subject/work` 未创建/未修改；`subject/history/manifest.json` 未写入。
- 未开始阶段四；未做人工盲评；未合并两批统计。
