// 第三步：把扩展历史的受控缺口从 5 个补到 10 个。
//
// 做法：
// - 从阶段三的 work_exp.bundle 克隆到 /tmp/expv3/work_exp（不改原扩展历史产物）；
// - 在 x05 之后依次提交 y01..y05：每个 commit 只新增一个路由源文件 + 在 main.js
//   注册路由，不写测试；
// - 导出新的完整 bundle 到本目录；
// - 实验前写 manifest_expansion_v2.json（预注册，格式与 manifest_expansion.json 一致）。
//
// 纳入规则与上一批相同：扩展历史中所有“新增路由且无测试”的 commit 全部纳入，
// 不做结果驱动筛选。x01–x05 不重建、不重跑（其 v2 结果沿用第二步产物）。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..', '..', '..'); // diffe2e/
const SRC_BUNDLE = path.join(ROOT, 'experiments', 'out', 'expansion_20261108', 'gaps', 'work_exp.bundle');
const WORK = '/tmp/expv3/work_exp';
const OUT_BUNDLE = path.join(here, 'work_exp_v2.bundle');
const OUT = path.join(here, 'manifest_expansion_v2.json');

const shell = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'pipe', maxBuffer: 20 * 1024 * 1024 }).toString().trim();
const git = (args) => shell(`git ${args}`, WORK);
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

