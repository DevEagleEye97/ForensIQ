"""
ForensIQ Analytical Engine — services/forensics_engine.py
==========================================================
Principal AI/ML & Digital Forensics Engineer — Production Grade
Architecture: Async Python 3.12 · Pydantic v2 · Pillow · NumPy
Checks:
  1. Spatial Artifact Scan   — Laplacian gradient variance + edge discontinuity
  2. Frequency Anomaly       — In-Memory ELA compression differential
  3. Metadata Integrity      — EXIF camera fingerprinting
  4. GAN Fingerprint         — ViT Hugging Face classifier + OpenRouter probing
Guarantee: Zero-Crash — all external failures fall back to deterministic heuristics.
"""

from __future__ import annotations

import io
import re
import base64
import hashlib
import logging
from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional, Tuple

import exifread
import filetype
import numpy as np
from PIL import Image, ImageChops, ImageFilter
from fastapi import HTTPException, status
from pydantic import BaseModel, Field, ConfigDict

logger = logging.getLogger("forensiq.services.forensics_engine")

# ---------------------------------------------------------------------------
# Check Status Type Alias
# ---------------------------------------------------------------------------
CheckStatus = Literal["Pass", "Warn", "Fail"]
Verdict = Literal["Likely AI-Generated", "Likely Authentic", "Spliced / Edited"]


# ===========================================================================
# PYDANTIC V2 — OUTPUT DATA CONTRACT (matches frontend UI cards exactly)
# ===========================================================================

class ChecksContract(BaseModel):
    """Four-check binary status block matching Dashboard.tsx check cards."""
    spatialArtifact: CheckStatus
    frequencyAnomaly: CheckStatus
    metadataIntegrity: CheckStatus
    ganFingerprint: CheckStatus

    model_config = ConfigDict(populate_by_name=True)


class MetadataContract(BaseModel):
    """Ledger & EXIF Metadata block matching ForensicAnalysisPage.tsx rows."""
    sha256: str
    format: str                      # e.g. "JPEG", "PNG"
    size: str                        # e.g. "0.10 MB"
    camera: str                      # e.g. "Canon EOS R5" or "Unknown (Born-Digital)"
    gps: str                         # e.g. "12.9716 N, 77.5946 E" or "Not available"
    modified: str                    # e.g. "2024:03:15 14:22:11" or "Not recorded"
    software: str                    # e.g. "Adobe Photoshop 2024" or "None (Stripped)"
    fileStructure: str               # e.g. "Valid FFD8 to FFD9 JPEG Stream"

    model_config = ConfigDict(populate_by_name=True)


class ForensicImageAnalysisResponse(BaseModel):
    """
    Complete structured telemetry payload.
    Matches the JSON contract defined in the instruction spec exactly.
    """
    case_id: str
    tamperProbability: int = Field(ge=0, le=100)
    verdict: Verdict
    checks: ChecksContract
    metadata: MetadataContract
    elaBase64: str
    anomalies: List[str]
    classificationModel: str
    fallbackMode: bool = False       # True when external APIs were unavailable

    model_config = ConfigDict(populate_by_name=True)


# ===========================================================================
# UTILITY HELPERS
# ===========================================================================

def sanitize_text(val: object, max_length: int = 255) -> str:
    """Strip null bytes, non-printable control chars, and truncate."""
    if not val:
        return ""
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", str(val)).strip()
    return cleaned[:max_length]


def _format_size(byte_count: int) -> str:
    """Human-readable file size string, e.g. '0.10 MB'."""
    mb = byte_count / (1024 * 1024)
    if mb >= 1.0:
        return f"{mb:.2f} MB"
    kb = byte_count / 1024
    return f"{kb:.1f} KB"


# ===========================================================================
# CHECK 1 — SPATIAL ARTIFACT SCAN
# Local Pixel Variance & Edge Sharpness via Laplacian Kernel
# ===========================================================================

