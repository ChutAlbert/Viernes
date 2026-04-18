from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ─── Filamento ────────────────────────────────────────────────────────────────

class FilamentoBase(BaseModel):
    nombre: str                              # "PLA Negro", "PETG Arcoíris"
    tipo_material: str                       # "PLA" | "PLA+" | "PETG"
    hex_codigo: str = Field(pattern=r"^#[0-9A-Fa-f]{6}$")
    tarifa_por_minuto: float = Field(gt=0)
    en_stock: bool = True
    activo: bool = True


class FilamentoCreate(FilamentoBase):
    pass


class FilamentoUpdate(FilamentoBase):
    pass


class FilamentoOut(FilamentoBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Producto — pieza de relación ─────────────────────────────────────────────

class ProductoFilamentoItem(BaseModel):
    filamento_id: int
    archivo_3d_url: Optional[str] = None    # archivo específico para este filamento


# ─── Producto ─────────────────────────────────────────────────────────────────

class ImagenOut(BaseModel):
    id: int
    url: str
    orden: int
    model_config = {"from_attributes": True}


class ProductoBase(BaseModel):
    slug: Optional[str] = None
    nombre: str
    descripcion: Optional[str] = None
    archivo_3d_url: Optional[str] = None
    foto_preview_url: Optional[str] = None
    es_personalizable: bool = False
    tiempo_impresion_minutos: float = Field(gt=0)
    tiempo_minimo_minutos: Optional[float] = None
    tiempo_maximo_minutos: Optional[float] = None
    tamano_base_mm: float = Field(gt=0)
    tamano_y_mm: Optional[float] = None
    tamano_z_mm: Optional[float] = None
    tamano_minimo_mm: float = Field(gt=0)
    tamano_maximo_mm: float = Field(gt=0)
    permite_multicolor: bool = False
    max_colores: int = Field(default=1, ge=1)
    activo: bool = True
    publicado: bool = False


class ProductoCreate(ProductoBase):
    filamentos: list[ProductoFilamentoItem] = []


class ProductoUpdate(ProductoBase):
    filamentos: list[ProductoFilamentoItem] = []


class ProductoFilamentoOut(BaseModel):
    filamento_id: int
    archivo_3d_url: Optional[str] = None
    filamento: FilamentoOut

    model_config = {"from_attributes": True}


class ProductoOut(ProductoBase):
    id: int
    created_at: datetime
    filamentos: list[ProductoFilamentoOut] = []
    imagenes: list[ImagenOut] = []

    model_config = {"from_attributes": True}


class ProductoListItem(BaseModel):
    id: int
    slug: Optional[str] = None
    nombre: str
    foto_preview_url: Optional[str] = None
    es_personalizable: bool = False
    tiempo_impresion_minutos: float
    tamano_minimo_mm: float
    tamano_maximo_mm: float
    permite_multicolor: bool
    publicado: bool
    created_at: datetime
    precio_desde: Optional[float] = None

    model_config = {"from_attributes": True}


# ─── Calculadora ──────────────────────────────────────────────────────────────

class CalcularPrecioRequest(BaseModel):
    producto_id: int
    filamento_id: int
    tamano_mm: float = Field(gt=0)
    multicolor: bool = False
    num_colores: int = Field(default=1, ge=1)


class CalcularPrecioResponse(BaseModel):
    precio_final: float
    desglose: dict
