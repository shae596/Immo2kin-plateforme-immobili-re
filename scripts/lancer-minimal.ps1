# Lance le minimum pour utiliser Immo2Kin dans le navigateur (2 terminaux + ouverture auto)
# Usage: .\scripts\lancer-minimal.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$FrontendUrl = "http://localhost:5173"
$ServeBackend = Join-Path $Root "scripts\serve-backend.ps1"
$Frontend = Join-Path $Root "frontend"

Write-Host "=== Immo2Kin - mode minimal ===" -ForegroundColor Cyan

Start-Process powershell -ArgumentList @("-NoExit", "-File", $ServeBackend)

Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command", "Set-Location '$Frontend'; npm.cmd run dev"
)

Write-Host "Demarrage en cours..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "Ouverture : $FrontendUrl" -ForegroundColor Green
Start-Process $FrontendUrl

Write-Host ""
Write-Host "Sans messagerie temps reel ni recommandations IA." -ForegroundColor Gray
Write-Host "Pour tout lancer : .\scripts\start-dev.ps1" -ForegroundColor Gray
