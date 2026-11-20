# 不要看什么、不要搜什么、不要跑什么

目标只有一个：**让你的判断保持独立**。下面每一项都会提前暴露答案、分组或统计口径；看过之后，你的标注就不再是独立盲评。

## 不要打开的文件

| 文件/目录模式 | 为什么不能看 |
|---|---|
| 任何 `*_unblind.json`、`*annotation*.json`、`*_rationale.md` | 里面直接写着逐条标签或判定理由，等于答案 |
| 任何 `rq2_real_to_annotate.csv`、`rq3_reprobreak_to_annotate.csv` | 主表带有标签列或分组列 |
| 任何 `annotator1_*.json`、`*_masked*.json`、`*_condA*` | 是模型侧结果或分组材料，不是你的判定依据 |
| 任何 `out/repeats/**`、`variance_report*`、`*comparison*.md` | 含逐条标签、一致率与分布统计 |
| 任何 `*kappa*`、`汇总*`、`统计*`、`结果*` 文件 | 含一致性数值或最终分布，会锚定你的判断 |
| 论文草稿、表格、附录、幻灯片 | 里面已写出结论与分布，属于答案 |
| git 历史、commit 的 `new test` 文件、`new_locator` | 会泄露“修好后的写法”，破坏 RQ3 盲评 |

## 不要搜索的关键词

在包外文件、编辑器全局搜索、AI 助手里都不要搜：

- 臂别/分组类：`arm`、`diff 臂`、`nodiff`、`masked`、`condA`、`组别`、`分组`
- 答案类：`human2`/`final` 对应的包外结果文件、任何 `*annotator1*`、`*rationale*`、`*annotation*.json`
- 结论类：`一致率`、`分布`、`kappa`、`κ`、`混淆矩阵`
- 具体计数：任何形如 `x/y` 的标签计数、任何以 `SO=`、`EC=`、`SR=` 开头的统计

如果你只是想知道“这条该判什么”，回到 `02`/`03` 的材料页，不要到包外找答案。

## 不要运行的脚本

| 脚本/命令 | 为什么不能跑 |
|---|---|
| `run_annotator1*.mjs`、`analyze_repeats.mjs` | 会重新生成/读取模型标签与重复统计 |
| `collect_annotator2_md.mjs --write`、merge/score 类脚本 | 这是**回传后由协调者**执行的合并流程，不是标注者步骤 |
| 任何 `node --test`、Playwright、`npm test`、`npx playwright test` | 跑测试会看到新版本行为或 `new_locator`，破坏盲评 |
| 任何读取 `breaks.json`、`results.json`、`out/**` 的脚本 | 这些文件含真值或结果，不属于本任务输入 |

## 一条底线

本包只提供两件事：**逐条材料**与**判据**。任何额外信息都不是给你的。若你不确定某个文件能不能看，默认**不看**；若材料本身不足以判断，按 `01_START_HERE.md` 停下来问协调者，而不是去包外找线索。
