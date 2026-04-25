import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.auth import SetupIn, LoginIn, TokenOut, MeOut
from app.services.auth_service import AuthService
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
auth = AuthService()


@router.post("/setup")
def setup(payload: SetupIn, db: Session = Depends(get_db)):
    user = auth.setup_first_user(db, payload.email, payload.password, payload.name)
    if not user:
        raise HTTPException(status_code=409, detail="Setup ya fue realizado (ya existe un usuario).")
    return {"ok": True, "user_id": user.id, "email": user.email}


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    token = auth.login(db, payload.email, payload.password)
    if not token:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=MeOut)
def me(user=Depends(get_current_user)):
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
    }
