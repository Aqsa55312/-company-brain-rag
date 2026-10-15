# Backup Company Brain (Windows PowerShell)
# Jalan: .\scripts\backup.ps1
# Hasil: backups\pg_<tanggal>.sql + note MinIO/Qdrant
$ErrorActionPreference = "Stop"
$date = Get-Date -Format "yyyyMMdd_HHmm"
New-Item -ItemType Directory -Path "backups" -Force | Out-Null
Write-Output "1/3 Backup Postgres..."
docker compose exec -T postgres pg_dump -U brain companybrain | Out-File -Encoding utf8 "backups\pg_$date.sql"
Write-Output "2/3 MinIO note (sinkron manual via console :9001)..."
"Backup MinIO $date : gunakan mc mirror atau snapshot volume miniodata" | Out-File "backups\minio_$date.txt"
Write-Output "3/3 Qdrant snapshot..."
try {
  Invoke-RestMethod -Method Post -Uri "http://localhost:6333/collections/brain_chunks/snapshots" | Out-File "backups\qdrant_$date.json"
} catch {
  "Qdrant offline: $_" | Out-File "backups\qdrant_$date.txt"
}
Write-Output "Selesai di folder backups\"
