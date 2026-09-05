from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.db import Base


class PasswordEntry(Base):
    __tablename__ = "password_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Privado por usuario: antes estas tablas eran globales
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(500))           # plaintext: service name
    username_hint: Mapped[str] = mapped_column(String(500), default="")  # plaintext: email/user hint
    url: Mapped[str] = mapped_column(String(2000), default="")
    category: Mapped[str] = mapped_column(String(100), default="general")
    encrypted_data: Mapped[str] = mapped_column(Text)         # base64(AES-GCM ciphertext+tag)
    iv: Mapped[str] = mapped_column(String(100))              # base64(12-byte IV)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class VaultConfig(Base):
    """Stores the PBKDF2 salt — not a secret, needed to derive the AES key client-side."""
    __tablename__ = "vault_config"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Privado por usuario: antes estas tablas eran globales
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    salt: Mapped[str] = mapped_column(String(100))   # base64(random 32 bytes)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
