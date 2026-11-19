"""
ForensIQ Vault Router
Handlers:
- GET /api/vault (Paginated evidence records with verdict filtering)
- GET /api/vault/{case_id} (Full forensic record retrieval)
"""

import json
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from database import get_db
from models import EvidenceVault, VaultListResponse, VaultRecordResponse

logger = logging.getLogger("forensiq.routers.vault")
router = APIRouter(prefix="/api/vault", tags=["Evidence Vault"])


@router.get("", response_model=VaultListResponse)
async def list_vault_records(
    limit: int = Query(50, ge=1, le=200, description="Records per page"),
    offset: int = Query(0, ge=0, description="Page offset"),
    filter_verdict: Optional[str] = Query(None, description="Optional verdict filter (e.g. 'Likely Authentic')"),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns paginated and sorted case records from the SQLite evidence vault.
    Uses parameterized queries via SQLAlchemy to prevent SQL injection.
    """
    # Build count query
    count_stmt = select(func.count(EvidenceVault.case_id))
    if filter_verdict:
        count_stmt = count_stmt.where(EvidenceVault.verdict == filter_verdict)

    total_count = (await db.execute(count_stmt)).scalar() or 0

    # Build data query
    stmt = select(EvidenceVault).order_by(desc(EvidenceVault.timestamp_utc)).offset(offset).limit(limit)
    if filter_verdict:
        stmt = stmt.where(EvidenceVault.verdict == filter_verdict)

    result = await db.execute(stmt)
    records = result.scalars().all()

    items: List[VaultRecordResponse] = []
    for r in records:
        try:
            anomalies = json.loads(r.anomalies_json) if r.anomalies_json else []
        except Exception:
            anomalies = [r.anomalies_json] if r.anomalies_json else []

        items.append(
            VaultRecordResponse(
                case_id=r.case_id,
                file_name=r.file_name,
                file_hash=f"SHA256: {r.file_hash}",
                file_size_bytes=r.file_size_bytes,
                mime_type=r.mime_type,
                tamper_probability=r.tamper_probability,
                verdict=r.verdict,
                classification_model=r.classification_model,
                exif_software=r.exif_software,
                camera_make=r.camera_make,
                anomalies=anomalies,
                ela_base64_preview=r.ela_base64_preview,
                timestamp_utc=r.timestamp_utc.isoformat() if r.timestamp_utc else None
            )
        )

    return VaultListResponse(
        total=total_count,
        limit=limit,
        offset=offset,
        items=items
    )


@router.get("/{case_id}", response_model=VaultRecordResponse)
async def get_vault_record(
    case_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves the full historical forensic file metadata, ELA, and anomaly array for a specific case.
    """
    stmt = select(EvidenceVault).where(EvidenceVault.case_id == case_id)
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    if not record:
        logger.warning("[VAULT] Record lookup failed for case %s", case_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence case record '{case_id}' not found in vault."
        )

    try:
        anomalies = json.loads(record.anomalies_json) if record.anomalies_json else []
    except Exception:
        anomalies = [record.anomalies_json] if record.anomalies_json else []

    return VaultRecordResponse(
        case_id=record.case_id,
        file_name=record.file_name,
        file_hash=f"SHA256: {record.file_hash}",
        file_size_bytes=record.file_size_bytes,
        mime_type=record.mime_type,
        tamper_probability=record.tamper_probability,
        verdict=record.verdict,
        classification_model=record.classification_model,
        exif_software=record.exif_software,
        camera_make=record.camera_make,
        anomalies=anomalies,
        ela_base64_preview=record.ela_base64_preview,
        timestamp_utc=record.timestamp_utc.isoformat() if record.timestamp_utc else None
    )
