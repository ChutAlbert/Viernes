from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import json
import uuid
import re
import base64

from app.db import get_db
from app.schemas.chat import ChatIn, ChatOut
from app.services.rag_service import RagService
from app.services.ollama_service import OllamaService
from app.services.web_search_service import WebSearchService
from app.services.voice_service import VoiceService

from app.models.chat_sessions import ChatSession
from app.models.chat_messages import ChatMessage
from app.core.deps import get_current_user
from app.models.user import User

from typing import Optional, Literal
from datetime import datetime, date
from decimal import Decimal

router = APIRouter(prefix="/chat", tags=["chat"])
rag   = RagService()
llm   = OllamaService.for_chat()       # modelo principal  (PC1 local)
llmr  = OllamaService.for_reasoning()  # modelo reasoning  (PC2 via LAN o local)
web   = WebSearchService(max_results=4)
voice = VoiceService.get()

# Palabras clave que indican que el usuario quiere buscar en internet explícitamente
_SEARCH_RE = re.compile(
    r"\b(busca|buscar|googlea|busca en internet|investiga en internet|search online|search for)\b",
    re.IGNORECASE,
)

# ─── System prompts ───────────────────────────────────────────────────────────

SYSTEM_BASE = """Eres Viernes, el asistente personal de inteligencia artificial de Jesus — similar a J.A.R.V.I.S. o F.R.I.D.A.Y. de Iron Man.

Personalidad y trato:
- SIEMPRE te diriges a Jesus como "señor" o "Señor".
- Al inicio de una conversación, saluda con "Buenos días, señor", "Buenas tardes, señor" o "Buenas noches, señor" según la hora.
- Para confirmar instrucciones usa frases como: "Sí, señor", "Enseguida, señor", "Entendido, señor", "Como usted diga, señor".
- Mantén un tono respetuoso, profesional, leal y ligeramente ingenioso — como un mayordomo de élite con conocimiento técnico.
- Sé directo y conciso, pero siempre con el trato de "señor".

Tu propósito: ayudar en desarrollo de software, arquitectura, IA, bases de datos,
proyectos personales, automatización, y cualquier tarea que el señor necesite.

Tienes una base de conocimiento local con:
- Stats, moves, tipos y efectividad de todos los Pokémon en Pokémon GO
- Mejores atacantes por tipo en Pokémon GO
- Guía de raids de Pokémon GO
- Documentos y notas personales del señor

Reglas:
- Responde de forma técnica, directa y concisa, siempre con el trato de "señor".
- No menciones tu entrenamiento ni dataset.
- Para preguntas de Pokémon GO: usa SIEMPRE el contexto local primero.
- Si usas resultados web, menciona brevemente la fuente.
- Si no tienes suficiente contexto, pregunta."""



SYSTEM_MODEL_SELECTOR = """Decide si este mensaje requiere razonamiento profundo o es una conversación normal.

USA REASONING cuando el mensaje implique:
- Análisis complejo de código, arquitectura o diseño de sistemas
- Depuración difícil o errores complicados
- Matemáticas, algoritmos o lógica elaborada
- Comparación técnica detallada con pros/contras
- Planificación de proyectos o estrategias

USA CHAT para todo lo demás:
- Preguntas simples o conversación
- Pokémon GO o consultas de datos
- Búsquedas de información
- Tareas rápidas

Responde SOLO con una palabra:
REASONING
CHAT"""


# ─── Helpers ──────────────────────────────────────────────────────────────────

def cheap_title(text: str, max_words: int = 8) -> str:
    words = text.strip().split()
    return " ".join(words[:max_words]) + ("…" if len(words) > max_words else "")

def json_safe(obj):
    if isinstance(obj, (uuid.UUID, datetime, date, Decimal)):
        return str(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

def sse(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False, default=json_safe)}\n\n"


# ─── Selección de modelo + búsqueda explícita ────────────────────────────────

def decide_model(user_msg: str) -> OllamaService:
    """Elige chat vs reasoning con una inferencia rápida (20 tokens)."""
    decision = llm.chat_fast([
        {"role": "system", "content": SYSTEM_MODEL_SELECTOR},
        {"role": "user",   "content": user_msg},
    ]).strip().upper()
    print(f"[ModelRouter] {decision!r}")
    return llmr if decision.startswith("REASONING") else llm


def _extract_search_query(text: str) -> str | None:
    """
    Retorna la query si el usuario pide explícitamente una búsqueda web,
    ej. "busca el precio del bitcoin" → "el precio del bitcoin".
    Sin keyword explícito → None (usa RAG local sin tocar internet).
    """
    m = _SEARCH_RE.search(text)
    if not m:
        return None
    after = text[m.end():].strip().lstrip(":").strip()
    return after if after else text


