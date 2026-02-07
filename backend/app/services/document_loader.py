from pathlib import Path
from pypdf import PdfReader

def read_text_file(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")

def read_pdf(path: Path) -> str:
    reader = PdfReader(str(path))
    texts = []
    for page in reader.pages:
        texts.append(page.extract_text() or "")
    return "\n".join(texts)

def load_document(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in [".txt", ".md"]:
        return read_text_file(path)
    if ext == ".pdf":
        return read_pdf(path)
    raise ValueError("Formato soportado: .txt, .md, .pdf")
