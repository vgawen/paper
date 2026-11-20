# 主实验冻结记录

> 冻结时间：2026-11-08（Asia/Shanghai）
> 执行阶段：MVP 扩样 · 阶段一（仅冻结，不跑扩样）
> 记录位置：`diffe2e/experiments/out/expansion_20261108/FREEZE_RECORD.md`
> 哈希清单：同目录 `SHA256SUMS_MAIN.txt`（36 个文件）

---

## 1. 冻结用途

本记录用于把**主实验**的全部指定输入与产物固定在一个可复核的哈希快照上：

- 主实验结果（RQ2 30 条、RQ3 40 条）在人工第二列回收后按现有流程回填，**不再改动实验材料本身**；
- 后续扩样（RQ3 扩展 40 条、受控缺口 3→8、真实项目 tldraw 接入）**不得改写**本清单中的任何文件；
- 若发生任何变更，必须新建文件并登记前后哈希，不得原地覆盖（见 §6 变更控制）。

主实验与扩样批次在论文中分“主实验 / 扩展实验”两段报告，**不合并 p 值或 κ**。

---

## 2. 冻结范围与文件计数

| 类别 | 内容 | 文件数 | 说明 |
|---|---|---:|---|
| A. 两份主表 | `rq2_real_to_annotate.csv`、`rq3_reprobreak_to_annotate.csv` | 2 | RQ2 30 行（15 上下文 × 2 臂）；RQ3 40 行（4 仓各 10） |
| A. 主表解盲键 | `rq2_real_to_annotate_unblind.json`、`rq3_reprobreak_to_annotate_unblind.json` | 2 | 与主表配套，扩样不得改动 |
| B. 盲评材料包 | `out/annotation_packet/` 全部文件 | 9 | 含 `SHA256SUMS` 自身 |
| B. 盲评交接包 | `out/annotation_handover/` 全部文件 | 10 | 含 `SHA256SUMS` 自身 |
| B. 交接包归档 | `out/annotation_handover_20261108.zip` | 1 | 整包发给第二标注者的归档 |
| C. B 正式结果 | `annotator1_masked.json`、`annotator1_masked_manifest.json`、`annotator1_masked_comparison.json`、`annotator1_masked_comparison.md` | 4 | 协议 B 正式列、manifest、原列 vs B 对比 |
| D. 重复运行 | `repeats/masked_run2.json`、`masked_run3.json`、`condA_run2.json`、`condA_run3.json`、`variance_report.json`、`variance_report.md` | 6 | 三次多数票与波动报告 |
| E. 论文当前版本 | `论文初稿_代码变更感知的Web应用端到端回归测试用例选择与生成方法研究.md` | 1 | 冻结时的正文文本 |
| F. 受保护回填文件 | `kappa_backfill.md` | 1 | 当前仍是未回填模板 |
| **合计** | | **36** | 完整 SHA256 见 `SHA256SUMS_MAIN.txt` |

**明确不在本次哈希清单内、但同样只读不改**：`out/rq1_summary.md`、`out/rq1_dataset.jsonl`、`out/rq1_stats.md`、`out/rq2_results.md`、`out/rq2_results.json`、`out/rq3_results.md`、`out/real/real_rq1_stats.md`、`out/real/*_rq1.*`、`out/llm_cost.json`。这些是论文表格的既有数据来源；本阶段按用户列出的清单冻结，未逐文件入哈希，但扩样同样不得改写。

---

## 3. 关键文件哈希（摘录）

