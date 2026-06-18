import { formatPrice, lineTotal } from './util.js';

let count = 0;
const UNIT_CENTS = 1000;

export function render(root) {
  count = 0;
  root.innerHTML = `
    <section>
      <h1 data-testid="cart-title">Your Cart</h1>
      <button data-testid="cart-add">Add to cart</button>
      <span data-testid="cart-count">0</span>
      <span data-testid="cart-total">${formatPrice(0)}</span>
    </section>
  `;
  const btn = root.querySelector('[data-testid="cart-add"]');
  const countEl = root.querySelector('[data-testid="cart-count"]');
  const totalEl = root.querySelector('[data-testid="cart-total"]');
  btn.addEventListener('click', () => {
    count += 1;
    countEl.textContent = String(count);
    totalEl.textContent = formatPrice(lineTotal(count, UNIT_CENTS));
  });
}
