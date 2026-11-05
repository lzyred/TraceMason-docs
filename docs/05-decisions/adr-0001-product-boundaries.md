# ADR-0001: Product Boundaries and Evidence-Driven Evolution

**Date:** 2026-11-05  
**Status:** Accepted product principles; stack and topology remain Proposed.  
**Decision owners:** Project maintainers (future review required before implementation).

## Context

Agent usage increasingly spans multiple model vendors and clients. Inference logs alone cannot establish task outcomes because local tools, tests and human review are often invisible to the gateway. Unverified model-generated experience can create unsafe or ineffective Skills.

## Decision — product principles (accepted)

1. The platform is **gateway-adjacent** rather than an inference gateway replacement.
2. Security policy enforcement and knowledge learning are separate governance authorities.
3. All learning artifacts require source provenance, evidence classification and scope.
4. Task quality is measured through independent acceptance evidence, never model assertion alone.
5. Skill promotion is versioned, evaluated, reviewed, scoped and rollback-capable.
6. Raw conversation retention is opt-in/policy-controlled; minimize sensitive data by default.
7. Tool execution coverage must be clearly stated and requires execution-point integration where applicable.

## Proposed implementation (NOT accepted)

- Integrate LiteLLM-compatible gateway rather than replacing routing.
- Prefer OpenTelemetry-compatible events and evaluate existing Langfuse/Opik before building trace dashboards.
- PostgreSQL + JSONB + pgvector as first persistence tier; DB-backed job/outbox initially.
- Web console with seven direct pages; Vue is a candidate, not a commitment.
- Agent Skills-compatible artifact plus internal governance manifest.
- Start with one gateway, one Agent runtime, one independent verifier and synthetic fixtures.

## Consequences

**Positive:** Focus on high-value evidence-to-Skill loop; allow integration with existing ecosystem; reduce vendor and model lock-in.

**Negative:** More engineering needed for identity correlation, evidence provenance, test suites and permissions. Without Hook/CI, many quality outcomes remain unknown.

**Risks:** Fake events, sensitive-content capture, miscorrelation, overconfident evaluations, Skill supply-chain compromise, slow inline guardrails.

**Mitigations:** Event signing/authentication, explicit completeness, content minimization, independent checks, sandbox and reviewer separation.

## Revisit triggers

- A competitive OSS platform provides the full outcome-verified Skill loop with acceptable license/API.
- Selected gateway lacks required inline enforcement and alternatives require architecture revision.
- More than one Agent client cannot reliably provide execution evidence.
- Pilot fails to show measurable task-level improvement over existing manually maintained Skills.

## Linked decisions

See [Open Questions](open-questions.md), [System Architecture](../01-architecture/system.md) and [Acceptance](../03-delivery/acceptance.md).
