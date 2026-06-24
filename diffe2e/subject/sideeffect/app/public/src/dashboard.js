// CONSUMER page = the diff-related code (Δ = {src/dashboard.js}). It READS the
// shared backend state (GET /api/visits) and renders the accumulated count.
// Its observable outcome depends on whether the producer (promo) ran first and
// left a side effect in the backend.
export async function render(root) {
  const r = await fetch('/api/visits');
  const { visits } = await r.json();
  root.innerHTML =
    `<h1 data-testid="dash-label">Visits</h1><span data-testid="dash-count">${visits}</span>`;
}
