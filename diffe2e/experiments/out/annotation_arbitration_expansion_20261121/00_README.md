# 扩展批次仲裁包（第三人裁决，先盲后明）

范围：扩展批次（`rbx001`–`rbx040`）两列不一致的 3 条——`rbx016`、`rbx020`（分诊 SR / 人工 SO，均在 microsoft/playwright）、`rbx031`（分诊 SO / 人工 EC，tryghost/koenig）。

仲裁人资格：独立第三人——不是第二标注者，未参与第一列（管线真实分诊）。

流程：先填 `01_ARBITRATION_BLIND.md`（原始盲评材料，不含任何一列标签），锁定 SHA 后再填 `02_ARBITRATION_INFORMED.md` 的 `final`。两可时倾向 `SUSPECTED_REGRESSION`。

统计隔离：本仲裁只落定扩展批次 `final` 列；不与主实验合并、不合并 κ、不并入表 5-8。当前扩展批两列一致性：n=40、Po=0.9250、Pe=0.9263、κ=-0.0169（两列均高度偏斜，κ 无判别力，与混淆矩阵同报）。
