# RQ3 扩展批次遮蔽不可还原验证（沿用协议 B 规则）

**遮蔽对象是寻址路径，不是语义锚。** 机械寻址字符串在已发放断言级 diff 中的精确 / 空白归一化 / token 命中必须为 0；`old_locator` 与旧测试块内容属于已披露输入，单独记录。

## 逐条结果

| case | repo | 结果 | 机械片段 | 新泄露 | 语法残留 | 新测试非断言行 | 语义锚(去重) |
|---|---|---|---|---|---|---|---|
| rbx001 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rbx002 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rbx003 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rbx004 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rbx005 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rbx006 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rbx007 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rbx008 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rbx009 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rbx010 | ghiscoding/angular-slickgrid | PASS | 1 | 0 | 0 | 0 | 0 |
| rbx011 | microsoft/playwright | PASS | 0 | 0 | 1 | 0 | 2 |
| rbx012 | microsoft/playwright | PASS | 1 | 0 | 2 | 0 | 0 |
| rbx013 | microsoft/playwright | PASS | 1 | 0 | 0 | 0 | 0 |
| rbx014 | microsoft/playwright | PASS | 1 | 0 | 1 | 0 | 0 |
| rbx015 | microsoft/playwright | PASS | 0 | 0 | 0 | 0 | 0 |
| rbx016 | microsoft/playwright | PASS | 0 | 0 | 0 | 0 | 0 |
| rbx017 | microsoft/playwright | PASS | 0 | 0 | 0 | 0 | 0 |
| rbx018 | microsoft/playwright | PASS | 0 | 0 | 0 | 0 | 0 |
| rbx019 | microsoft/playwright | PASS | 0 | 0 | 0 | 0 | 0 |
| rbx020 | microsoft/playwright | PASS | 0 | 0 | 0 | 0 | 0 |
| rbx021 | nasa/openmct | PASS | 0 | 0 | 0 | 0 | 0 |
| rbx022 | nasa/openmct | PASS | 0 | 0 | 0 | 0 | 0 |
| rbx023 | nasa/openmct | PASS | 0 | 0 | 0 | 0 | 16 |
| rbx024 | nasa/openmct | PASS | 0 | 0 | 0 | 0 | 16 |
| rbx025 | nasa/openmct | PASS | 0 | 0 | 0 | 0 | 16 |
| rbx026 | nasa/openmct | PASS | 0 | 0 | 0 | 0 | 16 |
| rbx027 | nasa/openmct | PASS | 0 | 0 | 0 | 0 | 16 |
| rbx028 | nasa/openmct | PASS | 0 | 0 | 0 | 0 | 3 |
| rbx029 | nasa/openmct | PASS | 0 | 0 | 0 | 0 | 3 |
| rbx030 | nasa/openmct | PASS | 0 | 0 | 0 | 0 | 3 |
| rbx031 | tryghost/koenig | PASS | 1 | 0 | 10 | 0 | 0 |
| rbx032 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 0 |
| rbx033 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 1 |
| rbx034 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 1 |
| rbx035 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 0 |
| rbx036 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 1 |
| rbx037 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 0 |
| rbx038 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 0 |
| rbx039 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 0 |
| rbx040 | tryghost/koenig | PASS | 1 | 0 | 0 | 0 | 0 |

## 按协议允许可见的语义锚

以下语义锚按协议保留可见，逐条列出以证明不是笼统放行：

### rbx001 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx002 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx003 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx004 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx005 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx006 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx007 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx008 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx009 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx010 — ghiscoding/angular-slickgrid

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx011 — microsoft/playwright

| 类型 | 值 | 出现次数 | 理由 |
|---|---|---|---|
| role | `tabpanel` | 1 | getByRole 的 role 说明目标元素的语义类型（是什么），按协议允许可见 |
| name | `Console` | 1 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |

### rbx012 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx013 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx014 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx015 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx016 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx017 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx018 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx019 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx020 — microsoft/playwright

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx021 — nasa/openmct

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx022 — nasa/openmct

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx023 — nasa/openmct

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

### rbx024 — nasa/openmct

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

### rbx025 — nasa/openmct

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

### rbx026 — nasa/openmct

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

### rbx027 — nasa/openmct

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

### rbx028 — nasa/openmct

| 类型 | 值 | 出现次数 | 理由 |
|---|---|---|---|
| role | `cell` | 44 | getByRole 的 role 说明目标元素的语义类型（是什么），按协议允许可见 |
| name | `Timestamp` | 22 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `Type` | 22 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |

### rbx029 — nasa/openmct

| 类型 | 值 | 出现次数 | 理由 |
|---|---|---|---|
| role | `cell` | 44 | getByRole 的 role 说明目标元素的语义类型（是什么），按协议允许可见 |
| name | `Timestamp` | 22 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `Type` | 22 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |

### rbx030 — nasa/openmct

| 类型 | 值 | 出现次数 | 理由 |
|---|---|---|---|
| role | `cell` | 44 | getByRole 的 role 说明目标元素的语义类型（是什么），按协议允许可见 |
| name | `Timestamp` | 22 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |
| name | `Type` | 22 | getByRole 的 name 是可访问名称，说明断言对象是什么，按协议允许可见 |

### rbx031 — tryghost/koenig

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx032 — tryghost/koenig

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx033 — tryghost/koenig

| 类型 | 值 | 出现次数 | 理由 |
|---|---|---|---|
| hasText | `snippet` | 1 | filter 的文本锚点说明断言对象内容，按协议允许可见 |

### rbx034 — tryghost/koenig

| 类型 | 值 | 出现次数 | 理由 |
|---|---|---|---|
| hasText | `snippet` | 1 | filter 的文本锚点说明断言对象内容，按协议允许可见 |

### rbx035 — tryghost/koenig

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx036 — tryghost/koenig

| 类型 | 值 | 出现次数 | 理由 |
|---|---|---|---|
| hasText | `snippet` | 1 | filter 的文本锚点说明断言对象内容，按协议允许可见 |

### rbx037 — tryghost/koenig

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx038 — tryghost/koenig

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx039 — tryghost/koenig

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

### rbx040 — tryghost/koenig

_本条断言级 diff 中没有出现可保留的定位器语义锚。_

