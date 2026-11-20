# c03 复现异常取证（第一步）

生成时间：2026-11-08
结论一句话：**环境已钉住且其余 5 个受控执行格逐格复现；仅 c03/nodiff 这一格无法复现，判定为主表该记录格存在问题，不是环境未固定。**

---

## 1. 取证对象

| 项目 | 内容 |
|---|---|
| 冻结用例 | `experiments/out/rq2_to_annotate.jsonl` 中 `case_id=c1`（unblind 为 nodiff；route `/coupon`） |
| 冻结 spec SHA256（文件级） | `4ee05326…75f5`（整份 jsonl） |
| 主表记录 | `experiments/out/rq2_results.json` / `aggregate.json` 中 c03 nodiff：`executable=true, change_relevant=false, mutants=3, killed=2, change_sensitive=true, semantic_auto=true` |
| 受控历史 | `subject/base` 同源历史 c00–c19；c03=`0ddfb1a`（主 manifest），c02 为 V_old |
| 复现工作树 | 由 `work_main_replica.bundle` 克隆（bundle SHA256 `1c99b460…6b61e`） |

冻结 spec 原文（关键断言）：

```ts
test('smoke test: navigate to cart', async ({ page }) => {
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible();
  await page.getByRole('link', { name: /Cart/i }).click();
  await expect(page).toHaveURL(/\/cart/);
  await expect(page.getByText(/Cart/i)).toBeVisible();   // ← 失败点
});
```

---

## 2. 当时 vs 现在：环境差异核查

| 维度 | 当时（5339f78，2026-07-04 主实验提交） | 现在（本次取证） | 是否构成差异 |
|---|---|---|---|
| Playwright | lockfile 1.61.0 / playwright-core 1.61.0 | 同一 lockfile；钉住安装 1.61.0 | 否 |
| lockfile | `subject/base/package-lock.json` 自 2026-06-18 起即为 1.61.0（`git log` 仅一次变更） | 同 | 否 |
| 浏览器 | 1.61.0 的 `browsers.json` 要求 chromium revision **1228** | 使用 Chrome for Testing **149.0.7827.55**（build 1228，arm64） | 否（同一构建） |
| 运行时 | Node 24.x / macOS / arm64（无法从产物取证） | Node v24.21.0 / npm 11.19.0 / macOS 14.1.1 / arm64 | 未发现可观测差异 |
| fixture / 种子数据 | `tests/fixtures.ts` 只做 per-test JS coverage 记录；无种子数据 | 同 | 否 |
| 登录态 / localStorage | 无任何 localStorage/sessionStorage 初始化；login 为无持久化表单流 | 同 | 否 |
| divider 数量 / 页面结构 | 无 divider；导航固定 6 项；c03 购物车页 `/Cart/i` 命中 **3** 个元素（`nav-cart`、`cart-title`="Your Cart"、`cart-add`="Add to cart"） | 同（错误信息逐字一致） | 否 |
| 历史内容 | `subject/history/seed.mjs` 与 5339f78 逐字节相同；用当前 seed 重建的 c03 与复现副本逐文件比对 **20/20 blob 相同**（树级仅多 `.gitignore`、少 `node_modules` 符号链接） | 同 | 否 |

补充：`build_work_main_replica.mjs` 只复制 `app/tests/playwright.config.ts/package.json`（第 96 行），**未复制 package-lock.json**；这是副本卫生问题，不影响本次结论（本次已手工补入 lockfile 后 `npm ci`）。另 `playwright.config.ts` 使用 `reuseExistingServer: true`，存在复用 5181 端口旧服务的残余不确定性；本次重跑未发现服务串扰（每次均校验覆盖率文件与页面元素）。

---

## 3. 钉住环境重跑（同一冻结 spec，逐格）

命令：在复现树内 `COV_OUT=... PW_JSON=... ./node_modules/.bin/playwright test <spec> --config=playwright.pinned.config.ts`，配置只额外设置 `launchOptions.executablePath` 指向 CFT 149。

