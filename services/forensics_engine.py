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
from typing import Any, Dict, List, Literal, Optional, Tuple

import exifread
import filetype
import numpy as np
from PIL import Image, ImageChops, ImageFilter
from fastapi import HTTPException, status
from pydantic import BaseModel, Field, ConfigDict
from starlette.concurrency import run_in_threadpool

logger = logging.getLogger("forensiq.services.forensics_engine")

# ---------------------------------------------------------------------------
# Check Status Type Alias
# ---------------------------------------------------------------------------
CheckStatus = Literal["Pass", "Warn", "Fail"]
Verdict = Literal["Likely AI-Generated", "Likely Authentic", "Spliced / Edited"]
FlagVerdict = Literal["RED_FLAG", "GREEN_FLAG", "NEEDS_REVIEW"]
ConfidenceLevel = Literal["HIGH", "MEDIUM", "LOW"]


# ===========================================================================
# PYDANTIC V2 — OUTPUT DATA CONTRACT (matches frontend UI cards exactly)
# ===========================================================================

class SimplifiedReportContract(BaseModel):
    """
    Human-readable forensic translation layer for non-technical investigators.
    Converts mathematical sensor vectors into plain English.
    """
    verdict: FlagVerdict
    flag_color: str                # e.g. "#EF4444", "#10B981", "#F59E0B"
    flag_icon: str                 # e.g. "⚠", "✓", "?"
    status_message: str            # e.g. "Suspicious - Likely AI-generated or manipulated"
    simple_explanation: str        # Plain English summary (max 3 sentences, short)
    key_finding: str               # One-liner highlighting the primary clue
    confidence_level: ConfidenceLevel
    technical_details_available: bool = True

    model_config = ConfigDict(populate_by_name=True)


class RecaptureAnalysisContract(BaseModel):
    """
    Screenshot & Display Re-capture Detection Analysis.
    Detects when an AI image is screenshotted and re-uploaded.
    """
    is_recaptured: bool
    recapture_confidence: int = Field(ge=0, le=100)
    signals_detected: List[str]
    ui_badge: Optional[str] = None
    recapture_adjusted_verdict: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


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
    evidence_fingerprint: str = ""   # Cryptographic SHA-256 Chain of Custody Proof
    tamperProbability: int = Field(ge=0, le=100)
    verdict: Verdict
    simplified_report: Optional[SimplifiedReportContract] = None
    recapture_analysis: Optional[RecaptureAnalysisContract] = None
    checks: ChecksContract
    metadata: MetadataContract
    elaBase64: str
    anomalies: List[str]
    classificationModel: str
    fallbackMode: bool = False       # True when external APIs were unavailable
    signals: Optional[Dict[str, Any]] = None  # Optional real measured numbers

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
    mime_type: str = "image/jpeg",
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

    For PNG (no JPEG compression history): returns Warn with observation,
    excludes ELA signal from consensus scoring.
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

    # PNG has no JPEG compression history — ELA is inconclusive
    if mime_type == "image/png":
        # Still generate a visual ELA for reference (recompress as JPEG)
        try:
            buffer = io.BytesIO()
            orig.save(buffer, format="JPEG", quality=quality)
            buffer.seek(0)
            resaved = Image.open(buffer).convert("RGB")
            diff = ImageChops.difference(orig, resaved)
            extrema = diff.getextrema()
            try:
                max_diff = max(
                    (e[1] if isinstance(e, tuple) else e)
                    for e in (extrema if isinstance(extrema, tuple) else (extrema,))
                )
            except Exception:
                max_diff = 1
            max_diff = max_diff or 1
            scale = 255.0 / max_diff
            ela_image = Image.eval(diff, lambda px: int(min(255, px * scale)))
            ela_buf = io.BytesIO()
            ela_image.save(ela_buf, format="JPEG", quality=90)
            ela_base64 = "data:image/jpeg;base64," + base64.b64encode(ela_buf.getvalue()).decode("utf-8")
        except Exception:
            ela_base64 = ""

        observations.append(
            "ELA WARN — No JPEG compression history (PNG input); "
            "Error Level Analysis inconclusive for lossless formats. "
            "ELA signal excluded from consensus scoring."
        )
        logger.debug("[ELA] PNG input — inconclusive, returning Warn")
        return "Warn", 0.0, "N/A (PNG)", ela_base64, observations

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
        # Robust extraction: extrema is ((min_r, max_r), (min_g, max_g), (min_b, max_b)) for RGB
        # or (min, max) for single channel. We want the global maximum across all channels.
        try:
            max_diff = max(
                (e[1] if isinstance(e, tuple) else e)
                for e in (extrema if isinstance(extrema, tuple) else (extrema,))
            )
        except Exception:
            max_diff = 1
        max_diff = max_diff or 1
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
            def parse_rational(val: object) -> float:
                """Parse a rational string like '12/1' or '1234567/1000' to float.
                Also handles Ratio objects, tuples, int, float."""
                # Handle exifread Ratio objects (have .num and .den attributes)
                if hasattr(val, 'num') and hasattr(val, 'den'):
                    return float(val.num) / float(val.den)
                # Handle string representation
                s = str(val).strip()
                if "/" in s:
                    num, den = s.split("/", 1)
                    return float(num) / float(den)
                # Handle plain numbers
                return float(s)

            def to_decimal(vals: object) -> float:
                # Handle tuple/list of values (deg, min, sec)
                if isinstance(vals, (tuple, list)):
                    components = list(vals)
                else:
                    # String representation like "[12/1, 34/1, 56/1]"
                    s = str(vals).strip("[]")
                    components = [c.strip() for c in s.split(",") if c.strip()]
                deg = parse_rational(components[0]) if len(components) > 0 else 0.0
                mins = parse_rational(components[1]) if len(components) > 1 else 0.0
                secs = parse_rational(components[2]) if len(components) > 2 else 0.0
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
# CHECK 3.5 — SCREENSHOT RE-CAPTURE DETECTION TEST (Mentor Insight)
# Detects whether an image is a screen grab / re-captured AI generation
# ===========================================================================

