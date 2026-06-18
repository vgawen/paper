下面给出一套可用于研究实现的系统设计，我把它命名为 **Diff2E2E-TIA：面向 Code Diff 的 Playwright E2E 影响分析与场景检索系统**。

核心思想是：

> **把 PR diff 先投影到“系统影响图”，再从影响图中检索、排序、补充生成和修复 E2E 场景。**

它不是简单的“文件改了就跑某些 spec”，而是建立一条可维护的链路：

```text
Code Diff
  → changed code entities
  → component / route / API / state / flag / permission / event / cache
  → semantic UI diff
  → capability / business scenario
  → impacted Playwright tests
  → selected / generated / repaired E2E suite
```

Playwright 本身已经提供了很适合作为运行时证据的数据来源：Trace Viewer 可展示测试动作、使用的 locator、源代码位置、DOM snapshots、console 和 network 请求等信息；它还支持 tags / annotations 与 `--grep` 过滤执行测试；Coverage API 可采集页面使用过的 JavaScript/CSS 片段，不过官方说明该覆盖率 API 仅支持 Chromium 系浏览器。([Playwright][1]) 研究上，这也契合回归测试选择的主线：近期综述强调 traceability 在连接 code changes、requirements、test cases、faults 并支撑测试选择和优先级排序中的作用；工业界 targeted test selection 研究也倾向把变更文件、历史结果、跨文件特征等作为预测信号。([Springer Link][2])

---

## 1. 系统总体架构

可以分为七层。

```text
┌────────────────────────────────────────────┐
│ 1. PR Diff Ingestion                        │
│    Git diff, PR text, issue, commit message │
└────────────────────────────────────────────┘
                  ↓
┌────────────────────────────────────────────┐
│ 2. Static Impact Analyzer                   │
│    AST, import graph, call graph, routes,   │
│    components, API clients, flags, config   │
└────────────────────────────────────────────┘
                  ↓
┌────────────────────────────────────────────┐
│ 3. Runtime Trace Collector                  │
│    Playwright trace, coverage, network,     │
│    DOM snapshots, console, server logs      │
└────────────────────────────────────────────┘
                  ↓
┌────────────────────────────────────────────┐
│ 4. Heterogeneous Impact Graph               │
│    Code ↔ UI ↔ API ↔ capability ↔ test      │
└────────────────────────────────────────────┘
                  ↓
┌────────────────────────────────────────────┐
│ 5. Diff Projection & Impact Propagation     │
│    changed entities → affected subgraph     │
└────────────────────────────────────────────┘
                  ↓
┌────────────────────────────────────────────┐
│ 6. Scenario Retrieval / Ranking             │
│    select, prioritize, explain tests        │
└────────────────────────────────────────────┘
                  ↓
┌────────────────────────────────────────────┐
│ 7. Execution Feedback Loop                  │
│    run selected tests, generate missing     │
│    tests, repair obsolete tests, update graph│
└────────────────────────────────────────────┘
```

研究贡献可以定位为：

> **一种 Diff 驱动的 E2E 影响图构建、场景检索、补测生成与测试修复闭环方法。**

---

## 2. 核心数据结构：异构影响图

系统的中心不是规则库，而是一个自动更新的 **Heterogeneous Traceability Graph**。

### 2.1 节点类型

| 节点类型                 | 示例                                          | 作用          |
| -------------------- | ------------------------------------------- | ----------- |
| `CodeFile`           | `src/pages/checkout.tsx`                    | diff 的文件级入口 |
| `CodeEntity`         | function / class / hook / reducer / handler | diff 的细粒度实体 |
| `Component`          | `PaymentForm`, `UserMenu`                   | UI 中间层      |
| `Route`              | `/checkout`, `/admin/users/:id`             | 连接代码和页面     |
| `DOMSemanticNode`    | button: “Pay now”, input: “Email”           | 语义 UI 节点    |
| `APIEndpoint`        | `POST /api/orders`                          | 前后端桥        |
| `GraphQLOperation`   | `mutation CreateOrder`                      | API 变体      |
| `StateSlice`         | `cart.items`, `auth.user`                   | 状态影响        |
| `FeatureFlag`        | `new_checkout_flow`                         | 隐式依赖        |
| `Permission`         | `admin:write`, `canRefund`                  | 权限影响        |
| `Config`             | env var, tenant config                      | 配置影响        |
| `AsyncEvent`         | Kafka topic, websocket event                | 异步影响        |
| `CacheKey`           | `user:{id}:profile`                         | 缓存影响        |
| `Capability`         | login, checkout, refund, export report      | 业务能力桥       |
| `E2ETest`            | `checkout.spec.ts::pay by card`             | 测试场景        |
| `TestStep`           | click “Pay now”, fill “Email”               | 测试路径粒度      |
| `Requirement/PRText` | issue, story, PR description                | 文本证据        |
| `FailureHistory`     | past failing test on similar diff           | 历史证据        |

