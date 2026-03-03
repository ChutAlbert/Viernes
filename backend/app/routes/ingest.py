from fastapi import APIRouter, HTTPException
from pathlib import Path

from pydantic import BaseModel
from app.services.rag_service import RagService

from app.schemas.ingest import IngestIn
from app.core.config import DOCS_DIR
from app.services.document_loader import load_document

router = APIRouter(prefix="", tags=["ingest"])
rag = RagService()

class IngestTextIn(BaseModel):
    doc_id: str
    text: str
    namespace: str = "notes"
    title: str | None = None

@router.post("/ingest")
def ingest(payload: IngestIn):
    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    path = DOCS_DIR / payload.filename
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"No existe el archivo: {path}")

    try:
        text = load_document(path)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not text.strip():
        raise HTTPException(status_code=400, detail="El archivo está vacío o no se pudo leer.")

    chunks = rag.upsert_document(source=payload.filename, text=text)
    return {"ok": True, "file": payload.filename, "chunks_indexed": chunks}

@router.post("/ingest/text")
def ingest_text(payload: IngestTextIn):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Texto vacío")
    chunks = rag.upsert_text(
        doc_id=f"{payload.namespace}::{payload.doc_id}",
        text=payload.text,
        metadata={
            "namespace": payload.namespace,
            "title": payload.title or payload.doc_id
        }
    )
    return {"ok": True, "chunks_indexed": chunks}