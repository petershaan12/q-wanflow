"""
app/services/wan/image_t2i_service.py
───────────────────────────────────────
Text-to-Image / Interleaved generation.
Models: wan2.6-t2i, wan2.2-t2i-flash, wan2.6-image
"""
import json
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.utils.logger import get_logger
from .qwen_core import (
    DASHSCOPE_INTL_BASE,
    _require_key, _validate_image_model,
    _post_json, _poll_task_until_done,
    _extract_task_id, _extract_media_url,
    _is_async_not_supported_error,
    make_async_headers, make_headers,
)

logger = get_logger(__name__)

def generate_t2i(
    user_id: str,
    db: Session,
    *,
    prompt: str,
    aspect_ratio: str = "1:1",
    model: str = "wan2.6-t2i",
    negative_prompt: str | None = None,
) -> dict:
    """Pure Text-to-Image generation."""
    logger.info(f"T2I - user={user_id}, model={model}, aspect={aspect_ratio}")

    api_key = _require_key(user_id, db)
    _validate_image_model(model)

    parameters: dict = {
        "prompt_extend": True,
        "watermark": False,
        "aspect_ratio": aspect_ratio
    }
    if negative_prompt:
        parameters["negative_prompt"] = negative_prompt

    content = [{"text": prompt}]

    payload = {
        "model": model,
        "input": {
            "messages": [{"role": "user", "content": content}]
        },
        "parameters": parameters,
    }
    
    logger.info(f"T2I Request Payload: {json.dumps(payload)}")

    headers = make_async_headers(api_key)
    endpoint = f"{DASHSCOPE_INTL_BASE}/api/v1/services/aigc/multimodal-generation/generation"

    is_sync = False
    try:
        start_data = _post_json(endpoint, headers=headers, payload=payload, timeout=60)
    except HTTPException as exc:
        if exc.status_code in {400, 403} and _is_async_not_supported_error(exc.detail):
            # Fallback to sync mode
            is_sync = True
            start_data = _post_json(endpoint, headers=make_headers(api_key), payload=payload, timeout=60)
        else:
            raise

    task_id = _extract_task_id(start_data)

    # For sync responses or if no task_id (direct response), return immediately with result
    if is_sync or not task_id:
        image_url = _extract_media_url(start_data, "image")
        if not image_url:
            err_msg = f"T2I: Image URL not found in sync response: {start_data}"
            logger.error(err_msg)
            raise HTTPException(status_code=502, detail=err_msg)
        return {
            "image_url": image_url,
            "task_id": task_id,
            "status": "SUCCEEDED",
            "raw_response": start_data
        }

    # For async responses, return task_id immediately (frontend will poll)
    logger.info(f"T2I async task started: {task_id}")
    return {
        "image_url": None,
        "task_id": task_id,
        "status": "PENDING",
        "raw_response": start_data
    }
