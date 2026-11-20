# RQ3 三类标签：一句话判据与正反例

每条只判一件事：**旧测试为什么失效**。不要引用具体条目编号，也不要去猜某条“应该”属于哪类。

## STRUCTURAL_ONLY

**一句话判据**：测试想验证的东西没变，只是定位方式、DOM 层级、class/id、文案锚点、测试 API 或框架迁移变了。

- 正例：旧测试用 `page.$('.item')` 找元素、断言“列表有 2 项”；新版本改成 `page.locator('[data-testid="item"]')`，断言仍是“列表有 2 项”。
- 反例：定位器没怎么变，但断言从“列表有 2 项”改成“列表第 2 项的金额等于 100”。

## EXPECTATION_CHANGE

**一句话判据**：测试要验证的业务结果或断言对象发生了实质变化，旧断言还在检查旧行为。

- 正例：旧断言统计 markdown 卡片数量，新测试改为验证 codeblock 卡片数量——断言对象从一种业务对象换成了另一种。
- 反例：只是把 `nth-child(2)` 改成更精确的 role+name，断言的值与业务目标完全没变。

## SUSPECTED_REGRESSION

**一句话判据**：看不出是测试过时还是应用真的坏了，无法排除新版本回归。

- 正例：commit 像是在修 bug 或改行为，断言值随之变化，但材料不足以说明这是预期内的业务变更。
- 反例：commit 只是重命名、格式化或测试框架迁移，断言与业务目标都没变。

## 边界提醒

测试写法变得更严格（等待条件细化、选择器收紧、新增 `filter`/`hasText`、改用更精确的 role+name、增加 `toHaveCount`）**本身不构成** `EXPECTATION_CHANGE`；只有被验证的应用行为或业务结果改变才算。判断标准是“断言指向的对象/业务结果是否变了”，不是“测试写法是否更严”。

## 填法

只填三个全大写标签之一：

```text
human2=STRUCTURAL_ONLY
human2=EXPECTATION_CHANGE
human2=SUSPECTED_REGRESSION
```

`final` 留空。拿不准时按 `01_START_HERE.md` 的保守规则处理；材料缺失则停下来问协调者。
