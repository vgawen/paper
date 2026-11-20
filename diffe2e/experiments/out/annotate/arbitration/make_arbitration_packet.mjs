#!/usr/bin/env node
// 第三方（S）仲裁材料包生成器。
//
// 用途：从两列最终标注中筛出分歧条目，甲乙盲化后打成可邮件外发的压缩包。
// 输入：
//   第一列 = 协议 B 正式结果（masked 三次运行多数票，score.mjs loadFirstLabels 'b-majority'）
//   第二列 = 第二标注者回表 CSV（rq2_annotator2_blind.csv / rq3_annotator2_blind.csv）
// 输出：
//   --template  空模板（第二标注者尚未回表时）
//   --pack      只含分歧条目的裁决表 + 材料引用 + 说明 + 压缩包
//   --dry-run   只统计，不写文件（默认）
//   --hash <f>  计算 SHA-256 与字节数；可加 --expect <sha256> 做比对
//
// 硬约束：
//   - 只读 ANNOTATION_GUIDE.md、既有盲评包与任何 SHA256SUMS 冻结文件，不修改它们；
//   - 甲乙对应表与随机种子只写 local/，不进压缩包；
//   - 包内不出现 模型/人工/LLM/预标注/自动 等字样，两方一律称判断甲/判断乙；
//   - RQ3 不计算、不输出 κ（保持原统计口径）。
//
// 用法（在 diffe2e 目录下）：
//   node experiments/out/annotate/arbitration/make_arbitration_packet.mjs --template
//   node experiments/out/annotate/arbitration/make_arbitration_packet.mjs            # dry-run
//   node experiments/out/annotate/arbitration/make_arbitration_packet.mjs --pack
//   node experiments/out/annotate/arbitration/make_arbitration_packet.mjs --pack --deadline 2026-11-20 --contact someone@example.com
//   node experiments/out/annotate/arbitration/make_arbitration_packet.mjs --hash ~/Downloads/arbitration_return_S_20261120.zip

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..', '..');
const EXP = path.resolve(HERE, '..', '..', '..');
const ANNOTATE = path.join(EXP, 'annotate');
const HANDOVER = path.join(OUT, 'annotation_handover');
const GUIDE = path.join(ANNOTATE, 'ANNOTATION_GUIDE.md');
const LOCAL = path.join(HERE, 'local');
const SEED_FILE = path.join(LOCAL, 'BLINDING_SEED.txt');

const DEFAULT_RQ2_BLIND = path.join(OUT, 'rq2_annotator2_blind.csv');
const DEFAULT_RQ3_BLIND = path.join(OUT, 'rq3_annotator2_blind.csv');
const RQ2_WORKSHEET = path.join(HANDOVER, '02_RQ2_worksheet.md');
const RQ3_WORKSHEET = path.join(HANDOVER, '03_RQ3_worksheet.md');

const FAMILIES = {
  rq2: {
    label: 'RQ2',
    secondCol: 'annotator2_yn',
    allowed: ['y', 'n'],
    expected: 30,
    worksheet: RQ2_WORKSHEET,
    guideSection: '### 3.2 问四个问题',
    guideRef: 'ANNOTATION_GUIDE.md §3.2',
    options: ['y', 'n'],
    csvName: 'ARB_RQ2_adjudication.csv',
    materialName: 'ARB_MATERIAL_rq2.md',
    caseRe: /^rq2_\d{3}$/,
  },
  rq3: {
    label: 'RQ3',
    secondCol: 'human2',
    allowed: ['STRUCTURAL_ONLY', 'EXPECTATION_CHANGE', 'SUSPECTED_REGRESSION'],
    expected: 40,
    worksheet: RQ3_WORKSHEET,
    // §4.2 含“自动改写”等修复政策措辞，会命中包内禁用词；§4.3 是同一判据的决策表，逐字引用即可。
    guideSection: '### 4.3 决策表',
    guideRef: 'ANNOTATION_GUIDE.md §4.3 + §4.4 判据边界',
    options: ['STRUCTURAL_ONLY', 'EXPECTATION_CHANGE', 'SUSPECTED_REGRESSION'],
    csvName: 'ARB_RQ3_adjudication.csv',
    materialName: 'ARB_MATERIAL_rq3.md',
    caseRe: /^rb\d{3}$/,
  },
};

