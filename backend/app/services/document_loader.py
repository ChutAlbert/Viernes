from pathlib import Path
from pypdf import PdfReader
import base64
import requests
import fitz  # pymupdf
import json

from app.core.config import OLLAMA_BASE_URL, VISION_MODEL

# ─── texto plano ──────────────────────────────────────────────────────────────
def read_text_file(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


# ─── PDF digital (tiene texto real) ──────────────────────────────────────────
def _extract_pdf_text(path: Path) -> str:
    reader = PdfReader(str(path))
    texts = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(texts)


def _pdf_has_text(path: Path, min_chars: int = 50) -> bool:
    """True si el PDF tiene suficiente texto digital (no es escaneado)."""
    text = _extract_pdf_text(path)
    return len(text.strip()) >= min_chars


# ─── OCR via Ollama vision ────────────────────────────────────────────────────
def _image_to_base64(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode("utf-8")


def _ocr_image_with_ollama(image_bytes: bytes) -> str:
    """
    Envía una imagen a llava via Ollama y extrae el texto.
    """
    b64 = _image_to_base64(image_bytes)

    payload = {
        "model": VISION_MODEL,
        "prompt": (
            "Extract ALL text from this document image exactly as it appears. "
            "Return only the extracted text, no explanations. "
            "Preserve the original structure and formatting as much as possible."
        ),
        "images": [b64],
        "stream": False,
    }

    try:
        r = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload,
            timeout=120,
        )
        r.raise_for_status()
        return r.json().get("response", "").strip()
    except Exception as e:
        return f"[OCR error en página: {e}]"


def _pdf_ocr(path: Path, dpi: int = 150) -> str:
    """
    Convierte cada página del PDF a imagen y la pasa por OCR con llava.
    dpi=150 es un buen balance entre calidad y velocidad para documentos.
    """
    doc = fitz.open(str(path))
    results = []

    for page_num, page in enumerate(doc, start=1):
        # renderizar página como imagen PNG en memoria
        mat = fitz.Matrix(dpi / 72, dpi / 72)  # escala según DPI
        pix = page.get_pixmap(matrix=mat)
        image_bytes = pix.tobytes("png")

        print(f"  → OCR página {page_num}/{len(doc)}...")
        text = _ocr_image_with_ollama(image_bytes)
        results.append(f"--- Página {page_num} ---\n{text}")

    doc.close()
    return "\n\n".join(results)


# ─── loader principal ─────────────────────────────────────────────────────────
def read_pdf(path: Path) -> str:
    """
    Detecta automáticamente si el PDF tiene texto o es escaneado.
    - PDF digital → extrae texto directamente (rápido)
    - PDF escaneado → OCR página por página con llava (lento pero funciona)
    """
    if _pdf_has_text(path):
        return _extract_pdf_text(path)

    print(f"  PDF escaneado detectado, usando OCR con {VISION_MODEL}...")
    return _pdf_ocr(path)


def load_document(path: Path) -> str:
    ext = path.suffix.lower()

    if ext in [".txt", ".md"]:
        return read_text_file(path)

    if ext == ".pdf":
        return read_pdf(path)

    raise ValueError(f"Formato no soportado: {ext}. Usa .txt, .md o .pdf")