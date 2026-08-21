# dsh-plugin-user-research

> DeepSeek Harness 插件 · **用户研究合成 Agent 包**
> 把访谈记录 / 问卷开放题 / 观察笔记,合成为**用户画像 · 痛点 · 机会点**。

[![dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-blue)](https://github.com/topics/dsh-plugin)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Tested against](https://img.shields.io/badge/tested%20against-dsh%200.1.0--rc.7-orange.svg)](#版本与兼容性)

---

## 为什么做这个(而不是又一个"读文件/定时任务"插件)

DeepSeek Harness 还在开发者预览期,**读文档、查数据、定时任务这类横向基础设施,官方正式版一定会自己补齐**。再做这种插件,等 GA 一出就成官方功能的低配复刻,简历价值归零。

本插件刻意选在 **dsh 永远不会原生去做的那一层**——**垂直领域的方法论沉淀**:
框架提供水管(工具注册、文件读取、沙箱),本插件提供"水怎么用"的**用户研究专业知识**。
这套主题分类、痛点抽取口径、机会评分框架,是领域 IP,不会被基础能力替代。

## 它能做什么

一个 agent 可调用的工具 + 一套方法论技能:

- **工具 `research_synthesize`**:输入一份笔记文件,输出结构化合成结果
  - `personas` — 推断的用户画像(角色 / 诉求信号 / 主题)
  - `painPoints` — 抽出的痛点原话(带主题与严重度,**绝不替用户编造结论**)
  - `opportunities` — 按信号强度排序的机会点(含可解释的评分口径)
- **技能(按名加载)**:`/user-research-synthesis`、`/interview-analysis`、`/persona-build`、`/opportunity-map`
- **模板**:访谈提纲、合成画布(markdown)

## 安装

```bash
# 装入 web profile(装完需重启 web 服务)
dsh plugin --profile web add dsh-plugin-user-research
```

或临时用绝对路径挂载(开发期,不改全局配置):

```bash
dsh web --patch ./cordis.patch.yml
# 本地开发请把 cordis.patch.yml 里的 name 改为 index.js 的绝对路径,见文件内注释
```

装好后,在会话里直接说:

> 把 `notes/interview-01.md` 做一次用户研究合成,挑出前 3 个机会点。

agent 会调用 `research_synthesize(filePath="notes/interview-01.md", maxOpportunities=3)`。

## 方法论(本插件的 IP 核心)

### 主题分类法(Theme Taxonomy)
素材按 6 个透镜聚类:性能/效率、易用性/上手、价格/成本、功能缺失、稳定性/信任、服务/支持。
每个主题由一组中文信号词触发,可在 `synthesize.js` 的 `THEME_TAXONOMY` 中增删调优。

### 机会点评分口径
```
机会得分 = 信号条数 × 1 + 显式痛点条数 × 2
```
得分高 = **需求被反复验证**,但不等价于"该立刻做"——需结合业务判断与可行性。

### 反幻觉约束
痛点只**引用用户原话**,工具不把流水总结成结论;样本过少时明确提示置信度低。

## 架构

```
dsh-plugin-user-research/
├── index.js              # dsh 插件入口:把 synthesize 接成 research_synthesize 工具
├── synthesize.js         # 纯逻辑合成引擎(与 Cordis 解耦,可独立单测)
├── cordis.patch.yml      # bundle 挂载描述(insert 行)
├── skills/               # 4 个方法论技能包(SKILL.md)
├── templates/            # 访谈提纲 / 合成画布
└── test/synthesize.test.js
```

核心逻辑刻意**不依赖任何 `@deepseek-ai/*` 运行时**,因此可以脱离 DeepSeek Harness 单独测试。

## 测试

```bash
node --test
# 9 passed —— 覆盖语句切分、主题检测、痛点判定、画像推断、评分排序、计数截断、空输入
```

> 社区插件普遍"只发不验"。本插件把领域逻辑做成可确定性单测的纯函数,
> 这是它在质量维度上的主要差异化。

## 版本与兼容性

- 验证依据:`@deepseek-ai/dsh@0.1.0-rc.7`(npm latest,2026-08-19),Node `^22.19 || >=24`
- ⚠️ DeepSeek Harness 为**开发者预览**,官方明确会有破坏性变更。升级 dsh 后请重跑 `node --test` 并核对 `defineTool` 契约。
- `package.json` 的 `engines.dsh` 已锁定 `>=0.1.0-rc.7`。

## License

[MIT](./LICENSE)
