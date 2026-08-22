# Guide de gestion — CarGuinée

Ce guide explique comment activer les rôles, administrer les véhicules et exploiter le cycle de réservation dans la version React, Node.js et Prisma de CarGuinée.

## 1. Espaces et permissions

| Rôle | Accès principal | Actions autorisées |
|---|---|---|
| **CLIENT** | Catalogue, détail véhicule, profil et réservations | Rechercher un véhicule, créer une demande, consulter ou annuler sa propre demande. |
| **PROPRIETAIRE** | `/proprietaire` | Créer ses véhicules, les soumettre à validation, visualiser les demandes reçues, confirmer ou refuser une demande. |
| **ADMIN** | `/administration` | Valider ou rejeter les demandes propriétaire et les publications de véhicules. |

> **Principe important :** l’interface React améliore la navigation, mais la décision d’autoriser une action doit toujours être appliquée par l’API Node.js. Le backend doit donc vérifier à la fois le rôle et la propriété de la ressource à chaque requête sensible.[1]

### Quelle interface est affichée sur la page des véhicules ?

La page **`/vehicules`** est le **catalogue public**, donc l’interface client et visiteur. Une personne non connectée peut rechercher un véhicule, lire les descriptions, ouvrir les huit photos et consulter les tarifs. Pour envoyer une demande, elle doit ensuite se connecter comme client.

| Utilisateur | Connexion et page à ouvrir | Utilisation prévue |
|---|---|---|
| Visiteur | Aucune connexion nécessaire, puis `/vehicules` | Recherche, filtres et consultation des galeries. |
| Client | Inscription depuis `/inscription`, puis connexion sur `/connexion` | Demande de location et suivi sur `/reservations`. |
| Propriétaire | Connexion avec un compte `PROPRIETAIRE`, puis `/proprietaire` | Gestion des véhicules, validation des demandes et suivi des publications. |
| Administrateur | Connexion avec un compte `ADMIN`, puis `/administration` | Validation des véhicules et des demandes propriétaire. |

Après une connexion réussie, l’application affiche automatiquement les liens correspondant au rôle du compte. Un client normal ne voit pas les liens propriétaire ou administration et l’API refuse également tout accès direct non autorisé.

### Comptes locaux pour tester les interfaces

Après l’exécution de `npm run demo:seed`, vous pouvez utiliser les comptes ci-dessous dans **un environnement local uniquement**. Le mot de passe des deux comptes est `DemoCarGuinee2026!`.

| Rôle de test | Téléphone | Page de test |
|---|---|---|
| Administrateur | `+224600000010` | `/administration` |
| Propriétaire | `+224600000011` | `/proprietaire` |
| Client | Créez votre propre compte via `/inscription` | `/vehicules`, puis `/reservations` |

> Ces comptes et leur mot de passe sont des données de démonstration. Supprimez-les ou changez leurs identifiants avant toute mise en production.

### Configurer le premier administrateur

Créez un compte normal via l’écran d’inscription, puis changez ce compte en `ADMIN` dans la base de données **uniquement depuis un environnement d’administration contrôlé**. Avec Prisma Studio, cette opération est pratique pendant le développement : ouvrez le dossier `backend`, lancez `npx prisma studio`, trouvez l’utilisateur et remplacez sa valeur `role` par `ADMIN`. Déconnectez-vous puis reconnectez-vous pour obtenir un nouveau jeton contenant le rôle mis à jour.

En production, ne mettez pas un bouton public de promotion administrateur. Limitez cette opération à un opérateur de confiance, journalisez l’auteur et la date de chaque changement, puis appliquez le principe du moindre privilège.[1]

### Transformer un client en propriétaire

Un client crée une demande propriétaire via l’API `POST /api/owner-requests` avec une motivation. Un administrateur ouvre ensuite **Administration**, examine la demande et choisit **Approuver** ou **Rejeter**. L’approbation met à jour simultanément la demande et le rôle du compte en `PROPRIETAIRE` dans une transaction Prisma. Après reconnexion, le nouvel espace propriétaire devient accessible.

