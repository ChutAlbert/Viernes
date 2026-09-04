from sqlalchemy import String, Boolean, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db import Base


class WebsiteService(Base):
    __tablename__ = "website_services"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=True)
    description: Mapped[str] = mapped_column(Text)
    long_description: Mapped[str] = mapped_column(Text, nullable=True)
    image_urls: Mapped[str] = mapped_column(Text, nullable=True)  # JSON array as string
    icon: Mapped[str] = mapped_column(String(100), default="code")
    category: Mapped[str] = mapped_column(String(100), default="general")
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class WebsiteContact(Base):
    __tablename__ = "website_contacts"

    id: Mapped[int] = mapped_column(primary_key=True)
    contact_type: Mapped[str] = mapped_column(String(50))  # phone, email, whatsapp, other
    label: Mapped[str] = mapped_column(String(255))
    value: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # ponytail: CSV en vez de tabla puente; son 2 areas fijas, no vale un join
    areas: Mapped[str] = mapped_column(
        String(100), default="software,impresion3d", server_default="software,impresion3d"
    )
    # Un mismo registro puede ser las dos cosas (WhatsApp es el caso tipico)
    es_red: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    es_contacto: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    orden: Mapped[int] = mapped_column(Integer, default=0, server_default="0")


class WebsiteMember(Base):
    __tablename__ = "website_members"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(255))
    bio: Mapped[str] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str] = mapped_column(String(500), nullable=True)
    github_url: Mapped[str] = mapped_column(String(500), nullable=True)
    linkedin_url: Mapped[str] = mapped_column(String(500), nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class WebsiteSetting(Base):
    __tablename__ = "website_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    value: Mapped[str] = mapped_column(Text)