### 2.2 边类型

| 边类型                   | 示例                                       | 来源                           |
| --------------------- | ---------------------------------------- | ---------------------------- |
| `IMPORTS`             | file A imports file B                    | 静态分析                         |
| `CALLS`               | handler calls API client                 | AST / call graph             |
| `RENDERS`             | route renders component                  | React/Vue/Angular 分析         |
| `BINDS_EVENT`         | button click → handler                   | JSX / template AST           |
| `REQUESTS`            | test step → `POST /api/orders`           | Playwright network trace     |
| `COVERS`              | test → source file lines                 | browser coverage + sourcemap |
| `SEES_DOM`            | test step → semantic DOM node            | trace DOM snapshot           |
| `USES_LOCATOR`        | test step → `getByRole(button, Pay now)` | Playwright action trace      |
| `GUARDED_BY`          | component → feature flag                 | static + runtime flag eval   |
| `REQUIRES_PERMISSION` | route/API → permission                   | auth middleware analysis     |
| `EMITS_EVENT`         | API → async event                        | backend trace/log            |
| `AFFECTS_CAPABILITY`  | endpoint/component → checkout            | clustering/text/trace        |
| `TESTS_CAPABILITY`    | test → checkout                          | test name, tags, trace       |
| `CO_CHANGED_WITH`     | file A ↔ file B                          | git history                  |
| `CO_FAILED_WITH`      | changed file → failing test              | CI history                   |
| `SIMILAR_TEXT`        | PR text ↔ capability/test                | embedding / IR               |
| `OBSOLETES`           | changed DOM node → broken locator        | failure repair loop          |

每条边都带权重和来源：

```json
{
  "source": "runtime_trace | static_ast | ci_history | text_similarity | manual_seed",
  "confidence": 0.0,
  "last_seen": "2026-06-17",
  "decay": 0.98,
  "evidence": ["trace.zip", "coverage.json", "commit_sha"]
}
```

这样可以避免人工维护大量规则。人工只需要维护少量高层 taxonomy，例如 capability 名称、关键业务风险等级等；其余映射由 trace、AST、历史 CI 自动更新。

---

## 3. 从 Code Diff 到影响种子的解析

输入是 PR diff：

```text
changed files
changed hunks
changed functions/classes/components
changed imports
changed API schema
changed route definitions
changed feature flags/config
changed tests
PR title/body/linked issue
```

### 3.1 Diff 分类

每个 diff hunk 先被分类为若干变更类型：

| 变更类型            | 判断方式                              | 影响传播方向                                  |
| --------------- | --------------------------------- | --------------------------------------- |
| UI 结构变更         | JSX/template AST 改动               | component → route → DOM → test          |
| UI 文案变更         | text node / i18n key 改动           | DOM semantic node → locator/assertion   |
| 交互逻辑变更          | `onClick`, `onSubmit`, handler 改动 | event → API/state → scenario            |
| 路由变更            | router config / page file 改动      | route → all tests visiting route        |
| API client 变更   | fetch/axios/GraphQL client 改动     | endpoint/op → tests triggering endpoint |
| 后端接口变更          | controller/schema/service 改动      | endpoint → frontend route/test          |
| 状态管理变更          | reducer/store/hook 改动             | state slice → components/tests          |
| 权限变更            | auth guard/middleware/policy 改动   | permission → roles → tests              |
| feature flag 变更 | flag key/default/condition 改动     | flag → guarded routes/components/tests  |
| 配置变更            | env/config/tenant 改动              | config → runtime variants               |
| 异步事件变更          | queue/topic/websocket/job 改动      | event → eventual UI/API state           |
| 缓存变更            | cache key/TTL/invalidation        | stale-data scenarios                    |
| 测试辅助代码变更        | fixtures/page objects/helpers     | all dependent tests                     |