const gaps = [
  {
    gap_id: 'y01',
    route: '/notifications',
    source_file: 'app/public/src/notifications.js',
    route_type: '通知开关（notification toggle）',
    interaction: '点击复选框（change 事件）',
    signal_density: 'data-testid 富集 + aria-label',
    data_testids: ['notif-title', 'notif-toggle', 'notif-status'],
    aria_signals: ['aria-label="Enable alerts"'],
    expected_affected: [],
    expected_affected_rationale: '新增路由，既有 6 个 spec 均不导航到 /notifications，预期覆盖映射为空',
    pre_expectation: {
      diff: '可执行且 change-relevant；testid/文本/属性/逻辑均可杀（与 x01 同类结构）',
      nodiff: '可能可执行但不指向 /notifications，预期 change-relevant=false',
    },
    code: [
      'export function render(root){',
      '  root.innerHTML=`<section><h1 data-testid="notif-title">Notifications</h1>',
      '  <label><input type="checkbox" data-testid="notif-toggle" aria-label="Enable alerts"/> Enable alerts</label>',
      '  <span data-testid="notif-status">Alerts disabled</span></section>`;',
      '  const box=root.querySelector(\'[data-testid="notif-toggle"]\');',
      '  const status=root.querySelector(\'[data-testid="notif-status"]\');',
      '  box.addEventListener(\'change\',()=>{',
      '    status.textContent=box.checked?\'Alerts enabled\':\'Alerts disabled\';',
      '  });',
      '}',
    ].join('\n') + '\n',
  },
  {
    gap_id: 'y02',
    route: '/survey',
    source_file: 'app/public/src/survey.js',
    route_type: '表单提交（survey submit）',
    interaction: '选择下拉项 + 填写文本域 + 点击提交',
    signal_density: '仅可见文本 / role / aria（无 data-testid）',
    data_testids: [],
    aria_signals: ['aria-label="Favorite color"', 'aria-label="Note"', 'role="status"'],
    expected_affected: [],
    expected_affected_rationale: '新增路由，既有 spec 不覆盖；无 testid，覆盖映射为空',
    pre_expectation: {
      diff: '可执行概率中等（依赖 LLM 从角色/标签定位）；change-relevant 应成立',
      nodiff: '可能可执行但指向既有路由，预期 change-relevant=false',
    },
    code: [
      'export function render(root){',
      '  root.innerHTML=`<section><h1>Survey</h1>',
      '  <label for="sv-color">Favorite color</label>',
      '  <select id="sv-color" name="color" aria-label="Favorite color"><option>Red</option><option>Blue</option></select>',
      '  <label for="sv-note">Note</label>',
      '  <textarea id="sv-note" name="note" aria-label="Note"></textarea>',
      '  <button type="button">Submit survey</button>',
      '  <p role="status"></p></section>`;',
      '  const choice=root.querySelector(\'#sv-color\');',
      '  const btn=root.querySelector(\'button\');',
      '  const msg=root.querySelector(\'[role="status"]\');',
      '  btn.addEventListener(\'click\',()=>{msg.textContent=`Recorded ${choice.value} choice`;});',
      '}',
    ].join('\n') + '\n',
  },
  {
    gap_id: 'y03',
    route: '/downloads',
    source_file: 'app/public/src/downloads.js',
    route_type: '列表清空（list clear）',
    interaction: '点击按钮清空列表并更新计数',
    signal_density: 'testid 容器 + 可见文本计数',
    data_testids: ['downloads-title', 'downloads-list', 'downloads-count'],
    aria_signals: [],
    expected_affected: [],
    expected_affected_rationale: '新增路由，既有 spec 不覆盖 /downloads',
    pre_expectation: {
      diff: '可执行且 change-relevant；文本/属性（按钮名/禁用）/结构/逻辑算子均有注入点',
      nodiff: '可能可执行但指向既有路由，预期 change-relevant=false',
    },
    code: [
      'const FILES=[\'report.pdf\',\'invoice.pdf\',\'manual.pdf\'];',
      'export function render(root){',
      '  root.innerHTML=`<section><h1 data-testid="downloads-title">Downloads</h1>',
      '  <ul data-testid="downloads-list">${FILES.map(f=>`<li>${f}</li>`).join(\'\')}</ul>',
      '  <button type="button">Clear list</button>',
      '  <span data-testid="downloads-count">3 files</span></section>`;',
      '  const btn=root.querySelector(\'button\');',
      '  const list=root.querySelector(\'[data-testid="downloads-list"]\');',
      '  const count=root.querySelector(\'[data-testid="downloads-count"]\');',
      '  btn.addEventListener(\'click\',()=>{',
      '    list.innerHTML=\'\';',
      '    count.textContent=\'0 files\';',
      '  });',
      '}',
    ].join('\n') + '\n',
  },
  {
    gap_id: 'y04',
    route: '/support',
    source_file: 'app/public/src/support.js',
    route_type: '长度阈值校验（length threshold）',
    interaction: '填写文本域 + 点击检查（阈值分支）',
    signal_density: '仅 role / aria / 可见文本（无 data-testid）',
    data_testids: [],
    aria_signals: ['aria-label="Message"', 'role="status"'],
    expected_affected: [],
    expected_affected_rationale: '新增路由，既有 spec 不覆盖；无 testid',
    pre_expectation: {
      diff: '可执行概率中等；逻辑算子（阈值分支对调）只在断言结果文案时被杀死',
      nodiff: '可能可执行但指向既有路由，预期 change-relevant=false',
    },
    code: [
      'export function render(root){',
      '  root.innerHTML=`<section><h1>Support</h1>',
      '  <label for="sup-msg">Message</label>',
      '  <textarea id="sup-msg" aria-label="Message"></textarea>',
      '  <button type="button">Check message</button>',
      '  <p role="status">Waiting for input</p></section>`;',
      '  const msg=root.querySelector(\'#sup-msg\');',
      '  const btn=root.querySelector(\'button\');',
      '  const out=root.querySelector(\'[role="status"]\');',
      '  btn.addEventListener(\'click\',()=>{',
      '    const n=msg.value.trim().length;',
      '    out.textContent=n>=20?\'Message long enough\':\'Message too short\';',
      '  });',
      '}',
    ].join('\n') + '\n',
  },
  {
    gap_id: 'y05',
    route: '/reports',
    source_file: 'app/public/src/reports.js',
    route_type: '报表生成（report generate）',
    interaction: '选择周期 + 点击生成（结果串包含所选周期）',
    signal_density: 'testid + role',
    data_testids: ['reports-title', 'reports-status'],
    aria_signals: ['aria-label="Period"', 'role="status"'],
    expected_affected: [],
    expected_affected_rationale: '新增路由，既有 spec 不覆盖 /reports',
    pre_expectation: {
      diff: '可执行且 change-relevant；结果串与周期选择可被文本/属性/逻辑算子杀',
      nodiff: '可能可执行但指向既有路由，预期 change-relevant=false',
    },
    code: [
      'export function render(root){',
      '  root.innerHTML=`<section><h1 data-testid="reports-title">Reports</h1>',
      '  <label for="rp-period">Period</label>',
      '  <select id="rp-period" aria-label="Period"><option>Week</option><option>Month</option></select>',
      '  <button type="button">Generate report</button>',
      '  <p data-testid="reports-status" role="status">No report</p></section>`;',
      '  const period=root.querySelector(\'#rp-period\');',
      '  const btn=root.querySelector(\'button\');',
      '  const out=root.querySelector(\'[data-testid="reports-status"]\');',
      '  btn.addEventListener(\'click\',()=>{',
      '    out.textContent=`Report for ${period.value}: 12 rows`;',
      '  });',
      '}',
    ].join('\n') + '\n',
  },
];

