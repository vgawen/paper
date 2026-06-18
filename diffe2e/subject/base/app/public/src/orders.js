import { formatPrice } from './util.js';

const ORDERS = [
  { id: 'A1', cents: 1500 },
  { id: 'A2', cents: 3200 },
];

export function render(root) {
  root.innerHTML = `
    <section>
      <h1 data-testid="orders-title">Orders</h1>
      <ul data-testid="orders-list">
        ${ORDERS.map((o) => `<li>${o.id}: ${formatPrice(o.cents)}</li>`).join('')}
      </ul>
    </section>
  `;
}
