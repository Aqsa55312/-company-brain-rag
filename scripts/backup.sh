#!/usr/bin/env bash
# Backup Company Brain (Linux)
# Jalan: bash scripts/backup.sh
set -e
date=$(date +%Y%m%d_%H%M)
mkdir -p backups
echo "1/3 Postgres..."
docker compose exec -T postgres pg_dump -U brain companybrain > "backups/pg_${date}.sql"
echo "2/3 MinIO note..."
echo "Backup MinIO $date: gunakan mc mirror atau snapshot volume miniodata" > "backups/minio_${date}.txt"
echo "3/3 Qdrant snapshot..."
curl -s -X POST "http://localhost:6333/collections/brain_chunks/snapshots" > "backups/qdrant_${date}.json" || echo "Qdrant offline" > "backups/qdrant_${date}.txt"
echo "Selesai di backups/"