function addRoute(src, route, file) {
  const line = `  '${route}': () => import('./${file}'),\n};`;
  return src.replace(/\n};/, `\n${line}`);
}

function main() {
  if (fs.existsSync(WORK)) fs.rmSync(WORK, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(WORK), { recursive: true });
  shell(`git clone -q ${SRC_BUNDLE} ${WORK}`, path.dirname(WORK));
  git('config user.email seed@diffe2e.local');
  git('config user.name diffe2e-seed');
  git('checkout -q main');

  const parentTagOf = (id, idx) => (idx === 1 ? 'x05' : `y0${idx - 1}`);
  const prevTag = 'x05';
  const prevCommit = git('rev-parse --short x05');
  const historyTagsBefore = git('tag').split('\n').filter(Boolean).sort();

  const manifest = {
    batch: 'new10_20261108',
    created_at: new Date().toISOString(),
    stage: '第三步：受控缺口扩样 5 → 10（扩展历史追加 y01–y05）',
    inclusion_rule: '扩展历史中所有“新增路由且无测试”的 commit 全部纳入；x01–x05 沿用上一批，y01–y05 为本批新增，不做结果驱动筛选',
    extension_history: 'subject/work_exp 的独立克隆（/tmp/expv3/work_exp），从阶段三 bundle 恢复后追加提交；不追加到主 24 过渡历史',
    main_history_untouched: {
      worktree: 'subject/work（未创建/未修改）',
      manifest: 'subject/history/manifest.json（只读引用，未写入）',
      main_gaps_reference: [
        { tag: 'c03', route: '/coupon', manifest_commit: '0ddfb1a', desc: 'add /coupon route, no test' },
        { tag: 'c13', route: '/wishlist', manifest_commit: '0938e31', desc: 'add /wishlist route, no test' },
        { tag: 'c19', route: '/faq', manifest_commit: 'e345769', desc: 'add /faq route, no test' },
      ],
    },
    lineage: {
      previous_batch_manifest: 'diffe2e/experiments/out/expansion_20261108/gaps/manifest_expansion.json',
      previous_batch_manifest_sha256: '7a675361d5429eab553a2dafa26584ab4a8672c016491a8f50c7ca47ff320506',
      source_bundle: 'diffe2e/experiments/out/expansion_20261108/gaps/work_exp.bundle',
      source_bundle_sha256: '6de585cebc97fdb6578dc916828fdca05243d5635b77fc88eaeae6cea35db667',
      parent_tag: prevTag,
      parent_commit: prevCommit,
      history_tags_before: historyTagsBefore,
    },
    gaps: [],
  };

  let idx = 0;
  for (const gap of gaps) {
    idx += 1;
    const file = gap.source_file.split('/').pop();
    fs.writeFileSync(path.join(WORK, gap.source_file), gap.code);
    const mainPath = path.join(WORK, 'app', 'public', 'src', 'main.js');
    fs.writeFileSync(mainPath, addRoute(fs.readFileSync(mainPath, 'utf8'), gap.route, file));
    git(`add ${gap.source_file} app/public/src/main.js`);
    git(`commit -q -m "${gap.gap_id} new_feature_gap: add ${gap.route} route, no test"`);
    git(`tag ${gap.gap_id}`);
    const commit = git('rev-parse --short HEAD');
    manifest.gaps.push({
      ...gap,
      tag: gap.gap_id,
      parent_tag: parentTagOf(gap.gap_id, idx),
      source_commit: commit,
      changed_files: [gap.source_file, 'app/public/src/main.js'],
      source_file_sha256: sha256(Buffer.from(gap.code)),
      no_test_added: true,
      registered_before_experiment: true,
    });
  }

  manifest.y_history_head = git('rev-parse --short HEAD');
  manifest.y_tags = manifest.gaps.map((g) => g.tag);

  fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');
  shell(`git bundle create ${OUT_BUNDLE} --all`, WORK);

  console.log(`built work_exp v2 at ${WORK}`);
  console.log(`manifest_expansion_v2 -> ${OUT}`);
  console.log(`bundle -> ${OUT_BUNDLE}`);
  for (const x of manifest.gaps) console.log(`${x.tag} ${x.route} parent=${x.parent_tag} commit=${x.source_commit}`);
}

main();
