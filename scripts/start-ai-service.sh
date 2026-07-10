#!/usr/bin/env bash
# Démarre le microservice IA (FastAPI) sur http://localhost:8001
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AI_ROOT="$ROOT/ai-service"
VENV="$AI_ROOT/.venv"

cd "$AI_ROOT"

if [ ! -d "$VENV" ]; then
  echo "Création venv ai-service..."
  python3 -m venv "$VENV"
fi

# shellcheck disable=SC1091
source "$VENV/bin/activate"
pip install -q -r requirements.txt

echo "AI Service : http://localhost:8001/health"
exec uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
