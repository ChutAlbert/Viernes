from pathlib import Path
import os

PROJECT_ROOT = Path(__file__).resolve().parents[3]  # .../Viernes
DATA_DIR = PROJECT_ROOT / "data"
DOCS_DIR = DATA_DIR / "docs"
VECTOR_DIR = DATA_DIR / "vectordb"

# ─── Ollama ───────────────────────────────────────────────────────────────────
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_CHAT_URL = f"{OLLAMA_BASE_URL}/api/chat"

# Modelo de chat (texto)
MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

# Modelo de visión para OCR de documentos escaneados
VISION_MODEL = os.getenv("OLLAMA_VISION_MODEL", "llava:7b")

# ─── Embeddings / RAG ────────────────────────────────────────────────────────
EMBED_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
COLLECTION_NAME = "viernes_docs"