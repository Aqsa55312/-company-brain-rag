# Company Brain NATIVE (tanpa Docker)

Arsitektur: Postgres native (service `postgresql-x64-17`, port 5433)
+ storage folder lokal `services/api/data/bronze`
+ API FastAPI via `.venv` + Web Next.js via `npm run dev`.
Qdrant diskip (search pakai keyword-fallback), Ollama opsional
(model `qwen2.5:7b` native bila ada; kalau tidak ada, chat pakai stub).

## Prasyarat (sekali saja, sudah beres di mesin ini)
- Service `postgresql-x64-17` Running, role `brain` + DB `companybrain` ada
- `.venv` terisi (`pip install -r services/api/requirements.txt`)
- `apps/web/node_modules` terisi
- Config: `.env.native` (jangan pakai `.env` Docker)

## Cara nyalakan (PENTING: dari window PowerShell milikmu sendiri)
Server harus dinyalakan dari window PowerShell **milikmu** agar tidak ikut
mati. Jangan tutup window-nya selama server dipakai.

```powershell
cd "C:\Users\hp P R O B O O K\company-brain"
powershell -ExecutionPolicy Bypass -File scripts\run_local.ps1
# tunggu sampai muncul SELESAI, tekan Enter (API tetap jalan)
powershell -ExecutionPolicy Bypass -File scripts\run_web.ps1
# biarkan window ini TERBUKA selama Web dipakai
```

Cek:
- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health (expect `stage: P4`)
- Web: http://localhost:3000
- Login dev: `admin / admin123`

## Cara matikan
```powershell
powershell -ExecutionPolicy Bypass -File scripts\stop_local.ps1
```

## Batasan mode native
- Search = keyword (kata harus persis), bukan semantik (butuh Qdrant)
- Chat = LLM asli hanya jika Ollama native jalan (`qwen2.5:7b`);
  jika tidak, otomatis stub
- `CHAT_MODEL` diatur di `.env.native`
- Upload maks `MAX_UPLOAD_MB` (default 20), ekstensi pdf/docx/txt/md/csv/log
