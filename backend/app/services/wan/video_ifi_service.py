"""
app/services/video_ifi_service.py
──────────────────────────────────
Image First Image Last → Video (Keyframe-to-Video).
Models: wan2.2-kf2v-flash, wan2.1-kf2v-plus

API endpoint: POST /api/v1/services/aigc/image2video/video-synthesis
API params:
  - resolution: "480" | "720" | "1080"  (NO aspect_ratio, NO duration)
  - input.first_frame_url
  - input.last_frame_url
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

IFI_MODELS = {"wan2.2-kf2v-flash", "wan2.1-kf2v-plus"}

# wan2.1-kf2v-plus only supports 720P
RESOLUTION_LIMITS = {
    "wan2.2-kf2v-flash": {"480", "720", "1080"},
    "wan2.1-kf2v-plus":  {"720"},
}


def generate_ifi(
    user_id: str,
    db: Session,
    *,
    prompt: str,
    model: str = "wan2.2-kf2v-flash",
    resolution: str = "720",           # "480" | "720" | "1080" — NO aspect_ratio
    duration: str = "5s",
    first_frame_url: str | None = None,
    last_frame_url: str | None = None,
    negative_prompt: str | None = None,
) -> dict:
    """Generate a keyframe-to-video via the Wan KF2V API (IFI mode)."""
    logger.info(f"IFI - user={user_id}, model={model}, resolution={resolution}, duration={duration}")

    if not first_frame_url and not last_frame_url:
        raise HTTPException(status_code=400, detail="IFI: at least first_frame_url or last_frame_url is required.")

    api_key = _require_key(user_id, db)
    _validate_video_model(model)

    try:
        duration_sec = int(duration.replace("s", ""))
    except (ValueError, AttributeError):
        duration_sec = 5

    # Clamping / default if empty
    if not resolution:
        resolution = "720P"

    parameters = {
        "prompt_extend": True,
        "resolution": resolution,         
        "duration": duration_sec,
    }
    if negative_prompt:
        parameters["negative_prompt"] = negative_prompt

    input_data: dict = {"prompt": prompt}
    if first_frame_url:
        input_data["first_frame_url"] = first_frame_url
    if last_frame_url:
        input_data["last_frame_url"] = last_frame_url

    payload = {"model": model, "input": input_data, "parameters": parameters}
    logger.debug(f"IFI payload: {json.dumps(payload, indent=2)}")

    # IFI uses a different endpoint than the other video models
    headers = make_async_headers(api_key)
    start_data = _post_json(
        f"{DASHSCOPE_INTL_BASE}/api/v1/services/aigc/image2video/video-synthesis",
        headers=headers, payload=payload, timeout=60,
    )
    task_id = _extract_task_id(start_data)
    logger.info(f"IFI task created: {task_id}")
    final_data = _poll_task_until_done(api_key, task_id) if task_id else start_data

    video_url = _extract_media_url(final_data, "video")
    if not video_url:
        raise HTTPException(status_code=502, detail=f"IFI: video URL not found in response: {final_data}")
    logger.info("IFI generation successful")
    return {"video_url": video_url, "task_id": task_id, "raw_response": final_data}
