export function render(root) {
  root.innerHTML = `
    <section>
      <h1 data-testid="login-title">Login</h1>
      <input data-testid="login-user" placeholder="username" />
      <input data-testid="login-pass" type="password" placeholder="password" />
      <button data-testid="login-submit">Sign in</button>
      <p data-testid="login-msg"></p>
    </section>
  `;
  const user = root.querySelector('[data-testid="login-user"]');
  const submit = root.querySelector('[data-testid="login-submit"]');
  const msg = root.querySelector('[data-testid="login-msg"]');
  submit.addEventListener('click', () => {
    msg.textContent = user.value ? `Welcome, ${user.value}` : 'Please enter a username';
  });
}
