// Shared pure helpers (used by cart + orders) to enable multi-file change scenarios.
export function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2);
}
export function lineTotal(qty, unitCents) {
  return qty * unitCents;
}
