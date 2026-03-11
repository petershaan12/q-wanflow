"""app/repository/edge_repository.py"""
from sqlalchemy.orm import Session
from app.models.edge import Edge
from app.repository.base import BaseRepository


class EdgeRepository(BaseRepository[Edge]):
    def __init__(self, db: Session) -> None:
        super().__init__(Edge, db)

    def get_by_workflow(self, workflow_id: str) -> list[Edge]:
        return self.db.query(Edge).filter(Edge.workflow_id == workflow_id).all()