const CSV_HEADERS = ['case_id', '材料引用', '判据条款', '判据原文', '判断甲', '判断乙', '裁决', '理由'];

// 包内任何文本都不得命中这些词；命中即中止，不提供绕过开关。
const BANNED = [
  { name: '模型', re: /模型/g },
  { name: '人工', re: /人工/g },
  { name: 'LLM', re: /\bLLM\b/gi },
  { name: '预标注', re: /预标注/g },
  { name: '自动', re: /自动/g },
  { name: 'annotator', re: /annotator/gi },
  { name: 'human1/human2', re: /human[12]/gi },
  { name: 'prelabel', re: /prelabel/gi },
  { name: '第二标注者', re: /第二标注者|第一标注者/g },
  { name: '多数票', re: /多数票/g },
  { name: '协议 B', re: /协议\s*B|B\s*条件/g },
];

const now = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'medium',
}).format(new Date());

const stamp = () => {
  const s = now(); // YYYY-MM-DD HH:mm:ss
  return `${s.slice(0, 10).replace(/-/g, '')}_${s.slice(11, 16).replace(':', '')}`;
};

function parseCSV(text) {
  const t = String(text).replace(/^\uFEFF/, '');
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  const headers = rows.shift() || [];
  return { headers, rows: rows.filter((r) => r.length === headers.length).map((r) => Object.fromEntries(headers.map((h, j) => [h, r[j]]))) };
}

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
  return fs.statSync(file).size;
}

function writeCsv(file, headers, rows, bom = true) {
  const lines = [headers.join(',')].concat(rows.map((r) => headers.map((h) => csvCell(r[h])).join(',')));
  return writeText(file, `${bom ? '\uFEFF' : ''}${lines.join('\n')}\n`);
}

function hashFile(file) {
  const buf = fs.readFileSync(file);
  return { sha256: crypto.createHash('sha256').update(buf).digest('hex'), bytes: buf.length };
}

function ensureSeed(override) {
  if (override) return override.trim();
  if (fs.existsSync(SEED_FILE)) {
    const v = fs.readFileSync(SEED_FILE, 'utf8').trim();
    if (v) return v;
  }
  const seed = `arb-${stamp()}`;
  writeText(SEED_FILE, `${seed}\n`);
  return seed;
}

// 每条按 sha256(seed|case_id) 首字节奇偶决定甲乙位置，跨次运行稳定。
function sidesFor(seed, caseId) {
  const h = crypto.createHash('sha256').update(`${seed}|${caseId}`).digest();
  return h[0] % 2 === 0;
}

function sectionText(md, heading) {
  const lines = String(md).split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start < 0) throw new Error(`指南中找不到小节：${heading}`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{2,3} /.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start + 1, end).join('\n').trim();
}

function saveHowto() {
  const guide = fs.readFileSync(GUIDE, 'utf8');
  const rq2 = sectionText(guide, FAMILIES.rq2.guideSection);
  const s43 = sectionText(guide, FAMILIES.rq3.guideSection);
  const s44 = sectionText(guide, '### 4.4 特别规则');
  const idx = s44.indexOf('**判据边界');
  if (idx < 0) throw new Error('指南 §4.4 中找不到「判据边界」段');
  // 只取判据边界的主段；其下三条举例含 rb033 个案与“协议 B”字样，既命中包内禁用词，也可能影响独立判断。
  const boundary = s44.slice(idx).split(/\n(?=\s{2}- )/)[0].trim();
  const rq3 = `${s43}\n\n${boundary}`;
  return { rq2, rq3 };
}

