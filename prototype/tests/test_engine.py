"""End-to-end tests of the runnable TraceMason prototype.

No external model, provider or test runner dependency is needed.
"""
from __future__ import annotations

import json
import os
import sqlite3
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from tracemason import Engine, ApiError, make_server, evidence_gate, naive_completion


class DomainTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.engine = Engine(Path(self.temp.name))

    def tearDown(self):
        self.temp.cleanup()

    def test_executed_fixtures_have_independent_results(self):
        failed = self.engine.run_fixture("failed")
        passed = self.engine.run_fixture("passed")
        self.assertEqual(failed["verification"], "failed")
        self.assertGreater(failed["tests_failed"], 0)
        self.assertIn("FAILED", failed["test_output"])
        self.assertEqual(passed["verification"], "passed")
        self.assertEqual(passed["tests_failed"], 0)
        self.assertGreater(passed["tests_passed"], 0)
        self.assertIn("OK", passed["test_output"])
        self.assertEqual(len(failed["evidence_digest"]), 64)
        self.assertNotEqual(failed["evidence_digest"], passed["evidence_digest"])

    def test_end_to_end_evidence_to_gate_and_rollback(self):
        with self.assertRaises(ApiError) as before:
            self.engine.derive()
        self.assertEqual(before.exception.code, "insufficient_evidence")

        failed = self.engine.run_fixture("failed")
        self.assertEqual(self.engine.gate(failed["id"])["decision"], "accept")
        self.assertFalse(self.engine.gate(failed["id"])["gate_active"])

        skill = self.engine.derive()
        self.assertEqual(skill["stage"], "candidate")
        self.assertEqual(skill["evidence_ids"], [failed["id"]])
        self.assertIn("name: verified-code-delivery", skill["body"])

        with self.assertRaises(ApiError) as premature:
            self.engine.change_stage("approved")
        self.assertEqual(premature.exception.code, "invalid_transition")

        with self.assertRaises(ApiError) as no_positive:
            self.engine.evaluate()
        self.assertEqual(no_positive.exception.code, "missing_positive_control")

        good = self.engine.run_fixture("passed")
        report = self.engine.evaluate()
        self.assertEqual(report["candidate_correct"], report["total"])
        self.assertLess(report["baseline_correct"], report["candidate_correct"])
        self.assertTrue(report["passes_gate"])
        self.assertGreaterEqual(report["executed_fixture_count"], 2)

        self.assertEqual(self.engine.change_stage("approved")["stage"], "approved")
        exported = self.engine.change_stage("active")
        self.assertEqual(exported["stage"], "active")
        skill_file = Path(self.temp.name) / "skills" / "verified-code-delivery" / "SKILL.md"
        self.assertTrue(skill_file.is_file())
        self.assertEqual(skill_file.read_text(encoding="utf-8"), exported["body"])

        self.assertEqual(self.engine.gate(failed["id"])["decision"], "reject")
        self.assertEqual(self.engine.gate(good["id"])["decision"], "accept")
        self.assertEqual(self.engine.snapshot()["capabilities"]["database"], "sqlite")

        reopened = Engine(Path(self.temp.name))
        self.assertEqual(reopened.get_skill()["stage"], "active")
        self.assertEqual(reopened.gate(failed["id"])["decision"], "reject")

        self.assertEqual(self.engine.change_stage("rolled_back")["stage"], "rolled_back")
        self.assertFalse(skill_file.exists())
        self.assertEqual(self.engine.gate(failed["id"])["decision"], "accept")
        self.assertFalse(self.engine.gate(failed["id"])["gate_active"])

        self.engine.reset()
        self.assertIsNone(self.engine.get_skill())
        self.assertEqual(self.engine.snapshot()["runs"], [])

    def test_rule_conformance(self):
        self.assertEqual(naive_completion(True, "failed"), "accept")
        self.assertEqual(evidence_gate(True, "failed"), "reject")
        self.assertEqual(evidence_gate(True, "missing"), "reject")
        self.assertEqual(evidence_gate(True, "passed"), "accept")
        self.assertEqual(evidence_gate(False, "passed"), "no-claim")

    def test_gateway_audits_without_storing_raw_prompt(self):
        with patch.dict(os.environ, {"TRACEMASON_UPSTREAM_URL": ""}, clear=False):
            status, mock = self.engine.gateway({
                "model": "test-model", "messages":[{"role":"user","content":"hello"}]
            })
            self.assertEqual(status, 200)
            self.assertTrue(mock["tracemason"]["not_real_inference"])
            with self.assertRaises(ApiError) as blocked:
                self.engine.gateway({
                    "model":"test-model",
                    "messages":[{"role":"user","content":"api_key=sk-demo-1234567890"}]
                })
            self.assertEqual(blocked.exception.status, 403)
        calls = self.engine.snapshot()["gateway_calls"]
        self.assertEqual(len(calls), 2)
        self.assertIn("blocked", [c["status"] for c in calls])
        dbpath = Path(self.temp.name)/"tracemason.sqlite3"
        with sqlite3.connect(dbpath) as db:
            raw = "\n".join(str(v) for row in db.execute("SELECT * FROM gateway_calls")
                            for v in row)
        self.assertNotIn("sk-demo-1234567890",raw)

    def test_bad_fixture_and_invalid_transitions(self):
        with self.assertRaises(ApiError):
            self.engine.run_fixture("../../../etc")
        with self.assertRaises(ApiError):
            self.engine.change_stage("active")


class HttpApiTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        engine = Engine(Path(self.temp.name))
        self.server = make_server(engine, port=0)
        self.thread = threading.Thread(target=self.server.serve_forever,
                                       kwargs={"poll_interval":0.05}, daemon=True)
        self.thread.start()
        self.base = "http://127.0.0.1:{}".format(self.server.server_port)

    def tearDown(self):
        self.server.shutdown()
        self.thread.join(timeout=2)
        self.server.server_close()
        self.temp.cleanup()

    def call(self, method, path, data=None):
        headers={}
        if data is not None:
            body=json.dumps(data).encode()
            headers["Content-Type"]="application/json"
        else:
            body=None
        request=Request(self.base+path,method=method,data=body,headers=headers)
        with urlopen(request, timeout=8) as res:
            raw=res.read()
            if res.headers.get("Content-Type","").startswith("application/json"):
                return res.status, json.loads(raw)
            return res.status, raw

    def test_http_workflow(self):
        status, data=self.call("GET","/api/health")
        self.assertEqual(status,200)
        self.assertEqual(data["status"],"ok")

        status, run=self.call("POST","/api/demo/run",{"scenario":"failed"})
        self.assertEqual(status,201)
        self.assertEqual(run["verification"],"failed")
        status, good=self.call("POST","/api/demo/run",{"scenario":"passed"})
        self.assertEqual(good["verification"],"passed")

        status, c=self.call("POST","/api/skills/derive",{})
        self.assertEqual(c["stage"],"candidate")
        status, report=self.call("POST","/api/skills/evaluate",{})
        self.assertTrue(report["passes_gate"])
        self.call("POST","/api/skills/approve",{})
        self.call("POST","/api/skills/publish",{})
        status, decision=self.call("POST","/api/claims/check",{"run_id":run["id"]})
        self.assertEqual(decision["decision"],"reject")
        self.assertTrue(decision["gate_active"])

        status, skill=self.call("GET","/api/skills/download")
        self.assertIn(b"name: verified-code-delivery",skill)
        self.call("POST","/api/skills/rollback",{})
        status, decision=self.call("POST","/api/claims/check",{"run_id":run["id"]})
        self.assertEqual(decision["decision"],"accept")

        status, home=self.call("GET","/")
        self.assertIn(b"From evidence to a",home)
        status, script=self.call("GET","/app.js")
        self.assertIn(b"/api/skills/evaluate",script)

    def test_gateway_and_security_errors(self):
        status, result=self.call("POST","/v1/chat/completions",
                                {"model":"fixture","messages":[{"role":"user","content":"hi"}]})
        self.assertEqual(status,200)
        self.assertTrue(result["tracemason"]["not_real_inference"])
        request=Request(
            self.base+"/v1/chat/completions",method="POST",
            data=json.dumps({"model":"fixture","messages":[
                {"role":"user","content":"password=not-a-real-secret"}]}).encode(),
            headers={"Content-Type":"application/json"}
        )
        with self.assertRaises(HTTPError) as err:
            urlopen(request,timeout=8)
        self.assertEqual(err.exception.code,403)
        with self.assertRaises(HTTPError) as missing:
            self.call("POST","/v1/chat/completions",{"model":"fixture","stream":True,"messages":[]})
        self.assertEqual(missing.exception.code,400)
        status,state=self.call("GET","/api/state")
        self.assertGreaterEqual(len(state["gateway_calls"]),2)
        self.assertNotIn("not-a-real-secret",json.dumps(state))


if __name__ == "__main__":
    unittest.main()