### 3.2 AST 级 changed entity

对于前端 TypeScript/React，可解析出：

```text
changed file: src/components/checkout/PaymentForm.tsx
changed component: PaymentForm
changed function: handleSubmit
changed JSX nodes:
  button[name="Pay now"]
  input[label="Card number"]
changed imports:
  createPayment from api/payments
changed feature flag:
  useFlag("new_checkout_flow")
```

对于后端：

```text
changed endpoint: POST /api/payments
changed service: PaymentService.authorize()
changed schema: PaymentRequest.cvv
changed permission: payments:create
changed event: payment.authorized
```

这些实体就是图传播的初始 seed。

---

## 4. 从 Code Diff 到 UI Diff

这是系统的关键创新点之一：不要直接把代码变更映射到测试，而是先映射到 **Semantic UI Diff**。

### 4.1 静态 UI AST Diff

以 React/JSX 为例，把 UI 编译成语义树：

```text
Component: PaymentForm
  Form[name="Payment"]
    Input[label="Card number", testId="card-number"]
    Input[label="CVV", testId="cvv"]
    Button[role="button", name="Pay now", testId="pay-now"]
```

静态 diff 可识别：

```text
ADD    Input[label="ZIP code"]
MODIFY Button[name="Pay now" → "Complete payment"]
MODIFY onClick handler: handleSubmit → handlePaymentSubmit
REMOVE data-testid="legacy-pay-button"
```

### 4.2 运行时 UI Diff

静态分析无法处理条件渲染、feature flag、权限、异步数据。因此系统在 PR preview 环境中运行轻量 probe：

```text
base branch route snapshot
head branch route snapshot
normalize DOM
compute semantic DOM diff
```

DOM 归一化时保留：

```text
route
frame
component stack, if available
role
accessible name
label
placeholder
text tokens
test id
href/action
network requests around action
visibility
enabled/disabled
```

同时去掉易变字段：

```text
random id
timestamp
nonce
dynamic class hash
layout-only wrapper
tracking attributes
```

Playwright 的 trace 本身会在每个 action 附近记录 locator、action log、source code location、DOM snapshots、screenshots、console 和 network 信息，这些正好可以作为 UI diff 与测试步骤的运行时证据。([Playwright][1])

### 4.3 UI Semantic Signature

定义一个稳定 UI 节点签名：

```text
UISig = hash(
  route,
  frame,
  role,
  accessibleNameTokens,
  labelTokens,
  testId,
  componentName,
  nearbyTextTokens,
  actionType,
  endpointTriggered
)
```

例如：

```json
{
  "route": "/checkout",
  "component": "PaymentForm",
  "role": "button",
  "accessibleName": "Pay now",
  "testId": "pay-now",
  "actionType": "click",
  "triggers": ["POST /api/payments"]
}
```

Playwright 官方也建议优先使用贴近用户感知的 locator，例如 role locator，或者使用 test id 定义明确测试契约；CSS/XPath 容易绑定 DOM 结构，DOM 变化后更脆弱。([Playwright][3]) 这和本系统的 “semantic UI signature” 是一致的。

---

## 5. 从 UI Diff 到受影响测试路径

每条 Playwright 测试被表示为一条 **E2E path**：

```text
Test: checkout.spec.ts::pay by card

Path:
  State:
    userRole = customer
    flags = new_checkout_flow:on
  Step 1:
    goto /checkout
  Step 2:
    fill input[label="Card number"]
  Step 3:
    fill input[label="CVV"]
  Step 4:
    click button[name="Pay now"]
    network: POST /api/payments
  Step 5:
    expect text "Payment successful"
    network: GET /api/orders/:id
```

于是 UI diff 可以直接命中：

```text
changed DOM node:
  Button[role=button, name="Pay now"]

affected test steps:
  checkout.spec.ts::pay by card::Step 4
  checkout.spec.ts::declined card shows error::Step 5
```

如果 changed UI 节点没有被任何测试覆盖，则形成补测需求：

```text
Coverage gap:
  new Input[label="ZIP code"] on /checkout
  no E2E step interacts with it
```

---

## 6. 影响传播算法

把 diff seed 放入图中，进行带权传播。

### 6.1 图传播

从 changed code entity 出发，沿不同边传播：

