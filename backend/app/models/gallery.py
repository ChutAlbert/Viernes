from datetime import datetime
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.db import Base


class GalleryItem(Base):
    __tablename__ = "gallery_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    media_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "image" | "video"
    tags: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class GalleryConfig(Base):
    __tablename__ = "gallery_config"

    id: Mapped[int] = mapped_column(primary_key=True)
    passphrase_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    kdf_salt: Mapped[str] = mapped_column(String(255), nullable=False)
