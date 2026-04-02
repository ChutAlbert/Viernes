"""
Gmail Service para Viernes.
Maneja autenticación OAuth2 y operaciones de Gmail.

Coloca tu credentials.json en:
    D:\Viernes\backend\data\gmail_credentials.json

El token se guarda automáticamente en:
    D:\Viernes\backend\data\gmail_token.json
"""

import os
import re
import base64
import json
from pathlib import Path
from html import unescape
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# ─── Rutas ────────────────────────────────────────────────────────────────────
DATA_DIR = Path(__file__).resolve().parents[2] / "data"
CREDENTIALS_FILE = DATA_DIR / "gmail_credentials.json"
TOKEN_FILE = DATA_DIR / "gmail_token.json"

# Permisos: leer y enviar correos
SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",  # para marcar como leído
]


class GmailService:
    def __init__(self):
        self._service = None

    def reset(self):
        """Fuerza re-conexión en la próxima llamada."""
        self._service = None

    def _get_service(self):
        """Obtiene o refresca el servicio de Gmail."""
        if self._service:
            return self._service

        creds = None

        if TOKEN_FILE.exists():
            creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)

        # Si no hay token válido, autenticar
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception as e:
                    print(f"[Gmail] Refresh falló ({e}), re-autenticando...")
                    TOKEN_FILE.unlink(missing_ok=True)
                    creds = None

            if not creds or not creds.valid:
                if not CREDENTIALS_FILE.exists():
                    raise FileNotFoundError(
                        f"No se encontró {CREDENTIALS_FILE}. "
                        "Descarga las credenciales OAuth2 desde Google Cloud Console."
                    )
                flow = InstalledAppFlow.from_client_secrets_file(
                    str(CREDENTIALS_FILE), SCOPES
                )
                creds = flow.run_local_server(port=0)

            # Guardar token para la próxima vez
            TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(TOKEN_FILE, "w") as f:
                f.write(creds.to_json())

        self._service = build("gmail", "v1", credentials=creds)
        return self._service

    def is_authenticated(self) -> bool:
        """Verifica si hay un token válido guardado."""
        if not TOKEN_FILE.exists():
            return False
        try:
            creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)
            return creds.valid or (creds.expired and bool(creds.refresh_token))
        except Exception:
            return False

    def get_auth_url(self) -> str:
        """
        Genera la URL de autorización de Google.
        El usuario debe abrir esta URL en el navegador.
        """
        if not CREDENTIALS_FILE.exists():
            raise FileNotFoundError(
                f"No se encontró {CREDENTIALS_FILE}. "
                "Descarga las credenciales desde Google Cloud Console."
            )
        flow = InstalledAppFlow.from_client_secrets_file(
            str(CREDENTIALS_FILE), SCOPES,
            redirect_uri="http://localhost:8080"
        )
        auth_url, _ = flow.authorization_url(prompt="consent")
        return auth_url

    # ─── Leer correos ─────────────────────────────────────────────────────────

    def get_inbox(self, max_results: int = 10, unread_only: bool = False) -> List[Dict]:
        """
        Obtiene los últimos correos del inbox usando batch request.
        Retorna lista de { id, subject, from, date, snippet, unread }
        """
        service = self._get_service()
        query = "in:inbox"
        if unread_only:
            query += " is:unread"

        try:
            result = service.users().messages().list(
                userId="me",
                q=query,
                maxResults=max_results
            ).execute()

            messages = result.get("messages", [])
            if not messages:
                return []

            # Batch request: obtener todos los detalles en paralelo
            details = {}

            def callback(request_id, response, exception):
                if exception is None:
                    details[request_id] = response

            batch = service.new_batch_http_request(callback=callback)
            for msg in messages:
                batch.add(
                    service.users().messages().get(
                        userId="me",
                        id=msg["id"],
                        format="metadata",
                        metadataHeaders=["Subject", "From", "Date"]
                    ),
                    request_id=msg["id"]
                )
            batch.execute()

            # Mantener el orden original
            emails = []
            for msg in messages:
                detail = details.get(msg["id"])
                if not detail:
                    continue
                headers = {h["name"]: h["value"] for h in detail["payload"]["headers"]}
                labels = detail.get("labelIds", [])
                emails.append({
                    "id":       msg["id"],
                    "subject":  headers.get("Subject", "(sin asunto)"),
                    "from":     headers.get("From", ""),
                    "date":     headers.get("Date", ""),
                    "snippet":  detail.get("snippet", ""),
                    "unread":   "UNREAD" in labels,
                })

            return emails

        except HttpError as e:
            raise Exception(f"Error al leer inbox: {e}")
        except Exception as e:
            self._service = None
            raise Exception(f"Error inesperado al leer inbox: {e}")

    def get_email_body(self, message_id: str) -> Dict:
        """
        Obtiene el cuerpo completo de un correo por ID.
        """
        service = self._get_service()
        try:
            detail = service.users().messages().get(
                userId="me",
                id=message_id,
                format="full"
            ).execute()

            payload = detail.get("payload")
            if payload and "headers" in payload:
                headers = {h["name"]: h["value"] for h in payload["headers"]}
                body = self._extract_body(payload)
            else:
                headers = {}
                body = detail.get("snippet", "(Sin contenido)")

            return {
                "id":      message_id,
                "subject": headers.get("Subject", "(sin asunto)"),
                "from":    headers.get("From", ""),
                "to":      headers.get("To", ""),
                "date":    headers.get("Date", ""),
                "body":    body,
            }
        except HttpError as e:
            raise Exception(f"Error al leer correo: {e}")
        except Exception as e:
            # Resetear servicio ante errores inesperados
            self._service = None
            raise Exception(f"Error inesperado al leer correo: {e}")

    @staticmethod
    def _html_to_text(html: str) -> str:
        """Convierte HTML a texto plano legible."""
        text = re.sub(r'<style[^>]*>[\s\S]*?</style>', '', html, flags=re.IGNORECASE)
        text = re.sub(r'<script[^>]*>[\s\S]*?</script>', '', text, flags=re.IGNORECASE)
        text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'</p>', '\n\n', text, flags=re.IGNORECASE)
        text = re.sub(r'</div>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'</tr>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'</li>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'<[^>]+>', '', text)
        text = unescape(text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r' {2,}', ' ', text)
        return text.strip()

    def _extract_body(self, payload: dict) -> str:
        """Extrae el texto del payload del correo (puede ser multipart)."""
        plain = ""
        html = ""

        if "parts" in payload:
            for part in payload["parts"]:
                mime = part.get("mimeType", "")
                data = part.get("body", {}).get("data", "")
                if not data:
                    # Multipart anidado
                    if "parts" in part:
                        nested = self._extract_body(part)
                        if nested:
                            return nested
                    continue
                decoded = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
                if mime == "text/plain" and not plain:
                    plain = decoded
                elif mime == "text/html" and not html:
                    html = decoded
        else:
            data = payload.get("body", {}).get("data", "")
            if data:
                decoded = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
                mime = payload.get("mimeType", "")
                if mime == "text/html":
                    html = decoded
                else:
                    plain = decoded

        if plain:
            return plain[:5000]
        if html:
            return self._html_to_text(html)[:5000]
        return ""

    def search_emails(self, query: str, max_results: int = 10) -> List[Dict]:
        """
        Busca correos con una query de Gmail usando batch request.
        Soporta: from:, to:, subject:, after:, before:, has:attachment, etc.
        """
        service = self._get_service()
        try:
            result = service.users().messages().list(
                userId="me",
                q=query,
                maxResults=max_results
            ).execute()

            messages = result.get("messages", [])
            if not messages:
                return []

            details = {}

            def callback(request_id, response, exception):
                if exception is None:
                    details[request_id] = response

            batch = service.new_batch_http_request(callback=callback)
            for msg in messages:
                batch.add(
                    service.users().messages().get(
                        userId="me",
                        id=msg["id"],
                        format="metadata",
                        metadataHeaders=["Subject", "From", "Date"]
                    ),
                    request_id=msg["id"]
                )
            batch.execute()

            emails = []
            for msg in messages:
                detail = details.get(msg["id"])
                if not detail:
                    continue
                headers = {h["name"]: h["value"] for h in detail["payload"]["headers"]}
                emails.append({
                    "id":      msg["id"],
                    "subject": headers.get("Subject", "(sin asunto)"),
                    "from":    headers.get("From", ""),
                    "date":    headers.get("Date", ""),
                    "snippet": detail.get("snippet", ""),
                    "unread":  "UNREAD" in detail.get("labelIds", []),
                })

            return emails
        except HttpError as e:
            raise Exception(f"Error en búsqueda: {e}")

    def get_unread_count(self) -> int:
        """Retorna el número de correos no leídos en el inbox."""
        service = self._get_service()
        try:
            result = service.users().messages().list(
                userId="me",
                q="in:inbox is:unread",
                maxResults=1
            ).execute()
            return result.get("resultSizeEstimate", 0)
        except HttpError:
            return 0

    # ─── Enviar correos ───────────────────────────────────────────────────────

    def send_email(self, to: str, subject: str, body: str, html: bool = False) -> Dict:
        """
        Envía un correo.
        """
        service = self._get_service()
        try:
            if html:
                message = MIMEMultipart("alternative")
                message["to"] = to
                message["subject"] = subject
                message.attach(MIMEText(body, "html"))
            else:
                message = MIMEText(body)
                message["to"] = to
                message["subject"] = subject

            raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
            result = service.users().messages().send(
                userId="me",
                body={"raw": raw}
            ).execute()

            return {"success": True, "message_id": result["id"]}
        except HttpError as e:
            raise Exception(f"Error al enviar correo: {e}")

    def mark_as_read(self, message_id: str):
        """Marca un correo como leído."""
        service = self._get_service()
        service.users().messages().modify(
            userId="me",
            id=message_id,
            body={"removeLabelIds": ["UNREAD"]}
        ).execute()

    def format_for_context(self, emails: List[Dict], include_body: bool = False) -> str:
        """Formatea correos como contexto para el LLM."""
        if not emails:
            return "No se encontraron correos."

        lines = []
        for i, email in enumerate(emails, 1):
            status = "🔴 No leído" if email.get("unread") else "✓ Leído"
            lines.append(
                f"[{i}] {status}\n"
                f"De: {email['from']}\n"
                f"Asunto: {email['subject']}\n"
                f"Fecha: {email['date']}\n"
                f"Resumen: {email.get('snippet', '')}"
            )
            if include_body and "body" in email:
                lines.append(f"Contenido:\n{email['body'][:1000]}")
            lines.append("")

        return "\n".join(lines)