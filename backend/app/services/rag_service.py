# app/services/rag_service.py
from chromadb.config import Settings
import chromadb
from sentence_transformers import SentenceTransformer

from app.core.config import VECTOR_DIR, EMBED_MODEL_NAME, COLLECTION_NAME

class RagService:
    def __init__(self):
        VECTOR_DIR.mkdir(parents=True, exist_ok=True)

        self.chroma = chromadb.PersistentClient(
            path=str(VECTOR_DIR),
            settings=Settings(anonymized_telemetry=False)
        )
        self.collection = self.chroma.get_or_create_collection(name=COLLECTION_NAME)
        self.embedder = SentenceTransformer(EMBED_MODEL_NAME)

    def chunk_text(self, text: str, chunk_size: int = 900, overlap: int = 150):
        text = " ".join(text.split())
        chunks = []
        i = 0
        while i < len(text):
            chunks.append(text[i:i+chunk_size])
            i += chunk_size - overlap
        return chunks

    def embed_texts(self, texts):
        return self.embedder.encode(texts, normalize_embeddings=True).tolist()

    # ✅ Nuevo: upsert por doc_id (NO por source)
    def upsert_text(self, doc_id: str, text: str, metadata: dict | None = None):
        metadata = metadata or {}
        chunks = self.chunk_text(text)
        embeddings = self.embed_texts(chunks)

        ids = [f"{doc_id}::chunk::{i}" for i in range(len(chunks))]
        metadatas = [{**metadata, "doc_id": doc_id, "chunk": i} for i in range(len(chunks))]

        # borrar solo lo de ese doc_id
        try:
            self.collection.delete(where={"doc_id": doc_id})
        except Exception:
            pass

        self.collection.add(
            ids=ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas
        )
        return len(chunks)

    # ✅ Nuevo: borrar por doc_id
    def delete_doc(self, doc_id: str):
        self.collection.delete(where={"doc_id": doc_id})

    # 🔁 Compatibilidad: tu código actual sigue funcionando
    def upsert_document(self, source: str, text: str):
        # antes “source” era el identificador; ahora lo tratamos como doc_id
        return self.upsert_text(
            doc_id=f"file::{source}",
            text=text,
            metadata={"source": source, "namespace": "files"}
        )

    def retrieve_context(self, query: str, k: int = 4) -> str:
        q_emb = self.embed_texts([query])[0]
        results = self.collection.query(query_embeddings=[q_emb], n_results=k)
        docs = results.get("documents", [[]])[0]
        if not docs:
            return ""
        return "\n\n---\n\n".join(docs)

    # ✅ Útil para /search: regresa hits con metadata
    def retrieve_hits(self, query: str, k: int = 6):
        q_emb = self.embed_texts([query])[0]
        results = self.collection.query(query_embeddings=[q_emb], n_results=k)
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        ids = results.get("ids", [[]])[0]
        dists = results.get("distances", [[]])[0]
        hits = []
        for i in range(len(ids)):
            hits.append({
                "id": ids[i],
                "distance": dists[i] if i < len(dists) else None,
                "metadata": metas[i] if i < len(metas) else None,
                "text": docs[i] if i < len(docs) else None,
            })
        return hits