// 从既有盲评工作表逐条抽取同名小节；只删除原表末尾的空白判定行，正文逐字保留。
function extractSections(file, wanted, caseRe) {
  const md = fs.readFileSync(file, 'utf8');
  const lines = md.split(/\r?\n/);
  const chunks = [];
  let cur = null;
  for (const line of lines) {
    const m = /^## (.+)$/.exec(line);
    if (m) {
      if (cur) chunks.push(cur);
      cur = { head: m[1].trim(), body: [] };
    } else if (cur) cur.body.push(line);
  }
  if (cur) chunks.push(cur);

  const byId = new Map();
  for (const c of chunks) {
    const id = c.head.split(/\s+/)[0];
    if (!caseRe.test(id)) continue;
    const body = c.body
      .filter((l) => !/^\s*判定：/.test(l))
      .map((l) => l.replace(/\s+$/, ''));
    while (body.length && body[0].trim() === '') body.shift();
    while (body.length && (body[body.length - 1].trim() === '' || /^---\s*$/.test(body[body.length - 1]))) body.pop();
    byId.set(id, { head: c.head, body });
  }

  const missing = wanted.filter((id) => !byId.has(id));
  if (missing.length) throw new Error(`${path.basename(file)} 缺少章节：${missing.join(', ')}`);
  return wanted.map((id) => byId.get(id));
}

function materialDoc(family, sections) {
  const f = FAMILIES[family];
  const parts = [
    `# 仲裁材料 · ${f.label}（${sections.length} 条）`,
    '',
    '> 本文件各节逐字取自既有盲评材料对应小节，源码 diff、测试代码、提交信息均未改动；仅删除了原材料末尾的空白填写行。',
    '',
  ];
  for (const s of sections) {
    parts.push(`## ${s.head}`, '', ...s.body, '', '---', '');
  }
  return parts.join('\n');
}

function worksheetDoc(family, items, criterion) {
  const f = FAMILIES[family];
  const parts = [
    `# 第三方裁决工作表 · ${f.label}（${items.length} 条）`,
    '',
    '本页只收录两方判断不一致的条目。判断甲 / 判断乙的来源与身份已隐去；每条中甲乙的位置按固定随机种子打乱，不代表先后、优劣或可信度。',
    '',
    `裁决与理由请回填 \`${f.csvName}\`，本页仅供阅读，不要修改。`,
    '',
    `判据原文（\`${f.guideRef}\`，未改写）：`,
    '',
    '```text',
    criterion,
    '```',
    '',
    '---',
    '',
  ];
  for (const it of items) {
    parts.push(
      `## ${it.case_id}`,
      '',
      `- 材料：\`${f.materialName}\` 的 \`## ${it.case_id}\` 节（原始材料逐字保留）`,
      `- 判断甲：\`${it.jia_label}\``,
      `- 判断乙：\`${it.yi_label}\``,
      '',
      `裁决选项：${f.options.map((o) => `\`${o}\``).join(' / ')}。理由请写 2–4 句，说明依据材料里的哪一处、为什么另一方的结论不成立。`,
      '',
      `回填：\`${f.csvName}\` 中 \`case_id=${it.case_id}\` 那一行的「裁决」「理由」两列。`,
      '',
      '---',
      '',
    );
  }
  return parts.join('\n');
}

const S_README_TEMPLATE = `# 第三方裁决说明（一页）

你收到的是 {{N_TOTAL}} 条**判断不一致**的标注条目（RQ2 {{N_RQ2}} 条，RQ3 {{N_RQ3}} 条），只需要对这几条给出你的独立结论。不需要了解完整项目，也不需要运行任何测试或代码。

## 你会看到什么

- \`ARB_RQ2_worksheet.md\` / \`ARB_RQ3_worksheet.md\`：逐条列出材料位置、两条原始判断（判断甲、判断乙）和判据原文。
- \`ARB_MATERIAL_rq2.md\` / \`ARB_MATERIAL_rq3.md\`：每条对应的原始材料，逐字保留，未删改。
- \`ARB_RQ2_adjudication.csv\` / \`ARB_RQ3_adjudication.csv\`：**唯一需要你填写的文件**。

两条判断来自两个相互独立的来源，来源与身份已隐去；每条中「甲」「乙」的位置按固定随机种子打乱，不代表任何优劣、先后或可信度。请不要猜测哪一条来自哪里，只按材料判断。

## 怎么判

- RQ2：四个问题全部通过才填 \`y\`，否则填 \`n\`（判据原文见工作表顶部）。
- RQ3：在 \`STRUCTURAL_ONLY\`、\`EXPECTATION_CHANGE\`、\`SUSPECTED_REGRESSION\` 中三选一（判据原文见工作表顶部）。无法排除真实回归时，按协议选 \`SUSPECTED_REGRESSION\`。

## 怎么填

只改两份 CSV 的两列：

- \`裁决\`：RQ2 填小写 \`y\` 或 \`n\`；RQ3 填三个大写标签之一。
- \`理由\`：至少一句，建议 2–4 句。写清你依据材料里的哪一处、为什么另一方的结论不成立。理由比结论更重要。

不要改 \`case_id\`、\`判断甲\`、\`判断乙\`，不要增删行，不要改文件名。

## 怎么回

填完后直接回复邮件，附上两份 CSV（保持原文件名），不需要重新压缩，也不需要回传材料文件。截止时间：{{DEADLINE}}。

## 其他

- 只依据包内材料判断；不要搜索代码仓库、不要运行测试、不要查看包外文件。
- 若某条材料不足以下判断，请在 \`理由\` 中写明缺什么，并保留你的倾向选项。
- 有问题联系：{{CONTACT}}。
`;

