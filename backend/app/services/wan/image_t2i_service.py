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

    try:
        start_data = _post_json(endpoint, headers=headers, payload=payload, timeout=60)
    except HTTPException as exc:
        if exc.status_code in {400, 403} and _is_async_not_supported_error(exc.detail):
            start_data = _post_json(endpoint, headers=make_headers(api_key), payload=payload, timeout=60)
        else:
            raise

    task_id = _extract_task_id(start_data)
    final_data = _poll_task_until_done(api_key, task_id) if task_id else start_data

    image_url = _extract_media_url(final_data, "image")
    if not image_url:
        err_msg = f"T2I: Image URL not found: {final_data}"
        logger.error(err_msg)
        raise HTTPException(status_code=502, detail=err_msg)

    result = {"image_url": image_url, "task_id": task_id, "raw_response": final_data}
    
    return result
