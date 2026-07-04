# RQ3: Repair of Broken Selected Tests (provider=deepseek, n=4)

- repair success-rate (rule): 0.75 (3/4)
- repair success-rate (LLM): 1 (4/4)
- mean TargetedSetUsability: before 0 -> after 0.75
- staleness-classification kappa: pending human labels (see out/rq3_staleness_to_annotate.csv)

| tag | type | target | staleness | before | after(rule) | after(llm) | usability_before | usability_after |
|---|---|---|---|---|---|---|---|---|
| c08 | locator_break | cart.spec.ts | STRUCTURAL_ONLY | false | true | true | 0 | 1 |
| c15 | assertion_break | login.spec.ts | EXPECTATION_CHANGE | false | true | true | 0 | 1 |
| c20 | locator_break | search.spec.ts | STRUCTURAL_ONLY | false | true | true | 0 | 1 |
| c21 | assertion_break | orders.spec.ts | SUSPECTED_REGRESSION | false | false | true | 0 | 0 |