const EMAIL_TEMPLATE = `主题：第三方裁决材料包 {{PACKET_NAME}}（{{N_TOTAL}} 条，请于 {{DEADLINE}} 前回填）

{{S_NAME}}：

附件是 {{N_TOTAL}} 条需要第三方裁决的标注条目（RQ2 {{N_RQ2}} 条，RQ3 {{N_RQ3}} 条）。这些条目是两条独立判断不一致的部分，其余条目不需要处理。

压缩包：{{PACKET_NAME}}
SHA-256：{{SHA256}}
生成时间：{{GENERATED_AT}}

包内说明与填写方法见 S_README.md。简要来说：阅读两份 worksheet 与对应的 material，然后只填写 ARB_RQ2_adjudication.csv 和 ARB_RQ3_adjudication.csv 的「裁决」「理由」两列；填完直接回复本邮件，附回这两份 CSV 即可，不需要重新压缩。

预计用时 30 分钟左右。截止时间：{{DEADLINE}}。

如材料有缺失或无法判断，请直接在「理由」里说明，不必勉强下结论。

谢谢！
`;

const AUTHOR_LOG_TEMPLATE = `# 仲裁包时间与哈希记录（作者自留，勿随包外发）

## 1. 规则

- 本文件只保存在本地，不进入外发压缩包。
- 甲乙对应表与随机种子只保存在本地 \`local/\`，不对外发送；事后还原依赖该表。
- RQ3 不报 κ：本流程不计算、不输出 κ，保持既有统计口径。
- 现有 ANNOTATION_GUIDE、既有盲评包与任何 SHA256SUMS 冻结文件均未改动。

## 2. 生成记录

| 时间 | 动作 | 文件 | 字节 | SHA-256 |
|---|---|---|---|---|
| <YYYY-MM-DD HH:mm:ss> | template / pack | <文件名> | <字节> | <sha256> |

## 3. 甲乙对应

- 随机种子文件：\`local/BLINDING_SEED.txt\`
- 对应表：\`local/BLINDING_MAP_<时间戳>.json\`
- 对应表 SHA-256：\`<sha256>\`

## 4. 回收记录（收到回表后填写）

| 收到时间 | 附件名 | 实算 SHA-256 | 邮件声明 SHA-256 | 是否一致 | 解包时间 | 备注 |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

## 5. 回收核对命令

\`\`\`bash
node make_arbitration_packet.mjs --hash ~/Downloads/arbitration_return_S_<YYYYMMDD>.zip
# 与第 2 节记录的压缩包 SHA-256 逐字比对；一致后再解包
unzip arbitration_return_S_<YYYYMMDD>.zip -d return_S_<YYYYMMDD>
\`\`\`

## 6. 还原甲乙

\`\`\`bash
node -e 'const m=require("./local/BLINDING_MAP_<时间戳>.json"); for (const [id,v] of Object.entries(m.cases)) console.log(id, "甲="+v.jia_source, "乙="+v.yi_source)'
\`\`\`
`;

