# Serah-Terima Company Brain — P4 Final

## 1. Lingkup
Platform AI internal: upload dokumen campuran -> index hybrid (Qdrant + keyword)
-> search -> chat RAG bersitasi -> feedback -> dashboard stats.
Kompleks tapi termurah: 100% lokal, tanpa GPU wajib, tanpa API berbayar.

## 2. Cara demo ke pimpinan (10 menit)
1. Buka `/login` (admin/admin123 di dev) -> `/upload` 1 PDF SOP
2. `POST /ingest/index-all` di `/docs` -> buka `/search`, cari kata kunci SOP
3. Buka `/chat`, tanya "Berapa maksimal cuti?" -> tunjukkan sitasi [1][2]
4. Beri 👍 -> buka `/dashboard` -> tunjukkan stats + top pertanyaan
5. Buka `/health` (stage P4, qdrant/ollama/llm) + `/metrics`

## 3. Checklist penerimaan
- [ ] `docker compose config` OK
- [ ] `python -m py_compile` API OK
- [ ] `npm run build` web OK (6 route)
- [ ] `python evals/rag_eval.py` LOLOS (>=60%)
- [ ] `python scripts/check_secrets.py` dijelaskan (GAGAL di dev = wajar, wajib LOLOS di prod)
- [ ] Backup script ada (`scripts/backup.ps1` + `.sh`)
- [ ] Docs dibaca: OPERASIONAL.md + KEAMANAN.md
- [ ] K8s fondasi ada di `infra/k8s/api-web.yaml` + `infra/prometheus.yml`

## 4. Yang diserahkan
Kode di `company-brain/`: `apps/web`, `services/api`, `pipelines`, `evals`,
`infra` (compose + prometheus + k8s), `scripts`, `docs`, `.env.example`, README.

## 5. Langkah setelah ini (opsional P5)
SSO, Redis rate-limit terdistribusi, PII redaction, retensi otomatis,
eval 20 Q&A asli + ambang faithfulness 75%, CI/CD + image registry.
