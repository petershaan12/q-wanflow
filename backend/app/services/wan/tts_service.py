"""
app/services/tts_service.py
─────────────────────────────
Text-to-Speech using Qwen3-TTS-Flash.
"""
import json
import base64
import requests
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.utils.logger import get_logger
from .qwen_core import DASHSCOPE_INTL_BASE, _require_key, make_headers

logger = get_logger(__name__)


def tts_generation(user_id: str, prompt: str, voice: str, model: str, db: Session,
                   language: str = "english") -> dict:
    """Speech Synthesis via Qwen3-TTS-Flash (multimodal-generation endpoint)."""
    logger.info(f"TTS - user={user_id}, voice={voice}, lang={language}")

    api_key = _require_key(user_id, db)
    url = f"{DASHSCOPE_INTL_BASE}/api/v1/services/aigc/multimodal-generation/generation"
    lang_type = language.capitalize() if language else "English"

    payload = {
        "model": "qwen3-tts-flash",
        "input": {
            "text": prompt,
            "voice": voice,
            "language_type": lang_type,
        },
    }
    headers = make_headers(api_key)

    try:
        logger.debug(f"TTS request | voice={voice}")
        resp = requests.post(url, headers=headers, json=payload, timeout=60)

        ct = resp.headers.get("Content-Type", "").lower()
        if resp.status_code == 200 and ("audio" in ct or "application/octet-stream" in ct):
            audio_data = base64.b64encode(resp.content).decode("utf-8")
            return {
                "audio_url": f"data:audio/mpeg;base64,{audio_data}",
                "raw_response": {"status": "binary_success", "content_type": ct},
            }

        if resp.status_code != 200:
            logger.error(f"TTS DashScope error ({resp.status_code}): {resp.text}")
            try:
                err = resp.json()
                msg = err.get("message") or err.get("output", {}).get("message") or resp.text
                raise HTTPException(status_code=resp.status_code, detail=msg)
            except (ValueError, json.JSONDecodeError):
                raise HTTPException(status_code=resp.status_code, detail=resp.text)

        data = resp.json()
        output = data.get("output", {})

        audio_obj = output.get("audio", {})
        audio_url = audio_obj.get("url") or audio_obj.get("data")
        if not audio_url:
            audio_url = output.get("audio_url") or output.get("url")
        if not audio_url and "delta" in output:
            audio_url = f"data:audio/mpeg;base64,{output['delta']}"
        if audio_url and not audio_url.startswith("http") and not audio_url.startswith("data:"):
            audio_url = f"data:audio/mpeg;base64,{audio_url}"
        if not audio_url:
            raise HTTPException(status_code=502, detail=f"TTS: no audio in response: {json.dumps(data)}")

        return {"audio_url": audio_url, "raw_response": data}

    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))
