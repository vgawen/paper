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
  lines.push(`- 已从两个真实项目构建 30 条双盲标注样本。`);
  if (!rq2.n) {
    lines.push('- 尚未完成有效双标注评分；待填写 `annotator1_yn` / `annotator2_yn` / `final` 后重新运行评分脚本。');
    return lines.concat(['']);
  }
  lines.push(`- 已完成双人盲评（n=${rq2.n}）。`);
  lines.push(`- 人工语义有效率为 ${rq2.semantic_validity}，Cohen's κ=${rq2.kappa.kappa}。`);
  if (rq2.by_arm) lines.push(`- 分臂语义有效率：diff=${rq2.by_arm.diff.semantic_validity}，nodiff=${rq2.by_arm.nodiff.semantic_validity}。`);
  return lines.concat(['']);
}

export function renderRq3Section(rq3) {
  const lines = ['## RQ3'];
  if (!rq3.n) {
    lines.push('- 已构建 ReproBreak 盲评样本，但尚未完成有效双标注评分。');
    return lines.concat(['']);
  }
  lines.push(`- 已从 ReproBreak 无泄漏评估样本中完成双人盲评（n=${rq3.n}）。`);
  lines.push(`- 人工一致性 Cohen's κ=${rq3.human_kappa.kappa}。`);
  lines.push(`- 模型标签对人工金标的 accuracy=${rq3.model_accuracy}，κ=${rq3.model_kappa.kappa}。`);
  return lines.concat(['']);
}

const lines = ['# RQ2/RQ3 kappa 回填模板', ''];

if (exists(rq2Path)) lines.push(...renderRq2Section(readJson(rq2Path)));
if (exists(rq3Path)) lines.push(...renderRq3Section(readJson(rq3Path)));

if (!exists(rq2Path) && !exists(rq3Path)) {
  lines.push('- 尚未检测到已评分的 RQ2/RQ3 annotation JSON。');
  lines.push('- 先运行 `score.mjs` 完成评分，再执行本脚本生成论文回填文字。');
}

const out = path.join(outDir, 'kappa_backfill.md');
fs.writeFileSync(out, lines.join('\n') + '\n');
console.log(`wrote ${path.relative(path.join(here, '..', '..'), out)}`);
