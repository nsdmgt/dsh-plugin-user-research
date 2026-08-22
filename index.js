// dsh-plugin-user-research — DeepSeek Harness 插件入口
//
// 把"用户研究合成"方法论包装成 agent 可调用的工具。核心逻辑在 ./synthesize.js
// (与 Cordis 解耦,可独立单测)。本文件只负责向 dsh 的工具注册表注册工具。
//
// 验证依据(2026-08-21, @deepseek-ai/dsh@0.1.0-rc.7):
//   - 插件导出 name / inject / apply(ctx)
//   - ctx.tools.register(defineTool({...}))  via @deepseek-ai/dsh-tools
//   - 注册是 effect-based,插件卸载时自动注销

import { readFile } from 'node:fs/promises';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { synthesize } from './synthesize.js';

export const name = 'user-research-plugin';
export const inject = ['tools'];

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function apply(ctx) {
  ctx.tools.register(
    defineTool({
      name: 'research_synthesize',
      description:
        '对用户研究素材(访谈记录 / 问卷开放题 / 观察笔记,支持 .txt .md .csv)做结构化合成:' +
        '抽取痛点、按主题聚类、推断用户画像、按信号强度排出机会点。' +
        '当你需要"从一堆定性笔记里提炼洞察"或"总结用户反馈"时使用。',
      parameters: {
        filePath: {
          type: 'string',
          required: true,
          description: '工作区内相对路径,指向笔记文件(.txt / .md / .csv)',
        },
        maxPersonas: {
          type: 'number',
          description: '返回用户画像数量上限,默认 5',
        },
        maxOpportunities: {
          type: 'number',
          description: '返回机会点数量上限,默认 5',
        },
      },
      output: {
        // 新版 dsh-tools 要求对象 schema 显式声明 additionalProperties
        schema: { type: 'object', additionalProperties: true },
        render: (_args, value) => [
          { type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) },
        ],
      },
      async execute(args) {
        const raw = await readFile(args.filePath, 'utf8');
        return synthesize(raw, {
          maxPersonas: args.maxPersonas,
          maxOpportunities: args.maxOpportunities,
        });
      },
    })
  );

  // 兼容不同 dsh 版本的日志服务(有的版本暴露 ctx.logger,有的不暴露)
  if (ctx.logger && typeof ctx.logger.info === 'function') {
    ctx.logger.info('[user-research-plugin] loaded: tool research_synthesize');
  } else {
    console.log('[user-research-plugin] loaded: tool research_synthesize');
  }
}

export default { name, inject, apply };
