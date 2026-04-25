import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.core.security import hash_password
from app.core.deps import get_current_user, require_admin
from app.schemas.users import UserCreate, UserUpdate, UserOut, DEFAULT_PERMISSIONS

router = APIRouter(prefix="/users", tags=["users"])


def _serialize(user: User) -> dict:
    permissions = None
    if user.permissions:
        try:
            permissions = json.loads(user.permissions)
        except Exception:
            permissions = None
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name or "",
        "role": user.role,
        "is_active": user.is_active,
        "permissions": permissions,
        "created_at": user.created_at,
    }


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    users = db.query(User).order_by(User.id).all()
    return [_serialize(u) for u in users]


@router.post("", response_model=UserOut, status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email ya en uso")

    perms = payload.permissions if payload.permissions is not None else DEFAULT_PERMISSIONS
    # admins don't need a permissions blob
    perms_json = None if payload.role == "admin" else json.dumps(perms)

    user = User(
        email=payload.email,
        name=payload.name,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=payload.is_active,
        permissions=perms_json,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _serialize(user)


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if payload.email is not None:
        conflict = db.query(User).filter(User.email == payload.email, User.id != user_id).first()
        if conflict:
            raise HTTPException(status_code=409, detail="Email ya en uso")
        user.email = payload.email

    if payload.name is not None:
        user.name = payload.name
    if payload.password:
        user.password_hash = hash_password(payload.password)
    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.permissions is not None:
        user.permissions = json.dumps(payload.permissions)

    db.commit()
    db.refresh(user)
    return _serialize(user)


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_admin),
):
    if current.id == user_id:
        raise HTTPException(status_code=400, detail="No puedes eliminarte a ti mismo")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(user)
    db.commit()
