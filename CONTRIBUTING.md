# Contribuer à Carguinée 🚗

Merci de votre intérêt pour contribuer à Carguinée ! Ce guide vous explique comment démarrer, les conventions du projet, et le processus de contribution.

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Démarrage rapide](#démarrage-rapide)
3. [Architecture du projet](#architecture)
4. [Convention de branches](#branches)
5. [Conventions de code](#code)
6. [Tests](#tests)
7. [Processus de review](#review)
8. [Déploiement](#déploiement)
9. [FAQ](#faq)

---

## 1. Prérequis <a name="prérequis"></a>

| Outil | Version | Usage |
|-------|---------|-------|
| Node.js | ≥ 22 | Runtime JS |
| PostgreSQL | ≥ 16 | Base de données |
| npm | ≥ 10 | Package manager |
| Docker | ≥ 24 | Conteneurs (optionnel) |
| k6 | ≥ 0.45 | Tests de charge |

### Installation rapide avec Docker

```bash
git clone https://github.com/your-org/carguinee.git
cd carguinee
cp .env.example .env  # Configurer les variables
docker compose up -d
```

### Installation locale

```bash
# Backend
cd backend
cp .env.example .env  # Configurer DATABASE_URL, JWT_SECRET, etc.
npm install
npx prisma generate
npx prisma db push
npm run dev

# Frontend (nouveau terminal)
cd frontend
npm install
npm run dev
```

---

## 2. Architecture <a name="architecture"></a>

```
carguinee/
├── backend/                   # API REST (Express 5 + TypeScript)
│   ├── src/
│   │   ├── config/           # Config, CORS, Swagger, env validation
│   │   ├── lib/              # Utilitaires (email, cache, encryption, metrics)
│   │   ├── middleware/       # Security headers, CSRF, metrics, upload
│   │   └── modules/          # Modules métier (13 modules)
│   │       ├── auth/         # Login, register, JWT, RGPD
│   │       ├── vehicles/     # CRUD véhicules, photos
│   │       ├── bookings/     # Réservations, calculs prix
│   │       ├── admin/        # Dashboard admin, modération
│   │       ├── chat/         # Messagerie temps réel
│   │       ├── reviews/      # Avis et notes
│   │       └── ...
│   └── prisma/               # Schema Prisma + migrations
├── frontend/                  # SPA (React 19 + TypeScript + Vite)
│   ├── src/
│   │   ├── components/       # Composants réutilisables
│   │   ├── pages/            # Pages (admin, client, owner, legal)
│   │   ├── contexts/         # React Context (Auth, Theme, Toast)
│   │   ├── hooks/            # Hooks custom
│   │   ├── lib/              # Utilitaires (API, i18n, roles)
│   │   └── types/            # Types TypeScript
│   └── e2e/                  # Tests Playwright
├── tests/                     # Tests de performance et sécurité
│   ├── performance/          # k6 load tests
│   └── security/             # Security scan scripts
├── scripts/                   # Scripts de déploiement
├── docs/                      # Documentation technique
│   ├── adr/                  # Architecture Decision Records
│   ├── SECURITY-AUDIT.md
│   └── DEPLOYMENT.md
└── .github/workflows/         # CI/CD (GitHub Actions)
```

---

## 3. Convention de branches <a name="branches"></a>

```
main              ← Production (déploiement auto)
├── develop       ← Intégration (staging auto)
│   ├── feat/auth-rate-limiting
│   ├── feat/vehicle-gallery-v2
│   ├── fix/booking-date-calculation
│   └── chore/update-dependencies
```

| Type | Préfixe | Description |
|------|---------|-------------|
| Feature | `feat/` | Nouvelle fonctionnalité |
| Bug fix | `fix/` | Correction de bug |
| Refactor | `refactor/` | Refactoring sans changement fonctionnel |
| Test | `test/` | Ajout/modification de tests |
| Docs | `docs/` | Documentation |
| Chore | `chore/` | Maintenance, dépendances, CI |

---

## 4. Conventions de code <a name="code"></a>

### TypeScript

```typescript
// ✅ Bon : types stricts
function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-GN", {
    style: "currency",
    currency: "GNF",
  }).format(amount);
}

// ❌ Mauvais : any
function formatPrice(amount: any): any { ... }
```

### React

```tsx
// ✅ Bon : composant fonctionnel + hooks
export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useTranslation();
  return <div>{vehicle.brand} {vehicle.model}</div>;
}

// ✅ Bon : hooks personnalisés pour la logique
export function useVehicle(id: string) {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => apiFetch(`/api/vehicles/${id}`),
  });
}
```

### Backend (Express)

```typescript
// ✅ Bon : validation Zod + gestion d'erreurs
router.get("/vehicles", async (request, response) => {
  const parsed = querySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ status: "error", details: parsed.error.flatten() });
    return;
  }
  // ...
});
```

### Naming

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Fichiers composants | PascalCase | `VehicleCard.tsx` |
| Fichiers utils | camelCase | `formatPrice.ts` |
| Variables/fonctions | camelCase | `vehicleList`, `fetchData()` |
| Types/interfaces | PascalCase | `Vehicle`, `BookingResult` |
| Constantes | SCREAMING_SNAKE | `MAX_PHOTOS`, `API_URL` |
| Tables Prisma | PascalCase | `RentalBooking` |
| Routes API | kebab-case | `/api/admin/reaction-requests` |

---

## 5. Tests <a name="tests"></a>

```bash
# Unitaires backend
cd backend && npm test

# Unitaires frontend
cd frontend && npm test

# E2E (Playwright)
cd frontend && npm run test:e2e

# Couverture de code
cd frontend && npx vitest run --coverage

# Performance (k6)
k6 run tests/performance/k6-load-test.js

# Sécurité
bash tests/security/security-scan.sh http://localhost:3000
```

**Règle** : tout PR doit maintenir la couverture ≥ 70%.

---

## 6. Processus de review <a name="review"></a>

1. **Créer une branche** depuis `develop`
2. **Écrire les tests** pour toute nouvelle fonctionnalité
3. **Lancer les checks localement** :
   ```bash
   cd backend && npx tsc --noEmit && npm test
   cd frontend && npx tsc --noEmit && npm run lint && npm test
   ```
4. **Soumettre le PR** avec description claire
5. **Attendre 2 approvals** minimum
6. **CI doit passer** (vert)
7. **Squash & merge** dans `develop`

### Template de PR

```markdown
## Description
[Qu'est-ce que ce PR fait ?]

## Type de changement
- [ ] Nouvelle fonctionnalité
- [ ] Correction de bug
- [ ] Refactoring
- [ ] Documentation
- [ ] Tests

## Checklist
- [ ] Tests ajoutés/modifiés
- [ ] TypeScript compile sans erreur
- [ ] Lint passe
- [ ] Pas de console.log dans le code
- [ ] Documentation mise à jour si nécessaire
```

---

## 7. Déploiement <a name="déploiement"></a>

| Environnement | Branche | URL | Auto-deploy |
|--------------|---------|-----|-------------|
| Production | `main` | carguinee.com | ✅ Blue-green |
| Staging | `develop` | staging.carguinee.com | ✅ |
| PR Preview | `feat/*` | pr-{N}.carguinee.com | ✅ |

---

## 8. FAQ <a name="faq"></a>

**Q : Comment ajouter une nouvelle route API ?**
1. Créer le fichier dans `backend/src/modules/{module}/`
2. Ajouter les routes dans `backend/src/server.ts`
3. Ajouter dans Swagger (`backend/src/config/swagger-routes.ts`)
4. Ajouter les tests

**Q : Comment ajouter une nouvelle page ?**
1. Créer dans `frontend/src/pages/`
2. Ajouter la route dans `frontend/src/App.tsx`
3. Ajouter les traductions dans `public/locales/`
4. Protéger avec `ProtectedRoute` si nécessaire

**Q : Comment modifier le schema de la base ?**
1. Modifier `backend/prisma/schema.prisma`
2. Lancer `npx prisma migrate dev --name description`
3. Le CI testera automatiquement la migration
