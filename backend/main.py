from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import threading

from app.routes import auth, chat, documents, ingest, health
from app.services.ollama_service import OllamaService


def _warmup_model():
    """Corre en background para no bloquear el arranque del servidor."""
    llm = OllamaService()
    llm.warmup()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Al arrancar: precarga el modelo en Ollama en un thread aparte
    t = threading.Thread(target=_warmup_model, daemon=True)
    t.start()
    yield
    # Al apagar: nada por ahora


app = FastAPI(title="Viernes API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(ingest.router)