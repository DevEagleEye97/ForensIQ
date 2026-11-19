"""
ForensIQ External AI Inference Service
Tier 2 (Hugging Face Classifier) & Tier 3 (OpenRouter Vision Multi-Modal Reasoning)
"""

import os
import re
import json
import time
import base64
import logging
from typing import Optional, List, Tuple, Dict, Any
import httpx

logger = logging.getLogger("forensiq.services.ai_inference")

HF_MODEL_NAME = "prithivMLmods/Deep-Fake-Detector-v2-Model"
HF_ENDPOINT_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL_NAME}"
OPENROUTER_ENDPOINT_URL = "https://openrouter.ai/api/v1/chat/completions"


async def query_huggingface_classifier(
    client: httpx.AsyncClient,
    image_bytes: bytes,
    mime_type: str
) -> Tuple[Optional[float], Optional[str]]:
    """
    Tier 2: Async Hugging Face Deepfake Classifier.
    Model: prithivMLmods/Deep-Fake-Detector-v2-Model
    Timeout: 5.0s maximum.
    """
    hf_token = os.getenv("HUGGINGFACE_API_TOKEN") or os.getenv("HUGGINGFACE_API_KEY")
    if not hf_token or hf_token.strip() in ("", "your-token", "your_huggingface_api_key_here"):
        logger.warning("[TIER2] Hugging Face API token not configured. Proceeding to fallback.")
        return None, None

    headers = {
        "Authorization": f"Bearer {hf_token.strip()}",
        "Content-Type": mime_type,
    }

    try:
        response = await client.post(HF_ENDPOINT_URL, headers=headers, content=image_bytes, timeout=5.0)
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list):
                fake_score = 0.0
                for item in result:
                    label = str(item.get("label", "")).lower()
                    score = float(item.get("score", 0.0))
                    if any(term in label for term in ["fake", "deepfake", "synthetic", "manipulated", "label_1"]):
                        fake_score = max(fake_score, score)
                    elif any(term in label for term in ["real", "authentic", "realism", "label_0"]):
                        fake_score = max(fake_score, 1.0 - score)

                obs = f"Classifier inference scored {int(fake_score * 100)}% synthetic confidence"
                return fake_score, obs
        else:
            logger.warning("[TIER2] HF response returned status %s: %s", response.status_code, response.text[:120])
    except httpx.TimeoutException:
        logger.warning("[TIER2] HF inference timed out (>5.0s). Triggering fail-safe.")
    except Exception as exc:
        logger.warning("[TIER2] HF inference error: %s", exc)

    return None, None


