"""
ForensIQ System Telemetry & Status Router
Handler: /api/system/status (Edge system node connection health, DB status, API latencies)
"""

import os
import time
import socket
import logging
from datetime import datetime, timezone
from typing import Dict, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db, DATABASE_URL
from models import EvidenceVault, SystemStatusResponse
from services.ai_inference import measure_api_health

logger = logging.getLogger("forensiq.routers.system")
router = APIRouter(prefix="/api/system", tags=["System Telemetry"])

SYSTEM_BOOT_TIME = time.time()
NODE_HOSTNAME = socket.gethostname()


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
    try:
        stmt = select(func.count(EvidenceVault.case_id))
        vault_records_count = (await db.execute(stmt)).scalar() or 0
    except Exception as exc:
        logger.error("[SYSTEM] Database query failed: %s", exc)
        db_status = f"DEGRADED ({str(exc)})"

    # Measure external AI latencies
    api_latencies = await measure_api_health()

    return SystemStatusResponse(
        status="OPERATIONAL" if db_status == "HEALTHY" else "DEGRADED",
        node_id=f"FORENSIQ-NODE-{NODE_HOSTNAME.upper()}",
        uptime_seconds=round(uptime, 2),
        timestamp_utc=datetime.now(timezone.utc).isoformat(),
        database={
            "provider": "SQLite (aiosqlite asynchronous driver)",
            "connection_string": DATABASE_URL.split("?")[0],
            "status": db_status,
            "archived_cases_count": vault_records_count
        },
        api_latencies=api_latencies,
        resilience_mode="ACTIVE (Zero-Crash Heuristic Fail-Safe Engaged)"
    )
