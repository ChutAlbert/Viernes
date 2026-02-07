import requests
from app.core.config import OLLAMA_CHAT_URL, MODEL

class OllamaService:
    def chat(self, messages, timeout: int = 180):
        r = requests.post(
            OLLAMA_CHAT_URL,
            json={"model": MODEL, "messages": messages, "stream": False},
            timeout=timeout
        )
        r.raise_for_status()
        data = r.json()
        return data["message"]["content"].strip()
