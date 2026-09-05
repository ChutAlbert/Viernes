from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import shutil, uuid
from pathlib import Path

from app.db import get_db
from app.core.deps import get_current_user
from app.models.task import Task
from app.core.config import DATA_DIR

router = APIRouter(prefix="/tasks", tags=["tasks"])

TASKS_AUDIO_DIR = DATA_DIR / "tasks_audio"


def _parse(task: Task) -> dict:
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description or "",
        "priority": task.priority,
        "due_date": task.due_date,
        "due_time": task.due_time,
        "completed": task.completed,
        "voice_note_filename": task.voice_note_filename,
        "voice_note_url": f"/tasks-audio/{task.voice_note_filename}" if task.voice_note_filename else None,
        # recordatorios
        "reminders_enabled":      task.reminders_enabled,
        "reminder_12h":           task.reminder_12h,
        "reminder_30m":           task.reminder_30m,
        "reminder_10m":           task.reminder_10m,
        "reminder_custom_minutes": task.reminder_custom_minutes,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
    }


class TaskIn(BaseModel):
    title: str
    description: str = ""
    priority: str = "medium"
    due_date: Optional[str] = None
    due_time: Optional[str] = None
    completed: bool = False
    # recordatorios
    reminders_enabled:       bool = False
    reminder_12h:            bool = True
    reminder_30m:            bool = True
    reminder_10m:            bool = True
    reminder_custom_minutes: Optional[int] = None


def _apply(task: Task, payload: TaskIn):
    task.title                   = payload.title
    task.description             = payload.description
    task.priority                = payload.priority
    task.due_date                = payload.due_date or None
    task.due_time                = payload.due_time or None
    task.completed               = payload.completed
    task.reminders_enabled       = payload.reminders_enabled
    task.reminder_12h            = payload.reminder_12h
    task.reminder_30m            = payload.reminder_30m
    task.reminder_10m            = payload.reminder_10m
    task.reminder_custom_minutes = payload.reminder_custom_minutes


@router.get("")
def list_tasks(db: Session = Depends(get_db), user=Depends(get_current_user)):
    tasks = db.query(Task).filter(Task.user_id == user.id).order_by(Task.completed.asc(), Task.created_at.desc()).all()
    return [_parse(t) for t in tasks]


@router.get("/pending")
def pending_tasks(db: Session = Depends(get_db), user=Depends(get_current_user)):
    tasks = db.query(Task).filter(Task.user_id == user.id).filter(Task.completed == False).order_by(Task.created_at.desc()).all()
    return [_parse(t) for t in tasks]


@router.post("")
def create_task(payload: TaskIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    task = Task(user_id=user.id)
    _apply(task, payload)
    db.add(task)
    db.commit()
    db.refresh(task)
    return _parse(task)


@router.put("/{task_id}")
def update_task(task_id: int, payload: TaskIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    task = db.query(Task).filter(Task.user_id == user.id).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    _apply(task, payload)
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return _parse(task)


@router.patch("/{task_id}/complete")
def toggle_complete(task_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    task = db.query(Task).filter(Task.user_id == user.id).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    task.completed = not task.completed
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return _parse(task)


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    task = db.query(Task).filter(Task.user_id == user.id).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    if task.voice_note_filename:
        try:
            (TASKS_AUDIO_DIR / task.voice_note_filename).unlink(missing_ok=True)
        except Exception:
            pass
    db.delete(task)
    db.commit()
    return {"ok": True}


@router.post("/{task_id}/audio")
async def upload_audio(
    task_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    task = db.query(Task).filter(Task.user_id == user.id).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    TASKS_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    if task.voice_note_filename:
        try:
            (TASKS_AUDIO_DIR / task.voice_note_filename).unlink(missing_ok=True)
        except Exception:
            pass
    ext = Path(file.filename or "audio.webm").suffix or ".webm"
    fname = f"{task_id}_{uuid.uuid4().hex[:8]}{ext}"
    dest = TASKS_AUDIO_DIR / fname
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    task.voice_note_filename = fname
    task.updated_at = datetime.utcnow()
    db.commit()
    return {"voice_note_filename": fname, "voice_note_url": f"/tasks-audio/{fname}"}
