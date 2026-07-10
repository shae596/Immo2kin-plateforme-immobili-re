#!/usr/bin/env bash
# Démarre l'environnement de développement (Linux/macOS/WSL)
# Usage: ./scripts/start-dev.sh [--docker] [--skip-frontend] [--skip-backend] [--skip-ai]

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PHP_SERVER="$ROOT/backend/vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php"
PHP_SERVE=(php -d upload_max_filesize=12M -d post_max_size=14M -S 127.0.0.1:8000 "$PHP_SERVER")
DOCKER=false
SKIP_FRONTEND=false
SKIP_BACKEND=false
SKIP_AI=false

for arg in "$@"; do
  case "$arg" in
    --docker) DOCKER=true ;;
    --skip-frontend) SKIP_FRONTEND=true ;;
    --skip-backend) SKIP_BACKEND=true ;;
    --skip-ai) SKIP_AI=true ;;
  esac
done

echo "=== Immo2Kin — dev ==="

if [ "$DOCKER" = true ]; then
  echo "Démarrage MySQL + Redis + AI service (Docker)..."
  docker compose -f "$ROOT/infra/docker/docker-compose.yml" up -d mysql redis ai-service
  sleep 5
fi

if [ "$SKIP_BACKEND" = false ]; then
  echo "Backend Laravel : http://localhost:8000"
  (cd "$ROOT/backend/public" && "${PHP_SERVE[@]}") &
  (cd "$ROOT/backend" && php artisan reverb:start) &
  (cd "$ROOT/backend" && php artisan queue:work) &
fi

if [ "$SKIP_FRONTEND" = false ]; then
  echo "Frontend Vite : http://localhost:5173"
  (cd "$ROOT/frontend" && npm run dev) &
fi

if [ "$SKIP_AI" = false ] && [ "$DOCKER" = false ]; then
  echo "AI Service : http://localhost:8001/health"
  "$ROOT/scripts/start-ai-service.sh" &
fi

echo ""
echo "Terminé."
echo "  Frontend  : http://localhost:5173"
echo "  API       : http://localhost:8000"
echo "  AI health : http://localhost:8001/health"
wait
