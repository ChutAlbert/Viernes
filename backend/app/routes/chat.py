from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from fastapi.responses import StreamingResponse
import json
import uuid

from app.db import get_db
from app.schemas.chat import ChatIn, ChatOut
from app.services.rag_service import RagService
from app.services.ollama_service import OllamaService
from app.services.web_search_service import WebSearchService

from app.models.chat_sessions import ChatSession
from app.models.chat_messages import ChatMessage
from app.core.deps import get_current_user
from app.models.user import User

from typing import Optional, Literal
from datetime import datetime, date
from decimal import Decimal

router = APIRouter(prefix="/chat", tags=["chat"])
rag = RagService()
llm = OllamaService()
web = WebSearchService(max_results=4)

# ─── System prompts ───────────────────────────────────────────────────────────

SYSTEM_BASE = """Eres Viernes, el asistente personal privado de Jesus.

Tu propósito: ayudar en desarrollo de software, arquitectura, IA, bases de datos,
proyectos personales, automatización, y cualquier tarea que necesite.

Tienes una base de conocimiento local con:
- Stats, moves, tipos y efectividad de todos los Pokémon en Pokémon GO
- Mejores atacantes por tipo en Pokémon GO
- Guía de raids de Pokémon GO
- Documentos y notas personales de Jesus

Reglas:
- Responde de forma técnica, directa y concisa.
- No menciones tu entrenamiento ni dataset.
- Para preguntas de Pokémon GO: usa SIEMPRE el contexto local primero.
- Si usas resultados web, menciona brevemente la fuente.
- Si no tienes suficiente contexto, pregunta."""

SYSTEM_DECISION = """Tu única tarea es decidir si necesitas buscar en internet para responder.

IMPORTANTE: Tienes base de datos local completa de Pokémon GO (stats, moves, tipos,
efectividad, mejores atacantes, raids). Para cualquier pregunta de Pokémon GO → ANSWER.

Responde SOLO con uno de estos formatos, sin texto adicional:

Si NO necesitas buscar:
ANSWER

Si SÍ necesitas buscar (noticias, precios, eventos del mundo real, clima):
SEARCH: <consulta específica>

Ejemplos:
"stats de Dragonite en Pokémon GO" → ANSWER
"mejor counter para Mewtwo" → ANSWER
"moves de Charizard" → ANSWER
"raids activos esta semana" → SEARCH: pokemon go raids this week 2026
"precio del bitcoin hoy" → SEARCH: bitcoin price today
"versión actual de React" → SEARCH: React latest version 2026
"cómo hacer un for loop" → ANSWER"""


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


# ─── ReAct: decisión de búsqueda ─────────────────────────────────────────────

def decide_search(user_msg: str) -> str | None:
    """
    Pregunta al modelo si necesita buscar en internet.
    Retorna la query de búsqueda si necesita, None si no.
    Usa num_predict muy bajo para que sea rápido (~1-2s).
    """
    decision = llm.chat_fast([
        {"role": "system", "content": SYSTEM_DECISION},
        {"role": "user", "content": user_msg},
    ])

    decision = decision.strip()
    print(f"[ReAct] Decisión: {decision!r}")

    if decision.upper().startswith("SEARCH:"):
        query = decision[7:].strip()
        return query if query else None

    return None  # ANSWER o cualquier otra cosa → no busca


def run_with_react(messages: list) -> tuple[str, bool]:
    """
    Flujo ReAct:
    1. Modelo decide si necesita buscar (prompt rápido)
    2. Si necesita: busca, persiste en vectordb, añade resultado al contexto
    3. Modelo genera respuesta final con el contexto enriquecido
    Retorna: (respuesta_final, usó_web)
    """
    # Extraer el último mensaje del usuario para la decisión
    user_msg = ""
    for m in reversed(messages):
        if m["role"] == "user":
            user_msg = m["content"]
            break

    used_web = False
    current_messages = list(messages)

    # Fase 1: decidir
    query = decide_search(user_msg)

    if query:
        print(f"[ReAct] Buscando: '{query}'")
        results = web.search_and_persist(query, rag)
        web_context = web.format_for_context(results)
        used_web = bool(results)

        if web_context:
            # Inyectar contexto web como mensaje de sistema adicional
            current_messages.append({
                "role": "system",
                "content": f"Resultados de búsqueda web para '{query}':\n\n{web_context}\n\nUsa esta información para responder.",
            })

    # Fase 2: respuesta final con streaming
    return current_messages, used_web


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

            # ReAct: decide si buscar y enriquece los messages
            yield sse({"type": "status", "message": "Pensando…"})
            final_messages, used_web = run_with_react(messages)

            if used_web:
                yield sse({"type": "status", "message": "Buscando en internet…"})

            # Stream de la respuesta final
            full = []
            for delta in llm.chat_stream(final_messages):
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
                "type": "done",
                "session_id": session.id,
                "assistant_message_id": assistant_message.id,
                "used_web": used_web,
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

    final_messages, used_web = run_with_react(messages)
    reply = llm.chat(final_messages)

    m_assistant = ChatMessage(session_id=session.id, role="assistant", content=reply)
    db.add(m_assistant)
    session.touch_last_message()
    if session.title in (None, "Nuevo chat"):
        session.title = cheap_title(user_msg)
    db.commit()

    return {"session_id": str(session.id), "reply": reply, "used_context": bool(rag_context)}