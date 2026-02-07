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

    def upsert_document(self, source: str, text: str):
        chunks = self.chunk_text(text)
        embeddings = self.embed_texts(chunks)

        ids = [f"{source}::chunk::{i}" for i in range(len(chunks))]
        metadatas = [{"source": source, "chunk": i} for i in range(len(chunks))]

        # upsert simple: borrar por source y reinsertar
        try:
            self.collection.delete(where={"source": source})
        except Exception:
            pass

        self.collection.add(
            ids=ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas
        )

        return len(chunks)

    def retrieve_context(self, query: str, k: int = 4) -> str:
        q_emb = self.embed_texts([query])[0]
        results = self.collection.query(query_embeddings=[q_emb], n_results=k)
        docs = results.get("documents", [[]])[0]
        if not docs:
            return ""
        return "\n\n---\n\n".join(docs)
