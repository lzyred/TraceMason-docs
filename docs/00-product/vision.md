# Product Vision & Positioning / 产品愿景与定位

**Status:** Proposed v0.1, 2026-11-05

## English executive summary

TraceMason makes AI usage **auditable** and AI experience **reusable**. It consumes policy-checked inference traces and optional agent execution/outcome evidence, detects recurring failure/success patterns, and promotes tested practices into versioned, scoped Skills. It is not a replacement inference gateway, autonomous security authority, or mere conversation summarizer.

## 一、产品定义

**One sentence:** 面向个人开发者、工程团队及组织的 AI 使用治理与经验资产平台，在现有模型网关旁形成“审计 → 评估 → 经验 → 验证 → Skill 发布 → 效果复评”的可验证闭环。

- **用户问题 A — 经验不连续：** 更换模型、工具或会话后，曾经付出的纠错成本无法可靠复用。
- **用户问题 B — 质量无法量化：** Agent 声称完成任务，但缺少测试、Diff、验收等独立证据；模型成本与实际交付价值脱节。
- **用户问题 C — 安全无法证明：** 经过网关的流量不一定具备合适的敏感信息处理、权限约束与审计轨迹。
- **用户问题 D — Skills 无闭环：** 即便存在 Skill 文件，也缺少来源证据、离线评估、真实效果比较、灰度及回滚。

## 二、目标用户与工作结果

| Persona | 核心任务 | 应得到的结果 |
|---|---|---|
| Individual AI engineer | 在 Codex / Claude Code / OpenCode 间迁移已验证做法 | 同一工作规范可按范围分发、版本固定、失败回滚 |
| Team lead / AI platform engineer | 评价模型/任务交付质量和调用成本 | 将模型行为与独立任务结果关联，而非依赖模型自评 |
| Security / compliance reviewer | 发现敏感内容与高危执行并审计决策 | 知道谁、何时、依据哪个策略、允许/阻断了什么 |
| Skill maintainer / reviewer | 判断候选经验是否值得推广 | 看到正反证据、测试结果、风险和发布历史 |

## 三、产品主循环

1. **Capture:** 只在授权范围内采集经过网关的推理事件，以及可选的 Agent Hook 执行事件。
2. **Protect:** 输入/输出按策略检测；脱敏与授权边界先于任何学习。
3. **Associate:** 通过 tenant / project / session / task / request / event ID 串联审计证据。
4. **Judge:** 质量评价区分 model claim、user feedback、tool observation、external verification。
5. **Mine:** 从重复失效、人工纠错、经过验证的成功过程归纳候选 Instinct。
6. **Validate:** 版本化候选 Skill 在固定数据集上做对照与风险回归测试。
7. **Publish:** 审批、签名/摘要、作用域、灰度分发；下游 Agent 自主读取可用 Skill。
8. **Re-evaluate:** 追踪命中、调用、结果和回归；不良版本回滚。

## 四、边界与真实能力

- 仅有 HTTP 模型 API 日志，**不能**保证看到本地命令、文件修改或成功验收；这类事实必须由额外 Hook / SDK / CI 证据提供。
- Prompt/Response 可能包含恶意指令；所有原始内容均视作 **untrusted evidence**，不得当作系统命令或自动执行的 Skill。
- 模型和用户都可能犯错；一次纠错只说明存在争议，不自动证明纠正后的答案正确。
- 安全策略是独立治理体系，不由学习流水线自行放宽。
- 开源受众及竞争格局需要独立持续核实，不能作为产品价值已验证的替代。

## 五、产品成功条件

至少通过三条端到端场景：安全阻断有证据；无测试的“完成”不得标记为已验证；有来源证据的 Skill 可以通过回归评估后分发、观察并回滚。

**Primary metric:** Verified task success rate，必须有外部验收凭证及样本覆盖率；未提供执行证据应标记为 unknown 而非 failure/success。

**Supporting metrics:** rework rate、cost per accepted task、policy false-positive / false-negative rate、Skill regression rate、Skill incremental improvement against a no-Skill baseline。

## 六、避免的产品陷阱

- 再造 LiteLLM / Langfuse 的通用基础设施；
- 把“模型回答看起来正确”当作事实；
- 数量驱动的 Skill 生成；
- 全量无限期保留原始对话；
- 在本地执行点缺失时宣称可以强制审计所有工具调用；
- 提前承诺“所有 Agent 无感知即插即用”，忽略工具自身能力差异。
