"""app/repository/workflow_repository.py"""
from sqlalchemy.orm import Session
from app.models.workflow import Workflow
from app.repository.base import BaseRepository


class WorkflowRepository(BaseRepository[Workflow]):
    def __init__(self, db: Session) -> None:
        super().__init__(Workflow, db)

    def get_by_user(self, user_id: str) -> list[Workflow]:
        return (
            self.db.query(Workflow)
            .filter(Workflow.user_id == user_id)
            .order_by(Workflow.updated_at.desc())
            .all()
        )

    def get_by_user_and_id(self, workflow_id: str, user_id: str) -> Workflow | None:
        return (
            self.db.query(Workflow)
            .filter(Workflow.id == workflow_id, Workflow.user_id == user_id)
            .first()
        )
