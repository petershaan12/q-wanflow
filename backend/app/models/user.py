"""app/models/user.py"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    google_id: Mapped[str | None] = mapped_column(String(120), unique=True, nullable=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    profile_picture_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    plan: Mapped[str] = mapped_column(String(50), default="free")
    storage_used: Mapped[int] = mapped_column(Integer, default=0)  # Storage used in bytes
    is_active: Mapped[bool] = mapped_column(default=True)
    is_verified: Mapped[bool] = mapped_column(default=False)
    otp_code: Mapped[str | None] = mapped_column(String(6), nullable=True)
    otp_expiry: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    workflows: Mapped[list["Workflow"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    api_keys: Mapped[list["UserApiKey"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    assets: Mapped[list["Asset"]] = relationship(back_populates="owner", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r}>"

    def get_storage_limit(self) -> int:
        """Return storage limit in bytes based on plan"""
        if self.plan == "pro":
            return -1  # Unlimited
        return 1 * 1024 * 1024 * 1024  # 1 GB for free

    def get_project_limit(self) -> int:
        """Return project limit based on plan"""
        if self.plan == "pro":
            return -1  # Unlimited
        return 3  # 3 projects for free

    def has_storage_space(self, file_size: int) -> bool:
        """Check if user has enough storage space"""
        if self.plan == "pro":
            return True  # Unlimited
        return (self.storage_used + file_size) <= self.get_storage_limit()

    def can_create_project(self) -> bool:
        """Check if user can create more projects"""
        if self.plan == "pro":
            return True  # Unlimited
        return len(self.workflows) < self.get_project_limit()
