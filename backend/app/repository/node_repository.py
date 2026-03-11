"""app/repository/node_repository.py"""
from sqlalchemy.orm import Session
from app.models.node import Node
from app.repository.base import BaseRepository


class NodeRepository(BaseRepository[Node]):
    def __init__(self, db: Session) -> None:
        super().__init__(Node, db)

    def get_by_workflow(self, workflow_id: str) -> list[Node]:
        return self.db.query(Node).filter(Node.workflow_id == workflow_id).all()
