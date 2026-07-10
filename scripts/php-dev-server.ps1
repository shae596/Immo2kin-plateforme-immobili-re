# Lance le serveur PHP intégré Laravel avec des limites d'upload adaptées aux photos HD.
# `php artisan serve` ignore les flags -d/-c : il faut lancer `php -S` directement.
param(
    [string]$BindHost = "127.0.0.1",
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ServerScript = Join-Path $Root "backend\vendor\laravel\framework\src\Illuminate\Foundation\resources\server.php"
$PublicDir = Join-Path $Root "backend\public"

if (-not (Test-Path $ServerScript)) {
    throw "Fichier introuvable : $ServerScript (exécutez composer install dans backend/)"
}

Set-Location $PublicDir
php -d upload_max_filesize=12M -d post_max_size=14M -S "${BindHost}:${Port}" $ServerScript
