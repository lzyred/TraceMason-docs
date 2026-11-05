# Gateway & Agent Integration / 网关与 Agent 接入

**Status:** Proposed, capability-specific. Do not claim universal auto-capture.

## 1. Three integration levels

| Level | Required client support | Observable data | Limitation |
|---|---|---|---|
| L0 Gateway-only | OpenAI-compatible gateway routing or equivalent | request/response metadata, provider errors, inline policies | no guaranteed local tool/CI/task result |
| L1 Hook-enabled | Agent lifecycle and tool hooks | tool invocations, exit codes, selected file change metadata | may be detection-only, not mandatory enforcement |
| L2 Verifier-enabled | CI, tests, git or human approval integration | independently verified acceptance criteria | confidence depends on verifier and environment |

Each integration reports capabilities, missing signals, tested versions and the last successful synthetic check. Feature claims are scoped by level.

## 2. Gateway adapter

Start by testing an existing gateway with:

- inbound identity and request correlation;
- pre-provider input policy hook;
- output enforcement mode (buffered / chunk-gated / audit-only);
- callback/export carrying structured metadata, model, costs when available, errors and policy version;
- successful handling of streaming, tool-call schemas, timeout, cancellation and upstream retry.

If the selected gateway cannot support a security-critical pre-send check, place the enforcement boundary elsewhere or mark that route unsupported. Callback-only logging cannot be described as preventive security.

## 3. Agent Hook / SDK adapter

Minimum event set: agent.run.started; agent.tool.invoked; agent.tool.completed; agent.test.result; agent.run.finished.

Recommended: file change manifest and content hashes; git commit/diff metadata; CI verification reference; user acceptance/feedback.

Avoid collecting entire repos or command stdout by default. Treat stdout and filenames as sensitive until scanned. Never intercept privileged tools through a Hook that itself has broader access than necessary.

**Security:** Hooks cannot guarantee interception if runtime permits bypass. Enforcement must be at tool/OS policy boundary where required.

## 4. Correlation handshake

- Gateway issues or propagates a signed, short-lived correlation token containing opaque tenant/project/session/task context.
- Agent adapter associates its events with a task ID and records request_id where known.
- If only approximate timestamps exist, link as *candidate correlation*, not verified identity.
- Never trust an agent-supplied tenant ID without credential scope validation.
- Record event completeness and unlinked events; preserve them for authorized reconciliation.

The correlation token is a proposed mechanism; validate actual SDK/CLI capabilities before committing.

## 5. Skill distribution

Define an adapter contract:

~~~json
{
  "adapter": "codex-example",
  "capabilities": {
    "pull_skill_manifest": true,
    "install_skill_directory": true,
    "report_activation": false,
    "report_usage_result": false
  },
  "applied_skill_versions": [
    {"id": "verified-code-delivery", "digest": "sha256:synthetic"}
  ]
}
~~~

Potential delivery modes: standard Agent Skills directory sync; Git-backed distribution; CLI command; MCP resource resolution. A skill downloaded is not necessarily loaded; a Skill loaded is not necessarily applied successfully.

Report separately: **eligible, distributed, installed, loaded, applied, outcome-observed**. Runtime support must be experimentally confirmed for Codex, Claude Code and OpenCode.

## 6. Adapter conformance tests

- Auth and tenant restriction; out-of-order tool events; malformed data; duplicated event ID.
- Correlation across a provider retry and multiple calls within a task.
- Hook absent but gateway present: task status remains evidence-incomplete.
- Skill version mismatch: registry reports drift rather than pretending success.
- Revoked Skill: new resolution/installation rejected and active runtime caveats documented.
- Offline client: previous approved Skill retained with explicit stale-version status.

## 7. Minimal integration pilot

Select **one gateway and one coding Agent**, run a synthetic repository task with known failure and passing CI. Capture model trace, Hook tool output, task verification, Skill test and rollback. Add second Agent only after passing the full loop.
