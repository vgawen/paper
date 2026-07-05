# LLM Token / Cost Estimate

- provider: deepseek
- model/pricing basis: deepseek-v4-flash
- caveat: Estimated from call counts and prompt/output-size assumptions because prior experiment outputs did not persist provider usage fields. Future runs should capture API usage directly.
- pricing source: DeepSeek API pricing page, deepseek-v4-flash cache-miss input and output prices, checked 2026-07-05.

| Experiment | calls | input tokens est. | output tokens est. | estimated USD | Basis |
|---|---:|---:|---:|---:|---|
| rq2 | 6 | 5400 | 789 | $0.000977 | RQ2 has one LLM call per generated spec; output tokens estimated from rq2_to_annotate specs, input tokens from prompt-size assumption. |
| rq3_controlled | 4 | 7200 | 1800 | $0.001512 | RQ3 controlled repair stores call count but not completions; input/output tokens use prompt/template-size assumptions. |
| reprobreak_e2e | 414 | 745200 | 16560 | $0.108965 | ReproBreak LLM arm asks for one corrected locator string per case; call count is exact, tokens are estimated because API usage was not captured. |
| **total** | **424** | **757800** | **19149** | **$0.111454** | estimated, not provider-billed usage |
