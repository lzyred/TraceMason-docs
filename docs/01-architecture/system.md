# System Architecture / 系统架构

**Status:** Proposed. Integration-first, not a commitment to rebuild existing platforms.

## 1. Component boundaries

~~~text
Codex / Claude Code / OpenCode / Custom Clients
       |                       |
  Model API               Optional Agent Hooks
       v                       |
Existing Gateway               |
 (identity / route / inline policy) 
       |      \               |
       |       \-- durable, minimal events --> Ingestion
       v                                     |
 Model Providers                            v
                              Audit / Evidence Store
                                       |
                            Async Quality Evaluation
                                       |
                              Experience Mining
                                       |
                         Skill Builder + Eval Runner
                                       |
                         Approval + Version Registry
                                       |
                             Agent Skill Adapters
~~~

**Inference plane:** 不应因异步学习不可用而被迫停机；但安全关键策略检查若不可用，根据明确配置 fail-closed。经过网关的请求应有稳定 request ID 和独立 policy decision ID。

**Evidence plane:** 以最小必要采集、脱敏、可重试事件为基础，能关联不同来源的执行证据。Agent 本地执行事实只能由 Hook/CI 等外部观测提供。

**Evolution plane:** AI mining 是不可信推断阶段。候选经验必须经冲突检查、可重现评估和审批后发布。技能分发不是安全执行许可。

## 2. Proposed build-vs-integrate

| Capability | Preferred approach | Reason |
|---|---|---|
| Routing, provider protocol, quotas | Integrate existing LiteLLM-compatible gateway | 避免重复维护供应商 API 差异 |
| Observability traces | OpenTelemetry-compatible model; evaluate Langfuse/Opik integration | 可替换并避免单一厂商锁定 |
| Platform API, policy/evidence core | Own domain service | 产品差异点，需要严格权限和溯源 |
| Relational, JSON evidence, semantic retrieval | PostgreSQL + JSONB + pgvector (proposed) | 初期便于部署、事务管理与检索 |
| Async processing | DB outbox/job worker initially | 减少不必要中间件 |
| Frontend | Vue-based SPA (proposed) | 与后端独立，方便页面原型迭代 |
| Skill artifacts | Agent Skills + governance manifest | 标准化可移植文件与内部证据分离 |

Do not prematurely decide Go vs TypeScript/Python for the service until callback/SDK integration complexity is tested.

## 3. Identity and correlation

- **Tenant boundary:** tenant_id never inferred from model text.
- **Authenticated actor:** API key / service principal / user; enforce at gateway and event ingestion.
- **Correlation:** request_id, session_id, task_id, trace_id, span_id, agent_run_id.
- **Provenance:** observed_at, received_at, event_source, integrity hash, verification_method, schema_version.
- **Versioning:** gateway version, model/provider version (when known), policy version, Skill version.

Out-of-order events and missing events are normal. Do not derive verified success from trace completion.

## 4. Event ingestion & reliability

1. Gateway creates deterministic request and policy identifiers before forwarding.
2. Inline policy decision is recorded with a durable local/outbox strategy.
3. Asynchronous event collector accepts at-least-once delivery with idempotency key (tenant_id + event_id).
4. Normalizer validates schema, redacts, classifies sensitivity and records evidence provenance.
5. Evaluators consume stored references, not implicitly privileged raw contents.
6. Miner produces candidates for separate approval.
7. Skill release uses immutable artifact digest + deployment records.

Define explicit audit durability modes per tenant:

- **Best effort:** telemetry may be delayed/dropped under configured limit; visible coverage warning.
- **Durable required:** the gateway must persist or securely enqueue audit metadata before acknowledging.
- **Security required:** if an inline decision engine is unavailable, fail closed for configured high-risk routes.

These modes must never be silently mixed.

## 5. Streaming response correctness

Post-delivery scanning cannot retract bytes already streamed. Options:

- Buffered mode: inspect entire response then release (higher latency).
- Chunk-gated mode: inspect before each release, but semantic guarantees are bounded by chunk/window size.
- Audit-only mode: observe delivered content; do not claim prevention.

Set and record mode per policy / route.

## 6. Minimum deployment topology

~~~text
gateway: existing service + interception/callback integration
platform: API + jobs + policy engine + Web UI
postgres: relational evidence, outbox, pgvector
optional: object storage for encrypted restricted payloads
optional: external Langfuse/Opik for observability
~~~

Separate runtime credentials for gateway, evaluator, approver and Skill publisher. Database backups require restore drills. Never put secrets or raw sensitive traces in public example files.

## 7. Explicit failure cases

- **Gateway -> platform outage:** durable queue or configured reject; no false claim of full audit.
- **Agent Hook missing:** mark execution evidence incomplete; do not infer task success.
- **Model provider timeout:** log upstream error and actual delivered response state.
- **Eval worker failed:** pending/retry; inference path unaffected.
- **Skill distribution failed:** keep prior active digest; record per-agent drift.
- **Data deletion requested:** revoke raw material access and schedule derivative lineage review.

## 8. Decisions pending

See [Open questions](../05-decisions/open-questions.md). Concrete API contracts are [here](../02-interfaces/api-contracts.md), not proof of implementation.
