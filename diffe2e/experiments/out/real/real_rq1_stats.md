# 真实项目 RQ1 跨项目统计

项目：actual_desktop；总过渡数 n=3。

## 各方法均值 + bootstrap 95% CI
| method | metric | mean | 95% CI |
|---|---|---|---|
| coverage_only | Reduction | 0.5833 | 0–0.875 |
| coverage_only | Safety | 1 | 1–1 |
| coverage_only | Precision | 1 | 1–1 |
| uidiff_only | Reduction | 1 | 1–1 |
| uidiff_only | Safety | 0 | 0–0 |
| uidiff_only | Precision | 1 | 1–1 |
| dual | Reduction | 0.5833 | 0–0.875 |
| dual | Safety | 1 | 1–1 |
| dual | Precision | 1 | 1–1 |

## dual vs coverage_only（Wilcoxon signed-rank）
| metric | z | p |
|---|---|---|
| Reduction | 0 | 1 |
| Safety | 0 | 1 |
| Precision | 0 | 1 |

## 按项目
| project | n | dual Reduction | dual Safety | dual Precision |
|---|---|---|---|---|
| actual_desktop | 3 | 0.5833 | 1.0000 | 1.0000 |
