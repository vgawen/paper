# ReproBreak 语义子集：flash vs pro 对照

> 子集定义：`sem_applicable && !pre_had_equiv`（distinctive 锚点，且旧测试不含等价写法）。
> exact = 修复结果包含真值 `new_locator`；semantic = 含语义等价定位器。

| 口径 | 模型 | n | exact | semantic | 调用错误 |
|---|---|---:|---:|---:|---:|
| 各自子集 | flash | 90 | 26.67% | 33.33% | 0 |
| 各自子集 | pro | 90 | 23.33% | 30.00% | 0 |
| 交集 | flash | 90 | 26.67% | 33.33% | 0 |
| 交集 | pro | 90 | 23.33% | 30.00% | 0 |

- 仅 flash 子集包含：0 条
- 仅 pro 子集包含：0 条

- McNemar（语义等价，配对）：b=4、c=1、exact p=0.375
- McNemar（exact-match，配对）：b=4、c=1、exact p=0.375

> 解读原则：若 pro 与 flash 在交集上接近（且 McNemar 不显著），说明全池低修复率主要不是模型降级造成的；
> 若 pro 显著更高，则把 pro 作为该子集的上界报告，并改写"修复困难"的归因。
