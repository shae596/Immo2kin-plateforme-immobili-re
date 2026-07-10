# Immo2Kin — Plateforme immobilière (Kinshasa, RDC)

Monorepo complet pour la gestion d’annonces immobilières : recherche, carte, favoris, réservations, paiements, messagerie, avis, vérifications et recommandations intelligentes.

**État du projet :** phases 0 à 8 terminées — **74 tests** backend passants.

## Fonctionnalités principales

| Domaine | Détails |
|---------|---------|
| **Annonces** | CRUD, types (appartement, maison, villa, terrain, bureau, commerce…), location & vente, photos, équipements |
| **Recherche** | Filtres avancés, tri, pagination, carte Leaflet géolocalisée (Kinshasa) |
| **Comptes** | Client, propriétaire, agence, admin — auth Sanctum SPA, profils, rôles Spatie |
| **Réservations** | Calendrier de disponibilité, demandes, confirmation / refus / annulation |
| **Paiements** | Stripe + Mobile Money (simulation RDC) |
| **Messagerie** | Conversations client ↔ propriétaire, temps réel (Reverb) |
| **Avis & confiance** | Notes après séjour, vérification identité / annonce, badges « Vérifié » |
| **Recommandations** | Moteur hybride FastAPI + fallback Laravel, annonces similaires |
| **Admin** | Utilisateurs, annonces, réservations, paiements, vérifications, sessions actives |

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| API | Laravel 12, Sanctum, REST `/api/v1` |
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router, Zustand |
| Temps réel | Laravel Reverb + Laravel Echo |
| Cache / files | Redis (Predis), MySQL 8.4 |
| IA | FastAPI (`ai-service`) — scoring recommandations |
| Infra | Docker Compose (`infra/docker`) |

## Structure du dépôt

```text
immo-platform/
├── backend/          # API Laravel (clean architecture)
├── frontend/         # SPA React
├── ai-service/       # Microservice recommandations (FastAPI)
├── infra/docker/     # MySQL, Redis, AI service
├── docs/             # Architecture, API, base de données
├── scripts/          # Installation et démarrage (PowerShell / bash)
├── .env.example      # Variables d’environnement (référence)
└── README.md
```

## Prérequis

- PHP 8.2+ (mbstring, openssl, pdo_mysql)
- Composer 2
- Node.js 20+ et npm
- Docker Desktop (recommandé pour MySQL / Redis)
- Python 3.11+ (pour `ai-service`, optionnel en dev)

## Installation

### Automatique (Windows)

```powershell
cd C:\chemin\vers\immo-platform
.\scripts\setup.ps1
```

### Manuelle

```powershell
# Backend
cd backend
copy .env.example .env
php artisan key:generate
composer install
php artisan migrate
php artisan db:seed
php artisan storage:link

# Frontend
cd ..\frontend
copy .env.example .env
npm install
```

### Base de données

**Avec Docker (recommandé) :**

```powershell
.\scripts\switch-to-docker.ps1
docker compose -f infra/docker/docker-compose.yml up -d mysql redis
cd backend
php artisan migrate
php artisan db:seed
```

MySQL Docker : port **3307** (évite le conflit avec un MySQL local sur 3306).

**Sans Docker :**

```powershell
.\scripts\switch-to-fallback.ps1
```

Utilise SQLite + cache/session fichier (voir script).

### Géolocalisation des annonces (carte)

Les coordonnées GPS sont renseignées automatiquement à la création/mise à jour selon la commune. Pour les annonces existantes :

```powershell
cd backend
php artisan properties:backfill-coordinates
```

Annonces de démo supplémentaires (10 communes variées) :

```powershell
php artisan db:seed --class=ExtraPropertySeeder
```

## Démarrage en développement

```powershell
.\scripts\start-dev.ps1 -Docker
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000 |
| Health API | http://localhost:8000/api/v1/health |
| Reverb (WebSocket) | ws://localhost:8080 |
| AI service | http://localhost:8001/health |

**Upload photos :** utiliser `.\scripts\serve-backend.ps1` ou `start-dev.ps1` (limite 12 Mo). Vérifier `GET /api/v1/health` → `"upload_max_filesize": "12M"`.

En dev, laisser `VITE_API_URL` vide dans `frontend/.env` pour le proxy Vite (cookies CSRF fiables).

## Comptes de démonstration

Après `php artisan db:seed` :

| Rôle | E-mail | Mot de passe |
|------|--------|--------------|
| Client | `client@immo.local` | `password` |
| Propriétaire | `proprietaire@immo.local` | `password` |
| Administrateur | `admin@immo.local` | `password` |

## Tests

```powershell
cd backend
php artisan test
```

Résultat attendu : **74 tests passants**.

## Documentation

- [Architecture](docs/architecture.md)
- [API REST](docs/api.md)
- [Schéma BDD](docs/database.md)

## Publier sur GitHub

1. Créer un dépôt vide sur [github.com](https://github.com/new) (sans README ni .gitignore).
2. À la racine du projet :

```powershell
git init
git add .
git commit -m "Initial commit — plateforme Immo2Kin (phases 0-8)"
git branch -M main
git remote add origin https://github.com/VOTRE_COMPTE/immo-platform.git
git push -u origin main
```

Le dossier `.cursor/` (config éditeur local) est exclu via `.gitignore` et ne sera pas poussé.

## Licence

Projet privé — tous droits réservés.
