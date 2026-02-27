from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column,  relationship
from app.db import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    memory_items = relationship("MemoryItem", back_populates="user")
    session_links = relationship("SessionLink", back_populates="user", cascade="all, delete-orphan")
