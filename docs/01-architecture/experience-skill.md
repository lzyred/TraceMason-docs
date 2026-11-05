# Experience → Instinct → Skill / 经验到技能演化

**Status:** Proposed workflow. This is the product's main differentiator.

## 1. Separate raw observations, inferred rules and deployable Skills

| Object | Meaning | Allowed automatically? |
|---|---|---|
| Observation | 用户纠错、工具失败、测试通过、风险命中等可引用事件 | Yes, with privacy filter |
| Candidate Instinct | 触发条件、建议行为、适用范围、正反证据与冲突 | Candidate only |
| Validated Instinct | 证据足够且通过独立验证的原子规则 | With configured reviewer |
| Skill Draft | Agent Skills compatible instructions + supporting resources | Yes, unpublished |
| Evaluated Skill | 通过固定测试集及安全检查的不可变版本 | Yes, not promoted automatically |
| Published Skill | Approved, scoped, versioned artifact available to Agent | Authorized publisher only |

**Important:** A model's self-assessment is never independent proof. User correction is a useful negative signal but not automatically proof of the corrected answer.

## 2. Extraction pipeline

1. **Signal detection:** Detect correction turns, repeated failures, CI/test changes, acceptance confirmations, model regression.
2. **Normalize:** Strip confidential material and store source IDs, event ranges, task context.
3. **Cluster:** Find semantically similar cases within authorized scope; do not merge distinct failure causes solely by embedding distance.
4. **Hypothesize:** Form minimal `when / do / avoid / evidence-required` candidate.
5. **Challenge:** Retrieve contradictory examples and alternative explanations; check security boundaries.
6. **Validate:** Link independent outcomes, inspect repeatability and unknown coverage.
7. **Approve:** Record reviewer, scope, conflict resolution and provenance.
8. **Synthesize:** Generate minimal Skill with tests, manifest, executable assets only when necessary.
9. **Evaluate:** No-Skill baseline versus candidate Skill, same tasks, model, environment and verifier.
10. **Deploy:** Canary to scoped clients; collect adoption, verified outcomes and failures.
11. **Review:** Promote, revise, rollback or deprecate based on measured results.

## 3. Instinct contract

~~~yaml
id: ins_verified-delivery
revision: 1
status: candidate
trigger:
  task_types: [coding, debugging, refactoring]
behavior:
  do: "Require task-specific verification before claiming completion"
  avoid: "Treating model assertion as successful delivery"
  evidence_required: [test_result, diff_review, acceptance_status]
scope:
  tenant: example
  project: example
provenance:
  source_observation_ids: [obs_synthetic_a, obs_synthetic_b]
  counterexample_ids: [obs_synthetic_c]
assessment:
  evidence_state: inferred
  reviewer: null
~~~

This is a schema illustration, not a verified learned rule.

## 4. Skill artifact layout

~~~text
skills/
  verified-code-delivery/
    SKILL.md
    references/
      acceptance-rules.md
    scripts/
      verify-delivery.sh      # optional, sandbox-reviewed
    evals/
      cases.jsonl
      expected-results.json
~~~

Internal governance manifest (never automatically exported with private evidence):

~~~json
{
  "skill_id": "verified-code-delivery",
  "version": "0.1.0",
  "scope": ["tenant:example", "project:example"],
  "source_observation_ids": ["obs_synthetic_a"],
  "verified_outcome_ids": ["out_synthetic_1"],
  "evaluation_suite_id": "suite_1",
  "approved_by": "reviewer_1",
  "status": "tested",
  "content_digest": "sha256:example",
  "policy_version": "policy_1"
}
~~~

## 5. Lifecycle constraints

~~~text
Candidate -> Draft -> Tested -> Approved -> Canary -> Active
                   \-> Rejected            \-> Rolled back
Active -> Deprecated / Revoked
~~~

A tested Skill is **not** automatically approved. Approval cannot be inferred from successful code generation. The Skill may use the standard `SKILL.md` name/description/body convention, but each Agent requires a validated install/activation adapter.

## 6. Evidence and evaluation gate

Before promotion require:

- At least one independent verifier appropriate to each mandatory acceptance criterion.
- Positive and negative examples with explanations; explicitly mark small-sample cases.
- Security checks: no privilege escalation, secret references, prompt-injection instructions or unauthorized scripts.
- Reproducible evaluation suite, environment and pinned model configuration.
- No unacceptable regression in safety or task success versus current Skill and no-Skill baseline.
- Approval from an authorized role; published version content immutable.

No fixed numeric performance threshold is claimed yet; define domain-specific gates in the [acceptance plan](../03-delivery/acceptance.md).

## 7. Example: coding completion failure

**Observed:** Agent states "done" without CI results. A later test shows errors; user requests correction.

**Inferred candidate:** "Before reporting a coding task complete, check changed files and run task-relevant checks; disclose checks not run."

**External verification:** CI/test output, diff verification, human acceptance.

**Skill:** Instruction + optional verification helper + regression suite.

**Post-release comparison:** Compare the same task set with/without Skill; track verifiable success, false completion claims, cost and latency. If negative, revert deployment and record failure evidence.

## 8. Anti-patterns

- Auto-publish every conversation summary.
- Promote an instruction because it appears frequently in training data.
- Blend one project's confidential details into global Skills.
- Use prior Skill-generated output as its own independent evaluation oracle.
- Keep old Skills active after source evidence has been invalidated.

## 9. Standard references

- https://agentskills.io
- https://github.com/obra/superpowers
- https://github.com/affaan-m/everything-claude-code