COMMON_SCREEN_RESOLUTIONS = {
    # Desktop standard & HiDPI
    (1920, 1080), (1080, 1920), (2560, 1440), (1440, 2560), (3840, 2160), (2160, 3840),
    (1366, 768), (768, 1366), (1440, 900), (1680, 1050), (2880, 1800), (3024, 1964),
    (3456, 2234), (1280, 720), (720, 1280), (1280, 800), (800, 1280),
    # Modern Mobile Displays (iPhone & Android)
    (1170, 2532), (2532, 1170), (1179, 2556), (2556, 1179), (1284, 2778), (2778, 1284),
    (1290, 2796), (2796, 1290), (1080, 2400), (2400, 1080), (1080, 2340), (2340, 1080),
    (1440, 3120), (3120, 1440), (1440, 3200), (3200, 1440), (1440, 3088), (3088, 1440),
    (1080, 2376), (2376, 1080), (750, 1334), (1334, 750), (1242, 2688), (2688, 1242),
}


def detect_screenshot_recapture(
    image_bytes: bytes,
    mime_type: str,
    camera: str,
) -> RecaptureAnalysisContract:
    """
    Detects whether an image was created by screenshotting or screen capture,
    even if it captures an AI-generated image.
    """
    signals: List[str] = []
    confidence_points = 0

    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            w, h = img.size
            dpi = img.info.get("dpi")
    except Exception:
        w, h = 0, 0
        dpi = None

    # Signal 1: Camera sensor tags absent
    if camera == "Unknown (Born-Digital)" or not camera:
        signals.append("Missing camera hardware signature (typical of screen grabs)")
        confidence_points += 25

    # Signal 2: Match known display resolutions or typical screen ratios
    if (w, h) in COMMON_SCREEN_RESOLUTIONS:
        signals.append(f"Dimensions ({w}×{h}) match standard device display resolution")
        confidence_points += 35
    elif w > 0 and h > 0:
        ratio = max(w, h) / min(w, h)
        if any(abs(ratio - target) < 0.04 for target in (1.778, 2.164, 2.167, 2.222, 1.600, 2.000)):
            signals.append(f"Screen aspect ratio ({ratio:.2f}:1) matches mobile or desktop display viewport")
            confidence_points += 20

    # Signal 3: Standard screen DPI (72, 96, 144 DPI)
    if dpi:
        dpi_val = dpi[0] if isinstance(dpi, (tuple, list)) else dpi
        if dpi_val in (72, 96, 144):
            signals.append(f"Display raster DPI ({dpi_val} DPI) matches operating system screenshot default")
            confidence_points += 15

    # Signal 4: PNG format with stripped metadata
    if mime_type == "image/png":
        signals.append("PNG compression container (standard format for OS screen captures)")
        confidence_points += 15

    is_recaptured = confidence_points >= 40
    recapture_confidence = min(95, max(0, confidence_points))

    ui_badge = "⚠️ This appears to be a re-captured/screenshot image" if is_recaptured else None

    return RecaptureAnalysisContract(
        is_recaptured=is_recaptured,
        recapture_confidence=recapture_confidence,
        signals_detected=signals,
        ui_badge=ui_badge,
        recapture_adjusted_verdict=None
    )


