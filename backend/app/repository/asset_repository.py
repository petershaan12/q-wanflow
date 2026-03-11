"""app/repository/asset_repository.py"""
from sqlalchemy.orm import Session
from app.models.asset import Asset
from app.repository.base import BaseRepository


class AssetRepository(BaseRepository[Asset]):
    def __init__(self, db: Session) -> None:
        super().__init__(Asset, db)

    def get_by_user(self, user_id: str) -> list[Asset]:
        return (
            self.db.query(Asset)
            .filter(Asset.user_id == user_id)
            .order_by(Asset.created_at.desc())
            .all()
        )

    def get_by_user_and_id(self, asset_id: str, user_id: str) -> Asset | None:
        return (
            self.db.query(Asset)
            .filter(Asset.id == asset_id, Asset.user_id == user_id)
            .first()
        )
