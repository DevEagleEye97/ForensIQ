"""
ForensIQ: Autonomous Digital Forensics & Deepfake Detection Platform
Architecture: Asynchronous 3-Tier Multi-Modal Forensic Pipeline
Vibe: Palantir Gotham & Cisco Secure Endpoint Minimalist
Framework: FastAPI (Asynchronous Python 3.12)
"""

import os
import time
import secrets
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Dict, Any

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn

# SlowAPI Rate Limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# Optional Sentry Error Tracking
try:
    import sentry_sdk
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False

# Load local environment configuration
load_dotenv()

# Configure unified forensic audit logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("forensiq.core")

# Sentry initialization if DSN configured
sentry_dsn = os.getenv("SENTRY_DSN")
if SENTRY_AVAILABLE and sentry_dsn and sentry_dsn.strip() not in ("", "your-sentry-dsn"):
    sentry_sdk.init(
        dsn=sentry_dsn.strip(),
        traces_sample_rate=0.1,
        environment=os.getenv("ENVIRONMENT", "production"),
    )
    logger.info("[SENTRY] Error tracking initialized.")
else:
    logger.info("[SENTRY] DSN not configured. Local logging active.")

from database import init_db
from routers import workbench, vault, report, system

SERVER_START_TIME = time.time()

# Rate Limiter setup (key by remote IP)
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager:
    Initializes async SQLite evidence vault and verifies subsystem readiness.
    """
    logger.info("=" * 72)
    logger.info(">>> INITIALIZING FORENSIQ CYBER FORENSICS PLATFORM ENGINE <<<")
    logger.info(">>> VIBE: Palantir Gotham & Cisco Secure Endpoint Minimalist <<<")
    logger.info("=" * 72)

    await init_db()
    logger.info("[STARTUP] Asynchronous SQLite Evidence Vault operational.")
    yield
    logger.info("[SHUTDOWN] Terminating ForensIQ engine cleanly.")


# Custom 429 JSON response handler
async def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    logger.warning("[SECURITY] Rate limit exceeded from IP: %s on %s", request.client.host if request.client else "unknown", request.url.path)
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": "Rate limit exceeded",
            "detail": f"Too many requests from this IP ({exc.detail}). Please retry in 60 seconds.",
            "status_code": 429,
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        },
    )


# FastAPI Application Instance
app = FastAPI(
    title="ForensIQ Cyber Forensics Engine",
    description="Palantir Gotham & Cisco Secure Endpoint Minimalist Vibe Forensics Platform",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Attach limiter to app state and register custom 429 handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Cross-Origin Resource Sharing (CORS) Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https://[a-zA-Z0-9-]+\.(pages\.dev|vercel\.app)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Enterprise Security Response Headers Middleware (OWASP Defense-in-Depth)
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """
    Enforces defense-in-depth HTTP security response headers across all routes:
    - X-Content-Type-Options: nosniff (stops MIME-type confusion attacks)
    - X-Frame-Options: DENY (anti-clickjacking)
    - Strict-Transport-Security (HSTS)
    - Referrer-Policy: strict-origin-when-cross-origin
    - Permissions-Policy: denies unauthorized sensor access
    - Content-Security-Policy: restrains script & framing origins
    """
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: blob: https:; "
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api-inference.huggingface.co; "
        "font-src 'self' data:; "
        "frame-ancestors 'none';"
    )
    return response


# Security / API Key Middleware (Row-Level / Node Protection)
@app.middleware("http")
async def security_api_key_guard(request: Request, call_next):
    """
    Guards /api/* endpoints if API_KEY_REQUIRED=true in environment.
    Exempts public endpoints: /health, /docs, /openapi.json, /redoc.
    """
    path = request.url.path
    is_api = path.startswith("/api/")
    is_exempt = path in ("/health", "/docs", "/openapi.json", "/redoc")

    api_key_required = os.getenv("API_KEY_REQUIRED", "false").lower() in ("true", "1", "yes")

    if api_key_required and is_api and not is_exempt:
        expected_key = os.getenv("FORENSIQ_API_KEY", "").strip()
        client_key = request.headers.get("X-API-Key", "").strip()

        if not expected_key or not secrets.compare_digest(client_key, expected_key):
            logger.warning("[SECURITY] Unauthorized API request to %s rejected.", path)
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={
                    "error": "Unauthorized",
                    "detail": "Invalid or missing X-API-Key header.",
                    "status_code": 401,
                    "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                },
            )

    response = await call_next(request)
    return response


# Include Subsystem Routers
app.include_router(workbench.router)
app.include_router(vault.router)
app.include_router(report.router)
app.include_router(system.router)


@app.get("/health", tags=["System Telemetry"])
async def root_health_check() -> Dict[str, Any]:
    """
    Lightweight health endpoint returning core system uptime and component state.
    """
    uptime = time.time() - SERVER_START_TIME
    hf_ok = bool(os.getenv("HUGGINGFACE_API_TOKEN") or os.getenv("HUGGINGFACE_API_KEY"))
    or_ok = bool(os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENROUTER_TOKEN"))

    return {
        "status": "OPERATIONAL",
        "service": "ForensIQ Cyber Forensics Engine",
        "vibe": "Palantir Gotham / Cisco Secure Endpoint Minimalist",
        "uptime_seconds": round(uptime, 2),
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "credentials": {
            "huggingface_configured": hf_ok,
            "openrouter_configured": or_ok,
        },
        "security": {
            "rate_limiting_active": True,
            "api_key_enforced": os.getenv("API_KEY_REQUIRED", "false").lower() in ("true", "1", "yes"),
            "sentry_active": bool(SENTRY_AVAILABLE and sentry_dsn),
        },
        "endpoints": {
            "workbench_analyze": "POST /api/analyze",
            "workbench_analyze_image": "POST /api/analyze/image",
            "evidence_vault": "GET /api/vault",
            "case_lookup": "GET /api/vault/{case_id}",
            "report_export": "GET /api/report/{case_id}/export",
            "system_status": "GET /api/system/status",
            "system_backup": "POST /api/system/backup",
        }
    }


# Frontend SPA & /pages Fallback Handler
FRONTEND_DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")
if os.path.exists(FRONTEND_DIST_DIR):
    assets_dir = os.path.join(FRONTEND_DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")


@app.get("/pages", tags=["Frontend Fallback"])
@app.get("/pages/{full_path:path}", tags=["Frontend Fallback"])
async def serve_pages_hub(full_path: str = ""):
    """
    Serves the frontend SPA index.html for /pages routes, or returns
    an active route map if running as a standalone API instance.
    """
    index_file = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "service": "ForensIQ Cyber Forensics Engine",
            "message": "ForensIQ Pages Hub. Frontend SPA routes mapped successfully.",
            "requested_route": f"/pages/{full_path}" if full_path else "/pages",
            "available_pages": [
                "/pages",
                "/pages/dashboard",
                "/pages/history",
                "/pages/reports",
                "/pages/scans",
                "/pages/settings",
                "/pages/privacy",
                "/pages/terms"
            ],
            "api_docs": "/docs",
            "telemetry": "/health",
        }
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
