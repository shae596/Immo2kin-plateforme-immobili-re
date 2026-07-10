# API — Conventions v1

## Base URL

- Local : `http://localhost:8000/api`
- Version : préfixe `/v1`

## Health

```http
GET /api/v1/health
```

## Authentification (Sanctum SPA)

1. `GET /sanctum/csrf-cookie`
2. `POST /api/v1/auth/login` (ou `register`)
3. Requêtes suivantes avec cookies (`withCredentials: true`)

### Endpoints auth

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/v1/auth/register` | — | Inscription (rôle : client, proprietaire, agence) |
| POST | `/v1/auth/login` | — | Connexion (throttle 5/min) |
| POST | `/v1/auth/logout` | oui | Déconnexion |
| GET | `/v1/auth/me` | oui | Utilisateur courant |
| PUT | `/v1/auth/profile` | oui | Mise à jour profil |
| POST | `/v1/auth/forgot-password` | — | Lien reset mot de passe |
| POST | `/v1/auth/reset-password` | — | Réinitialisation |
| GET | `/v1/auth/email/verify/{id}/{hash}` | oui | Vérification e-mail (signed URL) |
| POST | `/v1/auth/email/verification-notification` | oui | Renvoi e-mail vérification |

### Pages frontend (Phase 1–2)

| Route | Description |
|-------|-------------|
| `/login` | Connexion |
| `/register` | Inscription |
| `/forgot-password` | Demande de reset |
| `/reset-password?token=…&email=…` | Nouveau mot de passe |
| `/verify-email/{id}/{hash}?expires=…&signature=…` | Vérification e-mail (connexion requise) |
| `/dashboard` | Profil utilisateur |
| `/properties` | Liste des annonces (recherche avancée) |
| `/properties/map` | Carte Leaflet des annonces |
| `/properties/:id` | Détail d'une annonce |
| `/my/properties` | Mes annonces (propriétaire/agence/admin) |
| `/my/properties/new` | Créer une annonce |
| `/my/properties/:id/edit` | Modifier une annonce |
| `/favorites` | Mes favoris |
| `/reservations` | Mes réservations (client) |
| `/my/properties/reservations` | Demandes reçues (propriétaire) |
| `/my/verification` | Demandes de vérification (propriétaire/agence) |
| `/admin/verifications` | File de vérifications (admin) |

Les e-mails de vérification et de reset pointent vers `FRONTEND_URL` (config `app.frontend_url`).

### Exemple — inscription

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "password": "Password1!",
  "password_confirmation": "Password1!",
  "role": "client",
  "phone": "+243900000001"
}
```

### Exemple — utilisateur (`UserResource`)

```json
{
  "id": 1,
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "phone": "+243900000001",
  "avatar": null,
  "bio": null,
  "city": "Kinshasa",
  "commune": "Gombe",
  "email_verified_at": null,
  "roles": ["client"],
  "created_at": "2026-05-31T12:00:00+00:00",
  "updated_at": "2026-05-31T12:00:00+00:00"
}
```

## Annonces (Phase 2)

### Endpoints properties

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/v1/properties` | — | Liste annonces publiées (recherche + filtres + pagination) |
| GET | `/v1/properties/map` | — | Marqueurs carte (annonces géolocalisées, mêmes filtres) |
| GET | `/v1/properties/{id}` | — | Détail annonce (brouillons : owner/admin) |
| GET | `/v1/my/properties` | oui | Annonces du propriétaire connecté |
| POST | `/v1/properties` | oui | Créer une annonce |
| PUT | `/v1/properties/{id}` | oui | Mettre à jour |
| DELETE | `/v1/properties/{id}` | oui | Supprimer |

Query params liste / carte (throttle `search` : 60 req/min) :

| Paramètre | Description |
|-----------|-------------|
| `q` | Recherche texte (titre, description, adresse, commune) |
| `city`, `commune` | Localisation |
| `type` | Type de bien (`appartement`, `maison`, `villa`, …) |
| `listing_type` | `rent` ou `sale` |
| `min_price`, `max_price` | Fourchette de prix (USD) |
| `min_rooms`, `min_area` | Chambres / surface minimum |
| `has_kitchen`, `has_living_room`, `has_store` | Booléens (`true` / `1`) |
| `amenity_ids[]` | IDs équipements (tableau) |
| `lat`, `lng`, `radius_km` | Filtre géographique (Haversine, km) |
| `sort` | `newest`, `price_asc`, `price_desc`, `area_desc` |
| `page`, `per_page` | Pagination liste (défaut 12, max 50) |

La route `/map` renvoie jusqu’à 200 marqueurs `{ id, title, price, currency, type, listing_type, city, commune, latitude, longitude }` pour les annonces **publiées** avec coordonnées.

### Médias

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/v1/properties/{id}/images` | oui | Upload photo (multipart, max 5 Mo) |
| DELETE | `/v1/properties/{id}/images/{imageId}` | oui | Supprimer photo |
| POST | `/v1/properties/{id}/videos` | oui | Upload vidéo (max 50 Mo) |
| DELETE | `/v1/properties/{id}/videos/{videoId}` | oui | Supprimer vidéo |

