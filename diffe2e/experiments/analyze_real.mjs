// Cross-project real RQ1 statistics + figure.
// Merges every out/real/*_rq1.jsonl, computes mean + bootstrap 95% CI for
// Reduction/Safety/Precision per method (coverage_only/uidiff_only/dual), and a
// Wilcoxon test of dual vs coverage_only. Writes out/real/real_rq1_stats.md and
// out/real/figs/real_rq1.svg. Gracefully reports if no real data exists yet.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bootstrapCI, mean, wilcoxonP } from '../pipeline/src/stats.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REAL = path.join(here, 'out', 'real');
const FIGS = path.join(REAL, 'figs');
const METHODS = ['coverage_only', 'uidiff_only', 'dual'];
const KS = ['Reduction', 'Safety', 'Precision'];

function loadRows() {
  if (!fs.existsSync(REAL)) return [];
  const rows = [];
  for (const f of fs.readdirSync(REAL)) {
    if (!f.endsWith('_rq1.jsonl')) continue;
    const proj = f.replace('_rq1.jsonl', '');
    for (const line of fs.readFileSync(path.join(REAL, f), 'utf8').trim().split('\n').filter(Boolean)) {
      try { rows.push({ proj, ...JSON.parse(line) }); } catch { /* skip */ }
    }
  }
  return rows;
}

function main() {
  fs.mkdirSync(FIGS, { recursive: true });
  const rows = loadRows();
  const L = [`# 真实项目 RQ1 跨项目统计`, ''];
  if (!rows.length) {
    L.push('STATUS: 无真实数据。');
    L.push('');
    L.push('运行 `node experiments/real/run_rq1_real.mjs <adapter.json> [N]` 产出 `out/real/<proj>_rq1.jsonl` 后再执行本脚本。');
    fs.writeFileSync(path.join(REAL, 'real_rq1_stats.md'), L.join('\n') + '\n');
    console.log('analyze_real: no real RQ1 data yet (run run_rq1_real.mjs first).');
    return;
  }

  const projs = [...new Set(rows.map((r) => r.proj))];
  L.push(`项目：${projs.join('、')}；总过渡数 n=${rows.length}。`, '');
  const get = (m, k) => rows.map((r) => r.metrics[m][k]);

  L.push('## 各方法均值 + bootstrap 95% CI');
  L.push('| method | metric | mean | 95% CI |', '|---|---|---|---|');
  const fig = [];
  for (const m of METHODS) {
    const vals = [];
    for (const k of KS) {
      const ci = bootstrapCI(get(m, k), mean, 2000, 42);
      L.push(`| ${m} | ${k} | ${ci.point} | ${ci.lo}–${ci.hi} |`);
      vals.push(ci.point);
    }
    fig.push({ m, vals });
  }

  L.push('', '## dual vs coverage_only（Wilcoxon signed-rank）');
  L.push('| metric | z | p |', '|---|---|---|');
  for (const k of KS) {
    const pairs = rows.map((r) => [r.metrics.dual[k], r.metrics.coverage_only[k]]);
    const w = wilcoxonP(pairs);
    L.push(`| ${k} | ${w.z} | ${w.p} |`);
  }

  L.push('', '## 按项目');
  L.push('| project | n | dual Reduction | dual Safety | dual Precision |', '|---|---|---|---|---|');
  for (const p of projs) {
    const rs = rows.filter((r) => r.proj === p);
    const md = (k) => mean(rs.map((r) => r.metrics.dual[k])).toFixed(4);
    L.push(`| ${p} | ${rs.length} | ${md('Reduction')} | ${md('Safety')} | ${md('Precision')} |`);
  }

  fs.writeFileSync(path.join(REAL, 'real_rq1_stats.md'), L.join('\n') + '\n');
  fs.writeFileSync(path.join(FIGS, 'real_rq1.svg'), svgBars(fig, KS));
  console.log(L.join('\n'));
  console.log(`\nfig: ${path.join(FIGS, 'real_rq1.svg')}`);
}

function svgBars(data, metricsK) {
  const W = 720, H = 360, pad = 50, gw = (W - 2 * pad) / Math.max(1, data.length);
  const colors = ['#2c7fb8', '#7fcdbb', '#c7e9b4'];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="sans-serif" font-size="12">`;
  s += `<rect width="${W}" height="${H}" fill="white"/>`;
  s += `<text x="${W / 2}" y="20" text-anchor="middle" font-size="15">真实项目 RQ1: mean Reduction / Safety / Precision by method</text>`;
  const y0 = H - pad, plotH = H - 2 * pad;
  s += `<line x1="${pad}" y1="${y0}" x2="${W - pad}" y2="${y0}" stroke="#333"/>`;
  for (let t = 0; t <= 1.0001; t += 0.25) {
    const y = y0 - t * plotH;
    s += `<line x1="${pad}" y1="${y}" x2="${W - pad}" y2="${y}" stroke="#eee"/>`;
    s += `<text x="${pad - 8}" y="${y + 4}" text-anchor="end">${t.toFixed(2)}</text>`;
  }
  data.forEach((d, i) => {
    const bw = (gw - 20) / metricsK.length;
    d.vals.forEach((v, j) => {
      const x = pad + i * gw + 10 + j * bw;
      const h = v * plotH;
      s += `<rect x="${x}" y="${y0 - h}" width="${bw - 2}" height="${h}" fill="${colors[j]}"/>`;
      s += `<text x="${x + bw / 2}" y="${y0 - h - 3}" text-anchor="middle" font-size="10">${v.toFixed(2)}</text>`;
    });
    s += `<text x="${pad + i * gw + gw / 2}" y="${y0 + 16}" text-anchor="middle">${d.m}</text>`;
  });
  metricsK.forEach((k, j) => {
    const lx = W - pad - 150 + j * 50;
    s += `<rect x="${lx}" y="30" width="10" height="10" fill="${colors[j]}"/><text x="${lx + 13}" y="39">${k.slice(0, 4)}</text>`;
  });
  return s + '</svg>';
}

main();
