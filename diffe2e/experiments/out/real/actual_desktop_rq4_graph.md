# RQ4 真实项目 wall-clock NetSaving（actual-budget，graph 选择）

**测量（2026-11-22）**：
- 全量 62 个 e2e 测试：`T_full = 168s`（一次 webServer 启动 + 62 测试）
- 单测试：`T_run(1) = 19.5s`（webServer/Vite 启动 ~17s 是固定成本 + 测试 ~2.5s）
- 选择开销：`T_select ≈ 9.1s`（tree-sitter 构建 1968 文件静态图 + 选择器；加 typeChecker 语义解析约再 +5s）

## 三种改动的 NetSaving 对比

`NetSaving = 1 − (T_select + T_run(Sel)) / T_full`

| 改动类型 | 选择器 | 选中测试 | T_run | TimeReduction | **NetSaving** |
|---|---|---|---|---|---|
| 加路由（d05bd03） | route-level | 0 | 0s | 100% | **94.6%** |
| 改共享常量（value-ref） | value-reference | 1 | 19.5s | 88.4% | **83.0%** |
| 改共享文件 | file-level | 62 | 168s | 0% | **−5.4%** |

## 关键结论

1. **graph 的细粒度选择把 NetSaving 从 ~0（甚至负）抬到 80–95%**：文件级选择 62 个测试时，T_select（9.1s）是纯税、NetSaving 为负——比 retest_all 还差；graph 选 0–1 个测试时，NetSaving 达到 83–95%。
2. **Reduction ≫ TimeReduction 的诚实现象**：value-reference 把用例数减 62→1（Reduction 98.4%），但 TimeReduction 只有 88.4%——因为 webServer/Vite 启动 ~17s 是固定成本，少跑测试省不掉它。这印证论文 §3.6 的"用例数比例 ≠ 时间比例"。
3. **SelectionTax 是真实成本**：T_select ≈ 9.1s 占 T_full（168s）的 5.4%，对小改动（选 0–1 测试）是主要开销项；但相对文件级"全选 62 个还白交税"仍是净赚。
4. **typeChecker 是可选税**：语义解析再 +5s（T_select→~14s），用于穿透别名/barrel；若项目无 workspace 别名可关掉，NetSaving 更高。
