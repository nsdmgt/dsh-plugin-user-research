# dsh-plugin-user-research

> DeepSeek Harness 插件 · **把调研笔记变成产品决策**
> 输入访谈记录、问卷开放题或用户反馈,输出**用户画像、痛点原话、可验证的机会点**。

[![dsh-plugin](https://img.shields.io/badge/topic-dsh--plugin-blue)](https://github.com/topics/dsh-plugin)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Tested against](https://img.shields.io/badge/tested%20against-dsh%200.1.0--rc.7-orange.svg)](#版本与兼容性)

---

## 简介

做用户研究最怕两件事:一是访谈/问卷记了一大堆,最后只能凭感觉总结;二是让 AI 直接总结,结果它替你"编"了好多原话里没有的结论。

这个插件做的是一个**有方法论约束的用户研究合成工具**:它不替你下判断,而是把原始素材按一套固定的研究框架拆成"画像—痛点—机会",让你能基于真实证据做决策。

### 它提供什么

- 一套**主题分类口径**(效率、易用性、成本、功能缺失、稳定性、服务支持),让散落在各处的用户原话自动归类。
- 一个**反幻觉约束**:痛点只引用用户原话,不扩写、不脑补。
- 一个**机会评分口径**:按"被多少人提到 + 是否明确表达痛苦"排序,帮你筛出值得先看的方向。
- 4 个可复用的研究技能(访谈分析、画像构建、机会地图、合成全流程)和 2 个模板(访谈提纲、合成画布)。

## 它能做什么

一个 agent 可调用的工具 + 一套方法论技能:

- **工具 `research_synthesize`**:输入一份笔记文件,输出结构化合成结果
  - `personas` — 推断的用户画像(角色 / 诉求信号 / 主题)
  - `painPoints` — 抽出的痛点原话(带主题与严重度,**绝不替用户编造结论**)
  - `opportunities` — 按信号强度排序的机会点(含可解释的评分口径)
- **技能(按名加载)**:`/user-research-synthesis`、`/interview-analysis`、`/persona-build`、`/opportunity-map`
- **模板**:访谈提纲、合成画布(markdown)

## 使用过程

三步就能跑起来:

1. **准备素材**:把访谈录音转写、问卷开放题导出、客服聊天记录或用户反馈整理成一个 `.txt`、`.md` 或 `.csv` 文件。
2. **调用工具**:在 dsh 会话里说:
   > 把 `notes/interview-01.md` 做一次用户研究合成,挑出前 3 个机会点。

   agent 会调用 `research_synthesize(filePath="notes/interview-01.md", maxOpportunities=3)`。
3. **看结果**:你会拿到一份结构化输出,包含按主题归类的痛点原话、推断出的用户画像,以及按信号强度排序的机会点。

## 适合谁用 / 运用场景

| 角色 | 场景 |
|---|---|
| **产品经理 / 需求分析师** | 做完用户访谈后,把 10 份录音转写快速合成出"用户真正在抱怨什么" |
| **UX 研究员 / 设计师** | 从可用性测试笔记中抓出高频痛点,支撑设计决策 |
| **创业者 / 市场人员** | 整理问卷开放题、竞品评论、售前咨询记录,找未被满足的需求 |
| **客服 / 用户成功** | 把用户投诉和反馈聚类,定位产品改进优先级 |

一句话:**只要你手里有一堆用户的原话,想把它变成"谁有什么痛、值不值得做"的清晰结论**,这个工具就适合你。

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

## 它是怎么分类和打分的

### 主题分类
素材会按 6 个常见维度自动归类:

- 性能 / 效率
- 易用性 / 上手
- 价格 / 成本
- 功能缺失
- 稳定性 / 信任
- 服务 / 支持

每个维度对应一组中文信号词。如果你对某个领域有特定口径(比如医疗、教育、B2B),可以在 `synthesize.js` 的 `THEME_TAXONOMY` 里自己增删。

### 机会点怎么排序
```
机会得分 = 信号条数 × 1 + 显式痛点条数 × 2
```
简单说:**被越多人反复提到、越明确表达痛苦的需求,得分越高**。但它只告诉你"这里值得多看一眼",要不要做、能不能做,仍然要你自己结合业务判断。

### 为什么不"编"结论
工具在输出痛点时,只**引用用户原话**,不会扩写成"用户认为……"。样本太少的时候,它也会直接提示"结论置信度低"。这样你拿到的东西才能拿去跟团队对质,而不是一段看起来很有道理但查无实据的漂亮话。

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

> 核心合成逻辑是脱离 dsh 框架写的纯函数,所以可以直接用 `node --test` 跑,不需要启动整个 agent 环境。这也是我们敢在预览期 dsh 上发布插件的底气——只要主题分类和评分逻辑不变,框架接口再怎么变,这部分都不会坏。

## 版本与兼容性

- 验证依据:`@deepseek-ai/dsh@0.1.0-rc.7`(npm latest,2026-08-19),Node `^22.19 || >=24`
- ⚠️ DeepSeek Harness 为**开发者预览**,官方明确会有破坏性变更。升级 dsh 后请重跑 `node --test` 并核对 `defineTool` 契约。
- `package.json` 的 `engines.dsh` 已锁定 `>=0.1.0-rc.7`。

## License

[MIT](./LICENSE)
