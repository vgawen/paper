const ITEMS = ['apple', 'banana', 'cherry', 'date', 'fig'];

export function render(root) {
  root.innerHTML = `
    <section>
      <h1 data-testid="search-title">Search</h1>
      <input data-testid="search-input" placeholder="query" />
      <button data-testid="search-go">Search</button>
      <ul data-testid="search-results"></ul>
    </section>
  `;
  const input = root.querySelector('[data-testid="search-input"]');
  const go = root.querySelector('[data-testid="search-go"]');
  const results = root.querySelector('[data-testid="search-results"]');
  go.addEventListener('click', () => {
    const q = input.value.toLowerCase();
    const hits = ITEMS.filter((i) => i.includes(q));
    results.innerHTML = hits.map((h) => `<li>${h}</li>`).join('');
  });
}
