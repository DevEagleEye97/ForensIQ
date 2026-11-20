"""
Unit and integration tests for ForensIQ API endpoints.
Runs with standard python -m unittest discover tests.
"""
import io
import unittest
from PIL import Image
from starlette.testclient import TestClient
from main import app


class TestApiEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

        # Generate standard synthetic JPEG for tests
        img = Image.new("RGB", (128, 128), color=(25, 45, 80))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        cls.jpeg_bytes = buf.getvalue()

    def test_health_check(self):
        """Verify GET /health reports OPERATIONAL status."""
        resp = self.client.get("/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("status"), "OPERATIONAL")
        self.assertIn("service", data)

    def test_system_status(self):
        """Verify GET /api/system/status returns system health and metrics."""
        resp = self.client.get("/api/system/status")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("status"), "OPERATIONAL")
        self.assertIn("node_id", data)

    def test_vault_list(self):
        """Verify GET /api/vault returns evidence records."""
        resp = self.client.get("/api/vault?limit=5")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(isinstance(data, list) or "items" in data or "records" in data or "cases" in data)

    def test_analyze_image_endpoint(self):
        """Verify POST /api/analyze/image processes JPEG and returns 4-check consensus."""
        files = {"file": ("sample.jpg", self.jpeg_bytes, "image/jpeg")}
        resp = self.client.post("/api/analyze/image", files=files)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("case_id", data)
        self.assertIn("checks", data)
        self.assertIn("verdict", data)
        self.assertTrue("tamperProbability" in data or "tamper_probability" in data)

    def test_threat_intel_endpoint(self):
        """Verify GET /api/threat-intel returns threat intelligence feed."""
        resp = self.client.get("/api/threat-intel")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue("metrics" in data or "threat_metrics" in data)

    def test_differential_compare_endpoint(self):
        """Verify POST /api/compare performs differential pixel and ELA comparison."""
        files = {
            "reference_file": ("ref.jpg", self.jpeg_bytes, "image/jpeg"),
            "suspect_file": ("sus.jpg", self.jpeg_bytes, "image/jpeg"),
        }
        resp = self.client.post("/api/compare", files=files)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue("divergence_pct" in data or "divergence_score" in data)
        self.assertIn("verdict", data)

    def test_chat_analyst_endpoint(self):
        """Verify POST /api/chat responds to forensic inquiries."""
        resp = self.client.post("/api/chat", json={"message": "Explain Error Level Analysis."})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue("reply" in data or "response" in data)


if __name__ == "__main__":
    unittest.main()
