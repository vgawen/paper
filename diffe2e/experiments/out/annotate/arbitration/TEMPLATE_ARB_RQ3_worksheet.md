# 第三方裁决工作表 · RQ3（0 条）

本页只收录两方判断不一致的条目。判断甲 / 判断乙的来源与身份已隐去；每条中甲乙的位置按固定随机种子打乱，不代表先后、优劣或可信度。

裁决与理由请回填 `ARB_RQ3_adjudication.csv`，本页仅供阅读，不要修改。

判据原文（`ANNOTATION_GUIDE.md §4.3 + §4.4 判据边界`，未改写）：

```text
| 你看到的情况 | 填 |
|---|---|
| 只是定位器写法、DOM 层级、class/id、文案锚点、测试 API（`page.$`→`page.locator`）或框架迁移变了；测试想验证的东西没变 | `STRUCTURAL_ONLY` |
| 测试要验证的业务结果/断言目标本身变了；旧断言还在检查旧行为 | `EXPECTATION_CHANGE` |
| commit 像是修 bug/改行为，旧测试失败也可能是真的回归；看不出是测试老了还是应用坏了 | `SUSPECTED_REGRESSION` |
| 测试自身 flaky，只是把定位器改精确，意图不变 | `STRUCTURAL_ONLY` |
| 测试自身的严格化（等待条件细化、选择器收紧、新增 `filter`/`hasText`、改用更精确的 role+name、加 `toHaveCount` 等），但被验证的应用行为/业务结果未变 | `STRUCTURAL_ONLY` |
| 业务对象实质变化（例如 markdown 卡片改成 codeblock 卡片） | `EXPECTATION_CHANGE` |

**判据边界（2026-11-08 作者确认）**：测试自身的严格化——等待条件细化、选择器收紧、新增 `filter`/`hasText`、改用更精确的 role+name、增加 `toHaveCount` 等——**不构成 `EXPECTATION_CHANGE`**；只有被验证的应用行为/业务结果改变时才判 `EXPECTATION_CHANGE`。
```

---