Pour vérifier un propriétaire réel, il est recommandé de demander au minimum ses coordonnées, les documents utiles selon vos règles métier et une première validation manuelle avant de publier ses véhicules. Ne publiez jamais automatiquement une annonce non contrôlée.

## 2. Cycle recommandé d’une réservation

| Étape | Statut | Responsable | Règle métier |
|---|---|---|---|
| 1 | `EN_ATTENTE` | Client | Le serveur valide les dates, recalcule le montant et cherche les conflits de calendrier. |
| 2 | `CONFIRMEE` ou `REJETEE` | Propriétaire / administrateur | Une décision doit être explicite ; un refus peut être accompagné d’un motif. |
| 3 | `EN_COURS` | Propriétaire / administrateur | À utiliser au moment de la remise effective du véhicule. |
| 4 | `TERMINEE` | Propriétaire / administrateur | À utiliser après retour, contrôle et clôture financière. |
| À tout moment avant exécution | `ANNULEE` | Client ou gestionnaire autorisé | Conservez la trace de l’annulation et appliquez une politique de remboursement distincte. |

Le montant journalier, le total et la caution doivent être enregistrés au moment de la création de la réservation. Ainsi, une modification future du tarif du véhicule ne modifie pas une demande existante. Avant toute confirmation finale, montrez au client les dates, le véhicule, le montant et la caution ; cette approche évite les validations ambiguës et suit le principe « ce que vous voyez est ce que vous confirmez » pour les opérations sensibles.[2]

## 3. Bonnes pratiques Node.js / Prisma

L’API doit rester la seule source de vérité. Ne faites jamais confiance au tarif, au rôle ou au statut envoyés par le navigateur : relisez le véhicule et le compte depuis PostgreSQL, puis calculez le total côté serveur. Les contrôles de droits doivent refuser l’accès par défaut et ne donner que les permissions nécessaires.[1]

Pour éviter qu’un même véhicule soit confirmé deux fois sur des périodes qui se chevauchent, encapsulez à terme la vérification de disponibilité et la création ou confirmation de réservation dans une transaction courte. Prisma permet les transactions interactives et les niveaux d’isolation ; `Serializable` avec reprise contrôlée en cas de conflit est particulièrement utile lorsqu’une même ressource peut être sollicitée simultanément.[3]

Évitez de maintenir une transaction ouverte pendant un envoi d’e-mail, un téléversement d’image ou une attente utilisateur. Conservez plutôt une transaction courte pour la base de données, puis déclenchez la notification après validation. Les transactions longues dégradent les performances et augmentent le risque de blocage.[3]

Enfin, journalisez les changements importants : identifiant de réservation, ancien et nouveau statut, auteur, horodatage et motif éventuel. Ajoutez des tests pour les transitions interdites, l’accès à une réservation d’un autre client et le conflit de dates. Les règles de statut doivent former une machine à états : une réservation `TERMINEE`, `REJETEE` ou `ANNULEE` ne doit pas revenir à `EN_ATTENTE` sans procédure administrative explicite.

## 4. Publications de démonstration

La commande suivante crée six annonces locales, chacune avec **huit photos**, une description du modèle et la mention que la location est assurée avec chauffeur professionnel. Ces données restent des exemples : elles ne doivent pas être présentées comme des offres réelles ni publiées sans vérification du véhicule, de son propriétaire et des droits d’utilisation des images.

```powershell
cd backend
npm run demo:seed
```

Deux comptes de développement sont créés par ce script : un administrateur et un propriétaire. Les identifiants sont affichés dans le terminal à la fin de l’exécution. Ils sont uniquement destinés à un environnement local : remplacez les mots de passe et supprimez les données de démonstration avant toute mise en ligne. Les sources et précautions de licence des images sont documentées dans `GALERIE_IMAGES.md`.

## Références

[1]: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html "OWASP — Authorization Cheat Sheet"
[2]: https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html "OWASP — Transaction Authorization Cheat Sheet"
[3]: https://www.prisma.io/docs/orm/prisma-client/queries/transactions "Prisma — Transactions and batch queries"
