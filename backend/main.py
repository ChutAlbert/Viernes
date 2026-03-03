from fastapi import FastAPI

from app.routes.health import router as health_router
from app.routes.chat import router as chat_router
from app.routes.ingest import router as ingest_router
from app.routes.auth import router as auth_router
from app.routes.documents import router as documents_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Viernes")

app.include_router(health_router)
app.include_router(chat_router)
app.include_router(ingest_router)
app.include_router(auth_router)
app.include_router(documents_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)