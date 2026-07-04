# ReproBreak 端到端修复（无信息泄漏）

> 数据：ReproBreak 执行验证子集（`data/ReproBreak.db`），经 `reprobreak_db.mjs` 导出
> **449** 条 validated locator break，跨 4 个真实开源项目（Cypress 258 / Playwright 191）。
> 评估：`reprobreak_e2e.mjs`，每条断裂在其 commit C（父 C-1）上端到端修复并与 ground-truth
> `new_locator` 做归一化 exact-match。

## 无信息泄漏保证
- **允许输入**：旧（断裂）测试文件（C-1，含 `old_locator`）+ 应用源码 C-1→C 的 diff（**已排除测试文件**）。
- **仅评估、绝不入输入**：新测试文件（C）与 ground-truth `new_locator`。
- 代码护栏：旧测试必须含 `old_locator` 且**不得**已含 `new_locator`，否则跳过。本次 **35/449 被跳过**（结构变更不在该 commit 的可见测试中，或旧测试已含答案）。

## 结果（provider=deepseek）
| 指标 | 值 |
|---|---|
| 进入评估 n | 414（跳过 35） |
| **规则臂端到端 exact-match** | **14/414 = 3.38%** |
| **LLM 臂端到端 exact-match** | **23/414 = 5.56%** |
| 有 app 信号子集（appFiles>0） | 14/393 = 3.56%（规则臂） |
| LLM 调用错误 | 0 |

### 分项目
| 项目 | n | 规则臂命中 | LLM 臂命中 | 有 app 信号 |
|---|---|---|---|---|
| ghiscoding/angular-slickgrid | 245 | 0 | 1 | 244 |
| tryghost/koenig | 78 | 7 | 2 | 61 |
| nasa/openmct | 46 | 6 | 6 | 44 |
| microsoft/playwright | 45 | 1 | 14 | 44 |

## 关键对比与结论
| 设定 | 修复率 | 含义 |
|---|---|---|
| 离线 CSV（已知 oracle 信号 oldValue→newValue，见 `reprobreak.md` E3） | 99.3%（574/578） | 改写**机制**在真实 Playwright/Cypress 语法上正确 |
| **端到端规则臂（仅旧测试 + 应用 diff，无 oracle 信号）** | **3.38%（14/414）** | 从 diff **还原信号**才是真正难点；纯确定性规则在端到端无泄漏设定下几乎无效 |
| **端到端 LLM 臂（DeepSeek，同样无 oracle 信号）** | **5.56%（23/414）** | LLM 有增益，但 exact-match 仍很低；真实难点在于从应用 diff 中恢复可验证定位信号 |

**论证**：确定性改写器在「已知信号」时近乎完美（99.3%），但端到端「从应用 diff 自行推断 old→new 信号」时规则臂仅 3.38%，DeepSeek LLM 臂提升到 5.56%，仍远低于已知信号上界。这说明 LLM 的确带来一定增益，尤其在 microsoft/playwright 子集（14/45）更明显；但整体 exact-match 修复率仍低，信号检测与上下文构造仍是主要瓶颈。

## 复现
```bash
cd diffe2e
node realproj/reprobreak_db.mjs                                   # 导出 449 条 -> reprobreak_breaks.json
RB_LIMIT=449 node realproj/reprobreak_e2e.mjs                     # 规则臂端到端
RB_LIMIT=449 DEEPSEEK_API_KEY=*** node realproj/reprobreak_e2e.mjs # 加 LLM 臂
```
> AUT 仓库克隆到 `realproj/clones/aut/`（已 gitignore，~202MB，blob:none 部分克隆）。
