# Run Web NATIVE (tanpa Docker) — foreground, biarkan window terbuka
# Jalan dari folder company-brain\apps\web: powershell -ExecutionPolicy Bypass -File ..\..\scripts\run_web.ps1
# ATAU: klik kanan file ini -> Run with PowerShell
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $MyInvocation.MyCommand.Path -Parent) | Out-Null
Set-Location ..\apps\web
Write-Output ("[{0:HH:mm:ss}] npm run dev..." -f (Get-Date))
npm run dev
