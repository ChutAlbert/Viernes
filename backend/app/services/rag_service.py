from chromadb.config import Settings
import chromadb

from app.core.config import VECTOR_DIR, COLLECTION_NAME
from app.services.ollama_service import OllamaService


class RagService:
    def __init__(self):
        VECTOR_DIR.mkdir(parents=True, exist_ok=True)

        self.chroma = chromadb.PersistentClient(
            path=str(VECTOR_DIR),
            settings=Settings(anonymized_telemetry=False),
        )
        self.collection = self.chroma.get_or_create_collection(name=COLLECTION_NAME)

    # ── Chunking ──────────────────────────────────────────────────────────────

    def chunk_text(self, text: str, chunk_size: int = 900, overlap: int = 150) -> list[str]:
        text = " ".join(text.split())
        chunks, i = [], 0
        while i < len(text):
            chunks.append(text[i:i + chunk_size])
            i += chunk_size - overlap
        return chunks

    # ── Embeddings via Ollama ─────────────────────────────────────────────────

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return OllamaService.embed(texts)

    # ── Upsert por doc_id ─────────────────────────────────────────────────────

    def upsert_text(self, doc_id: str, text: str, metadata: dict | None = None) -> int:
        metadata = metadata or {}
        chunks     = self.chunk_text(text)
        embeddings = self.embed_texts(chunks)

        ids       = [f"{doc_id}::chunk::{i}" for i in range(len(chunks))]
        metadatas = [{**metadata, "doc_id": doc_id, "chunk": i} for i in range(len(chunks))]

        try:
            self.collection.delete(where={"doc_id": doc_id})
        except Exception:
            pass

        self.collection.add(
            ids=ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        return len(chunks)

    def delete_doc(self, doc_id: str) -> None:
        self.collection.delete(where={"doc_id": doc_id})

    # ── Compatibilidad legacy ─────────────────────────────────────────────────

    def upsert_document(self, source: str, text: str) -> int:
        return self.upsert_text(
            doc_id=f"file::{source}",
            text=text,
            metadata={"source": source, "namespace": "files"},
        )

    # ── Retrieval ─────────────────────────────────────────────────────────────

    def retrieve_context(self, query: str, k: int = 4) -> str:
        q_emb   = self.embed_texts([query])[0]
        results = self.collection.query(query_embeddings=[q_emb], n_results=k)
        docs    = results.get("documents", [[]])[0]
        return "\n\n---\n\n".join(docs) if docs else ""

    def retrieve_hits(self, query: str, k: int = 6) -> list[dict]:
        q_emb   = self.embed_texts([query])[0]
        results = self.collection.query(query_embeddings=[q_emb], n_results=k)
        docs    = results.get("documents",  [[]])[0]
        metas   = results.get("metadatas",  [[]])[0]
        ids     = results.get("ids",        [[]])[0]
        dists   = results.get("distances",  [[]])[0]
        return [
            {"id": ids[i], "distance": dists[i] if i < len(dists) else None,
             "metadata": metas[i] if i < len(metas) else None,
             "text": docs[i] if i < len(docs) else None}
            for i in range(len(ids))
        ]
