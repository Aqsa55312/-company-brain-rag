# Company Brain — RAG + Lakehouse + Analytics (P4 Final)
Platform AI internal termurah: lokal 100%, tanpa GPU, tanpa API berbayar.

## Stack P4
- Web: Next.js 14 (login + upload + search + chat sitasi + dashboard stats)
- API: FastAPI (auth + upload validasi + index + search + chat RAG + feedback + stats + audit + rate-limit + /metrics)
- Data: Postgres 15 (documents + chunks + chat_logs + feedback) + MinIO bronze + Qdrant 768 + Redis
- AI: Ollama `nomic-embed-text` + `llama3.1:8b` (stub offline) — eval LOLOS 100%
- Ops: Prometheus/Grafana (profile observability) + backup script + K8s fondasi + docs serah-terima

## Cara jalan (P4)
```powershell
cd company-brain
Copy-Item .env.example .env
docker compose up -d --build
# API: http://localhost:8000/docs
# Web: http://localhost:3000
# MinIO: http://localhost:9001 (minioadmin/minioadmin)
# Qdrant: http://localhost:6333/dashboard
```
Login default dev: `admin / admin123` (ganti di prod via SEED_ADMIN_PASSWORD).

## Struktur
```
company-brain/
 docker-compose.yml
 .env.example
 apps/web/
 services/api/
 pipelines/ (P2: ingest campuran -> silver/gold)
 evals/ (P3: uji faithfulness)
```

## Alur P2 (campuran)
Upload -> POST /ingest/index {document_id} -> extract (pdf/docx/txt/csv) -> chunk per tipe
(sop 800/120, cs 400/80, lain 600/100) -> embed Ollama/hash-fallback 768 -> Qdrant + Postgres chunks.
Cari -> GET /search?q=&doc_type= -> vector dulu, gagal/kosong -> keyword ILIKE fallback.

Tarik model (opsional, butuh internet sekali):
```powershell
docker exec -it company-brain-ollama-1 ollama pull nomic-embed-text
docker exec -it company-brain-ollama-1 ollama pull llama3.1:8b
```

## Alur P3 (chat)
Tanya -> POST /chat {q} -> retrieve top-5 (vector, fallback keyword) -> build prompt + sitasi [1..n]
-> Ollama llama3.1:8b (atau stub offline) -> simpan chat_logs -> feedback 👍/👎 -> /stats agregat.
Eval: `python evals/rag_eval.py` (retrieval_hit, citation_format, faithfulness_proxy).

## Hardening P4
- Rate-limit login/chat/search/upload, validasi ekstensi + MAX_UPLOAD_MB, doc_type ketat, chat maks 2000 char
- CORS dari `ALLOWED_ORIGINS`, secret check di `/health` + `python scripts/check_secrets.py --strict`
- `/metrics` Prometheus + `infra/prometheus.yml` + Grafana (profile observability)
- Backup `scripts/backup.ps1/.sh`, K8s `infra/k8s/api-web.yaml`, docs di `docs/`

## Peta jalan
- P1: Compose + Auth + Upload bronze + audit ✅
- P2: embedding + Qdrant hybrid search ✅
- P3: chat RAG + sitasi + dashboard + eval ✅
- P4 (ini): hardening + observability + K8s + docs serah-terima ✅
