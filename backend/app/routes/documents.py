from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
from app.core.config import DOCS_DIR

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_EXT = {".pdf", ".txt", ".md", ".docx"}
MAX_BYTES = 25 * 1024 * 1024  # 25MB (ajusta)

def safe_filename(name: str) -> str:
    # evita path traversal tipo ../../
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
            })
    files.sort(key=lambda x: x["modified"], reverse=True)
    return {"ok": True, "files": files}