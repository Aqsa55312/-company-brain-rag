import hashlib
import os
import httpx

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434").rstrip("/")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
DIM = 768

def _hash_embed(text: str, dim: int = DIM) -> list[float]:
    """Fallback deterministik saat Ollama belum ada model / offline.
    Bukan embedding semantik, tapi cukup untuk verifikasi P2 offline."""
    vec = [0.0] * dim
    for token in text.lower().split():
        h = int(hashlib.md5(token.encode()).hexdigest(), 16)
        vec[h % dim] += 1.0
    norm = sum(x * x for x in vec) ** 0.5
    if norm > 0:
        vec = [x / norm for x in vec]
    return vec

def embed_texts(texts: list[str]) -> tuple[list[list[float]], str]:
    """Return (vectors, backend) backend = 'ollama' | 'hash-fallback'."""
    if not texts:
        return [], "hash-fallback"
    try:
        vectors: list[list[float]] = []
        with httpx.Client(timeout=30.0) as c:
            for t in texts:
                r = c.post(f"{OLLAMA_URL}/api/embeddings", json={"model": EMBED_MODEL, "prompt": t})
                r.raise_for_status()
                v = r.json().get("embedding", [])
                if len(v) != DIM:
                    # potong / pad agar konsisten 768
                    v = (v[:DIM] + [0.0] * DIM)[:DIM]
                vectors.append(v)
        return vectors, "ollama"
    except Exception:
        return [_hash_embed(t) for t in texts], "hash-fallback"

def ollama_status() -> dict:
    try:
        with httpx.Client(timeout=5.0) as c:
            r = c.get(f"{OLLAMA_URL}/api/tags")
            if r.status_code == 200:
                models = [m.get("name", "") for m in r.json().get("models", [])]
                return {"ok": True, "models": models}
            return {"ok": False, "models": []}
    except Exception as e:
        return {"ok": False, "error": str(e)[:200], "models": []}
