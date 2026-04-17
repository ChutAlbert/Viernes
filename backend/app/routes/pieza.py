from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from app.db import get_db
from app.core.deps import get_current_user
from app.models.pieza import Pieza
from app.schemas.pieza import PiezaCreate, PiezaUpdate, PiezaOut, PiezaListItem, PiezaPublicOut

router = APIRouter(prefix="/piezas", tags=["piezas"])


def _pieza_payload(payload: PiezaCreate | PiezaUpdate) -> dict:
    data = payload.model_dump()
    fotos = data.pop("fotos", None)
    precios = data.pop("precios", None)
    archivos = data.pop("archivos", None)
    pagos = data.pop("pagos", None)
    data["fotos"] = json.dumps(fotos) if fotos is not None else None
    data["precios"] = json.dumps(precios) if precios is not None else None
    data["archivos"] = json.dumps(archivos) if archivos is not None else None
    data["pagos"] = json.dumps(pagos) if pagos is not None else None
    return data


@router.get("", response_model=List[PiezaListItem])
def list_piezas(db: Session = Depends(get_db), _=Depends(get_current_user)):
    piezas = db.query(Pieza).order_by(Pieza.created_at.desc()).all()
    result = []
    for p in piezas:
        result.append(PiezaListItem(
            id=p.id,
            nombre=p.nombre,
            monto_pagado=p.monto_pagado,
            persona=p.persona,
            tipo=p.tipo,
            sincronizado_sodigic=p.sincronizado_sodigic,
            created_at=p.created_at.isoformat() if p.created_at else "",
        ))
    return result


@router.post("", response_model=PiezaOut)
def create_pieza(payload: PiezaCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    pieza = Pieza(**_pieza_payload(payload))
    db.add(pieza)
    db.commit()
    db.refresh(pieza)
    return PiezaOut.from_orm_pieza(pieza)


@router.get("/{pieza_id}", response_model=PiezaOut)
def get_pieza(pieza_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    pieza = db.query(Pieza).filter(Pieza.id == pieza_id).first()
    if not pieza:
        raise HTTPException(status_code=404, detail="Pieza no encontrada")
    return PiezaOut.from_orm_pieza(pieza)


@router.put("/{pieza_id}", response_model=PiezaOut)
def update_pieza(pieza_id: int, payload: PiezaUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    pieza = db.query(Pieza).filter(Pieza.id == pieza_id).first()
    if not pieza:
        raise HTTPException(status_code=404, detail="Pieza no encontrada")
    for field, value in _pieza_payload(payload).items():
        setattr(pieza, field, value)
    db.commit()
    db.refresh(pieza)
    return PiezaOut.from_orm_pieza(pieza)


@router.delete("/{pieza_id}")
def delete_pieza(pieza_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    pieza = db.query(Pieza).filter(Pieza.id == pieza_id).first()
    if not pieza:
        raise HTTPException(status_code=404, detail="Pieza no encontrada")
    db.delete(pieza)
    db.commit()
    return {"ok": True}


@router.post("/{pieza_id}/sync-sodigic")
def sync_sodigic(pieza_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Marca la pieza como sincronizada con Sodigic (las fotos aparecerán en el sitio público)."""
    pieza = db.query(Pieza).filter(Pieza.id == pieza_id).first()
    if not pieza:
        raise HTTPException(status_code=404, detail="Pieza no encontrada")
    pieza.sincronizado_sodigic = True
    db.commit()
    return {"ok": True, "sincronizado": True}


@router.post("/{pieza_id}/unsync-sodigic")
def unsync_sodigic(pieza_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Quita la pieza del sitio público de Sodigic."""
    pieza = db.query(Pieza).filter(Pieza.id == pieza_id).first()
    if not pieza:
        raise HTTPException(status_code=404, detail="Pieza no encontrada")
    pieza.sincronizado_sodigic = False
    db.commit()
    return {"ok": True, "sincronizado": False}


@router.get("/public/sincronizadas", response_model=List[PiezaPublicOut])
def get_piezas_sincronizadas(db: Session = Depends(get_db)):
    """Endpoint público: devuelve piezas marcadas para mostrar en Sodigic (sin precios)."""
    piezas = (
        db.query(Pieza)
        .filter(Pieza.sincronizado_sodigic == True)
        .order_by(Pieza.created_at.desc())
        .all()
    )
    return [PiezaPublicOut.from_orm_pieza(p) for p in piezas]
