"""app/repository/api_key_repository.py"""
from sqlalchemy.orm import Session
from app.models.api_key import UserApiKey
from app.repository.base import BaseRepository


class ApiKeyRepository(BaseRepository[UserApiKey]):
    def __init__(self, db: Session) -> None:
        super().__init__(UserApiKey, db)

    def get_by_user_and_provider(self, user_id: str, provider: str = "qwen") -> UserApiKey | None:
        return (
            self.db.query(UserApiKey)
            .filter(UserApiKey.user_id == user_id, UserApiKey.provider == provider)
            .first()
        )