Uploads throttle : 20/min par utilisateur.

### Endpoints réservations (Phase 4)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/v1/properties/{id}/availability` | — | Calendrier (plages bloquées `pending`/`confirmed`) |
| GET | `/v1/reservations` | oui | Mes réservations (client) |
| GET | `/v1/my/properties/reservations` | oui | Demandes sur mes biens (propriétaire/agence) |
| GET | `/v1/reservations/{id}` | oui | Détail (client, proprio ou admin) |
| POST | `/v1/properties/{id}/reservations` | oui | Créer une demande (location uniquement) |
| POST | `/v1/reservations/{id}/confirm` | oui | Confirmer (propriétaire) |
| POST | `/v1/reservations/{id}/reject` | oui | Refuser (propriétaire) |
| POST | `/v1/reservations/{id}/cancel` | oui | Annuler (client, proprio ou admin) |

### Paiements (Phase 5)

Règles : réservation **confirmée**, **client** uniquement, un seul paiement réussi par réservation.

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/v1/payments/{id}` | oui | Détail d'un paiement (client) |
| POST | `/v1/reservations/{id}/payments/stripe` | oui | Initier Stripe (PaymentIntent + `client_secret`) |
| POST | `/v1/payments/{id}/stripe/confirm` | oui | Confirmer après Elements / mode test |
| POST | `/v1/reservations/{id}/payments/mobile-money` | oui | Initier Mobile Money (orange, airtel, mpesa) |
| POST | `/v1/payments/{id}/mobile-money/confirm` | oui | Confirmer après push USSD (dev / manuel) |
| POST | `/v1/webhooks/stripe` | — | Webhook Stripe (`payment_intent.succeeded`, etc.) |

Variables : `STRIPE_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET` (backend) ; `VITE_STRIPE_PUBLISHABLE_KEY` (frontend). Sans clés Stripe, l'API utilise une gateway simulée (`FakeStripePaymentGateway`).

Exemple — Mobile Money :

```http
POST /api/v1/reservations/12/payments/mobile-money
Content-Type: application/json

{
  "phone": "+243900000001",
  "provider": "orange"
}
```

Réponse : `payment`, `instructions` (texte USSD simulé).

Les réponses `ReservationResource` incluent `paid_at` et `is_paid`.

### Messagerie (Phase 6)

Une conversation par couple **annonce + client**. Le propriétaire répond dans le fil existant.

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/v1/conversations` | oui | Mes conversations (+ `unread_total`) |
| GET | `/v1/conversations/{id}` | oui | Détail |
| GET | `/v1/conversations/{id}/messages` | oui | Messages (marque lus) |
| POST | `/v1/conversations/{id}/messages` | oui | Envoyer un message |
| POST | `/v1/conversations/{id}/read` | oui | Marquer comme lu |
| POST | `/v1/properties/{id}/conversations` | oui | Démarrer ou continuer (client) |

WebSocket : canal privé `conversation.{id}`, événement `message.sent`.

Page frontend : `/messages` ; formulaire sur fiche annonce (utilisateur connecté, non propriétaire).

### Avis & vérifications (Phase 7)

