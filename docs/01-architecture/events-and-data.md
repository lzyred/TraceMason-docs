# Evidence Model & Event Contracts / 事件与数据契约

**Status:** Proposed schema, must be tested against a working gateway and at least two agent runtimes.

## 1. Entity boundaries

| Entity / table | Responsibility | Primary relationships |
|---|---|---|
| tenants, projects, principals | 授权与范围 | tenant_id/project_id |
| inference_events | 一次模型请求及其策略和结果元数据 | request_id, session_id, trace_id |
| agent_events | 本地工具执行、修改、验证/错误的外部观测 | agent_run_id, task_id |
| audit_findings | 风险、命中策略、实际处置 | policy_decision_id, event_id |
| task_outcomes | 验收准则及证据化结果 | task_id, verifier_id, evidence_refs |
| observations | 观察到的失败/成功/纠错事件 | source_event_ids |
| instincts | 原子行为规则与反例 | observation_ids, scope |
| skill_versions | 不可变 Skill 内容及治理 manifest | instinct_ids, artifact_digest |
| skill_evaluations | 评估配置、对照组、结论 | skill_version_id, suite_id |
| skill_deployments | 目标 Agent/范围与分发状态 | skill_version_id, target_id |
| data_lineage | 删除与重新评估所需上下游引用 | source_asset, derived_asset |

## 2. Common envelope

~~~json
{
  "schema_version": "0.1",
  "event_id": "evt_01...",
  "tenant_id": "tenant_example",
  "project_id": "project_demo",
  "request_id": "req_01...",
  "session_id": "ses_01...",
  "task_id": "task_01...",
  "event_type": "agent.test.result",
  "observed_at": "2026-11-05T00:00:00Z",
  "received_at": "2026-11-05T00:00:02Z",
  "source": {
    "kind": "agent_hook",
    "runtime": "generic",
    "integration_id": "int_example"
  },
  "provenance": {
    "evidence_class": "tool_observed",
    "redaction_state": "redacted",
    "content_digest": "sha256:example-not-a-real-digest"
  },
  "payload": {
    "command_category": "test",
    "exit_code": 0,
    "artifact_refs": ["artifact_synthetic_1"]
  }
}
~~~

All IDs above are synthetic examples. Schema requires namespace-scoped references; a user-supplied request_id alone is never an authorization token.

## 3. Provenance & confidence

Differentiate four orthogonal concepts:

- **Source:** model_claim / user_feedback / gateway_observed / tool_observed / CI_verified / human_approved.
- **Evidence class:** observed / inferred / externally_verified / approved.
- **Completeness:** complete / partial / missing / unknown.
- **Outcome:** passed / failed / rejected / unknown.

Do not equate human-approved experience with automatically correct facts; approvals capture governance, while verification captures evidence.

## 4. Task outcome

~~~json
{
  "task_id": "task_01...",
  "acceptance_criteria": [
    {
      "criterion_id": "tests-pass",
      "status": "passed",
      "verification_method": "ci",
      "evidence_event_ids": ["evt_test_1"]
    },
    {
      "criterion_id": "review-required",
      "status": "unknown",
      "verification_method": "human",
      "evidence_event_ids": []
    }
  ],
  "declared_by_agent": "complete",
  "verified_status": "partial",
  "evaluated_at": "2026-11-05T00:05:00Z"
}
~~~

The aggregated verified status is derived only from declared acceptance rules. Missing mandatory criterion => not verified.

## 5. Data handling

- Raw content stored only with explicit capture policy, scope and retention; references and hashes by default.
- Restrict raw body storage separately from structured audit metadata.
- Encryption keys and sensitive audit payloads must not share unrestricted reader credentials.
- Embeddings created from source data inherit the same tenant access and deletion requirements.
- Redaction is performed before mining; sensitive source content must not appear in exported Skills.
- Deletion follows data_lineage to derived observations, Instincts and Skills, possibly leading to quarantine/review.

## 6. Indexing & query patterns

- Composite keys on tenant_id + observed_at, tenant_id + task_id, tenant_id + request_id.
- Uniqueness constraint on tenant_id + event_id for idempotency.
- Task and evidence joins should not cross tenant boundaries.
- pgvector similarity is only a candidate search mechanism; vector proximity is not verification.

## 7. Event type starter taxonomy

gateway.request.received; gateway.policy.input_decided; gateway.provider.response; gateway.policy.output_decided; gateway.request.finished; agent.tool.invoked; agent.tool.completed; agent.test.result; agent.git.diff_observed; task.feedback.received; task.verification.completed; experience.candidate.created; skill.evaluation.completed; skill.release.changed.

Use versioned envelopes. The event ingestion API must reject invalid event_type or missing mandatory source fields rather than silently inserting inconsistent evidence.
