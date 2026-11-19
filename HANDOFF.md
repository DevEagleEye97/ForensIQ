# HANDOFF.md — ForensIQ Multi-Agent Overhaul

## Phase 0 Complete ✓
- Baseline tests: 8/8 PASS
- Repo hygiene: `.agent/` and `frontend/.agents/` removed from git (608 files, ~170K lines), added to .gitignore

## Live Defect Status (A–N from brief)

| Defect | Status | Owner | Notes |
|--------|--------|-------|-------|
| A: Dashboard KPIs fabricated | **OPEN** | Frontend | Uses wrong field names + invented math |
| B: Dead nav route + ForensicAnalysisPage.tsx | **OPEN** | Frontend | `forensic-analysis` in nav but no route; file is 100% hardcoded fake |
| C: Fake 1200ms MatrixLoader boot | **OPEN** | Frontend | App.tsx lines 19-26 |
| D: Two consensus engines disagree | **OPEN** | Backend | `/api/analyze` (old) vs `/api/analyze/image` (new 4-check) |
| E: PNG ELA false positives | **OPEN** | Backend | PNG has no JPEG history → ELA always high variance |
| F: GPS parser fails on rational degrees | **OPEN** | Backend | `float(parts[0])` fails on "12/1" format |
| G: Blocking CPU work / no bomb guard | **OPEN** | Backend | Full read before size check; sync Pillow/NumPy in async |
| H: DB error swallowing + IntegrityError race | **OPEN** | Backend | Try/except swallows; returns case_id even on failure |
| I: vault list returns full ELA base64 per row | **OPEN** | Backend | MBs of data per row; History limit=100 |
| J: OpenRouter timeout 12s × 4 models = 48s | **OPEN** | Backend | Need 8s timeout, max 2 models, startup validation |
| K: Dashboard chart invents scores | **OPEN** | Frontend | Maps Pass/Warn/Fail to fake 88/48/12 etc. |
| L: Splash overclaims (lip-sync, <2s) | **OPEN** | Frontend | Backend is images-only; timing unmeasured |
| M: Agent scaffolding in git | **DONE** | Orchestrator | Removed + gitignored |
| N: README marketing fluff | **OPEN** | Backend | "Palantir", "Bulletproof", "Disha & Ashritha" |

---

## Agent 1 (Backend) — TODO
1. **D**: Make `/api/analyze` delegate to same 4-check engine as `/api/analyze/image` (mapping layer for old contract)
2. **E**: PNG input → `frequencyAnomaly="Warn"` with observation "No JPEG compression history — ELA inconclusive for PNG"; exclude ELA from consensus
3. **F**: Parse rational GPS notation ("12/1") in deg/min/sec components
4. **G**: Check file size before reading; wrap CPU-bound in `run_in_threadpool`; set pixel-count guard (40MP)
5. **H**: On IntegrityError re-select existing record; return `case_id=null` + warning if persistence fails
6. **I**: `ela_base64_preview=None` in list endpoint only (keep in detail)
7. **J**: OpenRouter timeout 8s, cap fallback pool at 2 models, validate model IDs at startup vs `GET /api/v1/models`
8. Add real aggregate stats to `/api/system/status`: `image_cases_count`, `flagged_cases_count`, `avg_tamper_probability`
9. Add optional `signals` object to `/api/analyze/image` response: `spatial_patch_std`, `ela_variance_pct`, `gan_effective_pct`
10. Implement `GET /api/report/{case_id}/export?format=html` (self-contained, html.escape'd, print stylesheet)
11. Pin requirements to exact versions; run pip-audit
12. Rewrite README honestly (use Agent 3 copy deck)
13. Add regression tests to test_suite.py

## Agent 2 (Frontend) — TODO
1. **A**: Fix KPIs — fetch `/api/system/status`, read real fields, delete 0.13/Math.max formulas, rename "Scans Today" → "Images Analyzed"
2. **B**: Remove `forensic-analysis` from navItems + Page type; `git rm frontend/src/pages/ForensicAnalysisPage.tsx`
3. **C**: Remove fake boot delay + MatrixLoader boot usage
4. **K**: Chart consumes `response.signals` when present; otherwise categorical Pass/Warn/Fail indicators
5. **L**: Splash copy per Agent 3 deck; remove "frame-level precision" and "<2 seconds"
6. Add "Open HTML Metadata Certificate" link next to Markdown export
7. Create `frontend/public/_redirects` with proxy rules per hosting section
8. Loading states: replace fake stage cycling with honest "Analyzing…" indicator
9. Error handling: clear messages for 413, 415, 429, 500, network failure with retry

## Agent 3 (Design) — TODO
1. Create `DESIGN_SPEC.md` with tokens, verdict color mapping, contrast fixes, focus states, mobile nav
2. Create `COPY_DECK.md` with replacement microcopy for all overclaims

## Agent 4 (Security) — TODO
1. Audit and produce `SECURITY_AUDIT.md` with findings table + patches in HANDOFF.md

---

## Next Actions
Starting Phase 1: Backend fixes (D, E, F, G, H, I, J) → Frontend fixes (A, B, C, K, L) → Design specs → Security audit → README rewrite