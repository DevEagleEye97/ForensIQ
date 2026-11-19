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
import struct
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
Verdict = Literal[
    "Likely AI-Generated",
    "Likely Authentic",
    "Authentic (Metadata Stripped)",
    "Spliced / Edited",
    "Needs Review",
    "Needs Human Review"
]
FlagVerdict = Literal["RED_FLAG", "GREEN_FLAG", "NEEDS_REVIEW", "AMBER", "RED", "GREEN", "ORANGE"]
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
    hidden_code_found: Optional[str] = None
    limitations: Optional[str] = None
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
    hidden_code_found: Optional[str] = None
    decompiled_markers: Optional[List[str]] = None
    latency_ms: int = Field(default=0, ge=0)

    model_config = ConfigDict(populate_by_name=True)


# ===========================================================================
# BYTE-LEVEL IMAGE DECOMPILER — PARSE IMAGE BYTES & HIDDEN SIGNATURES
# Methodology: Walk raw PNG chunks & JPEG APPn markers for positive proof of AI.
# Axiom: Absence of evidence is not evidence of AI.
# ===========================================================================

GENERATOR_SIGNATURES = [
    "midjourney", "stable diffusion", "a1111", "comfyui", "dall", "openai",
    "imagen", "flux", "black forest", "synthid", "c2pa", "contentauth",
    "firefly", "adobe", "sora", "runway", "pika", "kling", "leonardo",
    "ideogram", "recraft", "trained with", "ai_generated", "ai-generated",
]
CAMERA_KEYS = ["Make", "Model", "LensModel", "ISOSpeedRatings", "FocalLength", "ExposureTime"]
EDIT_KEYS   = ["Adobe Photoshop", "GIMP", "Affinity", "Lightroom", "Snapseed"]


def parse_image_bytes(raw: bytes) -> Dict[str, Any]:
    """
    Decompile the image at the raw byte level:
    Walk raw markers, chunks, and segments to extract hidden generator signatures,
    C2PA provenance manifests, camera sensor metadata, and editing software traces.
    """
    out: Dict[str, Any] = {
        "format": None,
        "markers": [],
        "generator_signature": None,
        "camera_exif": {},
        "software_signature": None,
        "c2pa_manifest": False,
        "png_text_chunks": [],
        "decompiled_clues": [],
    }

    if not raw or len(raw) < 16:
        return out

    # ---- PNG path (Stable Diffusion / ComfyUI embed prompt/workflow in tEXt/iTXt chunks) ----
    if raw[:8] == b"\x89PNG\r\n\x1a\n":
        out["format"] = "png"
        i = 8
        raw_len = len(raw)
        while i < raw_len - 8:
            try:
                length = struct.unpack(">I", raw[i:i+4])[0]
                ctype = raw[i+4:i+8].decode("latin-1", "ignore")
                data = raw[i+8:i+8+length]
                if ctype in ("tEXt", "iTXt", "zTXt"):
                    txt = data.decode("latin-1", "ignore").lower()
                    out["png_text_chunks"].append(f"{ctype}:{txt[:120]}")
                    for sig in GENERATOR_SIGNATURES:
                        if sig in txt and not out["generator_signature"]:
                            out["generator_signature"] = sig
                            out["decompiled_clues"].append(
                                f"PNG {ctype} chunk contains positive AI generator signature: '{sig}'"
                            )
                if ctype == "IEND":
                    break
                i += 12 + length
            except Exception:
                break

    # ---- JPEG path (walk APPn markers: EXIF/XMP/C2PA/JUMBF live here) ----
    elif raw[:2] == b"\xff\xd8":
        out["format"] = "jpeg"
        i = 2
        raw_len = len(raw)
        while i < raw_len - 4:
            if raw[i] != 0xFF:
                i += 1
                continue
            marker = raw[i+1]
            if marker in (0xD8, 0xD9):  # SOI / EOI
                out["markers"].append(f"FF{marker:02X}")
                if marker == 0xD9:
                    break
                i += 2
                continue
            if marker in range(0xD0, 0xD8) or marker == 0x00:  # RST0..RST7 / byte stuffing have no length
                i += 2
                continue
            if i + 4 > raw_len:
                break
            try:
                seg_len = struct.unpack(">H", raw[i+2:i+4])[0]
            except Exception:
                break
            if seg_len < 2:
                i += 2
                continue
            payload = raw[i+4:min(raw_len, i+2+seg_len)].decode("latin-1", "ignore").lower()
            out["markers"].append(f"FF{marker:02X}")
            if marker in (0xE1, 0xEB, 0xEC):          # APP1/APP11/APP12 = EXIF/XMP/C2PA
                if "c2pa" in payload or "contentauth" in payload or "jumbf" in payload:
                    out["c2pa_manifest"] = True
                    out["decompiled_clues"].append("C2PA / Content Credentials provenance manifest detected in JPEG segment")
                for sig in GENERATOR_SIGNATURES:
                    if sig in payload and not out["generator_signature"]:
                        out["generator_signature"] = sig
                        out["decompiled_clues"].append(f"JPEG APP marker FF{marker:02X} contains signature: '{sig}'")
            i += 2 + seg_len

        # EXIF via Pillow for camera sensor tags
        try:
            exif = Image.open(io.BytesIO(raw)).getexif() or {}
            for k, v in exif.items():
                if str(k) in ("271", "272", "42016", "42034", "41993", "37386", "37381"):
                    out["camera_exif"][str(k)] = str(v)[:60]
        except Exception:
            pass

    # Check editing software signatures across raw header bytes
    try:
        raw_sample = raw[:min(len(raw), 65536)].decode("latin-1", "ignore")
        for ed in EDIT_KEYS:
            if ed.lower() in raw_sample.lower():
                out["software_signature"] = ed
                out["decompiled_clues"].append(f"Post-capture editing software signature detected: '{ed}'")
                break
    except Exception:
        pass

    return out


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


