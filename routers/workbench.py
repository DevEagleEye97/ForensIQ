"""
ForensIQ Workbench Router
Handler: /api/analyze (Multipart Ingestion & 3-Tier Multi-Modal Forensic Analysis)
"""

import asyncio
import os
import json
import uuid
import hashlib
import base64
import io
import logging
from datetime import datetime, timezone
from typing import List, Literal, Optional

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
import filetype
import httpx
import numpy as np
from PIL import Image
from starlette.concurrency import run_in_threadpool

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
    detect_screenshot_recapture,
    generate_simplified_report,
    ChecksContract,
    MetadataContract,
    ForensicImageAnalysisResponse,
    SimplifiedReportContract,
    RecaptureAnalysisContract,
)
from services.ai_inference import (
    query_huggingface_classifier,
    query_openrouter_vision,
    analyze_image_deepfake,
    check_multimodal_consistency
)

logger = logging.getLogger("forensiq.routers.workbench")
router = APIRouter(prefix="/api", tags=["Forensic Workbench"])

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB Security Guard
MAX_IMAGE_PIXELS = 40_000_000  # 40 MP decompression bomb guard


async def _read_file_with_limit(file: UploadFile, max_bytes: int) -> bytes:
    """Read file in chunks, enforcing max size before full load."""
    # Use the underlying file object for chunked reading
    # UploadFile.file is a SpooledTemporaryFile (sync), run in threadpool
    def _read_chunks() -> bytes:
        chunks = []
        total = 0
        # file.file is the underlying SpooledTemporaryFile
        while True:
            chunk = file.file.read(8192)
            if not chunk:
                break
            total += len(chunk)
            if total > max_bytes:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Payload Too Large: File exceeds maximum forensic threshold of {max_bytes // (1024*1024)}MB.",
                )
            chunks.append(chunk)
        return b"".join(chunks)

    return await run_in_threadpool(_read_chunks)


def _guard_image_dimensions(image_bytes: bytes) -> None:
    """Reject images exceeding pixel limit (decompression bomb guard)."""
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            width, height = img.size
            if width * height > MAX_IMAGE_PIXELS:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Image dimensions ({width}×{height} = {width*height:,}px) exceed maximum of {MAX_IMAGE_PIXELS:,} pixels.",
                )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("[INGEST] Could not verify image dimensions: %s", exc)


