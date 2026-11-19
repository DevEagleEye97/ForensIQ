# 🔱 ForensIQ | TruthLens Implementation
### Autonomous Multimodal Digital Forensics & Deepfake Detection Platform

> **Architecture Vibe:** Tactical, Data-Dense, Zero-Trust (Palantir / Cisco Secure Endpoint aesthetic)  
> **Hackathon:** SAPTHAHACKS 2026 | **Team:** Bhairava (Sl. No. 106)  
> **Problem Statement:** 04 - TruthLens (Multimodal Digital Forensics and Deepfake Detection System)

---

## 🛡️ Executive Summary
**ForensIQ** is an industrial-grade, multimodal cyber forensics pipeline designed for intelligence analysts and digital evidence officers. It ingests multimedia assets under zero-trust parameters, executes deterministic and machine-learning diagnostics, correlates cross-modal signals, and securely archives cryptographic telemetry in an asynchronous Evidence Vault. 

Built with the "Lazy Senior Dev" philosophy: *Maximum impact, minimal bloat, bulletproof fallbacks.*

---

## ⚡ Core Forensic Workflow
1. **INGEST:** Secure file upload with strict client-side and server-side validation.
2. **ANALYZE:** Multi-tier inspection (Deterministic ELA/EXIF + AI Vision Models).
3. **CORRELATE:** Cross-modal context matching (e.g., Does the text caption match the image metadata?).
4. **REVIEW:** Interactive dashboard with calibrated confidence scores and honest uncertainty indicators.
5. **REPORT:** Exportable, structured forensic report with traceable evidence references.

---

## 🎨 UI/UX Engineering (The "Wow" Factor)
We believe forensic tools should be as powerful as they are beautiful. The frontend is engineered for a premium, high-trust user experience:
- **Lenis:** Butter-smooth, momentum-based scrolling for a heavy, professional dashboard feel.
- **GSAP:** Choreographed, staggered reveal animations for forensic reports and analysis results.
- **Vanta.js:** Subtle, high-tech animated 3D backgrounds (Net/Matrix effects) on the landing and upload zones.
- **React Bits:** Production-ready, interactive components (Animated File Dropzones, Data Cards, and Loading States) to accelerate development without sacrificing quality.
- **Tailwind CSS:** Utility-first, responsive styling ensuring perfect mobile and desktop layouts.

---

## 🛠️ Essential Engineering Practices Implemented
We didn't just build a demo; we built a resilient system. Key architectural safeguards include:

| Category | Implementation Detail |
| :--- | :--- |
| **Input Validation** | Strict 25MB file size guards + Binary Magic Byte verification (prevents extension spoofing). |
| **Error Handling** | **Bulletproof Fail-Safe:** If external AI APIs timeout or rate-limit, the system gracefully falls back to deterministic local heuristics (ELA + EXIF) instead of crashing. |
| **Rate Limiting** | `slowapi` integration to prevent API abuse and ensure fair resource allocation. |
| **Security** | Parameterized SQLite queries (SQL injection prevention), CORS allowlisting, and secure HTTP status codes (413, 415, 429). |
| **Traceability** | SHA-256 cryptographic hashing for every ingested file, logged in the Evidence Vault with a complete change history. |
| **Testing** | Automated `test_suite.py` for end-to-end regression testing of the ingestion pipeline. |

---

## 📂 Project Structure
```text
ForensIQ/
├── frontend/                   # Vite + React 18 + TypeScript + Tailwind CSS
│   ├── src/                    # Components (React Bits), Dashboard, Lenis/GSAP animations
│   └── package.json            # Frontend dependencies & build scripts
├── main.py                     # FastAPI ASGI application, lifespan manager & CORS
├── database.py                 # Asynchronous SQLite engine (Evidence Vault)
├── models.py                   # Pydantic v2 telemetry contracts & ORM models
├── services/
│   ├── forensics_engine.py     # Tier 1: In-memory ELA, EXIF extraction, fallback heuristics
│   ├── ai_inference.py         # Tier 2 & 3: Async AI API clients (Hugging Face / OpenRouter)
│   └── report_generator.py     # Formal Markdown/JSON forensic certificate generator
├── routers/                    # API endpoints (/analyze, /vault, /report, /health)
├── test_suite.py               # Automated end-to-end regression tests
├── requirements.txt            # Pinned production dependencies
└── .env.example                # Environment variables template
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### 2. Backend Setup
```bash
git clone https://github.com/DevEagleEye97/ForensIQ.git
cd ForensIQ

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Add your OPENROUTER_API_KEY and HUGGINGFACE_API_TOKEN to .env

# Launch ASGI Server
uvicorn main:app --reload --port 8000
```
*Swagger Docs: http://localhost:8000/docs*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Web UI: http://localhost:3000*

### 4. Run Verification Suite
```bash
python test_suite.py
```

---

## 🔒 Build for Forensic Trust
> *"A detection score is an indicator, not a final verdict."*  
ForensIQ is designed to **show what was flagged, where it was found, and what limitations remain**. We preserve original evidence and keep all conclusions explicitly reviewable by a human investigator. The UI prominently displays calibrated confidence scores and "Human Review Required" disclaimers.

---

## 👥 Team Bhairava
- **Dhanush Gangadhar** (Team Leader / Backend & Architecture)
- **Disha** (Frontend & UI/UX Engineering)
- **G Ashritha** (AI Integration & Data Correlation)
- **Gagan GC** (Product, Pitch & Documentation)

---
*Built with 🔱 for SAPTHAHACKS 2026 | Problem Statement 04: TruthLens. Licensed under MIT.*
