# Operasional Company Brain (P4)

## Jalan harian
```powershell
cd company-brain
docker compose up -d --build
# web http://localhost:3000 | api http://localhost:8000/docs | metrics http://localhost:8000/metrics
# observability opsional: docker compose --profile observability up -d
# prometheus http://localhost:9090 | grafana http://localhost:3001
```

## Env prod wajib ganti
Salin `.env.example` -> `.env`, lalu ganti:
`JWT_SECRET` (32+ acak), `SEED_ADMIN_PASSWORD`, `POSTGRES_PASSWORD`,
`MINIO_ROOT_PASSWORD`, `ALLOWED_ORIGINS` (domain kantor saja).
Cek: `python scripts/check_secrets.py --strict`

## Backup / restore
- Backup: `.\scripts\backup.ps1` (Windows) atau `bash scripts/backup.sh` (Linux) -> folder `backups/`
- Restore Postgres: `Get-Content backups\pg_xxx.sql | docker compose exec -T postgres psql -U brain companybrain`
- MinIO/Qdrant: restore via console/snapshot (lihat isi file backup).

## Batas P4
- Upload: ekstensi pdf/docx/txt/md/csv/log, maks `MAX_UPLOAD_MB` (default 20), doc_type umum/sop/cs/keuangan
- Rate-limit: login 10/menit/IP, chat 20/menit/user, search 30/menit, upload 20/menit
- Chat: maks 2000 karakter, top_k maks 10

## Troubleshooting
- `401 Butuh token`: login ulang di /login
- `429`: kena rate-limit, tunggu sesuai pesan detik
- `MinIO belum siap`: `docker compose logs minio`, pastikan port 9000 bebas
- `Qdrant belum siap`: cek `http://localhost:6333/dashboard`
- `Ollama offline`: chat tetap jalan mode stub; tarik model `nomic-embed-text` + `llama3.1:8b`
