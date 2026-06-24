import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStateGraph, closeSelection } from '../src/statedep.mjs';

// footprints: { testId: { reads: [resource], writes: [resource] } }
const footprints = {
  // A writes a shared cart token that B later reads (data-flow dependency).
  A: { reads: [], writes: ['localStorage:cartToken'] },
  B: { reads: ['localStorage:cartToken'], writes: [] },
  // C is fully isolated.
  C: { reads: ['localStorage:theme'], writes: [] },
};

test('buildStateGraph links writer -> reader on a shared resource', () => {
  const g = buildStateGraph(footprints);
  // A writes cartToken, B reads it => edge A ⤳ B exists.
  assert.ok(g.dependents('A').includes('B'));
  assert.ok(g.providers('B').includes('A'));
  // C shares nothing with A/B.
  assert.deepEqual(g.dependents('C'), []);
});

test('closeSelection pulls in upstream writers of selected-affected reads', () => {
  const g = buildStateGraph(footprints);
  // B is selected & affected; A (its upstream writer) must be pulled in even
  // though A does not touch the changed files directly (the side-effect case).
  const closed = closeSelection(['B'], g);
  assert.ok(closed.includes('A'));
  assert.ok(closed.includes('B'));
});

test('closeSelection also pulls downstream readers sharing a resource', () => {
  const g = buildStateGraph(footprints);
  // A selected & affected; B reads A's resource => conservatively include B.
  const closed = closeSelection(['A'], g);
  assert.deepEqual(closed.sort(), ['A', 'B']);
});

test('closeSelection is idempotent and excludes unrelated tests', () => {
  const g = buildStateGraph(footprints);
  const closed = closeSelection(['A'], g);
  assert.ok(!closed.includes('C'));
  assert.deepEqual(closeSelection(closed, g).sort(), closed.sort());
});

test('closeSelection handles tests with no footprint gracefully', () => {
  const g = buildStateGraph({ X: { reads: [], writes: [] } });
  assert.deepEqual(closeSelection(['X'], g), ['X']);
});
