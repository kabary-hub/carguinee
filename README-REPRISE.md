# CarGuinée — Reprise du projet

Cette archive contient le code source mis à jour de CarGuinée. Les dépendances et les fichiers de production générés ne sont pas inclus afin que l’archive reste légère et portable sous Windows.

## Organisation du code

| Dossier | Rôle | Commandes principales |
|---|---|---|
| `frontend/` | Interface React/Vite visible dans le navigateur : catalogue, recherche, réservations et tableaux de bord. | `npm install` puis `npm run dev` |
| `backend/` | API Express/Prisma, authentification, base de données, véhicules, réservations et règles d’accès. | `npm install` puis `npm run dev` |
| `backend/prisma/` | Schéma et migrations PostgreSQL. | `npm run prisma:generate` puis `npm run prisma:migrate` |

> Le **front-end** affiche les pages et envoie les actions de l’utilisateur à l’API. Le **back-end** contrôle les rôles, applique les règles de réservation et lit ou écrit les données dans PostgreSQL.

## Démarrer sous Windows

Installez Node.js LTS et PostgreSQL, puis ouvrez deux terminaux PowerShell dans le dossier extrait.

```powershell
# Terminal 1 — API backend
cd backend
npm install
Copy-Item .env.example .env
# Renseignez DATABASE_URL et JWT_SECRET dans .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

```powershell
# Terminal 2 — Interface frontend
cd frontend
npm install
npm run dev
```

Ouvrez ensuite l’adresse affichée par Vite dans votre navigateur, généralement `http://localhost:5173`.

## Fonctionnalités ajoutées

Le catalogue permet de filtrer les véhicules par mot-clé, type, commune, mode location/vente et budget. Chaque véhicule possède une page détaillée avec une demande de réservation et un calcul du montant estimé.

Les clients suivent et annulent leurs demandes depuis la page **Mes réservations**. Les propriétaires ajoutent leurs véhicules, consultent leur statut de publication et acceptent ou refusent les demandes. Les administrateurs traitent les validations de véhicules et de demandes propriétaire.

## Vérifications effectuées

```powershell
cd backend
npm test
npm run typecheck

cd ..\frontend
npm run build
```

Les deux tests unitaires de calcul des locations, le typage du backend et la compilation du frontend ont été exécutés avec succès avant la création de l’archive.
