# RQ1 Statistics (n=24 commit transitions)

## Ours: bootstrap 95% CI
- Reduction: 0.625 (95% CI 0.493–0.75)
- Safety: 1 (95% CI 1–1)
- Precision: 1 (95% CI 1–1)

## Ours vs baselines
| comparison | metric | Wilcoxon z | p | Cliff δ |
|---|---|---|---|---|
| ours vs retest_all | Reduction | 3.8029 | 0.0001 | 0.7917 |
| ours vs retest_all | Safety | 0 | 1 | 0 |
| ours vs random_k | Reduction | 0 | 1 | 0 |
| ours vs random_k | Safety | 3.5977 | 0.0003 | 0.7083 |
| ours vs static_heuristic | Reduction | -2.4505 | 0.0143 | -0.5451 |
| ours vs static_heuristic | Safety | 2.4505 | 0.0143 | 0.3333 |

## McNemar on per-commit safety (漏选=0)
| comparison | b (ours safe, base unsafe) | c (ours unsafe, base safe) | chi2 |
|---|---|---|---|
| ours vs retest_all | 0 | 0 | 0 |
| ours vs random_k | 17 | 0 | 15.0588 |
| ours vs static_heuristic | 8 | 0 | 6.125 |

## By change type (ours)
| type | n | mean Reduction | mean Safety | mean Precision |
|---|---|---|---|---|
| ui_text | 5 | 0.833 | 1.000 | 1.000 |
| logic | 5 | 0.800 | 1.000 | 1.000 |
| new_feature_gap | 3 | 0.000 | 1.000 | 1.000 |
| multi_file | 3 | 0.667 | 1.000 | 1.000 |
| locator_break | 2 | 0.833 | 1.000 | 1.000 |
| refactor_noise | 2 | 0.750 | 1.000 | 1.000 |
| route | 2 | 0.000 | 1.000 | 1.000 |
| assertion_break | 2 | 0.833 | 1.000 | 1.000 |
