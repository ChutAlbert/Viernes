"""
Endpoints de Gmail para Viernes.
Rutas:
    GET  /gmail/status          → estado de autenticación
    GET  /gmail/auth            → URL para autorizar (primera vez)
    GET  /gmail/inbox           → últimos correos
    GET  /gmail/unread          → solo no leídos
    GET  /gmail/search          → buscar correos
    GET  /gmail/email/{id}      → leer correo completo
    POST /gmail/send            → enviar correo
    POST /gmail/mark-read/{id}  → marcar como leído
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.services.gmail_service import GmailService

router = APIRouter(prefix="/gmail", tags=["gmail"])
gmail = GmailService()


# ─── Status y autenticación ───────────────────────────────────────────────────

@router.get("/status")
def gmail_status():
    """Verifica si Gmail está autenticado y listo."""
    authenticated = gmail.is_authenticated()
    if authenticated:
        try:
            count = gmail.get_unread_count()
            return {
                "authenticated": True,
                "unread_count": count,
                "message": "Gmail conectado ✓"
            }
        except Exception as e:
            return {"authenticated": False, "message": str(e)}
    return {
        "authenticated": False,
        "message": "Gmail no autenticado. Visita /gmail/auth para conectar."
    }


@router.get("/auth")
def gmail_auth():
    """
    Retorna la URL para autorizar acceso a Gmail.
    Abre esa URL en el navegador y acepta los permisos.
    Después el token se guarda automáticamente.
    """
    try:
        # Inicia el flujo OAuth abriendo el navegador directamente
        # Esto bloquea hasta que el usuario autoriza
        service = gmail._get_service()
        return {"success": True, "message": "Gmail autenticado correctamente ✓"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Leer correos ─────────────────────────────────────────────────────────────

@router.get("/inbox")
def get_inbox(
    limit: int = Query(default=10, ge=1, le=50),
    unread_only: bool = Query(default=False)
):
    """Obtiene los últimos correos del inbox."""
    try:
        emails = gmail.get_inbox(max_results=limit, unread_only=unread_only)
        return {
            "count": len(emails),
            "emails": emails,
            "summary": gmail.format_for_context(emails)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unread")
def get_unread():
    """Obtiene correos no leídos."""
    try:
        emails = gmail.get_inbox(max_results=20, unread_only=True)
        count = gmail.get_unread_count()
        return {
            "unread_count": count,
            "emails": emails,
            "summary": gmail.format_for_context(emails)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
def search_emails(
    q: str = Query(..., description="Query de Gmail. Ej: from:amazon subject:pedido"),
    limit: int = Query(default=10, ge=1, le=50)
):
    """
    Busca correos. Soporta queries de Gmail:
    - from:correo@gmail.com
    - subject:palabra
    - after:2024/01/01
    - has:attachment
    - is:unread
    """
    try:
        emails = gmail.search_emails(query=q, max_results=limit)
        return {
            "query": q,
            "count": len(emails),
            "emails": emails,
            "summary": gmail.format_for_context(emails)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/email/{message_id}")
def get_email(message_id: str):
    """Obtiene el contenido completo de un correo por ID."""
    try:
        email = gmail.get_email_body(message_id)
        return email
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Enviar correos ───────────────────────────────────────────────────────────

class SendEmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    html: bool = False

@router.post("/send")
def send_email(payload: SendEmailRequest):
    """Envía un correo."""
    try:
        result = gmail.send_email(
            to=payload.to,
            subject=payload.subject,
            body=payload.body,
            html=payload.html
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mark-read/{message_id}")
def mark_as_read(message_id: str):
    """Marca un correo como leído."""
    try:
        gmail.mark_as_read(message_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))