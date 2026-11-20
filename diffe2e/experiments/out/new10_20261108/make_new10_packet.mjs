// 第四步：为新增缺口（y01–y05）diff 臂生成用例出人工盲评包。
//
// 独立命名空间 nb001–nb005；不引用主实验/任何批次的数字与分布；
// 包内不含 arm、批次、缺口编号、自动指标；解盲键单独存放在包外。
// 协议 B：第一列取三次多数票，本包只收第二列 annotator2_yn；不一致由第三人仲裁。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const WORK = '/tmp/expv3/work_exp';
const PACKET = path.join(here, 'annotation_packet');
const OUT = here;
fs.mkdirSync(PACKET, { recursive: true });

const git = (args) => execSync(`git ${args}`, { cwd: WORK, stdio: 'pipe', maxBuffer: 20 * 1024 * 1024 }).toString();
const results = JSON.parse(fs.readFileSync(path.join(OUT, 'rq2_new10_results.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest_expansion_v2.json'), 'utf8'));

const cases = results.gaps.map((g, i) => {
  const m = manifest.gaps.find((x) => x.gap_id === g.gap_id);
  const id = `nb${String(i + 1).padStart(3, '0')}`;
  git(`checkout -q ${g.tag}`);
  const diff = git(`diff --diff-filter=AM ${g.prev_tag} ${g.tag} -- app/public/src`);
  return {
    case_id: id,
    gap_file: m.source_file,
    route: g.route,
    diff,
    spec: g.arms.diff.spec,
  };
});

// 解盲键：包外，仅协调者可见
fs.writeFileSync(path.join(OUT, 'new10_packet_unblind.json'), JSON.stringify(
  cases.map((c) => ({ case_id: c.case_id, gap_id: results.gaps.find((g) => g.route === c.route).gap_id, route: c.route, tag: results.gaps.find((g) => g.route === c.route).tag })), null, 2) + '\n');

