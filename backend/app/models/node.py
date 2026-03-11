import uuid
from sqlalchemy import String, Integer, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class Node(Base):
    __tablename__ = "nodes"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    workflow_id: Mapped[str] = mapped_column(ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # input | prompt | qwen_text | wan_image | output
    position_x: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    position_y: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    config: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Relationships
    workflow: Mapped["Workflow"] = relationship(back_populates="nodes")
    source_edges: Mapped[list["Edge"]] = relationship(
        foreign_keys="Edge.source_node_id", back_populates="source_node", cascade="all, delete-orphan"
    )
    target_edges: Mapped[list["Edge"]] = relationship(
        foreign_keys="Edge.target_node_id", back_populates="target_node", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Node id={self.id} type={self.type!r} workflow={self.workflow_id}>"
