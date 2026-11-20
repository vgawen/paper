# RQ3 第一标注者（LLM 辅助）逐条判定与理由

> 本文件仅供第一标注者/仲裁使用，不提供给第二标注者。
> 判定依据：旧测试行、同一 hunk 的断言变化、commit 说明与应用源码改动文件；new_locator 仅作参考。

| case_id | label | 理由 |
|---|---|---|
| rb001 | STRUCTURAL_ONLY | 菜单新增子菜单，旧定位器指向父容器，开发者仅将定位器细化到子菜单容器；测试意图与断言不变。 |
| rb002 | STRUCTURAL_ONLY | v4 大版本迁移，定位器仅 style 属性字符串的空格/分号格式变化；目标单元格与断言不变。 |
| rb003 | STRUCTURAL_ONLY | 同一迁移，单元格索引由 nth(3) 调整为 nth(2)，属于 DOM 结构/索引变化，断言内容不变。 |
| rb004 | STRUCTURAL_ONLY | style 属性格式变化，目标与断言不变。 |
| rb005 | STRUCTURAL_ONLY | style 属性格式变化，目标与断言不变。 |
| rb006 | STRUCTURAL_ONLY | style 属性格式变化，目标与断言不变。 |
| rb007 | STRUCTURAL_ONLY | style 属性格式变化，目标与断言不变。 |
| rb008 | STRUCTURAL_ONLY | style 属性格式变化，目标与断言不变。 |
| rb009 | STRUCTURAL_ONLY | style 属性格式变化，目标与断言不变。 |
| rb010 | STRUCTURAL_ONLY | style 格式变化且行偏移 4→3，属于表格行结构变化，断言仍为 checkbox checked。 |
| rb011 | STRUCTURAL_ONLY | 应用将 builtinSetTimeout 改为 builtins.setTimeout，测试仅跟随 API 迁移，测试意图不变。 |
| rb012 | STRUCTURAL_ONLY | 树组件重构后可用 name 选项替代 filter({hasText})，目标仍是 passes 节点。 |
| rb013 | STRUCTURAL_ONLY | 树组件重构，ARIA role 由 listitem 改为 treeitem，目标节点不变。 |
| rb014 | STRUCTURAL_ONLY | 树组件重构，filter hasText 改为 name、getByTitle 改为 getByRole button；测试意图不变。 |
| rb015 | STRUCTURAL_ONLY | 树组件重构，定位器 API 更新，目标节点与操作不变。 |
| rb016 | STRUCTURAL_ONLY | ARIA role listitem→treeitem，目标 answer 节点不变。 |
| rb017 | STRUCTURAL_ONLY | ARIA role listitem→treeitem，目标 b.test.ts 节点不变。 |
| rb018 | STRUCTURAL_ONLY | ARIA role listitem→treeitem，目标 c.test.ts 节点不变。 |
| rb019 | STRUCTURAL_ONLY | ARIA role listitem→treeitem，目标 d.test.ts 节点不变。 |
| rb020 | STRUCTURAL_ONLY | ARIA role listitem→treeitem，目标 a.test.ts 节点不变。 |
| rb021 | SUSPECTED_REGRESSION | 断言语义发生反转：旧断言 Units 单元格可见，新断言 Timestamp 列头隐藏；无法确认是测试随重构更新还是掩盖了真实回归，保守判疑似回归。 |
| rb022 | STRUCTURAL_ONLY | 为 Type 单元格增加 exact 精确匹配，目标与可见性断言不变。 |
| rb023 | STRUCTURAL_ONLY | 为 Type 单元格增加 exact 精确匹配，目标与可见性断言不变。 |
| rb024 | EXPECTATION_CHANGE | 断言目标由 Type 单元格改为 Timestamp 单元格，验证的列发生实质变化；不是单纯定位器重写。 |
| rb025 | STRUCTURAL_ONLY | 测试 API 迁移：waitForSelector 改为 locator().hover({trial:true})，测试意图不变。 |
| rb026 | STRUCTURAL_ONLY | 测试 API 迁移：waitForSelector(detached) 改为 locator().waitFor({state:detached})，意图不变。 |
| rb027 | STRUCTURAL_ONLY | 测试 API 迁移：waitForSelector 改为 locator().waitFor()，断言改为 toHaveCount(0)，语义等价。 |
| rb028 | STRUCTURAL_ONLY | Y 轴标签的 DOM 容器类名变化，测试目标仍是 series color swatch。 |
| rb029 | STRUCTURAL_ONLY | 按钮文案大小写由 OK 改为 Ok，属于文案锚点变化，测试意图不变。 |
| rb030 | STRUCTURAL_ONLY | 按钮 title 由 More options 改为 More actions，属于文案锚点变化，测试意图不变。 |
| rb031 | STRUCTURAL_ONLY | 测试框架从 vitest 迁移到 Playwright，page.$ 改为 page.locator；测试意图不变。 |
| rb032 | STRUCTURAL_ONLY | 测试框架迁移，page.$ 改为 page.locator；测试意图不变。 |
| rb033 | EXPECTATION_CHANGE | 测试输入与目标卡片类型由 markdown 改为 codeblock（插入方式也改为 ```），断言目标发生实质变化；这是测试自身的 flaky 修复。 |
| rb034 | STRUCTURAL_ONLY | 测试框架迁移，page.$ 改为 page.locator；测试意图不变。 |
| rb035 | STRUCTURAL_ONLY | flaky 测试修复：waitForSelector 改为 locator + filter(snippet) + toBeVisible，目标仍是 cardmenu 选中项，意图不变。 |
| rb036 | STRUCTURAL_ONLY | testid 由 audio-caption 更名为 audio-title，断言（标题输入值）保持不变。 |
| rb037 | STRUCTURAL_ONLY | testid 更名 audio-caption→audio-title，可见性断言保持不变。 |
| rb038 | STRUCTURAL_ONLY | testid 更名 audio-caption→audio-title，可见性断言保持不变。 |
| rb039 | STRUCTURAL_ONLY | flaky 测试修复：waitForSelector 改为 locator + filter(snippet) + toBeVisible，目标仍是 cardmenu 选中项。 |
| rb040 | STRUCTURAL_ONLY | flaky 测试修复：waitForSelector 改为 locator + filter(snippet) + toBeVisible，目标仍是 cardmenu 选中项。 |

合计：{'STRUCTURAL_ONLY': 37, 'SUSPECTED_REGRESSION': 1, 'EXPECTATION_CHANGE': 2}。