const esc = (s) => s.replace(/```/g, '```');
const worksheet = [
  '# 生成用例语义相关性盲评工作表（独立编号）',
  '',
  '> 规则见 `diffe2e/experiments/annotate/ANNOTATION_GUIDE.md`。本表独立编号，不与其它材料共用编号或哈希。',
  '',
  '## 怎么看、怎么判',
  '',
  '每条看四样：`变更文件`、`路由`、**应用源码 diff**（本次变更的实际代码改动，已排除测试文件）、`spec`（生成出来的测试）。',
  '',
  '问四个问题，四个都过才填 `y`：',
  '',
  '| 问题 | 倾向 |',
  '|---|---|',
  '| 它有没有真的打开应用？还是 `page.setContent(...)` 自己造了假 DOM？ | `setContent` → `n` |',
  '| 它操作/断言的元素，和 `变更文件` 里的改动对得上吗？ | 对不上 → `n` |',
  '| 断言是不是具体到“变更后的结果”？还是只断言 body/页面/通用 header 可见？ | 空泛 → `n` |',
  '| 如果这次变更不存在，这条测试会不会失败？ | 不会 → `n` |',
  '',
  '**不需要跑测试。** 只读 spec 与源码 diff 做判断。',
  '',
  '## 怎么填',
  '',
  '在每节末尾把 `annotator2_yn=___` 改成 `annotator2_yn=y` 或 `annotator2_yn=n`。只填小写 `y` / `n`；`final` 留空，仅由第三人在两列不一致时填写。',
  '',
  '---',
  '',
  ...cases.flatMap((c) => [
    `## ${c.case_id}`,
    '',
    `- 变更文件：\`${c.gap_file}\``,
    `- 路由：\`${c.route}\``,
    '',
    '### 这次变更的应用源码 diff（父提交..本次提交，已排除测试文件）',
    '',
    '```diff',
    esc(c.diff.trimEnd()),
    '```',
    '',
    '### 生成用例',
    '',
    '```ts',
    esc(c.spec.trimEnd()),
    '```',
    '',
    '**annotator2_yn=___**',
    '',
    '---',
    '',
  ]),
].join('\n');
fs.writeFileSync(path.join(PACKET, 'rq2_worksheet.md'), worksheet);

fs.writeFileSync(path.join(PACKET, 'rq2_fill_template.csv'),
  ['case_id,annotator2_yn,final', ...cases.map((c) => `${c.case_id},,`)].join('\n') + '\n');

const instructions = `# 生成用例盲评材料说明（独立编号）

这份材料包用于第二标注者独立标注，条目采用独立编号，不与其它材料共用哈希。

## 打开哪些文件

| 任务 | 工作文件（直接编辑） | 填哪一列 |
|---|---|---|
| 生成用例语义相关性（${cases.length} 条） | \`rq2_worksheet.md\` | 每节末尾 \`annotator2_yn=y\` 或 \`annotator2_yn=n\` |

\`final\` 一律留空，它只由第三仲裁者在两列不一致时填写。\`rq2_fill_template.csv\` 是手工录入的备用模板。

## 判什么

一条 spec 是否真的打开应用、操作或断言了**这次变更引入/改变的具体 UI 或行为**。四个问题都过才填 \`y\`：

1. 它有没有真的打开应用（不是 \`page.setContent\` 造假 DOM）？
2. 它操作/断言的元素，和 \`变更文件\` 里的改动对得上吗？
3. 断言是否具体到“变更后的结果”，而不是 body/页面/通用 header？
4. 如果这次变更不存在，这条测试会不会失败？

依据：\`变更文件\`、\`路由\`（定位信息）、**应用源码 diff**、\`spec\` 全文。**不需要跑测试。**

## 协议 B 与仲裁

- 第一列由协调者按协议 B 独立完成（三次判定取多数票），本包不展示该列。
- 本包只收第二列；两人不一致的条目由第三人看同一材料仲裁，填入 \`final\`。
- 语义有效性的定义：断言验证本次变更引入/改变的行为，且断言不是恒真或与变更无关。

## 什么情况停下来问协调者

- 某节的源码 diff 缺失或混入测试文件；
- spec 引用了找不到的 fixture 或页面路径；
- 你在材料里看到分组、来源、生成方式、自动指标、第一列标签或任何比例/统计数字。

## 禁止

- 不要打开任何解盲键、标注理由或评分输出文件；
- 不要打开被测仓库、git 历史、commit 网页/PR/issue；
- 不要运行被测测试。

## 交付

- 保存为 UTF-8，不要增删节、不要改标题和顺序；
- 全部填完后，协调者会做锁定与 \`shasum -a 256\` 记录，再进入仲裁与评分。
`;
fs.writeFileSync(path.join(PACKET, 'ANNOTATOR_INSTRUCTIONS.md'), instructions);

const coverage = [
  '# 盲评材料覆盖清单（独立编号）', '',
  `- 条目数：${cases.length}`,
  `- 命名空间：\`${cases[0].case_id}\`–\`${cases[cases.length - 1].case_id}\``,
  '- 每条均含：变更文件、路由、应用源码 diff、生成用例全文。', '',
  '## 逐条结构核对', '',
  '| case_id | 变更文件 | 源码 diff 行数 | spec 行数 | 字段 |',
  '|---|---|---|---|---|',
  ...cases.map((c) => `| ${c.case_id} | ${c.gap_file} | ${c.diff.split('\n').filter(Boolean).length} | ${c.spec.split('\n').filter(Boolean).length} | annotator2_yn |`),
  '', '## 说明', '',
  '- 本清单只做结构核对，不含任何比例、均值或分布统计。',
  '- 解盲键在包外，仅协调者可见。',
].join('\n') + '\n';
fs.writeFileSync(path.join(PACKET, 'COVERAGE_REPORT.md'), coverage);

// 泄漏复核
const forbidden = [
  'nodiff', 'diff 臂', 'diff arm', 'arm=', 'y01', 'y02', 'y03', 'y04', 'y05',
  'x01', 'x02', 'x03', 'x04', 'x05', 'new10', 'stage3', '主实验',
  'semantic_auto', 'change_sensitive', 'mutation', '变异杀伤', 'executable-rate',
  '0.8438', '0.7792', '0.5625', '50/59', '25/31', 'kappa', 'κ',
  'unblind', 'rationale', '预标注',
];
const files = fs.readdirSync(PACKET).filter((f) => !f.startsWith('LEAKAGE_CHECK') && f !== 'SHA256SUMS').sort();
const records = [];
for (const f of files) {
  const text = fs.readFileSync(path.join(PACKET, f), 'utf8');
  const hits = forbidden.filter((w) => text.includes(w));
  records.push({ file: f, forbidden_hits: hits, pass: hits.length === 0 });
}
const ws = fs.readFileSync(path.join(PACKET, 'rq2_worksheet.md'), 'utf8');
const fieldCount = (ws.match(/^\*\*annotator2_yn=___\*\*$/gm) || []).length;
const caseIds = ws.match(/^## nb\d{3}$/gm) || [];
records.push({ file: 'rq2_worksheet.md:field-check', forbidden_hits: [],
  pass: fieldCount === cases.length && caseIds.length === cases.length,
  detail: { expected_fields: cases.length, actual_fields: fieldCount, expected_sections: cases.length, actual_sections: caseIds.length } });
const leakage = {
  generated_at: new Date().toISOString(),
  scope: '新增缺口生成用例盲评包（包内全部文件）',
  protocol: 'B（第一列三次多数票；本包仅第二列；不一致第三人仲裁）',
  forbidden_token_list: forbidden,
  records,
  pass: records.every((r) => r.pass),
};
fs.writeFileSync(path.join(PACKET, 'LEAKAGE_CHECK.json'), JSON.stringify(leakage, null, 2) + '\n');
fs.writeFileSync(path.join(PACKET, 'LEAKAGE_CHECK.md'), [
  '# 泄漏复核记录（独立编号）', '',
  `- 复核对象：包内 ${files.length} 个文件（不含本记录与 SHA256SUMS）`,
  `- 结论：${leakage.pass ? 'PASS' : 'FAIL'}`,
  `- 复核规则：包内不得出现分组、来源、缺口编号、自动指标、第一列标签、统计数字或解盲线索。`, '',
  '| 文件 | 命中禁用词 | 结果 |', '|---|---|---|',
  ...records.map((r) => `| ${r.file} | ${r.forbidden_hits.join('、') || '无'} | ${r.pass ? 'PASS' : 'FAIL'} |`),
  '', '字段核对：工作表 `annotator2_yn` 待填字段数与条目数一致，未预填答案；节标题均为独立 `nb` 编号。',
].join('\n') + '\n');

// SHA256SUMS（不包含自身）
const sums = fs.readdirSync(PACKET).filter((f) => f !== 'SHA256SUMS' && f !== 'LEAKAGE_CHECK.md' && f !== 'LEAKAGE_CHECK.json').sort()
  .map((f) => `${crypto.createHash('sha256').update(fs.readFileSync(path.join(PACKET, f))).digest('hex')}  ${f}`);
const allSums = fs.readdirSync(PACKET).filter((f) => f !== 'SHA256SUMS').sort()
  .map((f) => `${crypto.createHash('sha256').update(fs.readFileSync(path.join(PACKET, f))).digest('hex')}  ${f}`);
fs.writeFileSync(path.join(PACKET, 'SHA256SUMS'), allSums.join('\n') + '\n');

console.log(`packet -> ${PACKET} (${cases.length} cases)`);
console.log(`leakage ${leakage.pass ? 'PASS' : 'FAIL'}`);
for (const r of records) if (!r.pass) console.log('FAIL', r.file, r.forbidden_hits, r.detail || '');
