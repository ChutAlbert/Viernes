import requests
import json
from app.core.config import OLLAMA_CHAT_URL, MODEL

class OllamaService:
    def __init__(self, base_url: str = OLLAMA_CHAT_URL, model: str = MODEL):
        self.base_url = base_url
        self.model = model

    def chat(self, messages):
        r = requests.post(
            self.base_url,
            json={"model": self.model, "messages": messages, "stream": False},
            timeout=300,
        )
        r.raise_for_status()
        data = r.json()
        return data["message"]["content"]

    def chat_stream(self, messages):
        """
        Yields strings (deltas) as they arrive from Ollama.
        """
        with requests.post(
            self.base_url,
            json={"model": self.model, "messages": messages, "stream": True},
            stream=True,
            timeout=300,
        ) as r:
            r.raise_for_status()

            for line in r.iter_lines(decode_unicode=True):
                if not line:
                    continue

                # Ollama devuelve JSON por línea
                obj = json.loads(line)

                # En Ollama: obj["message"]["content"] trae el delta
                if "message" in obj and obj["message"] and "content" in obj["message"]:
                    delta = obj["message"]["content"]
                    if delta:
                        yield delta

                # done => terminó
                if obj.get("done"):
                    break
