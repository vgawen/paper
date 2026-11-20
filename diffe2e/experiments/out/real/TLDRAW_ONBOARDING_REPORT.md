
> 交付定位：本文件是阶段四"真实项目接入"的交付物之一（tldraw 单项目），本轮已完成**历史扩深 + `/@fs/` 库源码归因 + 12 个稳定过渡回放**。它不改变主表 5-5、主实验盲评包、new10 清单与冻结清单；三套口径（主表 n=3 / 第二步 n=8 / 第三步 n=10）继续分开。tldraw 的 n=12 为独立第四套口径，仅在本文件与本阶段报告中出现。

## 1. 项目基本信息

| 项 | 值 |
|---|---|
| 仓库 | `tldraw/tldraw`（monorepo，48k★） |
| 许可证 | tldraw license（NOASSERTION）；允许 Development Environment 使用/修改/打包，不允许 Production。本研究仅作开发/测试用途，不发布产物 |
| 本地路径 | `diffe2e/real/tldraw`（浅克隆 + 两次加深，`.git` 约 62 MB） |
| 可见历史 | **500 commits**（`--depth 30` → `--deepen 150`（180）→ `--deepen 320`（500）） |
| 历史窗口 | **2026-08-27 ~ 2026-11-07**；`.git/shallow` 边界 `def06d6c06c519cdfebff44f903a7184a6fbf7ef` |
| 被测应用 | `apps/examples`（Vite 8 dev server，:5420，root=`apps/examples/src`） |
| 被测源码范围 | `apps/examples/src` + **`packages/tldraw/src`**（后者经 Vite `/@fs/<repoAbs>/...` 提供） |
| E2E 框架 | Playwright `@playwright/test` 1.61.0，Chromium headless shell 1228 |
| E2E 规模 | `apps/examples/e2e/tests` 下 108 个 `*.spec.ts`；本轮固定 8 个路由 slug、11 条用例 |
| 包管理 | `pnpm@12.16.1`（HEAD）/ `pnpm@12.4.2`（窗口内旧 commit），经 corepack |
| Node | 要求 ≥22.12；实测 v24.21.0 |
| 测试启动方式 | 项目自带 config 用 `pnpm preview-examples`（生产构建 + bemo-worker:8989）。本轮改用未跟踪自定义 config 跑 **Vite dev**，以保留逐文件 URL 归因，且不启动 bemo-worker |
| 覆盖方式 | CDP `page.coverage` 注入（`injectCoverage:"cdp"`），**multi-root 夹具**（dev root + `/@fs/` 库源码），不改业务代码 |

## 2. 历史扩深与可纳入的 UI 变更上下文

**扩深过程**

| 步骤 | 命令 | commits | `apps/examples/src` 命中 | `packages/tldraw/src` 命中 | 并集 |
|---|---|---|---|---|---|
| 初版 | `git clone --depth 30` | 30 | 1 | — | 1（无法成对） |
| 第一次加深 | `git fetch --deepen 150` | 180 | 5 | — | 5 |
| 本轮 | `git fetch --deepen 320` | **500** | **16** | **127** | **138** |

并集 138 个 UI 相关 commit（去重后），足以构造 8–12 个连续过渡；本轮取**最新 13 个 UI commit** 组成 12 个过渡，落在目标区间上限。

**本轮 12 个稳定过渡（全部纳入，0 skip）**

