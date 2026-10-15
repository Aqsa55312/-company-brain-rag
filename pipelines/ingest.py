"""Pipeline P2: bronze (MinIO) -> chunk -> embed -> Qdrant + Postgres chunks.
Bisa jalan 2 cara:
1) Via API (disarankan, termurah, tanpa dependensi tambahan):
   POST /ingest/index-all dengan token admin
2) Langsung python (butuh ENV yang sama dengan API):
   python pipelines/ingest.py --via-api --api http://localhost:8000 --token <JWT>
"""
import argparse
import json
import os
import sys
import urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "services", "api"))

def via_api(api: str, token: str):
    req = urllib.request.Request(
        f"{api.rstrip('/')}/ingest/index-all",
        method="POST",
        headers={"Authorization": f"Bearer {token}"},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        print(r.read().decode()[:4000])

def direct_local(limit: int = 20):
    # Direct tanpa HTTP: pakai modul API langsung (butuh Postgres+MinIO+Qdrant up)
    from app.db import get_conn
    from app.main import index_document
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT d.id FROM documents d LEFT JOIN document_chunks c ON c.document_id=d.id
        WHERE c.id IS NULL ORDER BY d.id DESC LIMIT %s
    """, (limit,))
    ids = [r["id"] for r in cur.fetchall()]
    cur.close(); conn.close()
    print(f"unindexed: {ids}")
    for i in ids:
        print(json.dumps(index_document(i), ensure_ascii=False)[:1000])

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--via-api", action="store_true")
    ap.add_argument("--api", default=os.getenv("API_URL", "http://localhost:8000"))
    ap.add_argument("--token", default=os.getenv("BRAIN_TOKEN", ""))
    ap.add_argument("--limit", type=int, default=20)
    a = ap.parse_args()
    if a.via_api:
        assert a.token, "butuh --token JWT admin"
        via_api(a.api, a.token)
    else:
        direct_local(a.limit)
