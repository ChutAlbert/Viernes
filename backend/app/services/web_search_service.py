"""
Servicio de búsqueda web con DuckDuckGo + persistencia en ChromaDB.
pip install duckduckgo-search
"""
import re
from duckduckgo_search import DDGS
from typing import List, Dict
from datetime import datetime


class WebSearchService:
    def __init__(self, max_results: int = 5):
        self.max_results = max_results

    def search(self, query: str, max_results: int | None = None) -> List[Dict]:
        """
        Busca en DuckDuckGo.
        Retorna: [{ title, url, snippet }]
        """
        n = max_results or self.max_results
        results = []
        try:
            with DDGS() as ddgs:
                for r in ddgs.text(query, max_results=n):
                    results.append({
                        "title":   r.get("title", ""),
                        "url":     r.get("href", ""),
                        "snippet": r.get("body", ""),
                    })
        except Exception as e:
            print(f"[WebSearch] Error: {e}")
        return results

    def search_and_persist(self, query: str, rag_service, max_results: int | None = None) -> List[Dict]:
        """
        Busca en DuckDuckGo Y persiste los resultados en ChromaDB (namespace='web').
        Así el conocimiento queda disponible para futuras conversaciones via RAG.
        """
        results = self.search(query, max_results)
        if not results:
            return results

        # Construir texto combinado
        text_parts = []
        for r in results:
            text_parts.append(
                f"Título: {r['title']}\n"
                f"URL: {r['url']}\n"
                f"Contenido: {r['snippet']}"
            )
        combined_text = "\n\n---\n\n".join(text_parts)

        # ID único: query slug + fecha (evita duplicados del mismo día)
        date_str = datetime.now().strftime("%Y%m%d")
        doc_id = f"web::{_slugify(query)[:60]}::{date_str}"

        try:
            rag_service.upsert_text(
                doc_id=doc_id,
                text=combined_text,
                metadata={
                    "namespace": "web",
                    "query":     query,
                    "date":      date_str,
                    "source":    "duckduckgo",
                }
            )
            print(f"[WebSearch] Persistido en vectordb → {doc_id}")
        except Exception as e:
            print(f"[WebSearch] Error al persistir: {e}")

        return results

    def format_for_context(self, results: List[Dict]) -> str:
        """Formatea resultados como bloque de contexto para el LLM."""
        if not results:
            return ""
        lines = ["RESULTADOS WEB RECIENTES:\n"]
        for i, r in enumerate(results, 1):
            lines.append(f"[{i}] {r['title']}")
            lines.append(f"URL: {r['url']}")
            lines.append(f"{r['snippet']}\n")
        return "\n".join(lines)


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text