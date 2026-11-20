"""
Security guardrails & boundary regression test suite.
"""
import secrets
import unittest
from starlette.testclient import TestClient
from main import app


class TestSecurityGuards(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_extension_spoofing_rejected_http_415(self):
        """Verify binary magic-byte validator blocks fake image extensions (HTTP 415)."""
        fake_binary = b"PK\x03\x04\x14\x00\x00\x00\x08\x00fake_zip_archive_bytes"
        files = {"file": ("malicious_payload.jpg", fake_binary, "image/jpeg")}
        resp = self.client.post("/api/analyze/image", files=files)
        self.assertEqual(resp.status_code, 415)
        data = resp.json()
        self.assertEqual(data.get("status"), 415)
        self.assertIn("application/problem+json", resp.headers.get("content-type", ""))

    def test_oversize_payload_rejected_http_413(self):
        """Verify 25MB security guard blocks oversize payloads with HTTP 413."""
        oversize_bytes = b"0" * (26 * 1024 * 1024)
        files = {"file": ("oversize.jpg", oversize_bytes, "image/jpeg")}
        resp = self.client.post("/api/analyze/image", files=files)
        self.assertEqual(resp.status_code, 413)

    def test_security_response_headers_enforced(self):
        """Verify enterprise OWASP HTTP security headers are set on all responses."""
        resp = self.client.get("/health")
        self.assertEqual(resp.headers.get("x-content-type-options"), "nosniff")
        self.assertEqual(resp.headers.get("x-frame-options"), "DENY")
        self.assertIn("max-age=31536000", resp.headers.get("strict-transport-security", ""))
        
        csp = resp.headers.get("content-security-policy", "")
        self.assertIn("script-src 'self'", csp)
        script_parts = [p.strip() for p in csp.split(";") if p.strip().startswith("script-src")]
        self.assertTrue(len(script_parts) > 0)
        self.assertNotIn("'unsafe-eval'", script_parts[0])
        self.assertNotIn("'unsafe-inline'", script_parts[0])

    def test_constant_time_comparison(self):
        """Verify secrets.compare_digest operates correctly for authentication keys."""
        correct_key = "FORENSIQ_SECRET_KEY_2026"
        attacker_key = "FORENSIQ_SECRET_KEY_FAIL"
        self.assertTrue(secrets.compare_digest(correct_key, correct_key))
        self.assertFalse(secrets.compare_digest(attacker_key, correct_key))

    def test_gzip_compression_active(self):
        """Verify responses over 1000 bytes accept and return gzip compression."""
        headers = {"Accept-Encoding": "gzip"}
        resp = self.client.get("/api/threat-intel", headers=headers)
        self.assertEqual(resp.status_code, 200)
        self.assertIn("gzip", resp.headers.get("content-encoding", ""))


if __name__ == "__main__":
    unittest.main()
