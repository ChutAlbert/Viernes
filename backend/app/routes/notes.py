from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime
import shutil, json
from pathlib import Path

from app.db import get_db
from app.core.deps import get_current_user
from app.models.note import Note
from app.core.config import DATA_DIR

router = APIRouter(prefix="/notes", tags=["notes"])

NOTES_DIR = DATA_DIR / "notes_files"


def _parse(note: Note) -> dict:
    return {
        "id": note.id,
        "title": note.title,
        "content": note.content,
        "color": note.color,
        "pinned": note.pinned,
        "tags": json.loads(note.tags or "[]"),
        "attachments": json.loads(note.attachments or "[]"),
        "created_at": note.created_at,
        "updated_at": note.updated_at,
    }


class NoteIn(BaseModel):
    title: str = ""
    content: str = ""
    color: str = "default"
    pinned: bool = False
    tags: List[str] = []


@router.get("")
def list_notes(db: Session = Depends(get_db), user=Depends(get_current_user)):
    notes = db.query(Note).filter(Note.user_id == user.id).order_by(Note.pinned.desc(), Note.updated_at.desc()).all()
    return [_parse(n) for n in notes]


@router.post("")
def create_note(payload: NoteIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    note = Note(
        user_id=user.id,
        title=payload.title,
        content=payload.content,
        color=payload.color,
        pinned=payload.pinned,
        tags=json.dumps(payload.tags),
        attachments="[]",
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return _parse(note)


@router.put("/{note_id}")
def update_note(note_id: int, payload: NoteIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    note = db.query(Note).filter(Note.user_id == user.id).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    note.title = payload.title
    note.content = payload.content
    note.color = payload.color
    note.pinned = payload.pinned
    note.tags = json.dumps(payload.tags)
    note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)
    return _parse(note)


@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    note = db.query(Note).filter(Note.user_id == user.id).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    for att in json.loads(note.attachments or "[]"):
        try:
            Path(att["path"]).unlink(missing_ok=True)
        except Exception:
            pass
    db.delete(note)
    db.commit()
    return {"ok": True}


@router.post("/{note_id}/attachments")
async def upload_attachment(
    note_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    note = db.query(Note).filter(Note.user_id == user.id).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    NOTES_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = f"{note_id}_{file.filename}"
    dest = NOTES_DIR / safe_name
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    attachments = json.loads(note.attachments or "[]")
    url = f"/notes-files/{safe_name}"
    attachments.append({"name": file.filename, "url": url, "path": str(dest)})
    note.attachments = json.dumps(attachments)
    note.updated_at = datetime.utcnow()
    db.commit()
    return {"name": file.filename, "url": url}


@router.delete("/{note_id}/attachments/{filename}")
def delete_attachment(
    note_id: int,
    filename: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    note = db.query(Note).filter(Note.user_id == user.id).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    kept = []
    for att in json.loads(note.attachments or "[]"):
        if att["name"] == filename:
            try:
                Path(att["path"]).unlink(missing_ok=True)
            except Exception:
                pass
        else:
            kept.append(att)
    note.attachments = json.dumps(kept)
    note.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}
