"""
app/repository/base.py
────────────────────────
Generic CRUD repository. All specific repos extend this.
"""
from typing import Generic, TypeVar, Type
from sqlalchemy.orm import Session
from app.models.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    def __init__(self, model: Type[ModelT], db: Session) -> None:
        self.model = model
        self.db = db

    def get(self, id: str | int) -> ModelT | None:
        return self.db.query(self.model).filter(self.model.id == id).first()

    def get_all(self) -> list[ModelT]:
        return self.db.query(self.model).all()

    def create(self, obj: ModelT) -> ModelT:
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def update(self, obj: ModelT) -> ModelT:
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, obj: ModelT) -> None:
        self.db.delete(obj)
        self.db.commit()

    def save(self) -> None:
        self.db.commit()
