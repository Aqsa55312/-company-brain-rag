import io
import re

CHUNK_CONF = {
    "sop": (800, 120),
    "cs": (400, 80),
    "keuangan": (600, 100),
    "umum": (600, 100),
}

def clean(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def extract_text(filename: str, raw: bytes, mime: str = "") -> str:
    name = (filename or "").lower()
    if name.endswith(".pdf"):
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(raw))
            parts = [(p.extract_text() or "") for p in reader.pages]
            return clean("\n".join(parts))
        except Exception:
            pass
    if name.endswith(".docx"):
        try:
            import docx
            doc = docx.Document(io.BytesIO(raw))
            return clean("\n".join([p.text for p in doc.paragraphs]))
        except Exception:
            pass
    # txt, csv, md, log, fallback
    try:
        return clean(raw.decode("utf-8", errors="ignore"))
    except Exception:
        return ""

def chunk_text(text: str, doc_type: str = "umum") -> list[str]:
    size, overlap = CHUNK_CONF.get(doc_type, CHUNK_CONF["umum"])
    text = clean(text)
    if not text:
        return []
    if len(text) <= size:
        return [text]
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + size
        # usahakan potong di spasi terdekat agar tidak putus kata
        if end < len(text):
            cut = text.rfind(" ", start, end)
            if cut > start + size // 2:
                end = cut
        chunks.append(text[start:end].strip())
        if end >= len(text):
            break
        start = max(end - overlap, start + 1)
    return [c for c in chunks if c]
