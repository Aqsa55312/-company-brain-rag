import os
import httpx

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434").rstrip("/")
CHAT_MODEL = os.getenv("CHAT_MODEL", "llama3.1:8b")

SYSTEM = (
    "Kamu asisten internal perusahaan. Jawab HANYA dari KONTEKS yang diberi. "
    "Jika jawaban tidak ada di konteks, katakan: 'Tidak ditemukan di dokumen internal.' "
    "Selalu sebut nomor sitasi [1], [2] sesuai urutan konteks yang kamu pakai. "
    "Bahasa: Indonesia, ringkas, poin-poin jika cocok."
)

def build_prompt(question: str, contexts: list[dict]) -> str:
    ctx_lines = []
    for i, c in enumerate(contexts, 1):
        src = f"{c.get('filename','')}#{c.get('chunk_index',0)}"
        txt = (c.get("text", "") or "")[:1500]
        ctx_lines.append(f"[{i}] ({src}): {txt}")
    ctx = "\n".join(ctx_lines) if ctx_lines else "(konteks kosong)"
    return f"{SYSTEM}\n\nKONTEKS:\n{ctx}\n\nPERTANYAAN: {question}\nJAWABAN:"

def chat_ollama(prompt: str) -> tuple[str, str]:
    """Return (answer, backend). Fallback stub jika Ollama offline."""
    try:
        with httpx.Client(timeout=120.0) as c:
            r = c.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": CHAT_MODEL, "prompt": prompt, "stream": False,
                      "options": {"temperature": 0.2, "num_predict": 512}},
            )
            r.raise_for_status()
            return r.json().get("response", "").strip(), "ollama"
    except Exception as e:
        return "", f"ollama-unavailable: {str(e)[:150]}"

def stub_answer(question: str, contexts: list[dict]) -> str:
    if not contexts:
        return "Tidak ditemukan di dokumen internal."
    lines = [f"Ringkasan dari {len(contexts)} potongan dokumen internal untuk: {question}"]
    for i, c in enumerate(contexts[:3], 1):
        snippet = (c.get("text", "") or "")[:300].replace("\n", " ")
        lines.append(f"[{i}] {c.get('filename','')}#{c.get('chunk_index',0)}: {snippet}...")
    lines.append("Catatan: Ollama offline, ini jawaban stub — tarik model llama3.1:8b untuk jawaban penuh.")
    return "\n".join(lines)

def llm_status() -> dict:
    try:
        with httpx.Client(timeout=5.0) as c:
            r = c.get(f"{OLLAMA_URL}/api/tags")
            if r.status_code != 200:
                return {"ok": False, "chat_model": CHAT_MODEL}
            models = [m.get("name", "") for m in r.json().get("models", [])]
            return {"ok": True, "chat_model": CHAT_MODEL, "models": models,
                    "has_chat": any(CHAT_MODEL in m for m in models)}
    except Exception as e:
        return {"ok": False, "chat_model": CHAT_MODEL, "error": str(e)[:200]}
