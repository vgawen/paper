# RQ2 第一标注者（LLM 辅助）逐条判定与理由

> 说明：本文件是第一标注列的判定依据，不提供给第二标注者。
> 判定标准：y 当且仅当测试实际打开应用、操作/断言了本次变更引入或改变的具体 UI/行为；通用 smoke、body 可见、合成 HTML、无关业务流程均判 n。

| case_id | label | 理由 |
|---|---|---|
| rq2_001 | n | 无 page.goto，使用 inputcell/sheetnameprovider/customcell 等非真实 DOM 自定义标签，未实际打开应用，无法验证 TransactionsTable 的变更。 |
| rq2_002 | n | 通用 smoke：只断言 body/Budget 文本可见，与 TransactionsTable 的具体变更无关。 |
| rq2_003 | n | 使用 page.setContent 构造合成 HTML，完全没有加载真实应用，不能验证 SchedulesTable 的变更。 |
| rq2_004 | n | 通用“添加支出”流程，与 SchedulesTable 变更无关，且假定页面/字段可能不存在。 |
| rq2_005 | n | 只断言 body 可见，恒真断言。 |
| rq2_006 | n | 只断言 body 可见与根 URL，未触及 SelectLinkedAccountsModal 的变更。 |
| rq2_007 | y | 导航后操作 RuleEditor 的 conditions-op、condition-list、field/op/editor-row，并断言条件值与 action 列表可见，直接覆盖变更组件的新交互。 |
| rq2_008 | n | 通用 Budget 页面标题可见，与 RuleEditor 变更无关。 |
| rq2_009 | n | 只断言页面通用 header/button/label/select/input 可见并点击，未针对 Formula 的公式行为做任何断言。 |
| rq2_010 | n | 购物车流程，与 Formula 报表组件完全无关。 |
| rq2_011 | n | 泛化地操作 label/select 并断言数量与 body 文本，未验证 Format 设置的具体新行为。 |
| rq2_012 | n | 只验证 #root 与标题，通用 smoke。 |
| rq2_013 | n | 只验证 mobilepageheader 可见并点击 3 个按钮，未断言 Overview 变更后的具体结果。 |
| rq2_014 | n | 账号页 accounts-table 可见，与 Overview 变更无关。 |
| rq2_015 | n | 泛化 label/input/button 可见与输入清空假设，未验证 settings/index 的具体变更。 |
| rq2_016 | n | Budget 页面 smoke，与 settings/index 变更无关。 |
| rq2_017 | n | 只断言 body 可见，恒真断言。 |
| rq2_018 | n | 首页标题与 sidebar smoke，未触及 AccountSyncCheck 变更。 |
| rq2_019 | y | 导航后专门断言 functiontooltip 可见，该元素对应 codeMirror-excelLanguage 的变更产物。 |
| rq2_020 | n | 只断言首页 h1 可见，通用 smoke。 |
| rq2_021 | n | 只断言 body 可见，恒真断言。 |
| rq2_022 | n | 购物车流程与错误标题假设，与 FormulaResult 变更无关。 |
| rq2_023 | y | 导航后定位 reportcardname，填入并断言 value，直接验证 FormulaCard 的变更元素。 |
| rq2_024 | n | Budget 页面 smoke，与 FormulaCard 变更无关。 |
| rq2_025 | y | 点击 split-transaction-button 并断言 split-transaction-dialog 出现，验证 CategoryAutocomplete 相关的新交互。 |
| rq2_026 | n | Budget 导航 smoke，与 CategoryAutocomplete 变更无关。 |
| rq2_027 | n | 只断言 body 可见，恒真断言。 |
| rq2_028 | n | Budget 内容与 URL smoke，与 TransactionsTable.test.tsx 变更无关。 |
| rq2_029 | y | 导航后点击 card 内的 popover.trigger 并断言 popover 可见，直接验证 Preset 的变更交互。 |
| rq2_030 | n | 只验证默认 Mermaid 图渲染，与 Preset 变更无关。 |

合计：y=5/30，n=25/30。
