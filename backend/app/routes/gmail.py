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

import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.services.gmail_service import GmailService

router = APIRouter(prefix="/gmail", tags=["gmail"])
gmail = GmailService()

# Thread pool para ejecutar llamadas síncronas de Gmail sin bloquear el event loop
_gmail_executor = ThreadPoolExecutor(max_workers=4)

# Timeout en segundos para llamadas a la API de Gmail
GMAIL_TIMEOUT = 15


async def _run_gmail(func, *args):
    """Ejecuta una función síncrona de Gmail en un thread con timeout."""
    loop = asyncio.get_event_loop()
    try:
        return await asyncio.wait_for(
            loop.run_in_executor(_gmail_executor, func, *args),
            timeout=GMAIL_TIMEOUT
        )
    except asyncio.TimeoutError:
        gmail.reset()
        raise HTTPException(status_code=504, detail="Tiempo de espera agotado al contactar Gmail.")


# ─── Status y autenticación ───────────────────────────────────────────────────

@router.get("/status")
async def gmail_status():
    """Verifica si Gmail está autenticado y listo."""
    authenticated = gmail.is_authenticated()
    if authenticated:
        try:
            count = await _run_gmail(gmail.get_unread_count)
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
        service = gmail._get_service()
        return {"success": True, "message": "Gmail autenticado correctamente ✓"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Leer correos ─────────────────────────────────────────────────────────────

@router.get("/inbox")
async def get_inbox(
    limit: int = Query(default=10, ge=1, le=50),
    unread_only: bool = Query(default=False)
):
    """Obtiene los últimos correos del inbox."""
    try:
        emails = await _run_gmail(gmail.get_inbox, limit, unread_only)
        return {
            "count": len(emails),
            "emails": emails,
            "summary": gmail.format_for_context(emails)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unread")
async def get_unread():
    """Obtiene correos no leídos."""
    try:
        emails = await _run_gmail(gmail.get_inbox, 20, True)
        count = await _run_gmail(gmail.get_unread_count)
        return {
            "unread_count": count,
            "emails": emails,
            "summary": gmail.format_for_context(emails)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_emails(
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
        emails = await _run_gmail(gmail.search_emails, q, limit)
        return {
            "query": q,
            "count": len(emails),
            "emails": emails,
            "summary": gmail.format_for_context(emails)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/email/{message_id}")
async def get_email(message_id: str):
    """Obtiene el contenido completo de un correo por ID."""
    try:
        email = await _run_gmail(gmail.get_email_body, message_id)
        return email
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Enviar correos ───────────────────────────────────────────────────────────

class SendEmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    html: bool = False

@router.post("/send")
async def send_email(payload: SendEmailRequest):
    """Envía un correo."""
    try:
        result = await _run_gmail(
            gmail.send_email,
            payload.to, payload.subject, payload.body, payload.html
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mark-read/{message_id}")
async def mark_as_read(message_id: str):
    """Marca un correo como leído."""
    try:
        await _run_gmail(gmail.mark_as_read, message_id)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
