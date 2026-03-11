from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.api import schemas
from app.api.deps import get_current_user
from app.core.database import get_db
from app.services import asset_service
from app.models.user import User

router = APIRouter()


@router.get("/storage-info")
def get_storage_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return asset_service.get_user_storage_info(user_id=current_user.id, db=db)


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
