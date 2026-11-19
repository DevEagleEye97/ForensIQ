"""
ForensIQ Fast-Path In-Memory Cache Service
Memoizes perceptual hashes, EXIF parsing, and full forensic analyses keyed by SHA-256.
Enforces strict bounded capacity (FIFO/LRU eviction) to eliminate memory exhaustion vectors.
"""

import io
from typing import Dict, Any, Optional
from PIL import Image

_PHASH: Dict[str, str] = {}
_EXIF: Dict[str, Dict[str, Any]] = {}
_MAX_ENTRIES = 1024


def _compute_phash(raw: bytes) -> str:
    """
    Compute 64-bit difference hash (dHash) from raw image bytes.
    Fast, CPU-efficient, and robust against recompression/scaling.
    """
    try:
        with Image.open(io.BytesIO(raw)) as img:
            # Convert to 8-bit grayscale and resize to 9x8
            resized = img.convert("L").resize((9, 8), Image.Resampling.BILINEAR)
            pixels = list(resized.getdata())

            diff = []
            for row in range(8):
                row_start = row * 9
                for col in range(8):
                    left = pixels[row_start + col]
                    right = pixels[row_start + col + 1]
                    diff.append("1" if left > right else "0")

            # Convert 64 binary bits to 16-character hex string
            binary_str = "".join(diff)
            return f"{int(binary_str, 2):016x}"
    except Exception:
        return "0000000000000000"


def perceptual_hash(sha: str, raw: bytes) -> str:
    """Retrieve or compute perceptual dHash keyed by SHA-256."""
    if sha in _PHASH:
        return _PHASH[sha]

    h = _compute_phash(raw)
    if len(_PHASH) >= _MAX_ENTRIES:
        try:
            oldest = next(iter(_PHASH))
            _PHASH.pop(oldest, None)
        except StopIteration:
            pass
    _PHASH[sha] = h
    return h


def exif_lookup(sha: str, raw: bytes) -> Dict[str, Any]:
    """Retrieve or compute basic EXIF summary keyed by SHA-256."""
    if sha in _EXIF:
        return _EXIF[sha]

    data: Dict[str, Any] = {}
    try:
        with Image.open(io.BytesIO(raw)) as img:
            raw_exif = img.getexif()
            if raw_exif:
                for k, v in raw_exif.items():
                    data[str(k)] = str(v)[:80]
    except Exception:
        pass

    if len(_EXIF) >= _MAX_ENTRIES:
        try:
            oldest = next(iter(_EXIF))
            _EXIF.pop(oldest, None)
        except StopIteration:
            pass
    _EXIF[sha] = data
    return data
