# 归因完备性审计（H2′ 兜底）

- EMPTY 实体文件：3
- 其中纯注释/空行（选 0 正确）：3
- 其中不可归因的语义改动（触发文件级回退）：0

## 受控主体（24 过渡）

| 过渡 | 类型 | 文件 | 实体 | EMPTY | 纯注释 | 回退文件级 |
|---|---|---|---|---|---|---|
| c01 | ui_text | `app/public/src/home.js` | function:render | 否 | — | 否 |
| c02 | logic | `app/public/src/search.js` | variable:ITEMS | 否 | — | 否 |
| c03 | new_feature_gap | `app/public/src/coupon.js` | variable:b, variable:c, variable:m, function:render | 否 | — | 否 |
| c03 | new_feature_gap | `app/public/src/main.js` | variable:routes | 否 | — | 否 |
| c04 | multi_file | `app/public/src/util.js` | function:discount | 否 | — | 否 |
| c05 | ui_text | `app/public/src/profile.js` | function:render | 否 | — | 否 |
| c06 | logic | `app/public/src/login.js` | function:render | 否 | — | 否 |
| c07 | logic | `app/public/src/orders.js` | variable:ORDERS | 否 | — | 否 |
| c08 | locator_break | `app/public/src/cart.js` | variable:btn, function:render | 否 | — | 否 |
| c09 | ui_text | `app/public/src/search.js` | function:render | 否 | — | 否 |
| c10 | refactor_noise | `app/public/src/home.js` | — | 是 | 是 | 否 |
| c11 | multi_file | `app/public/src/cart.js` | variable:count | 否 | — | 否 |
| c11 | multi_file | `app/public/src/login.js` | function:render | 否 | — | 否 |
| c12 | route | `app/public/src/main.js` | variable:routes | 否 | — | 否 |
| c13 | new_feature_gap | `app/public/src/main.js` | variable:routes | 否 | — | 否 |
| c13 | new_feature_gap | `app/public/src/wishlist.js` | variable:n, variable:b, variable:c, function:render | 否 | — | 否 |
| c14 | logic | `app/public/src/orders.js` | — | 是 | 是 | 否 |
| c15 | assertion_break | `app/public/src/login.js` | function:render | 否 | — | 否 |
| c16 | ui_text | `app/public/src/profile.js` | function:render | 否 | — | 否 |
| c17 | logic | `app/public/src/util.js` | function:taxCents | 否 | — | 否 |
| c18 | ui_text | `app/public/src/profile.js` | function:render | 否 | — | 否 |
| c19 | new_feature_gap | `app/public/src/faq.js` | variable:b, variable:p, function:render | 否 | — | 否 |
| c19 | new_feature_gap | `app/public/src/main.js` | variable:routes | 否 | — | 否 |
| c20 | locator_break | `app/public/src/search.js` | variable:go, function:render | 否 | — | 否 |
| c21 | assertion_break | `app/public/src/orders.js` | variable:ORDERS | 否 | — | 否 |
| c22 | multi_file | `app/public/src/home.js` | function:render | 否 | — | 否 |
| c22 | multi_file | `app/public/src/profile.js` | function:render | 否 | — | 否 |
| c23 | route | `app/public/src/main.js` | variable:routes | 否 | — | 否 |
| c24 | refactor_noise | `app/public/src/util.js` | — | 是 | 是 | 否 |

> 口径：EMPTY = 行号→实体映射（`changedEntitiesFromCode`）没有返回任何函数/变量/路由；
> 纯注释 = TypeScript scanner 证明每条改动行的非空白字符全部位于注释 trivia 内（模板字符串内的 `//` 不算注释）。