```text
CodeEntity(handleSubmit)
  → Component(PaymentForm)
  → Route(/checkout)
  → DOMSemanticNode(button: Pay now)
  → TestStep(click Pay now)
  → E2ETest(checkout.spec.ts::pay by card)
```

再如：

```text
CodeEntity(PaymentService.authorize)
  → APIEndpoint(POST /api/payments)
  → TestStep(network POST /api/payments)
  → E2ETest(checkout.spec.ts::pay by card)
```

对于隐式依赖：

```text
FeatureFlag(new_checkout_flow)
  → Component(PaymentForm)
  → Route(/checkout)
  → E2ETest(...)
```

```text
Permission(payments:create)
  → userRole(customer)
  → E2ETest(...)
```

```text
CacheKey(order:{id})
  → APIEndpoint(GET /api/orders/:id)
  → DOMSemanticNode(text: Payment successful)
  → E2ETest(...)
```

### 6.2 路径评分

对测试 `t` 的影响分数：

```text
Impact(d, t) =
  α * GraphProximity(d, t)
+ β * CoverageOverlap(d, t)
+ γ * UISemanticOverlap(d, t)
+ δ * APIOverlap(d, t)
+ ε * HistorySensitivity(d, t)
+ ζ * TextSimilarity(PR, t)
+ η * BusinessRisk(t)
- θ * ExecutionCost(t)
- λ * Flakiness(t)
```

其中：

```text
GraphProximity =
  max over paths p from changed node to test:
    exp(-path_length) * product(edge_confidence)
```

`CoverageOverlap` 来自 Playwright/browser coverage 与 sourcemap。Playwright Coverage API 可以采集页面实际使用过的 JS/CSS 片段，但官方说明仅支持 Chromium-based browsers，因此实验设计中应把跨浏览器 trace 与 Chromium coverage 分开处理。([Playwright][4])

`HistorySensitivity` 来自历史 CI：

```text
P(test failed | similar changed files, capabilities, endpoints, flags)
```

`TextSimilarity` 使用 PR title/body/issue 与测试名、注解、capability 描述做检索。

### 6.3 预算内测试选择

不是简单取 Top-K，而是做带预算的覆盖最大化：

```text
Given:
  impacted nodes I
  candidate tests T
  time budget B

Maximize:
  covered_risk(I, selected_tests)
  + predicted_failure_probability
  + business_criticality

Subject to:
  sum(duration(test)) <= B
```

贪心近似：

```text
while budget remains:
  choose test with max:
    marginal_gain(test) / duration(test)

marginal_gain =
  newly_covered_impacted_nodes
  + high-risk capability coverage
  + predicted failure probability
  - flaky penalty
```

这样能避免多个测试都覆盖同一个按钮/接口，而遗漏另一个高风险路径。

---

## 7. 测试排序输出示例

假设 PR diff：

```text
src/components/checkout/PaymentForm.tsx
  handleSubmit changed
  Button text changed: "Pay now" → "Complete payment"

src/api/payments.ts
  POST /api/payments payload changed
```

系统输出：

```text
Selected E2E tests:

1. checkout.spec.ts::customer pays by credit card
   score: 0.94
   reasons:
   - visits /checkout
   - clicks button formerly named "Pay now"
   - triggers POST /api/payments
   - covers PaymentForm.tsx lines 42-96
   - historically failed on similar payment API changes

2. checkout.spec.ts::declined card shows error message
   score: 0.89
   reasons:
   - triggers same payment endpoint
   - asserts error text rendered by PaymentForm
   - covers negative branch in handleSubmit

3. order.spec.ts::paid order appears in order history
   score: 0.71
   reasons:
   - downstream dependency from payment.authorized event
   - verifies eventual order state after payment

Not selected:

- login.spec.ts::basic login
  score: 0.08
  reason:
  - no graph path from diff to login capability except shared layout
```

输出中必须包含 **explanation**，否则研究和工程落地都很难被信任。

---

## 8. 补充测试生成：从 coverage gap 到新场景

当影响图发现：

```text
changed node has no E2E coverage
```

或者：

```text
new UI path exists but no test step reaches it
```

则进入补测生成模块。

### 8.1 Gap 类型

