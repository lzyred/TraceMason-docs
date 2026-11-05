# MVP Acceptance & Evaluation / 验收标准与评估

**Status:** Proposed black-box tests. All test content is synthetic; independent results required for launch.

## Test matrix

| ID | Test | Pass condition |
|---|---|---|
| A-01 | Successful + failed gateway calls | Every test call has request_id, authenticated scope, model, stage, cost availability, timestamp, event status and no cross-tenant read |
| A-02 | Synthetic key in prompt | Secret is blocked/masked before provider transmission under configured inline policy; no raw key in audit logs |
| A-03 | Streaming output with sensitive synthetic token | Buffered/chunk-gated route releases no blocked bytes; audit-only route explicitly makes no prevention claim |
| A-04 | One task, multiple inference and Hook events | Correlation produces coherent timeline and records missing/out-of-order evidence |
| A-05 | Forged/failing verification and duplicated events | Invalid provenance rejected; idempotent duplicate does not create duplicate conclusions |
| A-06 | Agent claims success without passing required test | Verified status is not passed; missing criteria and evidence visible |
| A-07 | Two similar correction events, one contradictory example | Creates reviewable candidate with provenance, counterexample and scope; not auto-published |
| A-08 | Skill draft through approval | Immutable digest, evidence refs, reviewer and allowed state transitions enforced |
| A-09 | New Skill on fixed benchmark | Runner produces no-Skill vs Skill comparable results, uncertainty, cost and safety regressions |
| A-10 | Scoped canary and rollback | Only eligible target gets approved digest; rollback restores last approved version and records event |
| A-11 | Cross-tenant and deletion attempt | Unauthorized access denied; deletion triggers raw/derived lineage handling and audit trail |
| A-12 | Simulated platform / worker outage | Configured durability/fail-closed rules honored; event loss/coverage explicitly reported |

## Evaluation methodology

### Unit of analysis

A **task** has a pre-declared goal, acceptance criteria, environment, model version and independent outcome verifier. A request or a model message is not a task-level success measurement.

### Primary measures

- **Verified task success rate:** verified successful tasks / tasks with independently measurable outcomes. Always display verification coverage over all eligible tasks.
- **Rework rate:** tasks requiring material correction / tasks with sufficient feedback capture.
- **Cost per accepted task:** total observed inference/tool cost divided by accepted tasks; clearly flag incomplete cost accounting.
- **False-completion rate:** tasks declared complete by Agent but failing mandatory independent criteria / declared-complete tasks with verification coverage.
- **Skill incremental effect:** compare on identical pinned task set, model, tool environment, verifier and randomization strategy.
- **Security:** true/false positive rates and blocked-before-delivery vs audit-only detection rates.

### Comparison design

1. Pin model configuration, repository fixture, tools, permissions and acceptance tests.
2. Randomize or balance trial order for baseline/no-Skill versus Skill-version comparisons.
3. Use the same task set and independent evaluator; model self-judgment is not the ground truth.
4. Report sample size, missing data, CI reliability, variance, latency and costs, not just a single point estimate.
5. Include adversarial prompt-injection and negative cases; document regression thresholds before running experiments.
6. Re-run on changes to model/provider, Skill, policy or verifier code.

### Guardrails for sample size and thresholds

No universal "95% improvement" or arbitrary sample counts. For v0.1, require deterministic conformance tests plus a documented pilot sample and predeclared pass/fail thresholds before production promotion. Small samples support feasibility claims, not broad accuracy claims.

## Release gate

**Mandatory:** A-01 through A-12 pass or explicitly documented limited-scope exception approved by an authorized maintainer. No safety-critical exception may silently change enforced policy. Evidence must include API responses, logs with synthetic data, CI output, release manifest and rollback result.

## Evidence naming

~~~text
eval-runs/<run-id>/manifest.json
eval-runs/<run-id>/baseline.json
eval-runs/<run-id>/candidate.json
eval-runs/<run-id>/comparison.json
eval-runs/<run-id>/security.json
eval-runs/<run-id>/approval.json
~~~

Paths are a proposed export contract, not an existing pipeline.
