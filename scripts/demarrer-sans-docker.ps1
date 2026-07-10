# Demarre Immo2Kin SANS Docker (SQLite, pas de Redis requis)
# Usage: .\scripts\demarrer-sans-docker.ps1

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "=== Configuration mode sans Docker ===" -ForegroundColor Cyan
& (Join-Path $Root "scripts\switch-to-fallback.ps1")

Write-Host ""
Write-Host "=== Lancement application ===" -ForegroundColor Cyan
& (Join-Path $Root "scripts\lancer-minimal.ps1")
