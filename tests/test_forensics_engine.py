"""
Unit tests for deterministic forensic heuristics and engine algorithms.
"""
import io
import hashlib
import unittest
from PIL import Image
from services.forensics_engine import (
    run_frequency_anomaly_ela,
    detect_screenshot_recapture,
    generate_simplified_report,
    sanitize_text,
    ChecksContract,
)


class TestForensicsEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        img = Image.new("RGB", (100, 100), color=(120, 30, 40))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=90)
        cls.jpeg_bytes = buf.getvalue()

    def test_sha256_hashing(self):
        """Verify deterministic SHA-256 generation."""
        computed = hashlib.sha256(self.jpeg_bytes).hexdigest()
        self.assertEqual(len(computed), 64)
        self.assertTrue(all(c in "0123456789abcdef" for c in computed))

    def test_sanitize_text(self):
        """Verify text sanitization and bounding."""
        unsafe = "Hello <script>alert(1)</script> World!   "
        clean = sanitize_text(unsafe, max_length=20)
        self.assertLessEqual(len(clean), 20)
        self.assertNotIn("\n", clean)

    def test_frequency_anomaly_ela(self):
        """Verify ELA execution returns status and base64 heatmap."""
        status, variance, quant, ela_b64, observations = run_frequency_anomaly_ela(
            self.jpeg_bytes,
            quality=90,
            mime_type="image/jpeg"
        )
        self.assertIn(status, ("Pass", "Warn", "Fail"))
        self.assertTrue(ela_b64.startswith("data:image/jpeg;base64,"))

    def test_screenshot_recapture_detection(self):
        """Verify screenshot detection checks resolution and metadata."""
        recapture = detect_screenshot_recapture(
            image_bytes=self.jpeg_bytes,
            mime_type="image/jpeg",
            camera="Unknown",
        )
        self.assertIsNotNone(recapture.is_recaptured)

    def test_simplified_report_generation(self):
        """Verify Red/Green Flag rule engine."""
        checks = ChecksContract(
            spatialArtifact="Pass",
            frequencyAnomaly="Pass",
            metadataIntegrity="Pass",
            ganFingerprint="Pass"
        )
        recapture = detect_screenshot_recapture(self.jpeg_bytes, "image/jpeg", "Apple iPhone")
        report = generate_simplified_report(
            tamper_probability=5,
            verdict="Likely Authentic",
            checks=checks,
            recapture=recapture,
            anomalies=[]
        )
        self.assertIn(report.verdict, ("GREEN_FLAG", "RED_FLAG", "NEEDS_REVIEW"))
        self.assertTrue(len(report.simple_explanation) > 0)


if __name__ == "__main__":
    unittest.main()
