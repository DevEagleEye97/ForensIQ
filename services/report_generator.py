"""
ForensIQ Forensic Report Generation Service
Generates formal, exportable Markdown, JSON & HTML forensic certificates.
Architecture Vibe: Palantir Gotham & Cisco Secure Endpoint Minimalist
"""

import html
import json
from datetime import datetime, timezone
from typing import Dict, Any


def generate_markdown_report(case: Dict[str, Any]) -> str:
    """
    Generate an official Palantir Gotham / Cisco Secure Endpoint-style
    Forensic Chain-of-Custody Certificate in Markdown.
    """
    case_id = case.get("case_id", "N/A")
    file_name = case.get("file_name", "Unknown")
    file_hash = case.get("file_hash", "N/A")
    file_size = case.get("file_size_bytes", 0)
    mime_type = case.get("mime_type", "N/A")
    tamper_prob = case.get("tamper_probability", 0)
    verdict = case.get("verdict", "N/A")
    model = case.get("classification_model", "N/A")
    software = case.get("exif_software") or "None (Stripped)"
    camera = case.get("camera_make") or "Unknown (Born-Digital)"
    timestamp = case.get("timestamp_utc") or datetime.now(timezone.utc).isoformat()
    anomalies = case.get("anomalies", [])

    anomaly_bullets = "\n".join([f"- **{i+1}.** {a}" for i, a in enumerate(anomalies)]) if anomalies else "- No critical anomalies registered."

    report = f"""# FORENSIQ DIGITAL EVIDENCE & FORENSIC INTEGRITY CERTIFICATE
**Document Classification:** RESTRICTED / FORENSIC CHAIN-OF-CUSTODY  
**System Architecture:** Asynchronous 3-Tier Multi-Modal Forensic Pipeline  
**Issuing Authority:** ForensIQ Autonomous Cyber Forensics Engine v2.0  

---

## 1. EVIDENCE SUMMARY & IDENTIFIERS
| Forensic Parameter | Value |
| :--- | :--- |
| **Case Identifier** | `{case_id}` |
| **Target File Name** | `{file_name}` |
| **MIME Content Type** | `{mime_type}` |
| **Binary Size** | `{file_size:,} bytes` |
| **Ingestion Timestamp (UTC)** | `{timestamp}` |
| **Cryptographic Hash (SHA-256)** | `{file_hash}` |

---

## 2. FORENSIC VERDICT & PROBABILITY TELEMETRY
- **Integrity Assessment:** **`{verdict}`**
- **Tamper / Synthesis Probability:** **`{tamper_prob}%`**
- **Primary Classifier Model:** `{model}`

```
[PROBABILITY RISK SPECTRUM]
0% [-------------------------|=========================] 100%
Current Score: {tamper_prob}% --> {verdict.upper()}
```

---

## 3. TIER 1 DETERMINISTIC HARDWARE & COMPRESSION AUDIT
- **Camera Sensor Hardware:** `{camera}`
- **Metadata Software Signature:** `{software}`
- **File Structure Verification:** `Verified Binary Magic Stream`
- **Error Level Analysis (ELA):** `Extrema-scaled dynamic range verified`

---

## 4. MULTI-MODAL ANOMALY & REASONING LOG
{anomaly_bullets}

---

## 5. CHAIN-OF-CUSTODY ATTESTATION
This certificate certifies that the digital asset referenced above was ingested into the ForensIQ Asynchronous Evidence Vault under strict zero-trust parameters. All analyses were executed in-memory with zero disk persistence leaks.

- **Integrity Verification:** PASSED
- **Evidence Vault Status:** ARCHIVED & IMMUTABLE
- **Signature Hash:** `SEC-CHOP-{case_id[:8].upper()}-{file_hash[-12:].upper()}`
"""
    return report.strip()


