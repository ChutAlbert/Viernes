from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app.core.deps import get_current_user
from app.models.inventario import InventarioItem, InventarioCompra
from app.models.pieza import Pieza
from app.schemas.inventario import (
    ItemCreate, ItemUpdate, ItemOut, ItemAlerta,
    CompraCreate, CompraOut,
    ResumenOut,
)

router = APIRouter(prefix="/inventario", tags=["inventario"])


# ══════════════════════════════════════════════════════════════════════════════
# ITEMS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/items", response_model=List[ItemOut])
def list_items(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(InventarioItem).order_by(InventarioItem.categoria, InventarioItem.nombre).all()


@router.post("/items", response_model=ItemOut)
def create_item(payload: ItemCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    item = InventarioItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/items/{item_id}", response_model=ItemOut)
def update_item(item_id: int, payload: ItemUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    item = db.query(InventarioItem).filter(InventarioItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    for field, value in payload.model_dump().items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    item = db.query(InventarioItem).filter(InventarioItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    db.delete(item)
    db.commit()
    return {"ok": True}


# ══════════════════════════════════════════════════════════════════════════════
# COMPRAS
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/compras", response_model=List[CompraOut])
def list_compras(db: Session = Depends(get_db), _=Depends(get_current_user)):
    compras = (
        db.query(InventarioCompra)
        .order_by(InventarioCompra.fecha.desc(), InventarioCompra.created_at.desc())
        .all()
    )
    result = []
    for c in compras:
        result.append(CompraOut(
            id=c.id,
            item_id=c.item_id,
            cantidad=c.cantidad,
            precio_total=c.precio_total,
            fecha=c.fecha,
            proveedor=c.proveedor,
            notas=c.notas,
            created_at=c.created_at,
            item_nombre=c.item.nombre if c.item else None,
            item_categoria=c.item.categoria if c.item else None,
            item_unidad=c.item.unidad if c.item else None,
        ))
    return result


@router.post("/compras", response_model=CompraOut)
def create_compra(payload: CompraCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    item = db.query(InventarioItem).filter(InventarioItem.id == payload.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")

    compra = InventarioCompra(**payload.model_dump())
    db.add(compra)

    # Actualizar stock
    item.cantidad_actual += payload.cantidad
    db.commit()
    db.refresh(compra)

    return CompraOut(
        id=compra.id,
        item_id=compra.item_id,
        cantidad=compra.cantidad,
        precio_total=compra.precio_total,
        fecha=compra.fecha,
        proveedor=compra.proveedor,
        notas=compra.notas,
        created_at=compra.created_at,
        item_nombre=item.nombre,
        item_categoria=item.categoria,
        item_unidad=item.unidad,
    )


@router.delete("/compras/{compra_id}")
def delete_compra(compra_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    compra = db.query(InventarioCompra).filter(InventarioCompra.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")

    # Revertir stock
    item = db.query(InventarioItem).filter(InventarioItem.id == compra.item_id).first()
    if item:
        item.cantidad_actual = max(0.0, item.cantidad_actual - compra.cantidad)

    db.delete(compra)
    db.commit()
    return {"ok": True}


# ══════════════════════════════════════════════════════════════════════════════
# RESUMEN
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/resumen", response_model=ResumenOut)
def resumen(db: Session = Depends(get_db), _=Depends(get_current_user)):
    items = db.query(InventarioItem).all()
    item_map = {i.id: i for i in items}

    compras = db.query(InventarioCompra).all()
    total_gastado = sum(c.precio_total for c in compras)
    total_filamento = sum(
        c.precio_total for c in compras
        if item_map.get(c.item_id) and item_map[c.item_id].categoria == "filamento"
    )

    piezas = db.query(Pieza).all()
    total_ganado = sum(p.monto_pagado or 0 for p in piezas)

    alertas = [
        ItemAlerta(
            id=i.id,
            nombre=i.nombre,
            categoria=i.categoria,
            cantidad_actual=i.cantidad_actual,
            cantidad_minima=i.cantidad_minima,
            unidad=i.unidad,
        )
        for i in items
        if i.activo and i.tipo == "consumible" and i.cantidad_actual <= i.cantidad_minima
    ]

    return ResumenOut(
        total_gastado=round(total_gastado, 2),
        total_filamento=round(total_filamento, 2),
        total_ganado=round(total_ganado, 2),
        balance=round(total_ganado - total_gastado, 2),
        alertas=alertas,
    )


# ══════════════════════════════════════════════════════════════════════════════
# ALERTAS PÚBLICAS (para home del dashboard, sin datos financieros)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/alertas", response_model=List[ItemAlerta])
def get_alertas(db: Session = Depends(get_db), _=Depends(get_current_user)):
    items = db.query(InventarioItem).filter(InventarioItem.activo == True).all()
    return [
        ItemAlerta(
            id=i.id, nombre=i.nombre, categoria=i.categoria,
            cantidad_actual=i.cantidad_actual, cantidad_minima=i.cantidad_minima,
            unidad=i.unidad,
        )
        for i in items
        if i.tipo == "consumible" and i.cantidad_actual <= i.cantidad_minima
    ]
