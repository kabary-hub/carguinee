# ADR-007 — Orange Money API (Paiements mobiles)

## Statut

Accepté

## Contexte

CarGuinée a besoin d'un système de paiement pour les réservations de véhicules. En Guinée, Orange Money est le moyen de paiement mobile le plus utilisé. L'intégration doit être gratuite (pas de frais d'abonnement) et respecter les normes de sécurité.

## Décision

Intégrer l'API Orange Money en mode **Collect** (l'utilisateur paie, la plateforme reçoit) :

- **Authentification** : OAuth2 Basic Auth (APP_KEY + APP_SECRET)
- **Flow** : Frontend initie → Backend crée le paiement → Orange Money notifie → Callback webhook met à jour le statut
- **Statuts** : PENDING → PROCESSING → PAID / FAILED / REFUNDED
- **Webhook** : POST /api/payments/callback (sans auth, sécurisé par le notif_token)
- **Mode sandbox** : OM_SANDBOX=true pour le développement

## Conséquences

✅ Paiement intégré au flow de réservation existant
✅ Points de fidélité crédités automatiquement lors du paiement confirmé
✅ Callback asynchrone = pas de timeout côté utilisateur
⚠️ Nécessite un compte Orange Money Marchand (gratuit pour les transactions)
⚠️ Les tests d'intégration nécessitent le mode sandbox

## Alternatives considérées

- **Wave Money** : Moins adoption en Guinée
- **Stripe** : Pas adapté au marché guinéen
- **Paiement à la livraison** : Risque de non-paiement

---

# ADR-008 — Parrainage & Points de fidélité

## Statut

Accepté

## Contexte

Augmenter la croissance viral via le parrainage et fidéliser les utilisateurs existants avec un système de points.

## Décision

Système de double récompense :

1. **Parrainage** :
   - Chaque utilisateur génère un code unique (NOM-XXXX)
   - Parrainé s'inscrit avec le code → 10 points au parrainé
   - Parrainé fait sa 1ère réservation payée → 50 points au parrain
   - 3 statuts : PENDING (inscription), ACTIVE (1ère réservation), EXPIRED

2. **Points de fidélité** :
   - 10 points par réservation payée
   - 50 points par parrainage activé
   - 100 points = 10% de réduction (max 30%)
   - Solde calculé via transactions chronologiques

## Conséquences

✅ Croissance organique via le bouche-à-oreille
✅ Incitation à la fidélisation
✅ Code partageable via copie dans le presse-papiers
⚠️ Protection anti-abus : un seul code par utilisateur, pas d'auto-parrainage

## Tables Prisma

- `Referral` : lien parrain ↔ parrainé
- `LoyaltyTransaction` : historique des mouvements de points
- `DiscountCode` : codes de réduction générés

---

# ADR-009 — Chatbot FAQ (Assistant virtuel)

## Statut

Accepté

## Contexte

Réduire la charge du support client avec un assistant automatique qui répond aux questions fréquentes. Pas d'IA externe pour rester gratuit.

## Décision

Chatbot basé sur la recherche floue dans une base de FAQ :

- **Recherche** : scoring par mots-clés + normalisation (accents, ponctuation)
- **Scoring** : 4 critères (exact match, mots similaires, mots-clés, question identique)
- **Seuil minimum** : score ≥ 0.3 pour une réponse, sinon fallback vers le support
- **Sessions** : persistées en base, historique consultable
- **Feedback** : notation utile/pas utile pour améliorer la FAQ
- **Multilingue** : support FR/EN avec sélections dynamiques

## Conséquences

✅ Aucun coût d'exploitation (pas d'API IA)
✅ Temps de réponse instantané
✅ Amélioration continue via les retours utilisateurs
⚠️ Nécessite un seed de FAQ initial (catégories : GÉNÉRAL, RÉSERVATION, PAIEMENT, COMPTE, VÉHICULE)
⚠️ Moins intelligent qu'un vrai LLM, mais suffisant pour les questions standard

## Tables Prisma

- `FaqEntry` : questions/réponses bilingues
- `ChatSession` : session de conversation
- `ChatMessage` : historique des échanges

---

# ADR-010 — Géolocalisation Mapbox

## Statut

Accepté

## Contexte

Afficher les véhicules sur une carte interactive pour faciliter la recherche par localisation. Les utilisateurs guinéens sont habitués à chercher par quartier/commune.

## Décision

Intégration de **Mapbox GL JS** (free tier : 50 000 requêtes/mois) :

- **Affichage** : carte interactive avec markers colorés par niveau de boost
- **Clustering** : regroupement automatique des véhicules proches
- **Popups** : détails du véhicule au clic (marque, modèle, prix, commune)
- **Géocodage** : champs latitude/longitude déjà existants dans le schéma Vehicle
- **Fallback** : message gracieux si token non configuré

## Conséquences

✅ Expérience visuelle enrichie pour la recherche
✅ Clustering performant même avec beaucoup de véhicules
✅ Intégration légère (import dynamique, pas dans le bundle principal)
⚠️ 50k requêtes/mois en gratuit → surveiller l'usage
⚠️ Token Mapbox requis côté frontend (VITE_MAPBOX_TOKEN)

---

# ADR-011 — Boosting de véhicules

## Statut

Accepté

## Contexte

Monétiser la visibilité en permettant aux propriétaires de "booster" leurs véhicules pour apparaître en premier dans les résultats de recherche.

## Décision

Système de 3 niveaux de boost avec positionnement dans les résultats :

| Niveau | Prix | Visibilité | Badge | Position |
|--------|------|-----------|-------|----------|
| BASIC | Gratuit | Standard | Gris | Normal |
| PREMIUM | 50 000 GNF/sem | +50% | Doré | Avant BASIC |
| VIP | 150 000 GNF/sem | +100% | Violet | Top des résultats + Page d'accueil |

- **Durée** : 7 jours par défaut
- **Un seul boost actif** par véhicule (le nouveau remplace l'ancien)
- **Annulable** à tout moment
- **Tri** : VIP > PREMIUM > BASIC > NON_BOOSTED

## Conséquences

✅ Source de revenus pour la plateforme
✅ Incitation à l'engagement des propriétaires
✅ Transparence : le niveau de boost est visible
⚠️ Nécessite intégration avec le payment router pour les niveaux payants
⚠️ Le cron de nettoyage des boosts expirés doit tourner régulièrement

---

# ADR-012 — Mode hors-ligne (PWA)

## Statut

Accepté

## Contexte

En Guinée, la connectivité internet est souvent intermittente. Les utilisateurs doivent pouvoir consulter les informations des véhicules déjà consultés même sans connexion.

## Décision

Progressive Web App avec Service Worker :

- **Manifest** : manifest.json avec icônes, shortcuts, screenshots
- **Service Worker** : cache-first pour les assets statiques, network-first pour l'API
- **Page offline** : fallback html quand l'API est inaccessible
- **Installation** : prompt d'installation PWA automatique
- **Cache** : les pages déjà visitées restent accessibles

## Conséquences

✅ Expérience utilisateurs améliorée en connectivité faible
✅ Installation sur l'écran d'accueil comme une app native
✅ Réduction de la consommation de données
⚠️ Les données en temps réel (réservations, messages) nécessitent une connexion
⚠️ Le Service Worker doit être mis à jour à chaque déploiement

## Fichiers

- `frontend/public/manifest.json` : configuration PWA
- `frontend/public/sw.js` : Service Worker
- `frontend/public/offline.html` : page de fallback
