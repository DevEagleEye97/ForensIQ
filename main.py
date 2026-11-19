"""
ForensIQ: Autonomous Digital Forensics & Deepfake Detection Platform
Architecture: Asynchronous 3-Tier Multi-Modal Forensic Pipeline
Vibe: Palantir Gotham & Cisco Secure Endpoint Minimalist
Framework: FastAPI (Asynchronous Python 3.12)
"""

import os
import time
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn

# Load local environment configuration
load_dotenv()

# Configure unified forensic audit logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("forensiq.core")

from database import init_db
from routers import workbench, vault, report, system

SERVER_START_TIME = time.time()


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

    # Initialize SQLite evidence vault schema
    await init_db()
    logger.info("[STARTUP] Asynchronous SQLite Evidence Vault operational.")
    yield
    logger.info("[SHUTDOWN] Terminating ForensIQ engine cleanly.")


# FastAPI Application Instance
app = FastAPI(
    title="ForensIQ Cyber Forensics Engine",
    description="Palantir Gotham & Cisco Secure Endpoint Minimalist Vibe Forensics Platform",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Cross-Origin Resource Sharing (CORS) Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https://.*\.pages\.dev$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
            "openrouter_configured": or_ok
        },
        "endpoints": {
            "workbench_analyze": "POST /api/analyze",
            "evidence_vault": "GET /api/vault",
            "case_lookup": "GET /api/vault/{case_id}",
            "report_export": "GET /api/report/{case_id}/export",
            "system_status": "GET /api/system/status"
        }
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
