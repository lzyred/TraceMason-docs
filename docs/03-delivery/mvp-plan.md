# v0.1 Delivery Plan / MVP 实施计划

**Status:** Proposed sequence. No implementation progress is implied.

## Release thesis

The first release is successful if it can **audit model traffic, distinguish claims from verified task outcomes, turn a verified correction pattern into a tested Skill, and safely distribute/rollback that Skill** for one selected Agent.

## Vertical slices

### M0 — Gateway audit and policy

**Build:** Existing gateway integration, immutable event identity, minimal structured metadata, input secret detector, output enforcement mode, per-tenant audit pages, durable audit decision mechanism.

**Demo:** Submit a synthetic API key; show deny/redact decision before upstream transmission, policy version and redacted event record.

**Exit:** A-01, A-02, A-03, A-11, A-12.

### M1 — Agent evidence and task outcome

**Build:** One Agent Hook/SDK adapter, task correlation, execution events, CI/test evidence, declared/verified/unknown status, Quality page.

**Demo:** Agent says complete but unit test fails; task marked not verified with failure evidence.

**Exit:** A-04, A-05, A-06.

### M2 — Experience mining and governance

**Build:** Correction/failure detector, candidate Instinct schema, evidence/counterevidence links, Experience review UI, reviewer audit trail, conflict control.

**Demo:** Same synthetic coding failure twice + valid correction produces one candidate; not automatically globally active.

**Exit:** A-07.

### M3 — Skill generation and controlled distribution

**Build:** Agent Skills-compatible draft, governance manifest, fixed evaluation suite and no-Skill baseline, approval, version registry, one Agent adapter, canary + rollback.

**Demo:** Skill release to pilot Agent after evaluation; verify digest, report activation capability, compare task outcomes, rollback to previous approved digest.

**Exit:** A-08, A-09, A-10.

## Implementation guardrails

1. Use existing model routing rather than implementing provider adapters.
2. One integration/Agent first; second runtime only after conformance proof.
3. Prefer one platform API + job worker + PostgreSQL at first; add messaging/search only under demonstrated load.
4. Test false-positive and false-negative behavior for content checks before adding a larger rule catalog.
5. No self-modifying policies, no automatically trusted model verdicts, no cross-tenant knowledge sharing by default.

## Delivery artifacts expected

- Runnable minimal stack and reproducible synthetic demo; document startup, configuration and failure behavior.
- API schemas and permission rules with integration contract tests.
- Schema migrations, backups and restore procedure.
- Evaluation fixture set with positive, negative, injection and rollback cases.
- Operator runbook: alerts, replay, stuck jobs, evidence access, deletion, Skill rollback.
- Security checklist and ADRs for non-obvious decisions.

## Change-control rules

Each milestone PR must reference requirements and acceptance IDs. Add evidence of checks, known gaps and rollback path. Avoid "done" status without attached test output or reviewer verification.

## Stop / pivot criteria

- If gateway cannot provide a pre-send hook, do not market it as preventive request security; find a supported enforcement boundary.
- If Agent Hook evidence cannot be correlated reliably, keep Quality as partial observability; no verified completion claims.
- If Skill evaluation lacks reproducible outcomes, pause autonomous experience promotion.
- If comparable existing observability platform meets audit/quality needs, integrate rather than replicate.

## Beyond v0.1

Multi-agent adapters, organization-scale Skill governance, advanced outcome evaluation, multi-tenant policy simulation and longitudinal model regression studies are later work, not required for first value.
