"""
ForensIQ System Telemetry & Status Router
Handler: /api/system/status (Edge system node connection health, DB status, API latencies)
"""

import os
import re
import time
import socket
import secrets
import logging
from datetime import datetime, timezone
from typing import Dict, Any

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db, DATABASE_URL
from models import EvidenceVault, SystemStatusResponse
from services.ai_inference import measure_api_health
from scripts.backup_vault import run_vault_backup

logger = logging.getLogger("forensiq.routers.system")
router = APIRouter(prefix="/api/system", tags=["System Telemetry"])

SYSTEM_BOOT_TIME = time.time()
NODE_HOSTNAME = socket.gethostname()


def mask_database_url(url: str) -> str:
    """Mask credentials in database URI to prevent sensitive telemetry exposure."""
    base = url.split("?")[0]
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", base)


@router.get("/status", response_model=SystemStatusResponse)
async def get_system_status(db: AsyncSession = Depends(get_db)):
    """
    Returns edge system node connection health, database/vault status,
    and external API latencies (Hugging Face, OpenRouter).
    """
    uptime = time.time() - SYSTEM_BOOT_TIME

    # Check database status & record count
    db_status = "HEALTHY"
    vault_records_count = 0
    image_cases_count = 0
    flagged_cases_count = 0
    avg_tamper_probability = 0.0
    try:
        stmt = select(func.count(EvidenceVault.case_id))
        vault_records_count = (await db.execute(stmt)).scalar() or 0

        # Image cases only (exclude documentary evidence)
        stmt_img = select(func.count(EvidenceVault.case_id)).where(
            EvidenceVault.mime_type.in_(["image/jpeg", "image/png"])
        )
        image_cases_count = (await db.execute(stmt_img)).scalar() or 0

        # Flagged cases: verdict in Spliced/AI-Generated (exclude "Documentary Evidence Indexed")
        stmt_flagged = select(func.count(EvidenceVault.case_id)).where(
            EvidenceVault.verdict.in_(["Likely AI-Generated", "Spliced / Edited"])
        )
        flagged_cases_count = (await db.execute(stmt_flagged)).scalar() or 0

        # Average tamper probability for image verdicts only
        stmt_avg = select(func.avg(EvidenceVault.tamper_probability)).where(
            EvidenceVault.mime_type.in_(["image/jpeg", "image/png"]),
            EvidenceVault.verdict.in_(["Likely Authentic", "Likely AI-Generated", "Spliced / Edited"])
        )
        avg_tamper = (await db.execute(stmt_avg)).scalar()
        if avg_tamper is not None:
            avg_tamper_probability = round(float(avg_tamper), 1)
    except Exception as exc:
        logger.error("[SYSTEM] Database query failed: %s", exc)
        db_status = "DEGRADED"

    # Measure external AI latencies
    api_latencies = await measure_api_health()

    return SystemStatusResponse(
        status="OPERATIONAL" if db_status == "HEALTHY" else "DEGRADED",
        node_id=f"FORENSIQ-NODE-{NODE_HOSTNAME.upper()}",
        uptime_seconds=round(uptime, 2),
        timestamp_utc=datetime.now(timezone.utc).isoformat(),
        database={
            "provider": "SQLite / PostgreSQL (Async Engine)",
            "connection_string": mask_database_url(DATABASE_URL),
            "status": db_status,
            "archived_cases_count": vault_records_count,
            "image_cases_count": image_cases_count,
            "flagged_cases_count": flagged_cases_count,
            "avg_tamper_probability": avg_tamper_probability
        },
        api_latencies=api_latencies,
        resilience_mode="ACTIVE (Zero-Crash Heuristic Fail-Safe Engaged)"
    )


@router.post("/backup", tags=["System Administration"])
async def trigger_vault_backup(
    x_admin_key: str = Header(None, alias="X-Admin-Key")
) -> Dict[str, Any]:
    """
    Triggers an instant, timestamped snapshot of the SQLite Evidence Vault.
    Protected by constant-time secret comparison against ADMIN_SECRET_KEY.
    """
    required_key = os.getenv("ADMIN_SECRET_KEY", "").strip()
    if not required_key:
        logger.warning("[SYSTEM/BACKUP] Backup endpoint called without ADMIN_SECRET_KEY configured.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service Unavailable: Administrative backup endpoint not configured."
        )

    if not x_admin_key or not secrets.compare_digest(x_admin_key.strip(), required_key):
        logger.warning("[SYSTEM/BACKUP] Unauthorized backup attempt rejected.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid or missing X-Admin-Key header."
        )

    result = run_vault_backup()
    logger.info("[SYSTEM/BACKUP] Vault backup executed: %s", result.get("backup_file"))
    return result
