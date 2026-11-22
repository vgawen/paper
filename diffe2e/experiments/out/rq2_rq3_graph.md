# RQ2/RQ3 用 test-code graph 重跑（方法对比）

## RQ2 缺口检测：文件级 → 函数/路由级

旧方法 `coverageGap = 变更单元 − 已选测试覆盖单元`（文件级），只看"整个文件零覆盖"。
图方法 `detectGaps`（`select.mjs`）：函数/路由级"无 `executes`/`navigates` 入边"。

受控主体 c24 上的差异：

| 缺口 | 旧方法（文件级） | 图方法（函数级） |
|---|---|---|
| coupon/faq/wishlist.js::render（新路由） | 抓到（新文件） | 抓到 |
| **util.js::discount / taxCents（未使用函数）** | **漏**（util.js 被 cart/orders 覆盖，不算"零覆盖文件"） | **抓到** |
| 路由 /coupon /faq /wishlist / /basket（无测试访问） | 漏（不是"文件"） | 抓到 |

**改进**：图方法把缺口从"文件粒度"细化到"函数/路由粒度"，能抓出文件级方法看不到的**未使用函数**缺口（discount/taxCents），并给每个缺口提供 route/component 上下文供生成 prompt 使用。

## RQ3 断点诊断：sigMap/segMap 规则 → asserts 边

旧方法 `staleness.classify` 用 `sigMap`（定位器结构映射）+ `segMap`（文本片段映射）两套规则。
图方法 `addStaticTestEdges`（`testEdges.mjs`）：解析测试源码的定位器/断言 → `asserts` 边（test → ui 节点），断点 = 指向变更实体的边。

4 个断裂过渡的图诊断：

| 过渡 | 变更 | 图诊断（asserts 边 → 变更实体） |
|---|---|---|
| c08 | testId cart-add→cart-add-btn | STRUCTURAL_ONLY，修复锚 cart-add→cart-add-btn |
| c20 | testId search-go→search-find | STRUCTURAL_ONLY，修复锚 search-go→search-find |
| c15 | 文案 Welcome→Hi | EXPECTATION_CHANGE，修复锚 Welcome→Hi |
| c21 | 价格 $15.00→$18.00 | EXPECTATION_CHANGE，修复锚 $15.00→$18.00 |

**改进**：诊断从"两套 ad-hoc 规则"统一成"图上的一条边查询"，且天然携带修复锚（旧→新），供修复阶段直接使用。

## 生成/修复质量本身

图的贡献在**缺口检测（RQ2）**和**断点诊断（RQ3）**这两步的输入；生成质量（可执行/变更相关/变异杀伤）与修复成功率是同一套机制（diff 约束 prompt / 规则+LLM 修复）的产物。pro 模型的真实生成/修复数据见 `run_rq2.mjs`/`run_rq3.mjs` 重跑产物。
