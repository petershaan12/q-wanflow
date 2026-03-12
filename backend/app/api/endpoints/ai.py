from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import schemas
from app.api.deps import get_current_user
from app.core.database import get_db
from app.services import qwen_service
from app.models.user import User
from app.models.asset import Asset
from app.repository.asset_repository import AssetRepository
from datetime import datetime

router = APIRouter()


@router.post("/api-key")
def save_api_key(
    request: schemas.QwenApiKeyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    qwen_service.upsert_api_key(user_id=current_user.id, api_key=request.api_key, db=db)
    return {"message": "API key saved"}


@router.get("/task-status/{task_id}")
def get_task_status(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check the status of a DashScope async task.
    Returns task_id, status (PENDING, PROCESSING, SUCCEEDED, FAILED),
    and media URLs if the task is completed.
    """
    try:
        result = qwen_service.check_task_status(
            user_id=current_user.id,
            task_id=task_id,
            db=db
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api-key/status")
def api_key_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    configured = qwen_service.get_api_key_status(user_id=current_user.id, db=db)
    return {"configured": configured}


@router.get("/api-key")
def get_api_key_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    masked_key = qwen_service.get_masked_api_key(user_id=current_user.id, db=db)
    return {
        "configured": masked_key is not None,
        "masked_key": masked_key,
    }

@router.post("/prompt/enhance")
def enhance_prompt(
    request: schemas.PromptEnhanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # We'll use qwen-turbo to enhance the prompt
        system_prompt = (
            "You are a helpful assistant that enhances user prompts for image and video generation AI. "
            "Your goal is to take a simple prompt and make it more detailed, descriptive, and high-quality, "
            "while keeping the original intent. Output only the enhanced prompt text, nothing else."
        )
        full_prompt = f"{system_prompt}\n\nUser Prompt: {request.prompt}"

        result = qwen_service.text_generation(
            user_id=current_user.id,
            prompt=full_prompt,
            model="qwen-turbo",
            temperature=0.7,
            max_tokens=500,
            db=db
        )
        enhanced = (result.get("generated_text") or "").strip()
        if not enhanced:
            enhanced = request.prompt.strip()
        return {"enhanced_prompt": enhanced}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-image")
def generate_image(
    request: schemas.ImageGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = qwen_service.image_generation(
            user_id=current_user.id,
            prompt=request.prompt,
            style=request.style or "Auto",
            resolution=request.resolution or "1024x1024",
            aspect_ratio=request.aspect_ratio or "1:1",
            model=request.model or "wan2.6-t2i",
            negative_prompt=request.negative_prompt,
            reference_image_url=request.reference_image_url,
            reference_image_urls=request.reference_image_urls,
            size=request.size,
            n=request.n or 1,
            enable_interleave=request.enable_interleave,
            db=db
        )

        image_url = result.get("image_url")
        if image_url:
            AssetRepository(db).create(
                Asset(
                    user_id=current_user.id,
                    name=f"AI Image {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}",
                    type="image",
                    content=image_url,
                    file_path=None,
                )
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-video")
def generate_video(
    request: schemas.VideoGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = qwen_service.video_generation(
            user_id=current_user.id,
            prompt=request.prompt,
            duration=request.duration or "5s",
            resolution=request.resolution or "1024x576",
            aspect_ratio=request.aspect_ratio or "16:9",
            model=request.model or "wan2.6-t2v",
            audio=request.audio if request.audio is not None else True,
            shot_type=request.shot_type or "single",
            audio_url=request.audio_url,
            reference_image_url=request.reference_image_url,
            reference_video_url=request.reference_video_url,
            reference_urls=request.reference_urls,
            size=request.size,
            negative_prompt=request.negative_prompt,
            first_frame_url=request.first_frame_url,
            last_frame_url=request.last_frame_url,
            db=db
        )

        video_url = result.get("video_url")
        if video_url:
            AssetRepository(db).create(
                Asset(
                    user_id=current_user.id,
                    name=f"AI Video {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}",
                    type="video",
                    content=video_url,
                    file_path=None,
                )
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-speech")
def generate_speech(
    request: schemas.TTSGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = qwen_service.tts_generation(
            user_id=current_user.id,
            prompt=request.prompt,
            voice=request.voice,
            model=request.model,
            language=request.language or "english",
            db=db
        )
        
        audio_url = result.get("audio_url")
        if audio_url and not audio_url.startswith("data:"):
            AssetRepository(db).create(
                Asset(
                    user_id=current_user.id,
                    name=f"AI Voice {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}",
                    type="audio",
                    content=audio_url,
                    file_path=None,
                )
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
