# Proposed API Contracts / 接口契约

**Status: RFC v0.1.** REST definitions are design targets, not implemented endpoints. Base path: `/api/v1`.

## Contract principles

- All administrative APIs use tenant-scoped authorization. Caller-controlled tenant IDs are validated against credentials.
- Every write supports `Idempotency-Key` or a stable domain event ID; duplicate ingestion returns existing result.
- Use versioned schemas and ISO-8601 UTC timestamps; return structured errors with `code`, `message`, `request_id`.
- External ingestion is authenticated; cross-tenant references rejected rather than ignored.
- Responses must distinguish submitted, processing, verified, approved, deployed.
- Authorization for reading raw model content is separate from permission to read audit metadata.
- Pagination uses opaque cursors; list endpoints must not expose sensitive payload by default.

## Authentication and roles

**Proposed:** OAuth/OIDC or service tokens. `gateway.ingest`, `agent.ingest`, `audit.read`, `evidence.read_sensitive`, `experience.review`, `skill.test`, `skill.approve`, `skill.publish`, `policy.admin` are separate scopes.

Service accounts are restricted to project and integration; model content must not be used to select tenant identity.

## 1. Agent evidence ingestion

`POST /api/v1/events/agent`

~~~http
POST /api/v1/events/agent
Authorization: Bearer <redacted>
Idempotency-Key: evt_synthetic_01
Content-Type: application/json
~~~

~~~json
{
  "schema_version": "0.1",
  "event_id": "evt_synthetic_01",
  "project_id": "demo",
  "task_id": "task_demo",
  "request_id": "req_demo",
  "event_type": "agent.test.result",
  "observed_at": "2026-11-05T08:00:00Z",
  "source": {"kind": "agent_hook", "integration_id": "int_demo"},
  "payload": {
    "exit_code": 1,
    "command_category": "test",
    "artifact_refs": ["artifact_synthetic_ci"]
  }
}
~~~

**202 Accepted:** `{"event_id":"evt_synthetic_01","status":"accepted"}`. Replaying the same event with identical content returns original ID; same ID with different content returns `409 idempotency_conflict`.

**Errors:** 400 invalid_schema; 401 unauthenticated; 403 tenant_scope_denied; 413 payload_too_large; 429 throttled; 503 ingestion_unavailable. No event receipt implies no claim of ingestion success.

## 2. Inference events

Gateway callback uses an internal or mutually authenticated ingestion route, **not** unrestricted external access. Proposed `POST /api/v1/events/inference` accepts redacted metadata and optional restricted payload references, never blindly accepts an agent-asserted policy result.

Required fields: event_id, authenticated tenant, request_id, model/provider identifiers when available, stage, observed_at, policy decision version, streaming enforcement mode, content capture state. Use `gateway.request.finished` even when provider errors.

## 3. Task outcomes

`POST /api/v1/tasks/{task_id}/outcomes`

~~~json
{
  "criteria": [
    {
      "id": "unit-tests",
      "status": "passed",
      "verifier": "ci",
      "evidence_event_ids": ["evt_ci_demo"]
    },
    {
      "id": "review",
      "status": "unknown",
      "verifier": "human",
      "evidence_event_ids": []
    }
  ],
  "agent_declared_status": "complete"
}
~~~

**202 Accepted** means under evaluation, not verified. Server computes aggregate; if any required criterion unknown, task cannot have `verified=passed`. Only trusted verifier service roles may assert external verification.

`GET /api/v1/tasks/{task_id}`: returns declared state, observed state, verified state, evidence coverage and missing criteria independently.

## 4. Audit retrieval

`GET /api/v1/audit/events?project_id=demo&from=...&to=...&cursor=...`

Default projection: event_id, request_id, actor reference, model, policy action, redaction mode, timestamps and task link. Raw content requires a separate privileged endpoint with purpose-logged access.

`GET /api/v1/audit/events/{event_id}`: explain policy decision, source evidence, content access status and event integrity information.

## 5. Experience candidates

`GET /api/v1/experiences/candidates?status=pending&project_id=demo`

`POST /api/v1/experiences/{id}/decision`

~~~json
{
  "decision": "approve",
  "expected_revision": 3,
  "scope": {"project_id": "demo"},
  "reason": "Reproduced on controlled eval cases"
}
~~~

Reviewer may approve Instinct as reusable rule only; this does not directly publish a Skill. Revisions must use optimistic concurrency; stale review returns 409.

## 6. Skill lifecycle

`POST /api/v1/skills`: create draft from reviewed candidate or explicit manual authorship.

`POST /api/v1/skills/{id}/evaluate`: enqueue fixed-suite evaluation and return run ID.

`GET /api/v1/skills/{id}/evaluations/{run_id}`: baseline, candidate, verifier source, coverage, regressions, errors.

`POST /api/v1/skills/{id}/approve`: authorized approval referencing an immutable artifact digest, evaluation ID and content revision.

`POST /api/v1/skills/{id}/publish`: requires exact approved digest, deployment scope, rollout mode, policy compatibility and idempotency key.

`POST /api/v1/skills/{id}/rollback`: revert target cohort to known approved digest; record audit event.

`GET /api/v1/skills/resolve?project_id=demo&agent=codex&runtime_version=...`: return signed/scoped approved manifest; caller cannot enumerate other tenants' Skills.

## 7. API error examples

~~~json
{
  "error": {
    "code": "verification_incomplete",
    "message": "Required acceptance criterion review is unknown",
    "request_id": "req_api_demo",
    "details": {"missing_criterion_ids": ["review"]}
  }
}
~~~

Useful stable error codes: `evidence_not_found`, `cross_tenant_reference`, `revision_conflict`, `policy_blocked`, `skill_not_approved`, `evaluation_regression`, `integration_not_supported`.

## 8. Contract tests required before implementation

- Cross-tenant event ingestion and lookup denial.
- Replayed event and conflicting event reuse.
- Concurrent Instinct approvals use expected revision.
- Unknown verifier result cannot be promoted to verified completion.
- Publish rejects unapproved digest and incompatible target.
- Sensitive output never appears in default list projections.
- Retention/deletion removes/restricts dependent raw and derived assets.
