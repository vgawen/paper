# 归因完备性审计（H2′ 兜底）

- EMPTY 实体文件：1
- 其中纯注释/空行（选 0 正确）：0
- 其中不可归因的语义改动（触发文件级回退）：1

## 真实项目 actual_desktop

| 过渡 | 类型 | 文件 | 实体 | EMPTY | 纯注释 | 回退文件级 |
|---|---|---|---|---|---|---|
| b41776d→abb1e4f | real | `packages/desktop-client/src/components/reports/chart-theme.ts` | variable:reducedMotion, variable:isAnimationActive, variable:animationDuration, function:useRechartsAnimation | 否 | — | 否 |
| abb1e4f→8f2302e | real | `packages/desktop-client/src/components/autocomplete/CategoryAutocomplete.tsx` | function:CategoryAutocomplete | 否 | — | 否 |
| abb1e4f→8f2302e | real | `packages/desktop-client/src/components/autocomplete/filterCategorySuggestions.ts` | variable:itemsById, variable:splitItem, variable:realSuggestions, variable:nameMatches, variable:nameMatchIds, variable:groupMatches, variable:filtered, function:rankMatches, function:filterCategorySuggestions | 否 | — | 否 |
| 8f2302e→1279e7c | real | `packages/desktop-client/src/data/customThemeCatalog.json` | — | 是 | 否 | **是** |
| 1279e7c→81ea158 | real | `packages/desktop-client/src/components/budget/goals/editor/HistoricalAutomationReadOnly.tsx` | jsx:undefined, variable:base, function:HistoricalAutomationReadOnly, function:HistoricalAutomationReadOnly | 否 | — | 否 |
| 81ea158→674c6f1 | real | `packages/desktop-client/src/components/formula/codeMirror-excelLanguage.tsx` | variable:scrollContainer, variable:canScrollY, variable:canScrollX, variable:deltaMultiplier, variable:previousScrollTop, variable:previousScrollLeft, variable:completionItem, variable:completionItem, function:handleWheel, function:handleMouseDown, function:handleMouseMove, variable:hoveredCompletionItem, function:handleWheel, function:handleMouseDown, function:handleMouseMove, function:destroy, function:setHoveredCompletionItem, function:createCompletion, function:startState, function:token, function:createCompletion, variable:MATH_FUNCTIONS, variable:LOGICAL_FUNCTIONS, variable:TEXT_FUNCTIONS, variable:excelFormulaParser, variable:transactionFields, variable:autocompletePopoverTheme, variable:autocompletePopoverPointerHandler, function:FieldTooltip, function:getFunctionCompletions, function:isPointInsideRect, function:findAutocompleteElementAtPoint, function:excelFormulaExtension | 否 | — | 否 |
| 81ea158→674c6f1 | real | `packages/desktop-client/src/components/formula/queryModeFunctions.ts` | variable:queryModeFunctions | 否 | — | 否 |
| 81ea158→674c6f1 | real | `packages/desktop-client/src/components/formula/transactionModeFunctions.ts` | variable:transactionModeFunctions | 否 | — | 否 |
| 81ea158→674c6f1 | real | `packages/desktop-client/src/components/reports/FormulaResult.tsx` | jsx:undefined, variable:lines, variable:lineCount, variable:longestLineLength, variable:calculatedFontSize, jsx:undefined, variable:calculateFontSize, jsx:undefined, function:FormulaResult | 否 | — | 否 |
| 81ea158→674c6f1 | real | `packages/desktop-client/src/components/reports/Overview.tsx` | function:getWidgetMinHeight, function:getWidgetMinWidth | 否 | — | 否 |
| 81ea158→674c6f1 | real | `packages/desktop-client/src/components/reports/reports/Formula.tsx` | jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, function:onSaveWidgetName, jsx:undefined, variable:[showTitle, setShowTitle], function:onSaveWidgetName, jsx:undefined, function:onSaveWidget, function:FormulaInner | 否 | — | 否 |
| 81ea158→674c6f1 | real | `packages/desktop-client/src/components/reports/reports/FormulaCard.tsx` | jsx:undefined, jsx:undefined, variable:showTitle, jsx:undefined, function:FormulaCard | 否 | — | 否 |
| 81ea158→674c6f1 | real | `packages/desktop-client/src/components/settings/Format.tsx` | jsx:undefined, jsx:undefined, variable:dispatch, variable:firstDayOfWeekIdx, variable:[_numberFormat], jsx:undefined, function:FormatSettings | 否 | — | 否 |
| 81ea158→674c6f1 | real | `packages/desktop-client/src/components/settings/index.tsx` | function:onCloseBudget, function:onCloseBudget, variable:{ isNarrowWidth }, function:Settings | 否 | — | 否 |
| 81ea158→674c6f1 | real | `packages/desktop-client/src/hooks/useFormulaExecution.ts` | variable:key, variable:textValue, variable:browserLocale, variable:formulaLocale, variable:err, variable:cellValue, function:getKey, function:getKey, variable:matching, function:executeFormula, variable:[language], variable:{ grouped: categoryGroups }, variable:groupNameById, variable:conditionResults, function:createFormulaQueryContext, function:useFormulaExecution, function:fetchQueryCount, function:extractCategoryConditions, function:getCategoriesFromConditions | 否 | — | 否 |
| 81ea158→674c6f1 | real | `packages/desktop-client/src/hooks/useTransactionFormulaExecution.ts` | variable:browserLocale, variable:formulaLocale, variable:err, function:executeFormula, variable:[language], function:useTransactionFormulaExecution | 否 | — | 否 |
| 81ea158→674c6f1 | real | `packages/desktop-client/src/util/bootstrapHyperFormula.ts` | function:bootstrapHyperFormula | 否 | — | 否 |
| 674c6f1→fbdad57 | real | `packages/desktop-client/src/components/modals/SelectLinkedAccountsModal.tsx` | function:SelectLinkedAccountsModal | 否 | — | 否 |
| 674c6f1→fbdad57 | real | `packages/desktop-client/src/components/rules/RuleEditor.tsx` | function:RuleEditor | 否 | — | 否 |
| 674c6f1→fbdad57 | real | `packages/desktop-client/src/hooks/useInputRefValue.ts` | function:_setValue, function:useInputRefValue | 否 | — | 否 |
| fbdad57→a492453 | real | `packages/desktop-client/src/components/transactions/TransactionList.tsx` | variable:changes, variable:onSplit, function:TransactionList | 否 | — | 否 |
| fbdad57→a492453 | real | `packages/desktop-client/src/components/transactions/TransactionsTable.tsx` | variable:newTrans, variable:{ data, diff }, variable:onSplit, variable:TransactionTable | 否 | — | 否 |
| a492453→9cd5ed4 | real | `packages/desktop-client/src/accounts/syncStatus.ts` | function:isAccountFailedSync, function:getFailedSyncError | 否 | — | 否 |
| a492453→9cd5ed4 | real | `packages/desktop-client/src/components/accounts/AccountSyncCheck.tsx` | variable:account, variable:error, function:AccountSyncCheck | 否 | — | 否 |
| 9cd5ed4→19cea1a | real | `packages/desktop-client/src/components/schedules/SchedulesTable.tsx` | variable:amountStr, jsx:undefined, jsx:undefined, jsx:undefined, variable:isApprox, variable:isBetween, variable:cellText, jsx:undefined, variable:{ data: payees }, variable:{ data: accounts = [] }, variable:filteredSchedules, function:ScheduleAmountCell, function:SchedulesTable | 否 | — | 否 |

> 口径：EMPTY = 行号→实体映射（`changedEntitiesFromCode`）没有返回任何函数/变量/路由；
> 纯注释 = TypeScript scanner 证明每条改动行的非空白字符全部位于注释 trivia 内（模板字符串内的 `//` 不算注释）。
