from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import threading

from app.routes import auth, chat, documents, ingest, health, gmail, website
from app.services.ollama_service import OllamaService


def _warmup_models():
    """Pre-carga chat + reasoning en paralelo para eliminar el delay inicial."""
    threads = [
        threading.Thread(target=OllamaService.for_chat().warmup,      daemon=True),
        threading.Thread(target=OllamaService.for_reasoning().warmup,  daemon=True),
    ]
    for t in threads:
        t.start()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _warmup_models()
    yield


app = FastAPI(title="Viernes API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(ingest.router)
app.include_router(gmail.router)
app.include_router(website.router)


@app.get("/")
def root():
    return {"message": "Backend de Viernes activo"}