| Gap          | 示例                          | 生成策略                         |
| ------------ | --------------------------- | ---------------------------- |
| 新 UI 元素未覆盖   | 新增 ZIP code 输入框             | 基于相邻表单测试生成                   |
| 新 API 分支未覆盖  | payment 3DS challenge       | 从 API schema + UI route 生成   |
| 新权限路径未覆盖     | admin-only refund           | 生成 role variant              |
| 新 flag 分支未覆盖 | `new_checkout_flow:on`      | 生成 flag-on/off 对照            |
| 新错误态未覆盖      | 402 payment declined        | 生成 negative path             |
| 异步最终一致性未覆盖   | payment event updates order | 生成 polling/assert eventually |

### 8.2 生成流程

```text
1. Retrieve nearest existing tests
   - same route
   - same component
   - same API endpoint
   - same capability

2. Extract reusable skeleton
   - auth fixture
   - navigation
   - data setup
   - cleanup
   - assertions style

3. Mutate path
   - insert new action
   - switch role / flag / config
   - change fixture data
   - add expected assertion

4. Validate on PR preview
   - run generated test
   - collect trace
   - classify pass/fail/flaky
   - attach as draft patch or recommendation

5. Add graph edges
   - generated test → covered nodes
```

### 8.3 生成示例

Diff 新增：

```tsx
<input aria-label="ZIP code" />
```

无测试覆盖，则生成：

```ts
test('customer can pay with ZIP code validation @generated @checkout', async ({ page }) => {
  await loginAsCustomer(page);
  await page.goto('/checkout');

  await page.getByLabel('Card number').fill('4111111111111111');
  await page.getByLabel('CVV').fill('123');
  await page.getByLabel('ZIP code').fill('94105');

  await page.getByRole('button', { name: /complete payment|pay now/i }).click();

  await expect(page.getByText(/payment successful/i)).toBeVisible();
});
```

这里 locator 选择遵循语义优先原则：role、label、text、test id，而不是脆弱的 CSS/XPath。

---

## 9. 测试修复：从失败 trace 到 locator / path repair

当 selected test 失败时，系统先判断是产品缺陷还是测试过期。

### 9.1 失败分类

```text
Failure
  ├── product regression
  │     ├── API status changed
  │     ├── UI state incorrect
  │     ├── permission denied
  │     ├── data inconsistency
  │     └── async timeout
  │
  └── test obsolescence
        ├── locator broken
        ├── text changed intentionally
        ├── route changed
        ├── fixture invalid
        └── timing/flaky
```

### 9.2 Locator repair

利用 base/head Semantic UI Diff：

```text
old locator:
  getByRole('button', { name: 'Pay now' })

new candidate:
  getByRole('button', { name: 'Complete payment' })

evidence:
  same route /checkout
  same component PaymentForm
  same testId pay-now
  same triggered endpoint POST /api/payments
  same position in form
```

修复置信度：

```text
RepairConfidence =
  same_testid * 0.35
+ same_role * 0.15
+ same_component * 0.15
+ same_endpoint_triggered * 0.20
+ text_similarity * 0.10
+ spatial_similarity * 0.05
```

置信度高时自动提交 patch；中等置信度时作为建议；低置信度时只报告原因。

### 9.3 Path repair

如果路由或流程改了：

```text
old path:
  /cart → /checkout → /payment

new path discovered:
  /cart → /checkout/shipping → /checkout/payment
```

系统通过 route graph 和 preview crawl 找到新路径，生成最小修改：

```ts
await page.goto('/checkout');
// insert:
await page.getByRole('button', { name: /continue to payment/i }).click();
```

---

## 10. 图的自动维护机制

这是解决“映射可维护性”的核心。

### 10.1 三类证据

```text
static evidence:
  AST, imports, route config, API client, schema

runtime evidence:
  Playwright trace, DOM snapshot, network, coverage, server log

historical evidence:
  CI pass/fail, flaky rate, co-change, co-failure, PR text
```

### 10.2 增量更新

每次 PR：

```text
1. 更新 changed code entities
2. 更新静态依赖边
3. 运行 selected tests
4. 收集 trace / network / coverage
5. 更新 test → code/API/UI/capability 边
6. 根据结果调整 confidence
7. 对长时间未出现的边做 decay
```

建议的边权更新：

```text
confidence_new =
  1 - (1 - confidence_old) * (1 - evidence_strength)
```

边衰减：

```text
confidence = confidence * decay_factor ^ days_since_seen
```