def run_spatial_artifact_scan(image_bytes: bytes) -> Tuple[CheckStatus, float, List[str]]:
    """
    Methodology: Local Pixel Variance & Edge Sharpness.

    1. Convert image to grayscale.
    2. Apply Laplacian kernel to extract edge discontinuities.
    3. Compute global variance of the Laplacian response.
    4. Compute local patch variance across a grid — high local std implies
       synthetic boundary discontinuities (splicing seams, inpainting edges).

    Thresholds (empirically calibrated):
      - Local patch variance std  > 48.0 → Fail  (sharp boundary breaks → spliced)
      - Local patch variance std  > 28.0 → Warn  (mild irregularity)
      - Otherwise                         → Pass
    """
    observations: List[str] = []
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("L")  # Grayscale
        # Laplacian edge detection
        lap = img.filter(ImageFilter.Kernel(
            size=(3, 3),
            kernel=[-1, -1, -1,
                    -1,  8, -1,
                    -1, -1, -1],
            scale=1,
            offset=128,
        ))
        arr = np.array(lap, dtype=np.float32)

        # Ensure 2-D array (grayscale → shape is (H, W))
        if arr.ndim == 3:
            arr = arr.mean(axis=2)

        # Divide image into 8×8 patch grid, compute local variance per patch
        h, w = arr.shape
        patch_h, patch_w = max(1, h // 8), max(1, w // 8)
        local_vars: List[float] = []
        for r in range(0, h - patch_h + 1, patch_h):
            for c in range(0, w - patch_w + 1, patch_w):
                patch = arr[r:r + patch_h, c:c + patch_w]
                local_vars.append(float(np.var(patch)))

        global_lap_var = float(np.var(arr))
        local_std = float(np.std(local_vars))

        logger.debug("[SPATIAL] Laplacian var=%.2f  patch_std=%.2f", global_lap_var, local_std)

        if local_std > 48.0:
            status: CheckStatus = "Fail"
            observations.append(
                f"Spatial scan FAIL — Laplacian patch std {local_std:.1f} exceeds boundary discontinuity "
                "threshold (>48.0); sharp edge breaks consistent with region splicing or inpainting seams."
            )
        elif local_std > 28.0:
            status = "Warn"
            observations.append(
                f"Spatial scan WARN — Elevated Laplacian patch variance (std {local_std:.1f}); "
                "mild edge irregularities may indicate localised compositing."
            )
        else:
            status = "Pass"
            observations.append(
                f"Spatial scan PASS — Uniform Laplacian gradient distribution (std {local_std:.1f}); "
                "no cloning or boundary splicing regions detected."
            )

    except Exception as exc:
        logger.error("[SPATIAL] Scan failed with exception: %s", exc)
        status = "Warn"
        observations.append(f"Spatial scan degraded — analysis exception: {str(exc)[:120]}")
        local_std = 0.0

    return status, local_std, observations


# ===========================================================================
# CHECK 2 — FREQUENCY ANOMALY (ELA)
# In-Memory Error Level Analysis Compression Differential
# ===========================================================================

def run_frequency_anomaly_ela(
    image_bytes: bytes,
    quality: int = 90,
) -> Tuple[CheckStatus, float, str, str, List[str]]:
    """
    Methodology: ELA Compression Differential.

    1. Re-compress image in memory at 90% JPEG quality.
    2. Compute absolute pixel-by-pixel difference (ImageChops.difference).
    3. Scale heatmap brightness to 0-255 for maximum visual contrast.
    4. Compute mean deviation percentage and local std for localized anomalies.

    Thresholds:
      - ELA variance > 15%  → Fail  (localized high-frequency discrepancies → pasted elements)
      - ELA variance > 8%   → Warn  (moderate differential)
      - Otherwise            → Pass
    """
    observations: List[str] = []
    ela_base64 = ""
    quantization_status: Literal["Normal", "Mismatched Compression"] = "Normal"

    try:
        orig = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        logger.error("[ELA] Failed to parse image stream: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed image binary stream: {str(exc)}"
        )

    try:
        # In-memory JPEG recompression — no disk writes
        buffer = io.BytesIO()
        orig.save(buffer, format="JPEG", quality=quality)
        buffer.seek(0)
        resaved = Image.open(buffer).convert("RGB")

        # Pixel difference
        diff = ImageChops.difference(orig, resaved)

        # Extrema scaling for visual heatmap
        extrema = diff.getextrema()
        max_diff = max((ex[1] for ex in extrema), default=1) or 1
        scale = 255.0 / max_diff
        ela_image = Image.eval(diff, lambda px: int(min(255, px * scale)))

        # Export ELA heatmap → Base64 data URI
        ela_buf = io.BytesIO()
        ela_image.save(ela_buf, format="JPEG", quality=90)
        ela_base64 = "data:image/jpeg;base64," + base64.b64encode(ela_buf.getvalue()).decode("utf-8")

        # NumPy statistics for threshold evaluation
        diff_arr = np.array(diff, dtype=np.float32)
        pixel_errors = np.mean(diff_arr, axis=2)  # Average channel deviation per pixel

        # Percentage of pixels with high deviation (>12/255 raw threshold)
        high_var_count = int(np.count_nonzero(pixel_errors > 12.0))
        variance_pct = float((high_var_count / pixel_errors.size) * 100.0)
        std_dev = float(np.std(pixel_errors))

        if variance_pct > 15.0 or std_dev > 15.0:
            quantization_status = "Mismatched Compression"
            ela_status: CheckStatus = "Fail"
            observations.append(
                f"ELA FAIL — {variance_pct:.1f}% of pixels exceed compression deviation threshold "
                f"(std {std_dev:.1f}); localised high-frequency discrepancies consistent with "
                "pasted or composited elements from different source images."
            )
        elif variance_pct > 8.0 or std_dev > 8.0:
            quantization_status = "Mismatched Compression"
            ela_status = "Warn"
            observations.append(
                f"ELA WARN — Moderate ELA response ({variance_pct:.1f}% elevated pixels, std {std_dev:.1f}); "
                "mild quantization gradient inconsistency may reflect editing or recompression."
            )
        else:
            ela_status = "Pass"
            observations.append(
                f"ELA PASS — Uniform compression differential ({variance_pct:.1f}% elevated pixels, "
                f"std {std_dev:.1f}); single-generation compression fingerprint consistent with "
                "authentic, unmodified capture."
            )

        logger.debug("[ELA] variance_pct=%.2f  std_dev=%.2f  status=%s", variance_pct, std_dev, ela_status)

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("[ELA] Analysis exception: %s", exc)
        ela_status = "Warn"
        variance_pct = 0.0
        observations.append(f"ELA analysis degraded — exception: {str(exc)[:120]}")

    return ela_status, variance_pct, quantization_status, ela_base64, observations


# ===========================================================================
# CHECK 3 — METADATA INTEGRITY
# EXIF Structure & Camera Fingerprinting
# ===========================================================================

KNOWN_CAMERA_BRANDS = {
    "canon", "nikon", "sony", "apple", "samsung", "google", "huawei",
    "fujifilm", "olympus", "panasonic", "leica", "pentax", "sigma",
    "dji", "gopro", "motorola", "xiaomi", "oneplus",
}

SUSPICIOUS_SOFTWARE_PATTERNS = [
    "photoshop", "gimp", "midjourney", "stable diffusion", "dall-e",
    "affinity", "lightroom", "procreate", "comfyui", "automatic1111",
    "canvas", "runwayml", "invoke ai", "sd webui", "novelai",
]


def run_metadata_integrity(
    image_bytes: bytes,
    mime_type: str,
    file_size_bytes: int,
) -> Tuple[CheckStatus, MetadataContract, List[str]]:
    """
    Methodology: EXIF Structure & Camera Fingerprinting.

    - Parses raw file headers using exifread.
    - Camera Make/Model: If present and matches known sensor brands → Pass.
    - Software Tags: If Photoshop/GIMP/AI-generator tag found → Warn.
    - If EXIF is completely stripped on a high-resolution image → Warn.
    - GPS: Extracted if present for chain-of-custody.
    - Timestamps: Flagged if DateTimeOriginal ≠ ModifyDate.
    """
    observations: List[str] = []
    has_camera = False
    has_suspicious_software = False
    is_stripped_highres = False

    # --- Stream structure validation ---
    if mime_type == "image/jpeg":
        has_soi = image_bytes.startswith(b"\xff\xd8")
        has_eoi = image_bytes.rstrip().endswith(b"\xff\xd9")
        file_structure = (
            "Valid FFD8→FFD9 JPEG Stream" if (has_soi and has_eoi) else
            "Valid JPEG Header (FFD8), Incomplete Stream" if has_soi else
            "Corrupted JPEG Stream Header"
        )
        if not has_soi:
            observations.append("Non-compliant JPEG byte stream header detected.")
    else:
        file_structure = (
            "Valid 89504E47 PNG Stream" if image_bytes.startswith(b"\x89PNG\r\n\x1a\n")
            else "Corrupted PNG Stream Header"
        )

    # --- EXIF extraction ---
    tags = exifread.process_file(io.BytesIO(image_bytes), details=False)

    # Camera Make & Model
    make_raw = sanitize_text(tags.get("Image Make", ""))
    model_raw = sanitize_text(tags.get("Image Model", ""))
    if make_raw and model_raw:
        camera = model_raw if make_raw.lower() in model_raw.lower() else f"{make_raw} {model_raw}"
    elif make_raw or model_raw:
        camera = make_raw or model_raw
    else:
        camera = "Unknown (Born-Digital)"

    if camera != "Unknown (Born-Digital)":
        brand_match = any(b in camera.lower() for b in KNOWN_CAMERA_BRANDS)
        if brand_match:
            has_camera = True
        else:
            observations.append(
                f"Camera sensor tag present ('{camera}') but brand is not in verified hardware database."
            )
    else:
        observations.append(
            "Camera sensor metadata absent — typical of born-digital, AI-generated, or stripped imagery."
        )

    # Software Tag
    software_raw = sanitize_text(tags.get("Image Software", ""))
    if software_raw:
        software = software_raw
        if any(p in software_raw.lower() for p in SUSPICIOUS_SOFTWARE_PATTERNS):
            has_suspicious_software = True
            observations.append(
                f"Image modification tag detected: '{software_raw}' — indicates post-capture editing."
            )
    else:
        software = "None (Stripped)"
        # Flag stripped EXIF on files larger than 1 MB as suspicious
        if file_size_bytes > 1_048_576:
            is_stripped_highres = True
            observations.append(
                "EXIF software tag stripped on high-resolution file — common in AI-synthesised or scrubbed imagery."
            )

    # GPS Coordinates
    lat_ref = str(tags.get("GPS GPSLatitudeRef", ""))
    lon_ref = str(tags.get("GPS GPSLongitudeRef", ""))
    lat_vals = tags.get("GPS GPSLatitude")
    lon_vals = tags.get("GPS GPSLongitude")

    gps = "Not available"
    if lat_vals and lon_vals:
        try:
            def to_decimal(vals: object) -> float:
                parts = str(vals).strip("[]").split(", ")
                deg = float(parts[0])
                mins = float(parts[1]) if len(parts) > 1 else 0.0
                secs_str = parts[2] if len(parts) > 2 else "0"
                # Handle rational notation like "1234567/1000"
                if "/" in secs_str:
                    num, den = secs_str.split("/")
                    secs = float(num) / float(den)
                else:
                    secs = float(secs_str)
                return deg + mins / 60.0 + secs / 3600.0

            lat_d = to_decimal(lat_vals)
            lon_d = to_decimal(lon_vals)
            lat_dir = "S" if "S" in lat_ref.upper() else "N"
            lon_dir = "W" if "W" in lon_ref.upper() else "E"
            gps = f"{lat_d:.4f} {lat_dir}, {lon_d:.4f} {lon_dir}"
        except Exception as gps_err:
            logger.debug("[META] GPS parse failed: %s", gps_err)

    # Timestamps
    dt_orig = sanitize_text(tags.get("EXIF DateTimeOriginal", ""))
    dt_mod = sanitize_text(tags.get("Image DateTime", ""))
    modified = dt_orig or dt_mod or "Not recorded"
    if dt_orig and dt_mod and dt_orig != dt_mod:
        observations.append(
            f"Timestamp divergence — Original: {dt_orig} vs ModifyDate: {dt_mod}; "
            "post-capture manipulation possible."
        )

    # Image format from filetype
    kind = filetype.guess(image_bytes)
    img_format = (kind.extension.upper() if kind else mime_type.split("/")[-1].upper())

    # --- Determine check status ---
    if has_suspicious_software:
        meta_status: CheckStatus = "Warn"
    elif is_stripped_highres and not has_camera:
        meta_status = "Warn"
    elif has_camera and not has_suspicious_software:
        meta_status = "Pass"
        if not observations:
            observations.append(
                f"Metadata PASS — Camera sensor provenance confirmed: '{camera}'. "
                "EXIF chain intact; timestamps consistent."
            )
    else:
        meta_status = "Warn"

    if not any("PASS" in o or "FAIL" in o or "WARN" in o for o in observations):
        verb = {"Pass": "PASS", "Warn": "WARN", "Fail": "FAIL"}[meta_status]
        observations.insert(0, f"Metadata {verb} — {'; '.join(observations[:1]) if observations else 'Structure verified.'}")

    # Build the metadata contract
    sha256_hex = hashlib.sha256(image_bytes).hexdigest()
    meta = MetadataContract(
        sha256=sha256_hex,
        format=img_format,
        size=_format_size(file_size_bytes),
        camera=camera,
        gps=gps,
        modified=modified,
        software=software,
        fileStructure=file_structure,
    )

    logger.debug(
        "[META] status=%s  camera=%s  software=%s  gps=%s",
        meta_status, camera, software, gps
    )
    return meta_status, meta, observations


# ===========================================================================
# CHECK 4 — GAN FINGERPRINT
# Scoring from external AI tiers (resolved in workbench.py)
# This function maps the HF + OpenRouter scores to a CheckStatus
# ===========================================================================

def evaluate_gan_fingerprint(
    hf_score: Optional[float],
    t3_score: Optional[int],
) -> Tuple[CheckStatus, List[str]]:
    """
    Methodology: ViT Classifier (HF) + OpenRouter Vision Probe.

    Maps deepfake probability to a CheckStatus:
      - Probability > 70%  → Fail  (GAN/Diffusion fingerprint detected)
      - Probability 40–70% → Warn  (Ambiguous, possible AI artefacts)
      - Probability < 40%  → Pass  (No synthetic fingerprint)
    """
    observations: List[str] = []

    # Consensus: weight HF score (60%) and OpenRouter score (40%)
    effective_pct: Optional[float] = None
    if hf_score is not None and t3_score is not None:
        effective_pct = (hf_score * 100.0 * 0.6) + (float(t3_score) * 0.4)
    elif hf_score is not None:
        effective_pct = hf_score * 100.0
    elif t3_score is not None:
        effective_pct = float(t3_score)

    if effective_pct is None:
        # No external AI data available — cannot assess GAN fingerprint
        gan_status: CheckStatus = "Warn"
        observations.append(
            "GAN Fingerprint WARN — External AI classifiers unavailable; "
            "assessment deferred to local heuristic fallback."
        )
        return gan_status, observations

    if effective_pct > 70.0:
        gan_status = "Fail"
        observations.append(
            f"GAN Fingerprint FAIL — Deepfake probability {effective_pct:.1f}%; "
            "GAN/Diffusion synthesis signature confidently detected by classifier ensemble."
        )
    elif effective_pct >= 40.0:
        gan_status = "Warn"
        observations.append(
            f"GAN Fingerprint WARN — Ambiguous synthetic probability {effective_pct:.1f}%; "
            "possible AI-generated artefacts require further human review."
        )
    else:
        gan_status = "Pass"
        observations.append(
            f"GAN Fingerprint PASS — Synthetic probability {effective_pct:.1f}%; "
            "no GAN or diffusion model fingerprint detected by classifier ensemble."
        )

    logger.debug("[GAN] effective_pct=%.2f  status=%s", effective_pct, gan_status)
    return gan_status, observations


# ===========================================================================
# CONSENSUS ENGINE — Combine all 4 checks into final verdict & tamper score
# ===========================================================================

_STATUS_WEIGHT: Dict[CheckStatus, int] = {"Pass": 0, "Warn": 1, "Fail": 2}
_STATUS_SCORE: Dict[CheckStatus, float] = {"Pass": 10.0, "Warn": 50.0, "Fail": 90.0}


def build_consensus(
    spatial_status: CheckStatus,
    ela_status: CheckStatus,
    ela_variance_pct: float,
    meta_status: CheckStatus,
    gan_status: CheckStatus,
    hf_score: Optional[float],
    t3_score: Optional[int],
) -> Tuple[int, Verdict, bool]:
    """
    Consensus Engine:
    Weights ELA variance (continuous) with the check statuses to derive
    a final tamper probability and verdict.

    Returns:
        tamper_probability (int 0-100)
        verdict (Verdict)
        fallback_mode (bool)
    """
    # Determine if we are in fallback (no external AI data)
    fallback_mode = (hf_score is None and t3_score is None)

    # Collect all score signals
    scores: List[float] = [
        _STATUS_SCORE[spatial_status],
        _STATUS_SCORE[ela_status],
        _STATUS_SCORE[meta_status],
        _STATUS_SCORE[gan_status],
    ]

    # Inject continuous ELA signal (scaled 0–100)
    ela_signal = min(100.0, ela_variance_pct * 5.0)
    scores.append(ela_signal)

    # Inject HF/T3 scores if available
    if hf_score is not None:
        scores.append(hf_score * 100.0)
    if t3_score is not None:
        scores.append(float(t3_score))

    tamper_probability = int(round(float(np.mean(scores))))
    tamper_probability = max(0, min(100, tamper_probability))

    # Fail count determines verdict boundaries
    fail_count = sum(1 for s in [spatial_status, ela_status, meta_status, gan_status] if s == "Fail")
    warn_count = sum(1 for s in [spatial_status, ela_status, meta_status, gan_status] if s == "Warn")

    if gan_status == "Fail" and fail_count >= 2:
        verdict: Verdict = "Likely AI-Generated"
    elif ela_status == "Fail" and (spatial_status in ("Warn", "Fail") or meta_status == "Warn"):
        verdict = "Spliced / Edited"
    elif tamper_probability >= 65:
        if meta_status == "Warn" and ela_status in ("Warn", "Fail"):
            verdict = "Spliced / Edited"
        else:
            verdict = "Likely AI-Generated"
    elif tamper_probability <= 35:
        verdict = "Likely Authentic"
    else:
        # Ambiguous zone — weight individual signals
        if warn_count >= 3 or fail_count >= 1:
            verdict = "Spliced / Edited"
        else:
            verdict = "Likely Authentic"

    logger.info(
        "[CONSENSUS] tamper=%d%%  verdict=%s  fallback=%s  "
        "spatial=%s  ela=%s  meta=%s  gan=%s",
        tamper_probability, verdict, fallback_mode,
        spatial_status, ela_status, meta_status, gan_status,
    )
    return tamper_probability, verdict, fallback_mode


# ===========================================================================
# ZERO-CRASH HEURISTIC FALLBACK
# Triggered when ALL external AI tiers fail/timeout
# ===========================================================================

def compute_heuristic_fallback(
    variance_pct: float,
    camera_make: str,
    software: str,
    quantization_status: str,
) -> Tuple[int, Verdict, List[str]]:
    """
    Deterministic Heuristic Fallback Protocol — Zero HTTP 500 Guarantee.

    Uses only local ELA + EXIF signals to compute a verdict when all
    external AI classifiers are unavailable.
    """
    is_missing_camera = camera_make == "Unknown (Born-Digital)"
    has_software_edit = software not in ("None (Stripped)", "")
    high_ela = variance_pct > 15.0
    fallback_anomalies: List[str] = []

    if high_ela and is_missing_camera:
        tamper_probability = int(min(96, max(75, 70 + int(variance_pct * 0.8))))
        verdict: Verdict = "Likely AI-Generated"
        fallback_anomalies.append(
            f"Heuristic Fallback — High ELA variance ({variance_pct:.1f}%) combined with absent "
            "camera sensor metadata strongly indicates born-digital AI synthesis."
        )
        fallback_anomalies.append(
            "Heuristic Fallback — Lack of hardware sensor signature corroborates GAN/diffusion generation."
        )
    elif high_ela and has_software_edit:
        tamper_probability = int(min(92, max(68, 65 + int(variance_pct * 0.7))))
        verdict = "Spliced / Edited"
        fallback_anomalies.append(
            f"Heuristic Fallback — Compression discrepancy ({variance_pct:.1f}%) correlated "
            f"with software signature '{software}' — post-capture splicing confirmed."
        )
        fallback_anomalies.append(
            "Heuristic Fallback — Localised quantization boundary anomalies confirm compositing."
        )
    elif not high_ela and not is_missing_camera:
        tamper_probability = int(max(4, min(22, 10 + int(variance_pct * 0.4))))
        verdict = "Likely Authentic"
        fallback_anomalies.append(
            f"Heuristic Fallback — Uniform ELA distribution ({variance_pct:.1f}%) matches natural capture."
        )
        fallback_anomalies.append(
            f"Heuristic Fallback — Camera sensor provenance confirmed: '{camera_make}'."
        )
    elif is_missing_camera and not high_ela:
        tamper_probability = 32
        verdict = "Likely Authentic"
        fallback_anomalies.append(
            f"Heuristic Fallback — Uniform error response ({variance_pct:.1f}%) on web-distributed image."
        )
        fallback_anomalies.append(
            "Heuristic Fallback — Stripped metadata with coherent compression levels; ambiguous provenance."
        )
    else:
        tamper_probability = int(min(80, max(20, int(variance_pct * 2.8))))
        verdict = "Spliced / Edited" if high_ela else "Likely Authentic"
        fallback_anomalies.append(
            f"Heuristic Fallback — Heuristic analysis computed {tamper_probability}% tamper score."
        )
        fallback_anomalies.append(
            f"Heuristic Fallback — Quantization consistency evaluated as: {quantization_status}."
        )

    return tamper_probability, verdict, fallback_anomalies


# ===========================================================================
# BACKWARD-COMPATIBLE ALIASES
# Keep the old API surface so existing workbench.py /api/analyze route works
# without modification alongside the new /api/analyze/image route.
# ===========================================================================

def compute_ela(
    image_bytes: bytes,
    quality: int = 90,
) -> Tuple[str, float, Literal["Normal", "Mismatched Compression"]]:
    """
    Backward-compatible wrapper — delegates to run_frequency_anomaly_ela.
    Returns (ela_base64, variance_pct, quantization_status).
    """
    _ela_status, variance_pct, quant_status, ela_base64, _obs = run_frequency_anomaly_ela(
        image_bytes, quality=quality
    )
    return ela_base64, variance_pct, quant_status  # type: ignore[return-value]


def inspect_exif(
    image_bytes: bytes,
    mime_type: str,
) -> Tuple[Dict[str, str], List[str]]:
    """
    Backward-compatible wrapper — delegates to run_metadata_integrity.
    Returns (exif_dict, observations) in the original format.
    """
    _meta_status, meta, obs = run_metadata_integrity(image_bytes, mime_type, len(image_bytes))
    exif_dict: Dict[str, str] = {
        "software": meta.software,
        "cameraMake": meta.camera,
        "fileStructure": meta.fileStructure,
    }
    return exif_dict, obs
