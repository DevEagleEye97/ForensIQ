"""
ForensIQ Tier 1 Deterministic Forensics Engine
Zero-Disk Stream In-Memory Error Level Analysis (ELA) & Metadata Extraction
"""

import io
import re
import base64
import logging
from typing import Dict, List, Literal, Tuple
from PIL import Image, ImageChops
import exifread
import numpy as np
from fastapi import HTTPException, status

logger = logging.getLogger("forensiq.services.forensics")


def sanitize_text(val: str, max_length: int = 255) -> str:
    """
    Sanitize text input to prevent injection attacks and stripping malformed control characters.
    """
    if not val:
        return ""
    # Strip null bytes and non-printable control characters (keep standard ASCII/printable)
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", str(val)).strip()
    return cleaned[:max_length]


def compute_ela(image_bytes: bytes, quality: int = 90) -> Tuple[str, float, Literal["Normal", "Mismatched Compression"]]:
    """
    In-Memory Error Level Analysis (ELA):
    - Strict in-memory stream processing (no disk persistence leaks).
    - Re-compresses the image at 90% JPEG quality.
    - Computes absolute channel differences via ImageChops.difference.
    - Scales extrema to maximize contrast dynamics.
    - Mathematical variance computation via NumPy.
    - Detects quantization irregularities.
    """
    try:
        orig = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        logger.error("[TIER1] Failed to parse image binary stream: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed image binary stream: {str(exc)}"
        )

    # In-memory JPEG recompression
    buffer = io.BytesIO()
    orig.save(buffer, format="JPEG", quality=quality)
    buffer.seek(0)
    resaved = Image.open(buffer)

    # Pixel difference
    diff = ImageChops.difference(orig, resaved)

    # Extrema scaling
    extrema = diff.getextrema()
    max_diff = max([ex[1] for ex in extrema])
    if max_diff == 0:
        max_diff = 1
    scale = 255.0 / max_diff

    # Brightness enhancement across channels
    ela_image = Image.eval(diff, lambda px: int(min(255, px * scale)))

    # Export ELA heatmap to Base64 JPEG data URI
    ela_buf = io.BytesIO()
    ela_image.save(ela_buf, format="JPEG", quality=90)
    ela_base64 = "data:image/jpeg;base64," + base64.b64encode(ela_buf.getvalue()).decode("utf-8")

    # Mathematical variance calculation via NumPy
    diff_arr = np.array(diff, dtype=np.float32)
    pixel_errors = np.mean(diff_arr, axis=2)  # Average channel deviation per pixel

    # Ratio of pixels with high error deviation (>12.0/255)
    high_variance_count = np.count_nonzero(pixel_errors > 12.0)
    variance_pct = float((high_variance_count / pixel_errors.size) * 100.0)

    # Mismatched compression detection (localized high-frequency discrepancies)
    std_dev = float(np.std(pixel_errors))
    if variance_pct > 18.0 or std_dev > 15.0:
        quantization_status: Literal["Normal", "Mismatched Compression"] = "Mismatched Compression"
    else:
        quantization_status = "Normal"

    return ela_base64, variance_pct, quantization_status


def inspect_exif(image_bytes: bytes, mime_type: str) -> Tuple[Dict[str, str], List[str]]:
    """
    Tier 1 Deterministic EXIF & Stream Header Forensics:
    - Verifies raw stream signatures (FFD8..FFD9 for JPEG, 89504E47 for PNG).
    - Extracts camera hardware, software signatures, and capture dates.
    - Sanitizes all extracted strings.
    """
    tier1_obs: List[str] = []

    # Stream structural validation
    if mime_type == "image/jpeg":
        has_soi = image_bytes.startswith(b"\xff\xd8")
        has_eoi = image_bytes.rstrip().endswith(b"\xff\xd9")
        if has_soi and has_eoi:
            file_structure = "Valid FFD8 to FFD9 JPEG Stream"
        elif has_soi:
            file_structure = "Valid JPEG Header (FFD8), Incomplete/Appended Stream"
            tier1_obs.append("Non-standard JPEG stream termination (potential hidden payload/steganography)")
        else:
            file_structure = "Corrupted JPEG Stream Header"
            tier1_obs.append("Non-compliant JPEG byte stream header")
    else:
        if image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            file_structure = "Valid 89504E47 PNG Stream"
        else:
            file_structure = "Corrupted PNG Stream Header"
            tier1_obs.append("Non-compliant PNG magic signature header")

    # Read tags via exifread
    tags = exifread.process_file(io.BytesIO(image_bytes), details=False)

    # 1. Camera Make & Model
    make = sanitize_text(str(tags.get("Image Make", "")))
    model = sanitize_text(str(tags.get("Image Model", "")))
    if make and model:
        camera_make = model if make.lower() in model.lower() else f"{make} {model}"
    elif make or model:
        camera_make = make or model
    else:
        camera_make = "Unknown (Born-Digital)"
        tier1_obs.append("Camera sensor metadata missing — typical of born-digital or AI-generated imagery")

    # 2. Software Tags
    software_raw = sanitize_text(str(tags.get("Image Software", "")))
    suspicious_software = [
        "photoshop", "gimp", "midjourney", "stable diffusion", "dall-e",
        "canvas", "affinity", "lightroom", "procreate", "comfyui", "automatic1111"
    ]
    if software_raw:
        software = software_raw
        if any(tool in software_raw.lower() for tool in suspicious_software):
            tier1_obs.append(f"Image modification tag detected: '{software_raw}'")
    else:
        software = "None (Stripped)"

    # 3. Timestamps
    dt_orig = sanitize_text(str(tags.get("EXIF DateTimeOriginal", "")))
    dt_mod = sanitize_text(str(tags.get("Image DateTime", "")))
    if dt_orig and dt_mod and dt_orig != dt_mod:
        tier1_obs.append(f"Timestamp divergence detected (Original: {dt_orig} vs Modified: {dt_mod})")

    return {
        "software": software,
        "cameraMake": camera_make,
        "fileStructure": file_structure,
    }, tier1_obs


