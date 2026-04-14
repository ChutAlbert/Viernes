from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db import get_db
from app.models.page_visit import PageVisit
from app.core.deps import get_current_user
from app.models.user import User
from app.core.config import EXCLUDED_IPS

router = APIRouter(prefix="/api/visits", tags=["visits"])


@router.post("", status_code=204)
def register_visit(request: Request, db: Session = Depends(get_db)):
    """Registra una visita al sitio web. Endpoint público."""
    # Obtener IP real (considera proxies/nginx)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        ip = forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"

    # Ignorar IPs excluidas (servidor, dispositivos propios, etc.)
    if ip in EXCLUDED_IPS:
        return

    user_agent = request.headers.get("User-Agent", "")[:512]
    path = request.headers.get("X-Page-Path", "/")[:255]

    visit = PageVisit(
        ip_address=ip,
        user_agent=user_agent,
        path=path,
        visited_at=datetime.utcnow(),
    )
    db.add(visit)
    db.commit()


@router.get("/stats")
def get_visit_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Retorna estadísticas de visitas. Requiere autenticación."""
    total = db.query(func.count(PageVisit.id)).scalar()

    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = (
        db.query(func.count(PageVisit.id))
        .filter(PageVisit.visited_at >= today)
        .scalar()
    )

    last_7_days = datetime.utcnow() - timedelta(days=7)
    week_count = (
        db.query(func.count(PageVisit.id))
        .filter(PageVisit.visited_at >= last_7_days)
        .scalar()
    )

    last_30_days = datetime.utcnow() - timedelta(days=30)
    month_count = (
        db.query(func.count(PageVisit.id))
        .filter(PageVisit.visited_at >= last_30_days)
        .scalar()
    )

    return {
        "total": total,
        "today": today_count,
        "last_7_days": week_count,
        "last_30_days": month_count,
    }


@router.delete("")
def clear_visits(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Borra todas las visitas registradas. Requiere autenticación."""
    deleted = db.query(PageVisit).delete()
    db.commit()
    return {"deleted": deleted}