def generate_final_verdict(decompiled_data: dict, ela_variance: float = 0.0, vit_score: float = 0.0) -> dict:
    """
    Adversarial-Resistant Consensus Engine.
    Catches scrubbed AI images via pixel analysis, while protecting real stripped photos.
    """
    gen_sig = decompiled_data.get("generator_signature")
    has_camera_exif = bool(decompiled_data.get("camera_exif"))
    has_editing_software = bool(decompiled_data.get("software_signature"))
    is_c2pa = decompiled_data.get("c2pa_manifest", False)

    # RULE 1: POSITIVE EVIDENCE OF AI (The "Hidden Code" Rule)
    if gen_sig or is_c2pa:
        return {
            "verdict": "Likely AI-Generated",
            "flag": "RED",
            "confidence": "HIGH",
            "plain_english": f"Detected hidden generator signature: '{gen_sig or 'C2PA Manifest'}'. This image contains metadata typical of AI synthesis.",
            "limitations": "Metadata can be spoofed, but presence is a strong indicator."
        }

    # RULE 2: POSITIVE EVIDENCE OF AUTHENTIC (Camera Sensor Data + Clean Visuals)
    if has_camera_exif and not has_editing_software and vit_score < 0.6:
        return {
            "verdict": "Likely Authentic",
            "flag": "GREEN",
            "confidence": "HIGH",
            "plain_english": "Image contains valid camera sensor metadata and shows no signs of AI generation or editing software.",
            "limitations": "High-quality splicing can sometimes preserve EXIF, but no anomalies were detected."
        }

    # RULE 3: THE "ADVERSARIAL STRIPPING" CATCH (Metadata gone, BUT visual artifacts present)
    if not gen_sig and not has_camera_exif:
        # If ViT (AI classifier) or ELA (pixel manipulation) scores are HIGH, it's a scrubbed AI image
        if vit_score > 0.65 or ela_variance > 15.0: 
            return {
                "verdict": "Likely AI-Generated (Adversarial Stripping)",
                "flag": "RED",
                "confidence": "MEDIUM",
                "plain_english": "No AI metadata found, but pixel-level analysis (ELA/ViT) detects synthetic generation patterns. The image may have been processed to remove AI labels.",
                "limitations": "Metadata was stripped, so we rely solely on visual artifact detection. Human review recommended."
            }
        else:
            # Visuals look normal, metadata is just gone (e.g., WhatsApp screenshot of a real photo)
            return {
                "verdict": "Authentic (Metadata Stripped)",
                "flag": "AMBER",
                "confidence": "MEDIUM",
                "plain_english": "No AI generator signatures found. Camera metadata is missing, which is normal for images shared via social media or screenshots. Visual patterns appear natural.",
                "limitations": "Cannot definitively prove origin without EXIF, but no synthetic artifacts were detected."
            }

    # RULE 4: EDITING SOFTWARE DETECTED
    if has_editing_software:
        return {
            "verdict": "Spliced / Edited",
            "flag": "ORANGE",
            "confidence": "MEDIUM",
            "plain_english": f"Image contains editing software tags (e.g., {decompiled_data.get('software_signature')}). It may be a genuine photo that was altered.",
            "limitations": "Does not prove malicious manipulation, only that an editor was used."
        }

    # FALLBACK
    return {
        "verdict": "Needs Human Review",
        "flag": "AMBER",
        "confidence": "LOW",
        "plain_english": "Conflicting or insufficient signals. Human investigator review required.",
        "limitations": "Automated tools could not reach a consensus."
    }


