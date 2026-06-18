// RQ1 statistics + figures from out/rq1_dataset.jsonl.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wilcoxonP, cliffsDelta, mcnemar, bootstrapCI, mean } from '../pipeline/src/stats.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'out');
const FIGS = path.join(OUT, 'figs');

function load() {
  return fs.readFileSync(path.join(OUT, 'rq1_dataset.jsonl'), 'utf8')
    .trim().split('\n').map((l) => JSON.parse(l));
}

const BASES = ['retest_all', 'random_k', 'static_heuristic'];

function main() {
  fs.mkdirSync(FIGS, { recursive: true });
  const rows = load();
  const get = (m, k) => rows.map((r) => r.metrics[m][k]);

  const lines = [`# RQ1 Statistics (n=${rows.length} commit transitions)`, ''];

  // bootstrap CI for ours
  lines.push('## Ours: bootstrap 95% CI');
  for (const k of ['Reduction', 'Safety', 'Precision']) {
    const ci = bootstrapCI(get('ours', k), mean, 2000, 42);
    lines.push(`- ${k}: ${ci.point} (95% CI ${ci.lo}–${ci.hi})`);
  }

  // ours vs baselines
  lines.push('', '## Ours vs baselines');
  lines.push('| comparison | metric | Wilcoxon z | p | Cliff δ |', '|---|---|---|---|---|');
  for (const b of BASES) {
    for (const k of ['Reduction', 'Safety']) {
      const pairs = rows.map((r) => [r.metrics.ours[k], r.metrics[b][k]]);
      const w = wilcoxonP(pairs);
      const d = cliffsDelta(get('ours', k), get(b, k));
      lines.push(`| ours vs ${b} | ${k} | ${w.z} | ${w.p} | ${d} |`);
    }
  }

  // McNemar on "safe" (Safety==1) outcome
  lines.push('', '## McNemar on per-commit safety (漏选=0)');
  lines.push('| comparison | b (ours safe, base unsafe) | c (ours unsafe, base safe) | chi2 |', '|---|---|---|---|');
  for (const b of BASES) {
    let bb = 0, cc = 0;
    for (const r of rows) {
      const oSafe = r.metrics.ours.Safety === 1, xSafe = r.metrics[b].Safety === 1;
      if (oSafe && !xSafe) bb++; else if (!oSafe && xSafe) cc++;
    }
    lines.push(`| ours vs ${b} | ${bb} | ${cc} | ${mcnemar(bb, cc).chi2} |`);
  }

  // by change type
  lines.push('', '## By change type (ours)');
  lines.push('| type | n | mean Reduction | mean Safety | mean Precision |', '|---|---|---|---|---|');
  const byType = {};
  for (const r of rows) (byType[r.type] ||= []).push(r);
  for (const [t, rs] of Object.entries(byType)) {
    lines.push(`| ${t} | ${rs.length} | ${mean(rs.map((r) => r.metrics.ours.Reduction)).toFixed(3)} | ` +
      `${mean(rs.map((r) => r.metrics.ours.Safety)).toFixed(3)} | ${mean(rs.map((r) => r.metrics.ours.Precision)).toFixed(3)} |`);
  }

  fs.writeFileSync(path.join(OUT, 'rq1_stats.md'), lines.join('\n') + '\n');

  // SVG grouped bar chart: mean Reduction/Safety/Precision per method
  const methods = ['ours', ...BASES];
  const metricsK = ['Reduction', 'Safety', 'Precision'];
  const data = methods.map((m) => ({ m, vals: metricsK.map((k) => mean(get(m, k))) }));
  fs.writeFileSync(path.join(FIGS, 'rq1_metrics.svg'), svgBars(data, metricsK));

  console.log(lines.join('\n'));
  console.log(`\nfig: ${path.join(FIGS, 'rq1_metrics.svg')}`);
}

function svgBars(data, metricsK) {
  const W = 720, H = 360, pad = 50, gw = (W - 2 * pad) / data.length;
  const colors = ['#2c7fb8', '#7fcdbb', '#c7e9b4'];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="sans-serif" font-size="12">`;
  s += `<rect width="${W}" height="${H}" fill="white"/>`;
  s += `<text x="${W / 2}" y="20" text-anchor="middle" font-size="15">RQ1: mean Reduction / Safety / Precision by method</text>`;
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
