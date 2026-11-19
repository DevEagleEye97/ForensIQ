"""
ForensIQ Automated Verification Test Suite
Exercises all 5 endpoints in the specification:
1. POST /api/analyze
2. GET /api/vault
3. GET /api/vault/{case_id}
4. GET /api/report/{case_id}/export
5. GET /api/system/status
"""

import io
import asyncio
from PIL import Image
from starlette.testclient import TestClient
from main import app
from database import init_db

def run_tests():
    # Initialize DB synchronously for testing
    asyncio.run(init_db())
    
    client = TestClient(app)

    print(">>> 1. Testing GET /health...")
    r = client.get("/health")
    assert r.status_code == 200, f"Health failed: {r.status_code}"
    print("   [PASS] Health check:", r.json()["status"])

    print(">>> 2. Testing POST /api/analyze (Valid JPEG)...")
    img = Image.new("RGB", (120, 120), color=(140, 45, 80))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    buf.seek(0)
    jpeg_bytes = buf.getvalue()

    r = client.post(
        "/api/analyze",
        files={"file": ("test_evidence.jpg", jpeg_bytes, "image/jpeg")}
    )
    assert r.status_code == 200, f"Analyze failed: {r.status_code}, {r.text}"
    data = r.json()
    assert "hash" in data and data["hash"].startswith("SHA256: ")
    assert "tamperProbability" in data
    assert "verdict" in data
    assert "classificationModel" in data
    assert "exifData" in data
    assert "anomalies" in data and len(data["anomalies"]) > 0
    assert "elaBase64" in data and data["elaBase64"].startswith("data:image/jpeg;base64,")
    case_id = data.get("case_id")
    print(f"   [PASS] Case generated: {case_id}")
    print(f"   [PASS] Verdict: {data['verdict']}, Tamper Probability: {data['tamperProbability']}%")

    print(">>> 3. Testing GET /api/vault (Paginated Records)...")
    r = client.get("/api/vault?limit=10&offset=0")
    assert r.status_code == 200, f"Vault list failed: {r.status_code}"
    vault_data = r.json()
    assert vault_data["total"] >= 1
    assert len(vault_data["items"]) >= 1
    print(f"   [PASS] Evidence vault total cases: {vault_data['total']}")

    print(f">>> 4. Testing GET /api/vault/{case_id}...")
    r = client.get(f"/api/vault/{case_id}")
    assert r.status_code == 200, f"Get case failed: {r.status_code}"
    case_detail = r.json()
    assert case_detail["case_id"] == case_id
    assert case_detail["file_name"] == "test_evidence.jpg"
    print(f"   [PASS] Case details retrieved successfully.")

    print(f">>> 5. Testing GET /api/report/{case_id}/export (Markdown)...")
    r = client.get(f"/api/report/{case_id}/export?format=markdown")
    assert r.status_code == 200, f"Report MD failed: {r.status_code}"
    assert "FORENSIQ DIGITAL EVIDENCE" in r.text
    assert case_id in r.text
    print(f"   [PASS] Markdown certificate streamed ({len(r.text)} chars).")

    print(f">>> 6. Testing GET /api/report/{case_id}/export (JSON)...")
    r = client.get(f"/api/report/{case_id}/export?format=json")
    assert r.status_code == 200, f"Report JSON failed: {r.status_code}"
    json_report = r.json()
    assert json_report["case_id"] == case_id
    print(f"   [PASS] JSON certificate streamed successfully.")

    print(">>> 7. Testing GET /api/system/status...")
    r = client.get("/api/system/status")
    assert r.status_code == 200, f"System status failed: {r.status_code}"
    sys_data = r.json()
    assert sys_data["status"] in ("OPERATIONAL", "DEGRADED")
    print(f"   [PASS] System status: {sys_data['status']}, Node ID: {sys_data['node_id']}")

    print(">>> 8. Testing Security Guard: Rejecting non-image extension spoofing (HTTP 415)...")
    r = client.post(
        "/api/analyze",
        files={"file": ("fake.jpg", b"PK\x03\x04This is a zip file", "image/jpeg")}
    )
    assert r.status_code == 415, f"Expected 415, got {r.status_code}"
    print("   [PASS] Magic byte validation successfully blocked extension spoofing (HTTP 415).")

    print("\n=======================================================")
    print("ALL 8 FORENSIQ INDUSTRIAL ENDPOINT TESTS PASSED WITH 100% SUCCESS!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
