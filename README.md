# TraceMason

**From AI Traces to Trusted Skills.**

TraceMason is a proposed open-source, gateway-adjacent AI governance and evidence-driven skill evolution platform. It connects inference traces, agent execution evidence, quality evaluation, and governed Skill release into one feedback loop.

**TraceMason（迹匠）**：以模型网关和 Agent 执行证据为基础，将 AI 交互的安全审计、任务质量评估、用户纠错与已验证经验转化为可追溯、可测试、可回滚、跨 Agent 复用的 Skills。

> **Status: Product / architecture proposal (v0.1), not implemented software.** This repository currently hosts design documents only. Unless a document explicitly says *accepted*, technology choices and APIs are proposals, not deployed facts.
>
> **状态：v0.1 产品与架构提案，尚非已实现的软件。** 当前仓库为文档仓库。除明确标记为“已接受”的原则外，技术选型与接口均是待验证设计。

## Product thesis / 产品命题

**Observe → Audit → Evaluate → Learn → Validate → Publish → Re-evaluate**

AI conversations do not automatically establish truth. A model's claim of completion is not an independently verified outcome. Agent tool calls and verification results may occur outside the gateway. Therefore, high-quality reusable Skills must link **real observations → independently verified outcomes → controlled promotion**.

模型输出不等于事实，网关日志不等于完整执行过程。平台必须允许 Agent Hook 或 SDK 提供实际执行与验收证据，且不能让学习结果自动改写安全边界。

## Documentation map / 文档导航

| Area | Document | Purpose |
|---|---|---|
| Product | [Vision & positioning](docs/00-product/vision.md) | Value, target users, boundaries, success criteria |
| Product | [Requirements](docs/00-product/requirements.md) | P0/P1 requirements, non-goals, constraints |
| Product | [Console information architecture](docs/00-product/console.md) | Seven pages and end-to-end interactions |
| Architecture | [System architecture](docs/01-architecture/system.md) | Planes, dependencies, deployment, failure modes |
| Architecture | [Events & evidence](docs/01-architecture/events-and-data.md) | Event contract, IDs, provenance, data model |
| Architecture | [Security & governance](docs/01-architecture/security-governance.md) | Policy enforcement, privacy, permission boundaries |
| Architecture | [Experience-to-Skill lifecycle](docs/01-architecture/experience-skill.md) | Observation, Instinct, Skill, evaluation, release |
| Interfaces | [API contracts](docs/02-interfaces/api-contracts.md) | Proposed REST contracts and idempotency |
| Interfaces | [Agent integration](docs/02-interfaces/agent-integration.md) | Gateway, Hook, CLI/MCP, delivery adapters |
| Delivery | [MVP plan](docs/03-delivery/mvp-plan.md) | Vertical slices, sequencing, exclusions |
| Delivery | [Acceptance & evaluation](docs/03-delivery/acceptance.md) | Testable pass/fail criteria and quality metrics |
| Research | [Competitive landscape](docs/04-research/landscape.md) | Build-vs-integrate analysis; verification caveats |
| Decisions | [ADR-0001](docs/05-decisions/adr-0001-product-boundaries.md) | Fundamental boundaries (accepted principles, proposed stack) |
| Decisions | [Open questions](docs/05-decisions/open-questions.md) | Unresolved decisions and validation experiments |
| Reference | [Glossary](docs/glossary.md) | Terms and evidence semantics |

## Initial scope / 首期边界

- **In:** Gateway request/response audit; PII/secrets protection; execution evidence ingestion; task outcome verification; experience candidate review; Skill creation/evaluation/versioned distribution; rollback.
- **Out:** Building a new inference gateway; silently recording all personal data; claiming local agent tool enforcement from gateway alone; fully autonomous publication of safety rules; training foundation models.
- **Proposed base stack, not locked:** LiteLLM or existing OpenAI-compatible gateway, OpenTelemetry-compatible tracing, PostgreSQL + pgvector, a service API and Web console. Integrate mature observability products where practical.

## Documentation rules / 文档管理

1. Every technical assertion is tagged **Accepted / Proposed / To validate** when material.
2. Requirements link to an observable acceptance test.
3. Security invariants cannot be weakened by learned Skills.
4. Published Skill metadata must point to supporting observations, verification evidence, evaluation suite and approval.
5. Public examples contain synthetic data only; no customer traces, secrets, tokens or personal conversation exports.
6. Changes are proposed by PR; record decision consequences in ADRs.

## References / 外部参考

- [Agent Skills specification](https://agentskills.io)
- [LiteLLM](https://github.com/BerriAI/litellm)
- [Langfuse](https://github.com/langfuse/langfuse)
- [Opik](https://github.com/comet-ml/opik)
- [Phoenix](https://github.com/Arize-ai/phoenix)
- [Promptfoo](https://github.com/promptfoo/promptfoo)
- [Everything Claude Code](https://github.com/affaan-m/everything-claude-code)
- [Superpowers](https://github.com/obra/superpowers)
- [OWASP GenAI Security Project](https://genai.owasp.org/)

This repository retains its existing GPL-3.0 LICENSE. No software license claims are made for dependencies.
