"""
app/services/qwen_core.py
──────────────────────────────
Shared utilities: HTTP helpers, polling, URL extraction, key management.
Imported by all individual video/image/tts service modules.
"""
import time
import json

import requests
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.api_key import UserApiKey
from app.repository.api_key_repository import ApiKeyRepository
from app.utils.logger import get_logger

logger = get_logger(__name__)

DASHSCOPE_INTL_BASE = "https://dashscope-intl.aliyuncs.com"

SUPPORTED_IMAGE_MODELS = {
    "wan2.6-t2i",
    "wan2.2-t2i-flash",
    "wan2.6-image",
    "wan2.5-i2i-preview",
}

SUPPORTED_VIDEO_MODELS = {
    "wan2.6-t2v",
    "wan2.6-i2v",
    "wan2.6-i2v-flash",
    "wan2.6-r2v",
    "wan2.6-r2v-flash",
    "wan2.5-t2v-preview",
    "wan2.5-i2v-preview",
    "wan2.2-kf2v-flash",
    "wan2.1-kf2v-plus",
}


# ── Key helpers ────────────────────────────────────────────────────────────────

def get_api_key_status(user_id: str, db: Session) -> bool:
    key = ApiKeyRepository(db).get_by_user_and_provider(user_id, "qwen")
    return key is not None


def get_masked_api_key(user_id: str, db: Session) -> str | None:
    key = ApiKeyRepository(db).get_by_user_and_provider(user_id, "qwen")
    if not key or not key.api_key:
        return None
    raw = key.api_key.strip()
    if len(raw) <= 8:
        return "*" * len(raw)
    return f"{raw[:4]}{'*' * (len(raw) - 8)}{raw[-4:]}"


def _require_key(user_id: str, db: Session) -> str:
    key = ApiKeyRepository(db).get_by_user_and_provider(user_id, "qwen")
    if not key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Qwen API key not configured",
        )
    candidate = (key.api_key or "").strip()
    if not candidate or "*" in candidate:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stored API key is invalid. Please re-enter your full API key in Settings.",
        )
    return candidate


def upsert_api_key(user_id: str, api_key: str, db: Session) -> None:
    normalized = api_key.strip()
    if "*" in normalized or len(normalized) < 16:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid full API key, not a masked value.",
        )
    _validate_api_key(normalized)
    repo = ApiKeyRepository(db)
    key = repo.get_by_user_and_provider(user_id, "qwen")
    if key:
        key.api_key = normalized
        repo.save()
    else:
        repo.create(UserApiKey(user_id=user_id, provider="qwen", api_key=normalized))


# ── Validators ─────────────────────────────────────────────────────────────────

