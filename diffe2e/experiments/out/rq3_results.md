# RQ3: Repair of Broken Selected Tests (n=2)

- repair success-rate: 1 (2/2)
- mean TargetedSetUsability: before 0 -> after 1
- ReproBreak external dataset: SKIPPED (no REPRO_BREAK_URL/credentials configured; adapter ready in realproj/)

| tag | type | target | staleness | before | after | usability_before | usability_after |
|---|---|---|---|---|---|---|---|
| c08 | locator_break | cart.spec.ts | STRUCTURAL_ONLY | false | true | 0 | 1 |
| c15 | assertion_break | login.spec.ts | EXPECTATION_CHANGE | false | true | 0 | 1 |
