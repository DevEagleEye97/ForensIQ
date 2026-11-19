"""
ForensIQ Report Router
Handler: /api/report/{case_id}/export (Stream formal Markdown / JSON Forensic Certificate)
"""

import json
import logging
from typing import Literal
from fastapi import APIRouter, Depends, Query, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import EvidenceVault
from services.report_generator import generate_markdown_report, generate_json_report

logger = logging.getLogger("forensiq.routers.report")
router = APIRouter(prefix="/api/report", tags=["Forensic Reports"])


@router.get("/{case_id}/export")
async def export_forensic_certificate(
    case_id: str,
    format: Literal["markdown", "json"] = Query("markdown", description="Report format: markdown or json"),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates and streams a formal, exportable Markdown or JSON forensic certificate
    containing verified evidence findings and cryptographic chain-of-custody attestations.
    """
    stmt = select(EvidenceVault).where(EvidenceVault.case_id == case_id)
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    if not record:
        logger.warning("[REPORT] Certificate generation failed: case '%s' not found", case_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Evidence case record '{case_id}' not found. Cannot generate forensic certificate."
        )

    case_dict = record.to_dict()

    if format == "markdown":
        md_content = generate_markdown_report(case_dict)
        filename = f"forensiq-certificate-{case_id}.md"
        return Response(
            content=md_content,
            media_type="text/markdown; charset=utf-8",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "X-ForensIQ-Case-ID": case_id
            }
        )
    else:
        json_content = generate_json_report(case_dict)
        return Response(
            content=json.dumps(json_content, indent=2),
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="forensiq-certificate-{case_id}.json"',
                "X-ForensIQ-Case-ID": case_id
            }
        )
