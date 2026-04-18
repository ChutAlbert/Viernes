from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.db import get_db
from app.core.deps import get_current_user
from app.models.catalogo import RedSocial

router = APIRouter(prefix="/redes", tags=["redes"])


class RedSocialBase(BaseModel):
    nombre: str
    url: str
    icono: str
    orden: int = 0
    activo: bool = True


class RedSocialOut(RedSocialBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Dashboard (auth) ──────────────────────────────────────────────────────────

@router.get("", response_model=List[RedSocialOut])
def list_redes(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(RedSocial).order_by(RedSocial.orden, RedSocial.id).all()


@router.post("", response_model=RedSocialOut)
def create_red(payload: RedSocialBase, db: Session = Depends(get_db), _=Depends(get_current_user)):
    red = RedSocial(**payload.model_dump())
    db.add(red)
    db.commit()
    db.refresh(red)
    return red


@router.put("/{red_id}", response_model=RedSocialOut)
def update_red(red_id: int, payload: RedSocialBase, db: Session = Depends(get_db), _=Depends(get_current_user)):
    red = db.query(RedSocial).filter(RedSocial.id == red_id).first()
    if not red:
        raise HTTPException(status_code=404, detail="Red social no encontrada")
    for k, v in payload.model_dump().items():
        setattr(red, k, v)
    db.commit()
    db.refresh(red)
    return red


@router.delete("/{red_id}")
def delete_red(red_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    red = db.query(RedSocial).filter(RedSocial.id == red_id).first()
    if not red:
        raise HTTPException(status_code=404, detail="Red social no encontrada")
    db.delete(red)
    db.commit()
    return {"ok": True}


# ── Público ───────────────────────────────────────────────────────────────────

@router.get("/public", response_model=List[RedSocialOut])
def list_redes_publico(db: Session = Depends(get_db)):
    return db.query(RedSocial).filter(RedSocial.activo == True).order_by(RedSocial.orden, RedSocial.id).all()
