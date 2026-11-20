# 表 5-5b（扩展批次，旧 2 类算子）

- 样本量：n=8（5 个新缺口 + 主 3 缺口扩展重跑）
- 算子集与主实验 `run_rq2.mjs#mutantsForGap` 逐字一致（testid 重命名 + 可见文本追加 MUT，每缺口最多 3 个）；主表 n=3 不改，不合并统计。

| arm | n | executable | change-relevant | mutation-kill (mean) | change-sensitive | semantic-valid (auto) |
|---|---|---|---|---|---|---|
| diff | 8 | 1 | 1 | 0.5 | 1 | 0.625 |
| nodiff | 8 | 0.125 | 0 | 0 | 0 | 0 |

> 主实验参考（只读，不并入本表）：diff 1.0 / 1.0 / 0.6667 / 1.0 / 1.0；nodiff 0 / 0 / 0 / 0 / 0（n=3；2026-11-08 复核修正，见 `../FREEZE_RECORD.md` §8）。
> 注：本表 old 结果已按 k=3 重跑（首轮误把缺口 id 当 k）；生成用例与 new5 结果未变。
