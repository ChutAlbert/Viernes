from sqlalchemy import String, Boolean, Text, DateTime, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.db import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Privado por usuario: antes estas tablas eran globales
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[str] = mapped_column(Text, default="")
    priority: Mapped[str] = mapped_column(String(20), default="medium")  # low | medium | high
    due_date: Mapped[str | None] = mapped_column(String(10), nullable=True)   # YYYY-MM-DD
    due_time: Mapped[str | None] = mapped_column(String(5),  nullable=True)   # HH:MM
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    voice_note_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # ── Recordatorios ────────────────────────────────────────────────────────────
    reminders_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    reminder_12h:      Mapped[bool] = mapped_column(Boolean, default=True)
    reminder_30m:      Mapped[bool] = mapped_column(Boolean, default=True)
    reminder_10m:      Mapped[bool] = mapped_column(Boolean, default=True)
    reminder_custom_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
