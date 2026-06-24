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
| cand_coverage | mxschmitt/playwright-test-coverage | istanbul | 3 | 0 | **replay 不可行**：unshallow 后全仓 12 commit，仅 2 个动过 `src/`（初始 + Vite 迁移）→ 唯一过渡且 `npm ci` 在旧 commit 失败（`install_failed_vnew`，见 `out/real/cand_coverage_rq1_skips.json`）。该仓是演示项目、无源码演化史，不适合 RQ1 replay。 |

> **RQ1 真实数据结论（实测）**：cand_coverage 通过可插桩闸门，但**无可 replay 的源码历史**。需另接 ≥2 个有真实多 commit 源码演化、且能逐 commit 干净安装的 Playwright 项目（候选见 E2EGit 数据集 framework=Playwright 子集）。
