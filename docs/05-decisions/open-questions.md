# Open Questions & Validation Experiments / 待决策问题

**Status:** Open. Do not quietly turn these items into assumed facts in implementation tasks.

| ID | Decision to make | Why it matters | Fastest valid experiment |
|---|---|---|---|
| D-01 | Existing gateway integration: LiteLLM specifically or vendor-neutral adapter? | Provider support, intercept points, licensing | Run one streaming and one non-streaming synthetic request with input/output checks |
| D-02 | Reuse Langfuse/Opik vs own trace UI? | Avoid rebuilding mature capabilities | Compare pilot trace and task queries with integration cost |
| D-03 | Which runtime first (Codex, Claude Code, OpenCode)? | Hook/event coverage and installation shape | Instrument same fixture task in two runtimes, measure actual captured events |
| D-04 | Is Go the correct platform backend? | Callback libraries, SDK friction, runtime complexity | Spike simple collector+worker in Go versus existing integration language |
| D-05 | What constitutes independent verification across task categories? | Prevent false experience promotion | Specify mandatory acceptance criteria and evidence for 3 task types |
| D-06 | Tenant privacy and cross-project opt-in model? | Default isolation and safe reuse | Threat model a sample account with two isolated projects |
| D-07 | What event storage retention and deletion guarantees? | Legal and technical data minimization | Execute a synthetic deletion+lineage audit |
| D-08 | How are Skill effects measured without selection bias? | Real value vs correlation | Blind or randomized baseline/Skill run on pinned task set |
| D-09 | What licensing strategy for dependencies and code? | Existing GPL-3.0 docs repo, future distribution | Confirm desired code repo/license and dependency license audit |
| D-10 | What exactly can be blocked in a streaming route? | Prevention vs monitoring accuracy | Measure buffered, chunk-gated, audit-only behavior under synthetic disclosure |
| D-11 | How to revoke Skills installed on offline clients? | Revocation realism | Simulate offline adapter and define stale-version/expiry policy |
| D-12 | How to evaluate Skill quality when model version changes? | Detect regressions and avoid confounding | Re-run pinned suite with version matrix and unchanged verifier |

## Decision hygiene

Every resolved item needs an ADR: context, alternatives considered, verified evidence, decision, reversibility and consequences. If a planned capability is unsupported in tested integration, label it unsupported/partial rather than papering over the limitation.

## First experiments to schedule

1. **Gateway feasibility spike:** pre-send check, metadata callback, streaming handling, audit persistence on transient outage.
2. **Agent evidence spike:** one coding task with multi-turn requests, shell/test Hook and CI result correlated to task.
3. **Skill loop spike:** derive a single Instinct, make synthetic regression suite, compare baseline, approve/distribute/rollback.

These are work items, not claims of completed validation.
