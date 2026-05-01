from typing import Optional, Any
from pydantic import BaseModel, EmailStr

DEFAULT_PERMISSIONS = {
    # home
    "overview": True,
    # viernes
    "chat": True,
    "gmail": True,
    "docs": True,
    # agenda
    "tareas": True,
    "notas": True,
    # sodigic
    "website": True,
    "catalogo": True,
    "piezas": True,
    "inventario": True,
    "redes": True,
    # funciones
    "qr": True,
    "passwords": True,
}


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "user"
    is_active: bool = True
    permissions: Optional[dict] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    permissions: Optional[dict] = None


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    permissions: Optional[Any] = None
    created_at: Optional[Any] = None

    model_config = {"from_attributes": True}
