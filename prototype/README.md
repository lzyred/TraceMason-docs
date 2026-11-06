# TraceMason — runnable evidence-to-Skill Demo

**This is an executable localhost service, not the mock GitHub Pages dashboard.**

The demo uses **Python 3.10+ standard library only**. It starts a real HTTP API and a browser frontend, persists events in SQLite, runs actual Python unit tests in a disposable fixture, and uses test evidence to derive a candidate Skill. The Skill is evaluated against a deterministic rule-conformance suite, approved, published to disk and used by a real decision endpoint.

## Start in 2 commands

From the repository root:

~~~bash
python3 prototype/tracemason.py
# Visit http://127.0.0.1:8765/
~~~

On Windows or when Python is installed as `python`, replace `python3` with `python`.

No Docker, Node, external API key, or network connection is needed.

## Guided proof-of-function

1. Click **Run failing tests**. The backend copies actual Python source into a temporary workspace and runs `python -m unittest`. A **deliberately mocked** "task is done" assertion conflicts with the **real failed tests**. Both are recorded in SQLite.
2. Click **Run passing tests**. A corrected fixture is tested with the same unittest runner; passing is backed by a real process exit code.
3. Click **Derive candidate**. The engine queries the database for **observed false-completion claims** linked to failed tests and creates a candidate only if supporting evidence exists.
4. Click **Evaluate detector**. The engine actually executes an evaluation of its completion gate versus a naive baseline, including the real fixture results. This tests **rule correctness, not model intelligence or future productivity gains**.
5. Click **Approve**, then **Publish**. Publication atomically writes `data/skills/verified-code-delivery/SKILL.md` and activates the completion gate for `/api/claims/check`.
6. Use **Check claim** on a failing run. Before publication it is incorrectly accepted by the intentionally naive baseline; after publication it is rejected. A passing run is accepted.
7. Click **Rollback**. The gate is deactivated and the published file removed, demonstrating a real state change.

All state persists in `prototype/data/tracemason.sqlite3` between restarts (unless reset). The default HTTP server listens on **127.0.0.1 only**.

## Actual gateway observation

The demo also has a **non-streaming OpenAI Chat Completions-compatible** endpoint:

~~~bash
curl -s http://127.0.0.1:8765/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{"model":"demo","messages":[{"role":"user","content":"Hello"}]}'
~~~

Without upstream configuration, it returns a **clearly labeled deterministic mock response**, and stores the request hash, redacted preview, model, mode and status in SQLite. It does not misrepresent mock calls as real inference.

To forward to a real OpenAI-compatible provider (whose URL and credentials **you** control), restart the server:

~~~bash
export TRACEMASON_UPSTREAM_URL="https://YOUR-GATEWAY.example/v1/chat/completions"
export TRACEMASON_UPSTREAM_KEY="YOUR_KEY"
python3 prototype/tracemason.py
~~~

The endpoint sends non-streaming requests to the explicitly configured HTTPS upstream (loopback HTTP also supported) and returns the actual provider response. It blocks basic credential-like inputs **before forwarding**, and logs only redacted previews and content SHA-256 fingerprints. It does not implement streaming, tool execution, a production-level security filter, authentication, usage accounting or Agent hooks.

**Do not expose the server publicly or forward sensitive real conversations through this prototype.** It is a single-user, loopback-only research demo, not an enterprise gateway.

## API

| Method | Route | Meaning |
|---|---|---|
| GET | `/api/state` | Persisted runs, gateway call metadata, Skill and evaluation |
| GET | `/api/health` | Health |
| POST | `/api/demo/run` | `{"scenario":"failed"|"passed"}`: execute fixed unittest |
| POST | `/api/skills/derive` | Derive Skill candidate from failed test evidence |
| POST | `/api/skills/evaluate` | Execute rule-conformance suite (requires positive control) |
| POST | `/api/skills/approve` | Authorize evaluated candidate in the local demo |
| POST | `/api/skills/publish` | Write file and enable evidence gate |
| POST | `/api/skills/rollback` | Disable gate and remove distributed artifact |
| POST | `/api/claims/check` | Return real gate decision for a persisted fixture run |
| GET | `/api/skills/download` | Export candidate's SKILL.md after publishing |
| POST | `/api/reset` | Clear this local demo's DB records and Skill artifact |
| POST | `/v1/chat/completions` | Non-streaming gateway proxy or transparent mock |

JSON `Content-Type: application/json` and request bodies are required for all POST routes; pass `{}` to the routes without parameters.

## Verification

~~~bash
python3 -m unittest discover -s prototype/tests -v
~~~

The CI workflow runs these tests on every related PR and before publishing documentation.

## What this **does not** prove

- That a model changed code or produced the failing fixture. It did not; the deliberate completion claim is simulated.
- That the Skill improves model quality or task success. The evaluated object is a **deterministic postcondition rule**, not model behavior.
- That an arbitrary Agent will automatically load the generated Skill. Export/installation is manual.
- That the gateway sees all local shell or filesystem actions. It only sees forwarded HTTP requests.
- That this is safe for production traffic, real customer data, multi-tenant access, or internet exposure.

The valuable evidence here is: **HTTP ingress → SQLite record → externally executed test → reproducible rule derivation → evaluated Skill → persisted artifact → live decision change → rollback**. The next engineering milestone is replacing the deliberately mocked completion claim with an actual Agent execution + tool evidence adapter.
