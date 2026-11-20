# RQ3 扩展批次报告（阶段二）

- 批次目录：`experiments/out/expansion_20261108/rq3`
- 主实验：RQ3 40 条（每仓 10，hash 前 10），模型列常量 `STRUCTURAL_ONLY`，**不重跑、不改表**。
- 扩展批次：RQ3 40 条（每仓第 11–20 条，case_id `rbx001`–`rbx040`）。
- 两批统计不合并；本报告只描述扩展批次，并与主实验做构成对照。

## 1. 扩展批分布

### 1.1 抽样与池量

| 仓库 | 池量 | 主实验 | 扩展批 | 扩展批抽样比 | 两批合计抽样比 |
|---|---:|---:|---:|---:|---:|
| ghiscoding/angular-slickgrid | 245 | 10 | 10 | 4.1% | 8.2% |
| microsoft/playwright | 45 | 10 | 10 | 22.2% | 44.4% |
| nasa/openmct | 46 | 10 | 10 | 21.7% | 43.5% |
| tryghost/koenig | 78 | 10 | 10 | 12.8% | 25.6% |

> 为什么保持每仓等额、不改按池比例：主实验是 4 仓各 10；若把 80 条按 245:78:46:45 分配，angular-slickgrid 会占近 6 成，openmct/playwright 各不足 10 条，直接破坏与主实验的可比性，也让小仓类别覆盖更薄。因此扩展批沿用“每仓 10 + 10”的等额设计，与主实验同构。代价是小仓抽样比偏高（见上表），报告中已如实列出，不能把 80 条当作 414 池的无偏代表。

### 1.2 可观测分层（不依赖系统标签）

- 框架：cypress=10，playwright=30。
- 定位器族：cy.get / cy.contains=10，locator=7，getByTestId=2，getByRole=15，getByText-like=1，css / $=5。
- 应用信号：app_files>0=37，app_files=0=3。

### 1.3 真实分诊分布

- 有效分诊：40/40；调用尝试总数 45；失败 0。
- 总体：STRUCTURAL_ONLY=38，SUSPECTED_REGRESSION=2。
- 分仓：

  - ghiscoding/angular-slickgrid：STRUCTURAL_ONLY=10
  - microsoft/playwright：STRUCTURAL_ONLY=8，SUSPECTED_REGRESSION=2
  - nasa/openmct：STRUCTURAL_ONLY=10
  - tryghost/koenig：STRUCTURAL_ONLY=10

## 2. 与主实验 40 条的对照

| 维度 | 主实验 40 | 扩展 40 |
|---|---|---|
| 抽样位置 | 每仓 hash 前 10 | 每仓 hash 第 11–20 |
| 与对方重叠 | — | 0 条 |
| 仓库构成 | ghiscoding/angular-slickgrid=10，microsoft/playwright=10，nasa/openmct=10，tryghost/koenig=10 | ghiscoding/angular-slickgrid=10，microsoft/playwright=10，nasa/openmct=10，tryghost/koenig=10 |
| 模型侧口径 | 常量 STRUCTURAL_ONLY：STRUCTURAL_ONLY=40 | 真实分诊：STRUCTURAL_ONLY=38，SUSPECTED_REGRESSION=2 |
| 人工协议 B 正式列 | SO=40 / EC=0 / SR=0 | 待第二标注者回收（本批未做人工） |
| 统计处理 | 主实验单独报告 | 扩展批次单独报告，不合并 κ / 不合并 p 值 |

### 2.1 真实分诊与常量标签的差异

- 主实验模型侧不是逐条分类器，而是常量 `STRUCTURAL_ONLY`（40/40）；它只用于退化展示，不能与真实分诊混为一谈。
- 扩展批次真实分诊得到：STRUCTURAL_ONLY=38，SUSPECTED_REGRESSION=2。
- 因此两批的“模型-人工一致性”不可直接比较；扩展到 80 条时也只能分两段报告，不能把常量 40 与真实分诊 40 拼成一个分类器的 n=80。

## 3. 材料包与校验

- 独立盲评包：`experiments/out/expansion_20261108/rq3/annotation_packet_expansion`，6 个文件，独立 `SHA256SUMS`。
- 校验方式：在包目录执行 `shasum -a 256 -c SHA256SUMS`。
- 遮蔽泄漏复核：40/40 PASS（按协议 B 规则重做）。
- 语义锚同形说明：7/40 条的断言级差异中出现与允许可见语义锚（role+name / text）字面相同的新定位器；这是协议 B 明确保留可见的语义信息，不属于机械寻址路径泄漏。机械路径泄露命中为 0。

## 4. 边界声明

- 主表哈希（本阶段前后不变）：`rq3_reprobreak_to_annotate.csv` = `755a8c08a9e65014ec623c555192d540b77b4c355edb051deb0158c4f54ed8d2`。
- 主解盲键哈希：`rq3_reprobreak_to_annotate_unblind.json` = `da39473115fc034916132c8a983b792be0b753642cce4239b053beea524b304e`。
- 主实验盲评包、主表、冻结清单未改动；本阶段所有产物只写 `expansion_20261108/rq3/`。
- 主实验模型侧不重跑；扩展批次真实分诊结果不回填主实验。
- 阶段三（受控缺口扩样）未开始。

