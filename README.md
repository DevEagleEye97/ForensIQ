# ForensIQ — Autonomous Digital Forensics & Deepfake Detection Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.4-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![SQLite](https://img.shields.io/badge/Database-aiosqlite-003B57.svg?style=flat&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Architecture Vibe:** *Palantir Gotham & Cisco Secure Endpoint Minimalist*  
> **Target:** High-throughput, asynchronous multi-modal digital evidence triage, in-memory Error Level Analysis (ELA), and automated forensic chain-of-custody reporting.

---

## 🛡️ Executive Summary

**ForensIQ** is an industrial-grade cyber forensics pipeline designed for intelligence analysts, digital evidence officers, and security researchers. It ingests multimedia assets under zero-trust parameters, executes deterministic and machine-learning diagnostics across three independent tiers, and securely archives cryptographic telemetry in an asynchronous SQLite Evidence Vault.

---

## ⚡ Asynchronous 3-Tier Multi-Modal Forensic Architecture

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
 • Extrema Contrast Scale    DeepFake-Detector-v2    Llama-3.2-11b Vision
 • EXIF & Stream Header    • 5.0s Strict Timeout   • Corneal Reflections
 • Zero Disk Persistence   • Synthetic Probability • Hairline Halos & Shadows
   └──────────────────┬──────────────────┘
                      │
                      ▼
          [ Consensus Decision Engine ]
          (Bulletproof Fallback Heuristics)
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
[ SQLite Evidence Vault ]   [ JSON Telemetry Contract ]
(Asynchronous aiosqlite)    (Disha & Ashritha Next.js Frontend)
```

### 1. Ingestion & Zero-Trust Security
- **25MB Size Guard:** Immediate `HTTP 413` rejection for oversized payloads.
- **Magic Byte Sanitization:** `filetype` validation strictly enforcing `image/jpeg` and `image/png` signatures (rejects extension spoofing with `HTTP 415`).
- **Cryptographic Chain-of-Custody:** SHA-256 fingerprint generated directly on raw in-memory bytes.

### 2. Tier 1: Deterministic Forensics (Offline / Sub-15ms)
- **Zero-Disk In-Memory ELA:** Dynamically recompressed at 90% JPEG quality inside memory buffers (`io.BytesIO`). Difference matrices calculated via `ImageChops`, scaled up to 255 with extrema contrast scaling, and exported as a clean `data:image/jpeg;base64,...` URI.
- **Header & EXIF Audit:** Detects camera hardware (`Image Make`/`Model`), flags known editing suites (*Adobe Photoshop*, *GIMP*, *Midjourney*, *Stable Diffusion*), identifies timestamp divergence, and validates JPEG `FFD8`..`FFD9` stream bounds.

### 3. Tier 2: Classifier Inference (Hugging Face)
- Asynchronous query to `prithivMLmods/Deep-Fake-Detector-v2-Model` via `httpx.AsyncClient` with a strict **5.0s maximum timeout**.

### 4. Tier 3: Multimodal Reasoning (OpenRouter Free Vision)
- Primary model: `meta-llama/llama-3.2-11b-vision-instruct:free` (automatic failover to `qwen/qwen2.5-vl-72b-instruct:free`).
- Granular reasoning inspecting pupil corneal light reflection vectors, facial boundary blending halos, and lighting vector consistency.

### 5. Bulletproof Fail-Safe (Demo Insurance)
- If external AI endpoints timeout (>5s), rate-limit (429), or error, the backend **never throws HTTP 500**.
- Automatically engages local deterministic heuristics:
  - **High ELA variance (>18%) + Missing camera EXIF** $\rightarrow$ `Likely AI-Generated (Synthetic)`
  - **Clean ELA + Intact hardware EXIF** $\rightarrow$ `Likely Authentic`
  - **Editing software signatures detected** $\rightarrow$ `Spliced / Edited`

---

## 📡 API Routing Specification

| Method | Endpoint | Handler | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/analyze` | `routers/workbench.py` | 8-step forensic ingestion, ELA, AI consensus, & vault write |
| `GET` | `/api/vault` | `routers/vault.py` | Paginated & sorted case records from SQLite vault |
| `GET` | `/api/vault/{case_id}` | `routers/vault.py` | Full forensic record, ELA preview, & anomaly array |
| `GET` | `/api/report/{case_id}/export` | `routers/report.py` | Streams formal Markdown or JSON forensic certificates |
| `GET` | `/api/system/status` | `routers/system.py` | Edge node health, DB connection status, & API latencies |
| `GET` | `/health` | `main.py` | Core service uptime and subsystem availability |

---

## 📂 Project Structure

```
forensIQ Backend/
├── main.py                     # ASGI application, lifespan manager & CORS middleware
├── database.py                 # Asynchronous SQLite engine via aiosqlite & SQLAlchemy
├── models.py                   # Pydantic v2 telemetry contracts & EvidenceVault ORM model
├── services/
│   ├── forensics_engine.py     # Tier 1 in-memory ELA, EXIF extraction, & fallback heuristics
│   ├── ai_inference.py         # Tier 2 (HF) & Tier 3 (OpenRouter) async API clients
│   └── report_generator.py     # Formal Markdown & JSON forensic certificate generator
├── routers/
│   ├── workbench.py            # POST /api/analyze forensic ingestion pipeline
│   ├── vault.py                # GET /api/vault & GET /api/vault/{case_id}
│   ├── report.py               # GET /api/report/{case_id}/export
│   └── system.py               # GET /api/system/status edge telemetry
├── test_suite.py               # Automated end-to-end regression test suite
├── requirements.txt            # Pinned production dependencies
├── .env.example                # Example environment variables template
└── .gitignore                  # Git hygiene rules (ignoring .env and *.db)
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.12+
- Git

### 2. Setup Virtual Environment
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
```
*(Note: ForensIQ operates seamlessly even without API keys thanks to the Tier 1 deterministic fallback protocol).*

### 4. Launch ASGI Server
```bash
uvicorn main:app --reload --port 8000
```

- **Swagger Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

### 5. Run Verification Suite
```bash
python test_suite.py
```

---

## 🔒 Security & CORS Standards

- **Parameterization:** 100% of SQLite database queries use SQLAlchemy parameterized expressions to eliminate SQL injection.
- **Input Sanitization:** Regex-based sanitization strips malformed control characters from user-supplied filenames and EXIF strings.
- **CORS Allowlist:** Configured for `http://localhost:3000`, `http://127.0.0.1:3000`, and `*.pages.dev` (Cloudflare Pages frontend deployment).

---

## 📄 License
This project is licensed under the MIT License.
