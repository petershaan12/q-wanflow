"""
app/services/video_t2v_service.py
──────────────────────────────────
Text-to-Video generation.
Models: wan2.6-t2v, wan2.5-t2v-preview
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

T2V_MODELS = {"wan2.6-t2v", "wan2.5-t2v-preview"}

SIZE_MAP = {
    "720":  {"16:9": "1280*720",  "9:16": "720*1280",  "4:3": "1088*832", "3:4": "832*1088",  "1:1": "960*960"},
    "1080": {"16:9": "1920*1080", "9:16": "1080*1920", "4:3": "1632*1248","3:4": "1248*1632", "1:1": "1440*1440"},
}


def generate_t2v(
    user_id: str,
    db: Session,
    *,
    prompt: str,
    model: str = "wan2.6-t2v",
    duration: str = "5s",
    size: str | None = None,           # pre-computed from frontend e.g. "1280*720"
    aspect_ratio: str = "16:9",
    shot_type: str = "single",
    audio: bool = True,
    audio_url: str | None = None,
    negative_prompt: str | None = None,
) -> dict:
    """Generate a text-to-video clip with the Wan T2V API."""
    logger.info(f"T2V - user={user_id}, model={model}, duration={duration}")

    api_key = _require_key(user_id, db)
    _validate_video_model(model)

    try:
        duration_sec = int(duration.replace("s", ""))
    except (ValueError, AttributeError):
        duration_sec = 5

    # Size: use pre-computed or map from aspect_ratio (default 720p)
    resolved_size = size or SIZE_MAP.get("720").get(aspect_ratio, "1280*720")

    parameters = {
        "prompt_extend": True,
        "duration": duration_sec,
        "size": resolved_size,
    }
    if shot_type:
        parameters["shot_type"] = shot_type
    if negative_prompt:
        parameters["negative_prompt"] = negative_prompt
    if "wan2.6" in model:
        parameters["audio"] = audio

    input_data: dict = {"prompt": prompt}
    if audio_url:
        input_data["audio_url"] = audio_url

    payload = {"model": model, "input": input_data, "parameters": parameters}
    logger.info(f"T2V Request Payload: {json.dumps(payload)}")

    headers = make_async_headers(api_key)
    start_data = _post_json(
        f"{DASHSCOPE_INTL_BASE}/api/v1/services/aigc/video-generation/video-synthesis",
        headers=headers, payload=payload, timeout=60,
    )
    task_id = _extract_task_id(start_data)
    logger.info(f"T2V task created: {task_id}")
    final_data = _poll_task_until_done(api_key, task_id) if task_id else start_data

    video_url = _extract_media_url(final_data, "video")
    if not video_url:
        err_msg = f"T2V: video URL not found in response: {final_data}"
        logger.error(err_msg)
        raise HTTPException(status_code=502, detail=err_msg)
    logger.info("T2V generation successful")
    return {"video_url": video_url, "task_id": task_id, "raw_response": final_data}
