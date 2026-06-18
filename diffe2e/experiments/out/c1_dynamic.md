# C1 动态实测：真实 React 项目 (cand_coverage)

变更：按钮 Red→Crimson（同 handler/颜色）+ 新增 Green 按钮。

## Semantic UI Diff
- MODIFY: button:text:Crimson{text}
- ADD: button:text:Green
- REMOVE: -

## 实跑结果（V_old → V_new）
| test | V_old | V_new | 覆盖App |
|---|---|---|---|
| App.test.ts::default-turquoise | pass | pass | true |
| App.test.ts::red | pass | FAIL | true |
| App2.test.ts::turquoise | pass | pass | true |

- affected oracle（结果翻转）: App.test.ts::red

## 选择：覆盖 vs Semantic UI Diff
| 方法 | 选中 | Reduction | Safety | Precision |
|---|---|---|---|---|
| coverage-only | 3 | 0 | 1 | 0.3333 |
| uidiff (ours) | 1 | 0.6667 | 1 | 1 |

## 修复（uidiff 驱动）
- edits: [{"kind":"locator","field":"text","from":"Red","to":"Crimson"}]
- 修复后 "use Red" 重跑: PASS

## 生成（ADD 缺口）
- 新增按钮 Green: 可执行=true，覆盖App=true

