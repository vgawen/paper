# RQ3 扩展批次盲评材料覆盖清单

- 条目：40 条（`rbx001`–`rbx040`）。
- 每仓 10 条：ghiscoding/angular-slickgrid=10，microsoft/playwright=10，nasa/openmct=10，tryghost/koenig=10。
- 完整旧测试块（block 提取）：40。
- 旧测试块退化为窗口：0。
- 应用 diff 为空：3。
- 遮蔽验证 PASS：40/40。

## 逐条

| case_id | repo | 旧块 | 行数 | 应用文件 | diff 行 | 断言 +/− | 遮蔽 | 备注 |
|---|---|---|---|---|---|---|---|---|
| rbx001 | ghiscoding/angular-slickgrid | block | 33 | 20 | 768 | 77/77 | pass | commit 无正文 |
| rbx002 | ghiscoding/angular-slickgrid | block | 25 | 20 | 768 | 77/77 | pass | commit 无正文 |
| rbx003 | ghiscoding/angular-slickgrid | block | 6 | 20 | 768 | 77/77 | pass | commit 无正文 |
| rbx004 | ghiscoding/angular-slickgrid | block | 21 | 20 | 768 | 77/77 | pass | commit 无正文 |
| rbx005 | ghiscoding/angular-slickgrid | block | 21 | 20 | 768 | 77/77 | pass | commit 无正文 |
| rbx006 | ghiscoding/angular-slickgrid | block | 21 | 20 | 768 | 77/77 | pass | commit 无正文 |
| rbx007 | ghiscoding/angular-slickgrid | block | 21 | 20 | 768 | 77/77 | pass | commit 无正文 |
| rbx008 | ghiscoding/angular-slickgrid | block | 6 | 20 | 768 | 3/3 | pass | commit 无正文 |
| rbx009 | ghiscoding/angular-slickgrid | block | 19 | 6 | 340 | 0/0 | pass | - |
| rbx010 | ghiscoding/angular-slickgrid | block | 18 | 20 | 768 | 0/0 | pass | commit 无正文 |
| rbx011 | microsoft/playwright | block | 14 | 6 | 92 | 7/8 | pass | - |
| rbx012 | microsoft/playwright | block | 9 | 8 | 148 | 1/1 | pass | commit 无正文 |
| rbx013 | microsoft/playwright | block | 8 | 10 | 500 | 1/1 | pass | commit 无正文 |
| rbx014 | microsoft/playwright | block | 9 | 7 | 242 | 1/1 | pass | commit 无正文 |
| rbx015 | microsoft/playwright | block | 5 | 7 | 557 | 0/0 | pass | commit 无正文 |
| rbx016 | microsoft/playwright | block | 1 | 5 | 447 | 0/0 | pass | commit 无正文 |
| rbx017 | microsoft/playwright | block | 1 | 7 | 557 | 0/0 | pass | commit 无正文 |
| rbx018 | microsoft/playwright | block | 1 | 7 | 557 | 0/0 | pass | commit 无正文 |
| rbx019 | microsoft/playwright | block | 1 | 7 | 557 | 0/0 | pass | commit 无正文 |
| rbx020 | microsoft/playwright | block | 4 | 7 | 237 | 0/0 | pass | - |
| rbx021 | nasa/openmct | block | 59 | 39 | 710 | 0/0 | pass | commit 无正文 |
| rbx022 | nasa/openmct | block | 34 | 39 | 710 | 0/0 | pass | commit 无正文 |
| rbx023 | nasa/openmct | block | 120 | 38 | 617 | 91/90 | pass | - |
| rbx024 | nasa/openmct | block | 120 | 38 | 617 | 91/90 | pass | - |
| rbx025 | nasa/openmct | block | 120 | 38 | 617 | 91/90 | pass | - |
| rbx026 | nasa/openmct | block | 44 | 38 | 617 | 91/90 | pass | - |
| rbx027 | nasa/openmct | block | 44 | 38 | 617 | 91/90 | pass | - |
| rbx028 | nasa/openmct | block | 120 | 5 | 97 | 22/22 | pass | - |
| rbx029 | nasa/openmct | block | 120 | 5 | 97 | 22/22 | pass | - |
| rbx030 | nasa/openmct | block | 44 | 5 | 97 | 22/22 | pass | - |
| rbx031 | tryghost/koenig | block | 8 | 41 | 1397 | 6/8 | pass | - |
| rbx032 | tryghost/koenig | block | 29 | 8 | 116 | 32/32 | pass | - |
| rbx033 | tryghost/koenig | block | 22 | 0 | 0 | 1/0 | pass | 无应用文件改动；本次提交没有可展示的应用源码文件改动（可能仅改测试/文档/锁文件） |
| rbx034 | tryghost/koenig | block | 26 | 0 | 0 | 1/0 | pass | 无应用文件改动；本次提交没有可展示的应用源码文件改动（可能仅改测试/文档/锁文件） |
| rbx035 | tryghost/koenig | block | 38 | 1 | 23 | 2/3 | pass | - |
| rbx036 | tryghost/koenig | block | 20 | 0 | 0 | 1/0 | pass | 无应用文件改动；本次提交没有可展示的应用源码文件改动（可能仅改测试/文档/锁文件） |
| rbx037 | tryghost/koenig | block | 23 | 5 | 311 | 19/2 | pass | - |
| rbx038 | tryghost/koenig | block | 18 | 5 | 311 | 19/2 | pass | - |
| rbx039 | tryghost/koenig | block | 12 | 7 | 404 | 0/3 | pass | - |
| rbx040 | tryghost/koenig | block | 26 | 20 | 1226 | 4/4 | pass | - |

## 阻塞与缺失

- rbx009: previous_sha_not_parent_but_compare_used — previous_sha=79a6802b75b15effa6f1b9fbce30f57c36dd7559 非父提交；已改用 compare API 区间 diff
