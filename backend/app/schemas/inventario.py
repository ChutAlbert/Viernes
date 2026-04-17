from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ─── Item ─────────────────────────────────────────────────────────────────────

class ItemBase(BaseModel):
    nombre: str
    categoria: str        # filamento | boquilla | herramienta | quimico | otro
    tipo: str             # consumible | no_consumible
    unidad: str           # kg | g | piezas | m | l | otro
    cantidad_minima: float = Field(default=0.0, ge=0)
    precio_referencia: Optional[float] = None
    notas: Optional[str] = None
    activo: bool = True


class ItemCreate(ItemBase):
    cantidad_actual: float = Field(default=0.0, ge=0)


class ItemUpdate(ItemBase):
    cantidad_actual: float = Field(ge=0)


class ItemOut(ItemBase):
    id: int
    cantidad_actual: float
    created_at: datetime

    model_config = {"from_attributes": True}


class ItemAlerta(BaseModel):
    id: int
    nombre: str
    categoria: str
    cantidad_actual: float
    cantidad_minima: float
    unidad: str

    model_config = {"from_attributes": True}


# ─── Compra ───────────────────────────────────────────────────────────────────

class CompraBase(BaseModel):
    item_id: int
    cantidad: float = Field(gt=0)
    precio_total: float = Field(ge=0)
    fecha: str
    proveedor: Optional[str] = None
    notas: Optional[str] = None


class CompraCreate(CompraBase):
    pass


class CompraOut(CompraBase):
    id: int
    created_at: datetime
    item_nombre: Optional[str] = None
    item_categoria: Optional[str] = None
    item_unidad: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Resumen ──────────────────────────────────────────────────────────────────

class ResumenOut(BaseModel):
    total_gastado: float
    total_filamento: float
    total_ganado: float
    balance: float
    alertas: list[ItemAlerta]
