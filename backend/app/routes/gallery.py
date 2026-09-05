import base64
import json
import os
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db import get_db
from app.models.gallery import GalleryItem, GalleryConfig
from app.models.page_visit import PageVisit
from app.core.deps import require_super_admin
from app.core.config import GALLERY_DIR

router = APIRouter(prefix="/gallery", tags=["gallery"])

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALLOWED_IMAGE = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
ALLOWED_VIDEO = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}


def _get_config(db: Session, user) -> GalleryConfig | None:
    return db.query(GalleryConfig).filter(GalleryConfig.user_id == user.id).first()


def _today_visits(db: Session) -> int:
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    return db.query(func.count(PageVisit.id)).filter(PageVisit.visited_at >= today).scalar() or 0


def _serialize(item: GalleryItem) -> dict:
    tags = []
    if item.tags:
        try:
            tags = json.loads(item.tags)
        except Exception:
            pass
    return {
        "id": item.id,
        "filename": item.filename,
        "display_name": item.display_name,
        "media_type": item.media_type,
        "tags": tags,
        "created_at": item.created_at,
    }


# ─── Config / Setup ───────────────────────────────────────────────────────────

@router.get("/config")
def get_config(db: Session = Depends(get_db), user=Depends(require_super_admin)):
    cfg = _get_config(db, user)
    return {"configured": cfg is not None}


@router.post("/setup")
def setup_passphrase(
    payload: dict,
    db: Session = Depends(get_db),
    user=Depends(require_super_admin),
):
    passphrase = (payload.get("passphrase") or "").strip()
    if len(passphrase) < 3:
        raise HTTPException(status_code=400, detail="La frase clave debe tener al menos 3 caracteres")

    cfg = _get_config(db, user)
    kdf_salt = base64.b64encode(os.urandom(32)).decode()
    hashed = _pwd.hash(passphrase)

    if cfg:
        cfg.passphrase_hash = hashed
        cfg.kdf_salt = kdf_salt
    else:
        cfg = GalleryConfig(passphrase_hash=hashed, kdf_salt=kdf_salt, user_id=user.id)
        db.add(cfg)

    db.commit()
    return {"ok": True, "kdf_salt": kdf_salt}


@router.post("/verify")
def verify_passphrase(
    payload: dict,
    db: Session = Depends(get_db),
    user=Depends(require_super_admin),
):
    passphrase = (payload.get("passphrase") or "").strip()
    today = _today_visits(db)
    cfg = _get_config(db, user)

    if not cfg:
        return {"ok": False, "today_visits": today}

    if _pwd.verify(passphrase, cfg.passphrase_hash):
        return {"ok": True, "kdf_salt": cfg.kdf_salt, "today_visits": today}

    return {"ok": False, "today_visits": today}


# ─── Items ────────────────────────────────────────────────────────────────────

@router.get("")
def list_items(
    name: str = "",
    tags: str = "",
    db: Session = Depends(get_db),
    user=Depends(require_super_admin),
):
    items = [_serialize(i) for i in db.query(GalleryItem).filter(GalleryItem.user_id == user.id).order_by(GalleryItem.created_at.desc()).all()]

    if name:
        q = name.lower()
        items = [i for i in items if q in i["display_name"].lower() or q in i["filename"].lower()]
    if tags:
        filter_tags = {t.strip().lower() for t in tags.split(",") if t.strip()}
        items = [i for i in items if filter_tags.issubset({t.lower() for t in i["tags"]})]

    return items


@router.get("/tags")
def list_tags(db: Session = Depends(get_db), user=Depends(require_super_admin)):
    tag_set: set[str] = set()
    for (raw,) in db.query(GalleryItem.tags).all():
        if raw:
            try:
                for t in json.loads(raw):
                    tag_set.add(t)
            except Exception:
                pass
    return sorted(tag_set)


@router.get("/{item_id}/file")
def get_file(
    item_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_super_admin),
):
    item = db.query(GalleryItem).filter(GalleryItem.user_id == user.id).filter(GalleryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")

    path = GALLERY_DIR / item.filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado en disco")

    # All stored files are encrypted blobs — serve as octet-stream
    return Response(
        content=path.read_bytes(),
        media_type="application/octet-stream",
        headers={"Cache-Control": "private, no-store"},
    )


@router.post("", status_code=201)
async def upload_item(
    file: UploadFile = File(...),
    display_name: str = Form(""),
    media_type: str = Form(...),
    tags: str = Form("[]"),
    db: Session = Depends(get_db),
    user=Depends(require_super_admin),
):
    if media_type not in ("image", "video"):
        raise HTTPException(status_code=400, detail="media_type debe ser 'image' o 'video'")

    suffix = Path(file.filename or "file.bin").suffix.lower() or ".bin"
    GALLERY_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{suffix}"
    dest = GALLERY_DIR / filename
    dest.write_bytes(await file.read())

    try:
        parsed_tags = json.loads(tags)
        if not isinstance(parsed_tags, list):
            parsed_tags = []
    except Exception:
        parsed_tags = []

    item = GalleryItem(
        user_id=user.id,
        filename=filename,
        display_name=display_name.strip(),
        media_type=media_type,
        tags=json.dumps(parsed_tags),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _serialize(item)


@router.put("/{item_id}")
def update_item(
    item_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    user=Depends(require_super_admin),
):
    item = db.query(GalleryItem).filter(GalleryItem.user_id == user.id).filter(GalleryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    if "display_name" in payload:
        item.display_name = payload["display_name"]
    if "tags" in payload:
        item.tags = json.dumps(payload["tags"])
    db.commit()
    db.refresh(item)
    return _serialize(item)


@router.delete("/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_super_admin),
):
    item = db.query(GalleryItem).filter(GalleryItem.user_id == user.id).filter(GalleryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="No encontrado")
    f = GALLERY_DIR / item.filename
    if f.exists():
        f.unlink()
    db.delete(item)
    db.commit()
