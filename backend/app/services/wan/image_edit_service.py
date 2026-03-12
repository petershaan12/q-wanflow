"""
app/services/wan/image_edit_service.py
────────────────────────────────────────
Image Editing / Multi-Reference generation.
Models: wan2.6-image
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

def generate_edit(
    user_id: str,
    db: Session,
    *,
    prompt: str,
    reference_image_urls: list,        # Must have 1 to 4 images
    size: str = "1K",                  # "1K" or "2K"
    n: int = 1,
    negative_prompt: str | None = None,
) -> dict:
    """Image editing / style consistency mode (enable_interleave=False)."""
    logger.info(f"Image Edit - user={user_id}, images={len(reference_image_urls)}, size={size}")

    if not reference_image_urls:
        raise HTTPException(status_code=400, detail="Edit mode requires at least 1 reference image.")

    api_key = _require_key(user_id, db)
    _validate_image_model("wan2.6-image")

    parameters: dict = {
        "prompt_extend": True,
        "watermark": False,
        "enable_interleave": False,
        "size": size,
        "n": n
    }
    if negative_prompt:
        parameters["negative_prompt"] = negative_prompt

    content = [{"text": prompt}]
    for url in reference_image_urls:
        content.append({"image": url})

    payload = {
        "model": "wan2.6-image",
        "input": {
            "messages": [{"role": "user", "content": content}]
        },
        "parameters": parameters,
    }
    
    logger.info(f"Edit Request Payload: {json.dumps(payload)}")
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
            err_msg = f"Edit: Image URL not found in sync response: {start_data}"
            logger.error(err_msg)
            raise HTTPException(status_code=502, detail=err_msg)
        return {
            "image_url": image_url,
            "task_id": task_id,
            "status": "SUCCEEDED",
            "raw_response": start_data
        }

    # For async responses, return task_id immediately (frontend will poll)
    logger.info(f"Edit async task started: {task_id}")
    return {
        "image_url": None,
        "task_id": task_id,
        "status": "PENDING",
        "raw_response": start_data
    }