function authorLogDoc({ rows, seedFile, mapFile, mapSha }) {
  return `# 仲裁包时间与哈希记录（作者自留，勿随包外发）

## 1. 规则

- 本文件只保存在本地，不进入外发压缩包。
- 甲乙对应表与随机种子只保存在本地 \`local/\`，不对外发送；事后还原依赖该表。
- RQ3 不报 κ：本流程不计算、不输出 κ，保持既有统计口径。
- 现有 ANNOTATION_GUIDE、既有盲评包与任何 SHA256SUMS 冻结文件均未改动。

## 2. 生成记录

| 时间 | 动作 | 文件 | 字节 | SHA-256 |
|---|---|---|---|---|
${rows}

## 3. 甲乙对应

- 随机种子文件：\`${seedFile}\`
- 对应表：\`${mapFile}\`
- 对应表 SHA-256：\`${mapSha}\`

## 4. 回收记录（收到回表后填写）

| 收到时间 | 附件名 | 实算 SHA-256 | 邮件声明 SHA-256 | 是否一致 | 解包时间 | 备注 |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |

## 5. 回收核对命令

\`\`\`bash
node make_arbitration_packet.mjs --hash ~/Downloads/arbitration_return_S_<YYYYMMDD>.zip
# 与第 2 节记录的压缩包 SHA-256 逐字比对；一致后再解包
unzip arbitration_return_S_<YYYYMMDD>.zip -d return_S_<YYYYMMDD>
\`\`\`

## 6. 还原甲乙

\`\`\`bash
node -e 'const m=require("./${mapFile}"); for (const [id,v] of Object.entries(m.cases)) console.log(id, "甲="+v.jia_source, "乙="+v.yi_source)'
\`\`\`
`;
}


function renderTemplate(tpl, vars) {
  return tpl.replace(/\{\{([A-Z0-9_]+)\}\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

function scanBanned(files) {
  const hits = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const b of BANNED) {
        b.re.lastIndex = 0;
        if (b.re.test(line)) hits.push({ file: path.basename(file), line: i + 1, word: b.name, text: line.trim().slice(0, 120) });
      }
    });
  }
  return hits;
}

function loadSecondLabels(file, family) {
  if (!fs.existsSync(file)) throw new Error(`找不到第二列文件：${file}`);
  const sheet = parseCSV(fs.readFileSync(file, 'utf8'));
  const f = FAMILIES[family];
  if (!sheet.headers.includes(f.secondCol)) throw new Error(`${path.basename(file)} 缺少列 ${f.secondCol}`);
  const map = new Map();
  for (const r of sheet.rows) {
    const raw = String(r[f.secondCol] ?? '').trim();
    const fin = String(r.final ?? '').trim();
    const v = fin || raw;
    map.set(String(r.case_id).trim(), { value: v, raw, final: fin });
  }
  return map;
}

function evaluate(family, secondFile, firstLabels) {
  const f = FAMILIES[family];
  const second = loadSecondLabels(secondFile, family);
  const ids = [...firstLabels.labels.keys()].sort();
  const problems = [];
  const disagree = [];
  let filled = 0;

  for (const id of ids) {
    const b = String(firstLabels.labels.get(id) ?? '').trim();
    const s = second.get(id);
    if (!s || !s.value) {
      problems.push({ id, kind: 'missing_second', detail: '第二列尚未回表或为空' });
      continue;
    }
    if (!f.allowed.includes(s.value)) {
      problems.push({ id, kind: 'invalid_second', detail: `非法取值 ${JSON.stringify(s.value)}` });
      continue;
    }
    if (!b) {
      problems.push({ id, kind: 'missing_first', detail: '第一列（B 多数票）缺失' });
      continue;
    }
    filled++;
    if (b !== s.value) disagree.push({ case_id: id, first: b, second: s.value });
  }

  const extra = [...second.keys()].filter((id) => !firstLabels.labels.has(id));
  return { family, ids, filled, total: ids.length, problems, extra, disagree };
}

function makeCsvRows(items, family, criterion) {
  const f = FAMILIES[family];
  return items.map((it) => ({
    case_id: it.case_id,
    材料引用: `${f.materialName}#${it.case_id}`,
    判据条款: f.guideRef,
    判据原文: criterion,
    判断甲: it.jia_label,
    判断乙: it.yi_label,
    裁决: '',
    理由: '',
  }));
}

