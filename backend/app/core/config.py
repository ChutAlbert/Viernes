from pathlib import Path
import os

PROJECT_ROOT = Path(__file__).resolve().parents[3]  # .../Viernes
DATA_DIR = PROJECT_ROOT / "data"
DOCS_DIR = DATA_DIR / "docs"
VECTOR_DIR = DATA_DIR / "vectordb"
IMAGES_DIR = DATA_DIR / "images"

# ─── Ollama ───────────────────────────────────────────────────────────────────
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

OLLAMA_CHAT_URL  = f"{OLLAMA_BASE_URL}/api/chat"
OLLAMA_EMBED_URL = f"{OLLAMA_BASE_URL}/api/embed"

# Modelo principal de chat (conversación general)
CHAT_MODEL      = os.getenv("OLLAMA_CHAT_MODEL",      "qwen3:8b")

# Modelo de razonamiento (análisis complejo, código, arquitectura)
REASONING_MODEL = os.getenv("OLLAMA_REASONING_MODEL", "deepseek-r1:8b")

# Modelo de embeddings (RAG)
EMBED_MODEL     = os.getenv("OLLAMA_EMBED_MODEL",     "nomic-embed-text")

# Modelo de visión para OCR de documentos escaneados
VISION_MODEL    = os.getenv("OLLAMA_VISION_MODEL",    "llava:7b")

# Alias legacy (no romper código que ya usaba MODEL)
MODEL = CHAT_MODEL

# ─── RAG ─────────────────────────────────────────────────────────────────────
COLLECTION_NAME = "viernes_docs"
