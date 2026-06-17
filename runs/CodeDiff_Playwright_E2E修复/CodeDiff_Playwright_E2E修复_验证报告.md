# 验证报告：面向代码变更的 Playwright 端到端测试自动修复研究综述

> 渲染前硬校验汇总。档位：Standard。

## 1. 字数与引用（validate_counts.py）

| 指标 | 结果 | 阈值 | 判定 |
|------|------|------|------|
| 正文总字数 | 7329 | 6000–10000 | ✅ |
| 中文字数 | 7002 | — | — |
| 英文词数 | 327 | — | — |
| 唯一引用 key 数 | 66 | 50–90 | ✅ |

## 2. 结构与引用一致性（validate_review_tex.py）

- 正文 `\cite` key 数：66
- `.bib` 条目数：66
- 引用 key 与 BibTeX key：**完全一致**（无悬空引用、无未用条目计入）
- 章节完整性：
  - 摘要：✅（单段）
  - 引言：✅
  - 主体子主题段：6 个（≤7）✅
  - 讨论：✅
  - 展望：✅
  - 结论：✅
- 判定：✅ PASS

## 3. 流程泄露检查（validate_no_process_leakage.py）

- 正文未出现“检索/去重/评分/选文/字数预算”等工作流元叙事。
- 判定：✅ PASS

## 4. 子主题分布

| 子主题 | 对应文献（节选） |
|--------|------------------|
| 变更感知演化 | UTFix, TaRGET, Fix the Tests, Unit Test Update, SymPrompt, ChaCo, Testora, YATE, TestWeaver, Code-A1, Can-LLM-Commit, PR-Aware |
| Web/E2E 修复与自愈 | Practical Limits(Playwright), Semantic Test Repair, Fix Web UI Tests, Self-Healing Review, Visual Change Detection, APR(GAMMA/Hier/Trace/StubCoder), Grey Literature, Industrial Maintenance |
| 稳定性与失效分型 | ReproBreak, WEFix, Time-based Repair, FlakyFix, FlakyGuard, Fragility |
| 变更驱动补充生成 | AutoE2E, Screen Transition Graphs, VISCA, Scenario-Guided, GenIA-E2ETest, ViMoTest, Malleable Mobile |
| 受影响定位支撑 | iJaCoCo, Precise RTS, uRTS, Hybrid RTS, RichTest, NameRTS, Pipeline RTS, Formalizing RTS, CIA SLR, Microscope |
| 评测与可信验证 | ReproBreak, E2EGit, SWT-Bench, Eval-Evolution, TestGen-LLM, TestGen-Meta, Android CI, Agentic PR, 经典生成/综述 |

## 5. 导出

- PDF：`CodeDiff_Playwright_E2E_Repair_review.pdf`（xelatex + bibtex，gbt7714-nsfc）。
- Word：`CodeDiff_Playwright_E2E_Repair_review.docx`（pandoc，--citeproc）。

> 导出工具链状态见会话记录；若编译环境缺失（xelatex/pandoc）将单独记录原因。
