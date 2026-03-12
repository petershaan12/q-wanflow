"""
app/services/video_i2v_service.py
──────────────────────────────────
Image-to-Video generation.
Models: wan2.6-i2v, wan2.6-i2v-flash, wan2.5-i2v-preview

API params:
  - resolution: "720P" | "1080P"  (NO aspect_ratio — derived from reference image)
  - duration: int seconds
  - input.img_url: required reference image
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

I2V_MODELS = {"wan2.6-i2v", "wan2.6-i2v-flash", "wan2.5-i2v-preview"}


def generate_i2v(
    user_id: str,
    db: Session,
    *,
    prompt: str,
    reference_image_url: str,
    model: str = "wan2.6-i2v",
    duration: str = "5s",
    resolution: str = "720P",           # "720" or "1080" — NO aspect_ratio
    shot_type: str = "single",
    audio: bool = True,
    audio_url: str | None = None,
    negative_prompt: str | None = None,
) -> dict:
    """Generate an image-to-video clip with the Wan I2V API."""
    logger.info(f"I2V - user={user_id}, model={model}, resolution={resolution}, shot_type={shot_type}")

    if not reference_image_url:
        raise HTTPException(status_code=400, detail="I2V: reference_image_url is required.")

    api_key = _require_key(user_id, db)
    _validate_video_model(model)

    try:
        duration_sec = int(duration.replace("s", ""))
    except (ValueError, AttributeError):
        duration_sec = 5

    parameters = {
        "prompt_extend": True,
        "duration": duration_sec,
        "resolution": resolution,          
    }
    if shot_type:
        parameters["shot_type"] = shot_type
    if negative_prompt:
        parameters["negative_prompt"] = negative_prompt
    if "wan2.6" in model:
        parameters["audio"] = audio

    input_data: dict = {
        "prompt": prompt,
        "img_url": reference_image_url,
    }
    if audio_url:
        input_data["audio_url"] = audio_url

    payload = {"model": model, "input": input_data, "parameters": parameters}
    logger.info(f"I2V Request Payload: {json.dumps(payload)}")

    headers = make_async_headers(api_key)
    start_data = _post_json(
        f"{DASHSCOPE_INTL_BASE}/api/v1/services/aigc/video-generation/video-synthesis",
        headers=headers, payload=payload, timeout=60,
    )
    task_id = _extract_task_id(start_data)
    logger.info(f"I2V task created: {task_id}")

    # For async responses, return task_id immediately (frontend will poll)
    if task_id:
        return {
            "video_url": None,
            "task_id": task_id,
            "status": "PENDING",
            "raw_response": start_data
        }

    # For sync responses (no task_id), extract video_url directly
    video_url = _extract_media_url(start_data, "video")
    if not video_url:
        err_msg = f"I2V: video URL not found in response: {start_data}"
        logger.error(err_msg)
        raise HTTPException(status_code=502, detail=err_msg)
    logger.info("I2V generation successful (sync)")
    return {"video_url": video_url, "task_id": None, "status": "SUCCEEDED", "raw_response": start_data}