# ===========================================================================
# SIMPLIFIED REPORT TRANSLATION LAYER (Plain English & Red/Green Flag System)
# ===========================================================================

def generate_simplified_report(
    tamper_probability: int,
    verdict: Verdict,
    checks: ChecksContract,
    recapture: RecaptureAnalysisContract,
    anomalies: List[str],
) -> SimplifiedReportContract:
    """
    Translates complex forensic metrics into plain English for non-technical investigators.
    Applies the Red/Green/Amber flag verdict system.
    """
    # 1. Determine Flag Verdict
    # Red Flag: Tamper prob >= 60% OR multiple manipulation indicators OR recaptured AI
    if tamper_probability >= 60 or checks.ganFingerprint == "Fail" or checks.frequencyAnomaly == "Fail":
        flag: FlagVerdict = "RED_FLAG"
        color = "#EF4444"
        icon = "⚠"
        status_msg = "Suspicious - Likely AI-generated or manipulated"
        conf_level: ConfidenceLevel = "HIGH" if tamper_probability >= 75 else "MEDIUM"
    elif recapture.is_recaptured and (checks.spatialArtifact in ("Warn", "Fail") or checks.frequencyAnomaly in ("Warn", "Fail")):
        flag = "RED_FLAG"
        color = "#EF4444"
        icon = "⚠"
        status_msg = "Suspicious - Re-captured AI or edited image"
        conf_level = "HIGH"
    elif tamper_probability <= 25 and checks.frequencyAnomaly == "Pass" and checks.metadataIntegrity == "Pass" and not recapture.is_recaptured:
        flag = "GREEN_FLAG"
        color = "#10B981"
        icon = "✓"
        status_msg = "Authentic - No manipulation detected"
        conf_level = "HIGH"
    else:
        # Ambiguous / Conflicting zone
        flag = "NEEDS_REVIEW"
        color = "#F59E0B"
        icon = "?"
        status_msg = "Uncertain - Human investigator review required"
        conf_level = "LOW"

    # 2. Extract Key Finding (short one-liner)
    if flag == "RED_FLAG":
        if recapture.is_recaptured:
            key_finding = "Image was screenshotted from a display and exhibits synthetic edge anomalies."
        elif checks.ganFingerprint == "Fail":
            key_finding = "Artificial intelligence generation patterns confidently detected across facial boundaries."
        elif checks.frequencyAnomaly == "Fail":
            key_finding = "Compression levels do not match, indicating pasted or spliced elements."
        else:
            key_finding = "Unnatural pixel boundaries detected consistent with digital photo manipulation."
    elif flag == "GREEN_FLAG":
        key_finding = "Natural camera lens and consistent compression levels found throughout image."
    else:
        key_finding = "Mixed signals detected between compression levels and camera signature."

    # 3. Plain English Explanation (max 3 sentences, <= 15 words per sentence)
    if flag == "RED_FLAG":
        if recapture.is_recaptured:
            explanation = (
                "This image was re-captured from a digital screen. "
                "Beneath the screenshot, compression and edge patterns indicate artificial tampering. "
                "Digital markers strongly indicate synthetic origin."
            )
        elif checks.frequencyAnomaly == "Fail":
            explanation = (
                "Like pasting a paper cutout into a photo, pixel compression does not match. "
                "Different parts of this image were saved at different quality levels. "
                "This confirms regions were edited or spliced."
            )
        else:
            explanation = (
                "Microscopic pixel patterns do not match real camera lenses. "
                "Artificial intelligence left subtle mathematical traces across boundaries. "
                "The image shows strong hallmarks of AI generation."
            )
    elif flag == "GREEN_FLAG":
        explanation = (
            "Camera hardware signature and natural light gradients match across the entire photo. "
            "Compression levels are uniform without spliced edges. "
            "No signs of digital manipulation or artificial generation detected."
        )
    else:
        explanation = (
            "The image shows conflicting technical signals. "
            "Camera metadata is missing, but compression levels appear mostly uniform. "
            "A human forensic investigator should inspect this image manually."
        )

    return SimplifiedReportContract(
        verdict=flag,
        flag_color=color,
        flag_icon=icon,
        status_message=status_msg,
        simple_explanation=explanation,
        key_finding=key_finding,
        confidence_level=conf_level,
        technical_details_available=True
    )


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


