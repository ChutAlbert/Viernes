from sqlalchemy import String, Boolean, Integer, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.db import Base


class InventarioItem(Base):
    __tablename__ = "inventario_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(200))
    categoria: Mapped[str] = mapped_column(String(50))   # filamento | boquilla | herramienta | quimico | otro
    tipo: Mapped[str] = mapped_column(String(20))        # consumible | no_consumible
    unidad: Mapped[str] = mapped_column(String(20))      # kg | g | piezas | m | l | otro
    cantidad_actual: Mapped[float] = mapped_column(Float, default=0.0)
    cantidad_minima: Mapped[float] = mapped_column(Float, default=0.0)
    precio_referencia: Mapped[float] = mapped_column(Float, nullable=True)
    notas: Mapped[str] = mapped_column(Text, nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    compras: Mapped[list["InventarioCompra"]] = relationship(
        back_populates="item", cascade="all, delete-orphan"
    )


class InventarioCompra(Base):
    __tablename__ = "inventario_compras"

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("inventario_items.id", ondelete="CASCADE"))
    cantidad: Mapped[float] = mapped_column(Float)
    precio_total: Mapped[float] = mapped_column(Float)
    fecha: Mapped[str] = mapped_column(String(20))
    proveedor: Mapped[str] = mapped_column(String(200), nullable=True)
    notas: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    item: Mapped["InventarioItem"] = relationship(back_populates="compras")
