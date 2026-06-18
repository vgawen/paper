// Lightweight statistics (no deps). Deterministic; bootstrap uses a seeded PRNG.

// McNemar test (continuity-corrected) for paired binary outcomes.
// b = #(method1 win, method2 lose), c = #(method1 lose, method2 win).
export function mcnemar(b, c) {
  const n = b + c;
  const chi2 = n === 0 ? 0 : Math.pow(Math.abs(b - c) - 1, 2) / n;
  return { b, c, chi2: +chi2.toFixed(4) };
}

// Cliff's delta effect size for two independent samples.
export function cliffsDelta(a, x) {
  let gt = 0, lt = 0;
  for (const i of a) for (const j of x) { if (i > j) gt++; else if (i < j) lt++; }
  const d = (gt - lt) / (a.length * x.length);
  return +d.toFixed(4);
}

// Wilcoxon signed-rank statistic for paired samples (array of [x,y]).
// Returns W+ (sum of ranks of positive differences) and n (non-zero diffs).
export function wilcoxonSigned(pairs) {
  const diffs = pairs.map(([x, y]) => x - y).filter((d) => d !== 0);
  const abs = diffs.map((d) => Math.abs(d));
  const order = abs.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]);
  const ranks = new Array(diffs.length);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    const avg = (i + 1 + j + 1) / 2; // average rank for ties (1-based)
    for (let k = i; k <= j; k++) ranks[order[k][1]] = avg;
    i = j + 1;
  }
  let wPlus = 0, wMinus = 0;
  diffs.forEach((d, idx) => { if (d > 0) wPlus += ranks[idx]; else wMinus += ranks[idx]; });
  return { wPlus, wMinus, n: diffs.length };
}

// Seeded PRNG (mulberry32) for reproducible bootstrap.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Bootstrap percentile CI for a statistic over a sample.
export function bootstrapCI(samples, statFn = mean, n = 2000, seed = 42, alpha = 0.05) {
  const rng = mulberry32(seed);
  const stats = [];
  const N = samples.length;
  for (let b = 0; b < n; b++) {
    const res = new Array(N);
    for (let i = 0; i < N; i++) res[i] = samples[Math.floor(rng() * N)];
    stats.push(statFn(res));
  }
  stats.sort((x, y) => x - y);
  const lo = stats[Math.floor((alpha / 2) * n)];
  const hi = stats[Math.floor((1 - alpha / 2) * n)];
  return { lo: +lo.toFixed(4), hi: +hi.toFixed(4), point: +statFn(samples).toFixed(4) };
}

export function mean(a) { return a.reduce((s, x) => s + x, 0) / a.length; }

// Standard normal CDF via Abramowitz-Stegun erf approximation.
export function normalCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return p;
}

// Two-sided Wilcoxon signed-rank p-value (normal approximation w/ continuity).
export function wilcoxonP(pairs) {
  const { wPlus, n } = wilcoxonSigned(pairs);
  if (n === 0) return { wPlus, n, z: 0, p: 1 };
  const mu = (n * (n + 1)) / 4;
  const sigma = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24);
  if (sigma === 0) return { wPlus, n, z: 0, p: 1 };
  const z = (wPlus - mu - Math.sign(wPlus - mu) * 0.5) / sigma;
  const p = 2 * (1 - normalCdf(Math.abs(z)));
  return { wPlus, n, z: +z.toFixed(4), p: +Math.min(1, p).toFixed(4) };
}
