import uuid
import zipfile
import io
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from pathlib import Path
from app.core.config import FILES_DIR, IMAGES_DIR
from app.core.deps import get_current_user


# Los slicers (Bambu/Orca/Prusa) guardan renders a color dentro del .3mf.
# Los extraemos para usarlos como preview real de la pieza.
_PREVIEW_CANDIDATES = (
    "Metadata/top_1.png",
    "Metadata/plate_1.png",
    "Metadata/thumbnail.png",
    "Metadata/plate_1_small.png",
)


def _extraer_preview_3mf(data: bytes, stem: str) -> str | None:
    try:
        z = zipfile.ZipFile(io.BytesIO(data))
    except Exception:
        return None
    nombres = set(z.namelist())
    elegido = next((c for c in _PREVIEW_CANDIDATES if c in nombres), None)
    if not elegido:
        elegido = next((n for n in z.namelist()
                        if n.lower().startswith("metadata/") and n.lower().endswith(".png")), None)
    if not elegido:
        return None
    try:
        png = z.read(elegido)
    except Exception:
        return None
    if not png:
        return None
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{stem}_preview_{uuid.uuid4().hex[:8]}.png"
    (IMAGES_DIR / filename).write_bytes(png)
    return f"/images/{filename}"

router = APIRouter(prefix="/files", tags=["files"])

ALLOWED_EXT = {".stl", ".3mf", ".obj", ".gcode", ".step", ".stp", ".iges", ".igs", ".amf"}
MAX_BYTES = 200 * 1024 * 1024  # 200 MB


@router.post("/upload")
async def upload_file(file: UploadFile = File(...), _=Depends(get_current_user)):
    FILES_DIR.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo no permitido: {ext}. Permitidos: {', '.join(sorted(ALLOWED_EXT))}"
        )

    data = await file.read()
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Archivo vacío")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Archivo demasiado grande (máx 200 MB)")

    # Conservar nombre original + uuid para evitar colisiones
    safe_stem = Path(file.filename).stem[:60].replace(" ", "_")
    filename = f"{safe_stem}_{uuid.uuid4().hex[:8]}{ext}"
    (FILES_DIR / filename).write_bytes(data)

    preview_url = _extraer_preview_3mf(data, safe_stem) if ext == ".3mf" else None

    return {
        "ok": True,
        "url": f"/files/{filename}",
        "nombre_original": file.filename,
        "preview_url": preview_url,   # render a color que trae el 3mf, si existe
    }


@router.get("/{filename}")
async def download_file(filename: str, _=Depends(get_current_user)):
    path = FILES_DIR / filename
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(path=str(path), filename=filename)
