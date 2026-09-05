from sqlalchemy import String, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.db import Base


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Privado por usuario: antes estas tablas eran globales
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(500), default="")
    content: Mapped[str] = mapped_column(Text, default="")
    color: Mapped[str] = mapped_column(String(20), default="default")
    pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    tags: Mapped[str] = mapped_column(Text, default="[]")          # JSON array of strings
    attachments: Mapped[str] = mapped_column(Text, default="[]")   # JSON array of {name, url, path}
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
