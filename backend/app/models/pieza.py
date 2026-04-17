from sqlalchemy import String, Boolean, Integer, Text, Float, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.db import Base


class Pieza(Base):
    __tablename__ = "piezas"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(255))
    fotos: Mapped[str] = mapped_column(Text, nullable=True)          # JSON array de URLs
    precios: Mapped[str] = mapped_column(Text, nullable=True)        # JSON array de floats (precio por pieza)
    monto_pagado: Mapped[float] = mapped_column(Float, nullable=True)
    persona: Mapped[str] = mapped_column(String(255), nullable=True) # a quién se vendió
    tipo: Mapped[str] = mapped_column(String(50), default="venta_general")  # encargo | venta_general
    fecha_encargo: Mapped[str] = mapped_column(String(20), nullable=True)   # ISO date string
    fecha_impresion: Mapped[str] = mapped_column(String(20), nullable=True)
    fecha_entrega: Mapped[str] = mapped_column(String(20), nullable=True)
    fecha_pago: Mapped[str] = mapped_column(String(20), nullable=True)
    filamento: Mapped[str] = mapped_column(String(255), nullable=True)
    tiempo_impresion: Mapped[str] = mapped_column(String(100), nullable=True)
    notas: Mapped[str] = mapped_column(Text, nullable=True)
    archivos: Mapped[str] = mapped_column(Text, nullable=True)  # JSON array de {url, nombre}
    pagos: Mapped[str] = mapped_column(Text, nullable=True)     # JSON array de {monto, fecha, nota?}
    sincronizado_sodigic: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
