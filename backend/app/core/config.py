from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]  # .../Viernes
DATA_DIR = PROJECT_ROOT / "data"
DOCS_DIR = DATA_DIR / "docs"
VECTOR_DIR = DATA_DIR / "vectordb"

OLLAMA_CHAT_URL = "http://localhost:11434/api/chat"
MODEL = "llama3.1:8b"

EMBED_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
COLLECTION_NAME = "viernes_docs"
