"""
app/services/video_r2v_service.py
──────────────────────────────────
Reference/Video-to-Video generation.
Models: wan2.6-r2v, wan2.6-r2v-flash

API params:
  - size: e.g. "1280*720"  (combines aspect_ratio + quality — NO separate resolution)
  - duration: int seconds
  - input.reference_urls: list of video (+ optional image) URLs
"""
import json
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.utils.logger import get_logger
from .qwen_core import (
    DASHSCOPE_INTL_BASE,
    _require_key, _validate_video_model,
    _post_json, _poll_task_until_done,
    _extract_task_id, _extract_media_url,
    make_async_headers,
)

logger = get_logger(__name__)

R2V_MODELS = {"wan2.6-r2v", "wan2.6-r2v-flash"}

SIZE_MAP = {
    "720":  {"16:9": "1280*720",  "9:16": "720*1280",  "4:3": "1088*832", "3:4": "832*1088",  "1:1": "960*960"},
    "1080": {"16:9": "1920*1080", "9:16": "1080*1920", "4:3": "1632*1248","3:4": "1248*1632", "1:1": "1440*1440"},
}


def generate_r2v(
    user_id: str,
    db: Session,
    *,
    prompt: str,
    reference_urls: list,              # At least one video URL required
    model: str = "wan2.6-r2v",
    duration: str = "5s",
    size: str | None = None,           # pre-computed from frontend
    aspect_ratio: str = "16:9",
    shot_type: str = "single",
    negative_prompt: str | None = None,
) -> dict:
    """Generate a reference-to-video clip with the Wan R2V API."""
    logger.info(f"R2V - user={user_id}, model={model}, refs={len(reference_urls)}")

    if not reference_urls:
        raise HTTPException(status_code=400, detail="R2V: at least one reference URL is required.")

    api_key = _require_key(user_id, db)
    _validate_video_model(model)

    try:
        duration_sec = int(duration.replace("s", ""))
    except (ValueError, AttributeError):
        duration_sec = 5

    resolved_size = size or SIZE_MAP.get("720").get(aspect_ratio, "1280*720")

    parameters = {
        "prompt_extend": True,
        "duration": duration_sec,
        "size": resolved_size,          # NO resolution field for R2V
    }
    if shot_type:
        parameters["shot_type"] = shot_type
    if negative_prompt:
        parameters["negative_prompt"] = negative_prompt

    input_data: dict = {
        "prompt": prompt,
        "reference_urls": reference_urls,
    }

    payload = {"model": model, "input": input_data, "parameters": parameters}
    logger.debug(f"R2V payload: {json.dumps(payload, indent=2)}")

    headers = make_async_headers(api_key)
    start_data = _post_json(
        f"{DASHSCOPE_INTL_BASE}/api/v1/services/aigc/video-generation/video-synthesis",
        headers=headers, payload=payload, timeout=60,
    )
    task_id = _extract_task_id(start_data)
    logger.info(f"R2V task created: {task_id}")
    final_data = _poll_task_until_done(api_key, task_id) if task_id else start_data

    video_url = _extract_media_url(final_data, "video")
    if not video_url:
        raise HTTPException(status_code=502, detail=f"R2V: video URL not found in response: {final_data}")
    logger.info("R2V generation successful")
    return {"video_url": video_url, "task_id": task_id, "raw_response": final_data}
