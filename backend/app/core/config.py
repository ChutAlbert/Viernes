from pathlib import Path
import os
from dotenv import load_dotenv

# backend/app/core/config.py → parents[2] = backend/
_BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(_BACKEND_DIR / ".env")

PROJECT_ROOT = Path(__file__).resolve().parents[3]  # .../Viernes
DATA_DIR = PROJECT_ROOT / "data"
DOCS_DIR = DATA_DIR / "docs"
VECTOR_DIR = DATA_DIR / "vectordb"
IMAGES_DIR   = DATA_DIR / "images"
FILES_DIR    = DATA_DIR / "files"
GALLERY_DIR  = DATA_DIR / "gallery"

# ─── CORS ─────────────────────────────────────────────────────────────────────
# En .env: CORS_ORIGINS=http://localhost:5173,https://sodigic.com
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
CORS_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]

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

# Alias legacy
MODEL = CHAT_MODEL

# Ollama para el modelo de razonamiento — puede vivir en otro servidor (PC2)
# En .env: OLLAMA_REASONING_URL=http://192.168.1.x:11434
_reasoning_base = os.getenv("OLLAMA_REASONING_URL", OLLAMA_BASE_URL)
OLLAMA_REASONING_CHAT_URL = f"{_reasoning_base}/api/chat"

# ─── RAG ─────────────────────────────────────────────────────────────────────
COLLECTION_NAME = "viernes_docs"

# ─── Voz (STT / TTS) ─────────────────────────────────────────────────────────
# Ruta local al modelo Whisper (carpeta con model.bin, config.json, etc.)
# Si se deja vacío, faster-whisper intenta descargar WHISPER_MODEL_SIZE de HuggingFace
WHISPER_MODEL_PATH = os.getenv("WHISPER_MODEL_PATH", "")
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "large-v3")
# "cuda" para NVIDIA (RTX) | "cpu" para AMD o sin GPU
WHISPER_DEVICE     = os.getenv("WHISPER_DEVICE", "cuda")

VOICE_DATA_DIR = DATA_DIR / "voice_models"
VOICE_DATA_DIR.mkdir(parents=True, exist_ok=True)

# Nombre del archivo .onnx en data/voice_models/
# Opciones: kokoro-v1.0.onnx (310MB) | kokoro-v1.0.fp16.onnx (169MB) | kokoro-v1.0.int8.onnx (88MB)
KOKORO_MODEL_FILE = os.getenv("KOKORO_MODEL_FILE", "kokoro-v1.0.fp16.onnx")
# Voz por defecto. Voces ES: ef_dora (femenina) | em_alex | em_santa (masculinas)
KOKORO_VOICE      = os.getenv("KOKORO_VOICE", "ef_dora")

# ─── Visitas ──────────────────────────────────────────────────────────────────
# En .env: EXCLUDED_IPS=127.0.0.1,192.168.1.10,::1
_raw_excluded = os.getenv("EXCLUDED_IPS", "127.0.0.1,::1")
EXCLUDED_IPS: set[str] = {ip.strip() for ip in _raw_excluded.split(",") if ip.strip()}