| 格 | case | 主表记录 | 钉住环境复现 | 判定 |
|---|---|---|---|---|
| c03 diff | c0 | exec=T, rel=T, killed=2/3, sens=T | **完全一致** | 复现 |
| **c03 nodiff** | **c1** | **exec=T, rel=F, killed=2/3, sens=T** | **exec=F, rel=F, killed=0/0, sens=F** | **不一致** |
| c13 diff | c2 | exec=T, rel=T, killed=2/3, sens=T | 完全一致 | 复现 |
| c13 nodiff | c3 | exec=F, rel=F, 0/0, sens=F | 完全一致 | 复现 |
| c19 diff | c4 | exec=T, rel=T, killed=2/3, sens=T | 完全一致 | 复现 |
| c19 nodiff | c5 | exec=F, rel=F, 0/0, sens=F | 完全一致 | 复现 |

c03 nodiff 的实际失败（1.61.0 + CFT 149）：

```
Error: strict mode violation: getByText(/Cart/i) resolved to 3 elements:
  1) <a href="#/cart" data-testid="nav-cart">Cart</a>
  2) <h1 data-testid="cart-title">Your Cart</h1>
  3) <button data-testid="cart-add">Add to cart</button>
1 failed
```

同一 spec 在 V_old（c02）上以**完全相同**的 strict-mode 报错失败。覆盖率文件为 `src/cart.js, src/home.js, src/main.js, src/util.js`，**不含 `src/coupon.js`**。

版本无关性对照：另用 Playwright **1.54.0 + Chromium 1181**（阶段三环境）重跑 c03，同样 strict-mode 失败，说明不是浏览器/Playwright 版本差异。

---

## 4. 判定：主表该格存在问题（并非环境未固定）

c03 nodiff 记录与冻结 spec 存在**内部矛盾**，且无法由任何可钉住环境产生：

1. `executable=true` 与冻结 spec 在 c03、c02 上均 strict-mode 失败矛盾（本复现两版环境均失败）。
2. `killed=2/3` 需要一个真正执行 `src/coupon.js` 的用例；冻结 spec 覆盖率不含 `coupon.js`，不可能杀掉 coupon 变异。
3. `change_sensitive=true` 需要“V_new 过 / V_old 失败”；冻结 spec 在 V_old（c02）以同一报错失败，不构成敏感。
4. 该格三项指标（exec/killed/sens）与同缺口 diff 臂逐项相同，但 `change_relevant` 又为 false —— 更像结果装配/旧报告残留的归因错误，而不是真实执行结果。

因此按用户口径进入第二分支：**主表该格存在问题**。不改主表、不改冻结清单、不改论文；改动建议见下。

### 改前 / 改后（仅建议，未执行）

单元格（`rq2_results.json` 与 `aggregate.json` 的 c03 nodiff 行）：

| 字段 | 改前 | 改后 |
|---|---|---|
| executable | true | false |
| change_relevant | false | false |
| mutants / killed | 3 / 2 | 0 / 0 |
| mutation_score | 0.6667 | 0 |
| change_sensitive | true | false |
| semantic_auto | true | false |

nodiff 臂汇总（n=3）：

| 指标 | 改前 | 改后 |
|---|---|---|
| executable-rate | 0.3333 | 0.0 |
| change-relevant-rate | 0.0 | 0.0 |
| 变异杀伤均值 | 0.2222 | 0.0 |
| 版本敏感率 | 0.3333 | 0.0 |
| 自动语义有效率 | 0.3333 | 0.0 |

diff 臂不变：1.0 / 1.0 / 0.6667 / 1.0 / 1.0。

### 需要改动的论文/产物位置（先不改）