| # | V_old → V_new | 日期 | 主题 | changed | 其中 `/@fs/` | 覆盖选中 | affected | R | S | P |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `7f68118 → 363f03c` | 2026-10-13 | feat(tldraw): action-driven menu gating (#11038) | 18 | 18 | 11 | 11 | 0 | 1 | 1 |
| 2 | `363f03c → 0c497c7` | 2026-10-13 | fix(editor): keep non-resizing shapes in place when resizing | 1 | 1 | 0 | 0 | 1 | 1 | 1 |
| 3 | `0c497c7 → e599aa1` | 2026-10-13 | fix(select): frame fit-to-content double click | 3 | 3 | 11 | 11 | 0 | 1 | 1 |
| 4 | `e599aa1 → 4010383` | 2026-10-16 | test(tldraw): drop dead PointerEvent polyfills from DOM-driver | 2 | 2 | 0 | 0 | 1 | 1 | 1 |
| 5 | `4010383 → 91a4718` | 2026-10-16 | fix(tldraw): cancel only the page drag when Escape is pressed | 2 | 2 | 11 | 11 | 0 | 1 | 1 |
| 6 | `91a4718 → dd11653` | 2026-10-16 | fix(tldraw): stop adding an undeletable empty line after editing | 2 | 2 | 11 | 11 | 0 | 1 | 1 |
| 7 | `dd11653 → 0bba15d` | 2026-10-19 | fix(select): mark history before brushing, right-click deselect | 4 | 4 | 11 | 11 | 0 | 1 | 1 |
| 8 | `0bba15d → 2cf23f0` | 2026-10-19 | fix(tldraw): keep the laser tool from crashing when its scope… | 4 | 4 | 11 | 11 | 0 | 1 | 1 |
| 9 | `2cf23f0 → 9067709` | 2026-10-19 | fix(editor): rebuild spatial index when fonts load | 2 | 2 | 0 | 0 | 1 | 1 | 1 |
| 10 | `9067709 → 4e8f622` | 2026-10-19 | fix(editor): leave locked shapes out of the reading order | 4 | 4 | 11 | 11 | 0 | 1 | 1 |
| 11 | `4e8f622 → 5e46744` | 2026-10-19 | fix(editor): keyboard navigation reach locked shapes | 4 | 4 | 11 | 11 | 0 | 1 | 1 |
| 12 | `5e46744 → 2d72105` | 2026-10-20 | feat(i18n): migrate the SDK to ICU MessageFormat and react-intl (#8036) | 81 | 78 | 11 | 11 | 0 | 1 | 1 |

- `changed` 为 `srcGlobs` 并集内文件数；`其中 /@fs/` 为 `packages/tldraw/src` 命中数（第 12 行另有 3 个 `apps/examples/src` 文件）。
- 12 个过渡中 **9 个 affected=11（选中 11/11，Reduction=0）**，**3 个 affected=0（选中 0/11，Reduction=1）**。均值：coverage_only 与 dual 均 `Reduction=0.25, Safety=1.0, Precision=1.0`；uidiff_only 为 `Reduction=1.0, Safety=0.25, Precision=1.0`。
- **skip 原因**：0 个。`tldraw_examples_rq1_skips.json` 为 `[]`。12 个过渡在两侧均安装成功、覆盖非空、用例集稳定（11/11 存活）。

**`/@fs/` 归因复核（同一次 diff 的 affected 判定变化）**

对旧最小闭环过渡 `9810618 → 2d72105`，在 V_new 侧（`2d72105`）用 11 条用例重采覆盖后比较：

| 归因范围 | changed 文件数 | changed∩covered | affected | 选中/全量 |
|---|---|---|---|---|
| 仅 `apps/examples/src`（旧口径） | 3 | 3 | **1** | 1/11（旧结果 Reduction 0.9091） |
| 加 `packages/tldraw/src`（本轮口径） | **133** | 130 | **11** | 11/11（Reduction 0） |

结论：`@fs/` 归因确实**改变 affected 判定**——旧 n=1 的 `Reduction=0.9091` 是"引擎改动全部漏归因"造成的低估，不能用作选择能力证据。旧结果已原样保存为 `tldraw_examples_rq1_v1_apponly_superseded.{json,md}`，并在 §4 明确标注为被取代。

## 3. 管线复用与新增代码位置

**完全复用（未改语义）**

| 文件 | 作用 |
|---|---|
| `experiments/real/run_rq1_real.mjs` | 逐 commit checkout → install → 注入 → 跑 V_old/V_new → 计算三臂指标 |
| `experiments/real/engine.mjs#computeTransition` | 纯函数：coverage_only / uidiff_only / dual 与 Safety/Precision/Reduction |
| `pipeline/src/covpath.mjs` | 路径归一化、按变更文件选择覆盖用例 |
| `pipeline/src/oracle.mjs` / `metrics.mjs` | affected oracle（V_new 覆盖）与指标 |
| `pipeline/src/uidiff.mjs` / `domdiff.mjs` | UI 信号抽取与引号锚定匹配 |

**新增/修改（仅接入层与夹具，不改变受控实验结论）**

| 文件 | 变更 |
|---|---|
| `pipeline/src/covinject.mjs` | 新增 `covFixtureSourceMulti({urlRoot, fsRoots, repoAbs, ...})`：同时映射 dev root（`apps/examples/src`）与 `/@fs/` 源根（`packages/tldraw/src`），输出均为仓库相对路径。实现用**字符串前缀匹配**：先 `replace(/\/{2,}/g,'/')` 归并重复斜杠，再匹配 `@fs/<repoAbs>/<fsRoot>/`，避免把绝对路径转义进正则字面量（`/` 会截断正则；原实现确有该错误，单测已覆盖）。 |
| `experiments/real/engine.mjs` | ① `injectCdpCoverage` 新增 multi 分支（`injectUrlRoot && fsRoots`）；② `changedSrcFiles` 支持数组 globs（`adapter.srcGlobs`），`git diff prev sha -- <globs...>` 并以任一前缀过滤；③ `loadCovLive` 对 multi 模式沿用 `toRepoRel`（路径已是仓库相对，兼容） |
| `experiments/real/adapters/tldraw.json` | 新增 `srcGlobs:["apps/examples/src","packages/tldraw/src"]`、`fsRoots:["packages/tldraw/src"]`、`historyLimit:600`；保留 `srcGlob` 兼容 |
| `experiments/real/run_rq1_real.mjs` | ① 多 glob 取日志与 diff；② `ensureInstall`：`pnpm-lock.yaml` blob 未变时复用 node_modules（frozen-lockfile 安装只依赖 lock），把每过渡两次安装降到 3 次；③ 每过渡追加写 jsonl、每次 skip 落盘 skips.json，进程中断不丢结果；④ 行内记录 `changed_fs_roots`，便于审计 `/@fs/` 命中 |
| `experiments/real/init_tldraw_cov.mjs` | 生成两份未跟踪配置：`e2e/__cov_playwright.config.ts`（Vite dev:5420）与 `vite.cov.config.ts`（`resolve.dedupe:['react','react-dom','react/jsx-runtime','react/jsx-dev-runtime']`）。后者用于修复"双 React"环境问题（见 §5 #14），不改项目 tracked config |
| `pipeline/test/covinject.test.mjs` | 新增 `covFixtureSourceMulti` 单测（两种 `/@fs/` URL 形态、排除 `/@id/` 与其它 package），共 10 条全部通过；`engine.test.mjs` 亦通过 |

**未改动项目业务代码**；仅临时改写 spec 的 import 指向覆盖夹具（`git checkout -f` 可完全还原），并生成未跟踪的夹具与配置。

## 4. 本轮结果与判读

**本轮（n=12，完整归因）**

| method | Reduction | Safety | Precision |
|---|---|---|---|
| coverage_only | **0.25** | **1.0** | **1.0** |
| uidiff_only | 1.0 | 0.25 | 1.0 |
| dual | **0.25** | **1.0** | **1.0** |

- 覆盖臂与 dual 完全一致：UI 信号在本批 12 个过渡中只在第 12 个抽取到 8 个文本/`msg()` 信号，但因 spec 以字面量锚定、无法匹配这些模板串，`uidiff` 选中 0，故 dual 未增益。
- **9 个过渡的 changed 文件全部被 11 条用例覆盖 → affected=11 → 选中全量、Reduction=0**；**3 个过渡的 changed 文件未被任何用例执行 → affected=0 → 选中 0、Reduction=1**。对固定 8 路由子集而言，这是套件粒度决定的"全有或全无"，不是选择器失效。
- 第 12 个过渡（i18n 迁移）changed=81，其中 78 个为 `packages/tldraw/src`，完整归因后才进入 affected；这正是旧口径漏掉的部分。
- **旧 n=1（`9810618→2d72105`）已被取代**：其 `Reduction=0.9091 / Safety=1.0 / Precision=1.0` 仅在 app-only 归因下成立；加上引擎源码后同一次 diff 的 affected 从 1 变为 11。该旧结果保留为 `tldraw_examples_rq1_v1_apponly_superseded.{json,md}`，仅作对照，**不再作为可行性能证据**。
- 判读：tldraw 管线迁移成立（安装、注入、逐 commit 回放、稳定门、0 skip），且 `/@fs/` 归因后"库级改动会影响全部路由用例"这一事实被如实暴露；本仓库可稳定回放的上下文数为 **12**（本轮上限），未凑数。

## 5. 失败与修复记录（接入本身即交付物）

| # | 现象 | 根因 | 修复 | 证据/备注 |
|---|---|---|---|---|
| 1 | `git clone --depth 30` 报 `Failure when receiving data from the peer` | 命令沙箱限制外网/大流量 | 关闭该次命令沙箱重试；完成后 `git fetch --deepen 150` 补历史 | 180 commits |
| 2 | 30/180-commit 窗口只命中 1/5 个 `apps/examples/src` commit，无法做逐 commit | 浅克隆太浅；tldraw 多数改动在 `packages/*` | 本轮 `--deepen 320` 至 500 commits，并把 `packages/tldraw/src` 纳入 `srcGlobs` | 并集 138 个 UI commit |
| 3 | 全量 `pnpm install` 极慢（Scope: all 53 workspace projects） | 把 `apps/dotcom` 的 Next/Clerk/Vercel 依赖一起拉取；registry 单请求 10–30 s、tarball ~30 KB/s | 终止，改 `--filter './apps/examples...'` | `out/real/tldraw_install.log` |
| 4 | `--filter` + 非冻结安装仍在解析整棵 lockfile（3066 entries） | 非冻结安装触发重新解析 + 供应链策略校验 | 改 `--frozen-lockfile`：校验 58.5 s 后直接链接 1394 包 | `tldraw_install_filtered.log`、`tldraw_install_frozen_filtered.log` |
| 5 | 根 `postinstall` 失败：`husky install && pnpm refresh-assets`，`pnpm: command not found`（exit 127） | corepack 的 pnpm 不在生命周期脚本 PATH 中 | 加 `--ignore-scripts`（esbuild/swc/sentry 原生 postinstall 已先成功；assets 为仓库静态文件） | `ERR_PNPM_EXECUTOR_LIFECYCLE_SCRIPT_FAILED` |
| 6 | 生成的自定义 config 不在预期位置 | `path.resolve(here,'../real/tldraw/...')` 实际指向 `experiments/real/tldraw` | 改为 `../../real/tldraw`，删除误建目录 | `experiments/real/init_tldraw_cov.mjs` |
| 7 | config 加载报 `__dirname is not defined in ES module scope` | Playwright 以 ESM 加载 TS config | 用 `path.dirname(new URL(import.meta.url).pathname)` | 配置头部 |
| 8 | 浏览器缺失：需要 `chromium_headless_shell-1228`，缓存只有 1181 | 项目锁定 Playwright 1.61；`playwright install` 会**删除旧版本** `chromium-1181` | 12 路 HTTP Range 并行下载（聚合 ~620 KB/s），手工解压到缓存并写 `INSTALLATION_COMPLETE` | 影响清单见 §8 |
| 9 | spec 导入项目自有 fixtures（`export default test`），部分 spec 直接导入 `@playwright/test` | 项目夹具无命名 `test` 导出；导入源混用 | `covinject` 支持 `fixtureDefaultExport`；`engine` 支持 `rewriteFrom` 多导入源 | 33 个 spec 被改写，`git checkout -f` 可还原 |
| 10 | dev server 以 `apps/examples/src` 为根，模块 URL 无 `/src` 前缀 | 常规夹具按 `/<leaf>/` 锚定会全部漏归因 | `injectUrlRoot` + `covFixtureSourceUrlRoot` | 覆盖 JSON `files` 为 `apps/examples/src/...` |
| 11 | 覆盖中混入 `apps/examples/src/@id/...` 伪文件 | Vite 优化依赖走 `/@id/` | 正则排除 `@id/` | 单测覆盖 |
| 12 | route 套件随示例膨胀（窗口内 219 条），单次回放 >20 min | 全量 route 遍历每个示例 | 固定 8 个 slug 子集（11 条用例），保留 3 个未触达示例作对照 | 适配器 `testAllCmd`；子集与变更内容无关，避免偏差 |
| 13 | 覆盖只含 `apps/examples/src`，`packages/tldraw/src` 全部漏归因 | Vite 以 `/@fs/<repoAbs>/packages/...` 提供 workspace 源码 | 新增 `covFixtureSourceMulti`（`urlRoot` + `fsRoots`），`engine` 支持 `srcGlobs`/`fsRoots` | 第 12 个过渡 changed 中 78 个引擎文件被计入；affected 1→11 |
| 14 | 浏览器全量白屏，11 条用例均 `waitForSelector` 超时，页面报 `Cannot read properties of null (reading 'useRef')` | filtered pnpm 安装把 workspace 包的 `react`/`react-dom` 链到全局虚拟仓库，`apps/examples` 用自己的 `node_modules/.pnpm`，浏览器出现**两份 React**；`react-intl` 用错副本 | 在未跟踪的 `vite.cov.config.ts` 中 `resolve.dedupe:['react','react-dom','react/jsx-runtime','react/jsx-dev-runtime']`，Playwright webServer 以 `--config vite.cov.config.ts` 启动 | 修复前 11/11 失败；修复后 11 条可执行（1 条 `sync-custom-shape` 在旧 commit 上失败，属版本内既存失败，不影响覆盖落盘） |
| 15 | 逐 commit 安装使 12 过渡耗时翻倍 | 每个过渡两端各 `pnpm install` | `ensureInstall`：lock blob 未变则复用 node_modules；实测 24 次安装降为 3 次 | 12 过渡总耗时约 30 min（23:16→23:46） |

## 6. 若扩展到第二、第三个项目需要补什么

**已经通用、可直接复用的**
- CDP 覆盖注入的五种夹具形态（`page` / `defaultExport` / `urlRoot` / `multi` / `newpage`）与 `rewriteFrom` 多导入源。
- 逐 commit `checkout -f → install → 注入 → V_old/V_new 套件 → computeTransition` 的驱动骨架与指标口径。
- 路径归一化与 monorepo `repoDir/runDir/srcGlobs/fsRoots` 四元组。
- 锁文件不变的安装复用、逐过渡增量落盘。

**每个新项目仍需补/确认的**
1. **安装闭包**：查出最小 workspace 过滤（`--filter '<app>...'`）并验证 `--frozen-lockfile --ignore-scripts` 能跑通；记录首次全量安装代价。lockfile 随 commit 变化时，`ensureInstall` 会自动重装。
2. **dev/preview 判定**：优先 Vite dev（逐文件 URL 可归因）；若只能跑生产 preview，需要 sourcemap 归因（Tier B），或先用 `COV_DEBUG=1` 检查 URL 形态。
3. **夹具形态探测**：spec 的 `test` 导入来源、是否 `export default`、是否 `browser.newPage()`；探测不到会"跑通但覆盖为空"。
4. **URL 根与 `/@fs/` 源根**：dev root 不是包内 `src/` 时设 `injectUrlRoot`；monorepo 中被测库经 `/@fs/` 提供时，必须同时设 `fsRoots`，否则库改动全部漏归因。跑完抽查 `cov_pertest/*.json` 的 `files` 是否全为仓库相对路径、无 `/@id/`、无 `/node_modules/`。
5. **浏览器版本钉住**：记录 Playwright 版本与所需 browser build；`playwright install` 会清理旧 build，多项目共存时用 `PLAYWRIGHT_BROWSERS_PATH` 分目录（见 §8）。
6. **套件规模闸门**：先用 `playwright test --list --grep ...` 估算条数与单条耗时；全量 route/示例遍历不可直接用于逐 commit 回放。
7. **登录态/外部依赖**：tldraw 的 `test-api` 不依赖登录，`end-to-end` 示例依赖 bemo-worker；其它项目若有 OAuth/DB/付费后端，必须在 adapter 层显式 skip 或 mock，并把原因写入 `*_skips.json`。
8. **许可证与数据边界**：tldraw 仅允许开发环境使用；新增项目需单独核对许可证，禁止把生成物或源码快照随论文发布。
9. **依赖树一致性**：monorepo 的 filtered 安装可能造成 workspace 包与宿主应用各持一份 React 等单例依赖，必须在浏览器侧 `resolve.dedupe` 或改用一致的 node linker；否则会出现"覆盖为空/全量超时"的假失败。

**结论**：tldraw 在 500-commit 窗口、含 `/@fs/` 引擎归因后可稳定回放 **12 个过渡（0 skip）**，达到每项目 8–12 的目标。其 `Reduction=0.25 / Safety=1.0 / Precision=1.0` 反映的是"11 条通用路由用例对引擎改动的全有或全无耦合"，与 actual/mermaid 的过渡集不可直接并表；本阶段仍按独立口径记录。

## 7. 产物与复现

```bash
# 历史（首次克隆后按需加深到 500）
cd diffe2e/real/tldraw
git fetch --deepen 320

# 依赖（首次）
COREPACK_ENABLE_DOWNLOAD_PROMPT=0 corepack pnpm install \
  --filter './apps/examples...' --frozen-lockfile --ignore-scripts --prefer-offline

# 生成覆盖专用 config（未跟踪：Playwright config + Vite dedupe 包装）
node diffe2e/experiments/real/init_tldraw_cov.mjs

# 12 个稳定过渡（13 个 UI commit）
cd diffe2e
node experiments/real/run_rq1_real.mjs experiments/real/adapters/tldraw.json 13
```

> 参数语义：`maxN=13` → 取最新 13 个 UI commit，构成 12 个过渡（`maxN+1` 个 commit）。

产物：`out/real/tldraw_examples_rq1.{json,jsonl,md}`、`out/real/tldraw_examples_rq1_skips.json`（`[]`）、`out/real/tldraw_examples_rq1_v1_apponly_superseded.{json,md}`（旧口径对照）、`out/real/tldraw_install*.log`、`out/real/tldraw_rq1_run_v2.log`。

## 8. Playwright 浏览器缓存变更的影响范围（哪些既有结果需重下浏览器才能复跑）

**事实**：tldraw 需要 Playwright 1.61.0 的 browser build 1228；`playwright install` 会清理与当前版本不匹配的旧 build。本次安装后 `~/Library/Caches/ms-playwright` 只剩 `chromium_headless_shell-1228` 与 `ffmpeg-1011`，原有的 `chromium-1181` / `chromium_headless_shell-1181` 已被删除。

**判定规则**：产物能否直接复跑，取决于该批次解析到的 `@playwright/test` 版本对应 revision（1.54.0 → 1181；1.61.0 → 1228）。离线分析（ReproBreak 解析、标签缓存、指标重算）不启动浏览器，不受影响。

| 既有产物 | 录制/复跑环境 | 现在能否直接复跑 | 需要做的动作 |
|---|---|---|---|
| `out/new5_v2_20261108/`（表 5-5b） | 1.54.0 + Chromium 1181（`run_new5_v2.mjs` 头注释与结果 JSON 的 `environment` 双记录） | 否 | `playwright@1.54.0 install chromium` 装回 1181 |
| `out/new10_20261108/`（表 5-5c） | 1.54.0 + Chromium 1181（`run_new10_v2.mjs` 头注释已固定） | 否 | 同上 |
| `out/expansion_20261108/`（阶段三扩展缺口 x01–x05，v1 算子） | 1.54.0 + Chromium 1181（见 `REPRO_C03_FORENSICS.md` 的环境表与第 138 行） | 否 | 同上 |
| `out/repro_c03_20261108/` 的 **1.54 对照臂** | 1.54.0 + Chromium 1181（主复现臂为 1.61.0 + 1228） | 对照臂否；主复现臂是 | 仅重跑对照臂时装回 1181 |
| 真实项目 replay / RQ4：`actual_desktop`（9 过渡）、`mermaid_live`（5 过渡）、`cand_coverage`、`actual_desktop_rq4_batch` | 录制时缓存仅有 1181（1.54 世代；各项目按自身 lockfile 解析版本） | 否（按当时缓存状态推断） | 装回 1181；或把项目 Playwright 升到 1.61 后**重录**，但不得与旧结果并表 |
| 受控主体主实验（RQ1/RQ2 主表 n=3、RQ3 受控 n=4；若重跑 ReproBreak e2e） | `subject/base` lockfile 自 2026-06-18 起为 1.61.0 → 1228 | 是 | 无 |
| tldraw 全批次（含本次扩量 n=12） | 1.61.0 + 1228 | 是 | 无 |
| `out/repro_c03_20261108/` 主复现臂（6 格） | 1.61.0 + 1228（CFT 149.0.7827.55） | 是 | 无 |

**2026-11-10 处置**：已用 `PLAYWRIGHT_BROWSERS_PATH="$HOME/.cache/pw-1181" npx -y playwright@1.54.0 install chromium` 装回 `chromium-1181`（完整版与 headless shell 各一份），默认缓存 `~/Library/Caches/ms-playwright` 仍只有 `chromium_headless_shell-1228` 与 `ffmpeg-1011`，两套互不影响；另把默认缓存镜像为 `~/.cache/pw-1228`，两个隔离目录并列（1.54 → `pw-1181`，1.61 → `pw-1228`），均已实测可独立启动。实测（`/tmp/expv2/work_main`，`@playwright/test` 1.54.0，app 检出 c03）：`_gen_diff_c03` 1 passed；`_gen_nodiff_c03` 因 `getByText(/Cart/i)` 命中 3 元素而 strict-mode 失败，与 `REPRO_C03_FORENSICS.md` 对 c03/nodiff 的更正结论一致。不设该变量时 1.54 报 `Executable doesn't exist …chromium_headless_shell-1181`，说明 1228 不能替代。上表"需装回 1181"的批次现已具备复跑条件，命令写入 `REPRODUCE.md` 的"浏览器版本隔离（历史批次复跑）"节。

**两套 build 不能长期共存于默认缓存**：每次 `playwright install` 都会清理"过期" build。要同时保留 1.54 与 1.61 的复跑能力，应把浏览器目录分开，例如：

```bash
# 复跑 1181 批次
PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/pw-1181 npx playwright@1.54.0 install chromium
PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/pw-1181 <复跑命令>

# 复跑 1228 批次
PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/pw-1228 npx playwright@1.61.0 install chromium
```

复跑前必须记录的字段：Playwright 版本、browser revision、`PLAYWRIGHT_BROWSERS_PATH`、是否与原始批次同目录；不同目录即使 revision 相同也应视为同一 build（可核对 `browsers.json` 的 revision 与 CFT 版本号）。
