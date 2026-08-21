// Pure, framework-agnostic user-research synthesis engine.
//
// This module deliberately imports NOTHING from @deepseek-ai/* so it can be
// unit-tested with `node --test` without installing the DeepSeek Harness
// runtime. All domain methodology (theme taxonomy, pain signals, scoring) lives
// here — it is the reusable IP that the dsh tool in index.js simply wraps.

/**
 * Theme taxonomy: the lenses we cluster qualitative notes through.
 * `keywords` are Chinese signal words; extend this to retune the analysis.
 * @type {{id:string,label:string,keywords:string[]}[]}
 */
export const THEME_TAXONOMY = [
  { id: 'performance', label: '性能 / 效率', keywords: ['慢', '卡', '加载', '响应', '延迟', '耗时', '等半天', '转圈', '卡顿'] },
  { id: 'usability', label: '易用性 / 上手', keywords: ['不会用', '看不懂', '复杂', '难找', '搞不懂', '操作流程', '步骤多', '学习成本', '上手', '晕', '绕'] },
  { id: 'price', label: '价格 / 成本', keywords: ['贵', '太贵', '价格', '收费', '付费', '性价比', '不值', '花钱', '涨价'] },
  { id: 'missing', label: '功能缺失', keywords: ['没有', '缺少', '不支持', '希望有', '要是能', '缺', '功能不够', '做不到', '没有提供'] },
  { id: 'reliability', label: '稳定性 / 信任', keywords: ['报错', '崩', '闪退', '丢失', 'bug', '故障', '不可靠', '数据没了', '担心', '隐私', '安全', '泄露'] },
  { id: 'support', label: '服务 / 支持', keywords: ['客服', '没人管', '反馈没用', '售后', '回复慢', '联系不上', '工单'] },
];

/** Words that mark a statement as an explicit pain / unmet need. */
export const PAIN_SIGNALS = [
  '痛点', '麻烦', '难受', '烦', '卡住', '卡壳', '头疼', '痛苦', '问题',
  '不满意', '吐槽', '抱怨', '希望', '要是', '要是能', '最好', '应该', '期望', '想要', '急需',
];

/**
 * Split raw notes into discrete statements on sentence / line boundaries.
 * @param {string} text
 * @returns {string[]}
 */
export function splitStatements(text) {
  return String(text)
    .split(/[\n。！？!?；;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4);
}

/**
 * Detect which theme ids a statement belongs to.
 * @param {string} statement
 * @returns {string[]}
 */
export function detectThemes(statement) {
  const hits = [];
  for (const t of THEME_TAXONOMY) {
    if (t.keywords.some((k) => statement.includes(k))) hits.push(t.id);
  }
  return hits;
}

/**
 * Heuristically decide whether a statement expresses pain / unmet need.
 * @param {string} statement
 * @returns {boolean}
 */
export function isPain(statement) {
  return PAIN_SIGNALS.some((k) => statement.includes(k));
}

/**
 * Crude but stable persona signal extractor.
 * Matches patterns like "作为运营", "我是设计师", "我们销售".
 * @param {string} statement
 * @returns {string|null}
 */
export function extractRole(statement) {
  const m = statement.match(/(?:作为|我是|我们|用户是|我们是)\s*([一-龥]{2,6}?)(?:的|，|，|。|用户|者|人|，)/);
  return m ? m[1] : null;
}

/**
 * Core synthesis: turn raw qualitative notes into a structured research output.
 *
 * @param {string} rawText - interview transcripts / survey free-text / observations
 * @param {{maxPersonas?:number,maxOpportunities?:number}} [options]
 * @returns {{
 *   summary: {statementsAnalyzed:number, painPoints:number, themesDetected:number},
 *   personas: {role:string, mentions:number, painSignals:number, themes:string[]}[],
 *   painPoints: {quote:string, themes:string[], severity:number}[],
 *   opportunities: {theme:string, label:string, signalCount:number, painCount:number, score:number}[],
 * }}
 */
export function synthesize(rawText, options = {}) {
  const maxPersonas = options.maxPersonas ?? 5;
  const maxOpportunities = options.maxOpportunities ?? 5;

  const statements = splitStatements(rawText);
  const painPoints = [];
  /** @type {Record<string, number>} */
  const themeCounts = {};
  /** @type {Record<string, {mentions:number, themes:Set<string>, pains:number}>} */
  const actorMap = {};

  for (const s of statements) {
    const themes = detectThemes(s);
    const pain = isPain(s);

    for (const t of themes) themeCounts[t] = (themeCounts[t] || 0) + 1;

    if (pain || themes.length > 0) {
      if (pain) {
        painPoints.push({ quote: s, themes, severity: 2 });
      } else {
        painPoints.push({ quote: s, themes, severity: 1 });
      }
      const role = extractRole(s);
      if (role) {
        if (!actorMap[role]) actorMap[role] = { mentions: 0, themes: new Set(), pains: 0 };
        actorMap[role].mentions += 1;
        themes.forEach((t) => actorMap[role].themes.add(t));
        if (pain) actorMap[role].pains += 1;
      }
    }
  }

  const personas = Object.entries(actorMap)
    .map(([role, v]) => ({
      role,
      mentions: v.mentions,
      painSignals: v.pains,
      themes: [...v.themes],
    }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, maxPersonas);

  const opportunities = Object.entries(themeCounts)
    .map(([theme, count]) => {
      const meta = THEME_TAXONOMY.find((t) => t.id === theme);
      const painInTheme = painPoints.filter((p) => p.themes.includes(theme) && p.severity === 2).length;
      // Opportunity score: base signal strength + weighted explicit pain.
      const score = count * 1 + painInTheme * 2;
      return {
        theme,
        label: meta ? meta.label : theme,
        signalCount: count,
        painCount: painInTheme,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxOpportunities);

  return {
    summary: {
      statementsAnalyzed: statements.length,
      painPoints: painPoints.filter((p) => p.severity === 2).length,
      themesDetected: Object.keys(themeCounts).length,
    },
    personas,
    painPoints,
    opportunities,
  };
}

export default synthesize;
