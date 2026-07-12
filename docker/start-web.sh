#!/bin/sh
set -e

cd /app/backend

# .dockerignore exclut storage/framework/* — Laravel exige ces dossiers (vues Blade, cache fichier).
prepare_filesystem() {
  mkdir -p \
    storage/framework/sessions \
    storage/framework/views \
    storage/framework/cache/data \
    storage/framework/testing \
    storage/logs \
    storage/app/public \
    storage/app/private \
    bootstrap/cache
  chmod -R 775 storage bootstrap/cache 2>/dev/null || true
}
prepare_filesystem

if [ -z "$APP_KEY" ]; then
  echo "ERREUR: définissez APP_KEY dans les variables Railway."
  exit 1
fi

# Railway fournit souvent RAILWAY_PUBLIC_DOMAIN / RAILWAY_STATIC_URL automatiquement.
if [ -n "$RAILWAY_STATIC_URL" ]; then
  export APP_URL="${APP_URL:-$RAILWAY_STATIC_URL}"
  export FRONTEND_URL="${FRONTEND_URL:-$RAILWAY_STATIC_URL}"
elif [ -n "$RAILWAY_PUBLIC_DOMAIN" ]; then
  export APP_URL="${APP_URL:-https://$RAILWAY_PUBLIC_DOMAIN}"
  export FRONTEND_URL="${FRONTEND_URL:-https://$RAILWAY_PUBLIC_DOMAIN}"
fi

# Normalise : Railway peut injecter APP_URL = « domaine.app » sans https://
normalize_url() {
  case "$1" in
    http://*|https://*) printf '%s' "$1" ;;
    *'${{'*|'') printf '%s' "$1" ;;
    *) printf 'https://%s' "$1" ;;
  esac
}

APP_URL="$(normalize_url "${APP_URL:-}")"
FRONTEND_URL="$(normalize_url "${FRONTEND_URL:-$APP_URL}")"
export APP_URL FRONTEND_URL

# APP_URL avec ${{...}} non résolu → « Invalid URI: Host is malformed » au boot.
case "${APP_URL}" in
  *'${{'*|'')
    echo "ERREUR: APP_URL invalide ou non résolu: « ${APP_URL:-<vide>} »"
    echo "Utilisez l'URL complète, ex: https://immo2kin-xxx.up.railway.app"
    echo "Ou supprimez APP_URL : Railway peut utiliser RAILWAY_PUBLIC_DOMAIN automatiquement."
    exit 1
    ;;
esac

case "$APP_URL" in
  http://*|https://*) ;;
  *)
    echo "ERREUR: APP_URL invalide après normalisation: $APP_URL"
    exit 1
    ;;
esac

export FRONTEND_URL="${FRONTEND_URL:-$APP_URL}"
export SANCTUM_STATEFUL_DOMAINS="${SANCTUM_STATEFUL_DOMAINS:-$(echo "$APP_URL" | sed -e 's#^https\?://##' -e 's#/.*$##')}"
export CORS_ALLOWED_ORIGINS="${CORS_ALLOWED_ORIGINS:-$APP_URL}"

# Variables injectées par le plugin MySQL Railway (si pas encore mappées)
if [ -n "$MYSQLHOST" ] && [ -z "$DB_HOST" ]; then
  export DB_HOST="$MYSQLHOST"
  export DB_PORT="${DB_PORT:-${MYSQLPORT:-3306}}"
  export DB_DATABASE="${DB_DATABASE:-$MYSQLDATABASE}"
  export DB_USERNAME="${DB_USERNAME:-$MYSQLUSER}"
  export DB_PASSWORD="${DB_PASSWORD:-$MYSQLPASSWORD}"
fi

export DB_CONNECTION="${DB_CONNECTION:-mysql}"

# Préférer DB_HOST/DB_* aux URLs (évite « Invalid URI » sur mots de passe spéciaux).
if [ -n "$DB_HOST" ]; then
  unset DB_URL DATABASE_URL MYSQL_URL MYSQL_PRIVATE_URL
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
echo "APP_URL=${APP_URL}"
echo "DB_CONNECTION=${DB_CONNECTION}"
echo "DB_HOST=${DB_HOST:-<non défini>}"
echo "DB_DATABASE=${DB_DATABASE:-<non défini>}"

if [ -z "$DB_HOST" ] && [ -z "$DB_URL" ]; then
  echo "ERREUR: aucune config MySQL. Référencez le service MySQL (DB_HOST, DB_PORT, etc.)."
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

# Photos R2 : rattache les fichiers déjà sur le bucket aux annonces (par titre, via manifest.json).
if [ "${IMPORT_PROPERTY_MEDIA:-true}" != "false" ] && [ -f /app/deploy/property-media/manifest.json ]; then
  if [ "${MEDIA_DISK:-public}" = "s3" ]; then
    echo "Rattachement des photos cloud (R2)…"
    php artisan property-media:rehydrate /app/deploy/property-media || echo "AVERTISSEMENT: rehydrate médias échoué."
  else
    echo "INFO: MEDIA_DISK≠s3 — import photos ignoré (définissez MEDIA_DISK=s3 + credentials R2)."
  fi
fi

php artisan optimize:clear 2>/dev/null || true
php artisan config:cache || echo "AVERTISSEMENT: config:cache ignoré."
php artisan route:cache || echo "AVERTISSEMENT: route:cache ignoré."

echo "Démarrage sur le port ${PORT:-8000}…"
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
