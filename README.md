# 🔱 ForensIQ | TruthLens
**SAPTHAHACKS 2026** | **Team Bhairava (Sl. No. 106)** | **Problem Statement 04**

> **Architecture Vibe:** Tactical, Data-Dense, Zero-Trust (Palantir / Cisco Secure Endpoint aesthetic)

---

### 🛡️ Executive Summary
**ForensIQ** is an industrial-grade, multimodal deepfake detection platform built for zero-trust digital forensics. It combines deterministic heuristics with AI diagnostics to ingest, analyze, and cryptographically archive multimedia evidence, delivering human-reviewable forensic reports with maximum impact and minimal bloat.

---

### ⚡ Core Workflow
1. **INGEST**: Secure upload with strict Magic Byte validation (prevents spoofing).
2. **ANALYZE**: Multi-tier inspection (Deterministic ELA/EXIF + Async AI Vision Models).
3. **CORRELATE**: Cross-modal context matching (e.g., caption vs. metadata alignment).
4. **REVIEW**: Interactive dashboard with calibrated confidence scores and uncertainty indicators.
5. **REPORT**: Exportable forensic certificate with SHA-256 hashed traceability in the Evidence Vault.

---

### 🛠️ Engineering & Security Safeguards
- **Resilience**: Graceful fallback to local heuristics if external AI APIs timeout/rate-limit.
- **Security**: Parameterized SQLite queries, CORS allowlisting, and `slowapi` rate limiting.
- **Traceability**: Every file is SHA-256 hashed and logged with a complete change history.
- **Testing**: Automated `test_suite.py` for end-to-end ingestion pipeline regression testing.

---

### 🎨 UI/UX Stack
React 18 + Vite + Tailwind CSS, elevated with **Lenis** (smooth scrolling), **GSAP** (staggered reveals), and **Vanta.js** (tactical 3D backgrounds) for a premium, high-trust analyst experience.

---

### 📂 Project Structure
```text
ForensIQ/
├── frontend/                   # Vite + React 18 + TypeScript + Tailwind CSS
│   ├── src/                    # Components, Dashboard, Lenis/GSAP animations
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

### 🚀 Quick Start Guide

#### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- Git

#### 2. Backend Setup
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

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Web UI: http://localhost:5173*

#### 4. Run Verification Suite
```bash
python test_suite.py
```

---

### 🔒 Core Philosophy
> *"A detection score is an indicator, not a final verdict."*  
ForensIQ preserves original evidence and explicitly flags limitations, ensuring all conclusions remain reviewable by human investigators.

---

### 👥 Team Bhairava
- **Dhanush Gangadhar**: Team Lead / Backend & Architecture  
- **Disha**: Frontend & UI/UX Engineering  
- **G Ashritha**: AI Integration & Data Correlation  
- **Gagan GC**: Product, Pitch & Documentation  

---
*(Built with 🔱 for SAPTHAHACKS 2026. Licensed under MIT.)*
