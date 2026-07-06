# RQ2 生成用例语义有效率标注规范

对每条生成用例，两名标注者独立给出标签（y/n）：
- semantic_valid = y 当且仅当：该测试断言确实验证了「本次变更引入的新行为/页面」，
  且断言不是恒真/与变更无关（例如只断言 body 可见）。
否则 n。

流程：各自独立填表 → 计算一致率与 Cohen's κ → 不一致项第三人仲裁 → 取仲裁后标签算语义有效率。
目标样本：建议 `30-50` 条，推荐 `40` 条（diff 臂 + nodiff 臂混合，隐藏臂别以防偏倚）。

推荐来源优先级：
- 优先从真实项目 `actual-budget` 与 `mermaid-live-editor` 的生成结果抽样。
- 若真实项目样本不足，再用受控主体样本补齐，但不得在盲评表中暴露来源或臂别。

## 字段说明（sheet.csv）
- `case_id`：盲标注编号，回连 `out/rq2_unblind.json` 才能解出 arm。
- `route` / `gap_file`：变更上下文（仅供标注者理解被测变更）。
- `spec`：待判定的生成用例全文。
- `annotator1_yn` / `annotator2_yn`：两名标注者各填 y/n。
- `final`：仅当两人不一致时由第三人仲裁填写（y/n）。

## RQ3 过时类型分类校准

对 RQ3 人工一致性验证样本，两名标注者独立判断失效类型：

- `STRUCTURAL_ONLY`：测试意图仍成立，主要是 locator / 文案 / DOM 结构变化导致旧测试过时。
- `EXPECTATION_CHANGE`：业务预期或断言目标随需求变化，修复需要更新断言语义。
- `SUSPECTED_REGRESSION`：不能确定是测试过时，可能是新版本真实回归；不应自动改写采纳。

字段说明：

- `model_label`：DiffE2E 自动分诊标签。
- `human1` / `human2`：两名标注者独立填写上述三类之一。
- `final`：仅当两人不一致时填写仲裁标签。

推荐样本量：

- 不少于 `30` 条
- 推荐 `40` 条
- 优先从 ReproBreak 端到端无泄漏评估样本池（414 条）抽取，而不是只使用受控主体中的 4 条样本

评分命令：

```bash
node experiments/annotate/score.mjs experiments/out/rq3_staleness_to_annotate.csv
```

输出 `out/rq3_staleness_annotation.json`，包含人工一致性 κ、模型 vs 人工金标 accuracy 与 κ。