| 文件 | SHA256 |
|---|---|
| `out/rq2_real_to_annotate.csv` | `fcdf084a17bc317a69e1932ce1f2e46ac248f3bb3209e9a2c5eeebfd8ffa58cf` |
| `out/rq3_reprobreak_to_annotate.csv` | `755a8c08a9e65014ec623c555192d540b77b4c355edb051deb0158c4f54ed8d2` |
| `out/rq2_real_to_annotate_unblind.json` | `8270293c38d671c33dab8f62e6d401687d8eaf5b1eadc44d841a631e6affb359` |
| `out/rq3_reprobreak_to_annotate_unblind.json` | `da39473115fc034916132c8a983b792be0b753642cce4239b053beea524b304e` |
| `out/annotator1_masked.json` | `716ed5cd9cdf1c38a8081ef317394a08323bbe20c861cec75cdfa8b94c374ed9` |
| `out/annotator1_masked_manifest.json` | `41eb993b780212062cceabc48afd69b03d3acb4306b4768fbbf283bef1d5998d` |
| `out/annotator1_masked_comparison.json` | `004cb549ecbe15018c53dadd70c8674123add3608d26ced9bf574fd59cd50dfa` |
| `out/repeats/variance_report.md` | `ce8a6264695a288cf36cf72f2f4308e2f0083a1053e9daf19ccafb86a16f796b` |
| `out/annotation_handover_20261108.zip` | `f6c1c9737bab3c85c3b3d4113aa6a8d8fbf20f0d89ca27ce3cf9fda786b9b83d` |
| `out/annotation_packet/SHA256SUMS` | `ceed668526956439f3cb62f036f2dfae182d271d9b4cc83ffef636401f7c47e9` |
| `out/annotation_handover/SHA256SUMS` | `20045573dd8680dc2e6134c36a53126152669765a8b952ec3e43d6f272672201` |
| `out/kappa_backfill.md` | `e031a35aadc609fa8c257dd6c5251d1aaed9a086f4e8056e639d546fdefe15fe` |
| 论文初稿 `.md` | `b9e6f00eb75c38796707cfe9504002489a8adbeb630da2c73adce84c3189f807` |
| **哈希清单自身** | `4eb2ed33779ca32a60be321d146422417ef602f83d65fe1c9be02f451bbaabda` |

> `SHA256SUMS_MAIN.txt` 自身的哈希记录在此，但不自包含于清单内（避免自引用）。

---

## 4. 完整性校验（已执行）

1. **`annotation_packet/SHA256SUMS` 校验**：9 个文件全部 `OK`（8 个被列出文件 + 清单自身不参与校验）。
2. **`annotation_handover/SHA256SUMS` 校验**：9 个文件全部 `OK`。
3. **zip 与目录一致性**：`annotation_handover_20261108.zip` 内 10 个文件逐条与 `out/annotation_handover/` 对应文件 SHA256 **全部一致**（`ALL_MATCH True`）。
4. **B manifest 输入哈希交叉核对**：`annotator1_masked_manifest.json` 的 `input_files` 记录
   - `experiments/out/annotation_packet/rq2_worksheet.md` = `aedd6d702a86203c3c4e9d86bd81de463c3ad3ab9b7c7f449e0d32ab9fa5a965`
   - `experiments/out/annotation_packet/rq3_context.md` = `b844e296aabcb7aff95bd5a45db3e508898797a167fdffee03b6ac5a541f3058`
   
   与本次 `SHA256SUMS_MAIN.txt` 中两个文件的哈希一致，说明 B 正式结果使用的输入正是当前冻结材料。
5. **主表状态核对**：
   - `rq2_real_to_annotate.csv`：30 行；`annotator1_yn` 30 条非空；`annotator2_yn` 0 条、`final` 0 条。
   - `rq3_reprobreak_to_annotate.csv`：40 行（angular-slickgrid / koenig / openmct / playwright 各 10）；`human1` 40 条非空；`human2` 0 条、`final` 0 条。
   - `kappa_backfill.md` 仍是“尚未完成双标注评分”的模板。

---

## 5. 冻结后的只读规则

- 本清单内 36 个文件**只读**：不得编辑、覆盖、重命名、删除。
- 扩样所有输出只写 `diffe2e/experiments/out/expansion_20261108/` 及其子目录；不得写入主表路径、主盲评包路径、`kappa_backfill.md` 或论文文件。
- 扩样不得复用主实验的 `case_id` 命名空间：RQ3 扩展使用独立前缀（如 `rbx001..`），RQ2 扩展使用独立前缀（如 `x001..`）。
- 扩样不得把主实验与扩展批次的 p 值、κ、置信区间合并计算；两批分别出表。
- 扩样不得引用主实验盲评包中的条目作为扩展批材料；扩展批必须新建独立包与独立 `SHA256SUMS`。

---

## 6. 变更控制

若确需修改冻结范围内任一文件（例如主表第二列回填），按以下流程：

1. 先复制原文件到同目录备份并记录原哈希；
2. 在 `expansion_20261108/CHANGELOG.md` 写明文件、原因、改前/改后哈希；
3. 重新生成本阶段的 `SHA256SUMS_MAIN.<日期>.txt`，不覆盖旧清单；
4. 论文与实验记录中注明“主实验数据在冻结后发生过回填/变更”。

当前阶段**未发生任何变更**：仅新增 `expansion_20261108/` 下的冻结记录与哈希清单，未触碰冻结文件（后续变更见 §8）。

---

## 7. 复现校验命令

```bash
cd /Users/dd/gdb/paper
shasum -a 256 -c diffe2e/experiments/out/expansion_20261108/SHA256SUMS_MAIN.txt
```

