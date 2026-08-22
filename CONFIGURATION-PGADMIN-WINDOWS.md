# Configurer PostgreSQL et pgAdmin pour CarGuinée sous Windows

Ce guide crée une base **locale** pour CarGuinée. Il ne modifie aucune base distante.

> Le mot de passe demandé par pgAdmin pour se connecter au serveur PostgreSQL est celui que vous avez défini lors de l’installation de PostgreSQL. Il peut être différent du mot de passe principal de l’application pgAdmin.

## Vous avez déjà créé votre base avec une version précédente

Si votre ancien projet CarGuinée fonctionnait déjà avec PostgreSQL, vous ne devez **rien créer ni modifier dans pgAdmin** après l’extraction de la nouvelle archive. La base, les tables, les six véhicules et les comptes de démonstration restent dans PostgreSQL ; ils ne sont pas dans le fichier ZIP.

Faites uniquement ceci avant de lancer la nouvelle version :

1. Conservez l’ancien dossier, par exemple en le renommant `carguinee-ancien`.
2. Extrayez la nouvelle archive afin d’obtenir un nouveau dossier `carguinee`.
3. Dans l’ancien dossier, ouvrez `carguinee-ancien\backend`.
4. Copiez le fichier `.env` qui se trouve dans ce dossier.
5. Collez ce même fichier dans le nouveau dossier `carguinee\backend`.
6. Double-cliquez sur `DEMARRER-CARGUINEE.bat` dans le nouveau dossier.

Ne lancez pas `npm run demo:seed` dans ce cas : les véhicules et comptes de démonstration sont déjà dans votre base. Les derniers correctifs concernent le code de l’application, pas la structure de la base de données.

## 1. Ouvrir ou enregistrer le serveur local dans pgAdmin

Ouvrez le menu Démarrer de Windows, recherchez **pgAdmin 4**, puis ouvrez-le. Dans la colonne de gauche, développez **Servers**.

Si un serveur tel que `PostgreSQL 16`, `PostgreSQL 17` ou `PostgreSQL Local` apparaît, cliquez dessus. Entrez le mot de passe PostgreSQL choisi lors de l’installation, cochez éventuellement **Save password**, puis validez.

S’il n’y a aucun serveur dans la colonne de gauche, faites un clic droit sur **Servers**, choisissez **Register > Server…**, puis remplissez les champs suivants.

| Onglet | Champ | Valeur à saisir |
|---|---|---|
| **General** | Name | `PostgreSQL local` |
| **Connection** | Host name/address | `127.0.0.1` |
| **Connection** | Port | `5432` |
| **Connection** | Maintenance database | `postgres` |
| **Connection** | Username | `postgres` |
| **Connection** | Password | Le mot de passe PostgreSQL défini à l’installation |

Cliquez sur **Save**. Si le serveur ne se connecte pas, assurez-vous que le service PostgreSQL est démarré dans l’application Windows **Services**.

## 2. Créer la base de données CarGuinée

Dans la colonne de gauche, développez votre serveur connecté. Faites ensuite un clic droit sur **Databases**, choisissez **Create > Database…**, puis utilisez les valeurs ci-dessous.

| Champ pgAdmin | Valeur |
|---|---|
| **Database** | `carguinee` |
| **Owner** | `postgres` |

Cliquez sur **Save**. Vous devez maintenant voir la base `carguinee` sous **Databases**.

## 3. Renseigner le fichier `backend/.env`

Dans le dossier extrait sur votre Bureau, ouvrez `carguinee\backend\.env` avec le Bloc-notes. Si le fichier n’existe pas encore, double-cliquez une première fois sur `DEMARRER-CARGUINEE.bat` : il crée automatiquement le fichier puis l’ouvre.

Remplacez tout le contenu du fichier par les quatre lignes suivantes. Remplacez seulement `VOTRE_MOT_DE_PASSE_POSTGRESQL` par votre propre mot de passe PostgreSQL.

```env
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE_POSTGRESQL@localhost:5432/carguinee?schema=public"
JWT_SECRET="CarGuinee_secret_local_ChangezCettePhrase_2026_avec_au_moins_32_caracteres"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
```

Enregistrez avec **Ctrl + S**. Vérifiez que le nom est exactement `.env`, et non `.env.txt`.

> Si votre mot de passe PostgreSQL contient `@`, `:`, `/`, `?`, `#` ou `%`, il doit être encodé dans l’URL de connexion. La solution la plus simple est de créer un mot de passe PostgreSQL sans ces caractères, puis de mettre ce mot de passe dans `DATABASE_URL`.

## 4. Créer les tables et les données de démonstration

Ouvrez **Windows PowerShell**. Copiez les commandes ci-dessous une par une, en remplaçant `VotreNomWindows` par le nom de votre session Windows.

```powershell
cd "C:\Users\VotreNomWindows\Desktop\carguinee\backend"
npm run prisma:generate
npx prisma db push
npm run demo:seed
```

La première commande prépare Prisma. La deuxième crée les tables dans la base `carguinee`. La troisième ajoute les six véhicules de démonstration et les comptes administrateur et propriétaire.

## 5. Démarrer CarGuinée

Revenez au dossier `carguinee` sur le Bureau et double-cliquez sur **DEMARRER-CARGUINEE.bat**. Attendez l’ouverture des deux fenêtres noires, puis ouvrez l’adresse suivante dans Chrome ou Edge :

```text
http://localhost:5173
```

## Dépannage rapide

| Message affiché | Cause probable | Correction |
|---|---|---|
| `password authentication failed` | Mot de passe PostgreSQL incorrect | Corrigez uniquement le mot de passe de `DATABASE_URL`. |
| `database "carguinee" does not exist` | La base n’a pas été créée ou porte un autre nom | Créez la base exactement sous le nom `carguinee`. |
| `Can't reach database server` ou `P1001` | PostgreSQL n’est pas démarré | Ouvrez **Services** sous Windows et démarrez le service PostgreSQL. |
| `.env.txt` au lieu de `.env` | Windows masque les extensions | Activez l’affichage des extensions, puis renommez le fichier en `.env`. |
