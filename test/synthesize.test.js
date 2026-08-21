// Unit tests for the synthesis engine. Run with: node --test
// No DeepSeek Harness runtime required — this validates the domain IP only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { synthesize, splitStatements, detectThemes, isPain, extractRole } from '../synthesize.js';

const SAMPLE = `
作为产品经理，我最头疼的是导出的报表太慢，每次都要等半天。
这个功能的操作流程太复杂，新人根本不会用，学习成本很高。
价格有点贵，性价比不太够，希望能便宜一点。
我希望能支持批量导出，现在只能一条条下载，太麻烦了。
客服回复太慢了，反馈的问题没人管，体验很差。
作为设计师，我担心数据隐私泄露，安全方面不够放心。
整体还行，但加载偶尔会卡顿。
`;

test('splitStatements removes short fragments and honors boundaries', () => {
  const st = splitStatements('好的。\n这是一个有效陈述，包含具体反馈。\n短');
  assert.ok(st.includes('这是一个有效陈述，包含具体反馈'));
  assert.ok(!st.some((s) => s.length < 4));
});

test('detectThemes maps keywords to stable theme ids', () => {
  assert.deepEqual(detectThemes('报表加载太慢了，经常卡顿'), ['performance']);
  assert.deepEqual(detectThemes('操作流程复杂，不会用'), ['usability']);
  assert.deepEqual(detectThemes('价格贵，不值'), ['price']);
});

test('isPain flags explicit need / frustration signals', () => {
  assert.equal(isPain('太麻烦了，希望有批量导出'), true);
  assert.equal(isPain('今天天气不错'), false);
});

test('extractRole captures persona hints', () => {
  assert.equal(extractRole('作为产品经理，我觉得流程复杂'), '产品经理');
  assert.equal(extractRole('今天天气不错'), null);
});

test('synthesize returns structured output with summary', () => {
  const out = synthesize(SAMPLE);
  assert.equal(typeof out.summary.statementsAnalyzed, 'number');
  assert.ok(out.summary.statementsAnalyzed > 0);
  assert.ok(out.summary.themesDetected >= 3, 'should detect multiple themes');
  assert.ok(out.summary.painPoints > 0, 'should capture explicit pain points');
});

test('synthesize surfaces performance & usability as top opportunities', () => {
  const out = synthesize(SAMPLE);
  const topThemes = out.opportunities.map((o) => o.theme);
  assert.ok(topThemes.includes('performance'), 'performance should rank');
  assert.ok(topThemes.includes('usability'), 'usability should rank');
  // opportunity score must be non-negative integer-ish and sorted desc
  for (let i = 1; i < out.opportunities.length; i++) {
    assert.ok(out.opportunities[i - 1].score >= out.opportunities[i].score);
  }
});

test('synthesize infers personas from role mentions', () => {
  const out = synthesize(SAMPLE);
  const roles = out.personas.map((p) => p.role);
  assert.ok(roles.includes('产品经理'));
  assert.ok(roles.includes('设计师'));
});

test('options clamp returned counts', () => {
  const out = synthesize(SAMPLE, { maxPersonas: 1, maxOpportunities: 2 });
  assert.ok(out.personas.length <= 1);
  assert.ok(out.opportunities.length <= 2);
});

test('empty input yields empty-but-valid structure', () => {
  const out = synthesize('');
  assert.equal(out.summary.statementsAnalyzed, 0);
  assert.equal(out.painPoints.length, 0);
  assert.equal(out.opportunities.length, 0);
});
