import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, '..', 'out');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function exists(file) {
  return fs.existsSync(file);
}

const rq2Path = path.join(outDir, 'rq2_real_to_annotate_annotation.json');
const rq3Path = path.join(outDir, 'rq3_staleness_annotation.json');

export function renderRq2Section(rq2) {
  const lines = ['## RQ2'];
  lines.push(`- 已从两个真实项目构建 30 条标注样本（第一列为现行 B 正式预标注，来源：${rq2.first_source || 'b-majority'}，三次多数票；旧 \`annotator1_yn\` 列不参与）。`);
  if (!rq2.n) {
    lines.push('- 尚未完成有效的一致性评分；待填写 `annotator2_yn` / `final` 后重新运行评分脚本。');
    return lines.concat(['']);
  }
  lines.push(`- 已完成现行预标注-人工一致性评估（n=${rq2.n}，第一列来源：${rq2.first_source || 'b-majority'}）。`);
  lines.push(`- 人工语义有效率为 ${rq2.semantic_validity}，Po=${rq2.po}，Pe=${rq2.pe}，Cohen's κ=${rq2.kappa.kappa}。`);
  if (rq2.confusion) lines.push(`- 混淆矩阵：${JSON.stringify(rq2.confusion)}。`);
  if (rq2.by_arm) lines.push(`- 分臂语义有效率：diff=${rq2.by_arm.diff.semantic_validity}，nodiff=${rq2.by_arm.nodiff.semantic_validity}。`);
  return lines.concat(['']);
}

export function renderRq3Section(rq3) {
  const lines = ['## RQ3'];
  if (!rq3.n) {
    lines.push('- 已构建 ReproBreak 盲评样本，但尚未完成有效的一致性评分。');
    return lines.concat(['']);
  }
  lines.push(`- 已从 ReproBreak 无泄漏评估样本中完成现行预标注-人工一致性评估（n=${rq3.n}，第一列来源：${rq3.first_source || 'b-majority'}）。`);
  lines.push(`- 人工一致率 Po=${rq3.po}。`);
  if (rq3.confusion) lines.push(`- 混淆矩阵：${JSON.stringify(rq3.confusion)}。`);
  lines.push(`- 逐条分歧：${(rq3.disagreements || []).length} 条。`);
  lines.push('- 按既定口径，RQ3 预标注为常量 STRUCTURAL_ONLY（Pe 退化），**不报 κ**；只报 Po、混淆矩阵与逐条分歧，避免数值虚高或误用。');
  return lines.concat(['']);
}

const lines = ['# RQ2/RQ3 一致性回填模板（RQ3 按口径不报 κ）', ''];

if (exists(rq2Path)) lines.push(...renderRq2Section(readJson(rq2Path)));
if (exists(rq3Path)) lines.push(...renderRq3Section(readJson(rq3Path)));

if (!exists(rq2Path) && !exists(rq3Path)) {
  lines.push('- 尚未检测到已评分的 RQ2/RQ3 annotation JSON。');
  lines.push('- 先运行 `score.mjs` 完成评分，再执行本脚本生成论文回填文字。');
}

const out = path.join(outDir, 'kappa_backfill.md');
fs.writeFileSync(out, lines.join('\n') + '\n');
console.log(`wrote ${path.relative(path.join(here, '..', '..'), out)}`);
