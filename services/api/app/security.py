import os
import time
from collections import defaultdict, deque

RATE_LIMIT_ENABLE = os.getenv("RATE_LIMIT_ENABLE", "true").lower() == "true"
# format: "5/minute" sederhana -> kami pakai batas tetap per-window 60 detik
LIMITS = {
    "login": int(os.getenv("RATE_LOGIN_PER_MIN", "10")),
    "chat": int(os.getenv("RATE_CHAT_PER_MIN", "20")),
    "search": int(os.getenv("RATE_SEARCH_PER_MIN", "30")),
    "upload": int(os.getenv("RATE_UPLOAD_PER_MIN", "20")),
}
_hits: dict[str, deque] = defaultdict(deque)

def check(key: str, route: str) -> tuple[bool, int]:
    """Return (allowed, retry_after_sec). In-memory sliding window 60 detik."""
    if not RATE_LIMIT_ENABLE:
        return True, 0
    limit = LIMITS.get(route, 30)
    now = time.time()
    dq = _hits[f"{route}:{key}"]
    while dq and now - dq[0] > 60:
        dq.popleft()
    if len(dq) >= limit:
        retry = int(60 - (now - dq[0])) + 1
        return False, max(retry, 1)
    dq.append(now)
    return True, 0

ALLOWED_EXT = {".pdf", ".docx", ".txt", ".md", ".csv", ".log"}
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "20"))

def validate_upload(filename: str, size: int) -> tuple[bool, str]:
    ext = (os.path.splitext(filename or "")[1] or "").lower()
    if ext not in ALLOWED_EXT:
        return False, f"Ekstensi {ext} ditolak. Boleh: {sorted(ALLOWED_EXT)}"
    if size > MAX_UPLOAD_MB * 1024 * 1024:
        return False, f"File {size/1048576:.1f}MB melebihi batas {MAX_UPLOAD_MB}MB"
    if size == 0:
        return False, "File kosong"
    return True, "ok"

def secret_warnings() -> list[str]:
    warns: list[str] = []
    jwt = os.getenv("JWT_SECRET", "")
    if not jwt or len(jwt) < 32 or "ganti-ini" in jwt:
        warns.append("JWT_SECRET masih default/pendek — ganti minimal 32 karakter acak di prod")
    if os.getenv("SEED_ADMIN_PASSWORD", "") in ("admin123", ""):
        warns.append("SEED_ADMIN_PASSWORD masih default — ganti setelah serah-terima")
    if os.getenv("POSTGRES_PASSWORD", "") in ("brain123", ""):
        warns.append("POSTGRES_PASSWORD masih default — ganti di prod")
    if os.getenv("MINIO_ROOT_PASSWORD", "") in ("minioadmin", ""):
        warns.append("MINIO_ROOT_PASSWORD masih default — ganti di prod")
    return warns

def allowed_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    return [o.strip() for o in raw.split(",") if o.strip()]
