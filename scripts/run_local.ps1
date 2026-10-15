# Run Company Brain NATIVE (tanpa Docker)
# Jalan dari folder company-brain: powershell -ExecutionPolicy Bypass -File scripts\run_local.ps1
$ErrorActionPreference = "Stop"
function Step($msg) { Write-Output ("[{0:HH:mm:ss}] {1}" -f (Get-Date), $msg) }

Set-Location (Split-Path $MyInvocation.MyCommand.Path -Parent) | Out-Null
Set-Location ..
$ROOT = (Get-Location).Path
Step "ROOT=$ROOT"

# 1. Load .env.native
Step "load .env.native..."
Get-Content "$ROOT\.env.native" | Where-Object { $_ -match "=" -and $_ -notmatch "^\s*#" } | ForEach-Object {
  $k, $v = $_ -split "=", 2
  [Environment]::SetEnvironmentVariable($k.Trim(), $v.Trim(), "Process")
}
$env:PYTHONPATH = "$ROOT\services\api"
Step "env OK"

# 2. Cek Postgres pg17:5433
Step "cek postgres 127.0.0.1:5433..."
& "C:\Program Files\PostgreSQL\17\bin\pg_isready.exe" -h 127.0.0.1 -p 5433
if ($LASTEXITCODE -ne 0) {
  Step "postgres TIDAK jalan. Nyalakan service postgresql-x64-17 dulu."
  exit 1
}

# 3. Init DB
Step "init_db..."
& "$ROOT\.venv\Scripts\python.exe" -c "from app.db import init_db; init_db(); print('init_db: OK')"

# 4. Matikan API lama bila ada (bebaskan :8000)
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object {
  Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
  Step "API lama dimatikan"
}

# 5. Jalan API detached (survive setelah script selesai)
Step "start uvicorn..."
$proc = Start-Process -FilePath "$ROOT\.venv\Scripts\python.exe" -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000" -WorkingDirectory "$ROOT\services\api" -RedirectStandardOutput "$ROOT\api_native.log" -RedirectStandardError "$ROOT\api_native.err.log" -PassThru
Step "API PID $($proc.Id) -> http://localhost:8000/docs"

# 6. Tunggu live (cepat, tanpa cek eksternal) maks ~60 detik
Step "tunggu /health/live..."
$ok = $false
for ($i = 1; $i -le 12; $i++) {
  Start-Sleep -Seconds 5
  try {
    $r = Invoke-RestMethod -Uri "http://localhost:8000/health/live" -TimeoutSec 5
    if ($r.ok) { $ok = $true; break }
  } catch { Step "coba $i/12 belum up..." }
}
if (-not $ok) { Step "API GAGAL up. Cek api_native.err.log"; exit 1 }
Step "API LIVE"

# 7. Health penuh (boleh lambat di hit pertama karena cache eksternal)
Step "cek /health penuh..."
try {
  $h = Invoke-RestMethod -Uri "http://localhost:8000/health" -TimeoutSec 60
  Step ("health: stage={0} qdrant={1} ollama_models={2}" -f $h.stage, $h.qdrant.ok, ($h.ollama.models -join ","))
} catch {
  Step "health penuh timeout (tidak fatal, API tetap jalan)"
}
Step "SELESAI - API detached, window ini boleh ditutup"
Step "Buka: http://localhost:8000/docs  |  Health: http://localhost:8000/health"
Read-Host "Tekan Enter untuk tutup window (API tetap jalan di background)"
