from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json


class PiezaBase(BaseModel):
    nombre: str
    fotos: Optional[List[str]] = None
    precios: Optional[List[float]] = None
    monto_pagado: Optional[float] = None
    persona: Optional[str] = None
    tipo: str = "venta_general"          # encargo | venta_general
    fecha_encargo: Optional[str] = None
    fecha_impresion: Optional[str] = None
    fecha_entrega: Optional[str] = None
    fecha_pago: Optional[str] = None
    filamento: Optional[str] = None
    tiempo_impresion: Optional[str] = None
    notas: Optional[str] = None
    archivos: Optional[List[Dict[str, Any]]] = None  # [{url, nombre}]
    pagos: Optional[List[Dict[str, Any]]] = None     # [{monto, fecha, nota?}]


class PiezaCreate(PiezaBase):
    pass


class PiezaUpdate(PiezaBase):
    pass


class PiezaListItem(BaseModel):
    id: int
    nombre: str
    monto_pagado: Optional[float] = None
    persona: Optional[str] = None
    tipo: str
    sincronizado_sodigic: bool
    created_at: str

    model_config = {"from_attributes": True}


class PiezaPublicOut(BaseModel):
    """Pieza sincronizada expuesta públicamente — sin precios."""
    id: int
    nombre: str
    fotos: Optional[List[str]] = None
    persona: Optional[str] = None
    tipo: str
    filamento: Optional[str] = None
    tiempo_impresion: Optional[str] = None
    notas: Optional[str] = None
    archivos: Optional[List[Dict[str, Any]]] = None
    created_at: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_pieza(cls, obj):
        return cls(
            id=obj.id,
            nombre=obj.nombre,
            fotos=json.loads(obj.fotos) if obj.fotos else None,
            persona=obj.persona,
            tipo=obj.tipo,
            filamento=obj.filamento,
            tiempo_impresion=obj.tiempo_impresion,
            notas=obj.notas,
            archivos=json.loads(obj.archivos) if obj.archivos else None,
            created_at=obj.created_at.isoformat() if obj.created_at else "",
        )


class PiezaOut(BaseModel):
    id: int
    nombre: str
    fotos: Optional[List[str]] = None
    precios: Optional[List[float]] = None
    monto_pagado: Optional[float] = None
    persona: Optional[str] = None
    tipo: str
    fecha_encargo: Optional[str] = None
    fecha_impresion: Optional[str] = None
    fecha_entrega: Optional[str] = None
    fecha_pago: Optional[str] = None
    filamento: Optional[str] = None
    tiempo_impresion: Optional[str] = None
    notas: Optional[str] = None
    archivos: Optional[List[Dict[str, Any]]] = None
    pagos: Optional[List[Dict[str, Any]]] = None
    sincronizado_sodigic: bool
    created_at: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_pieza(cls, obj):
        return cls(
            id=obj.id,
            nombre=obj.nombre,
            fotos=json.loads(obj.fotos) if obj.fotos else None,
            precios=json.loads(obj.precios) if obj.precios else None,
            monto_pagado=obj.monto_pagado,
            persona=obj.persona,
            tipo=obj.tipo,
            fecha_encargo=obj.fecha_encargo,
            fecha_impresion=obj.fecha_impresion,
            fecha_entrega=obj.fecha_entrega,
            fecha_pago=obj.fecha_pago,
            filamento=obj.filamento,
            tiempo_impresion=obj.tiempo_impresion,
            notas=obj.notas,
            archivos=json.loads(obj.archivos) if obj.archivos else None,
            pagos=json.loads(obj.pagos) if obj.pagos else None,
            sincronizado_sodigic=obj.sincronizado_sodigic,
            created_at=obj.created_at.isoformat() if obj.created_at else "",
        )
