// Simulate a code change (the "diff") on a source file to produce V_new.
// Default: a non-breaking change to cart.js (tests still pass, file still
// executed by cart test) so that the affected oracle = {cart test}.
//
// Usage:
//   node tools/mutate.mjs apply   # apply the change
//   node tools/mutate.mjs revert  # revert the change

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET = path.join(__dirname, '..', 'demo-app', 'public', 'src', 'cart.js');
const MARK = '// [mutated:vnew] non-breaking change for oracle demo';

const cmd = process.argv[2];
let src = fs.readFileSync(TARGET, 'utf-8');

if (cmd === 'apply') {
  if (!src.includes(MARK)) {
    // non-breaking tweak: adjust internal comment + keep behavior identical
    src = src.replace(
      'function price(qty) {',
      `${MARK}\nfunction price(qty) {`
    );
    fs.writeFileSync(TARGET, src);
    console.log('applied mutation to', path.relative(process.cwd(), TARGET));
  } else {
    console.log('mutation already applied');
  }
} else if (cmd === 'revert') {
  src = src.replace(`${MARK}\n`, '');
  fs.writeFileSync(TARGET, src);
  console.log('reverted mutation');
} else {
  console.error('usage: node tools/mutate.mjs apply|revert');
  process.exit(2);
}
