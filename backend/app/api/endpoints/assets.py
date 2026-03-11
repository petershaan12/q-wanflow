from fastapi import APIRouter, Depends, status, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api import schemas
from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.config import settings
from app.services import asset_service
from app.models.user import User

import os
import shutil
import uuid

router = APIRouter()


@router.get("/storage-info")
def get_storage_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return asset_service.get_user_storage_info(user_id=current_user.id, db=db)


@router.post("/upload")
def upload_asset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Security: Whitelist allowed extensions
    ALLOWED_EXTENSIONS = {
        # Images
        "jpg", "jpeg", "png", "gif", "webp", "svg",
        # Video
        "mp4", "webm", "avi", "mov",
        # Audio
        "mp3", "wav", "ogg", "m4a",
        # Documents / Prompts
        "txt", "md", "json", "pdf", "csv"
    }

    filename = file.filename
    ext = (filename.split(".")[-1] if "." in filename else "").lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '.{ext}' is not allowed for security reasons."
        )
    
    asset_type = "file"
    if ext in ["jpg", "jpeg", "png", "gif", "webp", "svg"]:
        asset_type = "image"
    elif ext in ["mp4", "webm", "avi", "mov"]:
        asset_type = "video"
    elif ext in ["mp3", "wav", "ogg", "m4a"]:
        asset_type = "audio"
    elif ext in ["txt", "md", "json", "pdf", "csv"]:
        asset_type = "prompt_template"

    # Unique filename
    unique_filename = f"{uuid.uuid4().hex[:12]}_{filename}"
    # Ensure static directory structure
    save_dir = os.path.join("static", "assets")
    os.makedirs(save_dir, exist_ok=True)
    
    filepath = os.path.join(save_dir, unique_filename)
    
    # Read size
    file.file.seek(0, 2) # Seek to end
    file_size = file.file.tell()
    file.file.seek(0) # Seek back to start

    # Save file
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    url_path = f"/static/assets/{unique_filename}"
    base_url = settings.BASE_URL.rstrip("/")
    full_url = f"{base_url}{url_path}"
    
    # Create asset record
    asset = asset_service.create_asset(
        user_id=current_user.id,
        name=filename,
        asset_type=asset_type,
        content=full_url,
        file_path=full_url,
        file_size=file_size,
        db=db
    )
    
    return asset


@router.get("/", response_model=List[schemas.AssetResponse])
def list_assets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return asset_service.list_assets(user_id=current_user.id, db=db)


@router.post("/", response_model=schemas.AssetResponse)
def create_asset(
    request: schemas.AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return asset_service.create_asset(
        user_id=current_user.id,
        name=request.name,
        asset_type=request.type,
        content=request.content,
        file_path=request.file_path,
        db=db,
    )


@router.put("/{asset_id}", response_model=schemas.AssetResponse)
def update_asset(
    asset_id: str,
    request: schemas.AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return asset_service.update_asset(
        asset_id=asset_id,
        user_id=current_user.id,
        name=request.name,
        asset_type=request.type,
        content=request.content,
        file_path=request.file_path,
        db=db,
    )


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    asset_service.delete_asset(asset_id=asset_id, user_id=current_user.id, db=db)
    return None
