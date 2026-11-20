// 阶段三：构建独立扩展历史 work_exp（x00 基线 + x01..x05 五个新缺口）。
//
// 关键约束：
// - 不改 subject/work 与 subject/history/manifest.json；扩展历史单独成仓。
// - 每条缺口只做两件事：新增一个路由源文件、在 main.js 注册路由；不写测试。
// - 缺口清单在跑实验前固定（纳入规则：扩展历史中所有“新增路由且无测试”的
//   commit 全部纳入），manifest_expansion.json 先于实验生成。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..', '..', '..', '..', '..'); // diffe2e/
const SUBJECT = path.join(ROOT, 'subject');
const BASE = path.join(SUBJECT, 'base');
const WORK = path.join(SUBJECT, 'work_exp');
const OUT = path.join(here, '..', 'manifest_expansion.json');

const git = (args) => execSync(`git ${args}`, { cwd: WORK, stdio: 'pipe' }).toString().trim();
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

// 缺口源码（顺序敏感：x01..x05 依次提交）
const gaps = [
  {
    gap_id: 'x01',
    route: '/settings',
    source_file: 'app/public/src/settings.js',
    route_type: '设置开关（settings toggle）',
    interaction: '点击复选框（change 事件）',
    signal_density: 'data-testid 富集',
    data_testids: ['settings-title', 'settings-compact', 'settings-status'],
    aria_signals: ['aria-label="Compact mode"'],
    expected_affected: [],
    expected_affected_rationale: '新增路由，既有 6 个 spec 均不导航到 /settings，预期覆盖映射为空',
    pre_expectation: {
      diff: '可执行且 change-relevant；变异杀伤预期较高（testid/文本/逻辑均可杀）',
      nodiff: '可能可执行但不指向 /settings，预期 change-relevant=false',
    },
    code: [
      'export function render(root){',
      '  root.innerHTML=`<section><h1 data-testid="settings-title">Settings</h1>',
      '  <label><input type="checkbox" data-testid="settings-compact" aria-label="Compact mode"/> Compact mode</label>',
      '  <span data-testid="settings-status">Compact mode off</span></section>`;',
      '  const box=root.querySelector(\'[data-testid="settings-compact"]\');',
      '  const status=root.querySelector(\'[data-testid="settings-status"]\');',
      '  box.addEventListener(\'change\',()=>{',
      '    status.textContent=box.checked?\'Compact mode on\':\'Compact mode off\';',
      '  });',
      '}',
    ].join('\n') + '\n',
  },
  {
    gap_id: 'x02',
    route: '/feedback',
    source_file: 'app/public/src/feedback.js',
    route_type: '表单提交（form submit）',
    interaction: '选择下拉项 + 填写文本域 + 点击提交',
    signal_density: '仅可见文本 / role / aria（无 data-testid）',
    data_testids: [],
    aria_signals: ['aria-label="Rating"', 'aria-label="Comment"', 'role="status"'],
    expected_affected: [],
    expected_affected_rationale: '新增路由，既有 spec 不覆盖；无 testid，覆盖映射仍为空',
    pre_expectation: {
      diff: '可执行概率中等（依赖 LLM 从角色/标签定位）；change-relevant 应成立',
      nodiff: '可能可执行但指向既有路由，预期 change-relevant=false',
    },
    code: [
      'export function render(root){',
      '  root.innerHTML=`<section><h1>Feedback</h1>',
      '  <label for="fb-rating">Rating</label>',
      '  <select id="fb-rating" name="rating" aria-label="Rating"><option>Good</option><option>Bad</option></select>',
      '  <label for="fb-comment">Comment</label>',
      '  <textarea id="fb-comment" name="comment" aria-label="Comment"></textarea>',
      '  <button type="button">Send feedback</button>',
      '  <p role="status"></p></section>`;',
      '  const rating=root.querySelector(\'#fb-rating\');',
      '  const btn=root.querySelector(\'button\');',
      '  const msg=root.querySelector(\'[role="status"]\');',
      '  btn.addEventListener(\'click\',()=>{msg.textContent=`Thanks, ${rating.value}`;});',
      '}',
    ].join('\n') + '\n',
  },
  {
    gap_id: 'x03',
    route: '/inbox',
    source_file: 'app/public/src/inbox.js',
    route_type: '列表筛选（list filter）',
    interaction: '在输入框中键入过滤词（input 事件）',
    signal_density: 'testid 容器 + 可见文本列表项',
    data_testids: ['inbox-title', 'inbox-filter', 'inbox-list'],
    aria_signals: ['placeholder="filter messages"'],
    expected_affected: [],
    expected_affected_rationale: '新增路由，既有 spec 不覆盖 /inbox',
    pre_expectation: {
      diff: '可执行且 change-relevant；文本/属性算子预期可杀，逻辑算子（includes→startsWith）可杀',
      nodiff: '可能可执行但指向既有路由，预期 change-relevant=false',
    },
    code: [
      'const MESSAGES=[\'Welcome aboard\',\'Your order shipped\',\'Weekly digest\'];',
      'export function render(root){',
      '  root.innerHTML=`<section><h1 data-testid="inbox-title">Inbox</h1>',
      '  <input data-testid="inbox-filter" placeholder="filter messages"/>',
      '  <ul data-testid="inbox-list">${MESSAGES.map(m=>`<li>${m}</li>`).join(\'\')}</ul></section>`;',
      '  const input=root.querySelector(\'[data-testid="inbox-filter"]\');',
      '  const list=root.querySelector(\'[data-testid="inbox-list"]\');',
      '  input.addEventListener(\'input\',()=>{',
      '    const q=input.value.toLowerCase();',
      '    list.innerHTML=MESSAGES.filter(m=>m.toLowerCase().includes(q)).map(m=>`<li>${m}</li>`).join(\'\');',
      '  });',
      '}',
    ].join('\n') + '\n',
  },
  {
    gap_id: 'x04',
    route: '/checkout',
    source_file: 'app/public/src/checkout.js',
    route_type: '条件逻辑 / 边界（conditional logic）',
    interaction: '填写数量 + 点击计算（阈值分支）',
    signal_density: '仅 role / aria / 可见文本（无 data-testid）',
    data_testids: [],
    aria_signals: ['aria-label="Quantity"', 'role="status"'],
    expected_affected: [],
    expected_affected_rationale: '新增路由，既有 spec 不覆盖；无 testid',
    pre_expectation: {
      diff: '可执行概率中等；逻辑算子（>=3 → >3）只有断言边界时才会被杀死',
      nodiff: '可能可执行但指向既有路由，预期 change-relevant=false',
    },
    code: [
      'export function render(root){',
      '  root.innerHTML=`<section><h1>Checkout</h1>',
      '  <label for="qty">Quantity</label>',
      '  <input id="qty" type="number" aria-label="Quantity" value="1" min="1"/>',
      '  <button type="button">Calculate total</button>',
      '  <p role="status">Total $10.00, shipping $5.00</p></section>`;',
      '  const qty=root.querySelector(\'#qty\');',
      '  const btn=root.querySelector(\'button\');',
      '  const out=root.querySelector(\'[role="status"]\');',
      '  btn.addEventListener(\'click\',()=>{',
      '    const n=Math.max(1, Number(qty.value)||1);',
      '    const total=n*1000;',
      '    out.textContent=`Total $${(total/100).toFixed(2)}, ${n>=3?\'free shipping\':\'shipping $5.00\'}`;',
      '  });',
      '}',
    ].join('\n') + '\n',
  },
  {
    gap_id: 'x05',
    route: '/help',
    source_file: 'app/public/src/help.js',
    route_type: '可展开详情（expandable detail）',
    interaction: '点击按钮切换详情可见性',
    signal_density: '仅可见文本 + aria-label（无 data-testid）',
    data_testids: [],
    aria_signals: ['aria-label="Contact details"'],
    expected_affected: [],
    expected_affected_rationale: '新增路由，既有 spec 不覆盖；无 testid',
    pre_expectation: {
      diff: '可执行概率中等；结构算子（初始隐藏→可见）与逻辑算子（切换失效）可杀',
      nodiff: '可能可执行但指向已有路由，预期 change-relevant=false',
    },
    code: [
      'export function render(root){',
      '  root.innerHTML=`<section><h1>Help Center</h1>',
      '  <button type="button" aria-label="Contact details">Show contact details</button>',
      '  <p hidden>Email support@example.com</p></section>`;',
      '  const btn=root.querySelector(\'button\');',
      '  const details=root.querySelector(\'p\');',
      '  btn.addEventListener(\'click\',()=>{details.hidden=!details.hidden;});',
      '}',
    ].join('\n') + '\n',
  },
];

