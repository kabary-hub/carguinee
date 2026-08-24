# CarGuinée 🚗

Plateforme de **vente et location de véhicules** à Conakry, Guinée.

- **Frontend** : React 19 + TypeScript + Tailwind CSS v4 + Vite
- **Backend** : Express 5 + TypeScript + Prisma ORM + PostgreSQL
- **Auth** : JWT (httpOnly cookies + Bearer token)
- **Email** : Resend
- **Monitoring** : Sentry
- **PWA** : Service Worker + manifest

---

## 📁 Architecture

```
├── backend/
│   ├── src/
│   │   ├── config/          # CORS, env, rate-limiter
│   │   ├── lib/             # Prisma client, logger (pino), email, cache, encryption
│   │   ├── middleware/       # Auth, security headers (CSP), CSRF
│   │   ├── modules/         # Feature modules (auth, admin, vehicles, bookings, etc.)
│   │   ├── types/           # Express augmentation types
│   │   └── server.ts        # Entry point
│   ├── prisma/              # Schema, migrations, seeds
│   └── tests/               # Integration tests
├── frontend/
│   ├── src/
│   │   ├── components/      # Shared + domain components
│   │   ├── contexts/        # Auth, Toast providers
│   │   ├── lib/             # API client, utils, i18n
│   │   ├── pages/           # Route pages (client, owner, admin, legal)
│   │   └── types/           # TypeScript types
│   ├── e2e/                 # Playwright E2E tests
│   └── public/locales/      # i18n translations (fr, en)
└── .github/workflows/       # CI/CD pipeline
```

## 🚀 Démarrage rapide

### Prérequis
- Node.js ≥ 22
- PostgreSQL 16+
- npm

### Backend

```bash
cd backend
cp .env.example .env          # Configurer les variables d'environnement
npm ci
npx prisma generate
npx prisma db push
npm run dev                   # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm ci
npm run dev                   # http://localhost:5173
```

### Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL PostgreSQL | `postgresql://user:pass@localhost:5432/carguinee` |
| `JWT_SECRET` | Secret JWT (≥32 chars) | Générer avec `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | AES-256 (64 hex chars) | Générer avec `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `RESEND_API_KEY` | Clé API Resend | `re_xxx...` |
| `CORS_ORIGIN` | Origin frontend autorisée | `http://localhost:5173` |
| `VITE_API_URL` (frontend) | URL de l'API backend | `http://localhost:3000` |

## 🧪 Tests

### Backend — Tests unitaires et intégration

```bash
cd backend
npm test
```

Tests couvrent :
- Services (auth, admin, véhicules, réservations)
- Calculs de réservation
- Transitions de statut
- Upload photos (limits, validation)
- Intégration base de données (auth, admin, RGPD, chiffrement)

### Frontend — Tests unitaires

```bash
cd frontend
npm test                      # Vitest
npx vitest run --coverage     # Avec couverture
```

### Frontend — Tests E2E

```bash
cd frontend
npx playwright install        # Première fois seulement
npx playwright test
```

Tests E2E couvrent :
- Navigation publique (accueil, catalogue, connexion, mentions légales)
- Navigation protégée (redirection vers connexion)
- Pages légales RGPD (bannière cookies, politique de confidentialité)

## 🏗️ Build & Déploiement

```bash
# Backend
cd backend && npx tsc         # Compile TypeScript
node dist/server.js           # Démarrer

# Frontend
cd frontend && npx vite build # Build production dans dist/
```

## 🔒 Sécurité

| Mesure | Statut |
|--------|--------|
| CSP (Content Security Policy) | ✅ Enforced (nonce pour scripts) |
| Rate limiting | ✅ express-rate-limit |
| CORS | ✅ Configurable via `CORS_ORIGIN` |
| XSS Protection | ✅ Helmet + CSP |
| CSRF | ✅ Middleware dédié |
| JWT | ✅ httpOnly cookie + localStorage (fallback cross-origin) |
| RGPD | ✅ Chiffrement AES-256, consent cookies, droit à l'oubli |
| HSTS | ✅ max-age=2ans |
| Security Headers | ✅ X-Frame-Options, Referrer-Policy, etc. |

## 📡 API

L'API suit le pattern RESTful :

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/api/auth/register` | POST | Inscription | ❌ |
| `/api/auth/login` | POST | Connexion | ❌ |
| `/api/auth/me` | GET | Profil connecté | ✅ |
| `/api/auth/me` | PATCH | Modifier profil | ✅ |
| `/api/vehicles` | GET | Catalogue | ❌ |
| `/api/vehicles/:id` | GET | Détail véhicule | ❌ |
| `/api/bookings` | POST | Créer réservation | ✅ |
| `/api/favorites` | POST | Ajouter favori | ✅ |
| `/api/messages` | POST | Envoyer message | ✅ |
| `/api/admin/stats` | GET | Stats admin | 🔒 ADMIN |
| `/api/admin/users` | GET | Liste utilisateurs | 🔒 ADMIN |
| `/api/admin/reports` | GET | Liste signalements | 🔒 ADMIN |

> Swagger UI disponible sur `/api/docs` en mode développement.

## 🛠️ Scripts utiles

```bash
# Backend
npm run prisma:generate   # Regénérer le client Prisma
npm run prisma:migrate    # Créer une migration
npm run prisma:seed       # Peupler la base
npm run demo:seed         # Seed de démonstration
npm run demo:galleries    # Synchroniser les galeries demo

# Frontend
npm run lint              # Linter (oxlint)
npm run build             # Build production
npm run preview           # Prévisualiser le build
```

## 🌍 i18n

Le frontend supporte le **français** et l'**anglais**. Les traductions sont dans `frontend/public/locales/{fr,en}/translation.json`.

## 📄 Licence

Projet privé — CarGuinée © 2025
