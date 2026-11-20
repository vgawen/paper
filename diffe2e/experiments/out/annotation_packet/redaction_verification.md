# RQ3 遮蔽不可还原验证（方案一：只遮机械路径，保留语义锚）

**遮蔽对象是寻址路径，不是语义锚。** 下列机械寻址字符串在已发放材料的断言级 diff 中精确 / 空白归一化 / token 命中必须为 0：
CSS 选择器、id/class、`data-testid`/`data-*` 的值、`nth()`/`first()`/`last()` 索引、xpath、`page.$` 类选择器字符串、`new_locator` 中的路径片段。
若某机械片段与 `old_locator` / 旧测试块中的字符串相同，则它属于按协议已披露的旧定位器，单独标注，不计为“新定位器泄露”。
语义锚按协议允许可见：`getByRole` 的 role 与 name、`getByText`/`getByLabel`/`getByPlaceholder` 的文本、`filter({hasText})` 的文本、断言值与 matcher；逐条列在文末“按协议允许可见的语义锚”一节。

## 逐条结果

| case | repo | 结果 | 机械片段 | 新泄露 | 语法残留 | 新测试非断言行 | 语义锚(去重) |
|---|---|---|---|---|---|---|---|
| rb001 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rb002 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rb003 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rb004 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rb005 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rb006 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rb007 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rb008 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rb009 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rb010 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rb011 | microsoft/playwright | PASS | 1 | 0 | 0 | 0 | 0 |
| rb012 | microsoft/playwright | PASS | 0 | 0 | 0 | 0 | 0 |
| rb013 | microsoft/playwright | PASS | 0 | 0 | 0 | 0 | 0 |
| rb014 | microsoft/playwright | PASS | 0 | 0 | 0 | 0 | 0 |
| rb015 | microsoft/playwright | PASS | 0 | 0 | 0 | 0 | 0 |
| rb016 | microsoft/playwright | PASS | 0 | 0 | 0 | 0 | 0 |
| rb017 | microsoft/playwright | PASS | 0 | 0 | 0 | 0 | 0 |
| rb018 | microsoft/playwright | PASS | 0 | 0 | 0 | 0 | 0 |
| rb019 | microsoft/playwright | PASS | 0 | 0 | 0 | 0 | 0 |
| rb020 | microsoft/playwright | PASS | 0 | 0 | 0 | 0 | 0 |
| rb021 | nasa/openmct | PASS | 0 | 0 | 0 | 0 | 16 |
| rb022 | nasa/openmct | PASS | 0 | 0 | 0 | 0 | 3 |
| rb023 | nasa/openmct | PASS | 0 | 0 | 0 | 0 | 3 |
| rb024 | nasa/openmct | PASS | 0 | 0 | 0 | 0 | 3 |
| rb025 | nasa/openmct | PASS | 1 | 0 | 0 | 0 | 0 |
| rb026 | nasa/openmct | PASS | 1 | 0 | 0 | 0 | 0 |
| rb027 | nasa/openmct | PASS | 1 | 0 | 0 | 0 | 1 |
| rb028 | nasa/openmct | PASS | 1 | 0 | 0 | 0 | 0 |
| rb029 | nasa/openmct | PASS | 0 | 0 | 0 | 0 | 0 |
| rb030 | nasa/openmct | PASS | 1 | 0 | 0 | 0 | 0 |
| rb031 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 0 |
| rb032 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 0 |
| rb033 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 0 |
| rb034 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 0 |
| rb035 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 1 |
| rb036 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 0 |
| rb037 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 0 |
| rb038 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 0 |
| rb039 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 1 |
| rb040 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 1 |

## 机械片段在应用 diff / commit 中的同名出现（app 信号，非测试侧泄露）

口径：零命中要求针对**已发放的断言级 diff**（测试侧新 locator 的唯一载体）。下表的机械片段只出现在应用源码 diff 或 commit 正文中，属于协议 B 本来就要提供的 app 信号（例如应用新增的 class/testId/文案），不是从测试侧 locator 还原出来的。

| case | 机械片段 | 命中项 |
|---|---|---|
| rb002 | `[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)` | token:style=1、token:slick-cell=1 |
| rb003 | `[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(3)` | token:style=1、token:slick-cell=1 |
| rb004 | `[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(4)` | token:style=1、token:slick-cell=1 |
| rb005 | `[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(4)` | token:style=1、token:slick-cell=1 |
| rb006 | `[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(5)` | token:style=1、token:slick-cell=1 |
| rb007 | `[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(6)` | token:style=1、token:slick-cell=1 |
| rb008 | `[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(6)` | token:style=1、token:slick-cell=1 |
| rb009 | `[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(3)` | token:style=1、token:slick-cell=1 |
| rb010 | `[style="top: ${GRID_ROW_HEIGHT * 4}px;"] > .slick-cell:nth(0)` | token:style=1、token:slick-cell=1 |
| rb028 | `.gl-plot-y-label-swatch-container > .plot-series-color-swatch` | token:gl-plot-y-label-swatch-container=2、token:plot-series-color-swatch=2 |
| rb030 | `[title="More actions"]` | token:title=16、token:More=12、token:actions=17 |
| rb036 | `audio-title` | exact=2、token:audio-title=2 |
| rb037 | `audio-title` | exact=2、token:audio-title=2 |
| rb038 | `audio-title` | exact=2、token:audio-title=2 |

