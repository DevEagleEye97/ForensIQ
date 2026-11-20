### 🔱 **ForensIQ | TruthLens**  
**SAPTHAHACKS 2026** | Team Bhairava (Sl. No. 106) | Problem Statement 04  

**🛡️ Executive Summary**  
ForensIQ is an industrial-grade, multimodal deepfake detection platform built for zero-trust digital forensics. It combines deterministic heuristics with AI diagnostics to ingest, analyze, and cryptographically archive multimedia evidence, delivering human-reviewable forensic reports with maximum impact and minimal bloat.

**⚡ Core Workflow**  
1. **INGEST**: Secure upload with strict Magic Byte validation (prevents extension spoofing).  
2. **ANALYZE**: Multi-tier inspection (Deterministic ELA/EXIF/FFT + Async AI Vision Models).  
3. **CORRELATE**: Cross-modal context matching (e.g., caption vs. metadata alignment).  
4. **REVIEW**: Interactive dashboard with calibrated confidence scores and honest uncertainty indicators.  
5. **REPORT**: Exportable forensic certificate with SHA-256 hashed traceability in the Evidence Vault.  

**🎯 Problem Statement Fit (PS-04 TruthLens)**  
- **Problem**: Opaque AI black-boxes outputting unverifiable scores that fail legal/evidentiary thresholds.  
- **Target User**: Forensic investigators, intelligence officers, legal counsel, and fact-checkers.  
- **Solution**: Transparent multi-tier triage combining physics-based deterministic heuristics with cryptographically verifiable audit trails.  

**📊 Verified Engineering Proof & Metrics**  
- **Testing**: **22/22 regression checks PASSED (100%)** via automated `test_suite.py`.  
- **Efficiency**: Production bundle build completed in **4.87s**; main chunk compressed to **118.64 kB** (eliminated ~870 kB of unused Three.js/Vanta/GSAP dependencies).  
- **Code Quality**: **0 errors** across TypeScript strict type-checking (`tsc --noEmit`) and Python bytecode compilation.  
- **Accessibility**: Full WCAG AA compliance (explicit `aria-label` tags on all inputs/sliders/buttons, contrast-corrected text, `<html lang="en">`).  
- **Hardened Security**: Removed `'unsafe-eval'` & `'unsafe-inline'` from script CSP, 25MB upload cutoff (HTTP 413), Magic Byte validation (HTTP 415), parameterized queries, and `slowapi` rate limiting.  

**🎨 UI/UX Stack**  
React 18 + Vite + Tailwind CSS, elevated with **Lenis** momentum scrolling and a hardware-accelerated 2D canvas matrix neural grid for a tactical, zero-trust analyst experience.

**🔒 Core Philosophy**  
*"A detection score is an indicator, not a final verdict."*  
ForensIQ preserves original evidence and explicitly flags limitations, ensuring all conclusions remain reviewable by human investigators.

**👥 Team Bhairava**  
- **Dhanush Gangadhar**: Team Lead / Backend & Architecture  
- **Disha**: Frontend & UI/UX Engineering  
- **G Ashritha**: AI Integration & Data Correlation  
- **Gagan GC**: Product, Pitch & Documentation  

*(Built with 🔱 for SAPTHAHACKS 2026. Licensed under MIT.)*
