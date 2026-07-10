# Demarre l'environnement de developpement (PowerShell)
# Usage: .\scripts\start-dev.ps1 [-Docker] [-SkipFrontend] [-SkipBackend] [-SkipAiService]

param(
    [switch]$Docker,
    [switch]$SkipFrontend,
    [switch]$SkipBackend,
    [switch]$SkipAiService
)

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$PhpDevServer = Join-Path $Root "scripts\php-dev-server.ps1"
$AiService = Join-Path $Root "scripts\start-ai-service.ps1"
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"

Write-Host "=== Immo2Kin - dev ===" -ForegroundColor Cyan

if ($Docker) {
    $ComposeFile = Join-Path $Root "infra\docker\docker-compose.yml"
    $DockerEnv = Join-Path $Root "infra\docker\.env"
    if (-not (Test-Path $DockerEnv)) {
        Copy-Item (Join-Path $Root "infra\docker\.env.example") $DockerEnv
    }
    Write-Host "Demarrage MySQL + Redis + AI service (Docker)..." -ForegroundColor Yellow
    docker compose -f $ComposeFile --env-file $DockerEnv up -d mysql redis ai-service
    Start-Sleep -Seconds 8
}

if (-not $SkipBackend) {
    Write-Host "Backend Laravel : http://localhost:8000" -ForegroundColor Green
    Start-Process powershell -ArgumentList @(
        "-NoExit", "-File", $PhpDevServer, "-BindHost", "127.0.0.1", "-Port", "8000"
    )
    Start-Process powershell -ArgumentList @(
        "-NoExit", "-Command", "Set-Location '$Backend'; php artisan reverb:start"
    )
    Start-Process powershell -ArgumentList @(
        "-NoExit", "-Command", "Set-Location '$Backend'; php artisan queue:work"
    )
}

if (-not $SkipFrontend) {
    Write-Host "Frontend Vite : http://localhost:5173" -ForegroundColor Green
    Start-Process powershell -ArgumentList @(
        "-NoExit", "-Command", "Set-Location '$Frontend'; npm.cmd run dev"
    )
}

if (-not $SkipAiService -and -not $Docker) {
    Write-Host "AI Service : http://localhost:8001/health" -ForegroundColor Green
    Start-Process powershell -ArgumentList @("-NoExit", "-File", $AiService)
}

Write-Host ""
Write-Host "Termine." -ForegroundColor Cyan
Write-Host "  Frontend  : http://localhost:5173" -ForegroundColor White
Write-Host "  API       : http://localhost:8000" -ForegroundColor White
Write-Host "  AI health : http://localhost:8001/health" -ForegroundColor White