## 按协议允许可见的语义锚（逐条清单与理由）

本节逐条列出实际出现在已发放断言级 diff 中的语义锚。它们说明“断言的对象是什么”，不是“怎么找到它”，因此按方案一保留可见；每条给出理由，不作笼统放行。
断言期望值与 matcher（`toHaveText`/`toContainText` 等）位于 locator 之外，按规则始终保留。

### rb001 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb002 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb003 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb004 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb005 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb006 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb007 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb008 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb009 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb010 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb011 — microsoft/playwright

> 以下机械片段与已披露的旧定位器/旧测试块相同（属于输入的一部分，不是新泄露）：`iframe`

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb012 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb013 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb014 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb015 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb016 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb017 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb018 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb019 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb020 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb021 — nasa/openmct

| 类型 | 值 | 出现次数 | 理由 |
|---|---|---|---|
| role | `cell` | 88 | getByRole 的 role 说明目标元素的语义类型（是什么），按协议允许可见 |
| role | `columnheader` | 88 | getByRole 的 role 说明目标元素的语义类型（是什么），按协议允许可见 |
| name | `Timestamp` | 22 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `Units` | 22 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `Type` | 22 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `WATCH` | 11 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `WARNING` | 11 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `DISTRESS` | 11 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `CRITICAL` | 11 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `SEVERE` | 11 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `Limit WATCH` | 11 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `Limit WARNING` | 11 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `Limit DISTRESS` | 11 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `Limit CRITICAL` | 11 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `Limit SEVERE` | 11 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| getByLabel | `lad value` | 2 | getByLabel 的文本是断言目标的语义内容，按协议允许可见 |

### rb022 — nasa/openmct

| 类型 | 值 | 出现次数 | 理由 |
|---|---|---|---|
| role | `cell` | 44 | getByRole 的 role 说明目标元素的语义类型（是什么），按协议允许可见 |
| name | `Timestamp` | 22 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `Type` | 22 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |

### rb023 — nasa/openmct

| 类型 | 值 | 出现次数 | 理由 |
|---|---|---|---|
| role | `cell` | 44 | getByRole 的 role 说明目标元素的语义类型（是什么），按协议允许可见 |
| name | `Timestamp` | 22 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `Type` | 22 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |

### rb024 — nasa/openmct

| 类型 | 值 | 出现次数 | 理由 |
|---|---|---|---|
| role | `cell` | 44 | getByRole 的 role 说明目标元素的语义类型（是什么），按协议允许可见 |
| name | `Timestamp` | 22 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `Type` | 22 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |

### rb025 — nasa/openmct

> 以下机械片段与已披露的旧定位器/旧测试块相同（属于输入的一部分，不是新泄露）：`.c-message-banner__message`

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb026 — nasa/openmct

> 以下机械片段与已披露的旧定位器/旧测试块相同（属于输入的一部分，不是新泄露）：`.c-message-banner__message`

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb027 — nasa/openmct

| 类型 | 值 | 出现次数 | 理由 |
|---|---|---|---|
| getByLabel | `Plot Legend Item` | 2 | getByLabel 的文本是断言目标的语义内容，按协议允许可见 |

### rb028 — nasa/openmct

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb029 — nasa/openmct

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb030 — nasa/openmct

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb031 — tryghost/koenig

> 以下机械片段与已披露的旧定位器/旧测试块相同（属于输入的一部分，不是新泄露）：`[data-kg-floating-toolbar]`

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb032 — tryghost/koenig

> 以下机械片段与已披露的旧定位器/旧测试块相同（属于输入的一部分，不是新泄露）：`[data-kg-floating-toolbar]`

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb033 — tryghost/koenig

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb034 — tryghost/koenig

> 以下机械片段与已披露的旧定位器/旧测试块相同（属于输入的一部分，不是新泄露）：`[data-kg-plus-menu]`

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb035 — tryghost/koenig

> 以下机械片段与已披露的旧定位器/旧测试块相同（属于输入的一部分，不是新泄露）：`[data-kg-cardmenu-selected="true"]`

| 类型 | 值 | 出现次数 | 理由 |
|---|---|---|---|
| hasText | `snippet` | 1 | filter 的文本锚点说明断言对象内容，按协议允许可见 |

### rb036 — tryghost/koenig

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb037 — tryghost/koenig

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb038 — tryghost/koenig

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rb039 — tryghost/koenig

> 以下机械片段与已披露的旧定位器/旧测试块相同（属于输入的一部分，不是新泄露）：`[data-kg-cardmenu-selected="true"]`

| 类型 | 值 | 出现次数 | 理由 |
|---|---|---|---|
| hasText | `snippet` | 1 | filter 的文本锚点说明断言对象内容，按协议允许可见 |

### rb040 — tryghost/koenig

> 以下机械片段与已披露的旧定位器/旧测试块相同（属于输入的一部分，不是新泄露）：`[data-kg-cardmenu-selected="true"]`

| 类型 | 值 | 出现次数 | 理由 |
|---|---|---|---|
| hasText | `snippet` | 1 | filter 的文本锚点说明断言对象内容，按协议允许可见 |

