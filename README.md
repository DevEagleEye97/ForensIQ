# ForensIQ — Digital Forensics & Deepfake Detection Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.4-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![SQLite](https://img.shields.io/badge/Database-aiosqlite-003B57.svg?style=flat&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Architecture:** Asynchronous 3-Tier Multi-Modal Forensic Pipeline  
> **Target:** Digital evidence triage, in-memory Error Level Analysis (ELA), and automated forensic chain-of-custody reporting.

---

## Summary

**ForensIQ** is a cyber forensics pipeline for intelligence analysts, digital evidence officers, and security researchers. It ingests multimedia assets under zero-trust parameters, executes deterministic and machine-learning diagnostics across three independent tiers, and securely archives cryptographic telemetry in an asynchronous SQLite Evidence Vault.

---

## Asynchronous 3-Tier Multi-Modal Forensic Architecture

```
[ Incoming File Ingestion (Multipart / UploadFile) ]
                       │
    ┌──────────────────┴──────────────────┐
    ▼                                     ▼
[ 25MB File Size Guard ]      [ Binary Magic Byte Check ]
(HTTP 413 on overflow)        (image/jpeg, image/png only -> HTTP 415)
                       │
                       ▼
        [ SHA-256 Cryptographic Hash ]
                       │
    ┌──────────────────┼──────────────────┐
    ▼                  ▼                  ▼
[ TIER 1: DETERMINISTIC ] [ TIER 2: CLASSIFIER ] [ TIER 3: MULTI-MODAL ]
 • In-Memory ELA (90% Q)   • Hugging Face Vision   • OpenRouter Vision
 • Extrema Contrast Scale    DeepFake-Detector-v2    Nemotron Nano 12B VL
 • EXIF & Stream Header    • 5.0s Strict Timeout   • 8.0s Strict Timeout
 • Zero Disk Persistence   • Synthetic Probability • Corneal Reflections
    └──────────────────┬──────────────────┘
                       │
                       ▼
           [ Consensus Decision Engine ]
           (Zero-Crash Heuristic Fallback)
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
[ SQLite Evidence Vault ]   [ JSON Telemetry Contract ]
(Asynchronous aiosqlite)    (React + TypeScript Frontend)
```

### 1. Ingestion & Zero-Trust Security
- **25MB Size Guard:** Immediate `HTTP 413` rejection for oversized payloads.
- **Magic Byte Sanitization:** `filetype` validation strictly enforcing `image/jpeg` and `image/png` signatures (rejects extension spoofing with `HTTP 415`).
- **Cryptographic Chain-of-Custody:** SHA-256 fingerprint generated directly on raw in-memory bytes.

### 2. Tier 1: Deterministic Forensics (Offline / Sub-15ms)
- **Zero-Disk In-Memory ELA:** Dynamically recompressed at 90% JPEG quality inside memory buffers (`io.BytesIO`). Difference matrices calculated via `ImageChops`, scaled up to 255 with extrema contrast scaling, and exported as a clean `data:image/jpeg;base64,...` URI.
- **Header & EXIF Audit:** Detects camera hardware (`Image Make`/`Model`), flags known editing suites (Adobe Photoshop, GIMP, Midjourney, Stable Diffusion), identifies timestamp divergence, and validates JPEG `FFD8`..`FFD9` stream bounds.
- **Spatial Artifact Scan:** Laplacian edge variance analysis for splicing detection.
- **Decompression Bomb Guard:** Rejects images exceeding 40 megapixels.

### 3. Tier 2: Classifier Inference (Hugging Face)
- Asynchronous query to `prithivMLmods/Deep-Fake-Detector-v2-Model` via `httpx.AsyncClient` with a strict **5.0s maximum timeout**.

### 4. Tier 3: Multimodal Reasoning (OpenRouter Free Vision)
- Primary model: `nvidia/nemotron-nano-12b-v2-vl:free` (validated at startup against OpenRouter models API).
- Fallback: `meta-llama/llama-3.2-11b-vision-instruct:free` (max 2 models attempted).
- Granular reasoning inspecting pupil corneal light reflection vectors, facial boundary blending halos, and lighting vector consistency.
- **8.0s timeout per model** (max 2 models = 16s worst case).

### 5. Consensus Engine & Zero-Crash Fallback
- Combines 4 check statuses (Pass/Warn/Fail) + continuous signals (ELA variance, classifier scores) into a tamper probability (0-100%) and verdict.
- If external AI endpoints timeout, rate-limit, or error, the backend **never throws HTTP 500**.
- Automatically engages local deterministic heuristics:
  - High ELA variance + Missing camera EXIF → `Likely AI-Generated`
  - Clean ELA + Intact hardware EXIF → `Likely Authentic`
  - Editing software signatures detected → `Spliced / Edited`

