# Passe le backend en mode dev sans Docker (SQLite + file/sync)
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$EnvFile = Join-Path $Root "backend\.env"

$content = @"
APP_NAME="Immo2Kin"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

APP_LOCALE=fr
APP_FALLBACK_LOCALE=fr
APP_FAKER_LOCALE=fr_FR

APP_MAINTENANCE_DRIVER=file

PHP_CLI_SERVER_WORKERS=4

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173

# MODE : FALLBACK (sans Docker)

DB_CONNECTION=sqlite

SESSION_DRIVER=file
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=localhost

SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,127.0.0.1,127.0.0.1:5173

BROADCAST_CONNECTION=reverb
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync

CACHE_STORE=file

REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=log
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_FROM_ADDRESS="noreply@immo2kin.local"
MAIL_FROM_NAME="`${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

REVERB_APP_ID=immo2kin
REVERB_APP_KEY=local-reverb-key
REVERB_APP_SECRET=local-reverb-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

VITE_APP_NAME="`${APP_NAME}"
VITE_REVERB_APP_KEY="`${REVERB_APP_KEY}"
VITE_REVERB_HOST="`${REVERB_HOST}"
VITE_REVERB_PORT="`${REVERB_PORT}"
VITE_REVERB_SCHEME="`${REVERB_SCHEME}"

AI_SERVICE_URL=http://localhost:8001
AI_SERVICE_API_KEY=dev-ai-key
"@

# Préserve APP_KEY existante
if (Test-Path $EnvFile) {
    $existing = Get-Content $EnvFile -Raw
    if ($existing -match 'APP_KEY=(.+)') {
        $key = $Matches[1].Trim()
        $content = $content -replace 'APP_KEY=', "APP_KEY=$key"
    }
}

Set-Content -Path $EnvFile -Value $content -Encoding UTF8

Set-Location (Join-Path $Root "backend")
if (-not (Test-Path "database\database.sqlite")) {
    New-Item -ItemType File -Path "database\database.sqlite" -Force | Out-Null
}
php artisan config:clear
php artisan migrate --force

Write-Host "Mode fallback active (SQLite + file/sync). Redemarrez php artisan serve." -ForegroundColor Green
