# Déploiement sur Railway

Guide pas à pas pour héberger **Immo2Kin** sur [Railway](https://railway.com) : une application web (Laravel + React, même origine) et un service IA optionnel.

## Architecture Railway

```text
┌─────────────────────────────────────┐
│  Service « web » (racine du repo)   │
│  Dockerfile → Laravel + SPA React   │
│  MySQL (plugin Railway)             │
└──────────────┬──────────────────────┘
               │ AI_SERVICE_URL
               ▼
┌─────────────────────────────────────┐
│  Service « ai-service » (optionnel) │
│  FastAPI — recommandations          │
└─────────────────────────────────────┘
```

- **Pas de Redis / Reverb** en MVP Railway : sessions en base, broadcast en `log`, temps réel désactivé.
- **Images uploadées** : stockage local éphémère (redéploiement = perte). Pour la prod, prévoir S3 plus tard.

## Prérequis

1. Compte [Railway](https://railway.com)
2. Dépôt Git sur GitHub (voir [README](../README.md#publier-sur-github))
3. Branche `main` à jour

## 1. Créer le projet Railway

1. [railway.com/new](https://railway.com/new) → **Deploy from GitHub repo**
2. Sélectionnez `immo-platform`
3. Railway détecte le `Dockerfile` à la racine et `railway.toml`

## 2. Ajouter MySQL

1. Dans le projet Railway : **+ New** → **Database** → **MySQL**
2. Attendez que la base soit provisionnée

## 3. Configurer le service web

Ouvrez le service créé depuis le repo → **Variables**.

### Générer `APP_KEY`

En local :

```powershell
cd backend
php artisan key:generate --show
```

Copiez la valeur `base64:...` dans Railway.

### Variables obligatoires

| Variable | Valeur |
|----------|--------|
| `APP_NAME` | `Immo2Kin` |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | `base64:...` (généré ci-dessus) |
| `APP_URL` | `https://VOTRE-DOMAINE.up.railway.app` (URL publique du service web) |
| `FRONTEND_URL` | Identique à `APP_URL` (même origine) |
| `LOG_CHANNEL` | `stderr` |
| `LOG_LEVEL` | `info` |

### Base de données (références Railway)

Dans **Variables**, utilisez les références vers le service MySQL :

| Variable | Référence Railway |
|----------|-------------------|
| `DB_CONNECTION` | `mysql` |
| `DB_HOST` | `${{MySQL.MYSQLHOST}}` |
| `DB_PORT` | `${{MySQL.MYSQLPORT}}` |
| `DB_DATABASE` | `${{MySQL.MYSQLDATABASE}}` |
| `DB_USERNAME` | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |

Remplacez `MySQL` par le **nom exact** de votre service MySQL dans Railway.

### Sessions, cache, Sanctum

| Variable | Valeur |
|----------|--------|
| `SESSION_DRIVER` | `database` |
| `SESSION_SECURE_COOKIE` | `true` |
| `SESSION_DOMAIN` | *(laisser vide)* |
| `CACHE_STORE` | `file` |
| `QUEUE_CONNECTION` | `sync` |
| `BROADCAST_CONNECTION` | `log` |
| `FILESYSTEM_DISK` | `local` |
| `SANCTUM_STATEFUL_DOMAINS` | `VOTRE-DOMAINE.up.railway.app` (sans `https://`) |
| `CORS_ALLOWED_ORIGINS` | `https://VOTRE-DOMAINE.up.railway.app` |

### Stockage images (Cloudflare R2 / S3)

Les photos doivent être sur un stockage cloud persistant. Voir le guide détaillé : **[media-storage.md](media-storage.md)**.

| Variable | Exemple R2 |
|----------|------------|
| `MEDIA_DISK` | `s3` |
| `AWS_ACCESS_KEY_ID` | token R2 |
| `AWS_SECRET_ACCESS_KEY` | secret R2 |
| `AWS_DEFAULT_REGION` | `auto` |
| `AWS_BUCKET` | `immo2kin-media` |
| `AWS_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `AWS_URL` | `https://pub-xxx.r2.dev` |
| `AWS_USE_PATH_STYLE_ENDPOINT` | `true` |

**Migrer vos images locales :**

```powershell
cd backend
php artisan property-media:export
# Puis sur Railway (après seed) :
php artisan property-media:import storage/app/media-export
```

L’ordre des photos est préservé via `sort_order` dans le manifeste.

### Données de démo (premier déploiement)

| Variable | Valeur |
|----------|--------|
| `SEED_DATABASE` | `true` |

Après le premier déploiement réussi, repassez à `false` ou supprimez la variable pour éviter de re-seeder à chaque redéploiement.

### Microservice IA (optionnel, étape 4)

| Variable | Valeur |
|----------|--------|
| `AI_SERVICE_URL` | URL publique du service `ai-service` (ex. `https://ai-xxx.up.railway.app`) |
| `AI_SERVICE_API_KEY` | Clé secrète partagée (générez une chaîne aléatoire) |

## 4. Service IA (optionnel)

1. **+ New** → **GitHub Repo** → même dépôt
2. **Settings** → **Root Directory** : `ai-service`
3. Railway utilise `ai-service/Dockerfile` et `ai-service/railway.toml`
4. Variables :

| Variable | Valeur |
|----------|--------|
| `API_KEY` | Même valeur que `AI_SERVICE_API_KEY` sur le service web |

5. Générez un domaine public pour ce service
6. Copiez l’URL dans `AI_SERVICE_URL` du service web
7. Redéployez le service web

Sans ce service, les recommandations utilisent le **fallback Laravel** (comportement normal).

## 5. Domaine public

1. Service web → **Settings** → **Networking** → **Generate Domain**
2. Mettez à jour `APP_URL`, `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS` et `CORS_ALLOWED_ORIGINS` avec ce domaine
3. Redéployez

## 6. Vérification

| URL | Attendu |
|-----|---------|
| `https://VOTRE-DOMAINE.up.railway.app/api/v1/health` | JSON `{"status":"ok",...}` |
| `https://VOTRE-DOMAINE.up.railway.app/` | Interface React Immo2Kin |
| `https://VOTRE-DOMAINE.up.railway.app/login` | Page de connexion (routing SPA) |

Connexion démo (si `SEED_DATABASE=true`) :

- `client@immo.local` / `password`
- `admin@immo.local` / `password`

## Ce qui se passe au démarrage

Le script `docker/start-web.sh` :

1. Mappe les variables MySQL Railway si besoin
2. Exécute `php artisan migrate --force`
3. Crée le lien `storage` public
4. Seed optionnel si `SEED_DATABASE=true`
5. Lance `php artisan serve` sur le port `$PORT` Railway

Le build Docker :

1. Compile le frontend React (`VITE_API_URL` vide → appels `/api` relatifs)
2. Copie le build dans `backend/public/`
3. Installe les dépendances PHP (production)

## Limitations connues

| Fonctionnalité | Railway MVP |
|----------------|-------------|
| WebSockets (messagerie temps réel) | Non (Reverb non déployé) |
| Upload photos persistant | Oui avec R2/S3 (`MEDIA_DISK=s3`) |
| Redis / queues async | Non |
| E-mails | `MAIL_MAILER=log` (pas d’envoi réel) |
| Stripe / Mobile Money | Configurer les clés si besoin |

## Dépannage

### Build Docker échoue

- Vérifiez les logs Railway **Build**
- Test local : `docker build -t immo2kin .` à la racine du repo

### Erreur 500 / APP_KEY

- `APP_KEY` doit être défini avant le premier démarrage

### Connexion impossible (CSRF / session)

- `SANCTUM_STATEFUL_DOMAINS` = hostname exact (sans port ni protocole)
- `APP_URL` et `FRONTEND_URL` en `https://`
- `SESSION_SECURE_COOKIE=true`

### Migrations échouent

- Vérifiez les références `${{MySQL.*}}` et le nom du service MySQL
- Consultez les logs **Deploy** du service web

### Page blanche sur `/properties/1`

- Le fallback SPA est dans `backend/routes/web.php`
- Vérifiez que le build frontend est bien dans l’image (logs build)

## Fichiers de configuration

| Fichier | Rôle |
|---------|------|
| `Dockerfile` | Image web (Laravel + React) |
| `docker/start-web.sh` | Démarrage et migrations |
| `railway.toml` | Healthcheck `/api/v1/health` |
| `ai-service/Dockerfile` | Image FastAPI |
| `ai-service/railway.toml` | Healthcheck `/health` |
| `.dockerignore` | Exclut `node_modules`, `.env`, etc. |

## Mise à jour

Chaque push sur `main` déclenche un redéploiement automatique si l’intégration GitHub est active.

```powershell
git add .
git commit -m "fix: ..."
git push origin main
```
