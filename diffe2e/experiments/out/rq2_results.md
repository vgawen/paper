# RQ2: Two-arm Gap Generation + automatic semantic validity (provider=stub)

| arm | n | executable | change-relevant | mutation-kill (mean) | change-sensitive | semantic-valid (auto) |
|---|---|---|---|---|---|---|
| diff | 3 | 1 | 1 | 1 | 1 | 1 |
| nodiff | 3 | 1 | 1 | 1 | 1 | 1 |

- **automatic semantic validity** = executable ∧ change-sensitive (pass V_new, fail V_old) ∧ kills ≥1 injected new-behavior mutant. Objective, no human needed.
- mutation-kill (mean) = mean over specs of killed/injected mutants on the gap source (testId renames + visible-text edits).
- core claim: the diff-constrained arm should reach higher change-relevant / mutation-kill / semantic-valid than the no-diff baseline (differences emerge under a real LLM; stub returns the same template for both).
- human Cohen's κ retained as a small validation sample only: blinded `rq2_to_annotate.jsonl` + key `rq2_unblind.json`.
