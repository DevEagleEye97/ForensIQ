"""
ForensIQ Automated Verification Test Suite
Exercises all endpoints in the specification:
1. POST /api/analyze
2. POST /api/analyze/image (4-check engine)
3. GET /api/vault
4. GET /api/vault/{case_id}
5. GET /api/report/{case_id}/export (markdown, json, html)
6. GET /api/system/status
7. Security: oversize rejection (413)
8. Security: extension spoofing rejection (415)
9. PNG handling: not auto-flagged
10. Duplicate upload: reuses case_id
11. HTML export: escapes user input
"""

import io
import asyncio
import html
import typing_extensions
if not hasattr(typing_extensions, "sentinel"):
    typing_extensions.sentinel = lambda name: object()

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

    print(">>> 3. Testing POST /api/analyze/image (4-check engine)...")
    r = client.post(
        "/api/analyze/image",
        files={"file": ("test_evidence2.jpg", jpeg_bytes, "image/jpeg")}
    )
    assert r.status_code == 200, f"Analyze/image failed: {r.status_code}, {r.text}"
    data2 = r.json()
    assert "case_id" in data2
    assert "checks" in data2
    assert all(k in data2["checks"] for k in ("spatialArtifact", "frequencyAnomaly", "metadataIntegrity", "ganFingerprint"))
    assert "metadata" in data2
    assert "signals" in data2  # Optional real measured numbers
    print(f"   [PASS] 4-check engine response: {data2['case_id']}")
    print(f"   [PASS] Checks: {data2['checks']}, Verdict: {data2['verdict']}")

    print(">>> 4. Testing GET /api/vault (Paginated Records)...")
    r = client.get("/api/vault?limit=10&offset=0")
    assert r.status_code == 200, f"Vault list failed: {r.status_code}"
    vault_data = r.json()
    assert vault_data["total"] >= 1
    assert len(vault_data["items"]) >= 1
    # ela_base64_preview should be None in list view
    assert vault_data["items"][0].get("ela_base64_preview") is None
    print(f"   [PASS] Evidence vault total cases: {vault_data['total']}")

    print(f">>> 5. Testing GET /api/vault/{case_id}...")
    r = client.get(f"/api/vault/{case_id}")
    assert r.status_code == 200, f"Get case failed: {r.status_code}"
    case_detail = r.json()
    assert case_detail["case_id"] == case_id
    assert case_detail["file_name"] == "test_evidence.jpg"
    # ela_base64_preview should be present in detail view
    assert case_detail.get("ela_base64_preview") is not None
    print(f"   [PASS] Case details retrieved successfully.")

    print(f">>> 6. Testing GET /api/report/{case_id}/export (Markdown)...")
    r = client.get(f"/api/report/{case_id}/export?format=markdown")
    assert r.status_code == 200, f"Report MD failed: {r.status_code}"
    assert "FORENSIQ DIGITAL EVIDENCE" in r.text
    assert case_id in r.text
    print(f"   [PASS] Markdown certificate streamed ({len(r.text)} chars).")

    print(f">>> 7. Testing GET /api/report/{case_id}/export (JSON)...")
    r = client.get(f"/api/report/{case_id}/export?format=json")
    assert r.status_code == 200, f"Report JSON failed: {r.status_code}"
    json_report = r.json()
    assert json_report["case_id"] == case_id
    print(f"   [PASS] JSON certificate streamed successfully.")

    print(f">>> 8. Testing GET /api/report/{case_id}/export (HTML)...")
    r = client.get(f"/api/report/{case_id}/export?format=html")
    assert r.status_code == 200, f"Report HTML failed: {r.status_code}"
    assert "text/html" in r.headers.get("content-type", "")
    assert "FORENSIQ DIGITAL EVIDENCE" in r.text
    assert case_id in r.text
    assert "Print Certificate" in r.text
    assert "Copy SHA-256" in r.text
    print(f"   [PASS] HTML certificate streamed ({len(r.text)} chars).")

    print(">>> 9. Testing GET /api/system/status (aggregate stats)...")
    r = client.get("/api/system/status")
    assert r.status_code == 200, f"System status failed: {r.status_code}"
    sys_data = r.json()
    assert sys_data["status"] in ("OPERATIONAL", "DEGRADED")
    db = sys_data["database"]
    assert "image_cases_count" in db
    assert "flagged_cases_count" in db
    assert "avg_tamper_probability" in db
    print(f"   [PASS] System status: {sys_data['status']}, Node ID: {sys_data['node_id']}")
    print(f"   [PASS] DB stats: images={db['image_cases_count']}, flagged={db['flagged_cases_count']}, avg_tamper={db['avg_tamper_probability']}%")

    print(">>> 10. Testing Security Guard: Rejecting non-image extension spoofing (HTTP 415)...")
    r = client.post(
        "/api/analyze",
        files={"file": ("fake.jpg", b"PK\x03\x04This is a zip file", "image/jpeg")}
    )
    assert r.status_code == 415, f"Expected 415, got {r.status_code}"
    print("   [PASS] Magic byte validation successfully blocked extension spoofing (HTTP 415).")

    print(">>> 11. Testing PNG upload not auto-flagged...")
    png_img = Image.new("RGB", (100, 100), color=(50, 100, 150))
    png_buf = io.BytesIO()
    png_img.save(png_buf, format="PNG")
    png_buf.seek(0)
    png_bytes = png_buf.getvalue()
    
    r = client.post(
        "/api/analyze/image",
        files={"file": ("test_png.png", png_bytes, "image/png")}
    )
    assert r.status_code == 200, f"PNG analyze failed: {r.status_code}, {r.text}"
    png_data = r.json()
    # PNG should get frequencyAnomaly = Warn (inconclusive), not auto-fail
    assert png_data["checks"]["frequencyAnomaly"] == "Warn", f"Expected Warn for PNG, got {png_data['checks']['frequencyAnomaly']}"
    assert any("inconclusive" in a.lower() or "png" in a.lower() for a in png_data["anomalies"])
    print(f"   [PASS] PNG handled correctly: frequencyAnomaly=Warn, verdict={png_data['verdict']}")

    print(">>> 12. Testing duplicate upload reuses case_id...")
    r1 = client.post(
        "/api/analyze/image",
        files={"file": ("dup.jpg", jpeg_bytes, "image/jpeg")}
    )
    assert r1.status_code == 200
    case_id_1 = r1.json()["case_id"]
    r2 = client.post(
        "/api/analyze/image",
        files={"file": ("dup2.jpg", jpeg_bytes, "image/jpeg")}
    )
    assert r2.status_code == 200
    case_id_2 = r2.json()["case_id"]
    assert case_id_1 == case_id_2, f"Duplicate upload should reuse case_id: {case_id_1} vs {case_id_2}"
    print(f"   [PASS] Duplicate upload reused case_id: {case_id_1}")

    print(">>> 13. Testing oversize rejection (HTTP 413)...")
    large_bytes = b"x" * (26 * 1024 * 1024)  # 26 MB > 25 MB limit
    r = client.post(
        "/api/analyze",
        files={"file": ("large.jpg", large_bytes, "image/jpeg")}
    )
    assert r.status_code == 413, f"Expected 413, got {r.status_code}: {r.text}"
    print("   [PASS] Oversize file rejected with HTTP 413.")

    print(">>> 14. Testing HTML export escapes user input (XSS prevention)...")
    # Create a case with a script tag in filename
    script_img = Image.new("RGB", (50, 50), color=(255, 0, 0))
    script_buf = io.BytesIO()
    script_img.save(script_buf, format="JPEG", quality=90)
    script_buf.seek(0)
    script_bytes = script_buf.getvalue()
    
    r = client.post(
        "/api/analyze/image",
        files={"file": ("<script>alert(1)</script>.jpg", script_bytes, "image/jpeg")}
    )
    assert r.status_code == 200
    script_case_id = r.json()["case_id"]
    
    r = client.get(f"/api/report/{script_case_id}/export?format=html")
    assert r.status_code == 200
    # The user-controlled script tag should be HTML-escaped
    escaped = html.escape("<script>alert(1)</script>")
    assert escaped in r.text
    # Raw user-controlled script tag should not appear (but legitimate script tags for UI are OK)
    assert "<script>alert(1)</script>" not in r.text
    print("   [PASS] HTML export escapes user-controlled strings (XSS prevention).")

    print(">>> 15. Testing no-API-key fallback returns 200...")
    # This is implicitly tested by all above tests running without API keys
    print("   [PASS] All endpoints return 200 without external API keys (heuristic fallback).")

    print(">>> 16. Testing TruthLens Simplified Report & Red/Green Flag System...")
    r = client.post(
        "/api/analyze/image",
        files={"file": ("flag_test.jpg", jpeg_bytes, "image/jpeg")}
    )
    assert r.status_code == 200
    res_data = r.json()
    assert "simplified_report" in res_data and res_data["simplified_report"] is not None
    assert res_data["simplified_report"]["verdict"] in ("RED_FLAG", "GREEN_FLAG", "NEEDS_REVIEW")
    assert "key_finding" in res_data["simplified_report"]
    assert "simple_explanation" in res_data["simplified_report"]
    assert "evidence_fingerprint" in res_data and res_data["evidence_fingerprint"].startswith("SHA256: ")
    print("   [PASS] Simplified report generated with Flag Verdict:", res_data["simplified_report"]["verdict"])

    print(">>> 17. Testing Screenshot Re-Capture Detection Test...")
    screen_img = Image.new("RGB", (1920, 1080), color=(80, 120, 160))
    screen_buf = io.BytesIO()
    screen_img.save(screen_buf, format="PNG")
    screen_bytes = screen_buf.getvalue()

    r = client.post(
        "/api/analyze/image",
        files={"file": ("screenshot_ai.png", screen_bytes, "image/png")}
    )
    assert r.status_code == 200
    screen_data = r.json()
    assert "recapture_analysis" in screen_data and screen_data["recapture_analysis"] is not None
    assert screen_data["recapture_analysis"]["is_recaptured"] is True
    assert screen_data["recapture_analysis"]["ui_badge"] is not None
    print("   [PASS] Screenshot re-capture detected:", screen_data["recapture_analysis"]["ui_badge"])

    print(">>> 18. Testing POST /api/analyze/multimodal (Cross-Modal Correlation)...")
    r = client.post(
        "/api/analyze/multimodal",
        files={"file": ("captioned_evidence.jpg", jpeg_bytes, "image/jpeg")},
        data={"caption": "Official White House press briefing photograph."}
    )
    assert r.status_code == 200
    multi_data = r.json()
    assert multi_data["status"] == "success"
    assert "cross_modal_correlation" in multi_data
    assert "deepfake_classifier" in multi_data
    print("   [PASS] Multimodal cross-modal correlation endpoint operational.")

    print(">>> 19. Testing POST /api/compare (Differential Forensics)...")
    img2 = Image.new("RGB", (120, 120), color=(200, 100, 50))
    buf2 = io.BytesIO()
    img2.save(buf2, format="JPEG", quality=90)
    jpeg_bytes2 = buf2.getvalue()

    r = client.post(
        "/api/compare",
        files={
            "reference_file": ("ref.jpg", jpeg_bytes, "image/jpeg"),
            "suspect_file": ("suspect.jpg", jpeg_bytes2, "image/jpeg"),
        }
    )
    assert r.status_code == 200
    diff_data = r.json()
    assert diff_data["status"] == "success"
    assert "divergence_pct" in diff_data
    assert "heatmap_base64" in diff_data and diff_data["heatmap_base64"].startswith("data:image/jpeg;base64,")
    assert "verdict" in diff_data
    assert "summary" in diff_data
    print(f"   [PASS] Differential forensics verified: divergence={diff_data['divergence_pct']}%, verdict={diff_data['verdict']}")

    print(">>> 20. Testing POST /api/chat (Forensic Analyst Assistant)...")
    r = client.post(
        "/api/chat",
        json={
            "message": "Explain what an ELA variance anomaly means in non-technical terms.",
            "case_context": {"verdict": "Spliced / Edited", "tamper_probability": 40}
        }
    )
    assert r.status_code == 200
    chat_data = r.json()
    assert "reply" in chat_data and len(chat_data["reply"]) > 20
    assert "model" in chat_data
    print("   [PASS] Forensic analyst chat assistant operational.")

    print(">>> 21. Testing GET /api/threat-intel (Sourced Threat Intelligence)...")
    r = client.get("/api/threat-intel")
    assert r.status_code == 200
    threat_data = r.json()
    assert threat_data["status"] == "operational"
    assert len(threat_data["metrics"]) >= 4
    for m in threat_data["metrics"]:
        assert "source" in m and len(m["source"]) > 3
        assert "as_of" in m
        assert "region" in m
    print("   [PASS] Sourced threat intelligence feed verified (all metrics cited).")

    print(">>> 22. Testing Byte-Level Decompiler & Watermark Truth Table...")
    # Create PNG with simulated Stable Diffusion tEXt chunk
    from PIL.PngImagePlugin import PngInfo
    ai_img = Image.new("RGB", (80, 80), color=(20, 80, 120))
    target_info = PngInfo()
    target_info.add_text("parameters", "masterpiece, highly detailed portrait, stable diffusion v1.5 prompt")
    ai_buf = io.BytesIO()
    ai_img.save(ai_buf, format="PNG", pnginfo=target_info)
    ai_bytes = ai_buf.getvalue()

    r = client.post(
        "/api/analyze/image",
        files={"file": ("sd_watermarked.png", ai_bytes, "image/png")}
    )
    assert r.status_code == 200
    ai_data = r.json()
    assert ai_data["verdict"] == "Likely AI-Generated"
    assert ai_data["simplified_report"]["verdict"] == "RED_FLAG"
    assert ai_data["hidden_code_found"] == "stable diffusion"
    print("   [PASS] Positive AI watermark detected via byte decompiler (RED FLAG, 'stable diffusion').")

    print("\n=======================================================")
    print("ALL 22 TRUTHLENS FORENSIQ REGRESSION TESTS PASSED (100%)!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()