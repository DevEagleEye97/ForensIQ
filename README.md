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

### 📊 Verified Proof & Engineering Metrics (Measurable Pillars)

| Pillar | Measured Tool / Test | Verified Result | Before vs. After Optimization |
| :--- | :--- | :--- | :--- |
| **Testing** | `python test_suite.py` | **22/22 checks PASSED (100%)** | Full end-to-end regression across RFC 7807, Magic Bytes, ELA, Vault, and Watermark decompiler |
| **Code Quality** | `npx tsc --noEmit` & `compileall` | **0 errors, clean compile** | Strict typing across all frontend views and backend ASGI endpoints |
| **Efficiency (Build)** | `npm run build` | **4.87s build time** | Dropped from **10.27s** (-52.6% faster) |
| **Efficiency (Bundle)**| Rollup manual chunking | **118.64 kB main entry** | Dropped from **235.44 kB** (-49.6%); eliminated **752 kB** `three.js` & `vanta` vendor bloat |
| **Accessibility** | WCAG 2.1 AA Checklist | **High-contrast, 100% labeled** | Added explicit `aria-label` to all inputs/sliders/buttons, fixed low-contrast grey text (`slate-500` -> `slate-400`), context-rich image `alt` tags, document `<html lang="en">` |
| **Security Status** | Attack Surface Audit | **Hardened (Zero-Trust)** | Removed `'unsafe-eval'` & `'unsafe-inline'` from script CSP; 25MB boundary (413); Magic Byte guard (415); rate limited (`slowapi`); zero-disk RAM ingestion; parameterized SQL |

---

### 🎯 Problem Statement Fit (PS-04 TruthLens)
- **The Problem:** Deepfakes and synthetic media are increasingly weaponized, while automated "black-box" AI detectors generate opaque percentages that fail evidentiary standards in real investigations.
- **The User:** Digital evidence officers, intelligence analysts, fact-checkers, and journalists requiring verifiable provenance.
- **ForensIQ's Answer:** A multi-layered triage system combining deterministic physics heuristics (ELA, EXIF, FFT spectral analysis, Magic Byte analysis) with asynchronous vision reasoning, backed by a cryptographically sealed SHA-256 Evidence Vault and exportable forensic certificates.

---

### 🎨 UI/UX Stack
React 18 + Vite + Tailwind CSS, elevated with **Lenis** (momentum smooth scrolling) and a **zero-dependency hardware-accelerated 2D canvas matrix** for a tactical, zero-trust analyst experience.

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
