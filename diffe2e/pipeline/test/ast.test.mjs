import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { semanticDiff, extract } from '../src/uidiff.mjs';
import { changedEntities } from '../src/astEntities.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const OLD = path.join(dir, '..', 'fixtures', 'App.old.tsx');
const NEW = path.join(dir, '..', 'fixtures', 'App.new.tsx');

test('uidiff: extract finds buttons and link in real JSX', () => {
  const nodes = extract(OLD);
  const texts = nodes.map((n) => n.text);
  assert.ok(texts.includes('Red'));
  assert.ok(texts.includes('Turquoise'));
});

test('uidiff: semanticDiff detects REMOVE/ADD/MODIFY', () => {
  const d = semanticDiff(OLD, NEW);
  assert.ok(d.REMOVE.some((r) => r.key === 'button:text:Red'));
  assert.ok(d.ADD.some((a) => a.key === 'button:text:Crimson'));
  assert.ok(d.MODIFY.some((m) => m.changes && m.changes.href));
});

test('astEntities: changed line maps to enclosing handler', () => {
  // line 11 in App.old.tsx is `setBackgroundColor("#e74c3c")` inside handleMakeRed
  const ents = changedEntities(OLD, [11]);
  assert.ok(ents.some((e) => e.kind === 'function' && e.name === 'handleMakeRed'));
});