当一个测试过去覆盖某 capability，但最近多次 trace 都不再经过该 capability，应自动降低 `TESTS_CAPABILITY` 权重。

---

## 11. 处理三个难点

### 11.1 粒度鸿沟

问题：

```text
code diff 是函数/文件级
E2E test 是业务流程级
```

解决：

```text
CodeEntity
  → Component / APIEndpoint / StateSlice
  → Route / DOMSemanticNode / Permission / Flag
  → Capability
  → E2ETest / TestStep
```

`Capability` 是最重要的中间抽象。它可以通过以下方式自动形成：

```text
test title/tags
route name
API endpoint name
PR/需求文本
页面标题/导航菜单
历史共现聚类
```

例如：

```text
Capability: checkout
  routes: /cart, /checkout, /payment
  components: CartSummary, PaymentForm
  APIs: POST /api/payments, POST /api/orders
  tests: checkout.spec.ts::*
```

Playwright 支持测试 tags / annotations，并能通过 `--grep` 运行指定标签测试；这些标签可以作为 capability 的显式弱监督信号。([Playwright][5])

### 11.2 隐式依赖

问题：

```text
权限、配置、feature flag、异步事件、缓存、跨服务调用不在显式调用图里
```

解决：把它们建成一等节点。

例如：

```text
FeatureFlag(new_checkout_flow)
  → Component(PaymentForm)
  → Route(/checkout)
  → tests with flag on/off
```

```text
Permission(refund:create)
  → APIEndpoint(POST /api/refunds)
  → Role(admin)
  → refund.spec.ts
```

```text
AsyncEvent(payment.authorized)
  → Consumer(OrderProjectionWorker)
  → APIEndpoint(GET /api/orders/:id)
  → DOM text "Paid"
  → order-history.spec.ts
```

```text
CacheKey(user_profile)
  → APIEndpoint(GET /api/users/me)
  → Header(UserMenu)
  → login/profile tests
```

隐式依赖的发现方式：

```text
static:
  flag key literal
  permission decorator
  config reference
  event topic constant
  cache key builder

runtime:
  flag evaluation log
  auth decision log
  network trace
  backend span/log
  async message trace

history:
  similar PR caused downstream test failure
  files often co-change
  tests often co-fail
```

### 11.3 映射可维护性

问题：

```text
不能靠人工维护 rules
```

解决：

```text
rules → evidence-driven graph
manual mapping → weak seed only
static edges → every commit refresh
runtime edges → every CI refresh
history edges → continuously learned
text edges → embeddings / IR refresh
old edges → confidence decay
```

即使早期图不完整，也可以通过每次测试运行自动补边。

---

## 12. Playwright 集成方案

### 12.1 自定义 fixture

封装 Playwright，自动采集：

```ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const requests: any[] = [];
    const consoleLogs: any[] = [];

    page.on('request', req => {
      requests.push({
        method: req.method(),
        url: req.url(),
        resourceType: req.resourceType()
      });
    });

    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    await use(page);

    await testInfo.attach('impact-network.json', {
      body: JSON.stringify(requests, null, 2),
      contentType: 'application/json'
    });

    await testInfo.attach('impact-console.json', {
      body: JSON.stringify(consoleLogs, null, 2),
      contentType: 'application/json'
    });
  }
});
```

### 12.2 每个 action 采集 UI signature

可以提供封装：

```ts
await impact.click(page.getByRole('button', { name: 'Pay now' }), {
  capability: 'checkout',
  expectedEndpoint: 'POST /api/payments'
});
```

或者自动从 trace 反推：

```text
test step
locator
DOM node
network around action
source code location
```

Playwright trace 的 action tab 会记录每个 action 使用的 locator 和耗时，并可查看 action 前后的 DOM snapshot；network tab 可以查看测试期间发出的请求并按 action 时间段过滤。([Playwright][1])

### 12.3 Reporter 输出

使用 JSON/blob reporter 收集所有测试运行信息。Playwright 的 blob report 包含测试运行细节，并可用于合并 sharded tests；JSON reporter 可输出测试运行对象。([Playwright][6]) 在 CI 中可以先跑被选中的测试，再把结果、trace、附件入库。

---

## 13. 研究实验设计

### RQ1：Diff2E2E-TIA 是否能减少 E2E 执行成本？

对比方法：

```text
B0: Retest-All
B1: random selection
B2: file/tag based selection
B3: coverage-only selection
B4: static dependency only
B5: history-only ML
Ours: static + runtime trace + UI diff + history graph
```

