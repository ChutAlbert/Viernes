from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import threading

from app.routes import auth, chat, documents, ingest, health, gmail, website, images, pieza, files, visits, catalogo, inventario, redes
from app.services.ollama_service import OllamaService
from app.core.config import IMAGES_DIR, FILES_DIR, CORS_ORIGINS


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
    allow_origins=CORS_ORIGINS,
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
app.include_router(images.router)
app.include_router(pieza.router)
app.include_router(files.router)
app.include_router(visits.router)
app.include_router(catalogo.router)
app.include_router(inventario.router)
app.include_router(redes.router)

IMAGES_DIR.mkdir(parents=True, exist_ok=True)
FILES_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/images", StaticFiles(directory=str(IMAGES_DIR)), name="images")


@app.get("/")
def root():
    return {"message": "Backend de Viernes activo"}