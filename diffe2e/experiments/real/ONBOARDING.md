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
| actual_desktop | actualbudget/actual（`packages/desktop-client`）| CDP 注入(newpage) | 6 spec | 9 | ✅ **已扩窗复跑**：6 个 spec（command-bar/settings/payees/schedules/transactions/reports）、16 commit 窗口→9 个稳定 transition、0 skip。coverage_only/dual **Safety 1.0、Precision 1.0**，Reduction 0.111（多数过渡改动核心/共享文件→覆盖选全 34 用例）。**uidiff 臂成功激活**：commit `19cea1a`（schedule 金额改 ± 符号、testId `date`）经 POM 导入闭包映射选中 32 用例，**uidiff_only Precision 1.0**。见 `out/real/actual_desktop_rq1.{md,json,jsonl}`。 |
| mermaid_live | mermaid-js/mermaid-live-editor | CDP 注入(page) | 7 spec | 5 | ✅ **第二个真实项目跑通**：5 个稳定 transition、0 skip。coverage_only/dual：**Safety 1.0、Precision 1.0**，但 **Reduction 0**——SvelteKit 小型 SPA，编辑器核心组件几乎被每个用例加载，覆盖选择无法缩减（覆盖法在"强耦合核心"应用上的固有局限，诚实记录）。uidiff_only 5 次均 0 信号（diff 未触及 testId/可见文本锚点，该项目 testid 稀疏）。验证了 `page` 注入模式 + 自有 `./test` 夹具导入改写 + `.svelte` 扩展归因。见 `out/real/mermaid_live_rq1.{md,json,jsonl}`。 |

> **RQ1 真实数据结论（实测）**：已达成 ≥2 个真实多 commit 项目的外部效度目标（actual_desktop 9 + mermaid_live 5 = 14 个稳定过渡，dual 均 Safety 1.0、Precision 1.0）。覆盖选择的缩减取决于应用的覆盖耦合度：本次 actual 6-spec 窗口多数过渡改动核心文件→Reduction 0.111，mermaid 强耦合 SPA→0。**uidiff 臂在真实数据上验证为稀疏触发、高精度的互补信号**（actual 9 过渡中 1 个激活、Precision 1.0），与受控主体"覆盖为安全主干、UI 信号补精度"的结论一致。cand_coverage 通过可插桩闸门但无可 replay 源码史，已弃。

## 通用 CDP 覆盖注入（已实现，解锁真实项目的关键）

`run_rq1_real.mjs` 原本只支持自带 istanbul 逐用例覆盖的项目（极少）。现已实现**通用 CDP 注入**（`pipeline/src/covinject.mjs` + `engine.mjs#injectCdpCoverage`，纯函数有单测 `pipeline/test/covinject.test.mjs`）：用 Playwright fixture 包裹 `page.coverage`（CDP V8）对**任意**被测 JS 收集逐用例覆盖，**不改动项目业务代码**。

- adapter 设 `injectCoverage:"cdp"` + `injectDir`（放夹具的 spec 目录，默认取 `specGlob`）。两种 `injectMode`：
  - 默认（`page`）：spec 用 test-scoped `page` fixture。其导入源由 `fixtureImport` 指定（默认 `@playwright/test`；若项目用自有夹具如 `./test`，设 `fixtureImport:"./test"`）→ 夹具 `export *` 重导出该源（带其 `expect`/自定义 fixture 如 `editPage`）、仅覆写 `page` fixture，并改写 spec 导入指向 `__cov_fixtures`。
  - `newpage`：spec 从自有 fixtures（`fixtureImport`，默认 `./fixtures`）导入 `test`、且用 `browser.newPage()` 自建页面 → 夹具再 extend 其 `test`，包 `browser.newPage`（创建即 `startJSCoverage`）并**包 `page.close` 在关闭前收集**（关键：项目常在 `afterEach` 关页，晚于 fixture teardown 会丢覆盖）。
- monorepo：`repoDir`=仓库根（git diff/`git show` 走根相对路径），`runDir`=子包（安装/测试/注入 cwd），`srcGlob` 用根相对（如 `packages/desktop-client/src`）。
- replay 每次 `checkout+install` 后自动重注（checkout 会还原 tracked spec）。
- 仍用**项目自己的 `playwright.config`**（保留其 `webServer`/`baseURL`/projects），`testAllCmd` 即项目正常的 e2e 命令加 `COV_OUT=...`。
- 路径命名空间：夹具写"源根相对"路径（如 `src/a.tsx`），`loadCovLive` 用 `mapLeafRelToRepoRel` 拼上 `srcGlob` 前缀（monorepo→`packages/x/src/a.tsx`），与 `git diff` 同域。
- 文件归因：URL 锚定 **dev-server 源根**（`origin + /src/**`），自动排除 `/@fs/` 跨包源、`/node_modules`、`/.vite/deps`。源扩展支持 `js/jsx/ts/tsx/mjs/cjs/svelte/vue`（SvelteKit/Vue SFC 在 dev 下 URL 仍是 `/src/**.svelte` 可直接归因）。优先选跑 **Vite dev** 的项目；跑生产构建/preview 的需 sourcemap，归因更粗，作 Tier B。`COV_DEBUG=1` 会把前 60 个 URL 转储到 `<COV_OUT>/_urls.json` 便于排查。
- 限制：仅 Chromium 有 `page.coverage`（adapter 只跑 chromium）。

## UI 信号（uidiff 臂）在真实项目的激活

真实前向开发里 testId/可见文本大多稳定（新功能多为 ADD），故 uidiff 臂自然较少"选中"。为定位能激活的过渡并避免盲跑长 replay，提供离线扫描器 `scan_ui.mjs`：

- `node experiments/real/scan_ui.mjs <adapter>.json [N]` —— 对最近 N 个触碰 `srcGlob` 的过渡，用**与驱动同款**的 `semanticDiffNodes`/`selectByDomDiff` 计算每个过渡的 UI 信号数与"会选中的测试数"，不安装、不跑测试，秒级给出可激活窗口。

为让 uidiff 在真实工程上能正确激活，本批做了三处工程化改进（均有单测、不改变受控实验结论）：

1. **抽取器纳入设计系统组件**：不再只认原生标签，凡带 `data-testid/testID/aria-label/role/name/href/title/placeholder` 的任意 JSX 元素都纳入（`pipeline/src/uidiff.mjs`）。actual 用 `<Button>/<TapField>/<View>` 等自定义组件，旧规则会全部漏掉。
2. **可见文本去噪**：`directText` 只折叠类文本表达式（`{t('x')}`/`{label}`，无内嵌 `<`、长度 ≤60），不再把嵌套子元素树序列化成超长"文本"锚值。
3. **引号锚定匹配 + POM 导入闭包**：`selectByDomDiff` 要求信号以 `'x'`/`"x"`/`` `x` `` 出现（消除 `date`→`update` 误匹配）；驱动对 spec 做 1–2 层本地导入展开（`run_rq1_real.mjs#specBundle`），把 `page-models/*` 源码并入匹配，避免页面对象间接层导致的漏选。

> 实测：actual 最近 150 过渡中，仅 `19cea1a`（"schedule 金额改 ± 符号"）产生可被 spec 引用的变更锚点（testId `date`，经 POM 闭包映射到 9 个 spec）——印证 uidiff 臂是**精度/安全互补**的稀疏触发信号，覆盖臂仍为安全主干。

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
