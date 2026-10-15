"""Cache status service eksternal agar /health cepat.
Hit pertama tetap lambat (timeout asli), hit berikutnya disajikan dari cache TTL."""
import time

_TTL = 30.0
_cache: dict[str, tuple[float, dict]] = {}

def cached(key: str, fn, ttl: float = _TTL) -> dict:
    now = time.time()
    hit = _cache.get(key)
    if hit and now - hit[0] < ttl:
        return {**hit[1], "cached": True}
    try:
        val = fn()
    except Exception as e:
        val = {"ok": False, "error": str(e)[:200]}
    if not isinstance(val, dict):
        val = {"ok": False, "error": "bad status fn"}
    _cache[key] = (now, val)
    return val
