from typing import Optional, Any
from pydantic import BaseModel, EmailStr


class SetupIn(BaseModel):
    email: EmailStr
    password: str
    name: str = ""


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    permissions: Optional[Any] = None
