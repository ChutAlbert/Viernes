from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import secrets, base64

from app.db import get_db
from app.core.deps import get_current_user
from app.models.password_vault import PasswordEntry, VaultConfig

router = APIRouter(prefix="/vault", tags=["vault"])


class EntryIn(BaseModel):
    title: str
    username_hint: str = ""
    url: str = ""
    category: str = "general"
    encrypted_data: str   # base64(AES-GCM ciphertext + auth tag)
    iv: str               # base64(12-byte IV)


class EntryOut(BaseModel):
    id: int
    title: str
    username_hint: str
    url: str
    category: str
    encrypted_data: str
    iv: str
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ── Vault config (salt) ────────────────────────────────────────────────────────

@router.get("/config")
def get_config(db: Session = Depends(get_db), _=Depends(get_current_user)):
    cfg = db.query(VaultConfig).first()
    if not cfg:
        return {"initialized": False, "salt": None}
    return {"initialized": True, "salt": cfg.salt}


@router.post("/config")
def init_vault(db: Session = Depends(get_db), _=Depends(get_current_user)):
    existing = db.query(VaultConfig).first()
    if existing:
        return {"salt": existing.salt}
    salt = base64.b64encode(secrets.token_bytes(32)).decode()
    cfg = VaultConfig(salt=salt)
    db.add(cfg)
    db.commit()
    return {"salt": salt}


# ── Entries CRUD ───────────────────────────────────────────────────────────────

@router.get("/entries", response_model=list[EntryOut])
def list_entries(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(PasswordEntry).order_by(PasswordEntry.updated_at.desc()).all()


@router.post("/entries", response_model=EntryOut)
def create_entry(payload: EntryIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    entry = PasswordEntry(**payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.put("/entries/{entry_id}", response_model=EntryOut)
def update_entry(entry_id: int, payload: EntryIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    entry = db.query(PasswordEntry).filter(PasswordEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    for k, v in payload.model_dump().items():
        setattr(entry, k, v)
    entry.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/entries/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    entry = db.query(PasswordEntry).filter(PasswordEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entrada no encontrada")
    db.delete(entry)
    db.commit()
    return {"ok": True}
