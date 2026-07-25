"""
Endpoints de Spotify para Viernes.
Requiere en .env:
    SPOTIFY_CLIENT_ID=...
    SPOTIFY_CLIENT_SECRET=...
    SPOTIFY_REDIRECT_URI=http://localhost:8000/spotify/callback
    FRONTEND_URL=http://localhost:5173

Registrar el redirect_uri en: https://developer.spotify.com/dashboard
"""

import os
import json
import time
import base64
import secrets
import urllib.parse

import requests as http_requests
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse, HTMLResponse

from app.core.config import DATA_DIR

router = APIRouter(prefix="/spotify", tags=["spotify"])

_TOKEN_FILE = DATA_DIR / "spotify_token.json"
_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "")
_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "")
_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "http://localhost:8000/spotify/callback")
_FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
_SCOPES = "user-read-currently-playing user-read-recently-played user-top-read"


def _load_token():
    if not _TOKEN_FILE.exists():
        return None
    try:
        return json.loads(_TOKEN_FILE.read_text())
    except Exception:
        return None


def _save_token(data: dict):
    _TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    _TOKEN_FILE.write_text(json.dumps(data))


def _refresh_token(token_data: dict) -> dict:
    resp = http_requests.post(
        "https://accounts.spotify.com/api/token",
        data={"grant_type": "refresh_token", "refresh_token": token_data["refresh_token"]},
        headers={
            "Authorization": "Basic " + base64.b64encode(f"{_CLIENT_ID}:{_CLIENT_SECRET}".encode()).decode(),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout=10,
    )
    resp.raise_for_status()
    new_data = resp.json()
    if "refresh_token" not in new_data:
        new_data["refresh_token"] = token_data["refresh_token"]
    new_data["expires_at"] = time.time() + new_data.get("expires_in", 3600)
    _save_token(new_data)
    return new_data


def _get_access_token() -> str:
    token_data = _load_token()
    if not token_data:
        raise HTTPException(status_code=401, detail="Spotify no conectado. Ve a /spotify/auth")
    if time.time() >= token_data.get("expires_at", 0) - 60:
        token_data = _refresh_token(token_data)
    return token_data["access_token"]


# ─── Status y autenticación ───────────────────────────────────────────────────

@router.get("/status")
def spotify_status():
    if not _CLIENT_ID:
        return {"connected": False, "error": "SPOTIFY_CLIENT_ID no configurado en .env"}
    return {"connected": _load_token() is not None}


@router.get("/auth")
def spotify_auth():
    if not _CLIENT_ID:
        raise HTTPException(status_code=500, detail="SPOTIFY_CLIENT_ID no configurado en .env")
    params = {
        "client_id": _CLIENT_ID,
        "response_type": "code",
        "redirect_uri": _REDIRECT_URI,
        "scope": _SCOPES,
        "state": secrets.token_urlsafe(16),
        "show_dialog": "false",
    }
    return {"auth_url": "https://accounts.spotify.com/authorize?" + urllib.parse.urlencode(params)}


@router.get("/callback")
def spotify_callback(code: str = Query(None), error: str = Query(None)):
    if error:
        return HTMLResponse(f"<h2>Error de Spotify: {error}</h2><p>Puedes cerrar esta ventana.</p>")
    if not code:
        raise HTTPException(status_code=400, detail="Código de autorización no recibido")

    resp = http_requests.post(
        "https://accounts.spotify.com/api/token",
        data={"grant_type": "authorization_code", "code": code, "redirect_uri": _REDIRECT_URI},
        headers={
            "Authorization": "Basic " + base64.b64encode(f"{_CLIENT_ID}:{_CLIENT_SECRET}".encode()).decode(),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout=10,
    )
    if not resp.ok:
        return HTMLResponse(f"<h2>Error al conectar con Spotify</h2><pre>{resp.text}</pre>")

    token_data = resp.json()
    token_data["expires_at"] = time.time() + token_data.get("expires_in", 3600)
    _save_token(token_data)
    return RedirectResponse(url=f"{_FRONTEND_URL}/app/spotify?connected=true")


# ─── Endpoints de música ──────────────────────────────────────────────────────

@router.get("/now-playing")
def now_playing():
    access_token = _get_access_token()
    resp = http_requests.get(
        "https://api.spotify.com/v1/me/player/currently-playing",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=10,
    )
    if resp.status_code == 204:
        return {"playing": False}
    resp.raise_for_status()
    data = resp.json()
    if not data or not data.get("item"):
        return {"playing": False}

    item = data["item"]
    return {
        "playing": data.get("is_playing", False),
        "name": item["name"],
        "artists": [a["name"] for a in item["artists"]],
        "album": item["album"]["name"],
        "image": item["album"]["images"][0]["url"] if item["album"]["images"] else None,
        "progress_ms": data.get("progress_ms", 0),
        "duration_ms": item["duration_ms"],
        "spotify_url": item["external_urls"]["spotify"],
    }


@router.get("/recent")
def recent_tracks(limit: int = Query(default=10, ge=1, le=50)):
    access_token = _get_access_token()
    resp = http_requests.get(
        "https://api.spotify.com/v1/me/player/recently-played",
        headers={"Authorization": f"Bearer {access_token}"},
        params={"limit": limit},
        timeout=10,
    )
    resp.raise_for_status()
    tracks = []
    for item in resp.json().get("items", []):
        t = item["track"]
        tracks.append({
            "name": t["name"],
            "artists": [a["name"] for a in t["artists"]],
            "album": t["album"]["name"],
            "image": t["album"]["images"][-1]["url"] if t["album"]["images"] else None,
            "played_at": item["played_at"],
            "spotify_url": t["external_urls"]["spotify"],
        })
    return {"tracks": tracks}


@router.get("/top-tracks")
def top_tracks(
    limit: int = Query(default=20, ge=1, le=50),
    time_range: str = Query(default="short_term"),  # short_term, medium_term, long_term
):
    access_token = _get_access_token()
    resp = http_requests.get(
        "https://api.spotify.com/v1/me/top/tracks",
        headers={"Authorization": f"Bearer {access_token}"},
        params={"limit": limit, "time_range": time_range},
        timeout=10,
    )
    resp.raise_for_status()
    tracks = []
    for i, t in enumerate(resp.json().get("items", []), 1):
        tracks.append({
            "rank": i,
            "name": t["name"],
            "artists": [a["name"] for a in t["artists"]],
            "album": t["album"]["name"],
            "image": t["album"]["images"][-1]["url"] if t["album"]["images"] else None,
            "spotify_url": t["external_urls"]["spotify"],
            "popularity": t["popularity"],
        })
    return {"tracks": tracks, "time_range": time_range}
