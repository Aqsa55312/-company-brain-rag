from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import json
import time
import uuid

from .db import get_conn, init_db
from .auth import verify_password, create_token, decode_token
from .storage import client, ensure_bucket, get_bytes, BUCKET
from .chunk import extract_text, chunk_text
from .embed import embed_texts, ollama_status
from .vector import ensure_collection, upsert_chunks, search as vec_search, qdrant_status
from .rag import retrieve, keyword_fallback
from .llm import build_prompt, chat_ollama, stub_answer, llm_status
from .security import check as rate_check, validate_upload, secret_warnings, allowed_origins
from .metrics import inc, observe, render_prometheus

app = FastAPI(title="Company Brain API (P4)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
bearer = HTTPBearer(auto_error=False)

class LoginIn(BaseModel):
    username: str
    password: str

class IndexIn(BaseModel):
    document_id: int

class ChatIn(BaseModel):
    q: str
    limit: int = 5
    doc_type: str | None = None

class FeedbackIn(BaseModel):
    chat_id: int | None = None
    rating: int
    comment: str = ""

def current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if not creds:
        raise HTTPException(401, "Butuh token login")
    try:
        data = decode_token(creds.credentials)
    except Exception:
        raise HTTPException(401, "Token tidak valid / kedaluwarsa")
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, username, role FROM users WHERE username=%s", (data["sub"],))
    user = cur.fetchone()
    cur.close(); conn.close()
    if not user:
        raise HTTPException(401, "User tidak ditemukan")
    return user

def audit(user_id: int, action: str, detail: str = ""):
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("INSERT INTO audit_logs(user_id, action, detail) VALUES(%s,%s,%s)", (user_id, action, detail))
        conn.commit()
        cur.close(); conn.close()
    except Exception:
        pass

def index_document(document_id: int) -> dict:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM documents WHERE id=%s", (document_id,))
    doc = cur.fetchone()
    if not doc:
        cur.close(); conn.close()
        raise HTTPException(404, "Dokumen tidak ditemukan")
    raw = get_bytes(doc["object_key"])
    text = extract_text(doc["filename"], raw, doc.get("mime", ""))
    chunks = chunk_text(text, doc.get("doc_type", "umum"))
    if not chunks:
        cur.close(); conn.close()
        return {"ok": False, "reason": "teks kosong / tidak bisa diekstrak", "document_id": document_id}
    vectors, backend = embed_texts(chunks)
    for i, ch in enumerate(chunks):
        cur.execute(
            """INSERT INTO document_chunks(document_id, chunk_index, text)
               VALUES(%s,%s,%s) ON CONFLICT(document_id, chunk_index) DO UPDATE SET text=EXCLUDED.text""",
            (document_id, i, ch[:8000]),
        )
    conn.commit()
    try:
        n = upsert_chunks([
            {"vector": v, "document_id": document_id, "filename": doc["filename"],
             "doc_type": doc.get("doc_type", "umum"), "chunk_index": i, "text": ch}
            for i, (ch, v) in enumerate(zip(chunks, vectors))
        ])
    except Exception as e:
        cur.close(); conn.close()
        return {"ok": True, "chunks": len(chunks), "qdrant": f"skip: {str(e)[:200]}",
                "backend": backend, "document_id": document_id}
    cur.close(); conn.close()
    return {"ok": True, "chunks": len(chunks), "qdrant_points": n, "backend": backend, "document_id": document_id}

def do_search(conn, q: str, limit: int, doc_type: str | None):
    hits, backend, mode, note = retrieve(q, limit=limit, doc_type=doc_type)
    if hits:
        return {"ok": True, "backend": backend, "mode": mode, "hits": hits}
    rows = keyword_fallback(conn, q, limit=limit, doc_type=doc_type)
    return {"ok": True, "backend": backend, "mode": "keyword-fallback",
            "note": note, "hits": rows}

@app.on_event("startup")
def startup():
    init_db()
    for w in secret_warnings():
        print("SECURITY WARNING:", w)
    try:
        ensure_bucket()
    except Exception as e:
        print("MinIO belum siap:", e)
    try:
        ensure_collection()
    except Exception as e:
        print("Qdrant belum siap:", e)

@app.get("/health")
def health():
    from .status_cache import cached
    return {"ok": True, "stage": "P4",
            "qdrant": cached("qdrant", qdrant_status),
            "ollama": cached("ollama", ollama_status),
            "llm": cached("llm", llm_status),
            "security_warnings": secret_warnings()}

@app.get("/health/live")
def live():
    return {"ok": True}

@app.get("/metrics")
def metrics():
    return Response(content=render_prometheus(), media_type="text/plain")

@app.post("/auth/login")
def login(body: LoginIn, request: Request):
    ip = request.client.host if request.client else "unknown"
    ok, retry = rate_check(ip, "login")
    if not ok:
        raise HTTPException(429, f"Terlalu banyak login, coba lagi dalam {retry} detik")
    t0 = time.time()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username=%s", (body.username,))
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(401, "Username / password salah")
    token = create_token(row["username"], row["role"])
    audit(row["id"], "login", "ok")
    inc("login"); observe("login", time.time() - t0)
    return {"token": token, "username": row["username"], "role": row["role"]}

@app.get("/auth/me")
def me(user=Depends(current_user)):
    return user

@app.post("/ingest/upload")
def upload(file: UploadFile = File(...), doc_type: str = Form("umum"), user=Depends(current_user)):
    ok, retry = rate_check(str(user["id"]), "upload")
    if not ok:
        raise HTTPException(429, f"Terlalu banyak upload, coba lagi dalam {retry} detik")
    t0 = time.time()
    data = file.file.read()
    valid, msg = validate_upload(file.filename or "", len(data))
    if not valid:
        raise HTTPException(400, msg)
    if doc_type not in ("umum", "sop", "cs", "keuangan"):
        raise HTTPException(400, "doc_type harus umum/sop/cs/keuangan")
    key = f"{doc_type}/{uuid.uuid4()}_{file.filename}"
    c = client()
    ensure_bucket()
    c.put_object(Bucket=BUCKET, Key=key, Body=data, ContentType=file.content_type or "application/octet-stream")
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO documents(filename, object_key, size_bytes, mime, doc_type, uploaded_by) VALUES(%s,%s,%s,%s,%s,%s) RETURNING id",
        (file.filename, key, len(data), file.content_type or "", doc_type, user["id"]),
    )
    doc_id = cur.fetchone()["id"]
    conn.commit()
    cur.close(); conn.close()
    audit(user["id"], "upload", f"{file.filename} -> {key}")
    inc("upload"); observe("upload", time.time() - t0)
    return {"ok": True, "id": doc_id, "object_key": key, "bucket": BUCKET,
            "next": f"POST /ingest/index dengan document_id={doc_id} untuk masuk ke search"}

