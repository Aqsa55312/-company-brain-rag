"""Helper RAG dipakai API + eval offline agar konsisten."""
from .embed import embed_texts
from .vector import search as vec_search

def retrieve(query: str, limit: int = 5, doc_type: str | None = None):
    """Return (hits, backend, mode, note). Coba vector, fallback keyword via caller."""
    q = (query or "").strip()
    vectors, backend = embed_texts([q])
    try:
        hits = vec_search(vectors[0], limit=limit, doc_type=doc_type or None)
        if hits:
            return hits, backend, "vector", ""
        return [], backend, "vector-empty", "qdrant kosong"
    except Exception as e:
        return [], backend, "vector-error", str(e)[:200]

def keyword_fallback(conn, query: str, limit: int = 5, doc_type: str | None = None):
    cur = conn.cursor()
    like = f"%{query[:100]}%"
    if doc_type:
        cur.execute("""
            SELECT c.*, d.filename, d.doc_type FROM document_chunks c
            JOIN documents d ON d.id=c.document_id
            WHERE d.doc_type=%s AND c.text ILIKE %s ORDER BY c.id DESC LIMIT %s
        """, (doc_type, like, limit))
    else:
        cur.execute("""
            SELECT c.*, d.filename, d.doc_type FROM document_chunks c
            JOIN documents d ON d.id=c.document_id
            WHERE c.text ILIKE %s ORDER BY c.id DESC LIMIT %s
        """, (like, limit))
    rows = cur.fetchall()
    cur.close()
    return [{"score": 0.0, "document_id": r["document_id"], "filename": r["filename"],
             "doc_type": r["doc_type"], "chunk_index": r["chunk_index"],
             "text": r["text"][:800]} for r in rows]
