from fastapi import APIRouter, HTTPException
from pathlib import Path

from app.schemas.ingest import IngestIn
from app.core.config import DOCS_DIR
from app.services.document_loader import load_document
from app.services.rag_service import RagService

router = APIRouter(prefix="", tags=["ingest"])
rag = RagService()

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
