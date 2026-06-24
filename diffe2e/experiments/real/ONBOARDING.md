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
| actual_desktop | actualbudget/actual（`packages/desktop-client`）| CDP 注入(newpage) | ~34 | 进行中 | **覆盖注入已实测通过**：`yarn install` 1m41s 成功；`yarn start`（Vite dev :3001）由 webServer 自动起，2 用例 26.8s 通过；CDP `newpage` 夹具按 `packages/desktop-client/src/**` 正确归因逐用例覆盖。adapter=`adapters/actual_desktop.json`。下一步：跑多 commit replay（`run_rq1_real.mjs`）。 |

> **RQ1 真实数据结论（实测）**：cand_coverage 通过可插桩闸门，但**无可 replay 的源码历史**。需另接 ≥2 个有真实多 commit 源码演化、且能逐 commit 干净安装的 Playwright 项目（候选见下「候选清单」）。

## 通用 CDP 覆盖注入（已实现，解锁真实项目的关键）

`run_rq1_real.mjs` 原本只支持自带 istanbul 逐用例覆盖的项目（极少）。现已实现**通用 CDP 注入**（`pipeline/src/covinject.mjs` + `engine.mjs#injectCdpCoverage`，纯函数有单测 `pipeline/test/covinject.test.mjs`）：用 Playwright fixture 包裹 `page.coverage`（CDP V8）对**任意**被测 JS 收集逐用例覆盖，**不改动项目业务代码**。

- adapter 设 `injectCoverage:"cdp"` + `injectDir`（放夹具的 spec 目录，默认取 `specGlob`）。两种 `injectMode`：
  - 默认（`page`）：spec 从 `@playwright/test` 导入、用 test-scoped `page` fixture → 改写导入为 `__cov_fixtures` 并包 `page` fixture。
  - `newpage`：spec 从自有 fixtures（`fixtureImport`，默认 `./fixtures`）导入 `test`、且用 `browser.newPage()` 自建页面 → 夹具再 extend 其 `test`，包 `browser.newPage`（创建即 `startJSCoverage`）并**包 `page.close` 在关闭前收集**（关键：项目常在 `afterEach` 关页，晚于 fixture teardown 会丢覆盖）。
- monorepo：`repoDir`=仓库根（git diff/`git show` 走根相对路径），`runDir`=子包（安装/测试/注入 cwd），`srcGlob` 用根相对（如 `packages/desktop-client/src`）。
- replay 每次 `checkout+install` 后自动重注（checkout 会还原 tracked spec）。
- 仍用**项目自己的 `playwright.config`**（保留其 `webServer`/`baseURL`/projects），`testAllCmd` 即项目正常的 e2e 命令加 `COV_OUT=...`。
- 路径命名空间：夹具写"源根相对"路径（如 `src/a.tsx`），`loadCovLive` 用 `mapLeafRelToRepoRel` 拼上 `srcGlob` 前缀（monorepo→`packages/x/src/a.tsx`），与 `git diff` 同域。
- 文件归因：URL 锚定 **dev-server 源根**（`origin + /src/**`），自动排除 `/@fs/` 跨包源、`/node_modules`、`/.vite/deps`。优先选跑 **Vite dev** 的项目；跑生产构建/preview 的需 sourcemap，归因更粗，作 Tier B。`COV_DEBUG=1` 会把前 60 个 URL 转储到 `<COV_OUT>/_urls.json` 便于排查。
- 限制：仅 Chromium 有 `page.coverage`（adapter 只跑 chromium）。

## 候选清单（GitHub API 实测，2026-06）

评分沿用上方 8 分制；「前端可独立跑」= E2E 经 Playwright `webServer` 自动起、无需外部 DB/付费后端。

