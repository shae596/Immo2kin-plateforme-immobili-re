# Démarre le microservice IA (FastAPI) sur http://localhost:8001
param(
    [switch]$SetupOnly
)

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$AiRoot = Join-Path $Root "ai-service"
$VenvDir = Join-Path $AiRoot ".venv"
$Python = Join-Path $VenvDir "Scripts\python.exe"
$Pip = Join-Path $VenvDir "Scripts\pip.exe"

Set-Location $AiRoot

if (-not (Test-Path $Python)) {
    Write-Host "Creation venv ai-service..." -ForegroundColor Yellow
    python -m venv $VenvDir
}

Write-Host "Installation dependances ai-service..." -ForegroundColor Yellow
& $Pip install -q -r requirements.txt

if ($SetupOnly) {
    Write-Host "AI service pret (venv + deps)." -ForegroundColor Green
    exit 0
}

Write-Host "AI Service : http://localhost:8001/health" -ForegroundColor Green
& (Join-Path $VenvDir "Scripts\uvicorn.exe") app.main:app --host 127.0.0.1 --port 8001 --reload