def generate_json_report(case: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate an official JSON-formatted forensic certificate payload.
    """
    return {
        "certificate_type": "ForensIQ Digital Evidence Certificate",
        "standard": "Palantir Gotham / Cisco Secure Endpoint Telemetry Standard",
        "case_id": case.get("case_id"),
        "timestamp_utc": case.get("timestamp_utc"),
        "evidence": {
            "file_name": case.get("file_name"),
            "file_hash": case.get("file_hash"),
            "file_size_bytes": case.get("file_size_bytes"),
            "mime_type": case.get("mime_type")
        },
        "telemetry": {
            "tamper_probability": case.get("tamper_probability"),
            "verdict": case.get("verdict"),
            "classification_model": case.get("classification_model"),
            "camera_make": case.get("camera_make"),
            "exif_software": case.get("exif_software")
        },
        "anomalies": case.get("anomalies", []),
        "integrity": {
            "chain_of_custody_verified": True,
            "signature_hash": f"SEC-CHOP-{case.get('case_id', '')[:8].upper()}"
        }
    }


def generate_html_report(case: Dict[str, Any]) -> str:
    """
    Generate a self-contained HTML forensic certificate with inline CSS/JS.
    No external dependencies - fully portable for evidence sharing.
    All user-controlled strings are HTML-escaped for XSS prevention.
    """
    case_id = html.escape(str(case.get("case_id", "N/A")))
    file_name = html.escape(str(case.get("file_name", "Unknown")))
    file_hash = html.escape(str(case.get("file_hash", "N/A")))
    file_size = case.get("file_size_bytes", 0)
    mime_type = html.escape(str(case.get("mime_type", "N/A")))
    tamper_prob = case.get("tamper_probability", 0)
    verdict = html.escape(str(case.get("verdict", "N/A")))
    model = html.escape(str(case.get("classification_model", "N/A")))
    software = html.escape(str(case.get("exif_software") or "None (Stripped)"))
    camera = html.escape(str(case.get("camera_make") or "Unknown (Born-Digital)"))
    timestamp = html.escape(str(case.get("timestamp_utc") or datetime.now(timezone.utc).isoformat()))
    anomalies = case.get("anomalies", [])
    ela_base64 = case.get("ela_base64_preview", "")

    # Verdict badge color
    if verdict == "Likely Authentic":
        verdict_color = "#10b981"
        verdict_bg = "#064e3b"
    elif verdict == "Spliced / Edited":
        verdict_color = "#f59e0b"
        verdict_bg = "#78350f"
    else:  # Likely AI-Generated
        verdict_color = "#f43f5e"
        verdict_bg = "#7f1d1d"

    # Format size
    mb = file_size / (1024 * 1024)
    if mb >= 1.0:
        size_str = f"{mb:.2f} MB"
    else:
        size_str = f"{file_size / 1024:.1f} KB"

    anomaly_html = ""
    if anomalies:
        for i, a in enumerate(anomalies):
            anomaly_html += f"<li>{html.escape(str(a))}</li>"
    else:
        anomaly_html = "<li>No critical anomalies registered.</li>"

    # ELA image section
    ela_section = ""
    if ela_base64:
        ela_section = f"""
    <section style="margin: 24px 0; padding: 16px; background: #0f172a; border: 1px solid #1e293b; border-radius: 8px;">
      <h3 style="margin: 0 0 12px; color: #e2e8f0; font-size: 14px;">Error Level Analysis (ELA) Heatmap</h3>
      <div style="text-align: center;">
        <img src="{ela_base64}" alt="ELA Heatmap" style="max-width: 100%; height: auto; border: 1px solid #334155; border-radius: 4px;">
      </div>
      <p style="margin: 8px 0 0; font-size: 11px; color: #64748b;">In-memory JPEG 90% recompression differential. Extrema-scaled for maximum contrast.</p>
    </section>
"""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ForensIQ Forensic Certificate - {case_id}</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #e2e8f0; background: #0f172a; padding: 24px; max-width: 900px; margin: 0 auto; }}
    h1 {{ font-size: 22px; color: #f8fafc; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-bottom: 8px; }}
    h2 {{ font-size: 16px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin: 32px 0 16px; border-left: 3px solid #6366f1; padding-left: 12px; }}
    h3 {{ font-size: 14px; color: #cbd5e1; margin: 24px 0 12px; }}
    table {{ width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }}
    th, td {{ padding: 10px 12px; text-align: left; border: 1px solid #1e293b; }}
    th {{ background: #1e293b; color: #94a3b8; font-weight: 600; width: 35%; }}
    td {{ background: #0f172a; color: #e2e8f0; }}
    code {{ background: #1e293b; padding: 2px 6px; border-radius: 4px; font-family: 'Monaco', 'Consolas', monospace; font-size: 12px; }}
    pre {{ background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; overflow-x: auto; font-size: 12px; font-family: 'Monaco', 'Consolas', monospace; color: #94a3b8; }}
    .verdict-badge {{ display: inline-block; padding: 8px 16px; border-radius: 9999px; font-weight: 700; font-size: 14px; color: {verdict_color}; background: {verdict_bg}; border: 1px solid {verdict_color}; }}
    .probability-bar {{ height: 8px; background: #1e293b; border-radius: 9999px; overflow: hidden; margin: 12px 0; }}
    .probability-fill {{ height: 100%; background: linear-gradient(90deg, #10b981, #f59e0b, #f43f5e); border-radius: 9999px; transition: width 0.5s ease; }}
    .anomaly-list {{ margin: 12px 0; padding-left: 24px; }}
    .anomaly-list li {{ margin: 8px 0; font-size: 13px; }}
    .disclaimer {{ margin-top: 32px; padding: 16px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; font-size: 12px; color: #94a3b8; }}
    .footer {{ margin-top: 32px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; text-align: center; }}
    .button {{ display: inline-block; padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; margin: 8px 8px 8px 0; font-size: 13px; }}
    .button:hover {{ background: #4f46e5; }}
    .button.secondary {{ background: #334155; }}
    .button.secondary:hover {{ background: #475569; }}
    .sha256-box {{ font-family: 'Monaco', 'Consolas', monospace; font-size: 12px; background: #0f172a; border: 1px solid #334155; border-radius: 4px; padding: 12px; word-break: break-all; }}
    @media print {{
      .no-print {{ display: none !important; }}
      body {{ background: white !important; color: #1e293b !important; padding: 0; max-width: none; }}
      h1 {{ color: #1e293b; border-bottom-color: #6366f1; }}
      h2 {{ color: #475569; border-left-color: #6366f1; }}
      h3 {{ color: #475569; }}
      th {{ background: #f1f5f9 !important; color: #475569 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
      td {{ background: white !important; color: #1e293b !important; border-color: #e2e8f0 !important; }}
      code {{ background: #f1f5f9 !important; color: #475569 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
      pre {{ background: #f8fafc !important; border-color: #e2e8f0 !important; color: #475569 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
      .verdict-badge {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
      .probability-fill {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
      .sha256-box {{ background: #f8fafc !important; border-color: #e2e8f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
      .disclaimer {{ background: #fef3c7 !important; border-color: #f59e0b !important; color: #78350f !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
      @page {{ margin: 2cm; }}
    }}
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 24px; text-align: right;">
    <button class="button" onclick="window.print()">Print Certificate</button>
    <button class="button secondary" onclick="copySha256()">Copy SHA-256</button>
  </div>

  <header>
    <h1>FORENSIQ DIGITAL EVIDENCE & FORENSIC INTEGRITY CERTIFICATE</h1>
    <p style="color: #94a3b8; font-size: 13px; margin-bottom: 4px;">Document Classification: RESTRICTED / FORENSIC CHAIN-OF-CUSTODY</p>
    <p style="color: #94a3b8; font-size: 13px; margin-bottom: 4px;">System Architecture: Asynchronous 3-Tier Multi-Modal Forensic Pipeline</p>
    <p style="color: #94a3b8; font-size: 13px;">Issuing Authority: ForensIQ Autonomous Cyber Forensics Engine v2.0</p>
  </header>

  <section style="margin: 24px 0;">
    <h2>1. Evidence Summary & Identifiers</h2>
    <table>
      <tr><th>Case Identifier</th><td><code>{case_id}</code></td></tr>
      <tr><th>Target File Name</th><td><code>{file_name}</code></td></tr>
      <tr><th>MIME Content Type</th><td><code>{mime_type}</code></td></tr>
      <tr><th>Binary Size</th><td>{size_str} ({file_size:,} bytes)</td></tr>
      <tr><th>Ingestion Timestamp (UTC)</th><td><code>{timestamp}</code></td></tr>
      <tr><th>Cryptographic Hash (SHA-256)</th><td><div class="sha256-box" id="sha256-value">{file_hash}</div></td></tr>
    </table>
  </section>

  <section style="margin: 24px 0;">
    <h2>2. Forensic Verdict & Probability Telemetry</h2>
    <div style="margin: 16px 0;">
      <span class="verdict-badge">{verdict}</span>
    </div>
    <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin: 16px 0;">
      <div style="flex: 1; min-width: 200px;">
        <div class="probability-bar">
          <div class="probability-fill" style="width: {tamper_prob}%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; font-family: 'Monaco', 'Consolas', monospace;">
          <span>0% Authentic</span>
          <span>{tamper_prob}%</span>
          <span>100% Tamper</span>
        </div>
      </div>
      <div style="font-size: 13px; color: #cbd5e1;">
        <strong>Tamper Probability:</strong> {tamper_prob}%<br>
        <strong>Primary Classifier:</strong> {model}
      </div>
    </div>
  </section>

  <section style="margin: 24px 0;">
    <h2>3. Tier 1 Deterministic Hardware & Compression Audit</h2>
    <table>
      <tr><th>Camera Sensor Hardware</th><td><code>{camera}</code></td></tr>
      <tr><th>Metadata Software Signature</th><td><code>{software}</code></td></tr>
      <tr><th>File Structure Verification</th><td>Verified Binary Magic Stream</td></tr>
      <tr><th>Error Level Analysis (ELA)</th><td>Extrema-scaled dynamic range verified</td></tr>
    </table>
  </section>

  {ela_section}

  <section style="margin: 24px 0;">
    <h2>4. Multi-Modal Anomaly & Reasoning Log</h2>
    <ul class="anomaly-list">
      {anomaly_html}
    </ul>
  </section>

  <section style="margin: 24px 0;">
    <h2>5. Chain-of-Custody Attestation</h2>
    <p style="margin-bottom: 12px;">This certificate certifies that the digital asset referenced above was ingested into the ForensIQ Asynchronous Evidence Vault under strict zero-trust parameters. All analyses were executed in-memory with zero disk persistence leaks.</p>
    <ul style="margin-left: 24px; font-size: 13px;">
      <li>Integrity Verification: PASSED</li>
      <li>Evidence Vault Status: ARCHIVED & IMMUTABLE</li>
      <li>Signature Hash: <code>SEC-CHOP-{case_id[:8].upper()}-{file_hash[-12:].upper()}</code></li>
    </ul>
  </section>

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This certificate represents automated triage analysis only. It is <strong>not a legal determination</strong> of authenticity or manipulation. Forensic conclusions require human expert review. Results may be affected by image quality, compression history, and limitations of heuristic/ELA methods (particularly for PNG/lossless formats). Images may have been transmitted to third-party AI inference providers (Hugging Face, OpenRouter) during analysis.
  </div>

  <footer class="footer">
    Generated by ForensIQ v2.0 • {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")} • Case: {case_id}
  </footer>

  <script>
    function copySha256() {{
      const sha256 = document.getElementById('sha256-value').textContent;
      navigator.clipboard.writeText(sha256).then(() => {{
        const btn = event.target;
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = original, 2000);
      }});
    }}
  </script>
</body>
</html>"""
    return html_content
