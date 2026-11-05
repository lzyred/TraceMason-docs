# Security, Privacy & Governance / 安全、隐私与治理

**Status:** Accepted principles; implementation controls proposed.

## 1. Non-negotiable invariants

1. The model is not the authorization authority. Prompt, response and extracted Instinct content are **untrusted**.
2. A gateway can enforce only the traffic passing through it; local shell/files/network operations need an execution-point control.
3. Learned Skills never automatically lower secrets, tenant isolation or high-risk approval policies.
4. No global Skill publishing without evidence-based evaluation and authorized approval.
5. A Skill's source evidence must not leak raw conversations, credentials, personal data or private repo contents.
6. A policy decision has an auditable version, action and reason; failure mode is explicit.

## 2. Enforcement map

| Boundary | Threat | Enforcer | Caveat |
|---|---|---|---|
| Incoming model request | PII/secrets leakage, disallowed payload | Gateway inline guardrail | Only sees gateway-routed traffic |
| Provider response | Sensitive output | Output guardrail | Must hold bytes before release to prevent leakage |
| Local tool call | File deletion, credential exfiltration, prod modification | Agent Hook + OS/CI permission control | Detection-only hooks cannot guarantee enforcement |
| Evidence ingestion | forged events, cross-tenant references | Ingestion auth, schema checks, signature/HMAC where appropriate | Hook signals have different trust tiers |
| Experience mining | prompt injection, hallucinated rules | Isolated untrusted processing, evidence checks | Model conclusions are not verified outcomes |
| Skill publishing | harmful instructions and broad unauthorized distribution | Evaluation, approval, scoped release | Publisher separate from security administrator |

## 3. Data minimization & retention

- Default: request metadata, timing, model, token/cost if available, policy decisions and content fingerprints.
- Optional under documented consent/policy: redacted prompt/response and narrowly scoped execution artifacts.
- Restricted stores: encrypted payloads with separate access roles, access logging and per-tenant key policy.
- Per-scope retention schedule for metadata, redacted bodies, raw content, embeddings and derived experiences.
- Right-to-delete workflow: locate lineage, delete/restrict source, quarantine dependent assets, re-evaluate shared Skills.
- Do not assume that encrypting data makes unrestricted collection acceptable.

## 4. Prompt injection defenses

A malicious model output can include instructions like "ignore your safeguards", forge test results or demand tool access. Treat these as text to analyze, never commands to execute. The miner cannot access production credentials, call deployment APIs or edit policy stores. Build/test in a disposable, least-privileged environment with no sensitive mounts and restricted network egress.

For synthetic evaluations, use fake secrets and sandbox fixtures only.

## 5. Skills as code & supply-chain controls

- Validate Skill manifests, size limits, allowed file types and relative path traversal.
- Separate behavioral markdown guidance from executable scripts; scripts require stricter sandboxing and review.
- Record SHA-256 artifact digest, publisher, approval and evaluation suite.
- Explicitly state scope: project, tenant, agent runtime and tool permission prerequisites.
- Reject automatic privilege escalation requests hidden in Skill content.
- Keep current+previous approved versions to support rollback; revocation must stop new distribution.

## 6. Policy lifecycle

**Draft → Simulate → Review → Publish → Monitor → Rollback**. Policy changes are signed/audited independently of Skill evolution. Policy overrides require a justified, expiring, role-controlled exception; never a learned preference.

Required audit fields: actor, target, before/after version, timestamp, authorization, test result, decision, reason.

## 7. Fail-open / fail-closed rule

- Security-critical inline checks: **fail closed** by configured route/tenant.
- Best-effort observability export: may degrade but must surface loss/coverage metrics.
- Durable-audit-required routes: must persist minimal decision metadata before acknowledging.
- Output audit-only streaming: must explicitly state that it does not prevent leakage.
- Hook absence: do not claim full agent execution coverage.

## 8. Threat-model test examples

S-01 Inject a fake "CI PASSED" line into model output → no verified outcome.

S-02 Put synthetic secret in request → masked/blocked under policy and absent from logs.

S-03 Forge another tenant's task_id in an event → authorization rejected.

S-04 Attempt to publish Skill with external exfiltration script → sandbox/review rejects.

S-05 Delete source evidence backing a published Skill → lineage review quarantines or revalidates derivative.

## 9. References

- https://genai.owasp.org/
- https://opentelemetry.io/docs/specs/semconv/gen-ai/
