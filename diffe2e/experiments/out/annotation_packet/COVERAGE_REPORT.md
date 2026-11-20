# 盲评材料覆盖清单

生成对象：RQ2 30 条 / RQ3 40 条。

## 总览

| 项目 | 数量 |
|---|---|
| RQ2 变更上下文 | 15 |
| RQ2 应用 diff 可用 | 15 |
| RQ2 应用 diff 缺失 | 0 |
| RQ3 条目 | 40 |
| RQ3 完整旧测试块（block 提取） | 39 |
| RQ3 旧测试块退化为窗口 | 1 |
| RQ3 commit 无正文 | 0 |
| RQ3 应用改动文件数为 0 | 4 |
| RQ3 应用 diff 为空 | 4 |
| RQ3 断言级 diff 有变化 | 24 |
| RQ3 遮蔽验证 PASS | 40 |
| RQ3 遮蔽验证 FAIL / 未执行 | 0 |

## RQ2 逐条

| case_id | 项目 | 状态 | diff 行数 | 截断 | 说明 |
|---|---|---|---|---|---|
| rq2_001 | actual_desktop | ok | 24 | 否 | - |
| rq2_002 | actual_desktop | ok | 24 | 否 | - |
| rq2_003 | actual_desktop | ok | 92 | 否 | - |
| rq2_004 | actual_desktop | ok | 92 | 否 | - |
| rq2_005 | actual_desktop | ok | 13 | 否 | - |
| rq2_006 | actual_desktop | ok | 13 | 否 | - |
| rq2_007 | actual_desktop | ok | 13 | 否 | - |
| rq2_008 | actual_desktop | ok | 13 | 否 | - |
| rq2_009 | actual_desktop | ok | 85 | 否 | - |
| rq2_010 | actual_desktop | ok | 85 | 否 | - |
| rq2_011 | actual_desktop | ok | 43 | 否 | - |
| rq2_012 | actual_desktop | ok | 43 | 否 | - |
| rq2_013 | actual_desktop | ok | 28 | 否 | - |
| rq2_014 | actual_desktop | ok | 28 | 否 | - |
| rq2_015 | actual_desktop | ok | 34 | 否 | - |
| rq2_016 | actual_desktop | ok | 34 | 否 | - |
| rq2_017 | actual_desktop | ok | 39 | 否 | - |
| rq2_018 | actual_desktop | ok | 39 | 否 | - |
| rq2_019 | actual_desktop | ok | 541 | 是 | - |
| rq2_020 | actual_desktop | ok | 541 | 是 | - |
| rq2_021 | actual_desktop | ok | 40 | 否 | - |
| rq2_022 | actual_desktop | ok | 40 | 否 | - |
| rq2_023 | actual_desktop | ok | 68 | 否 | - |
| rq2_024 | actual_desktop | ok | 68 | 否 | - |
| rq2_025 | actual_desktop | ok | 68 | 否 | - |
| rq2_026 | actual_desktop | ok | 68 | 否 | - |
| rq2_027 | actual_desktop | ok | 16 | 否 | - |
| rq2_028 | actual_desktop | ok | 16 | 否 | - |
| rq2_029 | mermaid_live | ok | 106 | 否 | - |
| rq2_030 | mermaid_live | ok | 106 | 否 | - |

## RQ3 逐条

