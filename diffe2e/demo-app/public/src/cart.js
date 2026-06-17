let count = 0;

function price(qty) {
  // simple pure logic so a non-breaking change here is easy to demo
  return qty * 10;
}

export function render(root) {
  count = 0;
  root.innerHTML = `
    <section>
      <h1 data-testid="cart-title">Your Cart</h1>
      <button data-testid="cart-add">Add to cart</button>
      <span data-testid="cart-count">0</span>
      <span data-testid="cart-total">0</span>
    </section>
  `;
  const btn = root.querySelector('[data-testid="cart-add"]');
  const countEl = root.querySelector('[data-testid="cart-count"]');
  const totalEl = root.querySelector('[data-testid="cart-total"]');
  btn.addEventListener('click', () => {
    count += 1;
    countEl.textContent = String(count);
    totalEl.textContent = String(price(count));
  });
}
