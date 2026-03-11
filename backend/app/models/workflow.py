import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    share_id: Mapped[str] = mapped_column(String(50), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    share_permission: Mapped[str] = mapped_column(String(20), default="private") # private, view, edit
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    owner: Mapped["User"] = relationship(back_populates="workflows")
    nodes: Mapped[list["Node"]] = relationship(back_populates="workflow", cascade="all, delete-orphan")
    edges: Mapped[list["Edge"]] = relationship(back_populates="workflow", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Workflow id={self.id} name={self.name!r}>"
