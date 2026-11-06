#!/usr/bin/env python3
"""TraceMason runnable evidence-to-Skill demo (Python 3.10+, stdlib only).

This is a LOCAL, single-user prototype. It is not a production gateway or
security boundary. The deterministic fixture tests actually execute; model
completion claims in that fixture are deliberately mock data. Optional
non-streaming OpenAI-compatible gateway traffic can be proxied and audited.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import threading
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
DEFAULT_DATA = ROOT / "data"
CLIENT_ROOT = ROOT / "ui"
MAX_BODY = 256 * 1024
SECRET_RE = re.compile(
    r"(?i)(?:\b(?:api[_-]?key|password|secret|access[_-]?token)\b\s*[:=]\s*\S+|"
    r"\bsk-(?:live|test|demo)-[A-Za-z0-9_-]{6,}\b)"
)
CLAIM_RE = re.compile(r"(?i)\b(?:done|completed|finished|all tests pass|fixed)\b|已完成|已经修复|测试通过")
SKILL_ID = "verified-code-delivery"
SKILL_VERSION = "0.2.0"
# Acceptance cases test the *deterministic completion gate*, not a model's output.
EVAL_CASES = [
    {"claim": True, "verification": "failed", "expected": "reject", "case": "failed-test"},
    {"claim": True, "verification": "missing", "expected": "reject", "case": "no-evidence"},
    {"claim": True, "verification": "passed", "expected": "accept", "case": "passing-tests"},
    {"claim": True, "verification": "unknown", "expected": "reject", "case": "untrusted-proof"},
    {"claim": False, "verification": "passed", "expected": "no-claim", "case": "no-claim"},
    {"claim": True, "verification": "failed", "expected": "reject", "case": "regression"},
]

GOOD_SOURCE = '''def compute_total(price, discount):
    """Return the discounted total; discount must be in [0, 1]."""
    if not 0 <= discount <= 1:
        raise ValueError("discount out of range")
    return round(price * (1 - discount), 2)
'''

def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

def uid(prefix: str) -> str:
    return prefix + "_" + uuid.uuid4().hex[:12]

def redact(text: str) -> str:
    return SECRET_RE.sub("[REDACTED]", text)

def safe_preview(text: str, limit: int = 320) -> str:
    return redact(text)[:limit]

def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def naive_completion(claim: bool, verification: str) -> str:
    """Naive baseline; intentionally unsafe. Used *only* for comparison."""
    return "accept" if claim else "no-claim"

def evidence_gate(claim: bool, verification: str) -> str:
    """Actual rule under test; accepts only independently passed checks."""
    if not claim:
        return "no-claim"
    return "accept" if verification == "passed" else "reject"

class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str):
        self.status, self.code, self.message = status, code, message
        super().__init__(message)

class Engine:
    """Minimal persistence + evidence domain, intentionally single-user/local."""
    def __init__(self, data_dir: Path):
        self.data_dir = Path(data_dir).resolve()
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.dbpath = self.data_dir / "tracemason.sqlite3"
        self.lock = threading.RLock()
        self._init_db()

    @contextmanager
    def _db(self):
        db = sqlite3.connect(self.dbpath, timeout=10)
        try:
            db.row_factory = sqlite3.Row
            db.execute("PRAGMA foreign_keys = ON")
            yield db
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()

    def _init_db(self):
        with self._db() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS runs (
                    id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    scenario TEXT NOT NULL,
                    claim INTEGER NOT NULL,
                    verification TEXT NOT NULL,
                    tests_passed INTEGER NOT NULL,
                    tests_failed INTEGER NOT NULL,
                    test_output TEXT NOT NULL,
                    evidence_digest TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS gateway_calls (
                    id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    model TEXT NOT NULL,
                    mode TEXT NOT NULL,
                    status TEXT NOT NULL,
                    request_digest TEXT NOT NULL,
                    request_preview TEXT NOT NULL,
                    response_preview TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS skills (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    version TEXT NOT NULL,
                    stage TEXT NOT NULL,
                    evidence_json TEXT NOT NULL,
                    evaluation_json TEXT,
                    body TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
            """)

    def _one(self, sql: str, args: tuple = ()):
        with self._db() as db:
            row = db.execute(sql, args).fetchone()
            return dict(row) if row else None

    def _all(self, sql: str, args: tuple = ()):
        with self._db() as db:
            return [dict(r) for r in db.execute(sql, args).fetchall()]

    def _change(self, sql: str, args: tuple = ()):
        with self.lock:
            with self._db() as db:
                db.execute(sql, args)

    def run_fixture(self, scenario: str) -> dict:
        """Run real unittest code against a fixed, throwaway demo workspace."""
        if scenario not in ("failed", "passed"):
            raise ApiError(400, "invalid_scenario", "Use 'failed' or 'passed'.")
        source_dir = ROOT / "fixtures"
        if not source_dir.is_dir():
            raise ApiError(500, "fixture_missing", "Demo test fixtures unavailable.")
        with tempfile.TemporaryDirectory(prefix="tracemason-fixture-") as temp:
            work = Path(temp)
            shutil.copy(source_dir / "price.py", work / "price.py")
            shutil.copy(source_dir / "test_price.py", work / "test_price.py")
            if scenario == "passed":
                (work / "price.py").write_text(GOOD_SOURCE, encoding="utf-8")
            try:
                result = subprocess.run(
                    [sys.executable, "-m", "unittest", "discover", "-s", str(work), "-p", "test_*.py", "-v"],
                    cwd=str(work), capture_output=True, text=True, timeout=15,
                    env={"PATH": os.environ.get("PATH", ""), "PYTHONPATH": str(work),
                         "PYTHONIOENCODING": "utf-8"},
                    check=False,
                )
            except subprocess.TimeoutExpired:
                raise ApiError(504, "verification_timeout", "Fixed demo tests exceeded 15 seconds.")
        output = (result.stdout + "\n" + result.stderr).strip()
        if "Ran " not in output or ("OK" not in output and "FAILED" not in output):
            raise ApiError(500, "verification_error", "Fixture tests could not execute correctly.")
        count = re.search(r"Ran (\d+) tests?", output)
        tests_total = int(count.group(1)) if count else 0
        failed_matches = re.search(r"failures=(\d+)", output)
        errors_matches = re.search(r"errors=(\d+)", output)
        failures = int(failed_matches.group(1)) if failed_matches else 0
        errors = int(errors_matches.group(1)) if errors_matches else 0
        failed = failures + errors
        verification = "passed" if result.returncode == 0 else "failed"
        # Deliberately false completion claim in the failing fixture; this is NOT model output.
        claim = True
        rid = uid("run")
        record = (rid, now(), scenario, int(claim), verification,
                  tests_total - failed, failed, output[:6000], sha256(output))
        self._change(
            "INSERT INTO runs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", record
        )
        return self._one("SELECT * FROM runs WHERE id = ?", (rid,))

    def derive(self) -> dict:
        """Derive a candidate only when genuine executed test evidence contradicts a claim."""
        failures = self._all(
            "SELECT * FROM runs WHERE claim = 1 AND verification = 'failed' ORDER BY created_at"
        )
        if not failures:
            raise ApiError(409, "insufficient_evidence",
                           "Run a failing fixture test before deriving this candidate.")
        existing = self.get_skill()
        if existing:
            return existing
        refs = [r["id"] for r in failures]
        body = self._make_skill(refs)
        self._change(
            "INSERT INTO skills VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (SKILL_ID, SKILL_ID, SKILL_VERSION, "candidate",
             json.dumps(refs), None, body, now()),
        )
        return self.get_skill()

    def _make_skill(self, refs: list[str]) -> str:
        return (
            "---\n"
            "name: verified-code-delivery\n"
            "description: Require independently observed tests before declaring coding tasks complete.\n"
            "---\n\n"
            "# Verified Code Delivery\n\n"
            "## When to use\n"
            "Use for coding tasks where acceptance requires successful tests or other verifiers.\n\n"
            "## Procedure\n"
            "1. Identify the mandatory acceptance checks before coding.\n"
            "2. Inspect the changed files and run the task-specific tests.\n"
            "3. Examine actual test exit status and failure output.\n"
            "4. Only claim verified completion when the required checks passed.\n"
            "5. If checks failed or are missing, report the precise gap instead of claiming success.\n\n"
            "## Safety\n"
            "- Never fabricate tests, approvals, logs or tool results.\n"
            "- Never bypass execution permissions or environment safety policies.\n"
            "- Mark unobserved tool runs as unknown, not successful.\n\n"
            "## Evidence provenance (local demo only)\n"
            + "".join("- Fixture result `" + ref + "`\n" for ref in refs)
        )

    def get_skill(self):
        row = self._one("SELECT * FROM skills WHERE id = ?", (SKILL_ID,))
        if row:
            row["evidence_ids"] = json.loads(row.pop("evidence_json"))
            row["evaluation"] = json.loads(row.pop("evaluation_json") or "null")
        return row

    def _require_skill(self, stage: str):
        skill = self.get_skill()
        if not skill or skill["stage"] != stage:
            raise ApiError(409, "invalid_transition",
                           "Expected Skill stage: " + stage)
        return skill

    def evaluate(self) -> dict:
        skill = self._require_skill("candidate")
        observed = self._all("SELECT * FROM runs ORDER BY created_at")
        if not any(r["verification"] == "passed" for r in observed):
            raise ApiError(409, "missing_positive_control",
                           "Run passing fixture tests as a positive control before evaluating.")
        cases = list(EVAL_CASES)
        for r in observed:
            cases.append({
                "claim": bool(r["claim"]), "verification": r["verification"],
                "expected": "accept" if r["verification"] == "passed" else "reject",
                "case": "executed-fixture:" + r["id"],
            })
        results = [{
            "case": case["case"], "expected": case["expected"],
            "baseline": naive_completion(case["claim"], case["verification"]),
            "gate": evidence_gate(case["claim"], case["verification"]),
            "verification": case["verification"],
        } for case in cases]
        baseline_correct = sum(r["baseline"] == r["expected"] for r in results)
        gate_correct = sum(r["gate"] == r["expected"] for r in results)
        evaluated = {
            "suite": "completion-gate-conformance-v1",
            "type": "deterministic_rule_test_not_model_evaluation",
            "total": len(results), "baseline_correct": baseline_correct,
            "candidate_correct": gate_correct, "cases": results,
            "executed_fixture_count": len(observed),
            "passes_gate": gate_correct == len(results) and gate_correct > baseline_correct,
        }
        self._change(
            "UPDATE skills SET stage = ?, evaluation_json = ?, updated_at = ? WHERE id = ?",
            ("tested" if evaluated["passes_gate"] else "candidate",
             json.dumps(evaluated), now(), SKILL_ID),
        )
        return evaluated

    def change_stage(self, target: str) -> dict:
        requirements = {"approved": "tested", "active": "approved", "rolled_back": "active"}
        if target not in requirements:
            raise ApiError(400, "unsupported_transition", "Not a supported stage change.")
        skill = self._require_skill(requirements[target])
        path = self.data_dir / "skills" / SKILL_ID / "SKILL.md"
        if target == "active":
            path.parent.mkdir(parents=True, exist_ok=True)
            # Atomic replacement of the artifact that an Agent can install.
            staged = path.with_suffix(".tmp")
            staged.write_text(skill["body"], encoding="utf-8")
            staged.replace(path)
        if target == "rolled_back" and path.exists():
            path.unlink()
        self._change("UPDATE skills SET stage = ?, updated_at = ? WHERE id = ?",
                     (target, now(), SKILL_ID))
        return self.get_skill()

    def gate(self, run_id: str) -> dict:
        run = self._one("SELECT * FROM runs WHERE id = ?", (run_id,))
        if not run:
            raise ApiError(404, "run_not_found", "Unknown fixture run ID.")
        skill = self.get_skill()
        active = bool(skill and skill["stage"] == "active")
        decision = (evidence_gate if active else naive_completion)(
            bool(run["claim"]), run["verification"]
        )
        return {"run_id": run_id, "gate_active": active,
                "verification": run["verification"],
                "decision": decision, "source": "executed_unittest_fixture",
                "mode": "enforced_rule" if active else "unsafe_baseline"}

    def gateway_record(self, request_text: str, model: str, mode: str,
                       status: str, response_text: str = "") -> str:
        rid = uid("gw")
        self._change(
            "INSERT INTO gateway_calls VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (rid, now(), model[:100], mode, status, sha256(request_text),
             safe_preview(request_text), safe_preview(response_text)),
        )
        return rid

    def gateway(self, payload: dict) -> tuple[int, dict]:
        """OpenAI-compatible, non-streaming proxy. No raw prompt persistence."""
        if payload.get("stream") is True:
            raise ApiError(400, "stream_unsupported",
                           "Streaming is not implemented; do not use this demo for streaming clients.")
        if not isinstance(payload.get("messages"), list):
            raise ApiError(400, "bad_messages", "Expected a messages array.")
        text = json.dumps(payload["messages"], ensure_ascii=False)
        model = str(payload.get("model") or "demo-mock")
        if SECRET_RE.search(text):
            rid = self.gateway_record(text, model, "policy", "blocked")
            raise ApiError(403, "blocked_sensitive_content",
                           "Credential-like content blocked BEFORE any upstream transmission. Event: " + rid)
        upstream = os.getenv("TRACEMASON_UPSTREAM_URL")
        if not upstream:
            answer = "Deterministic demo response only. No AI model was called."
            completion = {
                "id": "chatcmpl-" + uuid.uuid4().hex[:12],
                "object": "chat.completion", "created": int(time.time()),
                "model": "tracemason-mock",
                "choices": [{"index": 0, "message": {"role": "assistant", "content": answer},
                             "finish_reason": "stop"}],
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
            }
            completion["tracemason"] = {"source": "deterministic_mock", "not_real_inference": True}
            self.gateway_record(text, model, "mock", "ok", answer)
            return 200, completion
        if not upstream.startswith("https://") and not upstream.startswith("http://127.0.0.1"):
            raise ApiError(500, "invalid_upstream",
                           "Upstream must use HTTPS or explicit loopback HTTP.")
        raw = json.dumps(payload).encode("utf-8")
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        api_key = os.getenv("TRACEMASON_UPSTREAM_KEY", "")
        if api_key:
            headers["Authorization"] = "Bearer " + api_key
        req = Request(upstream, data=raw, headers=headers, method="POST")
        try:
            with urlopen(req, timeout=40) as response:
                if response.status >= 400:
                    raise ApiError(502, "upstream_error", "Upstream rejected request.")
                body = response.read(2 * 1024 * 1024 + 1)
                if len(body) > 2 * 1024 * 1024:
                    raise ApiError(502, "upstream_too_large", "Upstream response too large.")
            decoded = json.loads(body)
        except (HTTPError, URLError, TimeoutError, ValueError) as exc:
            self.gateway_record(text, model, "upstream", "error", str(type(exc).__name__))
            raise ApiError(502, "upstream_error", type(exc).__name__) from exc
        choices = decoded.get("choices") or []
        response_text = ""
        if choices and isinstance(choices[0], dict):
            response_text = str((choices[0].get("message") or {}).get("content") or "")
        self.gateway_record(text, model, "upstream", "ok", response_text)
        return 200, decoded

    def reset(self):
        with self.lock:
            with self._db() as db:
                db.execute("DELETE FROM skills")
                db.execute("DELETE FROM runs")
                db.execute("DELETE FROM gateway_calls")
        path = self.data_dir / "skills" / SKILL_ID / "SKILL.md"
        if path.exists():
            path.unlink()

    def snapshot(self) -> dict:
        runs = self._all("SELECT * FROM runs ORDER BY created_at DESC LIMIT 40")
        calls = self._all("SELECT * FROM gateway_calls ORDER BY created_at DESC LIMIT 40")
        return {
            "runs": runs,
            "gateway_calls": calls,
            "skill": self.get_skill(),
            "capabilities": {
                "gateway_proxy": "configured" if os.getenv("TRACEMASON_UPSTREAM_URL") else "deterministic-mock",
                "agent_execution": "fixed-local-unittest-fixture",
                "database": "sqlite",
                "evaluation": "rule-conformance-not-model-effect",
                "deployment": "local-loopback-only",
            },
        }

