from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class SessionLink(Base):
    __tablename__ = "session_links"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    from_session_id: Mapped[int] = mapped_column(ForeignKey("chat_sessions.id"), nullable=False)
    to_session_id: Mapped[int] = mapped_column(ForeignKey("chat_sessions.id"), nullable=False)
    reason: Mapped[str] = mapped_column(String, nullable=True)
    score: Mapped[float] = mapped_column(nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False)  
    
    user = relationship("User", back_populates="session_links")