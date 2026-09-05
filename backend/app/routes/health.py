import json
from pathlib import Path

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import get_db

router = APIRouter()

# Lo escribe deploy/deploy.sh al terminar, bien o mal.
ESTADO_DEPLOY = Path(__file__).resolve().parents[3] / "data" / "deploy_estado.json"


def _estado_deploy() -> dict | None:
    try:
        return json.loads(ESTADO_DEPLOY.read_text(encoding="utf-8"))
    except Exception:
        # Sin archivo (nunca se ha desplegado aqui) o ilegible: no es un fallo
        return None


@router.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return {
        "status": "ok",
        "assistant": "Viernes",
        "db": db_ok,
        "deploy": _estado_deploy(),
    }