def run_with_react(messages: list) -> tuple[list, bool, OllamaService]:
    """
    1. Selecciona modelo (chat vs reasoning)
    2. Busca en internet SOLO si el usuario lo pidió explícitamente
    3. El RAG local siempre inyecta contexto de búsquedas previas guardadas
    """
    user_msg = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")

    selected_llm     = decide_model(user_msg)
    query            = _extract_search_query(user_msg)
    used_web         = False
    current_messages = list(messages)

    if query:
        print(f"[Search] Búsqueda explícita: '{query}'")
        results     = web.search_and_persist(query, rag)
        web_context = web.format_for_context(results)
        used_web    = bool(results)
        if web_context:
            current_messages.append({
                "role":    "system",
                "content": f"Resultados de búsqueda web para '{query}':\n\n{web_context}\n\nUsa esta información para responder.",
            })

    return current_messages, used_web, selected_llm


# ─── Session endpoints ────────────────────────────────────────────────────────

class SessionUpdate(BaseModel):
    title: str

@router.post("/sessions")
def create_session(db: Session = Depends(get_db)):
    s = ChatSession(title="Nuevo chat")
    db.add(s); db.commit(); db.refresh(s)
    return {"id": str(s.id), "title": s.title, "created_at": s.created_at, "last_message_at": s.last_message_at}

@router.get("/sessions")
def list_sessions(db: Session = Depends(get_db)):
    sessions = (
        db.query(ChatSession)
        .order_by(ChatSession.last_message_at.desc().nullslast(), ChatSession.created_at.desc())
        .limit(50).all()
    )
    return [{"id": str(s.id), "title": s.title, "created_at": s.created_at, "last_message_at": s.last_message_at} for s in sessions]

@router.get("/sessions/{session_id}/messages")
def list_messages(session_id: str, db: Session = Depends(get_db)):
    msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc()).all()
    )
    return [{"id": str(m.id), "session_id": str(m.session_id), "role": m.role, "content": m.content, "created_at": m.created_at} for m in msgs]

@router.patch("/sessions/{session_id}")
def rename_session(session_id: str, payload: SessionUpdate, db: Session = Depends(get_db)):
    s = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session no encontrada")
    s.title = payload.title.strip()[:80]
    db.commit()
    return {"id": str(s.id), "title": s.title}


# ─── Stream endpoint ──────────────────────────────────────────────────────────

class ChatStreamIn(BaseModel):
    message: str
    session_id: Optional[str] = None
    memory_mode: Literal["auto", "ask", "off"] = "auto"

@router.post("/stream")
def chat_stream(
    payload: ChatStreamIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user_msg = payload.message.strip()

    # 1) Sesión
    session = None
    if payload.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == payload.session_id).first()
    if not session:
        session = ChatSession(id=uuid.uuid4(), title=None, is_title_auto_generated=True)
        db.add(session); db.commit(); db.refresh(session)

    # 2) Guardar mensajes
    user_message = ChatMessage(id=uuid.uuid4(), session_id=session.id, role="user", content=user_msg)
    db.add(user_message)
    assistant_message = ChatMessage(id=uuid.uuid4(), session_id=session.id, role="assistant", content="")
    db.add(assistant_message)
    session.touch_last_message()
    db.add(session)
    db.commit()
    db.refresh(assistant_message)

    # 3) RAG context (docs + búsquedas previas persistidas)
    rag_context = ""
    if payload.memory_mode != "off":
        rag_context = rag.retrieve_context(user_msg, k=5)

    # 4) Historial reciente
    recent = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(8).all()
    )
    recent = list(reversed(recent))

    # 5) Construir messages
    system = SYSTEM_BASE
    if rag_context:
        system += f"\n\nCONTEXTO DE DOCUMENTOS Y BÚSQUEDAS PREVIAS:\n{rag_context}"

    messages = [{"role": "system", "content": system}]
    for r in recent:
        if r.role in ("user", "assistant") and r.content:
            messages.append({"role": r.role, "content": r.content})
    messages.append({"role": "user", "content": user_msg})

    # 6) Generator SSE
    def generator():
        try:
            yield sse({
                "type": "start",
                "session_id": session.id,
                "assistant_message_id": assistant_message.id,
                "used_context": bool(rag_context),
            })

            # ReAct: selecciona modelo y decide si buscar
            yield sse({"type": "status", "message": "Pensando…"})
            final_messages, used_web, active_llm = run_with_react(messages)

            if used_web:
                yield sse({"type": "status", "message": "Buscando en internet…"})

            using_reasoning = active_llm.model != llm.model
            if using_reasoning:
                yield sse({"type": "status", "message": "Razonamiento profundo…"})

            # Stream de la respuesta final
            full = []
            for delta in active_llm.chat_stream(final_messages):
                full.append(delta)
                yield sse({"type": "delta", "delta": delta})

            final_text = "".join(full)

            # Guardar
            assistant_message.content = final_text
            db.add(assistant_message)

            if (not session.title) or session.is_title_auto_generated:
                session.title = (user_msg[:48] + "…") if len(user_msg) > 48 else user_msg
                session.is_title_auto_generated = True

            session.touch_last_message()
            db.add(session)
            db.commit()

            yield sse({
                "type":                 "done",
                "session_id":           session.id,
                "assistant_message_id": assistant_message.id,
                "used_web":             used_web,
                "model":                active_llm.model,
            })

        except Exception as e:
            try:
                assistant_message.content = "(Error al generar respuesta)"
                db.add(assistant_message); db.commit()
            except Exception:
                pass
            yield sse({"type": "error", "message": str(e)})

    return StreamingResponse(generator(), media_type="text/event-stream")


