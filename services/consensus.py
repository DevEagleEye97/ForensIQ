"""
ForensIQ Consensus & Verdict Wording Engine
Calibrated suspicion thresholds + explicit origin classification + direct plain English.
"""

from typing import Literal, Tuple, Dict, Any, Optional

OriginClass = Literal[
    "NATURAL_CAPTURE",
    "SCREEN_RECAPTURE",
    "EDITED_SPLICED",
    "AI_GENERATED",
    "UNCERTAIN"
]

ORIGIN_META: Dict[OriginClass, Dict[str, str]] = {
    "NATURAL_CAPTURE": {
        "label": "Natural camera photo",
        "icon": "camera",
        "template": "Your image looks like a natural camera photo. Sensor and compression patterns match a real capture."
    },
    "SCREEN_RECAPTURE": {
        "label": "Screen re-capture (screenshot / photo of a display)",
        "icon": "monitor",
        "template": "Your image was re-captured from a screen. Re-capture strips original metadata, so we also inspected the edge and compression patterns beneath it."
    },
    "EDITED_SPLICED": {
        "label": "Edited / spliced image",
        "icon": "scissors",
        "template": "Your image is an edited image. Local compression mismatches indicate pasted or retouched regions."
    },
    "AI_GENERATED": {
        "label": "AI-generated (synthetic)",
        "icon": "sparkles",
        "template": "Your image shows strong signs of AI generation: synthetic textures and generator signatures."
    },
    "UNCERTAIN": {
        "label": "Uncertain — needs human review",
        "icon": "help",
        "template": "Signals are mixed. We cannot classify this image confidently."
    },
}


def tamper_band(pct: float) -> Tuple[str, str]:
    """
    Calibrated suspicion thresholds:
    0–14%  -> Clean (GREEN)
    15–29% -> Low suspicion (AMBER)
    30–59% -> Suspicious (RED)   - 30% cutoff
    60%+   -> Highly suspicious (RED)
    """
    if pct < 15.0:
        return "Clean", "GREEN"
    if pct < 30.0:
        return "Low suspicion", "AMBER"
    if pct < 60.0:
        return "Suspicious", "RED"
    return "Highly suspicious", "RED"


def infer_origin_class(
    tamper_pct: float,
    verdict: str,
    is_recaptured: bool,
    has_ai_sig: bool,
    ela_status: str,
    spatial_status: str,
    gan_status: str,
    has_camera_exif: bool
) -> OriginClass:
    """
    Deterministically infer the concrete origin class from forensic evidence:
    NATURAL_CAPTURE | SCREEN_RECAPTURE | EDITED_SPLICED | AI_GENERATED | UNCERTAIN
    """
    if has_ai_sig or gan_status == "Fail" or verdict == "Likely AI-Generated":
        return "AI_GENERATED"

    if is_recaptured:
        return "SCREEN_RECAPTURE"

    if ela_status == "Fail" or verdict == "Spliced / Edited" or (ela_status == "Warn" and spatial_status == "Fail" and tamper_pct >= 30):
        return "EDITED_SPLICED"

    if has_camera_exif and tamper_pct < 25.0 and ela_status == "Pass":
        return "NATURAL_CAPTURE"

    if verdict == "Authentic (Metadata Stripped)" or (tamper_pct < 30.0 and ela_status == "Pass"):
        return "NATURAL_CAPTURE"

    return "UNCERTAIN"


def build_verdict(origin: OriginClass, pct: float, confidence: str = "HIGH") -> Dict[str, Any]:
    """
    Build structured verdict payload adhering to the TruthLens Verdict Wording System:
    Always shows the % under the headline, origin class label, and direct wording.
    """
    meta = ORIGIN_META.get(origin, ORIGIN_META["UNCERTAIN"])
    headline, flag = tamper_band(pct)
    p = round(pct, 1)

    # Legacy verdict flag mapping for backward compatibility with existing tests/contracts
    if flag == "GREEN":
        legacy_verdict = "GREEN_FLAG"
        color = "#10B981"
        flag_icon = "✓"
    elif flag == "AMBER":
        legacy_verdict = "NEEDS_REVIEW"
        color = "#F59E0B"
        flag_icon = "✓"
    else:
        legacy_verdict = "RED_FLAG"
        color = "#EF4444"
        flag_icon = "⚠"

    plain_english = f"{meta['template']} Tamper probability: {p}%."
    human_review = "Automated indicator only — a human investigator makes the final call."

    return {
        "headline": headline,
        "flag": flag,
        "tamper_percent": p,                          # ALWAYS rendered, every band
        "origin_class": origin,
        "origin_label": meta["label"],
        "icon": meta["icon"],
        "confidence": confidence,
        "plain_english": plain_english,
        "human_review": human_review,

        # Backward-compatible fields
        "verdict": legacy_verdict,
        "flag_color": color,
        "flag_icon": flag_icon,
        "status_message": f"{headline} - {meta['label']}",
        "simple_explanation": plain_english,
        "key_finding": f"{meta['label']}. Tamper probability: {p}%.",
        "confidence_level": confidence,
    }