def build_consensus(
    spatial_status: CheckStatus,
    ela_status: CheckStatus,
    ela_variance_pct: float,
    meta_status: CheckStatus,
    gan_status: CheckStatus,
    hf_score: Optional[float],
    t3_score: Optional[int],
    decompiled: Optional[Dict[str, Any]] = None,
) -> Tuple[int, Verdict, bool]:
    """
    TruthLens Consensus Engine (Byte-Level Provenance & Multi-Check Fusion):
    Weights byte-level decompilation evidence with local ELA and external AI tiers.

    Forensic Axiom: Absence of evidence is not evidence of AI.
    - Positive generator signature / C2PA -> 'Likely AI-Generated' (RED FLAG, HIGH confidence)
    - Camera hardware sensor + low ELA    -> 'Likely Authentic' (GREEN FLAG, HIGH confidence)
    - Missing EXIF + no AI signature      -> 'Authentic (Metadata Stripped)' (AMBER, MEDIUM confidence)
    - Editing software tags               -> 'Spliced / Edited' (ORANGE/RED, MEDIUM confidence)
    """
    fallback_mode = (hf_score is None and t3_score is None)
    decompiled_data = dict(decompiled) if decompiled else {}

    # If decompiled did not parse camera_exif but meta_status == "Pass", preserve camera evidence
    if meta_status == "Pass" and not decompiled_data.get("camera_exif"):
        decompiled_data["camera_exif"] = {"Image Make": "Hardware Camera Sensor"}

    decision = generate_final_verdict(
        decompiled_data=decompiled_data,
        ela_variance=ela_variance_pct,
        vit_score=hf_score or 0.0,
    )

    verdict_candidate = decision["verdict"]

    if verdict_candidate == "Likely AI-Generated":
        tamper_probability = max(88, int(round((hf_score or 0.9) * 100)))
        verdict: Verdict = "Likely AI-Generated"
    elif verdict_candidate == "Likely Authentic":
        tamper_probability = min(15, max(3, int(ela_variance_pct * 1.5)))
        verdict = "Likely Authentic"
    elif verdict_candidate == "Authentic (Metadata Stripped)":
        # Missing EXIF is NORMAL for WhatsApp, Instagram, or screenshots.
        # Calibrated to 20-28% (authentic baseline, not flagged as fraud).
        tamper_probability = min(28, max(14, int(18 + ela_variance_pct * 0.4)))
        # Only override to AI if HF/Vision model has VERY high positive visual confidence (>88%)
        if (hf_score and hf_score > 0.88) or (t3_score and t3_score > 88):
            verdict = "Likely AI-Generated"
            tamper_probability = max(80, int((hf_score or 0.88) * 100))
        elif ela_status == "Fail" and spatial_status == "Fail":
            verdict = "Spliced / Edited"
            tamper_probability = 65
        else:
            verdict = "Authentic (Metadata Stripped)"
    elif verdict_candidate == "Spliced / Edited":
        verdict = "Spliced / Edited"
        tamper_probability = max(58, min(85, int(50 + ela_variance_pct)))
    else:
        verdict = "Needs Human Review"
        tamper_probability = 35

    logger.info(
        "[CONSENSUS] tamper=%d%%  verdict=%s  fallback=%s  "
        "spatial=%s  ela=%s  meta=%s  gan=%s  candidate=%s",
        tamper_probability, verdict, fallback_mode,
        spatial_status, ela_status, meta_status, gan_status, verdict_candidate,
    )
    return tamper_probability, verdict, fallback_mode

    logger.info(
        "[CONSENSUS] tamper=%d%%  verdict=%s  fallback=%s  "
        "spatial=%s  ela=%s  meta=%s  gan=%s  has_generator=%s",
        tamper_probability, verdict, fallback_mode,
        spatial_status, ela_status, meta_status, gan_status, has_generator,
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
    decompiled: Optional[Dict[str, Any]] = None,
) -> SimplifiedReportContract:
    """
    Translates complex forensic metrics into plain English for non-technical investigators.
    Applies the Red/Green/Amber flag verdict system.
    """
    gen_sig = decompiled.get("generator_signature") if decompiled else None
    c2pa = decompiled.get("c2pa_manifest") if decompiled else False
    hidden_code = gen_sig or ("C2PA Manifest" if c2pa else None)

    # 1. Determine Flag Verdict
    if verdict == "Likely AI-Generated" or (gen_sig or c2pa):
        flag: FlagVerdict = "RED_FLAG"
        color = "#EF4444"
        icon = "⚠"
        status_msg = "Suspicious - Positive AI watermark or generator signature detected"
        conf_level: ConfidenceLevel = "HIGH"
    elif verdict == "Likely Authentic" or (tamper_probability <= 25 and checks.frequencyAnomaly == "Pass" and checks.metadataIntegrity == "Pass"):
        flag = "GREEN_FLAG"
        color = "#10B981"
        icon = "✓"
        status_msg = "Authentic - Camera sensor provenance confirmed"
        conf_level = "HIGH"
    elif verdict == "Authentic (Metadata Stripped)":
        flag = "NEEDS_REVIEW"
        color = "#F59E0B"
        icon = "✓"
        status_msg = "Authentic (Metadata Stripped) - No AI signatures found"
        conf_level = "MEDIUM"
    elif verdict == "Spliced / Edited" or (checks.frequencyAnomaly == "Fail" and checks.spatialArtifact in ("Warn", "Fail")):
        flag = "RED_FLAG"
        color = "#EF4444"
        icon = "⚠"
        status_msg = "Suspicious - Inconsistent compression indicates spliced elements"
        conf_level = "HIGH" if tamper_probability >= 70 else "MEDIUM"
    elif verdict in ("Needs Review", "Needs Human Review"):
        flag = "NEEDS_REVIEW"
        color = "#F59E0B"
        icon = "?"
        status_msg = "Uncertain - Human investigator review required"
        conf_level = "LOW"
    else:
        flag = "NEEDS_REVIEW"
        color = "#F59E0B"
        icon = "?"
        status_msg = "Uncertain - Ambiguous indicators"
        conf_level = "LOW"

    # 2. Extract Key Finding (short one-liner)
    if flag == "RED_FLAG":
        if hidden_code:
            key_finding = f"Positive AI generator signature detected in file byte markers: '{hidden_code}'."
        elif recapture.is_recaptured and checks.ganFingerprint == "Fail":
            key_finding = "Image was screenshotted from a display and exhibits synthetic edge anomalies."
        elif checks.ganFingerprint == "Fail":
            key_finding = "Artificial intelligence generation patterns confidently detected across facial boundaries."
        elif checks.frequencyAnomaly == "Fail":
            key_finding = "Compression levels do not match, indicating pasted or spliced elements."
        else:
            key_finding = "Unnatural pixel boundaries detected consistent with digital photo manipulation."
    elif flag == "GREEN_FLAG":
        key_finding = "Image contains valid camera sensor metadata (Make/Model) and shows no signs of AI generation or editing software."
    elif verdict == "Authentic (Metadata Stripped)":
        key_finding = "No AI generator signatures were found. Camera metadata is missing, which is normal for images shared via WhatsApp, social media, or screenshots."
    else:
        key_finding = "No positive AI watermark found, but camera metadata is stripped (screenshot or re-encode)."

    # 3. Plain English Explanation (max 3 sentences, <= 15 words per sentence)
    if flag == "RED_FLAG":
        if hidden_code:
            explanation = (
                f"Detected hidden generator signature: '{hidden_code}'. "
                "This image contains metadata typical of AI synthesis. "
                "Human review recommended for final verification."
            )
        elif recapture.is_recaptured:
            explanation = (
                "This image was re-captured from a digital screen. "
                "Beneath the screenshot, compression and edge patterns indicate artificial tampering. "
                "Human review recommended for final verification."
            )
        elif checks.frequencyAnomaly == "Fail":
            explanation = (
                "Like pasting a paper cutout into a photo, pixel compression does not match. "
                "Different parts of this image were saved at different quality levels. "
                "Human review recommended for final verification."
            )
        else:
            explanation = (
                "Microscopic pixel patterns do not match real camera lenses. "
                "Artificial intelligence left subtle mathematical traces across boundaries. "
                "Human review recommended for final verification."
            )
    elif flag == "GREEN_FLAG":
        explanation = (
            "Image contains valid camera sensor metadata (Make/Model) and shows no signs of AI generation or editing software. "
            "Compression levels are uniform without spliced edges. "
            "Human review recommended for final verification."
        )
    elif verdict == "Authentic (Metadata Stripped)":
        explanation = (
            "No AI generator signatures were found. "
            "However, camera metadata is missing, which is normal for images shared via WhatsApp, social media, or screenshots. "
            "Cannot definitively prove origin without EXIF, but NO evidence of AI synthesis exists."
        )
    else:
        explanation = (
            "Camera sensor metadata is missing, but no positive AI signature was detected. "
            "This commonly occurs when authentic photos are screenshotted or shared via messaging apps. "
            "Human review recommended for final verification."
        )

    limitations = (
        "Cannot definitively prove origin without EXIF, but NO evidence of AI synthesis exists."
    ) if verdict == "Authentic (Metadata Stripped)" else (
        "Absence of EXIF metadata is not positive evidence of AI generation. "
        "Original high-resolution camera file required for definitive sensor verification."
    ) if flag == "NEEDS_REVIEW" else None

    return SimplifiedReportContract(
        verdict=flag,
        flag_color=color,
        flag_icon=icon,
        status_message=status_msg,
        simple_explanation=explanation,
        key_finding=key_finding,
        confidence_level=conf_level,
        hidden_code_found=hidden_code,
        limitations=limitations,
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
    Adheres to the core axiom: Absence of evidence is not evidence of AI.
    """
    is_missing_camera = camera_make == "Unknown (Born-Digital)"
    has_software_edit = software not in ("None (Stripped)", "")
    high_ela = variance_pct > 15.0
    fallback_anomalies: List[str] = []

    if high_ela and has_software_edit:
        tamper_probability = int(min(92, max(68, 65 + int(variance_pct * 0.7))))
        verdict: Verdict = "Spliced / Edited"
        fallback_anomalies.append(
            f"Heuristic Fallback — Compression discrepancy ({variance_pct:.1f}%) correlated "
            f"with software signature '{software}' — post-capture splicing confirmed."
        )
        fallback_anomalies.append(
            "Heuristic Fallback — Localised quantization boundary anomalies confirm compositing."
        )
    elif high_ela and is_missing_camera:
        tamper_probability = int(min(75, max(55, 50 + int(variance_pct * 0.6))))
        verdict = "Spliced / Edited"
        fallback_anomalies.append(
            f"Heuristic Fallback — Elevated ELA variance ({variance_pct:.1f}%) with stripped metadata."
        )
        fallback_anomalies.append(
            "Heuristic Fallback — Inconsistent compression indicates possible digital manipulation."
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
        tamper_probability = 22
        verdict = "Authentic (Metadata Stripped)"
        fallback_anomalies.append(
            f"Heuristic Fallback — Uniform compression ({variance_pct:.1f}%) with stripped metadata."
        )
        fallback_anomalies.append(
            "Heuristic Fallback — Absence of camera EXIF is normal for social media/web shares; no positive AI signatures found."
        )
    else:
        tamper_probability = int(min(80, max(20, int(variance_pct * 2.8))))
        verdict = "Spliced / Edited" if high_ela else "Needs Review"
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
