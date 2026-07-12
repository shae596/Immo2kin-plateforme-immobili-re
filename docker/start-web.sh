#!/bin/sh
set -e

cd /app/backend

if [ -z "$APP_KEY" ]; then
  echo "ERREUR: définissez APP_KEY dans les variables Railway."
  exit 1
fi

# Variables injectées par le plugin MySQL Railway (si pas encore mappées)
if [ -n "$MYSQLHOST" ] && [ -z "$DB_HOST" ]; then
  export DB_HOST="$MYSQLHOST"
  export DB_PORT="${DB_PORT:-${MYSQLPORT:-3306}}"
  export DB_DATABASE="${DB_DATABASE:-$MYSQLDATABASE}"
  export DB_USERNAME="${DB_USERNAME:-$MYSQLUSER}"
  export DB_PASSWORD="${DB_PASSWORD:-$MYSQLPASSWORD}"
fi

export DB_CONNECTION="${DB_CONNECTION:-mysql}"

# Préférer DB_HOST/DB_* aux URLs : MYSQL_URL/DATABASE_URL peuvent provoquer
# « Invalid URI: Host is malformed » si le mot de passe contient des caractères spéciaux.
if [ -n "$DB_HOST" ]; then
  unset DB_URL
else
  if [ -n "$DATABASE_URL" ]; then
    export DB_URL="$DATABASE_URL"
  elif [ -n "$MYSQL_URL" ]; then
    export DB_URL="$MYSQL_URL"
  elif [ -n "$MYSQL_PRIVATE_URL" ]; then
    export DB_URL="$MYSQL_PRIVATE_URL"
  fi
fi

echo "=== Démarrage Immo2Kin ==="
echo "DB_CONNECTION=${DB_CONNECTION}"
echo "DB_HOST=${DB_HOST:-<non défini>}"
echo "DB_DATABASE=${DB_DATABASE:-<non défini>}"
if [ -n "$DB_URL" ]; then
  echo "DB_URL=<utilisé (pas de DB_HOST)>"
fi

if [ -z "$DB_HOST" ] && [ -z "$DB_URL" ]; then
  echo "ERREUR: aucune config MySQL. Référencez le service MySQL (DB_HOST, DB_PORT, etc.)."
  echo "Voir docs/railway-variables-checklist.md"
  exit 1
fi

echo "Migrations…"
if ! php artisan migrate --force; then
  echo "ERREUR: migrations échouées. Vérifiez DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE."
  exit 1
fi

php artisan storage:link 2>/dev/null || true

if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seed base de démo…"
  php artisan db:seed --force || echo "AVERTISSEMENT: seed échoué (peut être normal si déjà seedé)."
fi

php artisan config:cache || echo "AVERTISSEMENT: config:cache ignoré."
php artisan route:cache || echo "AVERTISSEMENT: route:cache ignoré."

echo "Démarrage sur le port ${PORT:-8000}…"
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