**Avis** — après un séjour **confirmé** et **terminé** (`end_date` passée), un client peut noter l'annonce (1–5 étoiles + commentaire optionnel). Un avis par client et par annonce.

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/v1/properties/{id}/reviews` | — | Liste + `meta.summary` (moyenne, count) + `can_review` si connecté |
| POST | `/v1/properties/{id}/reviews` | oui | Publier un avis |
| PUT | `/v1/reviews/{id}` | oui | Modifier son avis |
| DELETE | `/v1/reviews/{id}` | oui | Supprimer son avis |

`PropertyResource` inclut `is_verified`, `verified_at`, `reviews_summary`.  
`UserResource` inclut `is_verified`, `verified_at`.

**Vérifications** — propriétaires / agences demandent la validation admin (identité ou annonce).

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/v1/verifications` | oui | Mes demandes |
| POST | `/v1/verifications` | oui | Soumettre (`type`: `identity` \| `property`, `property_id?`, `notes?`) |
| GET | `/v1/verifications/{id}` | oui | Détail |
| GET | `/v1/admin/verifications` | admin | File d'attente |
| POST | `/v1/admin/verifications/{id}/approve` | admin | Approuver (`admin_notes?`) |
| POST | `/v1/admin/verifications/{id}/reject` | admin | Refuser (`admin_notes?`) |

Pages frontend : section avis sur `/properties/:id` ; `/my/verification` (proprio) ; `/admin/verifications`.

### Recommandations (Phase 8)

Tracking implicite (vue annonce, favori, réservation, avis) + endpoint explicite pour les recherches.

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/v1/recommendations` | optionnel | Personnalisé si connecté, sinon populaire |
| GET | `/v1/properties/{id}/similar` | — | Annonces similaires (même ville/type/prix) |
| POST | `/v1/recommendation-events` | oui | Enregistrer un événement (`event_type`, `property_id?`, `metadata?`) |

Le backend appelle le microservice `ai-service` (`POST /api/v1/recommendations/rank`, `POST /api/v1/similar/rank`) avec repli local si indisponible.

Pages frontend : accueil (section recommandations), fiche annonce (similaires).

Corps création : `start_date`, `end_date` (ISO date), `guests?`, `message?`.  
Prix estimé : `(prix_mensuel / 30) × nuits` (dates inclusives).  
Statuts : `pending`, `confirmed`, `cancelled`, `rejected`.

### Équipements & favoris

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/v1/amenities` | — | Liste des équipements |
| GET | `/v1/favorites` | oui | Annonces favorites |
| POST | `/v1/favorites/{propertyId}` | oui | Ajouter aux favoris |
| DELETE | `/v1/favorites/{propertyId}` | oui | Retirer des favoris |

### Admin — utilisateurs connectés (Phase 2+)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/v1/admin/active-sessions` | admin | Sessions actives (table `sessions`, `SESSION_DRIVER=database`) |

Page frontend : `/admin/active-users` (rôle `admin` uniquement).

### Exemple — créer une annonce

```http
POST /api/v1/properties
Content-Type: application/json

{
  "title": "Appartement Gombe",
  "description": "3 chambres, vue fleuve.",
  "price": 1200,
  "city": "Kinshasa",
  "commune": "Gombe",
  "type": "appartement",
  "rooms": 3,
  "bathrooms": 2,
  "area": 120,
  "status": "published",
  "amenity_ids": [1, 2, 3]
}
```

### Exemple — annonce (`PropertyResource`)

```json
{
  "id": 1,
  "title": "Appartement Gombe",
  "description": "3 chambres, vue fleuve.",
  "status": "published",
  "price": "1200.00",
  "currency": "USD",
  "city": "Kinshasa",
  "commune": "Gombe",
  "address": null,
  "latitude": null,
  "longitude": null,
  "rooms": 3,
  "bathrooms": 2,
  "area": "120.00",
  "type": "appartement",
  "owner": { "id": 2, "name": "Propriétaire Demo" },
  "images": [{ "id": 1, "url": "http://localhost:8000/storage/properties/1/images/uuid.jpg", "sort_order": 0 }],
  "videos": [],
  "amenities": [{ "id": 1, "name": "Wi-Fi", "icon": "wifi" }],
  "is_favorited": false,
  "created_at": "2026-05-31T14:00:00+00:00",
  "updated_at": "2026-05-31T14:00:00+00:00"
}
```

## Rôles (RBAC)

| Rôle | Description |
|------|-------------|
| `client` | Locataire / acheteur |
| `proprietaire` | Propriétaire de biens |
| `agence` | Agence immobilière |
| `admin` | Administration (assigné via seeder) |

Gestion via `spatie/laravel-permission`.

## Erreurs

Format JSON unifié :

```json
{
  "message": "The given data was invalid.",
  "errors": { "email": ["Cette adresse e-mail est déjà utilisée."] },
  "code": "validation_error"
}
```
