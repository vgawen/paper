# RQ1 Statistics (n=16 commit transitions)

## Ours: bootstrap 95% CI
- Reduction: 0.6562 (95% CI 0.5–0.8021)
- Safety: 1 (95% CI 1–1)
- Precision: 1 (95% CI 1–1)

## Ours vs baselines
| comparison | metric | Wilcoxon z | p | Cliff δ |
|---|---|---|---|---|
| ours vs retest_all | Reduction | 3.1449 | 0.0017 | 0.8125 |
| ours vs retest_all | Safety | 0 | 1 | 0 |
| ours vs random_k | Reduction | 0 | 1 | 0 |
| ours vs random_k | Safety | 2.8896 | 0.0039 | 0.6875 |
| ours vs static_heuristic | Reduction | -1.6432 | 0.1003 | -0.4336 |
| ours vs static_heuristic | Safety | 1.6432 | 0.1003 | 0.25 |

## McNemar on per-commit safety (漏选=0)
| comparison | b (ours safe, base unsafe) | c (ours unsafe, base safe) | chi2 |
|---|---|---|---|
| ours vs retest_all | 0 | 0 | 0 |
| ours vs random_k | 11 | 0 | 9.0909 |
| ours vs static_heuristic | 4 | 0 | 2.25 |

## By change type (ours)
| type | n | mean Reduction | mean Safety | mean Precision |
|---|---|---|---|---|
| ui_text | 4 | 0.833 | 1.000 | 1.000 |
| logic | 4 | 0.833 | 1.000 | 1.000 |
| new_feature_gap | 2 | 0.000 | 1.000 | 1.000 |
| multi_file | 2 | 0.667 | 1.000 | 1.000 |
| locator_break | 1 | 0.833 | 1.000 | 1.000 |
| refactor_noise | 1 | 0.833 | 1.000 | 1.000 |
| route | 1 | 0.000 | 1.000 | 1.000 |
| assertion_break | 1 | 0.833 | 1.000 | 1.000 |
