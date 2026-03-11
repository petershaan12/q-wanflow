"""
app/services/qwen_service.py
──────────────────────────────
Public façade — re-exports everything the API endpoints use.
Actual logic lives in the dedicated service modules:
  qwen_core.py          → shared HTTP/polling/key utilities
  image_service.py      → image generation
  video_t2v_service.py  → Text-to-Video
  video_i2v_service.py  → Image-to-Video
  video_r2v_service.py  → Reference-to-Video
  video_ifi_service.py  → Image First Image Last (KF2V)
  tts_service.py        → Text-to-Speech
"""

# ── Core utils (used by ai.py endpoints directly) ──────────────────────────────
from app.services.wan import (  # noqa: F401
    get_api_key_status,
    get_masked_api_key,
    upsert_api_key,
    _require_key,
    tts_generation,
    generate_t2v,
    generate_i2v,
    generate_r2v,
    generate_ifi,
    generate_t2i,
    generate_edit,
)


def text_generation(user_id: str, prompt: str, model: str,
                    temperature: float, max_tokens: int, db) -> dict:
    """
    Inline text generation (prompt enhance / QwenText node).
    Kept here directly since it's a lightweight single call.
    """
    import json
    from app.services.wan import (
        DASHSCOPE_INTL_BASE, _require_key, _post_json,
        _extract_text_content, get_logger,
    )
    logger = get_logger(__name__)
    logger.info(f"Text Generation - user={user_id}, model={model}")
    logger.debug(f"Prompt: {prompt[:200]}...")

    api_key = _require_key(user_id, db)
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "input": {"messages": [{"role": "user", "content": prompt}]},
        "parameters": {"temperature": temperature, "max_tokens": max_tokens},
    }
    try:
        data = _post_json(
            f"{DASHSCOPE_INTL_BASE}/api/v1/services/aigc/text-generation/generation",
            headers=headers, payload=payload, timeout=60,
        )
    except Exception as e:
        logger.error(f"Text generation failed: {e}")
        raise

    output = data.get("output", {}) if isinstance(data, dict) else {}
    choices = output.get("choices", []) if isinstance(output, dict) else []
    generated_text = _extract_text_content(choices[0]) if choices else ""

    if not generated_text and isinstance(output, dict):
        generated_text = (output.get("text") or "").strip()
    if not generated_text and isinstance(data, dict):
        generated_text = (data.get("text") or "").strip()

    logger.info("Text generation successful")
    return {"generated_text": generated_text, "raw_response": data}


def video_generation(user_id: str, prompt: str, duration: str,
                     resolution: str, model: str, db,
                     aspect_ratio: str = "16:9",
                     audio: bool = True,
                     shot_type: str = "single",
                     audio_url: str | None = None,
                     reference_image_url: str | None = None,
                     reference_video_url: str | None = None,
                     reference_urls: list | None = None,
                     size: str | None = None,
                     negative_prompt: str | None = None,
                     first_frame_url: str | None = None,
                     last_frame_url: str | None = None) -> dict:
    """
    Router: delegates to the correct dedicated video service based on model.
    Kept for backward compatibility with the existing ai.py endpoint.
    """
    is_kf2v = "kf2v" in model
    is_i2v  = "i2v"  in model
    is_r2v  = "r2v"  in model

    if is_kf2v:
        return generate_ifi(
            user_id=user_id, db=db,
            prompt=prompt,
            model=model,
            resolution=resolution,
            duration=duration,
            first_frame_url=first_frame_url,
            last_frame_url=last_frame_url,
            negative_prompt=negative_prompt,
        )

    if is_i2v:
        return generate_i2v(
            user_id=user_id, db=db,
            prompt=prompt,
            model=model,
            duration=duration,
            resolution=resolution,
            shot_type=shot_type,
            audio=audio,
            audio_url=audio_url,
            reference_image_url=reference_image_url or "",
            negative_prompt=negative_prompt,
        )

    if is_r2v:
        refs = reference_urls or []
        if not refs:
            if reference_video_url:
                refs.append(reference_video_url)
            if reference_image_url:
                refs.append(reference_image_url)
        return generate_r2v(
            user_id=user_id, db=db,
            prompt=prompt,
            model=model,
            duration=duration,
            size=size,
            aspect_ratio=aspect_ratio,
            shot_type=shot_type,
            audio=audio,
            audio_url=audio_url,
            reference_urls=refs,
            negative_prompt=negative_prompt,
        )

    # Default: T2V
    return generate_t2v(
        user_id=user_id, db=db,
        prompt=prompt,
        model=model,
        duration=duration,
        size=size,
        aspect_ratio=aspect_ratio,
        shot_type=shot_type,
        audio=audio,
        audio_url=audio_url,
        negative_prompt=negative_prompt,
    )
def image_generation(user_id: str, prompt: str, style: str,
                     resolution: str, model: str, db,
                     aspect_ratio: str = "1:1",
                     negative_prompt: str | None = None,
                     reference_image_url: str | None = None,
                     reference_image_urls: list | None = None,
                     size: str | None = None,
                     n: int = 1,
                     enable_interleave: bool | None = None) -> dict:
    """
    Router: delegates to T2I or Edit image services.
    """
    # If reference_image_urls is provided (Multi-Ref/Edit mode)
    # OR if model is wan2.6-image and enable_interleave is False
    is_edit = (reference_image_urls is not None and len(reference_image_urls) > 0) \
              or (enable_interleave is False)

    if is_edit:
        return generate_edit(
            user_id=user_id, db=db,
            prompt=prompt,
            reference_image_urls=reference_image_urls or ([reference_image_url] if reference_image_url else []),
            size=size or "1K",
            n=n,
            negative_prompt=negative_prompt,
        )

    # Default to T2I
    return generate_t2i(
        user_id=user_id, db=db,
        prompt=prompt,
        aspect_ratio=aspect_ratio,
        model=model,
        negative_prompt=negative_prompt,
    )