---

## API Routing Specification

| Method | Endpoint | Handler | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/analyze` | `routers/workbench.py` | Legacy 3-tier forensic ingestion (delegates to 4-check engine) |
| `POST` | `/api/analyze/image` | `routers/workbench.py` | 4-check forensic image analysis (spatial, frequency, metadata, GAN) |
| `GET` | `/api/vault` | `routers/vault.py` | Paginated & sorted case records from SQLite vault (no ELA preview) |
| `GET` | `/api/vault/{case_id}` | `routers/vault.py` | Full forensic record, ELA preview, & anomaly array |
| `GET` | `/api/report/{case_id}/export` | `routers/report.py` | Streams formal Markdown, JSON, or HTML forensic certificates |
| `GET` | `/api/system/status` | `routers/system.py` | Edge node health, DB stats, & API latencies |
| `GET` | `/health` | `main.py` | Core service uptime and subsystem availability |

---

## Project Structure

```
ForensIQ/
├── frontend/                   # Vite + React 18 + TypeScript + Tailwind CSS UI
│   ├── src/                    # Components, Dashboard, History & Reports
│   ├── public/_redirects       # Cloudflare Pages proxy rules for Render backend
│   ├── package.json            # Frontend dependencies & build scripts
│   └── vite.config.ts          # Port 3000 & /api reverse proxy to backend
├── main.py                     # ASGI application, lifespan manager & CORS middleware
├── database.py                 # Asynchronous SQLite engine via aiosqlite & SQLAlchemy
├── models.py                   # Pydantic v2 telemetry contracts & EvidenceVault ORM model
├── services/
│   ├── forensics_engine.py     # Tier 1 in-memory ELA, EXIF extraction, & fallback heuristics
│   ├── ai_inference.py         # Tier 2 (HF) & Tier 3 (OpenRouter) async API clients
│   └── report_generator.py     # Formal Markdown, JSON & HTML forensic certificate generator
├── routers/
│   ├── workbench.py            # POST /api/analyze & /api/analyze/image forensic ingestion
│   ├── vault.py                # GET /api/vault & GET /api/vault/{case_id}
│   ├── report.py               # GET /api/report/{case_id}/export
│   └── system.py               # GET /api/system/status edge telemetry
├── scripts/
│   └── backup_vault.py         # Timestamped SQLite backup utility (retains 7 most recent)
├── test_suite.py               # Automated end-to-end regression test suite (15 tests)
├── requirements.txt            # Pinned production dependencies
├── .env.example                # Example environment variables template
└── .gitignore                  # Git hygiene rules (ignoring .env, *.db, backups/, .agent/)
```

---

## Quick Start Guide

### 1. Prerequisites
- Python 3.12+
- Node.js 18+ (for frontend)
- Git

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/DevEagleEye97/ForensIQ.git
cd ForensIQ

# Create and activate virtual environment
python -m venv venv

# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
OPENROUTER_API_KEY="your-openrouter-api-key"
HUGGINGFACE_API_TOKEN="your-huggingface-token"
# Optional security:
# API_KEY_REQUIRED=false
# FORENSIQ_API_KEY="your-client-api-key"
# ADMIN_SECRET_KEY="your-admin-secret-key-for-backups"
# SENTRY_DSN=""
# ENVIRONMENT="production"
```
*(Note: ForensIQ operates seamlessly even without API keys thanks to the Tier 1 deterministic fallback protocol).*

### 4. Launch Backend
```bash
uvicorn main:app --reload --port 8000
```
- **Swagger Documentation:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

### 5. Launch Frontend
```bash
cd frontend
npm install
npm run dev
```
- **Web UI:** http://localhost:3000

### 6. Run Verification Suite
```bash
python test_suite.py
```

---

## Deployment

