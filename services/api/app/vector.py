import os
import uuid

COLLECTION = os.getenv("QDRANT_COLLECTION", "brain_chunks")
QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
DIM = 768

_client = None

def client():
    global _client
    if _client is None:
        from qdrant_client import QdrantClient
        _client = QdrantClient(url=QDRANT_URL, timeout=10)
    return _client

def ensure_collection():
    from qdrant_client.models import Distance, VectorParams
    c = client()
    try:
        c.get_collection(COLLECTION)
        return
    except Exception:
        pass
    c.create_collection(
        collection_name=COLLECTION,
        vectors_config=VectorParams(size=DIM, distance=Distance.COSINE),
    )

def upsert_chunks(items: list[dict]) -> int:
    """items: [{vector, document_id, filename, doc_type, chunk_index, text}]"""
    from qdrant_client.models import PointStruct
    if not items:
        return 0
    ensure_collection()
    c = client()
    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=it["vector"],
            payload={
                "document_id": it["document_id"],
                "filename": it.get("filename", ""),
                "doc_type": it.get("doc_type", "umum"),
                "chunk_index": it.get("chunk_index", 0),
                "text": it.get("text", "")[:4000],
            },
        )
        for it in items
    ]
    c.upsert(collection_name=COLLECTION, points=points)
    return len(points)

def search(vector: list[float], limit: int = 5, doc_type: str | None = None) -> list[dict]:
    ensure_collection()
    c = client()
    flt = None
    if doc_type:
        from qdrant_client.models import FieldCondition, Filter, MatchValue
        flt = Filter(must=[FieldCondition(key="doc_type", match=MatchValue(value=doc_type))])
    res = c.search(collection_name=COLLECTION, query_vector=vector, query_filter=flt, limit=limit)
    out = []
    for h in res:
        p = h.payload or {}
        out.append({
            "score": float(h.score),
            "document_id": p.get("document_id"),
            "filename": p.get("filename", ""),
            "doc_type": p.get("doc_type", ""),
            "chunk_index": p.get("chunk_index", 0),
            "text": p.get("text", ""),
        })
    return out

def qdrant_status() -> dict:
    try:
        c = client()
        info = c.get_collection(COLLECTION)
        return {"ok": True, "points": getattr(info, "points_count", 0)}
    except Exception as e:
        return {"ok": False, "error": str(e)[:200]}
