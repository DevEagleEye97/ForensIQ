### 🔱 **ForensIQ | TruthLens**  
**SAPTHAHACKS 2026** | Team Bhairava (Sl. No. 106) | Problem Statement 04  

**🛡️ Executive Summary**  
ForensIQ is an industrial-grade, multimodal deepfake detection platform built for zero-trust digital forensics. It combines deterministic heuristics with AI diagnostics to ingest, analyze, and cryptographically archive multimedia evidence, delivering human-reviewable forensic reports with maximum impact and minimal bloat.

**⚡ Core Workflow**  
1. **INGEST**: Secure upload with strict Magic Byte validation (prevents spoofing).  
2. **ANALYZE**: Multi-tier inspection (Deterministic ELA/EXIF + Async AI Vision Models).  
3. **CORRELATE**: Cross-modal context matching (e.g., caption vs. metadata alignment).  
4. **REVIEW**: Interactive dashboard with calibrated confidence scores and uncertainty indicators.  
5. **REPORT**: Exportable forensic certificate with SHA-256 hashed traceability in the Evidence Vault.  

**🛠️ Engineering & Security Safeguards**  
- **Resilience**: Graceful fallback to local heuristics if external AI APIs timeout/rate-limit.  
- **Security**: Parameterized SQLite queries, CORS allowlisting, and `slowapi` rate limiting.  
- **Traceability**: Every file is SHA-256 hashed and logged with a complete change history.  
- **Testing**: Automated `test_suite.py` for end-to-end ingestion pipeline regression testing.  

**🎨 UI/UX Stack**  
React 18 + Vite + Tailwind CSS, elevated with **Lenis** (smooth scrolling), **GSAP** (staggered reveals), and **Vanta.js** (tactical 3D backgrounds) for a premium, high-trust analyst experience.

**🔒 Core Philosophy**  
*"A detection score is an indicator, not a final verdict."*  
ForensIQ preserves original evidence and explicitly flags limitations, ensuring all conclusions remain reviewable by human investigators.

**👥 Team Bhairava**  
- **Dhanush Gangadhar**: Team Lead / Backend & Architecture  
- **Disha**: Frontend & UI/UX Engineering  
- **G Ashritha**: AI Integration & Data Correlation  
- **Gagan GC**: Product, Pitch & Documentation  

*(Built with 🔱 for SAPTHAHACKS 2026. Licensed under MIT.)*
