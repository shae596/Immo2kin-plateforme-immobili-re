# Architecture — Immo2Kin

## Monorepo

| Dossier | Rôle |
|---------|------|
| `backend/` | API Laravel 12 (REST, Sanctum SPA, queues, broadcasting) |
| `frontend/` | SPA React + Vite + Tailwind |
| `ai-service/` | Microservice FastAPI (recommandations IA) |
| `infra/` | Docker Compose, nginx, scripts déploiement |
| `docs/` | Documentation technique |
| `scripts/` | Scripts de démarrage développement |

## Backend — Clean architecture

```
app/
  Http/Controllers/Api/V1/   # Contrôleurs minces
  Http/Requests/               # Validation
  Http/Resources/              # Sérialisation API
  Services/                    # Logique métier
  Repositories/                # Accès données
  Policies/                    # Autorisation
  Events/ Listeners/           # Domain events
  Jobs/ Notifications/         # Async & notifications
```

## Auth & temps réel

- **Sanctum** : cookies + CSRF pour le SPA React
- **Reverb** : WebSockets (Laravel Echo côté frontend)
- **Redis** : cache, sessions, queues, broadcasting

## Phases de livraison

Voir le plan validé : Phase 0 (bootstrap) → Phase 1 (Auth) → … → Phase 9 (IA).