说明：`shasum -c` 使用清单中的相对路径，需要在仓库根目录执行。若要单独复核盲评包：

```bash
cd diffe2e/experiments/out/annotation_packet && shasum -a 256 -c SHA256SUMS
cd ../annotation_handover && shasum -a 256 -c SHA256SUMS
```

---

## 8. 变更 2026-11-08：c03/nodiff 复核修正（作者批准）

> 授权：作者批准按取证结论修正，并要求主表/论文同步、冻结清单不覆盖。
> 时间：2026-11-08（Asia/Shanghai）
> 旧清单 `SHA256SUMS_MAIN.txt`、`SHA256SUMS_MAIN_after_kappa_fix.txt` 保持不动；新增 `SHA256SUMS_MAIN_after_c03_fix.txt`（41 项 = 原 36 个冻结文件 + 3 个主结果来源 + 2 个取证文件）。

### 8.1 修正原因

c03/nodiff 一格的原记录（executable=true、killed=2/3、change_sensitive=true、semantic_auto=true）与冻结用例的实际执行不符：

- 冻结 spec 在 c03 与 V_old(c02) 上均以 `strict mode violation: getByText(/Cart/i) resolved to 3 elements` 失败；
- 该 spec 覆盖率不含 `src/coupon.js`，不可能杀死 coupon 变异；
- 在 V_old 上同样失败，不构成版本敏感。

在钉住 Playwright 1.61.0（lockfile）+ Chrome for Testing 149.0.7827.55（chromium build 1228）的环境下重跑：c03/nodiff 复现为不可执行；其余五个受控执行格（c03/diff、c13/diff、c13/nodiff、c19/diff、c19/nodiff）逐格与主表一致。判定为记录/装配问题而非环境漂移。取证见 `out/repro_c03_20261108/REPRO_C03_FORENSICS.md`，逐格原始结果见 `out/repro_c03_20261108/repro_rq2_cells.json`。

### 8.2 改前 / 改后

| 项目 | 改前 | 改后 |
|---|---|---|
| c03/nodiff `executable` | true | false |
| c03/nodiff `killed` / `mutants` | 2 / 3 | 0 / 0 |
| c03/nodiff `change_sensitive` | true | false |
| c03/nodiff `semantic_auto` | true | false |
| nodiff 臂 executable-rate | 0.3333 | 0.0 |
| nodiff 臂 change-relevant-rate | 0.0 | 0.0 |
| nodiff 臂 变异杀伤均值 | 0.2222 | 0.0 |
| nodiff 臂 版本敏感率 | 0.3333 | 0.0 |
| nodiff 臂 自动语义有效率 | 0.3333 | 0.0 |
| diff 臂（全部指标） | 1.0 / 1.0 / 0.6667 / 1.0 / 1.0 | 不变 |

### 8.3 哈希变化

| 文件 | 改前 SHA256 | 改后 SHA256 |
|---|---|---|
| `out/rq2_results.json` | `3cb697e9913bc69ddfa3a059b3827e5f8ac074f5b45edfc4f09280fd97bc32af` | `af692acbffeea7aba044b647427568e6b1b3bd58bfbde18b597e6d27a5548d7c` |
| `out/rq2_results.md` | `80925a4570c79b8e6c8e6b0a725e4466c49e978441d0f2047d73abfa15cd3383` | `9610c456ee6c0f865bd8699063e0c9f69894a99bda5e3d7bb4075d0b3db05cd3` |
| `out/aggregate.json` | `05e0e4154fdffbfb6b48525e3784b175f5dbe9f0faf2f5d32e0be9a4b7ef6593` | `7d4b79ce52ea626be070fad6092500704072e03479e1f7a4fd6f3ffa512eef0a` |
| 论文初稿 `.md` | `511a0131b899f4c2b20aa1149866cc9a41a831b37c279c223c7bf04c5558d380` | `090b606a1ad190ead77939f2603f4bd5d08ccaddfcf3f5b7180a2113151348f6` |
| `out/repro_c03_20261108/REPRO_C03_FORENSICS.md` | 新增 | `7039809724d382c42c2fdcd658d0ccdab7a7ae728e70e45f7073904586859ec6` |
| `out/repro_c03_20261108/repro_rq2_cells.json` | 新增 | `d5110babb53c08ce8086aa667509c356763cc8850519350a48dcf192b55a28a6` |
| `SHA256SUMS_MAIN_after_c03_fix.txt`（清单自身） | 新增 | `24b331a1a96c656dcd647ff4c7c3951590a60c5c3c846031020d6cc085cb798d` |

### 8.4 披露位置

- 论文 §5.2 表 5-5 nodiff 行改为全 0；正文“仅 1/3 可执行”改为“0/3 可执行”，并新增一段复核披露（该格记录与执行不符、重跑更正、其余五格逐格一致）。
- 论文 §6“构造效度”补一句同义说明。
- `docs/THESIS_MAPPING.md`、`总体任务与进度跟踪.md`、`质量对比评估报告_外部评阅论文与本项目初稿.md`、`EXPERIMENT_REPORT.md` 同步旧值。

### 8.5 校验

```bash
cd /Users/dd/gdb/paper
shasum -a 256 -c diffe2e/experiments/out/expansion_20261108/SHA256SUMS_MAIN_after_c03_fix.txt
```

### 8.6 阶段三报告中的主实验参考同步（同日）

§8.4 同步后，全文复查又发现阶段三缺口报告仍把主实验 nodiff 的**旧记录**作为只读参考引用（`0.3333 / 0 / 0.2222 / 0.3333 / 0.3333`）。这两处不是主实验结果文件，而是阶段三对主表的引用；为避免后续合并时把旧值带入扩样表，按同一取证结论同步修正，并在原位置标注复核日期。

| 文件 | 改前哈希 | 改后哈希 |
|---|---|---|
| `gaps/rq2_expansion_old.md` | `b7fdd69991a359d3d370f4d7086c33a93734c0f2e8213c8f7d9c64ad4369b3fe` | `96000b65ad0ea7a9b0edb33d946de99d5b0010a2ba3a1874577569aea2488242` |
| `gaps/EXPANSION_GAPS_REPORT.md` | 未在原清单登记 | `d16ba8528969badabe86e203f9642117e679d2ee6244f99d2c57d21dcf78d47d` |

- 原 `gaps/SHA256SUMS_EXPANSION_GAPS.json` 保持不动；修正后的同名集合另存为 `gaps/SHA256SUMS_EXPANSION_GAPS_after_c03_fix.json`（含 7 个文件，已用 `shasum -a 256 -c` 逐项通过）。
- 其余阶段三文件（`manifest_expansion.json`、`rq1_expansion.json`、`rq2_expansion_results.json`、`rq2_expansion_mutants.json`、`rq2_expansion_new5.md`）哈希未变，原值可直接复用。
- 残留的旧数字只应出现在两类位置：本记录 §8.2 的“改前”列、`out/repro_c03_20261108/REPRO_C03_FORENSICS.md` 的“改前”栏（取证留档），以及与本结果无关的统计量（如 Cliff δ 的 0.3333、κ 一致性“无 1/3”、dry-run 独立记录）。

---

## 9. 变更 2026-11-12：盲评交接包重打包（作者批准）

> 授权：作者要求按“发出去就经不起反悔”的标准复核并重打包，只改悬空引用、剔除作者侧文件、重算哈希。
> 时间：2026-11-12（Asia/Shanghai）
> 旧包 `out/annotation_handover_20261108.zip` 的 SHA-256 `f6c1c9737bab3c85c3b3d4113aa6a8d8fbf20f0d89ca27ce3cf9fda786b9b83d` **已作废**，不得再作为交付物。
> 新包：`out/annotation_handover_20261112.zip`，SHA-256 `acb3dcdae87106c8e571d5a161f7cb7eb1211e9b02369e188e98c5d9b88ead01`，245024 字节。

### 9.1 变更原因

1. 交付材料中存在悬空引用：`03_RQ3_worksheet.md` 等指向已决定剔除的 `07_DO_NOT_LOOK.md`；旧 `annotation_packet/rq3_context.md` 等指向包外 `ANNOTATION_GUIDE.md`。
2. `06_LOCK_AND_SEND.md` 属作者操作说明，`07_DO_NOT_LOOK.md` 列有包外答案文件模式、分组词与脚本清单，均不应随盲评包发放。
3. `ANNOTATION_GUIDE.md` §4.4 判据边界下的三条举例含 `rb033`/`rb039`/`rb040` 与“协议 B”，需在指南内明确标注不随盲评材料发放。

### 9.2 最终交付与自留

发给盲评者（新 zip 内 8 项 = 7 个文件 + `SHA256SUMS`）：

- `README.md`
- `01_START_HERE.md`
- `02_RQ2_worksheet.md`
- `03_RQ3_worksheet.md`
- `04_RQ2_fill_template.csv`
- `05_RQ3_fill_template.csv`
- `08_RQ3_LABELS.md`
- `SHA256SUMS`

作者自留、不发出：

- `out/annotation_handover_author/06_LOCK_AND_SEND.md`
- `out/annotation_handover_author/07_DO_NOT_LOOK.md`