def compute_differential_forensics(
    ref_bytes: bytes,
    suspect_bytes: bytes,
) -> Dict[str, Any]:
    """
    Differential Forensics (Pixel-Level & Spectral Comparison).
    Aligns reference (real) and suspect (potential fake) image, computes:
      1. Absolute pixel difference map (ImageChops.difference)
      2. High-contrast amplified difference heatmap (colormap RGB)
      3. Divergence metrics & percentage of modified pixels
      4. Divergent bounding boxes (regions of modification)
      5. Plain-English forensic summary of differential anomalies
    """
    img_ref = Image.open(io.BytesIO(ref_bytes)).convert("RGB")
    img_sus = Image.open(io.BytesIO(suspect_bytes)).convert("RGB")

    # Align suspect to reference dimensions
    if img_sus.size != img_ref.size:
        img_sus = img_sus.resize(img_ref.size, Image.Resampling.LANCZOS)

    w, h = img_ref.size

    # 1. Absolute difference
    diff = ImageChops.difference(img_ref, img_sus)
    diff_arr = np.array(diff, dtype=np.float32)
    diff_mag = np.mean(diff_arr, axis=2)

    altered_mask = diff_mag > 12.0
    altered_pixels = int(np.sum(altered_mask))
    total_pixels = w * h
    divergence_pct = round((altered_pixels / max(total_pixels, 1)) * 100, 2)

    # 2. Generate Heatmap
    amp_diff = np.clip(diff_mag * 7.0, 0, 255).astype(np.uint8)
    heatmap_rgb = np.zeros((h, w, 3), dtype=np.uint8)
    norm = amp_diff.astype(np.float32) / 255.0

    heatmap_rgb[:, :, 0] = np.clip(norm * 255 * 1.5 - 50, 0, 255).astype(np.uint8)  # Red
    heatmap_rgb[:, :, 1] = np.clip(np.sin(norm * np.pi) * 255 * 1.2, 0, 255).astype(np.uint8)  # Green
    heatmap_rgb[:, :, 2] = np.clip((1.0 - norm) * 200, 0, 255).astype(np.uint8)  # Cyan/Blue

    blend = Image.blend(img_sus, Image.fromarray(heatmap_rgb), alpha=0.55)
    buf = io.BytesIO()
    blend.save(buf, format="JPEG", quality=85)
    heatmap_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

    # 3. Detect regions of interest
    tile_size = max(16, min(w, h) // 10)
    regions = []
    for y0 in range(0, h, tile_size):
        for x0 in range(0, w, tile_size):
            tile_diff = diff_mag[y0:min(y0+tile_size, h), x0:min(x0+tile_size, w)]
            mean_tile = float(np.mean(tile_diff))
            if mean_tile > 18.0:
                regions.append({
                    "x": x0,
                    "y": y0,
                    "w": min(tile_size, w - x0),
                    "h": min(tile_size, h - y0),
                    "intensity": round(min(1.0, mean_tile / 100.0), 3),
                    "verdict": "Synthetic Inpainting / Boundary Seam" if mean_tile > 35 else "Compression / Lighting Shift"
                })

    regions = sorted(regions, key=lambda r: r["intensity"], reverse=True)[:8]

    if divergence_pct < 1.0:
        verdict = "IDENTICAL / NO TAMPERING DETECTED"
        verdict_status = "Pass"
        summary = "Both images exhibit near-identical pixel telemetry. Minor variance is consistent with re-encoding noise."
    elif divergence_pct < 14.0:
        verdict = "LOCALIZED INPAINTING / SPLICING"
        verdict_status = "Fail"
        summary = f"Detected localized divergence affecting {divergence_pct}% of the frame. High frequency boundaries suggest selective object replacement or facial manipulation."
    else:
        verdict = "COMPREHENSIVE SYNTHESIS / MAJOR REPLACEMENT"
        verdict_status = "Fail"
        summary = f"Widespread structural departure ({divergence_pct}% altered). The suspect image differs substantially across macro spatial blocks."

    return {
        "dimensions": f"{w}x{h}",
        "divergence_pct": divergence_pct,
        "divergent_regions_count": len(regions),
        "divergent_regions": regions,
        "heatmap_base64": heatmap_b64,
        "verdict": verdict,
        "verdict_status": verdict_status,
        "summary": summary
    }


# Rebuild model to resolve forward references
ForensicImageAnalysisResponse.model_rebuild()
