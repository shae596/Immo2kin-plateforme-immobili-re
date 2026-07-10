#!/usr/bin/env bash
# Installation initiale du monorepo (Phase 0)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Installation backend (Composer)..."
cd "$ROOT/backend"
if [ ! -f .env ]; then
  cp .env.example .env
  php artisan key:generate
fi
composer install --no-interaction
php artisan migrate --force

echo "Installation frontend (npm)..."
cd "$ROOT/frontend"
if [ ! -f .env ]; then
  cp .env.example .env
fi
npm install

echo "Phase 0 setup terminée."
