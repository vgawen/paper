// Regenerate the RQ2 second-annotator Markdown worksheet from the blind CSV.
//
// Usage:
//   node experiments/annotate/make_rq2_worksheet.mjs
//
// The blind CSV is the source of truth; this worksheet is a readable view with
// the judging guide at the top. RQ3 has its own context file
// (rq3_annotator_context_blind.md), which is not generated here.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'out');
const csvPath = path.join(outDir, 'rq2_annotator2_blind.csv');
const outPath = path.join(outDir, 'rq2_annotator2_worksheet.md');

function parseCSV(t) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  const h = rows.shift();
  return rows.filter((r) => r.length === h.length).map((r) => Object.fromEntries(h.map((k, j) => [k, r[j]])));
}

const HEADER = `# RQ2 第二标注者盲评工作表

> 完整规则见 \`diffe2e/experiments/annotate/ANNOTATION_GUIDE.md\`。本页只保留填写时最常用的判断方法。

## 怎么看、怎么判

每条看三样：\`gap_file\`（本次改的文件）、\`route\`（项目/页面上下文）、\`spec\`（生成出来的测试）。

问四个问题，四个都过才填 \`y\`：

| 问题 | 倾向 |
|---|---|
| 它有没有真的打开应用？还是 \`page.setContent(...)\` 自己造了假 DOM？ | \`setContent\` → \`n\` |
| 它操作/断言的元素，和 \`gap_file\` 里的变更对得上吗？ | 对不上 → \`n\` |
| 断言是不是具体到“变更后的结果”？还是只断言 body/页面/通用 header 可见？ | 空泛 → \`n\` |
| 如果这次变更不存在，这条测试会不会失败？ | 不会 → \`n\` |

典型判断：

- \`page.setContent('<div>...')\` + 一堆 \`locator('cell')\` → \`n\`：测的是自己造的假页面。
- \`page.goto('/')\` + \`expect(page.locator('body')).toBeVisible()\` → \`n\`：通用 smoke。
- \`page.goto('/budget')\` + 点击这次新增的按钮 + 断言新增的行/文本 → \`y\`。
- 用项目 fixture 并操作真实组件选择器，通常说明打开了应用；但仍要确认它触达的是 \`gap_file\` 对应的变更。

**不需要跑测试。** 可执行率、版本敏感、变异杀伤已由自动实验测过；人工判的是语义相关性，读代码即可。**不要打开** \`rq2_real_to_annotate.csv\`、\`rq2_annotator1_rationale.md\`、\`rq2_real_to_annotate_unblind.json\`。

## 怎么填

在每节末尾把 \`annotator2_yn=___\` 改成 \`annotator2_yn=y\` 或 \`annotator2_yn=n\`。只填小写 \`y\` / \`n\`；\`final\` 留空（它只由第三人在两列不一致时填写）。

---

`;

const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
const out = [HEADER];
for (const r of rows) {
  out.push(`## ${r.case_id}\n\n`);
  out.push(`- 变更文件：\`${r.gap_file}\`\n`);
  out.push(`- 变更上下文：\`${r.route}\`\n\n`);
  out.push('```ts\n' + String(r.spec).replace(/\n$/, '') + '\n```\n\n');
  out.push('判定：`annotator2_yn=___`\n\n---\n\n');
}
fs.writeFileSync(outPath, out.join(''));
console.log(`wrote ${rows.length} sections -> ${path.relative(path.join(here, '..', '..'), outPath)}`);
