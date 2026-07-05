# RQ4 多过渡成本汇总：actual_desktop

| 项目 | transitions | empty | partial | full | mean Reduction | mean NetSaving | median NetSaving | break-even rate | T_select measured |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| actual_desktop | 9 | 1 | 0 | 8 | 11.1% | 11.1% | 0.0% | 11.1% | false |

## 方法说明

- dual batch-estimated from RQ1 transitions and one RQ4 cost profile。
- empty 过渡：选中集为空，只计选择开销；full 过渡：等价于全量执行再叠加选择开销；partial 过渡：若无逐 transition 实测，按选中比例线性估算。

## 注意事项

- T_select is not measured in the supplied cost profile; batch NetSaving may be optimistic.
- Full-selection transitions are modeled as full-suite runtime plus selection overhead, so they do not create runtime savings.
