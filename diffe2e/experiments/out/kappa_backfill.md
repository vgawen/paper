# RQ2/RQ3 一致性回填模板（RQ3 按口径不报 κ）

## RQ2
- 已从两个真实项目构建 30 条标注样本（第一列为现行 B 正式预标注，来源：b-majority，三次多数票；旧 `annotator1_yn` 列不参与）。
- 已完成现行预标注-人工一致性评估（n=30，第一列来源：b-majority）。
- 人工语义有效率为 0，Po=0.9333，Pe=0.9333，Cohen's κ=0。
- 混淆矩阵：{"y":{"y":0,"n":2},"n":{"y":0,"n":28}}。
- 分臂语义有效率：diff=0，nodiff=0。

## RQ3
- 已从 ReproBreak 无泄漏评估样本中完成现行预标注-人工一致性评估（n=40，第一列来源：b-majority）。
- 人工一致率 Po=1。
- 混淆矩阵：{"STRUCTURAL_ONLY":{"STRUCTURAL_ONLY":40,"EXPECTATION_CHANGE":0,"SUSPECTED_REGRESSION":0},"EXPECTATION_CHANGE":{"STRUCTURAL_ONLY":0,"EXPECTATION_CHANGE":0,"SUSPECTED_REGRESSION":0},"SUSPECTED_REGRESSION":{"STRUCTURAL_ONLY":0,"EXPECTATION_CHANGE":0,"SUSPECTED_REGRESSION":0}}。
- 逐条分歧：0 条。
- 按既定口径，RQ3 预标注为常量 STRUCTURAL_ONLY（Pe 退化），**不报 κ**；只报 Po、混淆矩阵与逐条分歧，避免数值虚高或误用。