| 位置 | 现内容 | 建议 |
|---|---|---|
| 论文 §5.2 表 5-5 第 356 行（nodiff 行） | `0.3333 \| 0.0 \| 0.2222 \| 0.3333 \| 0.3333` | 改为 `0.0 \| 0.0 \| 0.0 \| 0.0 \| 0.0` |
| 论文 §5.2 第 358 行正文 | “无 diff 基线仅 **1/3** 可执行，且 0/3 触达变更文件” | 改为 “无 diff 基线 **0/3** 可执行，且 0/3 触达变更文件” |
| 论文 §6 结论效度（第 6 章相关句） | 若引用 nodiff=0.3333 需同步 | 改为 0.0，并注明单格更正 |
| 论文 §5.2 第 360 行 / 局限 | 已提示“可执行率可能受环境与时序影响” | 增加一句：c03/nodiff 一格经钉住环境复核更正；其余 5 格逐格复现 |
| `experiments/out/rq2_results.json`、`rq2_results.md`、`aggregate.json` 的 rq2 段 | 上述旧值 | 若作者批准，按上表更正并重算 summary（本次未改） |
| `docs/THESIS_MAPPING.md` 第 29 行（表 5-5 来源映射） | 指向 rq2_results | 更正后保持指向，备注“已复核” |
| `总体任务与进度跟踪.md` 第 94、182 行；`质量对比评估报告…md` 第 326 行 | “nodiff=0.3333 / 仅 1/3 可执行” | 同步口径（内部文档，非论文正文） |

---

## 5. 其他“69 条”同类风险审查

口径核对：主实验 70 条 = RQ2 真实项目 30 条（`rq2_real_to_annotate.csv`）+ RQ3 40 条（`rq3_reprobreak_to_annotate.csv`）。受控主体的 6 个执行格不在这 70 条内，但按指令已全部重跑（上表）。

| 类别 | 数量 | 是否有执行/自动指标格 | 同类风险 | 核查结果 |
|---|---|---|---|---|
| RQ2 受控 nodiff（c03/c13/c19） | 3 | 是 | 高 | c13/c19 复现；c03 异常（本报告） |
| RQ2 受控 diff（c03/c13/c19） | 3 | 是 | 中 | 3/3 逐项复现 |
| RQ2 真实项目 | 30 | **否**（仅生成 + 人工盲评，`run_rq2_real.mjs` 不执行测试） | 无同类执行风险 | 静态扫描：22 条无歧义定位；8 条显式 `.first()/nth` 消歧；3 条潜在 strict-mode 风险（`rq2_002` `locator('text=…')`、`rq2_024` `getByRole` 无 `.first()`、`rq2_026` `click('text=…')`）。若未来把这些 spec 纳入执行，需先做唯一性复核。 |
| RQ3 | 40 | **否**（人工分类标签，无执行格） | 不适用 | 无同类风险 |
| 阶段三扩展缺口（x01–x05） | 8 格×2 臂 | 是（独立批次） | 中 | 当时已在 1.54.0+1181 下运行，且旧/新算子逐条结果与报告一致；本次未并表 |

残余环境风险（建议写入运行要求，不涉及本次改表）：
- 复现树必须带 `package-lock.json` 并执行 `npm ci`（当前 `build_work_main_replica.mjs` 未复制 lockfile）。
- 浏览器必须钉住 chromium 1228（CFT `149.0.7827.55`），或显式 `launchOptions.executablePath`。
- `reuseExistingServer: true` 建议在正式复现时改为 `false`，避免 5181 端口复用旧服务。

---

## 6. 证据与哈希

| 文件 | SHA256 |
|---|---|
| `experiments/out/rq2_to_annotate.jsonl` | `4ee0532626dafd8fe4fce6631b0756a11e8e30eb14af4d583f3308eef52175f5` |
| `experiments/out/rq2_results.json` | `3cb697e9913bc69ddfa3a059b3827e5f8ac074f5b45edfc4f09280fd97bc32af` |
| `experiments/out/aggregate.json` | `05e0e4154fdffbfb6b48525e3784b175f5dbe9f0faf2f5d32e0be9a4b7ef6593` |
| `work_main_replica.bundle` | `1c99b46067b5d919a539c9b6e2d40e21b5cba4eacf056aacea50c75bb466b61e` |
| 本次 6 格重跑结果 `repro_rq2_cells.json` | `d5110babb53c08ce8086aa667509c356763cc8850519350a48dcf192b55a28a6` |

未改动：主表（`rq2_results.*`、`aggregate.json`）、冻结清单、`subject/history/manifest.json`、论文正文。
