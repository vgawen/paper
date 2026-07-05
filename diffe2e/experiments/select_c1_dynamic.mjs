import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { semanticDiff } from '../pipeline/src/uidiff.mjs';
import { selectByUiLocator } from '../pipeline/src/selector.mjs';
import { selectionMetrics } from '../pipeline/src/metrics.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'out');
const TESTS = [
  { id: 'App.test.ts::default-turquoise', file: 'e2e/App.test.ts', title: 'use Turquoise as a default background color' },
  { id: 'App.test.ts::red', file: 'e2e/App.test.ts', title: 'use Red as a background color' },
  { id: 'App2.test.ts::turquoise', file: 'e2e/App2.test.ts', title: 'use Turquoise as a background color' },
];

function makeNew(oldSrc) {
  let s = oldSrc.replace('>Red</button>', '>Crimson</button>');
  s = s.replace(
    '  const handleMakeYellow = () => {\n    setBackgroundColor("#f1c40f")\n  }',
    '  const handleMakeYellow = () => {\n    setBackgroundColor("#f1c40f")\n  }\n  const handleMakeGreen = () => {\n    setBackgroundColor("#2ecc71")\n  }');
  s = s.replace('<button onClick={handleMakeYellow}>Yellow</button>',
    '<button onClick={handleMakeYellow}>Yellow</button>\n          <button onClick={handleMakeGreen}>Green</button>');
  return s;
}

function splitTests(src) {
  const blocks = {};
  const re = /test\(\s*(['"])(.*?)\1[\s\S]*?\n\}\)/g;
  let m;
  while ((m = re.exec(src))) blocks[m[2]] = m[0];
  return blocks;
}

export function computeC1Selection({ root }) {
  const app = path.join(root, 'src', 'App.tsx');
  const oldSrc = fs.readFileSync(app, 'utf8');
  const tmp = fs.mkdtempSync(path.join(OUT, '_c1select-'));
  try {
    const oldFile = path.join(tmp, 'App.old.tsx');
    const newFile = path.join(tmp, 'App.new.tsx');
    fs.writeFileSync(oldFile, oldSrc);
    fs.writeFileSync(newFile, makeNew(oldSrc));
    const uidiff = semanticDiff(oldFile, newFile);

    const blocksByFile = {
      'e2e/App.test.ts': splitTests(fs.readFileSync(path.join(root, 'e2e', 'App.test.ts'), 'utf8')),
      'e2e/App2.test.ts': splitTests(fs.readFileSync(path.join(root, 'e2e', 'App2.test.ts'), 'utf8')),
    };
    const perTestSrc = {};
    for (const t of TESTS) perTestSrc[t.id] = blocksByFile[t.file][t.title] || '';
    const selected = selectByUiLocator(uidiff, perTestSrc);
    const full = TESTS.map((t) => t.id);
    const affected = ['App.test.ts::red'];
    return {
      selected,
      full_count: full.length,
      selected_count: selected.length,
      affected,
      metrics: selectionMetrics({ full, selected, affected })
    };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const root = process.argv[2] || path.join(here, '..', 'real', 'cand_coverage');
  const result = computeC1Selection({ root });
  fs.writeFileSync(path.join(OUT, 'c1_select.json'), JSON.stringify(result, null, 2));
  console.log(`selected=${result.selected_count}/${result.full_count} Reduction=${result.metrics.Reduction}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