def _validate_api_key(api_key: str) -> None:
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": "qwen-turbo",
        "input": {"messages": [{"role": "user", "content": "ping"}]},
        "parameters": {"temperature": 0, "max_tokens": 1},
    }
    try:
        resp = requests.post(
            f"{DASHSCOPE_INTL_BASE}/api/v1/services/aigc/text-generation/generation",
            headers=headers, json=payload, timeout=20,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Unable to verify API key: {exc}")
    if resp.status_code == 401:
        raise HTTPException(status_code=400, detail="Invalid API key provided.")
    if resp.status_code >= 400:
        raise HTTPException(status_code=400, detail=f"API key verification failed: {resp.text}")


def _validate_image_model(model: str) -> None:
    if model not in SUPPORTED_IMAGE_MODELS:
        raise HTTPException(status_code=400, detail=f"Unsupported image model: {model}")


def _validate_video_model(model: str) -> None:
    if model not in SUPPORTED_VIDEO_MODELS:
        raise HTTPException(status_code=400, detail=f"Unsupported video model: {model}")


# ── HTTP helpers ───────────────────────────────────────────────────────────────

def _post_json(url: str, headers: dict, payload: dict, timeout: int) -> dict:
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except requests.HTTPError as exc:
        detail = exc.response.text if exc.response is not None else str(exc)
        code = exc.response.status_code if exc.response is not None else 500
        raise HTTPException(status_code=code, detail=detail)
    except requests.RequestException as exc:
        raise HTTPException(status_code=500, detail=f"DashScope API unreachable: {exc}")


def _get_json(url: str, headers: dict, timeout: int) -> dict:
    try:
        resp = requests.get(url, headers=headers, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except requests.HTTPError as exc:
        detail = exc.response.text if exc.response is not None else str(exc)
        code = exc.response.status_code if exc.response is not None else 500
        raise HTTPException(status_code=code, detail=detail)
    except requests.RequestException as exc:
        raise HTTPException(status_code=500, detail=f"DashScope task API unreachable: {exc}")


# ── Task polling ───────────────────────────────────────────────────────────────

def _poll_task_until_done(api_key: str, task_id: str, timeout_sec: int = 600, interval_sec: float = 2.0) -> dict:
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    url = f"{DASHSCOPE_INTL_BASE}/api/v1/tasks/{task_id}"
    deadline = time.time() + timeout_sec
    last = None
    while time.time() < deadline:
        data = _get_json(url, headers=headers, timeout=30)
        last = data
        task_status = (
            data.get("output", {}).get("task_status")
            or data.get("task_status")
            or ""
        )
        s = str(task_status).upper()
        if s in {"SUCCEEDED", "SUCCESS", "COMPLETED"}:
            return data
        if s in {"FAILED", "FAIL", "CANCELED", "CANCELLED"}:
            raise HTTPException(status_code=502, detail=f"DashScope task failed: {data}")
        time.sleep(interval_sec)
    raise HTTPException(status_code=504, detail=f"DashScope task timeout: {last}")


# ── Response extractors ────────────────────────────────────────────────────────

def _extract_task_id(data: dict) -> str | None:
    return (
        data.get("output", {}).get("task_id")
        or data.get("task_id")
        or data.get("data", {}).get("task_id")
    )


def _extract_results(data: dict) -> list:
    output = data.get("output", {}) if isinstance(data, dict) else {}
    if isinstance(output.get("results"), list):
        return output.get("results")
    if isinstance(data.get("results"), list):
        return data.get("results")
    return []


def _extract_media_url(data: dict, kind: str) -> str | None:
    if kind == "image":
        direct = data.get("image_url") or data.get("output", {}).get("image_url")
        if isinstance(direct, str) and direct:
            return direct
    if kind == "video":
        direct = data.get("video_url") or data.get("output", {}).get("video_url")
        if isinstance(direct, str) and direct:
            return direct

    for row in _extract_results(data):
        if not isinstance(row, dict):
            continue
        if kind == "image" and row.get("url"):
            return row.get("url")
        if kind == "video":
            return row.get("video_url") or row.get("url")
        if kind == "audio":
            return row.get("audio_url") or row.get("url")

    output = data.get("output", {}) if isinstance(data, dict) else {}
    choices = output.get("choices", []) if isinstance(output, dict) else []
    for choice in choices:
        if not isinstance(choice, dict):
            continue
        content = choice.get("message", {}).get("content", [])
        if isinstance(content, dict):
            content = [content]
        if not isinstance(content, list):
            continue
        for item in content:
            if not isinstance(item, dict):
                continue
            if kind == "image":
                u = item.get("image") or item.get("image_url") or item.get("url")
                if isinstance(u, str) and u:
                    return u
            if kind == "video":
                u = item.get("video") or item.get("video_url") or item.get("url")
                if isinstance(u, str) and u:
                    return u
            if kind == "audio":
                u = item.get("audio") or item.get("audio_url") or item.get("url")
                if isinstance(u, str) and u:
                    return u
    return None


def _extract_text_content(choice: dict) -> str:
    if not isinstance(choice, dict):
        return ""
    direct_text = choice.get("text")
    if isinstance(direct_text, str) and direct_text.strip():
        return direct_text.strip()
    message = choice.get("message", {})
    content = message.get("content", "")
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, dict):
        return (content.get("text") or "").strip()
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                t = item.get("text")
                if isinstance(t, str):
                    parts.append(t)
        return "\n".join(p.strip() for p in parts if p and p.strip())
    return ""


def _is_async_not_supported_error(detail) -> bool:
    code = ""
    message = ""
    raw = ""
    if isinstance(detail, dict):
        code = str(detail.get("code", ""))
        message = str(detail.get("message", ""))
        raw = json.dumps(detail)
    elif isinstance(detail, str):
        raw = detail
        try:
            parsed = json.loads(detail)
            if isinstance(parsed, dict):
                code = str(parsed.get("code", ""))
                message = str(parsed.get("message", ""))
        except json.JSONDecodeError:
            pass
    haystack = f"{raw} {message}".lower()
    return code == "AccessDenied" and "does not support asynchronous calls" in haystack


def make_async_headers(api_key: str) -> dict:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
    }


def make_headers(api_key: str) -> dict:
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


