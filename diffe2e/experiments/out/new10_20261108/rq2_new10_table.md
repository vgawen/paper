# 表：受控缺口扩样 5 → 10（v2 五类算子）

- 样本构成：10 个缺口 = 阶段三 x01–x05（5 个，第二步 v2 结果沿用）+ 本批新增 y01–y05（5 个）。
- 主实验 c03/c13/c19（n=3）不在本表；主表未改动、不合并。
- 环境：@playwright/test 1.54.0 + Chromium 1181；算子集与第二步 v2 一致。

## 1. diff 臂逐缺口

| 缺口 | 路由 | 可执行 | change-relevant | 注入 | 杀伤 | 分数 | 版本敏感 | 自动语义有效 | 来源 |
|---|---|---|---|---|---|---|---|---|---|
| x01 | /settings | true | true | 5 | 4 | 0.8 | true | true | 第二步沿用 |
| x02 | /feedback | true | true | 7 | 7 | 1 | true | true | 第二步沿用 |
| x03 | /inbox | true | true | 5 | 4 | 0.8 | true | true | 第二步沿用 |
| x04 | /checkout | true | true | 6 | 6 | 1 | true | true | 第二步沿用 |
| x05 | /help | true | true | 5 | 4 | 0.8 | true | true | 第二步沿用 |
| y01 | /notifications | true | true | 5 | 4 | 0.8 | true | true | 本批新增 |
| y02 | /survey | true | true | 7 | 7 | 1 | true | true | 本批新增 |
| y03 | /downloads | true | true | 6 | 5 | 0.8333 | true | true | 本批新增 |
| y04 | /support | true | true | 6 | 5 | 0.8333 | true | true | 本批新增 |
| y05 | /reports | true | true | 7 | 4 | 0.5714 | true | true | 本批新增 |

## 2. nodiff 臂逐缺口

| 缺口 | 路由 | 可执行 | change-relevant | 注入 | 杀伤 | 分数 | 版本敏感 | 自动语义有效 | 来源 |
|---|---|---|---|---|---|---|---|---|---|
| x01 | /settings | false | false | 0 | 0 | 0 | false | false | 第二步沿用 |
| x02 | /feedback | false | false | 0 | 0 | 0 | false | false | 第二步沿用 |
| x03 | /inbox | true | false | 5 | 0 | 0 | false | false | 第二步沿用 |
| x04 | /checkout | false | false | 0 | 0 | 0 | false | false | 第二步沿用 |
| x05 | /help | false | false | 0 | 0 | 0 | false | false | 第二步沿用 |
| y01 | /notifications | false | false | 0 | 0 | 0 | false | false | 本批新增 |
| y02 | /survey | false | false | 0 | 0 | 0 | false | false | 本批新增 |
| y03 | /downloads | false | false | 0 | 0 | 0 | false | false | 本批新增 |
| y04 | /support | true | false | 6 | 0 | 0 | false | false | 本批新增 |
| y05 | /reports | false | false | 0 | 0 | 0 | false | false | 本批新增 |

## 3. 汇总（n=10）

| 指标 | diff | nodiff |
|---|---|---|
| n | 10 | 10 |
| executable-rate | 1 | 0.2 |
| change-relevant-rate | 1 | 0 |
| 变异杀伤均值 | 0.8438 | 0 |
| 版本敏感率 | 1 | 0 |
| 自动语义有效率 | 1 | 0 |

## 4. 算子类合计（diff）

| 算子类 | 注入 | 杀伤 | 杀伤率 |
|---|---:|---:|---:|
| testid | 5 | 5 | 1 |
| text | 10 | 8 | 0.8 |
| attribute | 24 | 18 | 0.75 |
| structure | 10 | 10 | 1 |
| logic | 10 | 9 | 0.9 |

