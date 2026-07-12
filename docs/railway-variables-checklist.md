# Checklist variables Railway — service web Immo2Kin

Copiez ces variables dans **service web → Variables**.  
Remplacez `TON-DOMAINE` par votre URL Railway (ex. `immo2kin-plateforme-immobili-re-production.up.railway.app`).

## Obligatoires (sans ça → healthcheck failed)

| Variable | Valeur |
|----------|--------|
| `APP_NAME` | `Immo2Kin` |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | `base64:...` (`php artisan key:generate --show` en local) |
| `APP_URL` | `https://TON-DOMAINE` |
| `FRONTEND_URL` | `https://TON-DOMAINE` |
| `LOG_CHANNEL` | `stderr` |
| `LOG_LEVEL` | `info` |
| `DB_CONNECTION` | `mysql` |
| `DB_HOST` | `${{MySQL.MYSQLHOST}}` |
| `DB_PORT` | `${{MySQL.MYSQLPORT}}` |
| `DB_DATABASE` | `${{MySQL.MYSQLDATABASE}}` |
| `DB_USERNAME` | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `SESSION_DRIVER` | `database` |
| `SESSION_SECURE_COOKIE` | `true` |
| `CACHE_STORE` | `file` |
| `QUEUE_CONNECTION` | `sync` |
| `BROADCAST_CONNECTION` | `log` |
| `FILESYSTEM_DISK` | `local` |
| `SANCTUM_STATEFUL_DOMAINS` | `TON-DOMAINE` (sans `https://`) |
| `CORS_ALLOWED_ORIGINS` | `https://TON-DOMAINE` |

> `MySQL` = nom **exact** du service MySQL dans Railway (souvent `MySQL`).

### Vérifier que MySQL est bien lié

1. Service web → **Variables** → **Add Variable Reference** (pas copier-coller à la main)
2. Choisir le service **MySQL** → `MYSQLHOST`, `MYSQLPORT`, etc.
3. Ou ajouter une seule variable : `DATABASE_URL` = `${{MySQL.MYSQL_URL}}` si disponible

Si `DB_HOST` vaut littéralement `${{MySQL.MYSQLHOST}}` dans les logs, la référence n'est pas résolue → mauvais nom de service.

## Photos R2 (recommandé)

| Variable | Valeur |
|----------|--------|
| `MEDIA_DISK` | `s3` |
| `AWS_ACCESS_KEY_ID` | Access Key ID R2 |
| `AWS_SECRET_ACCESS_KEY` | Secret Access Key R2 |
| `AWS_BUCKET` | `immo2kin-media` |
| `AWS_ENDPOINT` | `https://ACCOUNT_ID.r2.cloudflarestorage.com` |
| `AWS_URL` | `https://pub-xxx.r2.dev` |
| `AWS_DEFAULT_REGION` | `auto` |
| `AWS_USE_PATH_STYLE_ENDPOINT` | `true` |

## Premier déploiement seulement

| Variable | Valeur |
|----------|--------|
| `SEED_DATABASE` | `true` |

Après succès : `false` ou supprimer.

## Inutiles sur Railway MVP (peuvent être supprimées)

- `REDIS_*` — pas de Redis
- `REVERB_*` — pas de WebSocket en prod
- `VITE_*` — le React est compilé au build Docker, pas au runtime
- `SESSION_DOMAIN` — laisser **vide** (ne pas mettre `localhost`)
- `AI_SERVICE_URL` — optionnel (fallback Laravel)

## Diagnostic healthcheck failed

1. **Deploy Logs** du service web :
   - `ERREUR: définissez APP_KEY` → ajouter `APP_KEY`
   - erreur SQL / migrate → ajouter variables `DB_*`
2. Tester : `https://TON-DOMAINE/api/v1/health` → `{"status":"ok",...}`
