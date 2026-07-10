# Configure et demarre Immo2Kin avec Docker (MySQL + Redis + IA)
# Usage: .\scripts\demarrer-docker.ps1
#        .\scripts\demarrer-docker.ps1 -NoBrowser

param([switch]$NoBrowser)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ComposeFile = Join-Path $Root "infra\docker\docker-compose.yml"
$DockerEnv = Join-Path $Root "infra\docker\.env"

Write-Host "=== Immo2Kin - mode Docker ===" -ForegroundColor Cyan

if (-not (Test-Path $ComposeFile)) {
    throw "Fichier introuvable : $ComposeFile"
}

if (-not (Test-Path $DockerEnv)) {
    Copy-Item (Join-Path $Root "infra\docker\.env.example") $DockerEnv
}

Write-Host "Demarrage conteneurs MySQL + Redis + AI..." -ForegroundColor Yellow
docker compose -f $ComposeFile --env-file $DockerEnv up -d mysql redis ai-service

Write-Host "Attente MySQL (15 s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

& (Join-Path $Root "scripts\switch-to-docker.ps1")

Set-Location (Join-Path $Root "backend")
php artisan storage:link 2>$null

Write-Host ""
Write-Host "Docker OK. Lancement de l'application..." -ForegroundColor Green
Set-Location $Root

$lancerArgs = @()
if ($NoBrowser) { $lancerArgs += "-NoBrowser" }
& (Join-Path $Root "scripts\lancer-app.ps1") -Docker @lancerArgs
