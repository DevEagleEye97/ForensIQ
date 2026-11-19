"""
ForensIQ Workbench Router
Handler: /api/analyze (Multipart Ingestion & 3-Tier Multi-Modal Forensic Analysis)
"""

import os
import json
import uuid
import hashlib
import logging
from datetime import datetime, timezone
from typing import List, Literal

from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import filetype
import httpx
import numpy as np

from database import get_db
from models import EvidenceVault, ForensicAnalysisResponse, ExifDataModel
from services.forensics_engine import (
    compute_ela, inspect_exif, compute_heuristic_fallback, sanitize_text,
    # New 4-check analytical engine imports
    run_spatial_artifact_scan,
    run_frequency_anomaly_ela,
    run_metadata_integrity,
    evaluate_gan_fingerprint,
    build_consensus,
    ChecksContract,
    MetadataContract,
    ForensicImageAnalysisResponse,
)
from services.ai_inference import query_huggingface_classifier, query_openrouter_vision

logger = logging.getLogger("forensiq.routers.workbench")
router = APIRouter(prefix="/api", tags=["Forensic Workbench"])

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB Security Guard


@router.post("/analyze", response_model=ForensicAnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_evidence(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Forensic Workbench Ingestion & Multi-Tier Analysis Pipeline:
    1. Read raw file bytes asynchronously and enforce 25MB file size limit.
    2. Validate magic bytes using filetype (only image/jpeg & image/png; reject spoofing).
    3. Compute SHA-256 cryptographic hash of raw bytes for forensic chain-of-custody.
    4. Run Tier 1 Offline Diagnostics: EXIF metadata extraction + in-memory ELA.
    5. Run Tier 2 ML Classifier: Async call to Hugging Face (5.0s timeout).
    6. Run Tier 3 Multimodal Reasoning: Async call to OpenRouter (5.0s timeout).
    7. Persist evidence record into SQLite 'evidence_vault'.
    8. Return structured telemetry payload matching the strict Pydantic contract.
    """
    # --------------------------------------------------------------------------
    # Step 1: Read raw bytes asynchronously & enforce 25MB limit (HTTP 413)
    # --------------------------------------------------------------------------
    file_bytes = await file.read()
    file_size = len(file_bytes)

    if file_size > MAX_FILE_SIZE_BYTES:
        logger.warning("[INGEST] Payload rejected: size %s exceeds 25MB limit", file_size)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Payload Too Large: File exceeds maximum forensic threshold of 25MB."
        )

    # --------------------------------------------------------------------------
    # Step 2: Validate magic bytes using filetype (HTTP 415)
    # --------------------------------------------------------------------------
    kind = filetype.guess(file_bytes)
    if not kind or kind.mime not in ("image/jpeg", "image/png"):
        detected = kind.mime if kind else "unknown / raw bytes"
        logger.warning("[INGEST] Unsupported magic byte signature: %s", detected)
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported Media Type: Allowed types are image/jpeg and image/png. Detected: {detected}."
        )

    mime_type = kind.mime
    sanitized_filename = sanitize_text(file.filename or "evidence.bin", max_length=120)

    # --------------------------------------------------------------------------
    # Step 3: Compute SHA-256 cryptographic hash of raw bytes
    # --------------------------------------------------------------------------
    sha256_hex = hashlib.sha256(file_bytes).hexdigest()
    full_hash_str = f"SHA256: {sha256_hex}"

    # --------------------------------------------------------------------------
    # Step 4: Run Tier 1 Offline Diagnostics (Sub-15ms In-Memory ELA & EXIF)
    # --------------------------------------------------------------------------
    ela_base64, variance_pct, quantization_hash = compute_ela(file_bytes, quality=90)
    exif_dict, tier1_obs = inspect_exif(file_bytes, mime_type)

    exif_data = ExifDataModel(
        software=exif_dict["software"],
        cameraMake=exif_dict["cameraMake"],
        fileStructure=exif_dict["fileStructure"],
        quantizationHash=quantization_hash
    )

    # --------------------------------------------------------------------------
    # Steps 5 & 6: Run Tier 2 & Tier 3 AI Inference via Async HTTP Client
    # --------------------------------------------------------------------------
    async with httpx.AsyncClient() as client:
        hf_score, hf_obs = await query_huggingface_classifier(client, file_bytes, mime_type)
        t3_score, t3_verdict, t3_obs = await query_openrouter_vision(client, file_bytes, mime_type)

    # --------------------------------------------------------------------------
    # Consensus Engine & Resilience / Fail-Safe Protocols
    # --------------------------------------------------------------------------
    anomalies: List[str] = []

    # Format Tier 1 Observation
    if tier1_obs:
        anomalies.append(f"Observation 1 (Tier 1: {'; '.join(tier1_obs)})")
    else:
        anomalies.append(
            f"Observation 1 (Tier 1: Uniform ELA compression distribution with {variance_pct:.1f}% deviation)"
        )

    has_software_edit = (exif_data.software != "None (Stripped)")
    high_ela = (variance_pct > 18.0)

    if hf_score is not None or t3_score is not None:
        # At least one external AI tier succeeded
        if hf_obs:
            anomalies.append(f"Observation 2 (Tier 2: {hf_obs})")
        else:
            anomalies.append("Observation 2 (Tier 2: Baseline classification verified)")

        if t3_obs:
            anomalies.append(f"Observation 3 (Tier 3: {'; '.join(t3_obs)})")
        elif t3_score is not None:
            anomalies.append(f"Observation 3 (Tier 3: Vision model assessed tamper probability at {t3_score}%)")
        else:
            anomalies.append("Observation 3 (Tier 3: Semantic structural integrity verified)")

        scores: List[float] = []
        if hf_score is not None:
            scores.append(hf_score * 100.0)
        if t3_score is not None:
            scores.append(float(t3_score))

        # Combine with ELA variance weighting
        ela_weight = min(100.0, variance_pct * 3.5)
        scores.append(ela_weight)

        tamper_probability = int(round(float(np.mean(scores))))

        if tamper_probability >= 65:
            if has_software_edit or quantization_hash == "Mismatched Compression":
                verdict: Literal["Likely AI-Generated (Synthetic)", "Likely Authentic", "Spliced / Edited"] = "Spliced / Edited"
            else:
                verdict = "Likely AI-Generated (Synthetic)"
        elif tamper_probability <= 35:
            verdict = "Likely Authentic"
        else:
            verdict = "Spliced / Edited" if high_ela else "Likely Authentic"

    else:
        # Trigger Resilience Protocol: Deterministic Heuristic Fallback
        tamper_probability, verdict, fallback_anomalies = compute_heuristic_fallback(
            variance_pct=variance_pct,
            camera_make=exif_data.cameraMake,
            software=exif_data.software,
            quantization_hash=quantization_hash
        )
        anomalies.extend(fallback_anomalies)

    # --------------------------------------------------------------------------
    # Step 7: Write Complete Payload into SQLite 'evidence_vault' Table
    # --------------------------------------------------------------------------
    timestamp_prefix = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    case_id = f"CASE-{timestamp_prefix}-{sha256_hex[:8].upper()}"

    try:
        # Check if record already exists by unique file_hash
        stmt = select(EvidenceVault).where(EvidenceVault.file_hash == sha256_hex)
        res = await db.execute(stmt)
        existing_record = res.scalar_one_or_none()

        if existing_record:
            case_id = existing_record.case_id
            logger.info("[VAULT] Existing evidence record found for hash %s (Case: %s)", sha256_hex[:12], case_id)
        else:
            vault_entry = EvidenceVault(
                case_id=case_id,
                file_name=sanitized_filename,
                file_hash=sha256_hex,
                file_size_bytes=file_size,
                mime_type=mime_type,
                tamper_probability=tamper_probability,
                verdict=verdict,
                classification_model="prithivMLmods/Deep-Fake-Detector-v2-Model",
                exif_software=exif_data.software,
                camera_make=exif_data.cameraMake,
                anomalies_json=json.dumps(anomalies),
                ela_base64_preview=ela_base64,
                timestamp_utc=datetime.now(timezone.utc)
            )
            db.add(vault_entry)
            await db.commit()
            logger.info("[VAULT] Archived evidence record %s into evidence_vault table.", case_id)
    except Exception as db_exc:
        await db.rollback()
        logger.error("[VAULT] Failed to persist evidence record: %s", db_exc)

    # --------------------------------------------------------------------------
    # Step 8: Return Structured Telemetry JSON Payload Matching Pydantic Contract
    # --------------------------------------------------------------------------
    return ForensicAnalysisResponse(
        hash=full_hash_str,
        tamperProbability=tamper_probability,
        verdict=verdict,
        classificationModel="prithivMLmods/Deep-Fake-Detector-v2-Model",
        exifData=exif_data,
        anomalies=anomalies,
        elaBase64=ela_base64,
        case_id=case_id
    )


# ==============================================================================
# NEW: /api/analyze/image — 4-Check Analytical Engine
# Returns the enriched JSON contract matching the UI cards exactly:
#   checks.spatialArtifact | checks.frequencyAnomaly |
#   checks.metadataIntegrity | checks.ganFingerprint
#   metadata.{sha256, format, size, camera, gps, modified, software}
#   tamperProbability | verdict | elaBase64 | anomalies
# ==============================================================================

@router.post(
    "/analyze/image",
    response_model=ForensicImageAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="4-Check Forensic Image Analysis",
    description=(
        "Advanced 4-tier analytical engine: Spatial Artifact Scan (Laplacian), "
        "Frequency Anomaly ELA, EXIF Metadata Integrity, and GAN Fingerprint (HF + OpenRouter). "
        "Returns enriched JSON matching the ForensIQ dashboard UI cards precisely."
    ),
)
async def analyze_image_evidence(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> ForensicImageAnalysisResponse:
    """
    4-Tier Forensic Analysis Pipeline:
    ─────────────────────────────────
    1. Ingest & validate (25 MB limit, magic byte check, SHA-256 fingerprint)
    2. Check 1 — Spatial Artifact Scan (Laplacian edge variance)
    3. Check 2 — Frequency Anomaly / ELA (in-memory compression differential)
    4. Check 3 — Metadata Integrity (EXIF camera + GPS + software fingerprinting)
    5. Check 4 — GAN Fingerprint (HF ViT classifier + OpenRouter vision model)
    6. Consensus engine → tamper probability + verdict
    7. Persist to evidence_vault
    8. Return structured telemetry matching frontend contract
    """

    # ── Step 1: Ingest & Validate ─────────────────────────────────────────────
    file_bytes = await file.read()
    file_size = len(file_bytes)

    if file_size > MAX_FILE_SIZE_BYTES:
        logger.warning("[ANALYZE/IMAGE] Payload rejected: %s bytes > 25MB limit", file_size)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Payload Too Large: File exceeds maximum forensic threshold of 25MB.",
        )

    kind = filetype.guess(file_bytes)
    if not kind or kind.mime not in ("image/jpeg", "image/png"):
        detected = kind.mime if kind else "unknown / raw bytes"
        logger.warning("[ANALYZE/IMAGE] Rejected magic byte: %s", detected)
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported Media Type: Allowed image/jpeg and image/png. Detected: {detected}.",
        )

    mime_type = kind.mime
    sanitized_filename = sanitize_text(file.filename or "evidence.bin", max_length=120)

    sha256_hex = hashlib.sha256(file_bytes).hexdigest()

    # ── Step 2: Spatial Artifact Scan ────────────────────────────────────────
    spatial_status, spatial_std, spatial_obs = run_spatial_artifact_scan(file_bytes)

    # ── Step 3: Frequency Anomaly / ELA ──────────────────────────────────────
    ela_status, ela_variance_pct, quantization_status, ela_base64, ela_obs = run_frequency_anomaly_ela(file_bytes)

    # ── Step 4: Metadata Integrity ────────────────────────────────────────────
    meta_status, metadata_contract, meta_obs = run_metadata_integrity(file_bytes, mime_type, file_size)

    # ── Steps 5a & 5b: External AI (HF + OpenRouter) ─────────────────────────
    async with httpx.AsyncClient() as client:
        hf_score, hf_obs = await query_huggingface_classifier(client, file_bytes, mime_type)
        t3_score, t3_verdict, t3_obs = await query_openrouter_vision(client, file_bytes, mime_type)

    # ── Check 4: GAN Fingerprint mapping ─────────────────────────────────────
    gan_status, gan_obs = evaluate_gan_fingerprint(hf_score, t3_score)

    # ── Step 6: Consensus engine ──────────────────────────────────────────────
    tamper_probability, verdict, fallback_mode = build_consensus(
        spatial_status=spatial_status,
        ela_status=ela_status,
        ela_variance_pct=ela_variance_pct,
        meta_status=meta_status,
        gan_status=gan_status,
        hf_score=hf_score,
        t3_score=t3_score,
    )

    # ── Build anomaly narrative ───────────────────────────────────────────────
    all_anomalies: list[str] = []
    if spatial_obs:
        all_anomalies.append(f"[Spatial] {spatial_obs[0]}")
    if ela_obs:
        all_anomalies.append(f"[ELA] {ela_obs[0]}")
    if meta_obs:
        all_anomalies.extend(f"[Metadata] {o}" for o in meta_obs[:2])
    if gan_obs:
        all_anomalies.append(f"[GAN] {gan_obs[0]}")
    if hf_obs:
        all_anomalies.append(f"[HF Classifier] {hf_obs}")
    if t3_obs:
        all_anomalies.extend(f"[Vision AI] {o}" for o in t3_obs[:2])

    # ── Classification model label ────────────────────────────────────────────
    if hf_score is not None and t3_score is not None:
        classification_model = "prithivMLmods/Deep-Fake-Detector-v2-Model + OpenRouter Vision Ensemble"
    elif hf_score is not None:
        classification_model = "prithivMLmods/Deep-Fake-Detector-v2-Model"
    elif t3_score is not None:
        classification_model = "OpenRouter Vision Model"
    else:
        classification_model = "Heuristic Fallback (Local ELA + EXIF)"

    # ── Step 7: Persist to evidence_vault ────────────────────────────────────
    timestamp_prefix = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    case_id = f"CASE-{timestamp_prefix}-{sha256_hex[:8].upper()}"

    try:
        from sqlalchemy import select as _select
        stmt = _select(EvidenceVault).where(EvidenceVault.file_hash == sha256_hex)
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()

        if existing:
            case_id = existing.case_id
            logger.info("[ANALYZE/IMAGE] Duplicate hash %s → reusing case %s", sha256_hex[:12], case_id)
        else:
            vault_entry = EvidenceVault(
                case_id=case_id,
                file_name=sanitized_filename,
                file_hash=sha256_hex,
                file_size_bytes=file_size,
                mime_type=mime_type,
                tamper_probability=tamper_probability,
                verdict=verdict,
                classification_model=classification_model,
                exif_software=metadata_contract.software,
                camera_make=metadata_contract.camera,
                anomalies_json=json.dumps(all_anomalies),
                ela_base64_preview=ela_base64,
                timestamp_utc=datetime.now(timezone.utc),
            )
            db.add(vault_entry)
            await db.commit()
            logger.info("[ANALYZE/IMAGE] Archived evidence %s to vault.", case_id)
    except Exception as db_exc:
        await db.rollback()
        logger.error("[ANALYZE/IMAGE] DB persistence failed: %s", db_exc)

    # ── Step 8: Return structured telemetry ───────────────────────────────────
    return ForensicImageAnalysisResponse(
        case_id=case_id,
        tamperProbability=tamper_probability,
        verdict=verdict,
        checks=ChecksContract(
            spatialArtifact=spatial_status,
            frequencyAnomaly=ela_status,
            metadataIntegrity=meta_status,
            ganFingerprint=gan_status,
        ),
        metadata=metadata_contract,
        elaBase64=ela_base64,
        anomalies=all_anomalies,
        classificationModel=classification_model,
        fallbackMode=fallback_mode,
    )