| case_id | rb_id | repo | 旧块 | 行数 | commit 正文 | 应用文件 | diff 文件 | diff 行 | 截断 | 断言 +/− | 遮蔽 | 说明 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| rb001 | 1169 | ghiscoding/angular-slickgrid | block | 23 | 有 | 6 | 5 | 345 | 否 | 0/0 | PASS | 无断言级变化 |
| rb002 | 1180 | ghiscoding/angular-slickgrid | block | 42 | 有 | 20 | 19 | 787 | 否 | 31/31 | PASS | - |
| rb003 | 1181 | ghiscoding/angular-slickgrid | block | 42 | 有 | 20 | 19 | 787 | 否 | 31/31 | PASS | - |
| rb004 | 1182 | ghiscoding/angular-slickgrid | block | 42 | 有 | 20 | 19 | 787 | 否 | 31/31 | PASS | - |
| rb005 | 1183 | ghiscoding/angular-slickgrid | block | 42 | 有 | 20 | 19 | 787 | 否 | 31/31 | PASS | - |
| rb006 | 1184 | ghiscoding/angular-slickgrid | block | 42 | 有 | 20 | 19 | 787 | 否 | 31/31 | PASS | - |
| rb007 | 1185 | ghiscoding/angular-slickgrid | block | 42 | 有 | 20 | 19 | 787 | 否 | 31/31 | PASS | - |
| rb008 | 1186 | ghiscoding/angular-slickgrid | block | 42 | 有 | 20 | 19 | 787 | 否 | 31/31 | PASS | - |
| rb009 | 1452 | ghiscoding/angular-slickgrid | block | 23 | 有 | 20 | 19 | 787 | 否 | 77/77 | PASS | - |
| rb010 | 1481 | ghiscoding/angular-slickgrid | block | 8 | 有 | 20 | 19 | 787 | 否 | 3/3 | PASS | - |
| rb011 | 5435 | microsoft/playwright | block | 14 | 有 | 29 | 28 | 2246 | 是 | 0/0 | PASS | 无断言级变化 |
| rb012 | 5650 | microsoft/playwright | block | 1 | 有 | 5 | 5 | 452 | 否 | 0/0 | PASS | 无断言级变化；旧测试块内无断言，已补断点窗口 |
| rb013 | 5651 | microsoft/playwright | block | 1 | 有 | 7 | 7 | 565 | 否 | 0/0 | PASS | 无断言级变化；旧测试块内无断言，已补断点窗口 |
| rb014 | 5656 | microsoft/playwright | block | 1 | 有 | 5 | 5 | 452 | 否 | 0/0 | PASS | 无断言级变化；旧测试块内无断言，已补断点窗口 |
| rb015 | 5657 | microsoft/playwright | block | 1 | 有 | 5 | 5 | 452 | 否 | 0/0 | PASS | 无断言级变化；旧测试块内无断言，已补断点窗口 |
| rb016 | 5662 | microsoft/playwright | block | 1 | 有 | 7 | 7 | 565 | 否 | 0/0 | PASS | 无断言级变化 |
| rb017 | 5664 | microsoft/playwright | block | 1 | 有 | 7 | 7 | 565 | 否 | 0/0 | PASS | 无断言级变化；旧测试块内无断言，已补断点窗口 |
| rb018 | 5665 | microsoft/playwright | block | 1 | 有 | 7 | 7 | 565 | 否 | 0/0 | PASS | 无断言级变化；旧测试块内无断言，已补断点窗口 |
| rb019 | 5666 | microsoft/playwright | block | 1 | 有 | 7 | 7 | 565 | 否 | 0/0 | PASS | 无断言级变化；旧测试块内无断言，已补断点窗口 |
| rb020 | 5667 | microsoft/playwright | block | 1 | 有 | 7 | 7 | 565 | 否 | 0/0 | PASS | 无断言级变化；旧测试块内无断言，已补断点窗口 |
| rb021 | 3458 | nasa/openmct | block | 120 | 有 | 38 | 29 | 646 | 否 | 91/90 | PASS | - |
| rb022 | 3484 | nasa/openmct | block | 120 | 有 | 5 | 5 | 102 | 否 | 22/22 | PASS | - |
| rb023 | 3488 | nasa/openmct | block | 44 | 有 | 5 | 5 | 102 | 否 | 22/22 | PASS | - |
| rb024 | 3489 | nasa/openmct | block | 44 | 有 | 5 | 5 | 102 | 否 | 22/22 | PASS | - |
| rb025 | 3514 | nasa/openmct | block | 94 | 有 | 38 | 29 | 646 | 否 | 0/0 | PASS | 无断言级变化 |
| rb026 | 3515 | nasa/openmct | block | 94 | 有 | 38 | 29 | 646 | 否 | 0/0 | PASS | 无断言级变化 |
| rb027 | 3550 | nasa/openmct | block | 41 | 有 | 38 | 29 | 646 | 否 | 5/4 | PASS | - |
| rb028 | 3556 | nasa/openmct | block | 23 | 有 | 2 | 2 | 52 | 否 | 0/0 | PASS | 无断言级变化 |
| rb029 | 3558 | nasa/openmct | block | 26 | 有 | 38 | 29 | 646 | 否 | 0/0 | PASS | 无断言级变化 |
| rb030 | 3559 | nasa/openmct | block | 9 | 有 | 18 | 17 | 362 | 否 | 0/0 | PASS | 无断言级变化 |
| rb031 | 616 | tryghost/koenig | window | 163 | 有 | 8 | 4 | 121 | 否 | 5/5 | PASS | 旧测试块退化为窗口 |
| rb032 | 619 | tryghost/koenig | block | 13 | 有 | 8 | 4 | 121 | 否 | 5/5 | PASS | - |
| rb033 | 621 | tryghost/koenig | block | 22 | 有 | 0 | 0 | 0 | 否 | 1/1 | PASS | 无应用文件改动；本次提交没有可展示的应用源码文件改动（可能仅改测试/文档/锁文件） |
| rb034 | 660 | tryghost/koenig | block | 22 | 有 | 8 | 4 | 121 | 否 | 32/32 | PASS | 旧测试块内无断言，已补断点窗口 |
| rb035 | 685 | tryghost/koenig | block | 19 | 有 | 0 | 0 | 0 | 否 | 1/0 | PASS | 无应用文件改动；本次提交没有可展示的应用源码文件改动（可能仅改测试/文档/锁文件） |
| rb036 | 688 | tryghost/koenig | block | 12 | 有 | 1 | 1 | 13 | 否 | 10/10 | PASS | - |
| rb037 | 689 | tryghost/koenig | block | 11 | 有 | 1 | 1 | 13 | 否 | 10/10 | PASS | - |
| rb038 | 690 | tryghost/koenig | block | 22 | 有 | 1 | 1 | 13 | 否 | 10/10 | PASS | - |
| rb039 | 698 | tryghost/koenig | block | 20 | 有 | 0 | 0 | 0 | 否 | 1/0 | PASS | 无应用文件改动；本次提交没有可展示的应用源码文件改动（可能仅改测试/文档/锁文件） |
| rb040 | 699 | tryghost/koenig | block | 20 | 有 | 0 | 0 | 0 | 否 | 1/0 | PASS | 无应用文件改动；本次提交没有可展示的应用源码文件改动（可能仅改测试/文档/锁文件） |

## 阻塞与缺失

无。

## 注意

- 应用 diff 超过行数上限时会截断，并在条目内标注原始行数。
- RQ3 的 commit 正文为空是数据事实（该 commit 本身没有正文），不是抓取失败。
- 遮蔽只针对测试侧新 locator 的**机械寻址路径**；role/name/文案等语义锚按方案一保留可见，应用 diff 中出现的 testId/role/文案属于方法本来可见的 app 信号。
- 详细验证结果见 `redaction_verification.md` / `redaction_verification.json`（取自 annotate/context 目录）。