### 9.3 哈希变化

| 文件 | 改前 SHA256 | 改后 SHA256 |
|---|---|---|
| `out/annotation_handover_20261108.zip` → `out/annotation_handover_20261112.zip` | `f6c1c9737bab3c85c3b3d4113aa6a8d8fbf20f0d89ca27ce3cf9fda786b9b83d` | `acb3dcdae87106c8e571d5a161f7cb7eb1211e9b02369e188e98c5d9b88ead01` |
| `out/annotation_handover/01_START_HERE.md` | `4274098f1f737932d57ae9ea1a61be81ded63e003b8c337e4465ce8554557dbe` | `a60f23bf01590d8a7817dd17feb5c8030efa4cf97b0b17ce13f129da94e3fd93` |
| `out/annotation_handover/02_RQ2_worksheet.md` | `b68ff04166b68244c3aed634f670fb4625b32a668ec951425f96e40bfdb5f25a` | `53db7f0bfd619c8ca2087e770d5dd59cd8e0502353117f0f868395007985f445` |
| `out/annotation_handover/03_RQ3_worksheet.md` | `2dc355aada1915415418e30b90e4a53f726407b888c6f335c48dc771d33115fa` | `45a6bb17b497cad7c171affc5b1d2e26ca4da65c93ffc8c8314bc701ff0206f2` |
| `out/annotation_handover/README.md` | `ad5460a3652e25ca26cea750e2b603e2aacbf44800f2a3fc43719060a8aef327` | `519b91bb122f2d80a27c278376329b46e0fc68fe65127856999b0aefee15a53d` |
| `out/annotation_handover/SHA256SUMS` | `20045573dd8680dc2e6134c36a53126152669765a8b952ec3e43d6f272672201` | `d1ae445ea5c29179e4781fccd9a535a77f1075e9abd3fb4b0f42f5d3c3a559a7` |
| `out/annotation_packet/ANNOTATOR_INSTRUCTIONS.md` | `50ad85790e0fb17bdccc490e4a0c122cf2c98b2aa40b046cfbb3eed94b6bea09` | `ce1932ca7cf14a1ac323644bee980370ac176182e7bad9d077d39da97f0d70ea` |
| `out/annotation_packet/rq2_worksheet.md` | `aedd6d702a86203c3c4e9d86bd81de463c3ad3ab9b7c7f449e0d32ab9fa5a965` | `81fb8d5859bc33d773ebebd7e6427239c9e76d99eed7ae28952a2c9a7b073519` |
| `out/annotation_packet/rq3_context.md` | `b844e296aabcb7aff95bd5a45db3e508898797a167fdffee03b6ac5a541f3058` | `d8cf22191c467eccde5fdf0bf6fa5584fb2fa9a7332cc8f93286188ca5caa469` |
| `out/annotation_packet/SHA256SUMS` | `ceed668526956439f3cb62f036f2dfae182d271d9b4cc83ffef636401f7c47e9` | `86c6993d27e0e1291d8b4990205b1b474100d56eb8ee6486eb62b188ba9d601d` |
| `annotate/ANNOTATION_GUIDE.md` | 不在原清单 | `0032857437cebf7fff141084a362fb95b9088d1bba7e5881f20af87b28f3660d` |

`06`/`07` 内容未改，仅移动位置：`06` = `8f18cbcc9adc1137ea6cdeca3bb47d35b66095d6b074140af7b00d898c3f4d5f`，`07` = `b1200309a35c9d54ad854b3290f8e307d8937f09ed564933819a0b9853338006`。`04`、`05`、`08` 哈希未变。

### 9.4 新哈希清单

- 新增 `out/expansion_20261108/SHA256SUMS_HANDOVER_20261112.txt`（新 zip + 包内 8 项 + 自留 2 项，共 11 行），已用 `shasum -a 256 -c` 逐项通过。
- 清单自身 SHA-256：`69a523f0145d60d6795e563c7fa88ff65614d1d6597a9f6cedf44ad5d8896ff4`。
- 原 `SHA256SUMS_MAIN.txt`、`SHA256SUMS_MAIN_after_kappa_fix.txt`、`SHA256SUMS_MAIN_after_c03_fix.txt` 保持不动，仅代表历史快照。

### 9.5 披露

- 旧 zip 哈希自此只应出现在本记录 §9.3 的“改前”列与历史清单中；对外交付与论文引用一律使用新包 `annotation_handover_20261112.zip`。
- `annotation_packet/` 为早期版本，未进入新 zip；本次只清理其包外引用并重算其自身 `SHA256SUMS`，不改变其材料内容。
