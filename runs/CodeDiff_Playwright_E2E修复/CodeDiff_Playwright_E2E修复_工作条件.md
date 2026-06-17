# 工作条件记录：面向代码变更的 Playwright 端到端测试自动修复研究综述

> 本文件记录本次综述的输入、文献池、评分与选文、结构与字数预算、校验结果等工作流信息（不进入正文）。

## 1. 输入

- 主题：面向代码变更（Code Diff）的 Playwright 端到端（E2E）测试自动修复（以修复为重心，变更约束生成为辅）。
- 来源：基于已收集并核实的 66 篇文献（见《文献来源与下载链接总表.md》《文献分类整理_CodeDiff_Playwright_E2E.md》）与研究计划《开题报告_基于CodeDiff的Playwright_E2E测试自动修复_精简版.md》。
- 档位：Standard（标准级）。选择理由：现有文献池为 66 篇，落在 Standard 参考区间 [50, 90] 内；Premium 区间 [80, 150] 无法在不引入新检索的前提下满足。
- 目标正文字数：6000–10000（中文按字、英文按词计）。
- 目标参考文献数：50–90。
- 语言：中文（学术）。

## 2. 文献池与检索说明

- 本次未做新增联网检索；直接复用既有 66 篇已去重、已分类（A 核心 18 / B 支撑 30 / C 前沿 18）的文献池。
- 结构化产物（隔离目录 `.systematic-literature-review/` 内）：
  - `papers.jsonl`：66 篇规范化元数据（题录、年份、venue、DOI/arXiv、摘要要点）。
  - `scored_papers.jsonl`：含相关性评分（1–10）与子主题标签。
  - `selected_papers.jsonl`：最终选入集合（66 篇全部选入）。

## 3. 评分与子主题

- 评分口径：1–10 分语义相关性。映射规则：A 类核心多为 8–9 分，B 类支撑多为 5–6 分，C 类前沿 5–7 分（以与“Code Diff × Playwright × E2E 修复”主线的贴近度为准）。
- 子主题（写作锚点，6 个主体段）：
  1. `change_aware_gen` / `change_aware_repair` → 变更感知的测试演化（范式迁移）。
  2. `web_repair` → Web 与 E2E 测试修复与自愈。
  3. `stability` → E2E 稳定性与失效分型（定位符断裂 / 异步 flaky / 脆弱性）。
  4. `e2e_gen` → 变更驱动的 E2E 用例补充生成。
  5. `rts_cia` → 受影响测试定位的工程支撑（RTS / CIA）。
  6. `benchmark` / `industry` / `llm_gen_foundation` / `apr` / `survey` → 评测资源、工业实践与可信验证。

## 4. 选文策略

- 因文献池规模（66）恰落在 Standard 参考区间内，采取“全选”策略，保证课题对标完整性。
- 高分优先用于写作权重（A 类作为主张证据，B/C 类作为背景、对照与空白论证）。

## 5. 字数预算（综述写作锚点）

| 区块 | 角色 | 目标字数（约） |
|------|------|----------------|
| 摘要 | 无引用 | 250 |
| 引言 | 引用+背景 | 900 |
| 子主题①变更感知演化 | 引用为主 | 1300 |
| 子主题②Web/E2E 修复与自愈 | 引用为主 | 1200 |
| 子主题③稳定性与失效分型 | 引用为主 | 900 |
| 子主题④变更驱动补充生成 | 引用为主 | 800 |
| 子主题⑤受影响定位支撑 | 引用为主 | 800 |
| 子主题⑥评测与可信验证 | 引用为主 | 900 |
| 讨论 | 引用+论辩 | 700 |
| 展望 | 研究议程 | 800 |
| 结论 | 无引用 | 350 |
| 合计 |  | 约 7900 |

- 综/述比例：约 0.55 综（梳理证据）/ 0.45 述（评析与边界），引用段约 0.7、无引用段约 0.3。

## 6. 校验结果

- `validate_counts.py`（standard）：words_total=7329（中文 7002 / 英文 327），cite_keys=66 → **PASS**（区间 6000–10000 / 50–90）。
- `validate_review_tex.py`：cites=66，bib_keys=66（完全一致），sections={abstract, intro, body×6, discussion, outlook, conclusion} → **PASS**。
- `validate_no_process_leakage.py`：未检测到流程泄露 → **PASS**。

## 7. 交付物清单

- `CodeDiff_Playwright_E2E_Repair_review.tex`：正文 LaTeX 源（唯一正文文件）。
- `CodeDiff_Playwright_E2E_Repair.bib`：66 条参考文献 BibTeX（稳定语义 key）。
- `CodeDiff_Playwright_E2E_Repair_review.pdf`：编译产物（xelatex + bibtex，gbt7714-nsfc 样式）。
- `CodeDiff_Playwright_E2E_Repair_review.docx`：Word 可编辑版（pandoc）。
- `CodeDiff_Playwright_E2E修复_工作条件.md`（本文件）。
- `CodeDiff_Playwright_E2E修复_验证报告.md`：校验汇总。

## 8. 备注与风险

- 与既有《文献综述_基于CodeDiff的Playwright_E2E测试自动生成与修复.md》（综合版、66 篇、生成与修复并重）相比，本文为**以修复为实验重心**的精简对标版本，章节按“修复主线 + 生成补全”重排，主张更聚焦“以 diff 为一等修复上下文 + 判别先行 + 可复现评测”。
- 部分 2026 年文献仍处预印本阶段，作者与 venue 字段以已核实信息为准；个别 arXiv 条目作者信息缺失（标记为匿名占位），不影响引用编号与正文论证。
