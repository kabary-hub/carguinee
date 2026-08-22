# Démarrage complet sous Windows

Après extraction de l’archive complète, conservez la structure `carguinee/frontend` et `carguinee/backend` telle quelle. Le projet ne contient volontairement pas le dossier `node_modules`, car les dépendances installées sous Linux ne sont pas réutilisables de manière fiable sous Windows. Elles seront téléchargées automatiquement par le lanceur avec `npm install`.

## Prérequis

| Élément | Utilité |
|---|---|
| Node.js LTS | Exécute React/Vite et l’API Node.js. |
| PostgreSQL | Stocke les utilisateurs, véhicules, réservations et publications. |
| Connexion Internet | Permet la première installation des dépendances npm. |

## Première exécution

Double-cliquez sur `DEMARRER-CARGUINEE.bat` à la racine du projet. Au premier lancement, le fichier `backend/.env` sera créé puis ouvert dans le Bloc-notes. Renseignez votre connexion PostgreSQL dans `DATABASE_URL` et utilisez une clé longue et aléatoire pour `JWT_SECRET`. Enregistrez le fichier et relancez ensuite le même lanceur.

Quand les deux fenêtres de terminal sont ouvertes, ouvrez `http://localhost:5173`. Pour créer les tables puis les publications locales de démonstration, exécutez une seule fois les commandes ci-dessous dans PowerShell :

```powershell
cd "C:\Users\VotreNom\Desktop\carguinee\backend"
npm run prisma:generate
npm run prisma:migrate
npm run demo:seed
```

Le fichier `GUIDE_GESTION.md` décrit les rôles client, propriétaire et administrateur, avec les comptes de démonstration disponibles après le chargement des données.

## Mettre à jour les huit photos des voitures existantes

Si vous utilisez une base créée avec une version antérieure de CarGuinée, conservez votre fichier `backend/.env`, puis double-cliquez une seule fois sur `ACTIVER-8-PHOTOS.bat` à la racine du projet. Ce lanceur associe les huit photos déjà livrées aux six voitures de démonstration existantes. Il ne supprime ni véhicule ni réservation.
