# Démarre l'API Laravel avec une limite upload suffisante pour les photos HD.
# Usage: .\scripts\serve-backend.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Port = 8000

Write-Host "Arret du serveur sur le port $Port..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
Start-Sleep -Seconds 2

Write-Host "Demarrage API (upload_max_filesize=12M) : http://127.0.0.1:$Port" -ForegroundColor Green
& (Join-Path $Root "scripts\php-dev-server.ps1") -BindHost 127.0.0.1 -Port $Port
