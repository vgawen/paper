# 重复运行波动报告

生成时间：2026-11-08T06:49:37.911Z

口径：run1 为既有正式结果；run2/run3 为同材料、同 prompt、同模型与参数（`deepseek-v4-flash`、`temperature=0`、`max_tokens=2000`、预算阶梯 2000→4000→8000）的重复采样。每条的原始输出与 usage 均保存在 `out/repeats/` 对应 JSON。

## 条件 B（aligned_information）

| run | 文件 | 开始 | 结束 | 失败条目 |
|---|---|---|---|---|
| run1 | experiments/out/annotator1_masked.json |  |  | 0 |
| run2 | experiments/out/repeats/masked_run2.json | 2026-11-08T06:37:28.815Z | 2026-11-08T06:41:41.188Z | 0 |
| run3 | experiments/out/repeats/masked_run3.json | 2026-11-08T06:43:19.124Z | 2026-11-08T06:46:57.057Z | 0 |

### RQ2（n=30，可用运行 1/2/3）

| 运行 | 分布 | 失败 |
|---|---|---|
| run1 | {"n":29,"y":1} | 0 |
| run2 | {"n":28,"y":2} | 0 |
| run3 | {"n":28,"y":2} | 0 |

逐条一致率：3/3 = 29 条；2/3 = 1 条；1/3 = 0 条。

| 运行 | prompt tokens | completion tokens | 其中 reasoning | 预算 | 升档条目 |
|---|---|---|---|---|---|
| run1 | 43025 | 6851 | 5385 | 2000 | 无 |
| run2 | 43025 | 5273 | 3775 | 2000 | 无 |
| run3 | 43025 | 6196 | 4712 | 2000 | 无 |

多数票分布：{"n":28,"y":2}

多数票相对 run1 的差异：rq2_023 n→y（n/y/y）

不稳定集中度：1 条；prompt 长度中位数（稳定 3168 / 不稳定 3511）；材料长度中位数（稳定 2661 / 不稳定 3004）；涉及分组：actual_desktop。

- rq2_023（n / y / y）：应用diff有、spec 9 行

| case | 取值序列（run1/run2/run3） | 一致度 | 多数票 | prompt 长度 | 材料长度 | 关键材料特征 |
|---|---|---|---|---|---|---|
| rq2_023 | n / y / y | 2/3 | y | 3511 | 3004 | 项目=actual_desktop；应用diff=3hunk；spec=9行 |

### RQ3（n=40，可用运行 1/2/3）

| 运行 | 分布 | 失败 |
|---|---|---|
| run1 | {"STRUCTURAL_ONLY":40} | 0 |
| run2 | {"STRUCTURAL_ONLY":40} | 0 |
| run3 | {"STRUCTURAL_ONLY":40} | 0 |

逐条一致率：3/3 = 40 条；2/3 = 0 条；1/3 = 0 条。

| 运行 | prompt tokens | completion tokens | 其中 reasoning | 预算 | 升档条目 |
|---|---|---|---|---|---|
| run1 | 356167 | 23852 | 21286 | 2000 | 无 |
| run2 | 356167 | 26002 | 23450 | 4000,2000 | rb001@4000 |
| run3 | 356167 | 21781 | 19146 | 2000 | 无 |

多数票分布：{"STRUCTURAL_ONLY":40}

无逐条不一致样本。

## 条件 A（approx_original_information）

| run | 文件 | 开始 | 结束 | 失败条目 |
|---|---|---|---|---|
| run1 | experiments/out/annotator1_condA.json |  |  | 0 |
| run2 | experiments/out/repeats/condA_run2.json | 2026-11-08T06:37:29.750Z | 2026-11-08T06:41:33.642Z | 0 |
| run3 | experiments/out/repeats/condA_run3.json | 2026-11-08T06:43:19.585Z | 2026-11-08T06:47:07.537Z | 0 |

### RQ2（n=30，可用运行 1/2/3）

| 运行 | 分布 | 失败 |
|---|---|---|
| run1 | {"n":29,"y":1} | 0 |
| run2 | {"n":29,"y":1} | 0 |
| run3 | {"n":28,"y":2} | 0 |

逐条一致率：3/3 = 29 条；2/3 = 1 条；1/3 = 0 条。

| 运行 | prompt tokens | completion tokens | 其中 reasoning | 预算 | 升档条目 |
|---|---|---|---|---|---|
| run1 | 18097 | 5182 | 3721 | 2000 | 无 |
| run2 | 18097 | 5486 | 4022 | 2000 | 无 |
| run3 | 18097 | 6770 | 5326 | 2000 | 无 |

多数票分布：{"n":29,"y":1}

不稳定集中度：1 条；prompt 长度中位数（稳定 1239 / 不稳定 925）；材料长度中位数（稳定 732 / 不稳定 418）；涉及分组：actual_desktop。

- rq2_019（n / n / y）：应用diff无、spec 6 行

| case | 取值序列（run1/run2/run3） | 一致度 | 多数票 | prompt 长度 | 材料长度 | 关键材料特征 |
|---|---|---|---|---|---|---|
| rq2_019 | n / n / y | 2/3 | n | 925 | 418 | 项目=actual_desktop；应用diff=无；spec=6行 |

### RQ3（n=40，可用运行 1/2/3）

| 运行 | 分布 | 失败 |
|---|---|---|
| run1 | {"STRUCTURAL_ONLY":37,"EXPECTATION_CHANGE":3} | 0 |
| run2 | {"STRUCTURAL_ONLY":38,"EXPECTATION_CHANGE":2} | 0 |
| run3 | {"STRUCTURAL_ONLY":38,"EXPECTATION_CHANGE":2} | 0 |

逐条一致率：3/3 = 39 条；2/3 = 1 条；1/3 = 0 条。

| 运行 | prompt tokens | completion tokens | 其中 reasoning | 预算 | 升档条目 |
|---|---|---|---|---|---|
| run1 | 86587 | 15869 | 13500 | 2000,4000 | rb021@4000、rb033@4000、rb039@4000 |
| run2 | 86587 | 20543 | 18137 | 2000,4000 | rb031@4000、rb035@4000、rb039@4000 |
| run3 | 86587 | 16880 | 14389 | 2000,4000 | rb003@4000、rb021@4000、rb033@4000 |

多数票分布：{"STRUCTURAL_ONLY":38,"EXPECTATION_CHANGE":2}

多数票相对 run1 的差异：rb040 EXPECTATION_CHANGE→STRUCTURAL_ONLY（EXPECTATION_CHANGE/STRUCTURAL_ONLY/STRUCTURAL_ONLY）

不稳定集中度：1 条；prompt 长度中位数（稳定 5907 / 不稳定 3163）；材料长度中位数（稳定 5194 / 不稳定 2450）；涉及分组：tryghost/koenig。

- rb040（EXPECTATION_CHANGE / STRUCTURAL_ONLY / STRUCTURAL_ONLY）：旧块无、应用diff无、断言diff 1 行

| case | 取值序列（run1/run2/run3） | 一致度 | 多数票 | prompt 长度 | 材料长度 | 关键材料特征 |
|---|---|---|---|---|---|---|
| rb040 | EXPECTATION_CHANGE / STRUCTURAL_ONLY / STRUCTURAL_ONLY | 2/3 | STRUCTURAL_ONLY | 3163 | 2450 | repo=tryghost/koenig；旧块=无；应用diff=无；断言diff=1行 |
