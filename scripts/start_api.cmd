@echo off
cd /d C:\Users\hp P R O B O O K\company-brain\services\api
SET "DATABASE_URL=postgresql://brain:brain123@127.0.0.1:5433/companybrain"
SET "STORAGE_BACKEND=local"
SET "LOCAL_STORAGE_DIR=./data"
SET "MINIO_BUCKET=bronze"
SET "QDRANT_URL=http://127.0.0.1:6333"
SET "QDRANT_COLLECTION=brain_chunks"
SET "OLLAMA_URL=http://127.0.0.1:11434"
SET "EMBED_MODEL=nomic-embed-text"
SET "CHAT_MODEL=qwen2.5:7b"
SET "JWT_SECRET=ganti-ini-di-prod-min-32-karakter"
SET "JWT_EXPIRE_MIN=480"
SET "SEED_ADMIN_USER=admin"
SET "SEED_ADMIN_PASSWORD=admin123"
SET "ALLOWED_ORIGINS=http://localhost:3000"
SET "MAX_UPLOAD_MB=20"
SET "RATE_LIMIT_ENABLE=true"
SET "NEXT_PUBLIC_API_URL=http://localhost:8000"
SET "PYTHONPATH=C:\Users\hp P R O B O O K\company-brain\services\api"
"C:\Users\hp P R O B O O K\company-brain\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 >> C:\Users\hp P R O B O O K\company-brain\api_native.log 2>> C:\Users\hp P R O B O O K\company-brain\api_native.err.log

