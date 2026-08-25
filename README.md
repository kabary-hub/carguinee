# CarGuinée — Plateforme de location & vente de véhicules en Guinée

[![CI](https://github.com/kabary-hub/carguinee/actions/workflows/ci.yml/badge.svg)](https://github.com/kabary-hub/carguinee/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Plateforme complète de location avec chauffeur et de vente de véhicules à Conakry, Guinée.

---

## 🏗️ Architecture

```
carguinee/
├── backend/          # Express.js + Prisma + PostgreSQL
│   ├── src/
│   │   ├── config/       # Config (env, CORS, Swagger)
│   │   ├── lib/          # Utilitaires (prisma, logger, encryption, rate-limiter)
│   │   ├── middleware/    # Middleware (CSRF, security, error, metrics)
│   │   ├── modules/      # 17 modules métier
│   │   └── types/        # Types partagés
│   ├── prisma/        # Schema + migrations
│   └── uploads/       # Photos téléversées
├── frontend/         # React 19 + Vite + Tailwind 4
│   ├── src/
│   │   ├── components/   # Composants réutilisables
│   │   ├── contexts/     # Contextes React (Auth, Toast, Theme)
│   │   ├── hooks/        # Hooks custom
│   │   ├── lib/          # Utilitaires (api, domain, i18n)
│   │   ├── pages/        # Pages (client, owner, admin, legal)
│   │   └── types/        # Types TypeScript
│   └── public/locales/   # Traductions FR/EN
├── docs/             # Documentation
└── docker-compose.yml
```

## ⚡ Démarrage rapide

### Option 1 : Docker (recommandé)

```bash
# Cloner et démarrer
git clone https://github.com/kabary-hub/carguinee.git
cd carguinee
docker compose up

# L'application est accessible sur :
# - Frontend : http://localhost:5173
# - Backend  : http://localhost:3000
# - API Docs : http://localhost:3000/api/docs
```

### Option 2 : Développement local

```bash
# Backend
cd backend
cp .env.example .env          # Adapter la config
npm install
npx prisma migrate dev        # Créer la DB
npm run dev                   # Port 3000

# Frontend (autre terminal)
cd frontend
npm install
npm run dev                   # Port 5173
```

### Comptes de test

| Téléphone | Mot de passe | Rôle |
|-----------|-------------|------|
| `620980117` | `12345678` | Client |
| `620980118` | `12345678` | Propriétaire |
| `620980119` | `12345678` | Administrateur |

## 🛠️ Stack technique

### Backend
| Technologie | Usage |
|-------------|-------|
| **Express.js** | Framework HTTP |
| **Prisma** | ORM PostgreSQL |
| **PostgreSQL 16** | Base de données |
| **JWT** | Authentification |
| **Zod** | Validation des données |
| **Helmet + CSP** | Sécurité HTTP |
| **bcrypt** | Hachage mots de passe |
| **AES-256-GCM** | Chiffrement données sensibles |
| **Winston** | Logging structuré |
| **Swagger** | Documentation API |
| **Sentry** | Monitoring erreurs |

### Frontend
| Technologie | Usage |
|-------------|-------|
| **React 19** | UI framework |
| **Vite** | Build tool |
| **Tailwind CSS 4** | Styling |
| **TanStack Query** | Gestion état serveur |
| **React Router 7** | Routing SPA |
| **i18next** | Internationalisation (FR/EN) |
| **Leaflet** | Carte géolocalisation |
| **React Query** | Cache + refetch automatique |

## 📦 Modules Backend

| Module | Description |
|--------|-------------|
| `auth` | Inscription, connexion, JWT, RGPD, réactivation |
| `vehicles` | CRUD véhicules, photos, publication, validation admin |
| `bookings` | Réservations, transitions de statut, calculs |
| `payments` | Paiements Orange Money (simulation + réel) |
| `boosting` | Boost de visibilité véhicules |
| `reviews` | Système d'avis et notation |
| `favorites` | Véhicules favoris |
| `notifications` | Notifications temps réel |
| `chat` | Messagerie entre utilisateurs |
| `chatbot` | Assistant IA intégré |
| `referrals` | Système de parrainage |
| `contracts` | Contrats de location |
| `reports` | Signalements |
| `admin` | Dashboard admin, validations, modération |
| `owner-requests` | Demandes de passage propriétaire |
| `translate` | Traduction messages (LibreTranslate) |
| `metrics` | Métriques d'utilisation |

## 🔒 Sécurité

| Mesure | Détail |
|--------|--------|
| **Chiffrement AES-256-GCM** | Email, téléphone, CIN chiffrés en DB |
| **CSRF Double-Submit Cookie** | Protection CSRF sur toutes les mutations |
| **Rate Limiting** | 3 niveaux : auth (10/15min), standard (1500/min), strict (20/h) |
| **Content Security Policy** | CSP en mode bloquant avec nonce |
| **CORS strict** | Whitelist d'origines autorisées |
| **JWT httpOnly cookie** | Token inaccessible au JavaScript (production) |
| **Validation Zod** | Toutes les entrées validées server-side |
| **Helmet.js** | Headers de sécurité HTTP |

## 🧪 Tests

```bash
# Backend (143 tests)
cd backend && npm test

# Frontend (202 tests)
cd frontend && npx vitest run
```

| Type | Backend | Frontend |
|------|---------|----------|
| Unitaires | 18 fichiers | 20 fichiers |
| Intégration | 6 fichiers | — |
| Total | 143 tests | 202 tests |

## 🚀 Déploiement

### Variables d'environnement (production)

```bash
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=<clé-64-chars-hex>
ENCRYPTION_KEY=<clé-64-chars-hex>
NODE_ENV=production
CORS_ORIGIN=https://carguinee.com

# Orange Money (optionnel — sinon mode simulation)
OM_APP_KEY=...
OM_APP_SECRET=...
OM_MERCHANT_KEY=...
OM_SANDBOX=false
```

### Build production

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build  # → dist/
```

### Docker production

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📊 API Documentation

L'API Swagger est disponible en mode développement :

- **UI** : http://localhost:3000/api/docs
- **JSON** : http://localhost:3000/api/docs.json

## 📁 Structure des données

```
Vehicle → Photos (1:N)
       → Boosts (1:N)
       → Reviews (1:N)
       → Favorites (1:N)

RentalBooking → Payments (1:N)
              → Vehicle (N:1)
              → Customer (N:1)

User → Vehicles (1:N, propriétaire)
     → Bookings (1:N, client)
     → Notifications (1:N)
     → Messages (1:N)
     → LoyaltyTransactions (1:N)
     → Referrals (1:N)
```

## 📝 Licence

MIT — Voir [LICENSE](LICENSE)
