"""app/services/asset_service.py
──────────────────────────────
Asset CRUD business logic.
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.asset import Asset
from app.models.node import Node
from app.models.workflow import Workflow
from app.models.user import User
from app.repository.asset_repository import AssetRepository


def _strip_asset_references_from_node_config(config: dict | None, asset: Asset) -> tuple[dict | None, bool]:
    if not isinstance(config, dict):
        return config, False

    reference_values = {v for v in (asset.content, asset.file_path) if isinstance(v, str) and v.strip()}
    if not reference_values:
        return config, False

    changed = False
    updated_config = dict(config)

    for key in ("url", "imageUrl", "videoUrl"):
        if updated_config.get(key) in reference_values:
            updated_config[key] = ""
            changed = True

    for key in ("assetId", "asset_id"):
        if updated_config.get(key) == asset.id:
            updated_config[key] = None
            changed = True

    urls = updated_config.get("urls")
    if isinstance(urls, list):
        filtered_urls: list = []
        removed_any = False
        for item in urls:
            if isinstance(item, str):
                if item in reference_values:
                    removed_any = True
                    continue
                filtered_urls.append(item)
                continue

            if isinstance(item, dict):
                item_url = item.get("url")
                if item_url in reference_values:
                    removed_any = True
                    continue
                filtered_urls.append(item)
                continue

            filtered_urls.append(item)

        if removed_any:
            updated_config["urls"] = filtered_urls
            changed = True

    return updated_config, changed


def _cleanup_asset_references_in_nodes(asset: Asset, user_id: str, db: Session) -> None:
    nodes = (
        db.query(Node)
        .join(Workflow, Workflow.id == Node.workflow_id)
        .filter(Workflow.user_id == user_id)
        .all()
    )

    for node in nodes:
        cleaned_config, changed = _strip_asset_references_from_node_config(node.config, asset)
        if changed:
            node.config = cleaned_config


def list_assets(user_id: str, db: Session) -> list[Asset]:
    return AssetRepository(db).get_by_user(user_id)


def create_asset(user_id: str, name: str, asset_type: str, content: str | None, file_path: str | None, db: Session, file_size: int = 0) -> Asset:
    # Check storage limit
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        if not user.has_storage_space(file_size):
            if user.plan == "free":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Storage limit reached. You have used {format_bytes(user.storage_used)} of {format_bytes(user.get_storage_limit())}. Upgrade to Pro for unlimited storage."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Storage limit reached. Please contact support."
                )

    asset = Asset(
        user_id=user_id,
        name=name,
        type=asset_type,
        content=content,
        file_path=file_path,
    )
    created_asset = AssetRepository(db).create(asset)

    # Update storage used
    if file_size > 0 and user:
        user.storage_used += file_size
        db.commit()

    return created_asset


def update_asset(asset_id: str, user_id: str, name: str, asset_type: str, content: str | None, file_path: str | None, db: Session) -> Asset:
    repo = AssetRepository(db)
    asset = repo.get_by_user_and_id(asset_id, user_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

    asset.name = name
    asset.type = asset_type
    asset.content = content
    asset.file_path = file_path
    return repo.update(asset)


def delete_asset(asset_id: str, user_id: str, db: Session) -> None:
    repo = AssetRepository(db)
    asset = repo.get_by_user_and_id(asset_id, user_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

    # Update storage used
    user = db.query(User).filter(User.id == user_id).first()
    if user and asset.file_path:
        # Estimate file size - in production, you might want to store actual file size
        # For now, we'll just use a placeholder or get from storage
        pass

    _cleanup_asset_references_in_nodes(asset=asset, user_id=user_id, db=db)
    repo.delete(asset)


def format_bytes(size: int) -> str:
    """Format bytes to human readable string"""
    if size < 0:
        return "Unlimited"
    if size < 1024:
        return f"{size} B"
    if size < 1024 * 1024:
        return f"{size / 1024:.1f} KB"
    if size < 1024 * 1024 * 1024:
        return f"{size / (1024 * 1024):.1f} MB"
    return f"{size / (1024 * 1024 * 1024):.1f} GB"


def get_user_storage_info(user_id: str, db: Session) -> dict:
    """Get storage info for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    storage_limit = user.get_storage_limit()
    return {
        "plan": user.plan,
        "storage_used": user.storage_used,
        "storage_limit": storage_limit,
        "storage_limit_human": format_bytes(storage_limit) if storage_limit > 0 else "Unlimited",
        "storage_used_human": format_bytes(user.storage_used),
        "storage_percent": round((user.storage_used / storage_limit) * 100, 1) if storage_limit > 0 else 0,
        "project_count": len(user.workflows),
        "project_limit": user.get_project_limit(),
        "project_limit_human": "Unlimited" if user.plan == "pro" else str(user.get_project_limit()),
        "can_upload": user.has_storage_space(0),
        "can_create_project": user.can_create_project(),
    }
