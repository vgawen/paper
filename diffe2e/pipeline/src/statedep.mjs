// State-dependency analysis for the side-effect case (评审意见 #2).
//
// Coverage-based RTS is safe only under test isolation (SAFETY.md H3). When a
// test t does NOT touch the changed files directly (cov(t) ∩ Δ = ∅) but is
// coupled to an affected test through SHARED SYSTEM STATE (localStorage,
// cookies, backend tables, globals, network endpoints...), t can be affected
// INDIRECTLY. Naive file-level coverage misses it. This module builds an
// inter-test state-dependency graph and conservatively closes the selection
// over it so such tests are not dropped ("宁可多跑也不漏").
//
// footprints: { testId: { reads: [resource], writes: [resource] } }
// A resource is any opaque string key (e.g. "localStorage:cartToken",
// "db:orders", "GET /api/cart").

// Build an undirected-by-resource dependency view with directed accessors:
//   provider(B) = tests that WRITE a resource B READS  (upstream writers)
//   dependent(A) = tests that READ a resource A WRITES (downstream readers)
// Plus a symmetric "shares a resource" relation used for conservative closure.
export function buildStateGraph(footprints = {}) {
  const ids = Object.keys(footprints);
  const fp = (t) => footprints[t] || { reads: [], writes: [] };
  const writesOf = (t) => new Set(fp(t).writes || []);
  const readsOf = (t) => new Set(fp(t).reads || []);

  const dependents = (t) => {
    const w = writesOf(t);
    return ids.filter((o) => o !== t && [...readsOf(o)].some((r) => w.has(r)));
  };
  const providers = (t) => {
    const r = readsOf(t);
    return ids.filter((o) => o !== t && [...writesOf(o)].some((w) => r.has(w)));
  };
  // Any test sharing at least one accessed resource (read or write) with t.
  const neighbors = (t) => {
    const acc = new Set([...readsOf(t), ...writesOf(t)]);
    return ids.filter((o) => {
      if (o === t) return false;
      const oacc = new Set([...readsOf(o), ...writesOf(o)]);
      return [...oacc].some((r) => acc.has(r));
    });
  };

  return { ids, dependents, providers, neighbors };
}

// Conservative closure: include every test connected to a selected test through
// the shared-resource relation (transitively). This captures BOTH upstream
// writers (state providers) and downstream readers of selected-affected tests.
export function closeSelection(selected = [], graph) {
  const inSet = new Set(selected);
  const queue = [...selected];
  while (queue.length) {
    const t = queue.shift();
    for (const n of graph.neighbors(t)) {
      if (!inSet.has(n)) { inSet.add(n); queue.push(n); }
    }
  }
  return [...inSet];
}
