// PRODUCER page. Visiting it has a SIDE EFFECT on shared backend state:
// it records a visit (POST /api/visits). It does NOT touch dashboard.js (the
// diff-related consumer), so file-level coverage of this test will NOT
// intersect a diff to dashboard.js — yet it is a precondition for the
// consumer test's correct verdict.
export async function render(root) {
  await fetch('/api/visits', { method: 'POST' });
  root.innerHTML = `<h1 data-testid="promo-title">Promo</h1>`;
}
