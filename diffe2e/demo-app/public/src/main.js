// Router: dynamically imports the route module so that each E2E test only
// loads the source file(s) for the feature it exercises. This makes per-test
// JS coverage attribution clean (a Home test does not load cart.js, etc.).

const routes = {
  '/home': () => import('./home.js'),
  '/cart': () => import('./cart.js'),
  '/login': () => import('./login.js'),
  '/profile': () => import('./profile.js'),
};

async function render() {
  const path = (location.hash.slice(1)) || '/home';
  const root = document.getElementById('app');
  const load = routes[path] || routes['/home'];
  const mod = await load();
  mod.render(root);
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);
