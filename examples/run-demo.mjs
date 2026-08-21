// 轻量试验：不装 dsh 也能看插件"大脑"怎么工作。
// 用法：node examples/run-demo.mjs
import { readFileSync } from 'node:fs';
import { synthesize, THEME_TAXONOMY } from '../synthesize.js';

const labelOf = (id) => THEME_TAXONOMY.find((t) => t.id === id)?.label ?? id;

const notes = readFileSync(new URL('./sample-interview.md', import.meta.url), 'utf-8');
const result = synthesize(notes, { maxOpportunities: 6, maxPersonas: 6 });

console.log('========== 分析概览 ==========');
console.log(
  `分析了 ${result.summary.statementsAnalyzed} 条用户原话，` +
  `识别出 ${result.summary.painPoints} 个明确痛点，` +
  `${result.summary.themesDetected} 个主题`
);

console.log('\n========== 用户画像 ==========');
if (result.personas.length === 0) {
  console.log('（笔记里没有明确的角色自述，比如"作为运营/我是设计师"）');
} else {
  for (const p of result.personas) {
    console.log(
      `· ${p.role}  —  出现 ${p.mentions} 次，痛点信号 ${p.painSignals} 个，` +
      `涉及主题：${p.themes.map(labelOf).join('、')}`
    );
  }
}

console.log('\n========== 痛点原话（带主题，不脑补）==========');
for (const pt of result.painPoints) {
  const tag = pt.severity === 2 ? '[明确痛点]' : '[信号]';
  console.log(`  ${tag} (${pt.themes.map(labelOf).join('、') || '未归类'})  ${pt.quote}`);
}

console.log('\n========== 机会点排序（得分越高越值得先看）==========');
for (const o of result.opportunities) {
  console.log(
    `  ${o.label.padEnd(12, '　')} 得分 ${o.score.toString().padStart(2)}  ` +
    `（信号 ${o.signalCount} + 明确痛点 ${o.painCount} × 2）`
  );
}