| 候选 | 仓库 | ⭐ | 许可证 | pw 配置 | E2E spec~ | 前端可独立跑 | 估分 | 主要风险 |
|---|---|---|---|---|---|---|---|---|
| **actual-desktop** ✅已实测 | `actualbudget/actual`（`packages/desktop-client`）| 27k | MIT | ✓ | ~34 | ✓ 本地优先 SPA(Vite dev :3001) | 7 | 已验证安装/起服务/覆盖注入；e2e 含较多 VRT 截图测试（非 VRT 运行下截图断言被跳过，不影响覆盖）；yarn4，需 corepack |
| **tldraw-examples** | `tldraw/tldraw`（`apps/examples/e2e`）| 48k | 自定义(NOASSERTION) | ✓ | ~51 | △ webServer=`yarn preview`(**生产构建**:5420) | 6 (Tier B) | 实测 e2e 跑 preview 构建（非 dev）→ CDP 为打包 chunk，需 sourcemap 才能逐文件归因；画布为主、DOM testid 偏少；自定义许可证 |
| bruno | `usebruno/bruno` | 45k | MIT | ✓ | ~250 | △ Electron | 5 | Electron 内 CDP 覆盖更复杂，归因难 |
| documenso | `documenso/documenso` | 13k | AGPL-3.0 | ✓ | ~104 | ✗ 需 Postgres+Next | 4(B) | 重后端、逐 commit 起服务/安装成本高；AGPL |
| cal.com | `calcom/cal.com` | 45k | MIT | ✓ | ~66 | ✗ 需 DB+auth+多 env | 4(B) | 重后端、env 多；历史丰富可作拉伸目标 |
| twenty | `twentyhq/twenty` | 51k | 自定义 | ✓ | ~806 | ✗ 需 Postgres+Redis+server | 4(B) | 重后端；spec 极多但起栈复杂；自定义许可证 |
| immich / mealie / windmill | — | — | AGPL | ✓ | 1–4 | ✗ | <5 | E2E 极少且需全栈，RQ1 不合适 |
| excalidraw | `excalidraw/excalidraw` | 126k | MIT | ✗(无 Playwright) | 0 | — | — | 不用 Playwright，排除 |

### 推荐首批接入（≥2 个，按优先级）

1. **actual-desktop**（首选）：MIT、本地优先 SPA、`webServer` 自动起、34 spec、历史活跃 → 最可能逐 commit 干净跑通。
2. **tldraw-examples**（次选）：纯客户端、Vite dev（CDP 归因最干净）、51 spec → 覆盖采集最顺；仅需确认自定义许可证下的研究使用与画布场景的 testid 密度。
3. 拉伸（Tier B，配 docker-compose 才接）：**cal.com** 或 **documenso**，用于展示带后端的真实场景。

### adapter 草案（注入式覆盖）

实测可用的 adapter（`adapters/actual_desktop.json`）：

```jsonc
{
  "name": "actual_desktop",
  "repoDir": "../../real/actual",                 // git 根（diff/show 根相对）
  "runDir": "packages/desktop-client",            // 安装/测试/注入 cwd
  "srcGlob": "packages/desktop-client/src",       // 根相对，用于 git diff & 覆盖命名空间
  "specGlob": "e2e",
  "installCmd": "COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack yarn install",
  "injectCoverage": "cdp",
  "injectMode": "newpage",                        // 自有 fixtures + browser.newPage
  "fixtureImport": "./fixtures",
  "covRel": "cov_pertest",
  "testOneCmd": "COV_OUT=cov_pertest COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack yarn playwright test --browser=chromium --workers=1 {spec}",
  "testAllCmd": "COV_OUT=cov_pertest COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack yarn playwright test --browser=chromium --workers=2 command-bar.test.ts settings.test.ts payees.test.ts"
}
```

> `testAllCmd` 先限定 3 个较轻、非 mobile/非 VRT 的 spec 以控制首个 replay 时长；验证管线后可放开。

### 每个候选的接入检查单

- [ ] 浅克隆→`git fetch --unshallow`，确认近 1 年 ≥20 个改动到 `srcGlob` 的 commit。
- [ ] 选最近 ~30–50 commit 的密集窗口（降低旧 commit 安装漂移）。
- [ ] 锁定 Node 版本（`.nvmrc`/`engines`）与包管理器（npm/pnpm/yarn）。
- [ ] 注入 CDP `baseFixtures` + 覆盖型 `pw.cov.config.ts`，本地跑通 ≥1 个 spec 并确认 `cov_pertest/*.json` 非空、`files` 能映射到 `src/**`。
- [ ] 抽查源码 `data-testid`/role/text 密度（Semantic UI Diff 信号是否充足）。
- [ ] `node experiments/real/run_rq1_real.mjs adapters/<name>.json 15`，记录 included/skip 及原因。
- [ ] 达标下限：每项目 dual 满足 Safety≥0.95、Reduction≥0.30、Precision≥0.50；未达标如实归因。
- [ ] 登记到上方「已接入」表 + 写 `out/real/<name>_rq1*.{jsonl,json,md}`。
