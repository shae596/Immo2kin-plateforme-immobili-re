# Installation initiale du monorepo (Phase 0)
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "Installation backend (Composer)..." -ForegroundColor Cyan
Set-Location backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env; php artisan key:generate }
if (-not (Test-Path "database\database.sqlite")) {
    New-Item -ItemType File -Path "database\database.sqlite" -Force | Out-Null
}
composer install --no-interaction
php artisan config:clear
php artisan migrate --force

Write-Host "Installation frontend (npm)..." -ForegroundColor Cyan
Set-Location ..\frontend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm install

Write-Host "Installation ai-service (Python venv)..." -ForegroundColor Cyan
& "$Root\scripts\start-ai-service.ps1" -SetupOnly

Write-Host "Phase 0 setup terminee." -ForegroundColor Green
