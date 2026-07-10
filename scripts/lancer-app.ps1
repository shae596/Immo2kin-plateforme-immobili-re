# Lance Immo2Kin (complet) et ouvre le navigateur
# Usage: .\scripts\lancer-app.ps1
#        .\scripts\lancer-app.ps1 -Docker

param(
    [switch]$Docker,
    [switch]$NoBrowser
)

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$FrontendUrl = "http://localhost:5173"
$StartDev = Join-Path $Root "scripts\start-dev.ps1"

Write-Host "=== Immo2Kin - lancement complet ===" -ForegroundColor Cyan

$devArgs = @()
if ($Docker) { $devArgs += "-Docker" }
& $StartDev @devArgs

if (-not $NoBrowser) {
    Write-Host ""
    Write-Host "Ouverture du navigateur dans 10 secondes..." -ForegroundColor Green
    Start-Sleep -Seconds 10
    Start-Process $FrontendUrl
}

Write-Host ""
Write-Host "  Application : $FrontendUrl"
Write-Host "  Comptes     : client@immo.local / password"
