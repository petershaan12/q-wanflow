import uuid
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class Edge(Base):
    __tablename__ = "edges"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    workflow_id: Mapped[str] = mapped_column(ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    source_node_id: Mapped[str] = mapped_column(ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    target_node_id: Mapped[str] = mapped_column(ForeignKey("nodes.id", ondelete="CASCADE"), nullable=False)
    source_handle: Mapped[str | None] = mapped_column(String(50), nullable=True)
    target_handle: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    workflow: Mapped["Workflow"] = relationship(back_populates="edges")
    source_node: Mapped["Node"] = relationship(foreign_keys=[source_node_id], back_populates="source_edges")
    target_node: Mapped["Node"] = relationship(foreign_keys=[target_node_id], back_populates="target_edges")

    def __repr__(self) -> str:
        return f"<Edge id={self.id} {self.source_node_id}→{self.target_node_id}>"