指标：

```text
selected test ratio
execution time reduction
failure detection recall
missed failure rate
first failure latency
APFD / APFDc
```

### RQ2：Semantic UI Diff 是否提升 E2E 映射精度？

对比：

```text
code file → test file
component → route
component → route → DOM semantic node → test step
```

指标：

```text
precision@K
recall@K
MRR of actual failing test
explanation correctness
```

### RQ3：隐式依赖建模是否减少漏选？

专门构造或收集以下 PR：

```text
feature flag change
permission change
config change
cache invalidation change
async event change
cross-service API change
```

比较：

```text
without implicit nodes
with implicit nodes
```

指标：

```text
missed impacted test count
failure detection recall
selected suite size
```

### RQ4：补测生成是否能发现 coverage gap？

指标：

```text
new impacted nodes covered
generated tests passing rate
human accepted rate
new faults found
maintenance cost
```

### RQ5：测试修复是否降低 flaky/obsolete failure？

指标：

```text
locator repair success rate
false repair rate
manual edits saved
time to green
```

### 实验协议

建议用历史 PR replay：

```text
for each historical PR:
  1. checkout base
  2. build graph using only data before PR
  3. apply PR diff
  4. run Diff2E2E-TIA selection
  5. run selected tests
  6. run full E2E suite as oracle
  7. compare selected result vs oracle
```

为了增加故障样本，可以加入 mutation：

```text
mutate changed function branch
mutate JSX condition
mutate API response schema
mutate permission check
mutate feature flag condition
```

---

## 14. 最小可实现原型路线

### 阶段 1：Diff → 测试选择 MVP

目标：先证明 targeted selection 有效。

实现：

```text
- Git diff parser
- TS/JS AST changed entity extractor
- Playwright JSON reporter
- network trace collector
- browser coverage collector
- simple graph store
- ranking function
```

先支持：

```text
file/function → route/component/API → test
```

不做复杂补测和修复。

### 阶段 2：加入 Semantic UI Diff

新增：

```text
- JSX/template semantic AST
- base/head DOM snapshot diff
- UI signature
- test step ↔ DOM node mapping
```

解决：

```text
button/text/form/locator 级影响分析
```

### 阶段 3：加入隐式依赖

新增：

```text
- feature flag extraction
- permission extraction
- config/env extraction
- async event/cache key extraction
- backend trace/log ingestion
```

解决：

```text
flag、权限、缓存、异步事件导致的漏选
```

### 阶段 4：补测生成与修复

新增：

```text
- coverage gap detector
- nearest-neighbor test retrieval
- Playwright test generation
- locator repair
- path repair
```

形成完整闭环。

---

## 15. 一句话系统定义

这套系统可以在论文中定义为：

> **Diff2E2E-TIA 是一种面向 Web 应用的变更驱动 E2E 回归测试选择方法。它通过静态分析、Playwright 运行时 trace、semantic UI diff、历史 CI 和需求文本共同构建异构影响图，将代码变更投影到组件、路由、API、权限、配置、feature flag、异步事件和业务能力节点，再基于图传播与风险感知排序检索受影响的 Playwright 测试，并在覆盖缺口处生成补充测试、在 UI 漂移处修复失效测试。**

可形成的论文贡献点：

```text
C1. Code Diff → Semantic UI Diff 的投影方法
C2. 面向 E2E 的异构 traceability graph
C3. 融合静态、运行时、历史、文本证据的测试影响传播算法
C4. 风险与预算约束下的 Playwright E2E 测试选择与排序
C5. 基于影响图的补测生成和 locator/path repair 闭环
C6. 基于历史 PR replay 与 mutation 的实证评估
```

[1]: https://playwright.dev/docs/trace-viewer "Trace viewer | Playwright"
[2]: https://link.springer.com/chapter/10.1007/978-3-032-04200-2_15 "Regression Testing via Traceability: A Systematic Literature Review | Springer Nature Link"
[3]: https://playwright.dev/docs/locators "Locators | Playwright"
[4]: https://playwright.dev/docs/api/class-coverage "Coverage | Playwright"
[5]: https://playwright.dev/docs/test-annotations "Annotations | Playwright"
[6]: https://playwright.dev/docs/test-reporters "Reporters | Playwright"