class Handler(BaseHTTPRequestHandler):
    engine: Engine
    server_version = "TraceMasonDemo/0.1"

    def _json(self, status: int, payload: dict):
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _read_json(self):
        try:
            size = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise ApiError(400, "invalid_length", "Invalid Content-Length.")
        if not 0 < size <= MAX_BODY:
            raise ApiError(413, "invalid_size", "JSON body required, maximum 256 KiB.")
        try:
            data = json.loads(self.rfile.read(size))
        except (ValueError, UnicodeDecodeError):
            raise ApiError(400, "bad_json", "Invalid JSON body.")
        if not isinstance(data, dict):
            raise ApiError(400, "bad_json", "JSON object expected.")
        return data

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/api/state":
            self._json(200, self.engine.snapshot())
            return
        if path == "/api/health":
            self._json(200, {"status": "ok", "mode": "local-prototype", "time": now()})
            return
        if path == "/api/skills/download":
            skill = self.engine.get_skill()
            if not skill or skill["stage"] not in ("active", "rolled_back"):
                self._json(404, {"error": {"code":"skill_not_published"}})
                return
            raw = skill["body"].encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/markdown; charset=utf-8")
            self.send_header("Content-Disposition", 'attachment; filename="SKILL.md"')
            self.send_header("Content-Length", str(len(raw)))
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(raw)
            return
        files = {"/":("index.html","text/html; charset=utf-8"),
                 "/app.js":("app.js","application/javascript; charset=utf-8"),
                 "/app.css":("app.css","text/css; charset=utf-8")}
        if path not in files:
            self._json(404, {"error": {"code":"not_found"}})
            return
        file = CLIENT_ROOT / files[path][0]
        raw = file.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", files[path][1])
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy",
                         "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; object-src 'none'")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_POST(self):
        try:
            payload = self._read_json()
            path = self.path.split("?", 1)[0]
            if path == "/api/demo/run":
                self._json(201, self.engine.run_fixture(str(payload.get("scenario", ""))))
            elif path == "/api/skills/derive":
                self._json(200, self.engine.derive())
            elif path == "/api/skills/evaluate":
                self._json(200, self.engine.evaluate())
            elif path in ("/api/skills/approve", "/api/skills/publish", "/api/skills/rollback"):
                target = {"approve":"approved","publish":"active","rollback":"rolled_back"}[path.rsplit("/",1)[1]]
                self._json(200, self.engine.change_stage(target))
            elif path == "/api/claims/check":
                self._json(200, self.engine.gate(str(payload.get("run_id",""))))
            elif path == "/api/reset":
                self.engine.reset()
                self._json(200, {"status":"reset"})
            elif path == "/v1/chat/completions":
                status, response = self.engine.gateway(payload)
                self._json(status, response)
            else:
                self._json(404, {"error": {"code":"not_found"}})
        except ApiError as exc:
            self._json(exc.status, {"error":{"code":exc.code,"message":exc.message}})
        except Exception:
            # Unexpected exception details are deliberately not sent to the caller.
            self.log_error("Unhandled API exception")
            self._json(500, {"error":{"code":"internal_error","message":"Inspect local server logs."}})

def make_server(engine: Engine, host: str = "127.0.0.1", port: int = 8765) -> ThreadingHTTPServer:
    class BoundHandler(Handler):
        pass
    BoundHandler.engine = engine
    return ThreadingHTTPServer((host, port), BoundHandler)

def main():
    parser = argparse.ArgumentParser(description="Run a real local TraceMason evidence demo")
    parser.add_argument("--host", default="127.0.0.1",
                        help="Bind address (default: 127.0.0.1). Do not expose to the internet.")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA)
    args = parser.parse_args()
    if args.host not in ("127.0.0.1","localhost","::1"):
        parser.error("This unauthenticated demo only supports loopback. Use a reverse-proxy with auth in a future production service.")
    engine = Engine(args.data_dir)
    server = make_server(engine, args.host, args.port)
    print("TraceMason runnable demo: http://{}:{}/".format(args.host, server.server_port))
    print("Local SQLite: {}".format(engine.dbpath))
    print("Upstream: {}".format("configured" if os.getenv("TRACEMASON_UPSTREAM_URL") else "MOCK; no actual AI model called"))
    try:
        server.serve_forever(poll_interval=0.2)
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == "__main__":
    main()
