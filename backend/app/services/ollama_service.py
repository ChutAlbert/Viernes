import requests
import json
from app.core.config import (
    OLLAMA_CHAT_URL, OLLAMA_EMBED_URL, OLLAMA_BASE_URL,
    CHAT_MODEL, REASONING_MODEL, EMBED_MODEL,
)


class OllamaService:
    """
    Cliente para Ollama. Tres roles de modelo:
      - chat      → conversación general  (OLLAMA_CHAT_MODEL)
      - reasoning → análisis complejo     (OLLAMA_REASONING_MODEL)
      - embed     → embeddings RAG        (OLLAMA_EMBED_MODEL)
    """

    def __init__(self, model: str = CHAT_MODEL):
        self.model    = model
        self.base_url = OLLAMA_CHAT_URL
        self._options = {
            "num_ctx":     4096,
            "num_predict": 1024,
            "temperature": 0.7,
            "top_p":       0.9,
        }

    # ── Factories ─────────────────────────────────────────────────────────────

    @classmethod
    def for_chat(cls) -> "OllamaService":
        return cls(model=CHAT_MODEL)

    @classmethod
    def for_reasoning(cls) -> "OllamaService":
        inst = cls(model=REASONING_MODEL)
        inst._options = {
            "num_ctx":     8192,
            "num_predict": 2048,
            "temperature": 0.6,
            "top_p":       0.95,
        }
        return inst

    # ── Chat rápido (decisiones internas) ─────────────────────────────────────

    def chat_fast(self, messages: list) -> str:
        """Respuesta rápida con tokens mínimos. Solo para decisiones internas."""
        r = requests.post(
            self.base_url,
            json={
                "model":    self.model,
                "messages": messages,
                "stream":   False,
                "options":  {"num_ctx": 1024, "num_predict": 20, "temperature": 0.0},
            },
            timeout=60,
        )
        r.raise_for_status()
        return r.json()["message"]["content"]

    # ── Chat normal ───────────────────────────────────────────────────────────

    def chat(self, messages: list) -> str:
        r = requests.post(
            self.base_url,
            json={"model": self.model, "messages": messages, "stream": False, "options": self._options},
            timeout=300,
        )
        r.raise_for_status()
        return r.json()["message"]["content"]

    # ── Chat con tool calling ─────────────────────────────────────────────────

    def chat_with_tools(self, messages: list, tools: list) -> dict:
        r = requests.post(
            self.base_url,
            json={
                "model": self.model, "messages": messages, "tools": tools,
                "stream": False, "options": {**self._options, "num_ctx": 3072},
            },
            timeout=300,
        )
        r.raise_for_status()
        message = r.json().get("message", {})
        return {"content": message.get("content", ""), "tool_calls": message.get("tool_calls")}

    # ── Stream ────────────────────────────────────────────────────────────────

    def chat_stream(self, messages: list):
        """Yields string deltas desde Ollama."""
        with requests.post(
            self.base_url,
            json={"model": self.model, "messages": messages, "stream": True, "options": self._options},
            stream=True,
            timeout=300,
        ) as r:
            r.raise_for_status()
            for line in r.iter_lines(decode_unicode=True):
                if not line:
                    continue
                obj = json.loads(line)
                if "message" in obj and obj["message"] and "content" in obj["message"]:
                    delta = obj["message"]["content"]
                    if delta:
                        yield delta
                if obj.get("done"):
                    break

    # ── Embeddings via Ollama ─────────────────────────────────────────────────

    @staticmethod
    def embed(texts: list[str]) -> list[list[float]]:
        """Genera embeddings usando EMBED_MODEL (nomic-embed-text) vía Ollama."""
        r = requests.post(
            OLLAMA_EMBED_URL,
            json={"model": EMBED_MODEL, "input": texts},
            timeout=120,
        )
        r.raise_for_status()
        return r.json()["embeddings"]

    # ── Utilidades ────────────────────────────────────────────────────────────

    def is_model_loaded(self) -> bool:
        try:
            r = requests.get(f"{OLLAMA_BASE_URL}/api/ps", timeout=5)
            r.raise_for_status()
            models = r.json().get("models", [])
            return any(m.get("name", "").startswith(self.model) for m in models)
        except Exception:
            return False

    def warmup(self):
        """Pre-carga el modelo en Ollama para eliminar el delay inicial."""
        try:
            requests.post(
                self.base_url,
                json={"model": self.model, "messages": [{"role": "user", "content": "hi"}],
                      "stream": False, "options": {"num_predict": 1}},
                timeout=120,
            )
            print(f"[Ollama] '{self.model}' precargado ✓")
        except Exception as e:
            print(f"[Ollama] Warmup falló para '{self.model}': {e}")
