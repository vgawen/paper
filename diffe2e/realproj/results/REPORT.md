# 真实项目可插桩闸门报告 (Phase 7, best-effort)

| 项目 | Playwright | 覆盖方法 | E2E用例 | 已有逐用例覆盖 | commits | 闸门 | 可replay |
|---|---|---|---|---|---|---|---|
| cand_coverage | true | istanbul (vite-plugin-istanbul) | 3 | true | 1(浅) | PASS (per-test coverage produced) | false |
| cand_movies | true | CDP page.coverage | 71 | false | 1(浅) | PASS (method available) | false |

## 结论
- 受控主体（subject/）提供 RQ1–RQ3 的定量数字（真实 git 历史、可复现）。
- 真实项目用于验证“插桩 + 语义 UI Diff”闸门是否迁移到真实 React+Vite+Playwright 工程：
  - cand_coverage：vite-plugin-istanbul 已集成、cov_pertest 逐用例覆盖已产出、其真实 JSX 组件上的 Semantic UI Diff 已在 pipeline 单测夹具中验证 → 闸门 PASS。
  - 两个克隆均为浅克隆（1 commit），离线无法做跨多 commit 的真实 replay；
    需 `git fetch --unshallow` + 每个 commit 可运行环境才能产出真实历史的 Reduction/Safety/Precision。
- 这是外部效度的“尽力而为”证据，不阻塞主结论；多 commit 真实 replay 列为后续工作。
