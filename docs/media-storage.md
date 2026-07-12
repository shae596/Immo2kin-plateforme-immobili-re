# Stockage cloud des images d'annonces

Guide pour persister les photos sur **AWS S3** ou **Cloudflare R2** (compatible S3), avec export/import préservant l’**ordre** (`sort_order`).

## Principe

| Élément | Où |
|---------|-----|
| Fichiers image | Cloud (`MEDIA_DISK=s3`) |
| Ordre + rattachement annonce | MySQL (`property_images.sort_order`) |

Le cloud ne gère pas l’ordre seul : c’est la base qui le définit. Les deux ensemble garantissent une galerie correcte après redéploiement Railway.

## Configuration Cloudflare R2 (recommandé, gratuit au départ)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → créer un bucket (ex. `immo2kin-media`)
2. **Manage R2 API Tokens** → token avec lecture/écriture sur le bucket
3. Activer l’accès public (domaine `*.r2.dev` ou domaine personnalisé)

Variables Laravel (service web Railway ou `.env` local) :

```env
MEDIA_DISK=s3
AWS_ACCESS_KEY_ID=<r2_access_key_id>
AWS_SECRET_ACCESS_KEY=<r2_secret>
AWS_DEFAULT_REGION=auto
AWS_BUCKET=immo2kin-media
AWS_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
AWS_URL=https://pub-<hash>.r2.dev
AWS_USE_PATH_STYLE_ENDPOINT=true
```

Pour **AWS S3** classique : même schéma, sans `AWS_ENDPOINT` ni `use_path_style`, région ex. `eu-west-3`.

## Workflow : exporter en local, importer sur Railway

### Étape 1 — Export (machine locale)

```powershell
cd backend
php artisan property-media:export
```

Crée `storage/app/media-export/` :

```text
media-export/
├── manifest.json    # titres annonces + sort_order + noms fichiers
└── files/
    └── properties/
        └── 44/images/01-exterieur.jpg
```

Le rattachement se fait par **titre d’annonce** (stable entre environnements), l’ordre par **`sort_order`**.

### Étape 2 — Déployer Railway

Suivre [railway.md](railway.md) : MySQL, variables, `SEED_DATABASE=true` pour le premier déploiement.

Configurer **R2/S3** sur le service web (`MEDIA_DISK=s3` + variables ci-dessus).

### Étape 3 — Importer sur Railway

**Automatique (recommandé)** : le déploiement exécute `property-media:rehydrate` au démarrage si `MEDIA_DISK=s3`.  
Le manifeste `deploy/property-media/manifest.json` (dans le repo) associe chaque photo **déjà présente sur R2** aux annonces seedées (par titre d’annonce).

Option A — **Railway CLI** (import fichier par fichier depuis un export local) :

```powershell
# Zipper l'export
Compress-Archive -Path backend\storage\app\media-export\* -DestinationPath media-export.zip

# Uploader et exécuter dans le conteneur (après connexion railway link)
railway run php artisan property-media:import storage/app/media-export
```

Option B — **Copier via sync cloud** si les IDs d’annonces sont identiques :

```powershell
# Local : configurer MEDIA_DISK=s3 (mêmes credentials que Railway)
php artisan property-media:sync-cloud --from=public
```

Copie chaque fichier listé en base vers R2 **sans changer les chemins** (nécessite les mêmes `property_id` qu’en local).

Option C — **Import avec manifeste** (IDs différents après seed) :

```powershell
php artisan property-media:import storage/app/media-export
# Simulation d'abord :
php artisan property-media:import storage/app/media-export --dry-run
```

L’import :

1. Lit `manifest.json`
2. Trouve chaque annonce par `property_title`
3. Upload les fichiers vers le disque configuré (`s3`)
4. Crée les lignes `property_images` avec le bon `sort_order`

### Étape 4 — Vérifier

```powershell
php artisan property-media:export storage/app/media-check  # optionnel
# ou lister en base :
php scripts/list-images.php
```

## Commandes disponibles

| Commande | Description |
|----------|-------------|
| `property-media:export [dossier]` | Export fichiers + `manifest.json` |
| `property-media:import [dossier] [--dry-run] [--replace]` | Import par titre, ordre préservé |
| `property-media:sync-cloud [--from=public] [--dry-run]` | Local → S3, mêmes chemins en base |

## Nouveaux uploads en production

Avec `MEDIA_DISK=s3`, les uploads via l’API partent directement sur R2/S3 (`PropertyMediaService`). Aucune action supplémentaire.

## Dépannage

### Images cassées (404)

- Vérifier `AWS_URL` (URL publique du bucket)
- Vérifier que l’objet existe dans le bucket au chemin `properties/{id}/images/...`
- Vérifier `property_images.path` en base

### Mauvais ordre

- Vérifier `sort_order` en base pour l’annonce
- Ré-importer avec `--replace` si besoin

### Annonce introuvable à l’import

- Le titre en base Railway doit correspondre **exactement** au `property_title` du manifeste
- Relancer les seeders ou ajuster le manifeste

## Fichiers concernés

- `config/filesystems.php` — `media_disk`, disque `s3`
- `app/Support/MediaStorage.php` — disque actif
- `app/Console/Commands/ExportPropertyMediaCommand.php`
- `app/Console/Commands/ImportPropertyMediaCommand.php`
- `app/Console/Commands/SyncPropertyMediaToCloudCommand.php`
