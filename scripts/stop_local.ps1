# Stop Company Brain NATIVE
# Jalan: .\scripts\stop_local.ps1 (dari folder company-brain\scripts)
Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*company-brain*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object {
  $pid = $_.OwningProcess
  Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object {
  Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Write-Output "stopped (port 8000 + 3000 dibebaskan bila ada)"
