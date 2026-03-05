import requests
import json
from app.core.config import OLLAMA_CHAT_URL, OLLAMA_BASE_URL, MODEL


class OllamaService:
    def __init__(self, base_url: str = OLLAMA_CHAT_URL, model: str = MODEL):
        self.base_url = base_url
        self.model = model
        self._options = {
            "num_ctx": 2048,
            "num_predict": 1024,
            "temperature": 0.7,
            "top_p": 0.9,
        }


    # ── Chat rapido para decisiones internas (num_predict bajo) ──────────────
    def chat_fast(self, messages: list) -> str:
        """Respuesta rapida con tokens minimos. Solo para decisiones internas."""
        r = requests.post(
            self.base_url,
            json={
                "model":    self.model,
                "messages": messages,
                "stream":   False,
                "options":  {
                    "num_ctx":     1024,
                    "num_predict": 20,
                    "temperature": 0.0,
                },
            },
            timeout=60,
        )
        r.raise_for_status()
        return r.json()["message"]["content"]

    # ── Chat normal ───────────────────────────────────────────────────────────
    def chat(self, messages: list) -> str:
        r = requests.post(
            self.base_url,
            json={
                "model":    self.model,
                "messages": messages,
                "stream":   False,
                "options":  self._options,
            },
            timeout=300,
        )
        r.raise_for_status()
        return r.json()["message"]["content"]

    # ── Chat con tool calling ─────────────────────────────────────────────────
    def chat_with_tools(self, messages: list, tools: list) -> dict:
        """
        Envía mensajes con tools disponibles.
        Retorna el message completo del assistant:
          - Si quiere usar tool: { "content": "", "tool_calls": [...] }
          - Si responde normal:  { "content": "texto...", "tool_calls": None }
        """
        payload = {
            "model":    self.model,
            "messages": messages,
            "tools":    tools,
            "stream":   False,
            "options":  {
                **self._options,
                # Con tools necesitamos un poco más de contexto
                "num_ctx": 3072,
            },
        }

        r = requests.post(self.base_url, json=payload, timeout=300)
        r.raise_for_status()

        message = r.json().get("message", {})
        return {
            "content":    message.get("content", ""),
            "tool_calls": message.get("tool_calls"),  # None si no usó tools
        }

    # ── Stream ────────────────────────────────────────────────────────────────
    def chat_stream(self, messages: list):
        """Yields string deltas desde Ollama (sin tools — para respuesta final)."""
        with requests.post(
            self.base_url,
            json={
                "model":    self.model,
                "messages": messages,
                "stream":   True,
                "options":  self._options,
            },
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
        """Pre-carga el modelo en memoria para eliminar el delay de la primera respuesta."""
        try:
            requests.post(
                self.base_url,
                json={
                    "model":    self.model,
                    "messages": [{"role": "user", "content": "hi"}],
                    "stream":   False,
                    "options":  {"num_predict": 1},
                },
                timeout=60,
            )
            print(f"[Ollama] Modelo {self.model} precargado ✓")
        except Exception as e:
            print(f"[Ollama] Warmup falló: {e}")