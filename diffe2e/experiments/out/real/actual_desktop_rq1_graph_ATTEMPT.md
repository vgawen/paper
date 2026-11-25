# 真实项目逐过渡 graph-selection：未完成记录（2026-11-25）

## 状态

**未完成**。`experiments/real/run_rq1_real_graph.mjs` 已实现并通过语法/流程检查，但在本机无法完成 9 个过渡的回放。

## 失败原因（如实验记录）

| 尝试 | 结果 |
|---|---|
| 1. 用现有 `--filter=blob:none` 部分克隆 checkout 历史 commit | ❌ `could not fetch <sha> from promisor remote`（9/9 过渡全部失败） |
| 2. `git config --unset remote.origin.partialclonefilter` + `git fetch --refetch` | ❌ 只取回部分对象（.git 仅 156M），仍缺 blob |
| 3. 全新 `git clone`（无 filter） | ❌ `fetch-pack: unexpected disconnect` / `early EOF` |
| 4. `git clone --depth 250` | ❌ 同上 |
| 5. `git clone --depth 120 --single-branch` | ❌ 同上 |
| 6. `git sparse-checkout`（只取 desktop-client） | ❌ 根级文件（`.gitattributes`、`.nvmrc` 等）仍在稀疏集内，checkout 仍报缺 blob |

根因：本机到 GitHub 的链路在下载中/大体积传输时反复中断（`curl 92 HTTP/2 stream not closed cleanly`），而该仓库的完整历史约 1GB+。

## 影响与已做的替代

1. **论文正文已给出说明**（§5.1.2 表 5-4 注）：表 5-4 的 14 个过渡是**文件级消融**；函数级归因的结果在 §5.1.1（受控主体 0.625→0.889）与 §5.4（actual-budget 62 用例 NetSaving −5.4%→+83.0~94.6%）；逐过渡回放脚本随代码提供（`experiments/real/run_rq1_real_graph.mjs`，命令见附录 A.2），列入后续工作。

2. **真实项目的函数级证据并未缺席**，已有两条：
   - `validate_real_selection.mjs`：actual-budget 62 条 E2E 的函数级覆盖上，value-reference 把共享文件改动从"选中全部 62 条"缩到 **0–2 条**（文件级无判别力）；
   - `validate_real_routes.mjs`：真实路由提交 `d05bd03` 上，route-level 把"新增路由"正确归为 **0 个测试**（文件级会选 62 条）。

## 复现条件

在可稳定访问 GitHub 的环境执行：

```bash
git clone https://github.com/actualbudget/actual.git real/actual   # 需要完整历史（~1GB）
cd diffe2e && node experiments/real/run_rq1_real_graph.mjs experiments/real/adapters/actual_desktop.json 9
```

预计：每个过渡 2 次全量套件 + 2 次依赖安装，约 10–15 分钟/过渡，9 个过渡约 1.5–2.5 小时。
