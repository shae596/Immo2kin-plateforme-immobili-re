#!/bin/sh
set -e

cd /app/backend

if [ -z "$APP_KEY" ]; then
  echo "ERREUR: définissez APP_KEY dans les variables Railway."
  exit 1
fi

# Variables MySQL Railway → Laravel
if [ -n "$MYSQL_URL" ] && [ -z "$DB_URL" ]; then
  export DB_URL="$MYSQL_URL"
fi

if [ -n "$MYSQLHOST" ] && [ -z "$DB_HOST" ]; then
  export DB_CONNECTION="${DB_CONNECTION:-mysql}"
  export DB_HOST="$MYSQLHOST"
  export DB_PORT="${DB_PORT:-${MYSQLPORT:-3306}}"
  export DB_DATABASE="${DB_DATABASE:-$MYSQLDATABASE}"
  export DB_USERNAME="${DB_USERNAME:-$MYSQLUSER}"
  export DB_PASSWORD="${DB_PASSWORD:-$MYSQLPASSWORD}"
fi

echo "Migrations…"
php artisan migrate --force

php artisan storage:link 2>/dev/null || true

if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seed base de démo…"
  php artisan db:seed --force
fi

php artisan config:cache
php artisan route:cache

echo "Démarrage sur le port ${PORT:-8000}…"
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
