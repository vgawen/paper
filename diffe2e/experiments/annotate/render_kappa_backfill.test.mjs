import test from 'node:test';
import assert from 'node:assert/strict';
import { renderRq2Section } from './render_kappa_backfill.mjs';

test('renderRq2Section reports pending wording when n=0', () => {
  const lines = renderRq2Section({
    n: 0,
    semantic_validity: 0,
    kappa: { kappa: 0 },
    by_arm: { diff: { semantic_validity: 0 }, nodiff: { semantic_validity: 0 } },
  });

  assert.ok(lines[1].includes('已从两个真实项目构建 30 条双盲标注样本'));
  assert.ok(lines[2].includes('尚未完成有效双标注评分'));
});
