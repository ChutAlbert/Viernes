from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db import get_db
from app.schemas.chat import ChatIn, ChatOut
from app.services.rag_service import RagService
from app.services.ollama_service import OllamaService

from app.models.chat_sessions import ChatSession
from app.models.chat_messages import ChatMessage

router = APIRouter(prefix="/chat", tags=["chat"])
rag = RagService()
llm = OllamaService()

class SessionUpdate(BaseModel):
    title: str

SYSTEM_BASE = """
Eres Viernes, el asistente personal privado de Jesus.

Trabajas dentro de su sistema llamado Viernes.
Tu propósito es ayudarle en desarrollo de software, arquitectura backend, frontend,
IA, bases de datos, proyectos personales, preguntas comunes, automatización de tareas, entre otras cosas que pueda necesitar.

No respondas como un modelo genérico entrenado.
No expliques tu entrenamiento ni dataset.
No digas "mi entrenamiento se basa en...".

Responde de forma técnica, directa y útil.
Si no tienes contexto suficiente, pregunta para obtenerlo.
"""

def get_or_create_session(db: Session, session_id: str | None) -> ChatSession:
    if session_id:
        s = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not s:
            raise HTTPException(status_code=404, detail="Session no encontrada")
        return s

    s = ChatSession(title="Nuevo chat")
    db.add(s)
    db.flush()  # para tener s.id
    return s

@router.post("/sessions")
def create_session(db: Session = Depends(get_db)):
    s = ChatSession(title="Nuevo chat")
    db.add(s)
    db.commit()
    db.refresh(s)
    return {"id": str(s.id), "title": s.title, "created_at": s.created_at, "last_message_at": s.last_message_at}

@router.get("/sessions")
def list_sessions(db: Session = Depends(get_db)):
    sessions = (
        db.query(ChatSession)
        .order_by(ChatSession.last_message_at.desc().nullslast(), ChatSession.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {"id": str(s.id), "title": s.title, "created_at": s.created_at, "last_message_at": s.last_message_at}
        for s in sessions
    ]

@router.get("/sessions/{session_id}/messages")
def list_messages(session_id: str, db: Session = Depends(get_db)):
    msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [
        {"id": str(m.id), "session_id": str(m.session_id), "role": m.role, "content": m.content, "created_at": m.created_at}
        for m in msgs
    ]

@router.post("", response_model=ChatOut)
def chat(payload: ChatIn, db: Session = Depends(get_db)):
    user_msg = payload.message.strip()
    if not user_msg:
        raise HTTPException(status_code=422, detail="Mensaje vacío")

    # 1) session
    session = get_or_create_session(db, payload.session_id)

    # 2) guardar mensaje user
    m_user = ChatMessage(session_id=session.id, role="user", content=user_msg)
    db.add(m_user)

    # 3) contexto (RAG docs) + contexto reciente de chat
    # contexto reciente: últimos 12 mensajes del session
    recent = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(12)
        .all()
    )
    recent = list(reversed(recent))

    context = rag.retrieve_context(user_msg, k=4)

    system = SYSTEM_BASE
    if context:
        system += (
            "\n\nUsa el CONTEXTO para responder. "
            "Si el contexto no contiene la respuesta, dilo y sugiere qué documento falta."
        )

    messages = [{"role": "system", "content": system}]

    # añade historial reciente (sin system)
    for r in recent:
        if r.role in ("user", "assistant"):
            messages.append({"role": r.role, "content": r.content})

    if context and payload.memory_mode != "off":
        messages.append({"role": "system", "content": f"CONTEXTO:\n{context}"})

    messages.append({"role": "user", "content": user_msg})

    # 4) LLM
    reply = llm.chat(messages)

    # 5) guardar respuesta assistant
    m_assistant = ChatMessage(session_id=session.id, role="assistant", content=reply)
    db.add(m_assistant)

    # 6) actualizar last_message_at (si tu modelo lo tiene)
    session.touch_last_message()

    if (session.title is None or session.title == "Nuevo chat") and getattr(session, "is_title_auto_generated", True):
        session.title = cheap_title(user_msg)
  
    db.commit()

    return {"session_id": str(session.id), "reply": reply, "used_context": bool(context)}
  
def cheap_title(text: str, max_words=8):
    words = text.strip().split()
    return " ".join(words[:max_words]) + ("…" if len(words) > max_words else "")

@router.patch("/sessions/{session_id}")
def rename_session(session_id: str, payload: SessionUpdate, db: Session = Depends(get_db)):
    s = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session no encontrada")

    s.title = payload.title.strip()[:80]
    if hasattr(s, "is_title_auto"):
        s.is_title_auto = False

    db.commit()
    return {"id": str(s.id), "title": s.title}