def compute_heuristic_fallback(
    variance_pct: float,
    camera_make: str,
    software: str,
    quantization_hash: str
) -> Tuple[int, Literal["Likely AI-Generated (Synthetic)", "Likely Authentic", "Spliced / Edited"], List[str]]:
    """
    Deterministic Heuristic Fallback Protocol (Demo Insurance):
    - Triggered when external AI classifier/vision endpoints fail, timeout, or rate-limit.
    - Guarantees zero HTTP 500 errors.
    """
    is_missing_camera = (camera_make == "Unknown (Born-Digital)")
    has_software_edit = (software != "None (Stripped)")
    high_ela = (variance_pct > 18.0)

    fallback_anomalies: List[str] = []

    if high_ela and is_missing_camera:
        tamper_probability = int(min(96, max(75, 70 + int(variance_pct * 0.8))))
        verdict = "Likely AI-Generated (Synthetic)"
        fallback_anomalies.append(
            f"Observation 2 (Tier 2: Offline Fallback — High ELA variance [{variance_pct:.1f}%] indicates synthetic generation)"
        )
        fallback_anomalies.append(
            "Observation 3 (Tier 3: Offline Fallback — Lack of camera hardware sensors corroborates born-digital generation)"
        )
    elif high_ela and has_software_edit:
        tamper_probability = int(min(92, max(68, 65 + int(variance_pct * 0.7))))
        verdict = "Spliced / Edited"
        fallback_anomalies.append(
            f"Observation 2 (Tier 2: Offline Fallback — Compression discrepancy correlated with software signature '{software}')"
        )
        fallback_anomalies.append(
            "Observation 3 (Tier 3: Offline Fallback — Localized quantization boundary anomalies confirm post-capture splicing)"
        )
    elif not high_ela and not is_missing_camera:
        tamper_probability = int(max(4, min(22, 10 + int(variance_pct * 0.4))))
        verdict = "Likely Authentic"
        fallback_anomalies.append(
            f"Observation 2 (Tier 2: Offline Fallback — Uniform ELA distribution [{variance_pct:.1f}%] matches natural capture)"
        )
        fallback_anomalies.append(
            f"Observation 3 (Tier 3: Offline Fallback — Camera sensor hardware provenance confirmed: '{camera_make}')"
        )
    elif is_missing_camera and not high_ela:
        tamper_probability = 32
        verdict = "Likely Authentic"
        fallback_anomalies.append(
            f"Observation 2 (Tier 2: Offline Fallback — Uniform error response [{variance_pct:.1f}%] on web-distributed image)"
        )
        fallback_anomalies.append(
            "Observation 3 (Tier 3: Offline Fallback — Stripped metadata with coherent compression levels)"
        )
    else:
        tamper_probability = int(min(80, max(20, int(variance_pct * 2.8))))
        verdict = "Spliced / Edited" if high_ela else "Likely Authentic"
        fallback_anomalies.append(
            f"Observation 2 (Tier 2: Offline Fallback — Heuristic analysis computed {tamper_probability}% tamper score)"
        )
        fallback_anomalies.append(
            f"Observation 3 (Tier 3: Offline Fallback — Quantization consistency evaluated as {quantization_hash})"
        )

    return tamper_probability, verdict, fallback_anomalies
