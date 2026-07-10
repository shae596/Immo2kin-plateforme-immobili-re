# Base de données — Schéma v1

## Phase 1 — Auth & comptes

### `users`

| Colonne | Type | Notes |
|---------|------|-------|
| id | bigint | PK |
| name | string | |
| email | string | unique |
| phone | string(20) | nullable |
| avatar | string | nullable, chemin storage |
| bio | text | nullable |
| city | string | nullable |
| commune | string | nullable |
| email_verified_at | timestamp | nullable |
| password | string | |
| remember_token | string | |
| timestamps | | |

### RBAC (Spatie)

Tables : `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions`.

Rôles seedés : `client`, `proprietaire`, `agence`, `admin`.

## Phase 2 — Annonces & favoris

### `properties`

| Colonne | Type | Notes |
|---------|------|-------|
| id | bigint | PK |
| owner_id | bigint | FK → users |
| title | string | |
| description | text | nullable |
| status | string | draft, published, archived |
| price | decimal(12,2) | |
| currency | string(3) | défaut USD |
| city | string | index composite |
| commune | string | index composite |
| address | string | nullable |
| latitude | decimal(10,7) | nullable |
| longitude | decimal(10,7) | nullable |
| rooms | tinyint | nullable |
| bathrooms | tinyint | nullable |
| area | decimal(10,2) | m², nullable |
| type | string | appartement, maison, villa, … |
| listing_type | string | rent, sale |
| has_kitchen | boolean | |
| has_living_room | boolean | salon / séjour |
| has_store | boolean | débarras / réserve |
| timestamps | | |

Index : `(city, commune, type, price)`, `(latitude, longitude)`, `status`.

### `property_images`

| Colonne | Type | Notes |
|---------|------|-------|
| id | bigint | PK |
| property_id | bigint | FK → properties |
| path | string | storage public |
| sort_order | smallint | ordre d'affichage |
| timestamps | | |

### `property_videos`

| Colonne | Type | Notes |
|---------|------|-------|
| id | bigint | PK |
| property_id | bigint | FK → properties |
| path | string | storage public |
| timestamps | | |

### `amenities` + `property_amenity`

Équipements (Wi-Fi, Parking, …) liés aux annonces via pivot `(property_id, amenity_id)`.

### `favorites`

| Colonne | Type | Notes |
|---------|------|-------|
| id | bigint | PK |
| user_id | bigint | FK → users |
| property_id | bigint | FK → properties |
| timestamps | | |

Contrainte unique : `(user_id, property_id)`.

## Phase 4 — Réservations

### `reservations`

| Colonne | Type | Notes |
|---------|------|-------|
| id | bigint | PK |
| property_id | bigint | FK → properties |
| user_id | bigint | FK → users (client) |
| start_date | date | arrivée (inclusive) |
| end_date | date | départ (inclusive) |
| status | string | pending, confirmed, cancelled, rejected |
| guests | smallint | nullable |
| total_price | decimal(12,2) | estimation au moment de la demande |
| currency | string(3) | |
| message | text | nullable |
| paid_at | timestamp | nullable, renseigné après paiement réussi |
| timestamps | | |

Index : `(property_id, status)`, `(user_id, status)`, `(property_id, start_date, end_date)`.

Les dates `pending` et `confirmed` bloquent le calendrier (pas de chevauchement).

## Phase 5 — Paiements

### `payments`

| Colonne | Type | Notes |
|---------|------|-------|
| id | bigint | PK |
| reservation_id | bigint | FK → reservations |
| user_id | bigint | FK → users (client payeur) |
| amount | decimal(12,2) | montant de la réservation |
| currency | string(3) | |
| method | string | stripe, mobile_money |
| status | string | pending, processing, paid, failed, cancelled |
| provider | string | stripe, orange, airtel, mpesa |
| provider_payment_id | string | nullable (PaymentIntent Stripe, ref. MM) |
| mobile_phone | string | nullable |
| metadata | json | nullable (client_secret, instructions, etc.) |
| paid_at | timestamp | nullable |
| timestamps | | |

Index : `(reservation_id, status)`, `(user_id)`, `(provider, provider_payment_id)`.

## Phase 6 — Messagerie

### `conversations`

| Colonne | Type | Notes |
|---------|------|-------|
| id | bigint | PK |
| property_id | bigint | FK → properties |
| client_id | bigint | FK → users (initiateur) |
| owner_id | bigint | FK → users (propriétaire) |
| reservation_id | bigint | nullable |
| last_message_at | timestamp | nullable |
| timestamps | | |

Contrainte unique : `(property_id, client_id)`.

### `messages`

| Colonne | Type | Notes |
|---------|------|-------|
| id | bigint | PK |
| conversation_id | bigint | FK → conversations |
| user_id | bigint | FK → users (expéditeur) |
| body | text | |
| read_at | timestamp | nullable |
| timestamps | | |

## Phase 7 — Avis & vérifications

Colonnes ajoutées :

- `users.verified_at` — identité propriétaire/agence validée par l'admin
- `properties.verified_at` — annonce validée par l'admin

### `reviews`

| Colonne | Type | Notes |
|---------|------|-------|
| id | bigint | PK |
| property_id | bigint | FK → properties |
| user_id | bigint | FK → users (auteur) |
| reservation_id | bigint | nullable, FK → reservations |
| rating | tinyint | 1–5 |
| comment | text | nullable |
| timestamps | | |

Contrainte unique : `(property_id, user_id)`.  
Règle : séjour `confirmed` avec `end_date` ≤ aujourd'hui.

### `verifications`

| Colonne | Type | Notes |
|---------|------|-------|
| id | bigint | PK |
| user_id | bigint | FK → users (demandeur) |
| property_id | bigint | nullable, FK → properties |
| type | string | `identity`, `property` |
| status | string | `pending`, `approved`, `rejected` |
| document_path | string | nullable (upload futur) |
| notes | text | nullable |
| admin_notes | text | nullable |
| reviewed_by | bigint | nullable, FK → users |
| reviewed_at | timestamp | nullable |
| timestamps | | |

## Phase 8 — Recommandations

### `recommendation_events`

| Colonne | Type | Notes |
|---------|------|-------|
| id | bigint | PK |
| user_id | bigint | nullable, FK → users |
| property_id | bigint | nullable, FK → properties |
| event_type | string | view, favorite, unfavorite, search, reservation, review |
| metadata | json | nullable (filtres recherche, etc.) |
| timestamps | | |

Index : `(user_id, event_type, created_at)`, `(property_id, event_type)`.

Alimente le moteur de recommandation (profil comportemental + similarité de contenu).

## MySQL

- Base : `immo_platform`
- Charset : `utf8mb4_unicode_ci`
- Docker : service `mysql` dans `infra/docker/docker-compose.yml`

## Comptes de démo (seeder)

| E-mail | Mot de passe | Rôle |
|--------|--------------|------|
| admin@immo.local | password | admin |
| client@immo.local | password | client |
| proprietaire@immo.local | password | proprietaire |
| sharonemulembweng@gmail.com | password | admin |

Le seeder crée 10 équipements, 8 annonces de démo (7 publiées, 1 brouillon) et **2 réservations** (client → propriétaire). Champs pièces : `has_kitchen`, `has_living_room`, `has_store`, `listing_type` (rent/sale).

Pour recharger uniquement les réservations démo :

```powershell
cd backend
php artisan db:seed --class=ReservationSeeder
```