@app.post("/ingest/index")
def index_one(body: IndexIn, user=Depends(current_user)):
    res = index_document(body.document_id)
    audit(user["id"], "index", f"doc={body.document_id} chunks={res.get('chunks')}")
    return res

@app.post("/ingest/index-all")
def index_all(user=Depends(current_user)):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT d.* FROM documents d LEFT JOIN document_chunks c ON c.document_id=d.id
        WHERE c.id IS NULL ORDER BY d.id DESC LIMIT 20
    """)
    docs = cur.fetchall()
    cur.close(); conn.close()
    results = []
    for d in docs:
        try:
            results.append(index_document(d["id"]))
        except Exception as e:
            results.append({"ok": False, "document_id": d["id"], "reason": str(e)[:200]})
    audit(user["id"], "index-all", f"n={len(results)}")
    return {"ok": True, "indexed": results}

@app.get("/search")
def search(q: str, limit: int = 5, doc_type: str | None = None, user=Depends(current_user)):
    ok, retry = rate_check(str(user["id"]), "search")
    if not ok:
        raise HTTPException(429, f"Rate limit search, coba lagi dalam {retry} detik")
    t0 = time.time()
    q = (q or "").strip()
    if not q:
        raise HTTPException(400, "q wajib diisi")
    limit = max(1, min(limit, 20))
    conn = get_conn()
    try:
        res = do_search(conn, q, limit, doc_type)
    finally:
        conn.close()
    audit(user["id"], "search", f"q={q[:80]} mode={res.get('mode')} hits={len(res.get('hits', []))}")
    inc("search"); observe("search", time.time() - t0)
    return res

@app.post("/chat")
def chat(body: ChatIn, user=Depends(current_user)):
    ok, retry = rate_check(str(user["id"]), "chat")
    if not ok:
        raise HTTPException(429, f"Rate limit chat, coba lagi dalam {retry} detik")
    t0 = time.time()
    q = (body.q or "").strip()
    if not q:
        raise HTTPException(400, "q wajib diisi")
    if len(q) > 2000:
        raise HTTPException(400, "Pertanyaan maksimal 2000 karakter")
    limit = max(1, min(body.limit, 10))
    doc_type = body.doc_type or None
    conn = get_conn()
    try:
        res = do_search(conn, q, limit, doc_type)
        hits = res.get("hits", [])
        mode = res.get("mode", "")
        backend = res.get("backend", "")
        prompt = build_prompt(q, hits)
        answer, llm_backend = chat_ollama(prompt)
        if not answer:
            answer = stub_answer(q, hits)
            llm_backend = f"stub ({llm_backend})"
        citations = [
            {"n": i + 1, "document_id": h.get("document_id"), "filename": h.get("filename", ""),
             "doc_type": h.get("doc_type", ""), "chunk_index": h.get("chunk_index", 0),
             "score": h.get("score", 0.0), "snippet": (h.get("text", "") or "")[:500]}
            for i, h in enumerate(hits)
        ]
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO chat_logs(user_id, question, answer, backend, mode, hits) VALUES(%s,%s,%s,%s,%s,%s) RETURNING id",
            (user["id"], q, answer[:8000], f"{backend}+{llm_backend}", mode, json.dumps(citations, ensure_ascii=False)),
        )
        chat_id = cur.fetchone()["id"]
        conn.commit()
        cur.close()
    finally:
        conn.close()
    audit(user["id"], "chat", f"q={q[:80]} hits={len(hits)}")
    inc("chat"); observe("chat", time.time() - t0)
    return {"ok": True, "chat_id": chat_id, "answer": answer,
            "citations": citations, "retrieval": {"backend": backend, "mode": mode},
            "llm": llm_backend}

@app.post("/feedback")
def feedback(body: FeedbackIn, user=Depends(current_user)):
    if body.rating not in (-1, 1):
        raise HTTPException(400, "rating harus -1 atau 1")
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO feedback(chat_id, user_id, rating, comment) VALUES(%s,%s,%s,%s) RETURNING id",
        (body.chat_id, user["id"], body.rating, body.comment[:2000]),
    )
    fid = cur.fetchone()["id"]
    conn.commit()
    cur.close(); conn.close()
    audit(user["id"], "feedback", f"chat={body.chat_id} rating={body.rating}")
    return {"ok": True, "id": fid}

@app.get("/stats")
def stats(user=Depends(current_user)):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) AS n FROM documents")
    n_docs = cur.fetchone()["n"]
    cur.execute("SELECT COUNT(*) AS n FROM document_chunks")
    n_chunks = cur.fetchone()["n"]
    cur.execute("SELECT COUNT(*) AS n FROM chat_logs")
    n_chats = cur.fetchone()["n"]
    cur.execute("SELECT mode, COUNT(*) AS n FROM chat_logs GROUP BY mode")
    by_mode = {r["mode"]: r["n"] for r in cur.fetchall()}
    cur.execute("SELECT rating, COUNT(*) AS n FROM feedback GROUP BY rating")
    fb = {str(r["rating"]): r["n"] for r in cur.fetchall()}
    cur.execute("""
        SELECT question, COUNT(*) AS n FROM chat_logs
        GROUP BY question ORDER BY n DESC LIMIT 5
    """)
    top_q = [{"q": r["question"][:120], "n": r["n"]} for r in cur.fetchall()]
    cur.close(); conn.close()
    return {"ok": True, "documents": n_docs, "chunks": n_chunks, "chats": n_chats,
            "by_mode": by_mode, "feedback": fb, "top_questions": top_q}

@app.get("/documents")
def list_docs(user=Depends(current_user)):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT d.*, u.username, COUNT(c.id) AS chunks FROM documents d
        LEFT JOIN users u ON u.id=d.uploaded_by
        LEFT JOIN document_chunks c ON c.document_id=d.id
        GROUP BY d.id, u.username ORDER BY d.id DESC LIMIT 50
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows

@app.get("/audit/logs")
def logs(user=Depends(current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Khusus admin")
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT a.*, u.username FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 50")
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows
