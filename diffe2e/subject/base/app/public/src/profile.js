export function render(root) {
  root.innerHTML = `
    <section>
      <h1 data-testid="profile-title">Profile</h1>
      <span data-testid="profile-name">Guest</span>
      <button data-testid="profile-edit">Edit name</button>
    </section>
  `;
  const nameEl = root.querySelector('[data-testid="profile-name"]');
  const edit = root.querySelector('[data-testid="profile-edit"]');
  edit.addEventListener('click', () => {
    nameEl.textContent = 'Alice';
  });
}
