from fastapi import APIRouter

from app.schemas.chat import ChatIn
from app.services.rag_service import RagService
from app.services.ollama_service import OllamaService

router = APIRouter(prefix="", tags=["chat"])
rag = RagService()
llm = OllamaService()

@router.post("/chat")
def chat(payload: ChatIn):
    user_msg = payload.message.strip()
    context = rag.retrieve_context(user_msg, k=4)

    system = "Eres Viernes, un asistente personal útil, conciso y orientado a tareas."
    if context:
        system += (
            "\n\nUsa el CONTEXTO para responder. "
            "Si el contexto no contiene la respuesta, dilo y sugiere qué documento falta."
        )

    messages = [{"role": "system", "content": system}]
    if context:
        messages.append({"role": "system", "content": f"CONTEXTO:\n{context}"})
    messages.append({"role": "user", "content": user_msg})

    reply = llm.chat(messages)
    return {"reply": reply, "used_context": bool(context)}
