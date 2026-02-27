from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class MemoryItem(Base):
    __tablename__ = "memory_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    source_id: Mapped[str] = mapped_column(String(255), nullable=False)
    text: Mapped[str] = mapped_column(String, nullable=False)
    embedding: Mapped[bytes] = mapped_column(nullable=True)  # Si usas pgvector, ajusta el tipo según sea necesario
    topic: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False)

    user = relationship("User", back_populates="memory_items")