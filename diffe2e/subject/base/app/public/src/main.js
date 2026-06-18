// Router: dynamic import per route so each E2E test only loads its feature's
// source file(s) -> clean per-test coverage attribution.

const routes = {
  '/home': () => import('./home.js'),
  '/cart': () => import('./cart.js'),
  '/login': () => import('./login.js'),
  '/profile': () => import('./profile.js'),
  '/search': () => import('./search.js'),
  '/orders': () => import('./orders.js'),
};

async function render() {
  const path = location.hash.slice(1) || '/home';
  const root = document.getElementById('app');
  const load = routes[path] || routes['/home'];
  const mod = await load();
  mod.render(root);
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);