async def query_openrouter_vision(
    client: httpx.AsyncClient,
    image_bytes: bytes,
    mime_type: str
) -> Tuple[Optional[int], Optional[str], List[str]]:
    """
    Tier 3: Multi-Modal Reasoning via OpenRouter Vision API.
    Primary: meta-llama/llama-3.2-11b-vision-instruct:free
    Fallback: qwen/qwen2.5-vl-72b-instruct:free
    Timeout: 5.0s maximum.
    """
    openrouter_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENROUTER_TOKEN")
    if not openrouter_key or openrouter_key.strip() in ("", "your-key", "your_openrouter_api_key_here"):
        logger.warning("[TIER3] OpenRouter API key not configured. Proceeding to fallback.")
        return None, None, []

    b64_img = base64.b64encode(image_bytes).decode("utf-8")
    data_uri = f"data:{mime_type};base64,{b64_img}"

    # OpenRouter Model Hierarchy (Priority: Configured -> NVIDIA Nemotron 3.5 Super VL -> Fallbacks)
    primary_model = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3.5-super-vl").strip()
    fallback_pool = [
        primary_model,
        "nvidia/nemotron-3.5-super-vl",
        "nvidia/nemotron-3.5-super-vl:free",
        "meta-llama/llama-3.2-11b-vision-instruct:free",
        "qwen/qwen2.5-vl-72b-instruct:free"
    ]
    # Deduplicate while preserving priority order
    models = list(dict.fromkeys([m for m in fallback_pool if m]))

    prompt = (
        "You are an Elite Forensic Vision Specialist. Conduct a granular, objective forensic evaluation on this image.\n"
        "Inspect and reason about:\n"
        "1. Pupil corneal light reflection geometry (elliptical shape congruence and light source vector alignment across eyes).\n"
        "2. Facial boundary blending, hairline transition halos, and irregular micro-texture diffusion.\n"
        "3. Lighting and shadow vector consistency across the nasal bridge, jawline, and background scene.\n\n"
        "Return ONLY a strictly valid JSON object without markdown formatting:\n"
        "{\n"
        '  "tamper_score": <integer 0-100>,\n'
        '  "verdict": "<Likely AI-Generated (Synthetic) | Likely Authentic | Spliced / Edited>",\n'
        '  "observations": ["<precise observation 1>", "<precise observation 2>"]\n'
        "}"
    )

    headers = {
        "Authorization": f"Bearer {openrouter_key.strip()}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://forensiq.ai",
        "X-Title": "ForensIQ Autonomous Platform"
    }

    for model in models:
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": data_uri}}
                    ]
                }
            ],
            "temperature": 0.1,
            "max_tokens": 1000
        }
        try:
            resp = await client.post(
                OPENROUTER_ENDPOINT_URL,
                headers=headers,
                json=payload,
                timeout=12.0
            )
            if resp.status_code == 200:
                data = resp.json()
                msg = data.get("choices", [{}])[0].get("message", {})
                content = msg.get("content") or msg.get("reasoning") or ""
                match = re.search(r"\{[\s\S]*\}", content)
                if match:
                    parsed = json.loads(match.group(0))
                    t_score = int(parsed.get("tamper_score", 50))
                    t_verdict = parsed.get("verdict")
                    raw_obs = parsed.get("observations", [])
                    observations = [str(o) for o in raw_obs if isinstance(o, str)]
                    return t_score, t_verdict, observations
            else:
                logger.warning("[TIER3] OpenRouter model %s returned status %s", model, resp.status_code)
        except httpx.TimeoutException:
            logger.warning("[TIER3] OpenRouter model %s timed out (>12.0s)", model)
        except Exception as exc:
            logger.warning("[TIER3] OpenRouter call to %s failed: %s", model, exc)
            continue

    return None, None, []


async def measure_api_health() -> Dict[str, Any]:
    """
    Ping external AI endpoints to measure status and round-trip latency.
    """
    latencies: Dict[str, Any] = {}
    hf_token = os.getenv("HUGGINGFACE_API_TOKEN") or os.getenv("HUGGINGFACE_API_KEY")
    openrouter_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENROUTER_TOKEN")

    async with httpx.AsyncClient(timeout=3.0) as client:
        # Check Hugging Face endpoint reachability
        if hf_token and hf_token.strip() not in ("", "your-token"):
            t0 = time.time()
            try:
                r = await client.get(
                    HF_ENDPOINT_URL,
                    headers={"Authorization": f"Bearer {hf_token.strip()}"}
                )
                latencies["huggingface_ms"] = round((time.time() - t0) * 1000, 2)
                latencies["huggingface_status"] = "REACHABLE" if r.status_code in (200, 400, 404, 405) else f"STATUS_{r.status_code}"
            except Exception as e:
                latencies["huggingface_ms"] = None
                latencies["huggingface_status"] = f"UNREACHABLE ({type(e).__name__})"
        else:
            latencies["huggingface_status"] = "UNCONFIGURED"
            latencies["huggingface_ms"] = None

        # Check OpenRouter reachability
        if openrouter_key and openrouter_key.strip() not in ("", "your-key"):
            t0 = time.time()
            try:
                r = await client.get("https://openrouter.ai/api/v1/models")
                latencies["openrouter_ms"] = round((time.time() - t0) * 1000, 2)
                latencies["openrouter_status"] = "REACHABLE" if r.status_code == 200 else f"STATUS_{r.status_code}"
            except Exception as e:
                latencies["openrouter_ms"] = None
                latencies["openrouter_status"] = f"UNREACHABLE ({type(e).__name__})"
        else:
            latencies["openrouter_status"] = "UNCONFIGURED"
            latencies["openrouter_ms"] = None

    return latencies