function assignSides(seed, family, disagreements, firstMap, criterion) {
  const f = FAMILIES[family];
  const items = [];
  const mapping = {};
  for (const d of disagreements) {
    const firstIsJia = sidesFor(seed, d.case_id);
    const jia_label = firstIsJia ? d.first : d.second;
    const yi_label = firstIsJia ? d.second : d.first;
    items.push({ case_id: d.case_id, jia_label, yi_label });
    mapping[d.case_id] = {
      jia_source: firstIsJia ? 'B-majority' : 'annotator2-return',
      yi_source: firstIsJia ? 'annotator2-return' : 'B-majority',
      jia_label,
      yi_label,
    };
  }
  return { items, mapping };
}

function summaryLine(family, ev) {
  const f = FAMILIES[family];
  return `${f.label}: 回表 ${ev.filled}/${ev.total}，问题 ${ev.problems.length}，分歧 ${ev.disagree.length}`;
}

async function main() {
  const argv = process.argv.slice(2);
  const has = (k) => argv.includes(k);
  const val = (k, fallback = '') => {
    const eq = argv.find((a) => a.startsWith(`${k}=`));
    if (eq) return eq.slice(k.length + 1);
    const i = argv.indexOf(k);
    if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
    return fallback;
  };

  if (has('--help') || has('-h')) {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 26).join('\n'));
    return;
  }

  if (has('--hash')) {
    const file = val('--hash');
    if (!file || !fs.existsSync(file)) { console.error(`文件不存在：${file}`); process.exitCode = 2; return; }
    const { sha256, bytes } = hashFile(file);
    console.log(`${sha256}  ${bytes} bytes  ${file}`);
    const expect = val('--expect');
    if (expect) {
      const ok = expect.trim().toLowerCase() === sha256;
      console.log(ok ? 'MATCH' : `MISMATCH (expect ${expect.trim().toLowerCase()})`);
      if (!ok) process.exitCode = 1;
    }
    return;
  }

  const secondRq2 = val('--second-rq2', DEFAULT_RQ2_BLIND);
  const secondRq3 = val('--second-rq3', DEFAULT_RQ3_BLIND);
  const seedOverride = val('--seed');
  const { loadFirstLabels } = await import(pathToFileURL(path.join(ANNOTATE, 'score.mjs')).href);
  const first = {
    rq2: loadFirstLabels('rq2', 'b-majority', OUT),
    rq3: loadFirstLabels('rq3', 'b-majority', OUT),
  };
  const ev = {
    rq2: evaluate('rq2', secondRq2, first.rq2),
    rq3: evaluate('rq3', secondRq3, first.rq3),
  };

  const mode = has('--pack') ? 'pack' : has('--template') ? 'template' : 'dry-run';

  if (mode === 'dry-run') {
    console.log(`第一列来源：${first.rq2.note}`);
    for (const k of ['rq2', 'rq3']) {
      const e = ev[k];
      console.log(summaryLine(k, e));
      for (const p of e.problems.slice(0, 8)) console.log(`  - ${p.id}: ${p.kind} ${p.detail}`);
      if (e.problems.length > 8) console.log(`  … 另有 ${e.problems.length - 8} 条`);
      if (e.extra.length) console.log(`  - 第二列多出 case_id：${e.extra.join(', ')}`);
      for (const d of e.disagree) console.log(`  分歧 ${d.case_id}: 甲源=${d.first} 乙源=${d.second}`);
    }
    console.log('dry run；用 --pack 生成压缩包，或用 --template 生成空模板。');
    return;
  }

  if (mode === 'template') {
    const st = stamp();
    const criterion = saveHowto();
    const files = [];
    for (const family of ['rq2', 'rq3']) {
      const f = FAMILIES[family];
      files.push([path.join(HERE, `TEMPLATE_${f.csvName}`), writeCsv(path.join(HERE, `TEMPLATE_${f.csvName}`), CSV_HEADERS, [])]);
      files.push([path.join(HERE, `TEMPLATE_ARB_${f.label}_worksheet.md`),
        writeText(path.join(HERE, `TEMPLATE_ARB_${f.label}_worksheet.md`),
          worksheetDoc(family, [], criterion[family]))]);
    }
    files.push([path.join(HERE, 'TEMPLATE_S_README.md'),
      writeText(path.join(HERE, 'TEMPLATE_S_README.md'), renderTemplate(S_README_TEMPLATE, {
        N_TOTAL: '{{N_TOTAL}}', N_RQ2: '{{N_RQ2}}', N_RQ3: '{{N_RQ3}}',
        DEADLINE: '{{DEADLINE}}', CONTACT: '{{CONTACT}}', PACKET_NAME: '{{PACKET_NAME}}',
      }))]);
    files.push([path.join(HERE, 'EMAIL_BODY_DRAFT.md'), writeText(path.join(HERE, 'EMAIL_BODY_DRAFT.md'), EMAIL_TEMPLATE)]);
    const logTpl = path.join(HERE, 'TEMPLATE_AUTHOR_LOG.md');
    files.push([logTpl, writeText(logTpl, AUTHOR_LOG_TEMPLATE)]);

    const seed = ensureSeed(seedOverride);
    const rows = files.map(([file, bytes]) => {
      const { sha256 } = hashFile(file);
      return `| ${now()} | template | ${path.basename(file)} | ${bytes} | ${sha256} |`;
    });
    const self = hashFile(fileURLToPath(import.meta.url));
    rows.unshift(`| ${now()} | template | make_arbitration_packet.mjs | ${self.bytes} | ${self.sha256} |`);
    const log = authorLogDoc({
      rows: rows.join('\n'), seedFile: path.relative(HERE, SEED_FILE),
      mapFile: '（尚未生成；--pack 时写入）', mapSha: '（尚未生成）',
    });
    const logFile = path.join(LOCAL, `AUTHOR_LOG_TEMPLATE_${st}.md`);
    writeText(logFile, `${log}\n\n种子（本地）：\`${seed}\`\n`);
    console.log(`模板已写入 ${path.relative(process.cwd(), HERE)}`);
    for (const [file] of files) console.log(`  ${path.basename(file)}`);
    console.log(`本地记录：${path.relative(process.cwd(), logFile)}`);
    console.log('当前第二标注者未回表，裁决表为空；回表后运行 --pack 一条命令产出压缩包。');
    return;
  }

  // pack
  const incomplete = ['rq2', 'rq3'].filter((k) => ev[k].filled !== ev[k].total || ev[k].problems.length);
  if (incomplete.length) {
    console.error('无法打包：第二列尚未完整回表。');
    for (const k of ['rq2', 'rq3']) {
      console.error(`  ${summaryLine(k, ev[k])}`);
      for (const p of ev[k].problems.slice(0, 5)) console.error(`    - ${p.id}: ${p.kind} ${p.detail}`);
    }
    console.error('先把填写后的工作表汇总成 CSV（collect_annotator2_md.mjs --write），再运行 --pack。');
    process.exitCode = 1;
    return;
  }

  const totalDis = ev.rq2.disagree.length + ev.rq3.disagree.length;
  if (!totalDis) {
    console.error('两列完全一致，没有需要仲裁的分歧条目；不生成空包。');
    process.exitCode = 1;
    return;
  }

  const st = stamp();
  const seed = ensureSeed(seedOverride);
  const criterion = saveHowto();
  const buildDir = path.join(HERE, `build_${st}`);
  fs.rmSync(buildDir, { recursive: true, force: true });
  fs.mkdirSync(buildDir, { recursive: true });

  const map = { seed, generated_at: now(), note: '本文件仅本地保存，不随仲裁包外发。', cases: {} };
  const counts = {};
  for (const family of ['rq2', 'rq3']) {
    const f = FAMILIES[family];
    const parts = assignSides(seed, family, ev[family].disagree, first[family].labels, criterion[family]);
    Object.assign(map.cases, parts.mapping);
    counts[family] = parts.items.length;

    const sections = extractSections(f.worksheet, parts.items.map((i) => i.case_id), f.caseRe);
    writeText(path.join(buildDir, f.materialName), materialDoc(family, sections));
    writeText(path.join(buildDir, `ARB_${f.label}_worksheet.md`), worksheetDoc(family, parts.items, criterion[family]));
    writeCsv(path.join(buildDir, f.csvName), CSV_HEADERS, makeCsvRows(parts.items, family, criterion[family]));
  }

  const vars = {
    N_TOTAL: String(totalDis),
    N_RQ2: String(counts.rq2),
    N_RQ3: String(counts.rq3),
    DEADLINE: val('--deadline', '【请填写截止时间】'),
    CONTACT: val('--contact', '【请填写联系人与邮箱】'),
    S_NAME: val('--s-name', '【请填写称呼】'),
    PACKET_NAME: `arbitration_packet_${st}.zip`,
    SHA256: '【打包后回填】',
    GENERATED_AT: now(),
  };
  writeText(path.join(buildDir, 'S_README.md'), renderTemplate(S_README_TEMPLATE, vars));

  // 包内清单：先算各文件哈希，再写 SHA256SUMS，最后压缩。
  const packageFiles = fs.readdirSync(buildDir).sort();
  const sums = packageFiles.map((name) => `${hashFile(path.join(buildDir, name)).sha256}  ${name}`);
  writeText(path.join(buildDir, 'SHA256SUMS'), `${sums.join('\n')}\n`);

  const hits = scanBanned([...packageFiles.map((n) => path.join(buildDir, n)), path.join(buildDir, 'SHA256SUMS')]);
  if (hits.length) {
    console.error('包内文本命中禁用词，已中止打包：');
    for (const h of hits) console.error(`  ${h.file}:${h.line} [${h.word}] ${h.text}`);
    process.exitCode = 1;
    return;
  }

  const zipName = `arbitration_packet_${st}.zip`;
  const zipPath = path.join(HERE, zipName);
  fs.rmSync(zipPath, { force: true });
  execFileSync('zip', ['-r', '-X', zipPath, '.'], { cwd: buildDir, stdio: 'pipe' });
  const zipHash = hashFile(zipPath);

  // 本地留档：对应表、种子、邮件正文、时间与哈希记录。均不进包。
  fs.mkdirSync(LOCAL, { recursive: true });
  const mapFile = path.join(LOCAL, `BLINDING_MAP_${st}.json`);
  writeText(mapFile, `${JSON.stringify(map, null, 2)}\n`);
  writeText(SEED_FILE, `${seed}\n`);
  const mapHash = hashFile(mapFile);

  const emailVars = { ...vars, SHA256: zipHash.sha256, GENERATED_AT: now() };
  const emailFile = path.join(LOCAL, `EMAIL_BODY_${st}.md`);
  writeText(emailFile, renderTemplate(EMAIL_TEMPLATE, emailVars));

  const rows = [...packageFiles, 'SHA256SUMS'].map((name) => {
    const h = hashFile(path.join(buildDir, name));
    return `| ${now()} | package | ${name} | ${h.bytes} | ${h.sha256} |`;
  });
  rows.push(`| ${now()} | zip | ${zipName} | ${zipHash.bytes} | ${zipHash.sha256} |`);
  const self = hashFile(fileURLToPath(import.meta.url));
  rows.unshift(`| ${now()} | pack | make_arbitration_packet.mjs | ${self.bytes} | ${self.sha256} |`);
  const log = authorLogDoc({
    rows: rows.join('\n'), seedFile: path.relative(HERE, SEED_FILE),
    mapFile: path.relative(HERE, mapFile), mapSha: mapHash.sha256,
  });
  const logFile = path.join(LOCAL, `AUTHOR_LOG_${st}.md`);
  writeText(logFile, `${log}\n\n种子（本地）：\`${seed}\`\n`);

  console.log(`RQ2 分歧 ${counts.rq2} 条；RQ3 分歧 ${counts.rq3} 条；合计 ${totalDis} 条`);
  console.log(`包：${zipPath}`);
  console.log(`字节：${zipHash.bytes}`);
  console.log(`SHA-256：${zipHash.sha256}`);
  console.log(`邮件正文：${emailFile}`);
  console.log(`对应表（勿外发）：${mapFile}`);
  console.log(`记录（勿外发）：${logFile}`);
  console.log('RQ3 κ：不计算、不输出（保持原口径）。');
}

main().catch((e) => {
  console.error(e.stack || e.message || String(e));
  process.exit(1);
});
