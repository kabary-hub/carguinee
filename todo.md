# CarGuinée — Suivi des développements

## Livraison complète Windows
- [x] Créer un package complet du projet sans dépendances Linux ni secrets locaux
- [x] Ajouter un script Windows pour installer les dépendances et démarrer les deux serveurs
- [x] Vérifier le contenu de l’archive complète

## Correctif local
- [x] Autoriser les origines Vite locales sur les ports 5173 et 5174 afin de résoudre le blocage CORS

## Expérience de démonstration et documentation
- [x] Préparer six publications de véhicules de démonstration clairement identifiées
- [x] Ajouter les images associées aux publications de démonstration
- [x] Ajouter des animations et transitions légères aux écrans catalogue et détail
- [x] Rédiger le guide de configuration des espaces propriétaire et administrateur
- [x] Documenter les bonnes pratiques de gestion des réservations

## Galerie, contenu et livraison différentielle
- [x] Ajouter huit photos à chaque publication de démonstration
- [x] Créer une galerie avec miniatures, navigation et ouverture plein écran
- [x] Remplacer les descriptions de démonstration par des descriptions réalistes des modèles concernés
- [x] Indiquer que les locations sont proposées avec chauffeur
- [x] Documenter les interfaces client, propriétaire et administrateur ainsi que leurs accès
- [x] Préparer une archive ne contenant que les fichiers modifiés et les nouvelles images

## Catalogue et recherche
- [x] Examiner les routes véhicules et les données disponibles
- [x] Créer la page de catalogue des véhicules publiés
- [x] Ajouter des filtres de recherche par type, commune, usage, prix et mot-clé
- [x] Créer la page de détail d’un véhicule avec galerie et informations tarifaires
- [x] Ajouter les liens de navigation vers le catalogue

## Réservations client
- [x] Ajouter les routes backend de création et de consultation des réservations
- [x] Créer le formulaire de demande de réservation depuis le détail d’un véhicule
- [x] Créer la page de suivi des réservations du client
- [x] Afficher des statuts de réservation clairement identifiables

## Espace propriétaire
- [x] Créer un tableau de bord propriétaire
- [x] Créer les écrans de création et gestion initiale des véhicules
- [x] Permettre au propriétaire de consulter et gérer les demandes de réservation
- [x] Afficher le statut de validation de chaque véhicule

## Espace administrateur
- [x] Créer un tableau de bord administrateur
- [x] Créer l’interface de validation ou de rejet des véhicules
- [x] Créer l’interface de gestion des demandes pour devenir propriétaire
- [x] Ajouter les contrôles d’accès par rôle sur les routes front-end

## Validation et livraison
- [x] Écrire ou mettre à jour les tests utiles
- [x] Vérifier la compilation du front-end et du back-end
- [x] Préparer une archive ZIP sans node_modules pour Windows
- [x] Documenter la séparation front-end / back-end et le démarrage local

## Vérification guidée dans le navigateur
- [x] Contrôler les comptes de démonstration client, propriétaire et administrateur
- [x] Vérifier les corrections précédentes dans le code et les parcours concernés
- [x] Autoriser le nom d’hôte sécurisé de prévisualisation dans Vite
- [x] Autoriser l’origine sécurisée de prévisualisation dans le CORS de l’API
- [x] Configurer l’interface de prévisualisation pour utiliser l’API exposée
- [x] Rendre l’API disponible via le tunnel de prévisualisation
- [x] Isoler l’API CarGuinée du serveur existant utilisant le port 3000
- [x] Démarrer les services de démonstration CarGuinée dans le navigateur
- [x] Ajouter un test unitaire pour les règles CORS de prévisualisation sécurisée
- [x] Tester l’accès aux interfaces client, propriétaire et administrateur
- [x] Préparer les informations de connexion et le lien de vérification pour l’utilisateur

## Livraison de la mise à jour Windows
- [x] Inclure les derniers correctifs CORS et prévisualisation dans la livraison Windows
- [x] Créer une nouvelle archive complète de CarGuinée sans dépendances locales
- [x] Contrôler l’intégrité et le contenu de l’archive mise à jour
- [x] Transmettre l’archive et la procédure de remplacement sur le Bureau Windows

## Configuration PostgreSQL sous Windows
- [x] Vérifier les variables PostgreSQL attendues par CarGuinée
- [x] Préparer le guide pgAdmin de création de la base locale
- [x] Indiquer le contenu exact du fichier `backend/.env` et l’initialisation des données

## Reprise de la base existante après mise à jour
- [x] Décrire les fichiers de connexion existants à conserver
- [x] Indiquer la synchronisation non destructive de la base déjà créée
- [x] Transmettre la procédure de remplacement sans recréer les données de démonstration

## Correctif du lanceur Windows
- [x] Corriger la syntaxe des commandes du fichier `DEMARRER-CARGUINEE.bat`
- [x] Vérifier le comportement du script de démarrage sous Windows
- [x] Transmettre le lanceur corrigé et le démarrage provisoire

## Correctif de la galerie véhicule
- [x] Vérifier que les huit images sont incluses dans la livraison Windows
- [x] Ajouter une synchronisation non destructive des galeries dans la base existante
- [x] Corriger le chemin de chargement local des photos si nécessaire
- [x] Exécuter l’ensemble des tests de galerie et de réservation
- [x] Vérifier le détail d’un véhicule avec les huit miniatures et le plein écran
- [x] Corriger la limite d’upload pour accepter une photo de 2 Mo exactement (test de bord)
- [x] Revalider les tests, le typage et la compilation après correction
- [x] Transmettre le correctif de galerie à remplacer sur le Bureau

## Dark mode
- [x] Configurer la variante dark Tailwind v4 et la bascule clair/sombre mémorisée
- [x] Convertir toutes les pages et composants avec les variantes dark
- [x] Ajouter la transition douce lors du changement de thème

## Redirection et espaces par rôle
- [x] Diagnostiquer la cause réelle : redirection codée en dur vers /profil (le rôle est bien présent dans la réponse d’auth)
- [x] Créer getHomeRouteForRole et roleLabel (valeurs alignées sur l’enum réel CLIENT/PROPRIETAIRE/ADMIN) + tests frontend
- [x] Rediriger après connexion : ADMIN → /administration, PROPRIETAIRE → /proprietaire, CLIENT → /vehicules (l’état « from » reste prioritaire)
- [x] Afficher le rôle en français dans l’en-tête et ajouter « Retour à mon espace » dans le profil
- [x] Ajouter les statistiques du tableau de bord administrateur (endpoint /api/admin/stats protégé + tests) et les statistiques propriétaire
- [x] Vérifier les gardes de routes (non connecté → /connexion, rôle insuffisant → /acces-refuse) et les contrôles backend
