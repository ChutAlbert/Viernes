from pydantic import BaseModel
from typing import Optional, List
import json


# ── Services ──────────────────────────────────────────────────────────────────

class ServiceBase(BaseModel):
    title: str
    slug: Optional[str] = None
    description: str
    long_description: Optional[str] = None
    image_urls: Optional[List[str]] = None
    icon: str = "code"
    category: str = "general"
    order_index: int = 0
    is_active: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(ServiceBase):
    pass


class ServiceOut(BaseModel):
    id: int
    title: str
    slug: Optional[str] = None
    description: str
    long_description: Optional[str] = None
    image_urls: Optional[List[str]] = None
    icon: str
    category: str
    order_index: int
    is_active: bool

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_service(cls, obj):
        data = {
            "id": obj.id,
            "title": obj.title,
            "slug": obj.slug,
            "description": obj.description,
            "long_description": obj.long_description,
            "image_urls": json.loads(obj.image_urls) if obj.image_urls else None,
            "icon": obj.icon,
            "category": obj.category,
            "order_index": obj.order_index,
            "is_active": obj.is_active,
        }
        return cls(**data)


# ── Contacts ──────────────────────────────────────────────────────────────────

class ContactBase(BaseModel):
    contact_type: str  # phone, email, whatsapp, other
    label: str
    value: str
    is_active: bool = True


class ContactCreate(ContactBase):
    pass


class ContactUpdate(ContactBase):
    pass


class ContactOut(ContactBase):
    id: int

    model_config = {"from_attributes": True}


# ── Members ───────────────────────────────────────────────────────────────────

class MemberBase(BaseModel):
    name: str
    role: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    order_index: int = 0
    is_active: bool = True


class MemberCreate(MemberBase):
    pass


class MemberUpdate(MemberBase):
    pass


class MemberOut(MemberBase):
    id: int

    model_config = {"from_attributes": True}


# ── Settings ──────────────────────────────────────────────────────────────────

class SettingIn(BaseModel):
    value: str


class SettingOut(BaseModel):
    key: str
    value: str

    model_config = {"from_attributes": True}


class SettingsBulkIn(BaseModel):
    settings: dict[str, str]
