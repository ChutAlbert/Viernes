import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pathlib import Path
from app.core.config import IMAGES_DIR
from app.core.deps import get_current_user

router = APIRouter(prefix="/images", tags=["images"])

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
MAX_BYTES = 10 * 1024 * 1024  # 10MB


@router.post("/upload")
async def upload_image(file: UploadFile = File(...), _=Depends(get_current_user)):
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Tipo no permitido: {ext}")

    data = await file.read()
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Archivo vacío")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Imagen demasiado grande (máx 10MB)")

    filename = f"{uuid.uuid4().hex}{ext}"
    (IMAGES_DIR / filename).write_bytes(data)

    return {"ok": True, "url": f"/images/{filename}"}
