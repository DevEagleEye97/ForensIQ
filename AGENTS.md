# forensIQ Backend - Agent Instructions & Project Memory

## Project Overview & Architecture
ForensIQ is an autonomous multi-modal digital forensics and deepfake detection platform.
- **Backend**: FastAPI (Python 3.12), async pipeline, SQLite (`forensiq_vault.db`), slowapi rate limiting, structured logging (`services/logging_conf.py`), Sentry integration.
  - Entrypoints: `main.py` (local/production ASGI) and `api/index.py` (Vercel serverless entrypoint).
- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS SPA (`frontend/`).
  - Routing: React Router v7 (`frontend/src/App.tsx`).
  - Build output: `frontend/dist/`.

---

## Deployment & Vercel Configuration Memory

### Root Cause & Permanent Solution:
1. **Why `services` mode fails on this repo**:
   Vercel Services strictly requires non-overlapping, disjoint directory paths (e.g. `apps/frontend` and `apps/backend`). In this repository, the Python backend files (`main.py`, `models.py`, `database.py`, `services/`) are located at the repository root `.`, and `frontend/` is a nested subfolder. In Services mode, Vercel rejects `"root": "."` as a parent directory of `"frontend/"`.
2. **Permanent Solution (Standard Fullstack Setup)**:
   - In **Vercel Dashboard** -> **Settings** -> **General** -> **Build & Development Settings**, set **Framework Preset** to **`Other`** (or None).
   - In `vercel.json`:
     - `buildCommand`: `cd frontend && npm install && npm run build`
     - `outputDirectory`: `frontend/dist`
     - Rewrites: Route `/api/*`, `/health`, `/docs`, `/openapi.json`, `/redoc` to `/api/index.py`, and `/(.*)` to `/index.html`.
   - Vercel automatically deploys `api/index.py` via its Python Serverless Runtime and serves the built Vite frontend statically from `frontend/dist`.

---

## Key Commands & Workflows
- **Backend Run (Local)**: `uvicorn main:app --reload --port 8000` or `python main.py`
- **Backend Tests**: `pytest test_suite.py`
- **Frontend Dev**: `cd frontend && npm run dev`
- **Frontend Build**: `cd frontend && npm run build`

---

## Security Protocols

### Secrets & Credentials
- Never commit secrets, API keys, passwords, or credentials to the repository
- Use environment variables or a secrets manager for all sensitive data
- If a secret is accidentally committed, remove it from history and rotate the key immediately
- Do not log or print secrets in any form (even partially masked)

### Data Handling
- Never expose or log sensitive user data in development
- Sanitize all inputs at trust boundaries before processing
- Validate and sanitize data from external sources (APIs, user input, file uploads)
- Use parameterized queries to prevent SQL injection

### API Security
- Implement proper authentication and authorization checks
- Use rate limiting on public endpoints
- Validate all API inputs and reject malformed requests
- Return generic error messages that don't leak internal details

### Code Review
- Review all code for security vulnerabilities before merging
- Check for common issues: XSS, CSRF, command injection, path traversal
- Ensure dependencies are up to date and free of known vulnerabilities
- Run security scanning tools as part of CI/CD

### Compliance
- Follow GDPR/CCPA data protection requirements
- Maintain audit logs for sensitive operations
- Implement data retention policies
- Ensure proper access controls on all resources

---

## Pre-Launch Checklist

1. Loading states
2. Empty states
3. Clear error messages
4. Form validation
5. Rate limiting
6. Database backups
7. Row-level security
8. API keys off the frontend
9. Mobile layout
10. Custom 404 page
11. Analytics installed
12. Error tracking
13. Privacy policy page
14. Terms page
