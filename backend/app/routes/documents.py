from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
from app.core.config import DOCS_DIR
from app.services.rag_service import RagService
from app.services.document_loader import load_document

router = APIRouter(prefix="/documents", tags=["documents"])
rag = RagService()

ALLOWED_EXT = {".pdf", ".txt", ".md", ".docx"}
MAX_BYTES = 25 * 1024 * 1024  # 25MB


def safe_filename(name: str) -> str:
    return Path(name).name


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    filename = safe_filename(file.filename or "")
    if not filename:
        raise HTTPException(status_code=400, detail="Nombre de archivo inválido")

    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Tipo no permitido: {ext}")

    data = await file.read()
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Archivo vacío")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Archivo demasiado grande")

    dest = DOCS_DIR / filename
    dest.write_bytes(data)

    return {"ok": True, "filename": filename, "bytes": len(data)}


@router.get("")
def list_documents():
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    files = []
    for p in DOCS_DIR.iterdir():
        if p.is_file():
            files.append({
                "name": p.name,
                "size": p.stat().st_size,
                "modified": int(p.stat().st_mtime),
                "ext": p.suffix.lower(),
            })
    files.sort(key=lambda x: x["modified"], reverse=True)
    return {"ok": True, "files": files}


@router.get("/{filename}/preview")
def preview_document(filename: str):
    """Devuelve el texto extraído del documento (primeros 3000 chars)."""
    filename = safe_filename(filename)
    path = DOCS_DIR / filename

    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    ext = path.suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Tipo no soportado para preview")

    try:
        text = load_document(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al leer el archivo: {e}")

    preview = text[:3000]
    return {
        "ok": True,
        "filename": filename,
        "total_chars": len(text),
        "preview": preview,
        "truncated": len(text) > 3000,
    }


@router.delete("/{filename}")
def delete_document(filename: str):
    """Elimina el archivo del disco y sus chunks del vectordb."""
    filename = safe_filename(filename)
    path = DOCS_DIR / filename

    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    # 1) Eliminar chunks del vectordb
    try:
        rag.delete_doc(f"file::{filename}")
    except Exception:
        pass  # si no estaba indexado, no importa

    # 2) Eliminar archivo del disco
    path.unlink()

    return {"ok": True, "deleted": filename}
