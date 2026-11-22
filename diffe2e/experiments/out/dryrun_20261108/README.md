# dryrun_20261108 — 第二标注者链路的合成演练（隔离目录）

> **这不是真实标注，也不能用于论文。** 目录内所有标签都是脚本按 `i % k` 生成的合成值，与任何真实标注者、模型预标注或论文结果无关。

## 内容

| 文件/目录 | 用途 |
|---|---|
| `run_dryrun.mjs` | 演练 harness：重建镜像目录、复制脚本与数据、生成合成标签、跑主链路与 6 个失效场景。 |
| `DRYRUN_REPORT.md` | 人读报告：主链路结果、失效场景实测、硬闸门结果。 |
| `dryrun_results.json` | 机器可读结果：每步退出码、stdout/stderr、Po/Pe/κ/混淆矩阵。 |
| `experiments/` | 隔离的脚本与数据副本；`score.mjs` / `render_kappa_backfill.mjs` 的固定 `../out` 路径全部落在本目录内。 |
| `experiments/out/scen_*` | 6 个失效场景的产物。 |

## 重跑

```bash
cd /Users/dd/gdb/paper/diffe2e/experiments/out/dryrun_20261108
node run_dryrun.mjs
```

Harness 会先清空并重建 `dryrun_20261108/experiments/`，不会写入 `../../out/`、`../../annotate/` 或论文路径。

## 隔离边界

- 正式 `diffe2e/experiments/out/` 下的主表、盲表、`kappa_backfill.md` **未被本次演练写入**。
- 演练只使用 `dryrun_20261108/` 内的副本；正式 `rq2_real_to_annotate.csv` / `rq3_reprobreak_to_annotate.csv` 的 `annotator2_yn` / `human2` / `final` 仍为空。
- 新增的 `diffe2e/experiments/annotate/check_second_annotator.mjs` 是回传后使用的手工闸门脚本，不包含任何合成标签。

## 清理

确认不再需要后，直接删除整个目录：

```bash
rm -rf /Users/dd/gdb/paper/diffe2e/experiments/out/dryrun_20261108
```