# ─── Chat normal (no streaming) ───────────────────────────────────────────────

@router.post("", response_model=ChatOut)
def chat(payload: ChatIn, db: Session = Depends(get_db)):
    user_msg = payload.message.strip()
    if not user_msg:
        raise HTTPException(status_code=422, detail="Mensaje vacío")

    if payload.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == payload.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session no encontrada")
    else:
        session = ChatSession(title="Nuevo chat")
        db.add(session); db.flush()

    m_user = ChatMessage(session_id=session.id, role="user", content=user_msg)
    db.add(m_user)

    recent = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.desc()).limit(8).all()
    )
    recent = list(reversed(recent))

    rag_context = rag.retrieve_context(user_msg, k=4) if payload.memory_mode != "off" else ""
    system = SYSTEM_BASE
    if rag_context:
        system += f"\n\nCONTEXTO:\n{rag_context}"

    messages = [{"role": "system", "content": system}]
    for r in recent:
        if r.role in ("user", "assistant"):
            messages.append({"role": r.role, "content": r.content})
    messages.append({"role": "user", "content": user_msg})

    final_messages, used_web, active_llm = run_with_react(messages)
    reply = active_llm.chat(final_messages)

    m_assistant = ChatMessage(session_id=session.id, role="assistant", content=reply)
    db.add(m_assistant)
    session.touch_last_message()
    if session.title in (None, "Nuevo chat"):
        session.title = cheap_title(user_msg)
    db.commit()

    return {"session_id": str(session.id), "reply": reply, "used_context": bool(rag_context)}


# ─── Endpoint voz-a-voz ───────────────────────────────────────────────────────

@router.post("/voice")
async def chat_voice(
    audio:        UploadFile = File(...),
    session_id:   Optional[str] = Form(None),
    memory_mode:  str = Form("auto"),
    db:           Session = Depends(get_db),
    user:         User    = Depends(get_current_user),
):
    """
    Recibe audio del micrófono → transcribe (Whisper) → LLM → sintetiza (Kokoro).
    Devuelve { transcript, reply, session_id, used_web, audio_b64 }.
    """
    if not voice.stt_available:
        raise HTTPException(status_code=503, detail="faster-whisper no instalado")

    audio_bytes = await audio.read()

    # 1) STT
    try:
        transcript = voice.transcribe(audio_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"STT error: {e}")

    if not transcript:
        raise HTTPException(status_code=422, detail="No se pudo transcribir el audio (silencio o formato inválido)")

    # 2) Sesión
    session = None
    if session_id:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        session = ChatSession(id=uuid.uuid4(), title=None, is_title_auto_generated=True)
        db.add(session); db.commit(); db.refresh(session)

    # 3) Guardar mensajes
    user_msg_db = ChatMessage(id=uuid.uuid4(), session_id=session.id, role="user", content=transcript)
    asst_msg_db = ChatMessage(id=uuid.uuid4(), session_id=session.id, role="assistant", content="")
    db.add(user_msg_db); db.add(asst_msg_db)
    session.touch_last_message(); db.add(session); db.commit(); db.refresh(asst_msg_db)

    # 4) RAG + historial
    rag_context = rag.retrieve_context(transcript, k=5) if memory_mode != "off" else ""
    recent = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.desc()).limit(8).all()
    )
    recent = list(reversed(recent))

    system = SYSTEM_BASE
    if rag_context:
        system += f"\n\nCONTEXTO:\n{rag_context}"

    # Para respuestas de voz: conciso, sin markdown ni listas
    system += "\n\nIMPORTANTE: Esta es una respuesta de voz. Sé muy conciso (2-3 oraciones máximo). Sin markdown, sin listas, solo texto natural hablado."

    messages = [{"role": "system", "content": system}]
    for r in recent:
        if r.role in ("user", "assistant") and r.content:
            messages.append({"role": r.role, "content": r.content})
    messages.append({"role": "user", "content": transcript})

    # 5) LLM
    final_messages, used_web, active_llm = run_with_react(messages)
    reply = active_llm.chat(final_messages)

    # 6) Persistir respuesta
    asst_msg_db.content = reply
    if (not session.title) or session.is_title_auto_generated:
        session.title = (transcript[:48] + "…") if len(transcript) > 48 else transcript
        session.is_title_auto_generated = True
    session.touch_last_message(); db.add(session); db.add(asst_msg_db); db.commit()

    # 7) TTS (opcional — si Kokoro no está configurado, devuelve solo texto)
    audio_b64 = None
    if voice.tts_available:
        try:
            raw_audio = voice.synthesize(reply)
            audio_b64 = base64.b64encode(raw_audio).decode()
        except Exception as e:
            print(f"[TTS] Error (continúa sin audio): {e}")

    return {
        "transcript": transcript,
        "reply":       reply,
        "session_id":  str(session.id),
        "used_web":    used_web,
        "audio_b64":   audio_b64,
    }