from sqlalchemy import String, Boolean, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.db import Base


class CatalogoFilamento(Base):
    """
    Un filamento = tipo de material + color específico con su propia tarifa.
    Ejemplos: 'PLA Negro' ($1.2/min), 'PLA Arcoíris' ($1.6/min), 'PETG Negro' ($1.8/min).
    """
    __tablename__ = "catalogo_filamentos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150))          # "PLA Negro", "PETG Arcoíris"
    tipo_material: Mapped[str] = mapped_column(String(50))    # "PLA" | "PLA+" | "PETG" (para aspecto 3D)
    hex_codigo: Mapped[str] = mapped_column(String(7))        # "#000000"
    tarifa_por_minuto: Mapped[float] = mapped_column(Float)   # precio directo por minuto
    en_stock: Mapped[bool] = mapped_column(Boolean, default=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    producto_filamentos: Mapped[list["CatalogoProductoFilamento"]] = relationship(
        back_populates="filamento", cascade="all, delete-orphan"
    )


class CatalogoProducto(Base):
    __tablename__ = "catalogo_productos"

    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(220), unique=True, nullable=True)
    nombre: Mapped[str] = mapped_column(String(255))
    descripcion: Mapped[str] = mapped_column(Text, nullable=True)
    archivo_3d_url: Mapped[str] = mapped_column(String(500), nullable=True)
    foto_preview_url: Mapped[str] = mapped_column(String(500), nullable=True)
    tiempo_impresion_minutos: Mapped[float] = mapped_column(Float)
    tiempo_minimo_minutos: Mapped[float] = mapped_column(Float, nullable=True)
    tiempo_maximo_minutos: Mapped[float] = mapped_column(Float, nullable=True)
    tamano_base_mm: Mapped[float] = mapped_column(Float)
    tamano_y_mm: Mapped[float] = mapped_column(Float, nullable=True)
    tamano_z_mm: Mapped[float] = mapped_column(Float, nullable=True)
    tamano_minimo_mm: Mapped[float] = mapped_column(Float)
    tamano_maximo_mm: Mapped[float] = mapped_column(Float)
    # Multicolor deshabilitado globalmente hasta tener la impresora
    permite_multicolor: Mapped[bool] = mapped_column(Boolean, default=False)
    max_colores: Mapped[int] = mapped_column(Integer, default=1)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    publicado: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    filamentos: Mapped[list["CatalogoProductoFilamento"]] = relationship(
        back_populates="producto", cascade="all, delete-orphan"
    )


class CatalogoProductoFilamento(Base):
    """
    Qué filamentos están disponibles para un producto.
    Opcionalmente cada filamento puede tener su propio archivo 3D
    (ej: el mismo diseño con soporte diferente para PETG).
    """
    __tablename__ = "catalogo_producto_filamentos"

    id: Mapped[int] = mapped_column(primary_key=True)
    producto_id: Mapped[int] = mapped_column(ForeignKey("catalogo_productos.id"))
    filamento_id: Mapped[int] = mapped_column(ForeignKey("catalogo_filamentos.id"))
    archivo_3d_url: Mapped[str] = mapped_column(String(500), nullable=True)

    producto: Mapped["CatalogoProducto"] = relationship(back_populates="filamentos")
    filamento: Mapped["CatalogoFilamento"] = relationship(back_populates="producto_filamentos")
