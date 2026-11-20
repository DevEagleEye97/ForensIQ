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

### Error: `[MISSING_SERVICES] Project framework is set to "services", but no services are declared`
**Root Cause**:
Vercel has set the project's **Framework Preset** to `"services"` (Vercel's polyglot monorepo / multi-service architecture). When this setting is active, Vercel strictly requires a `services` declaration block inside `vercel.json`.

### How to Fix:

#### Option 1: Configure `services` in `vercel.json` (Recommended for Vercel Monorepo)
Update root `vercel.json` to define both the Vite frontend and Python backend services:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "services": {
    "frontend": {
      "root": "frontend/"
    },
    "backend": {
      "root": ".",
      "entrypoint": "api/index.py"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": { "service": "backend" }
    },
    {
      "source": "/health",
      "destination": { "service": "backend" }
    },
    {
      "source": "/docs",
      "destination": { "service": "backend" }
    },
    {
      "source": "/openapi.json",
      "destination": { "service": "backend" }
    },
    {
      "source": "/redoc",
      "destination": { "service": "backend" }
    },
    {
      "source": "/(.*)",
      "destination": { "service": "frontend" }
    }
  ]
}
```

#### Option 2: Change Project Framework in Vercel Dashboard (Standard Serverless / Split)
If not using Vercel's multi-service feature:
1. Open **Vercel Dashboard** -> Go to the Project.
2. Navigate to **Settings** -> **General** -> **Build & Development Settings**.
3. Change **Framework Preset** from `Services` to `Other` (or `Vite` if Root Directory is configured to `frontend`).
4. Save and redeploy.

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
