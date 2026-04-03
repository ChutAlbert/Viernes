from pydantic import BaseModel
from typing import Optional


# ── Services ──────────────────────────────────────────────────────────────────

class ServiceBase(BaseModel):
    title: str
    description: str
    icon: str = "code"
    category: str = "general"
    order_index: int = 0
    is_active: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(ServiceBase):
    pass


class ServiceOut(ServiceBase):
    id: int

    model_config = {"from_attributes": True}


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