### Backend (Render.com Free Web Service)
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips "*"`
- **Health Check Path:** `/health`
- **Environment Variables:** Set `OPENROUTER_API_KEY`, `HUGGINGFACE_API_TOKEN`, etc. in Render dashboard
- **Note:** Render free tier uses ephemeral disk — SQLite database resets on each deploy. Backups written to `backups/` are also ephemeral. For persistence, use a managed PostgreSQL service.

### Frontend (Cloudflare Pages)
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Proxy Rules:** Configured via `frontend/public/_redirects`:
  ```
  /api/*  https://YOUR-RENDER-URL/api/:splat  200
  /health https://YOUR-RENDER-URL/health     200
  /*      /index.html                        200
  ```
  Replace `YOUR-RENDER-URL` with your actual Render service URL.

### Demo-Day Fallback
```bash
# Tunnel local backend through Cloudflare (no Render deploy needed)
cloudflared tunnel --url http://localhost:8000
```

---

## Security & CORS Standards

- **Parameterization:** 100% of SQLite database queries use SQLAlchemy parameterized expressions to eliminate SQL injection.
- **Input Sanitization:** Regex-based sanitization strips malformed control characters from user-supplied filenames and EXIF strings.
- **CORS Allowlist:** Configured for `http://localhost:3000`, `http://127.0.0.1:3000`, and exact Cloudflare Pages origin(s) via `allow_origin_regex`.
- **Rate Limiting:** `slowapi` with `get_remote_address` (configured for proxy headers via `--proxy-headers`).
- **Secrets:** Never committed. Use `.env` for local development; Render/Cloudflare dashboard for production.
- **HTML Export:** All user-controlled strings HTML-escaped (`html.escape`) to prevent XSS.

---

## Limitations (Honest Disclosure)

1. **ELA Heuristics:** Error Level Analysis is a heuristic, not a cryptographic proof. Results vary with image quality, compression history, and editing workflow. PNG/lossless formats have no JPEG compression history — ELA is inconclusive for these (flagged as `Warn`).
2. **Face-Domain Classifier:** The Hugging Face model (`prithivMLmods/Deep-Fake-Detector-v2-Model`) is trained on face-swap datasets. Non-face imagery may yield unreliable scores.
3. **Third-Party AI Providers:** Images are transmitted to Hugging Face and OpenRouter during Tier 2/3 analysis. Do not upload classified or legally sensitive material without understanding provider data policies.
4. **Ephemeral SQLite on Render Free:** Database resets on every deploy. Backups in `backups/` are also lost. Use a managed database for production persistence.
5. **Cold Starts:** Render free tier spins down after ~15 minutes of inactivity. First request after idle takes ~50s.
6. **No Video Support:** Current pipeline analyzes still images only (JPEG/PNG). Video/frame-level analysis is not implemented.
7. **Heuristic Thresholds:** Consensus thresholds (ELA variance >15%, spatial std >48, etc.) are empirically calibrated on limited datasets and may produce false positives/negatives.
8. **GPS/EXIF Reliability:** EXIF data can be stripped, forged, or absent. GPS coordinates parsed from rational EXIF format (e.g., "12/1") but accuracy depends on source device.

---

## Test Results (Measured)

```
>>> 1. Testing GET /health...
   [PASS] Health check: OPERATIONAL
>>> 2. Testing POST /api/analyze (Valid JPEG)...
   [PASS] Case generated: CASE-20261119044710-737998AE
   [PASS] Verdict: Likely Authentic, Tamper Probability: 27%
>>> 3. Testing POST /api/analyze/image (4-check engine)...
   [PASS] 4-check engine response: CASE-20261119044710-737998AE
   [PASS] Checks: {...}, Verdict: Spliced / Edited
>>> 4. Testing GET /api/vault (Paginated Records)...
   [PASS] Evidence vault total cases: 11
>>> 5. Testing GET /api/vault/{case_id}...
   [PASS] Case details retrieved successfully.
>>> 6. Testing GET /api/report/{case_id}/export (Markdown)...
   [PASS] Markdown certificate streamed (2186 chars).
>>> 7. Testing GET /api/report/{case_id}/export (JSON)...
   [PASS] JSON certificate streamed successfully.
>>> 8. Testing GET /api/report/{case_id}/export (HTML)...
   [PASS] HTML certificate streamed (11094 chars).
>>> 9. Testing GET /api/system/status (aggregate stats)...
   [PASS] System status: OPERATIONAL, DB stats: images=10, flagged=8, avg_tamper=40.8%
>>> 10. Testing Security Guard: Rejecting extension spoofing (HTTP 415)...
   [PASS] Magic byte validation blocked spoofing.
>>> 11. Testing PNG upload not auto-flagged...
   [PASS] PNG handled correctly: frequencyAnomaly=Warn
>>> 12. Testing duplicate upload reuses case_id...
   [PASS] Duplicate upload reused case_id.
>>> 13. Testing oversize rejection (HTTP 413)...
   [PASS] Oversize file rejected.
>>> 14. Testing HTML export escapes user input (XSS prevention)...
   [PASS] HTML export escapes user-controlled strings.
>>> 15. Testing no-API-key fallback returns 200...
   [PASS] All endpoints return 200 without external API keys.
```

---

## License

This project is licensed under the MIT License.