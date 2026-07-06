# RQ2: Two-arm Gap Generation + automatic semantic validity (provider=deepseek)

| arm | n | executable | change-relevant | mutation-kill (mean) | change-sensitive | semantic-valid (auto) |
|---|---|---|---|---|---|---|
| diff | 3 | 1 | 1 | 0.6667 | 1 | 1 |
| nodiff | 3 | 0.3333 | 0 | 0.2222 | 0.3333 | 0.3333 |

- **automatic semantic validity** = executable ∧ change-sensitive (pass V_new, fail V_old) ∧ kills ≥1 injected new-behavior mutant. Objective, no human needed.
- mutation-kill (mean) = mean over specs of killed/injected mutants on the gap source (testId renames + visible-text edits).
- core claim: the diff-constrained arm should reach higher change-relevant / mutation-kill / semantic-valid than the no-diff baseline (differences emerge under a real LLM; stub returns the same template for both).
- human Cohen's κ uses a 30-row real-project blinded sheet: `rq2_real_to_annotate.csv` + key `rq2_real_to_annotate_unblind.json`.
