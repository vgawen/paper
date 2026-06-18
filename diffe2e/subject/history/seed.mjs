// Build an isolated nested git repo at subject/work/ with a scripted commit
// history (c00..cNN), each tagged and recorded in manifest.json. The replay
// engine checks out these tags. work/ is gitignored from the main repo.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SUBJECT = path.join(here, '..');
const BASE = path.join(SUBJECT, 'base');
const WORK = path.join(SUBJECT, 'work');
const SRC = () => path.join(WORK, 'app', 'public', 'src');
const TESTS = () => path.join(WORK, 'tests');

const git = (args) => execSync(`git ${args}`, { cwd: WORK, stdio: 'pipe' }).toString();
const read = (f) => fs.readFileSync(f, 'utf8');
const write = (f, s) => fs.writeFileSync(f, s);
const editSrc = (name, fn) => { const f = path.join(SRC(), name); write(f, fn(read(f))); };

// --- edit definitions: each mutates work files; type/desc for manifest grouping
const edits = [
  { id: 'c01', type: 'ui_text', desc: 'home desc copy change',
    apply: () => editSrc('home.js', (s) => s.replace('DiffE2E demo home page.', 'Welcome to the DiffE2E shop.')) },

  { id: 'c02', type: 'logic', desc: 'search adds an item',
    apply: () => editSrc('search.js', (s) => s.replace("'fig'", "'fig', 'grape'")) },

  { id: 'c03', type: 'new_feature_gap', desc: 'add /coupon route, no test',
    apply: () => {
      write(path.join(SRC(), 'coupon.js'),
        "export function render(root){root.innerHTML=`<section><h1 data-testid=\"coupon-title\">Coupon</h1>" +
        "<input data-testid=\"coupon-code\"/><button data-testid=\"coupon-apply\">Apply</button>" +
        "<span data-testid=\"coupon-msg\"></span></section>`;" +
        "const b=root.querySelector('[data-testid=\"coupon-apply\"]');" +
        "const c=root.querySelector('[data-testid=\"coupon-code\"]');" +
        "const m=root.querySelector('[data-testid=\"coupon-msg\"]');" +
        "b.addEventListener('click',()=>{m.textContent=c.value==='SAVE10'?'10% off':'invalid';});}\n");
      editSrc('main.js', (s) => s.replace("'/orders': () => import('./orders.js'),",
        "'/orders': () => import('./orders.js'),\n  '/coupon': () => import('./coupon.js'),"));
    } },

  { id: 'c04', type: 'multi_file', desc: 'util adds discount helper (non-breaking)',
    apply: () => editSrc('util.js', (s) => s + "\nexport function discount(cents, pct) {\n  return Math.round(cents * (1 - pct / 100));\n}\n") },

  { id: 'c05', type: 'ui_text', desc: 'profile title copy (not asserted)',
    apply: () => editSrc('profile.js', (s) => s.replace('Profile</h1>', 'My Profile</h1>')) },

  { id: 'c06', type: 'logic', desc: 'login trims username (non-breaking)',
    apply: () => editSrc('login.js', (s) => s.replace('user.value ?', 'user.value.trim() ?')) },

  { id: 'c07', type: 'logic', desc: 'orders appends an order (non-breaking)',
    apply: () => editSrc('orders.js', (s) => s.replace("{ id: 'A2', cents: 3200 },", "{ id: 'A2', cents: 3200 },\n  { id: 'A3', cents: 990 },")) },

  { id: 'c08', type: 'locator_break', desc: 'cart-add testid renamed -> cart-add breaks cart.spec',
    apply: () => editSrc('cart.js', (s) => s.replace(/data-testid="cart-add"/g, 'data-testid="cart-add-btn"')) },

  { id: 'c09', type: 'ui_text', desc: 'search input placeholder change',
    apply: () => editSrc('search.js', (s) => s.replace('placeholder="query"', 'placeholder="type to search"')) },

  { id: 'c10', type: 'refactor_noise', desc: 'home.js comment-only refactor',
    apply: () => editSrc('home.js', (s) => "// rendered by router\n" + s) },

  { id: 'c11', type: 'multi_file', desc: 'cart + login edited together (non-breaking)',
    apply: () => { editSrc('cart.js', (s) => s.replace('let count = 0;', 'let count = 0; // session cart'));
                   editSrc('login.js', (s) => s.replace('Please enter a username', 'Username required')); } },

  { id: 'c12', type: 'route', desc: 'main.js add /home alias (router broad change)',
    apply: () => editSrc('main.js', (s) => s.replace("'/home': () => import('./home.js'),",
      "'/home': () => import('./home.js'),\n  '/': () => import('./home.js'),")) },

  { id: 'c13', type: 'new_feature_gap', desc: 'add /wishlist route, no test',
    apply: () => {
      write(path.join(SRC(), 'wishlist.js'),
        "export function render(root){root.innerHTML=`<section><h1 data-testid=\"wishlist-title\">Wishlist</h1>" +
        "<button data-testid=\"wishlist-add\">Save</button><span data-testid=\"wishlist-count\">0</span></section>`;" +
        "let n=0;const b=root.querySelector('[data-testid=\"wishlist-add\"]');" +
        "const c=root.querySelector('[data-testid=\"wishlist-count\"]');" +
        "b.addEventListener('click',()=>{n++;c.textContent=String(n);});}\n");
      editSrc('main.js', (s) => s.replace("'/coupon': () => import('./coupon.js'),",
        "'/coupon': () => import('./coupon.js'),\n  '/wishlist': () => import('./wishlist.js'),"));
    } },

  { id: 'c14', type: 'logic', desc: 'orders.js sort orders (non-breaking)',
    apply: () => editSrc('orders.js', (s) => s.replace('export function render', '// orders newest-first soon\nexport function render')) },

  { id: 'c15', type: 'assertion_break', desc: 'login message Welcome->Hi breaks login.spec',
    apply: () => editSrc('login.js', (s) => s.replace('`Welcome, ${user.value', '`Hi, ${user.value')) },

  { id: 'c16', type: 'ui_text', desc: 'profile edited name Alice->Alice Lee (not asserted equal)',
    apply: () => editSrc('profile.js', (s) => s.replace("'Alice';", "'Alice';  // display name")) },
];