@router.post("/analyze", response_model=ForensicAnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_evidence(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Forensic Workbench Ingestion & Multi-Tier Analysis Pipeline:
    1. Stream file bytes with 25MB limit enforcement (HTTP 413).
    2. Validate magic bytes using filetype (only image/jpeg & image/png; reject spoofing).
    3. Guard against decompression bombs (max 40MP).
    4. Compute SHA-256 cryptographic hash of raw bytes for forensic chain-of-custody.
    5. Run 4-Check Analytical Engine (delegates to /api/analyze/image logic):
       - Check 1: Spatial Artifact Scan (Laplacian edge variance)
       - Check 2: Frequency Anomaly / ELA (in-memory compression differential)
       - Check 3: Metadata Integrity (EXIF camera + GPS + software fingerprinting)
       - Check 4: GAN Fingerprint (HF ViT classifier + OpenRouter vision model)
    6. Consensus engine → tamper probability + verdict
    7. Persist evidence record into SQLite 'evidence_vault'.
    8. Return structured telemetry payload matching the strict Pydantic contract.
    """
    # ── Step 1: Ingest & Validate ─────────────────────────────────────────────
    file_bytes = await _read_file_with_limit(file, MAX_FILE_SIZE_BYTES)
    file_size = len(file_bytes)

    _guard_image_dimensions(file_bytes)

    kind = filetype.guess(file_bytes)
    if not kind or kind.mime not in ("image/jpeg", "image/png"):
        detected = kind.mime if kind else "unknown / raw bytes"
        logger.warning("[INGEST] Unsupported magic byte signature: %s", detected)
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported Media Type: Allowed image/jpeg and image/png. Detected: {detected}.",
        )

    mime_type = kind.mime
    sanitized_filename = sanitize_text(file.filename or "evidence.bin", max_length=120)

    sha256_hex = hashlib.sha256(file_bytes).hexdigest()

    # ── Step 2: Run 4-Check Analytical Engine ─────────────────────────────────
    # Spatial Artifact Scan
    spatial_status, spatial_std, spatial_obs = await run_in_threadpool(
        run_spatial_artifact_scan, file_bytes
    )

    # Frequency Anomaly / ELA
    ela_status, ela_variance_pct, quantization_status, ela_base64, ela_obs = await run_in_threadpool(
        run_frequency_anomaly_ela, file_bytes, 90, mime_type
    )

    # Metadata Integrity
    meta_status, metadata_contract, meta_obs = await run_in_threadpool(
        run_metadata_integrity, file_bytes, mime_type, file_size
    )

    # External AI (HF + OpenRouter) CONCURRENTLY
    async with httpx.AsyncClient() as client:
        hf_task = query_huggingface_classifier(client, file_bytes, mime_type)
        t3_task = query_openrouter_vision(client, file_bytes, mime_type)
        (hf_score, hf_obs), (t3_score, t3_verdict, t3_obs) = await asyncio.gather(hf_task, t3_task)

    # GAN Fingerprint
    gan_status, gan_obs = evaluate_gan_fingerprint(hf_score, t3_score)

    # Consensus engine
    tamper_probability, verdict, fallback_mode = build_consensus(
        spatial_status=spatial_status,
        ela_status=ela_status,
        ela_variance_pct=ela_variance_pct,
        meta_status=meta_status,
        gan_status=gan_status,
        hf_score=hf_score,
        t3_score=t3_score,
    )

    # Build anomaly narrative (compatible with old response format)
    all_anomalies: list[str] = []
    if spatial_obs:
        all_anomalies.append(f"Observation 1 (Tier 1: {spatial_obs[0]})")
    else:
        all_anomalies.append(f"Observation 1 (Tier 1: Uniform ELA compression distribution with {ela_variance_pct:.1f}% deviation)")

    if hf_obs:
        all_anomalies.append(f"Observation 2 (Tier 2: {hf_obs})")
    elif hf_score is not None:
        all_anomalies.append(f"Observation 2 (Tier 2: Baseline classification verified)")
    else:
        all_anomalies.append("Observation 2 (Tier 2: Classifier unavailable — heuristic fallback)")

    if t3_obs:
        all_anomalies.append(f"Observation 3 (Tier 3: {'; '.join(t3_obs)})")
    elif t3_score is not None:
        all_anomalies.append(f"Observation 3 (Tier 3: Vision model assessed tamper probability at {t3_score}%)")
    else:
        all_anomalies.append("Observation 3 (Tier 3: Vision AI unavailable — heuristic fallback)")

    if meta_obs:
        all_anomalies.extend(f"[Metadata] {o}" for o in meta_obs[:2])
    if gan_obs:
        all_anomalies.append(f"[GAN] {gan_obs[0]}")

    # Classification model label
    if hf_score is not None and t3_score is not None:
        classification_model = "prithivMLmods/Deep-Fake-Detector-v2-Model + OpenRouter Vision Ensemble"
    elif hf_score is not None:
        classification_model = "prithivMLmods/Deep-Fake-Detector-v2-Model"
    elif t3_score is not None:
        classification_model = "OpenRouter Vision Model"
    else:
        classification_model = "Heuristic Fallback (Local ELA + EXIF)"

    # ── Step 3: Persist to evidence_vault ─────────────────────────────────────
    timestamp_prefix = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    case_id = f"CASE-{timestamp_prefix}-{sha256_hex[:8].upper()}"
    case_id_returned = case_id
    warning = None

    try:
        stmt = select(EvidenceVault).where(EvidenceVault.file_hash == sha256_hex)
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()

        if existing:
            case_id = existing.case_id
            case_id_returned = case_id
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
                classification_model=classification_model,
                exif_software=metadata_contract.software,
                camera_make=metadata_contract.camera,
                anomalies_json=json.dumps(all_anomalies),
                ela_base64_preview=ela_base64,
                timestamp_utc=datetime.now(timezone.utc),
            )
            db.add(vault_entry)
            await db.commit()
            logger.info("[VAULT] Archived evidence record %s into evidence_vault table.", case_id)
    except IntegrityError as db_exc:
        await db.rollback()
        # Race condition: another request inserted the same hash
        logger.warning("[VAULT] IntegrityError on insert, re-selecting existing record: %s", db_exc)
        try:
            stmt = select(EvidenceVault).where(EvidenceVault.file_hash == sha256_hex)
            res = await db.execute(stmt)
            existing = res.scalar_one_or_none()
            if existing:
                case_id_returned = existing.case_id
                warning = "Duplicate upload detected — returning existing case ID"
            else:
                case_id_returned = None
                warning = "Database persistence failed — analysis completed but not archived"
        except Exception:
            case_id_returned = None
            warning = "Database persistence failed — analysis completed but not archived"
    except Exception as db_exc:
        await db.rollback()
        logger.error("[VAULT] Failed to persist evidence record: %s", db_exc)
        case_id_returned = None
        warning = "Database persistence failed — analysis completed but not archived"

    # ── Step 4: Return Structured Telemetry JSON Payload Matching Pydantic Contract
    exif_data = ExifDataModel(
        software=metadata_contract.software,
        cameraMake=metadata_contract.camera,
        fileStructure=metadata_contract.fileStructure,
        quantizationHash=quantization_status
    )

    # ── Generate TruthLens Simplified Report & Re-Capture Test ──────────
    recapture = await run_in_threadpool(
        detect_screenshot_recapture, file_bytes, mime_type, metadata_contract.camera
    )
    checks_c = ChecksContract(
        spatialArtifact=spatial_status,
        frequencyAnomaly=ela_status,
        metadataIntegrity=meta_status,
        ganFingerprint=gan_status,
    )
    simplified = generate_simplified_report(
        tamper_probability, verdict, checks_c, recapture, all_anomalies
    )

    return ForensicAnalysisResponse(
        hash=f"SHA256: {sha256_hex}",
        evidence_fingerprint=f"SHA256: {sha256_hex}",
        tamperProbability=tamper_probability,
        verdict=verdict,
        simplified_report=simplified.model_dump(),
        recapture_analysis=recapture.model_dump(),
        classificationModel=classification_model,
        exifData=exif_data,
        anomalies=all_anomalies,
        elaBase64=ela_base64,
        case_id=case_id_returned
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
    1. Ingest & validate (25 MB limit, magic byte check, SHA-256 fingerprint, 40MP bomb guard)
    2. Check 1 — Spatial Artifact Scan (Laplacian edge variance) [threadpool]
    3. Check 2 — Frequency Anomaly / ELA (in-memory compression differential) [threadpool]
    4. Check 3 — Metadata Integrity (EXIF camera + GPS + software fingerprinting) [threadpool]
    5. Check 4 — GAN Fingerprint (HF ViT classifier + OpenRouter vision model)
    6. Consensus engine → tamper probability + verdict
    7. Persist to evidence_vault
    8. Return structured telemetry matching frontend contract
    """

    # ── Step 1: Ingest & Validate ─────────────────────────────────────────────
    file_bytes = await _read_file_with_limit(file, MAX_FILE_SIZE_BYTES)
    file_size = len(file_bytes)

    _guard_image_dimensions(file_bytes)

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
    spatial_status, spatial_std, spatial_obs = await run_in_threadpool(
        run_spatial_artifact_scan, file_bytes
    )

    # ── Step 3: Frequency Anomaly / ELA ──────────────────────────────────────
    ela_status, ela_variance_pct, quantization_status, ela_base64, ela_obs = await run_in_threadpool(
        run_frequency_anomaly_ela, file_bytes, 90, mime_type
    )

    # ── Step 4: Metadata Integrity ────────────────────────────────────────────
    meta_status, metadata_contract, meta_obs = await run_in_threadpool(
        run_metadata_integrity, file_bytes, mime_type, file_size
    )

    # ── Steps 5a & 5b: External AI (HF + OpenRouter) CONCURRENTLY ──────────────────
    async with httpx.AsyncClient() as client:
        hf_task = query_huggingface_classifier(client, file_bytes, mime_type)
        t3_task = query_openrouter_vision(client, file_bytes, mime_type)
        (hf_score, hf_obs), (t3_score, t3_verdict, t3_obs) = await asyncio.gather(hf_task, t3_task)

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
    case_id_returned = case_id

    try:
        stmt = select(EvidenceVault).where(EvidenceVault.file_hash == sha256_hex)
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()

        if existing:
            case_id = existing.case_id
            case_id_returned = case_id
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
    except IntegrityError as db_exc:
        await db.rollback()
        logger.warning("[ANALYZE/IMAGE] IntegrityError on insert, re-selecting: %s", db_exc)
        try:
            stmt = select(EvidenceVault).where(EvidenceVault.file_hash == sha256_hex)
            res = await db.execute(stmt)
            existing = res.scalar_one_or_none()
            if existing:
                case_id_returned = existing.case_id
            else:
                case_id_returned = None
        except Exception:
            case_id_returned = None
    except Exception as db_exc:
        await db.rollback()
        logger.error("[ANALYZE/IMAGE] DB persistence failed: %s", db_exc)
        case_id_returned = None

    # ── Step 8: TruthLens Re-Capture & Plain English Simplification ───────────
    recapture_analysis = await run_in_threadpool(
        detect_screenshot_recapture, file_bytes, mime_type, metadata_contract.camera
    )
    if recapture_analysis.is_recaptured:
        all_anomalies.insert(
            0,
            f"[Screenshot Detection] ⚠️ Re-captured image detected ({recapture_analysis.recapture_confidence}% confidence). "
            + "; ".join(recapture_analysis.signals_detected[:2])
        )
        if tamper_probability >= 45 or spatial_status != "Pass" or ela_status != "Pass":
            recapture_analysis.recapture_adjusted_verdict = "Likely AI (re-captured)"
            verdict = "Likely AI-Generated"

    checks_contract = ChecksContract(
        spatialArtifact=spatial_status,
        frequencyAnomaly=ela_status,
        metadataIntegrity=meta_status,
        ganFingerprint=gan_status,
    )

    simplified_report = generate_simplified_report(
        tamper_probability=tamper_probability,
        verdict=verdict,
        checks=checks_contract,
        recapture=recapture_analysis,
        anomalies=all_anomalies,
    )

    # Build optional signals object with real measured numbers
    signals = {
        "spatial_patch_std": round(spatial_std, 2),
        "ela_variance_pct": round(ela_variance_pct, 2),
        "gan_effective_pct": round(
            (hf_score * 100.0 * 0.6 + float(t3_score) * 0.4) if (hf_score is not None and t3_score is not None)
            else (hf_score * 100.0 if hf_score is not None else float(t3_score) if t3_score is not None else None),
            2
        ) if (hf_score is not None or t3_score is not None) else None
    }

    return ForensicImageAnalysisResponse(
        case_id=case_id_returned,
        evidence_fingerprint=f"SHA256: {sha256_hex}",
        tamperProbability=tamper_probability,
        verdict=verdict,
        simplified_report=simplified_report,
        recapture_analysis=recapture_analysis,
        checks=checks_contract,
        metadata=metadata_contract,
        elaBase64=ela_base64,
        anomalies=all_anomalies,
        classificationModel=classification_model,
        fallbackMode=fallback_mode,
        signals=signals,
    )


# ==============================================================================
# NEW: /api/analyze/multimodal — TruthLens Cross-Modal Correlation
# Verifies if image visual evidence logically supports accompanying text caption
# ==============================================================================

@router.post(
    "/analyze/multimodal",
    status_code=status.HTTP_200_OK,
    summary="TruthLens Multimodal Cross-Modal Consistency Analysis",
    description="Examines cross-modal correlation between image visual evidence and accompanying text caption."
)
async def analyze_multimodal_evidence(
    file: UploadFile = File(...),
    caption: str = Form(""),
    db: AsyncSession = Depends(get_db)
):
    """
    Tier 3 Cross-Modal Verification:
    Checks if accompanying text caption matches visual evidence in the image.
    """
    file_bytes = await _read_file_with_limit(file, MAX_FILE_SIZE_BYTES)
    _guard_image_dimensions(file_bytes)
    sha256_hex = hashlib.sha256(file_bytes).hexdigest()
    b64_img = base64.b64encode(file_bytes).decode("utf-8")

    # 1. Tier 2 Deepfake Classifier (Falconsai/deepfake_detection)
    deepfake_res = await analyze_image_deepfake(file_bytes)

    # 2. Tier 3 Multimodal Cross-Modal Correlation
    consistency_res = await check_multimodal_consistency(b64_img, caption or "Documentary evidence photograph.")

    return {
        "status": "success",
        "case_id": f"MULTI-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{sha256_hex[:8].upper()}",
        "evidence_fingerprint": f"SHA256: {sha256_hex}",
        "caption_analyzed": caption,
        "cross_modal_correlation": consistency_res,
        "deepfake_classifier": deepfake_res,
        "timestamp_utc": datetime.now(timezone.utc).isoformat()
    }


# ==============================================================================
# NEW: /api/analyze/document — Multi-Format Evidence Ingestion via MarkItDown
# Ingests PDF, DOCX, XLSX, PPTX, HTML, CSV, TXT into structured Markdown
# ==============================================================================

from services.document_converter import document_converter
from models import DocumentAnalysisResponse


@router.post(
    "/analyze/document",
    response_model=DocumentAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Multi-Format Forensic Document Ingestion",
    description="Powered by Microsoft MarkItDown. Converts PDF, DOCX, XLSX, PPTX, CSV, HTML, and text evidence into structured Markdown with cryptographic chain-of-custody."
)
async def analyze_document_evidence(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
) -> DocumentAnalysisResponse:
    """
    Ingests and parses document evidence (PDF, DOCX, XLSX, PPTX, CSV, HTML, TXT)
    using Microsoft MarkItDown, generates SHA-256 fingerprint, and archives to vault.
    """
    file_bytes = await _read_file_with_limit(file, MAX_FILE_SIZE_BYTES)
    file_size = len(file_bytes)

    filename = sanitize_text(file.filename or "document.bin", max_length=120)

    try:
        doc_result = document_converter.convert_bytes(file_bytes, filename=filename)
    except Exception as exc:
        logger.error("[DOCUMENT] Conversion error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unable to parse document: file structure is corrupt or unsupported."
        )

    sha256_hex = doc_result["sha256"]
    timestamp_prefix = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    case_id = f"DOC-{timestamp_prefix}-{sha256_hex[:8].upper()}"
    timestamp_iso = datetime.now(timezone.utc).isoformat()

    try:
        from sqlalchemy import select as _select
        stmt = _select(EvidenceVault).where(EvidenceVault.file_hash == sha256_hex)
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()

        if existing:
            case_id = existing.case_id
        else:
            vault_entry = EvidenceVault(
                case_id=case_id,
                file_name=filename,
                file_hash=sha256_hex,
                file_size_bytes=file_size,
                mime_type="application/octet-stream",
                tamper_probability=0,
                verdict="Documentary Evidence Indexed",
                classification_model="Microsoft MarkItDown Ingestion Engine",
                exif_software=None,
                camera_make=None,
                anomalies_json=json.dumps([f"Document converted ({doc_result['word_count']} words, {doc_result['character_count']} chars)"]),
                ela_base64_preview=None,
                timestamp_utc=datetime.now(timezone.utc),
            )
            db.add(vault_entry)
            await db.commit()
    except Exception as db_exc:
        await db.rollback()
        logger.warning("[DOCUMENT] DB archiving skipped: %s", db_exc)

    return DocumentAnalysisResponse(
        case_id=case_id,
        filename=filename,
        sha256=sha256_hex,
        file_size_bytes=file_size,
        title=doc_result["title"],
        markdown_content=doc_result["markdown_content"],
        character_count=doc_result["character_count"],
        word_count=doc_result["word_count"],
        timestamp_utc=timestamp_iso,
    )