function addRoute(src, route, file) {
  const line = `  '${route}': () => import('./${file}'),\n};`;
  return src.replace(/\n};/, `\n${line}`);
}

function main() {
  if (!fs.existsSync(path.join(WORK, '.git'))) {
    fs.rmSync(path.join(WORK, '.git'), { recursive: true, force: true });
    const g = (a) => execSync(`git ${a}`, { cwd: WORK, stdio: 'pipe' }).toString().trim();
    g('init -q');
    g('config user.email seed@diffe2e.local');
    g('config user.name diffe2e-seed');
    g('add -A');
    g('commit -q -m "x00 base (copy of subject/base c00)"');
    g('tag x00');
  }
  const g = (a) => execSync(`git ${a}`, { cwd: WORK, stdio: 'pipe' }).toString().trim();

  const baseCommit = g('rev-parse --short x00');
  const baseHashes = {};
  for (const f of fs.readdirSync(path.join(WORK, 'app', 'public', 'src')).sort()) {
    baseHashes[`app/public/src/${f}`] = sha256(fs.readFileSync(path.join(WORK, 'app', 'public', 'src', f)));
  }

  const manifest = {
    batch: 'expansion_20261108/gaps',
    created_at: new Date().toISOString(),
    stage: '阶段三：受控缺口扩样 3 → 8',
    inclusion_rule: '扩展历史中所有“新增路由且无测试”的 commit 全部纳入（x01–x05，无结果驱动筛选）',
    extension_history: 'subject/work_exp（独立 git 仓，从 subject/base 复制，不追加到主 24 过渡历史）',
    main_history_untouched: {
      worktree: 'subject/work（未创建/未修改；本次实验不依赖其可写副本）',
      manifest: 'subject/history/manifest.json（只读引用，未写入）',
      main_gaps_reference: [
        { tag: 'c03', route: '/coupon', manifest_commit: '0ddfb1a', desc: 'add /coupon route, no test' },
        { tag: 'c13', route: '/wishlist', manifest_commit: '0938e31', desc: 'add /wishlist route, no test' },
        { tag: 'c19', route: '/faq', manifest_commit: 'e345769', desc: 'add /faq route, no test' },
      ],
    },
    base: {
      tag: 'x00',
      commit: baseCommit,
      source: 'subject/base（主 manifest c00 的同源副本，主 manifest 记录 d78b464）',
      app_source_sha256: baseHashes,
    },
    gaps: [],
  };

  for (const gap of gaps) {
    const file = gap.source_file.split('/').pop();
    fs.writeFileSync(path.join(WORK, gap.source_file), gap.code);
    const mainPath = path.join(WORK, 'app', 'public', 'src', 'main.js');
    fs.writeFileSync(mainPath, addRoute(fs.readFileSync(mainPath, 'utf8'), gap.route, file));
    g('add -A');
    g(`commit -q -m "${gap.gap_id} new_feature_gap: add ${gap.route} route, no test"`);
    g(`tag ${gap.gap_id}`);
    const commit = g('rev-parse --short HEAD');
    manifest.gaps.push({
      ...gap,
      tag: gap.gap_id,
      parent_tag: gap.gap_id === 'x01' ? 'x00' : `x0${Number(gap.gap_id.slice(2)) - 1}`,
      source_commit: commit,
      changed_files: [gap.source_file, 'app/public/src/main.js'],
      source_file_sha256: sha256(Buffer.from(gap.code)),
      no_test_added: true,
      registered_before_experiment: true,
    });
  }

  // 预注册文件写入扩展产物目录（实验前生成）
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`built work_exp at ${WORK}`);
  console.log(`manifest_expansion -> ${OUT}`);
  for (const x of manifest.gaps) console.log(`${x.tag} ${x.route} commit=${x.source_commit} files=${x.changed_files.join(',')}`);
}

main();
