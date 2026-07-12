# Configure Cloudflare R2 dans backend/.env et synchronise les photos locales.
# Usage :
#   .\scripts\setup-r2.ps1 -AccessKeyId "..." -SecretAccessKey "..." -PublicUrl "https://pub-xxx.r2.dev"
#   .\scripts\setup-r2.ps1 -AccessKeyId "..." -SecretAccessKey "..." -PublicUrl "https://pub-xxx.r2.dev" -Sync

param(
    [Parameter(Mandatory = $true)]
    [string]$AccessKeyId,

    [Parameter(Mandatory = $true)]
    [string]$SecretAccessKey,

    [Parameter(Mandatory = $true)]
    [string]$PublicUrl,

    [string]$Bucket = "immo2kin-media",
    [string]$Endpoint = "https://c94d48a4f0f4b736d0ae27d60e51fd8c.r2.cloudflarestorage.com",
    [switch]$Sync
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$EnvFile = Join-Path $Root "backend\.env"

if (-not (Test-Path $EnvFile)) {
    Write-Error "Fichier introuvable : $EnvFile (copiez .env.example vers .env)"
}

$content = Get-Content $EnvFile -Raw

function Set-EnvValue {
    param([string]$Name, [string]$Value)
    $pattern = "(?m)^$([regex]::Escape($Name))=.*$"
    $line = "$Name=$Value"
    if ($content -match $pattern) {
        $script:content = $content -replace $pattern, $line
    } else {
        $script:content = $content.TrimEnd() + "`n$line`n"
    }
}

Set-EnvValue "MEDIA_DISK" "s3"
Set-EnvValue "AWS_ACCESS_KEY_ID" $AccessKeyId
Set-EnvValue "AWS_SECRET_ACCESS_KEY" $SecretAccessKey
Set-EnvValue "AWS_DEFAULT_REGION" "auto"
Set-EnvValue "AWS_BUCKET" $Bucket
Set-EnvValue "AWS_URL" $PublicUrl.TrimEnd("/")
Set-EnvValue "AWS_ENDPOINT" $Endpoint
Set-EnvValue "AWS_USE_PATH_STYLE_ENDPOINT" "true"

Set-Content -Path $EnvFile -Value $content.TrimEnd() -NoNewline
Add-Content -Path $EnvFile -Value ""

Write-Host "backend/.env mis a jour (MEDIA_DISK=s3, bucket $Bucket)." -ForegroundColor Green

Push-Location (Join-Path $Root "backend")
try {
    php artisan config:clear | Out-Null

    if ($Sync) {
        Write-Host "Simulation sync cloud..." -ForegroundColor Cyan
        php artisan property-media:sync-cloud --from=public --dry-run
        Write-Host "Upload vers R2..." -ForegroundColor Cyan
        php artisan property-media:sync-cloud --from=public
    } else {
        Write-Host "Ajoutez -Sync pour envoyer les photos vers R2." -ForegroundColor Yellow
    }
} finally {
    Pop-Location
}