function sh(cmd) { execSync(cmd, { cwd: WORK, stdio: 'pipe' }); }

function main() {
  fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(WORK, { recursive: true });
  for (const item of ['app', 'tests', 'playwright.config.ts', 'package.json']) {
    fs.cpSync(path.join(BASE, item), path.join(WORK, item), { recursive: true });
  }
  // reuse base node_modules via symlink (browsers live in global cache)
  fs.symlinkSync(path.join(BASE, 'node_modules'), path.join(WORK, 'node_modules'), 'dir');

  sh('git init -q');
  sh('git config user.email seed@diffe2e.local');
  sh('git config user.name diffe2e-seed');
  sh('git add -A'); sh('git commit -q -m "c00 base"'); sh('git tag c00');

  const manifest = [{ tag: 'c00', type: 'base', desc: 'initial app', commit: git('rev-parse --short HEAD').trim() }];
  for (const e of edits) {
    e.apply();
    sh('git add -A');
    sh(`git commit -q -m "${e.id} ${e.type}: ${e.desc}"`);
    sh(`git tag ${e.id}`);
    manifest.push({ tag: e.id, type: e.type, desc: e.desc, commit: git('rev-parse --short HEAD').trim() });
  }
  const out = JSON.stringify(manifest, null, 2);
  write(path.join(WORK, 'manifest.json'), out);
  write(path.join(here, 'manifest.json'), out);
  console.log(`seeded ${manifest.length} commits (c00..${edits[edits.length - 1].id}) at ${WORK}`);
}

main();
