# ReproBreak 真实数据子实验（离线 / CSV ground truth）

数据源：`clones/ReproBreak/locator_analysis.csv`（9604 条真实结构性 locator 断裂对，来自开源 Cypress/Playwright 项目）。
> 执行验证版（449 个可复现断裂）存于 gitignored 的 SQLite DB，经 Docker 复现，列为后续更重的一步。

## E1 数据刻画
- 框架：Playwright 4867（50.7%）/ Cypress 4737（49.3%）。
- 旧 locator 类型分布：
  - css-other: 3038（31.6%）
  - css-class: 1856（19.3%）
  - css-id: 1542（16.1%）
  - role: 1162（12.1%）
  - text: 991（10.3%）
  - testid: 974（10.1%）
  - attr-href: 40（0.4%）
  - xpath: 1（0.0%）
- Top 项目：citizenlabdotco/citizenlab(523)、ionic-team/ionic-framework(442)、microsoft/playwright(399)、ghiscoding/angular-slickgrid(344)、payloadcms/payload(319)、kong/insomnia(304)、mattermost/mattermost(288)、nasa/openmct(271)。

## E2 Semantic UI Diff 可达性（addressability）
变更类别：
- structural-reshuffle: 3660（38.1%）
- strategy-switch: 2504（26.1%）
- css-class-rename: 1276（13.3%）
- css-id-rename: 992（10.3%）
- option-only: 594（6.2%）
- testid-value: 416（4.3%）
- text-value: 150（1.6%）
- attr-value: 9（0.1%）
- role-name-value: 3（0.0%）

**可被 Semantic UI Diff 信号定位的断裂占比：1172/9604 = 12.2%**（testId/text/role-name/label/href 值替换 + 选项变更）。
其余为 CSS id/class 改名、结构重排或定位策略切换——需 DOM 拓扑或 LLM 推理（本方法 UI 信号不直接覆盖）。
- 分框架可达性：playwright 17.4%、cypress 6.9%（Playwright 的语义定位天然更可修）。

## E3 确定性修复改写器精确匹配（已知 oracle 信号，上界）
在「可达且为单一语义锚值替换」的 578 条上，给定 ground-truth 的 oldValue→newValue 信号，本方法的确定性改写器精确重建开发者修复（归一化精确匹配）：**574/578 = 99.3%**。
> 该指标隔离的是「改写机制在真实 Playwright/Cypress 语法上的正确性」，假定语义信号已知；信号检测精度（从 AUT diff 还原 oldValue→newValue）需各 commit 源码 + 执行验证，属后续步骤。

改写失败样例（暴露确定性改写的语法盲区，正是 LLM 增益空间）：
- [testid] `cy.getByTestId(`accordion-header-improve.system`)` →期望 `cy.getByTestId(`accordion-header-functional.service.improve`)`，得到 `cy.getByTestId(`accordion-header-improve.system`)`
- [testid] `cy.getByTestId(`row-${CYPRESS_USER_ID}`)` →期望 `cy.getByTestId(`user-link-${CYPRESS_USER_ID}`)`，得到 `cy.getByTestId(`row-${CYPRESS_USER_ID}`)`
- [testid] `cy.getByTestId(`row-${USER_1_ID}`)` →期望 `cy.getByTestId(`user-link-${USER_1_ID}`)`，得到 `cy.getByTestId(`row-${USER_1_ID}`)`
- [testid] `cy.getByTestId(`monitor-result-${monitorKey}`)` →期望 `cy.getByTestId(`monitor-result-${key}`)`，得到 `cy.getByTestId(`monitor-result-${monitorKey}`)`

## 局限与下一步
- 本子实验用 CSV 的 old/new ground truth，未执行验证；执行验证（ReproBreak overwrite 模式，449 断裂 + Docker）为后续。
- E3 为上界（oracle 信号）；端到端「diff→信号→修复」精度需克隆 4 个可复现 AUT 项目并在对应 commit 取源码，纳入后续真实 LLM 对比。
