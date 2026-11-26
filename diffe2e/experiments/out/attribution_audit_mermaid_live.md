# 归因完备性审计（H2′ 兜底）

- EMPTY 实体文件：1
- 其中纯注释/空行（选 0 正确）：0
- 其中不可归因的语义改动（触发文件级回退）：1

## 真实项目 mermaid_live

| 过渡 | 类型 | 文件 | 实体 | EMPTY | 纯注释 | 回退文件级 |
|---|---|---|---|---|---|---|
| 144b4dc→5910562 | real | `src/lib/util/persist.svelte.test.ts` | variable:settings | 否 | — | 否 |
| 144b4dc→5910562 | real | `src/lib/util/persist.svelte.ts` | jsx:undefined, variable:readJSON | 否 | — | 否 |
| 5910562→d2f067a | real | `src/lib/util/state.svelte.test.ts` | variable:counter, variable:runs, variable:stop, variable:cases, function:countEffectRuns, function:readStoredState, function:countEffectRuns, function:readStoredState | 否 | — | 否 |
| 5910562→d2f067a | real | `src/lib/util/state.svelte.ts` | variable:lastKey, variable:lastObject, variable:next, variable:error, variable:config, variable:key, variable:unsafePath, variable:processed, variable:snapshot, function:validatedStateOf, function:processState, function:persistAndProcess, function:update, function:sanitizeConfig, function:loadState, function:applyPartial, function:updateCodeStore, function:updateCode, function:updateConfig, function:toggleDarkTheme, function:replaceInputState, function:verifyState, variable:CODE_STORE_KEY, variable:input, variable:inputState, function:validatedStateOf, variable:initialState, variable:validatedCurrent, variable:lastDiagramType, function:processState, function:persistAndProcess, function:update, function:sanitizeConfig, function:loadState, variable:renderCount, function:applyPartial, function:updateCodeStore, function:updateCode, function:updateConfig, function:toggleDarkTheme, function:replaceInputState, function:verifyState | 否 | — | 否 |
| d2f067a→c253054 | real | `src/lib/util/persist.svelte.ts` | jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, variable:readJSON | 否 | — | 否 |
| c253054→a257f78 | real | `src/lib/components/MobileEditor.svelte` | jsx:undefined | 否 | — | 否 |
| c253054→a257f78 | real | `src/lib/components/Preset.svelte` | jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined | 否 | — | 否 |
| c253054→a257f78 | real | `src/lib/util/mermaid.test.ts` | variable:example, variable:[name, examples], variable:[name, examples], variable:samples | 否 | — | 否 |
| c253054→a257f78 | real | `src/lib/util/mermaid.ts` | variable:samples, variable:diagram, function:isValidDiagram, function:getSampleDiagrams, function:isValidDiagram, function:getSampleDiagrams | 否 | — | 否 |
| c253054→a257f78 | real | `src/lib/util/persist.svelte.test.ts` | — | 是 | 否 | **是** |
| c253054→a257f78 | real | `src/lib/util/persist.svelte.ts` | jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, function:hasStorage, jsx:undefined, function:hasStorage, variable:readJSON | 否 | — | 否 |
| c253054→a257f78 | real | `src/lib/util/state.svelte.ts` | variable:{ code, serialized }, variable:{ krokiRendererUrl, rendererUrl }, variable:png, variable:processed, variable:snapshot, variable:state, variable:error, variable:config, variable:key, function:validatedStateOf, function:processState, function:persistAndProcess, function:loadState, function:updateCodeStore, function:updateCode, function:toggleDarkTheme, function:replaceInputState, function:initURLSubscription, function:verifyState, variable:inputState, function:validatedStateOf, variable:validatedCurrent, variable:lastDiagramType, function:processState, function:persistAndProcess, variable:validatedState, variable:urlsCurrent, function:loadState, variable:renderCount, function:updateCodeStore, function:updateCode, function:toggleDarkTheme, function:replaceInputState, function:initURLSubscription, function:verifyState | 否 | — | 否 |
| a257f78→7f08e5b | real | `src/lib/components/MobileEditor.svelte` | jsx:undefined | 否 | — | 否 |
| a257f78→7f08e5b | real | `src/lib/util/persist.svelte.test.ts` | variable:settings | 否 | — | 否 |
| a257f78→7f08e5b | real | `src/lib/util/persist.svelte.ts` | jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, jsx:undefined, variable:readJSON | 否 | — | 否 |
| a257f78→7f08e5b | real | `src/lib/util/state.svelte.test.ts` | variable:counter, variable:runs, variable:stop, variable:cases, function:countEffectRuns, function:readStoredState, function:countEffectRuns, function:readStoredState | 否 | — | 否 |
| a257f78→7f08e5b | real | `src/lib/util/state.svelte.ts` | variable:lastKey, variable:lastObject, variable:next, variable:error, variable:config, variable:key, variable:unsafePath, variable:processed, variable:snapshot, function:validatedStateOf, function:processState, function:persistAndProcess, function:update, function:sanitizeConfig, function:loadState, function:applyPartial, function:updateCodeStore, function:updateCode, function:updateConfig, function:toggleDarkTheme, function:replaceInputState, function:verifyState, variable:CODE_STORE_KEY, variable:input, variable:inputState, function:validatedStateOf, variable:initialState, variable:validatedCurrent, variable:lastDiagramType, function:processState, function:persistAndProcess, function:update, function:sanitizeConfig, function:loadState, variable:renderCount, function:applyPartial, function:updateCodeStore, function:updateCode, function:updateConfig, function:toggleDarkTheme, function:replaceInputState, function:verifyState | 否 | — | 否 |

> 口径：EMPTY = 行号→实体映射（`changedEntitiesFromCode`）没有返回任何函数/变量/路由；
> 纯注释 = TypeScript scanner 证明每条改动行的非空白字符全部位于注释 trivia 内（模板字符串内的 `//` 不算注释）。
