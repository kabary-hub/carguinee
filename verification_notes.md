# Vérification de CarGuinée

## 17 août 2026

La prévisualisation sécurisée de l’interface React est accessible après ajout de l’autorisation des sous-domaines `manus.computer` dans la configuration Vite. La page d’accueil affiche correctement l’identité CarGuinée, les actions de connexion et l’accès au catalogue public.

La base PostgreSQL isolée de démonstration contient les six publications avec chauffeur et les comptes de test administrateur et propriétaire. Les vérifications d’authentification et des espaces selon le rôle sont en cours.

Le catalogue s’ouvre correctement, avec ses filtres et la mention « location avec chauffeur ». Les véhicules restent en chargement tant que l’interface exposée n’est pas reliée à l’API exposée : ce raccordement fait l’objet du correctif suivant.

Le tunnel public du port 3000 correspond au serveur d’un autre projet déjà actif. L’API CarGuinée est donc déplacée vers un port de démonstration distinct afin de garantir que le catalogue et les connexions testent le bon service.

Le contrôle de santé de l’API sur le port distinct confirme la connexion à la base de démonstration. Le catalogue sécurisé charge maintenant les six annonces prévues ; chacune affiche le badge « 8 photo(s) », sa commune, son type, son tarif et la mention « Location avec chauffeur ».

Le parcours de connexion administrateur a été ouvert sur la prévisualisation et les identifiants de démonstration ont été saisis pour vérifier le contrôle d’accès. Les informations d’authentification ne sont pas consignées dans ce fichier de suivi.

La connexion administrateur est réussie : le profil identifie le rôle `ADMIN` et l’accès à la page Administration est autorisé. Le tableau de bord présente les zones de validation des véhicules et des demandes propriétaire.

Le compte administrateur a été déconnecté et le parcours de connexion propriétaire est préparé sur la même prévisualisation. Les informations d’authentification restent volontairement exclues du journal de vérification.

L’accès direct à l’espace propriétaire est autorisé pour le compte de démonstration. Il présente le formulaire de création de véhicule, les six véhicules publiés et la zone de traitement des demandes de réservation. Une redirection vers l’ancienne page réservée peut être refusée si elle provient de la session administrateur précédente ; l’accès propriétaire direct fonctionne correctement.

L’écran d’inscription client est accessible depuis la connexion et indique clairement que tout nouveau compte reçoit le rôle `CLIENT` par défaut. Le formulaire demande le prénom, le nom, le téléphone, l’adresse e-mail facultative et un mot de passe respectant les critères indiqués.

La création du compte client de démonstration a réussi. Son profil confirme le rôle `CLIENT`, son statut actif et l’adresse de contact enregistrée ; ce compte peut maintenant être utilisé pour tester les réservations sans modifier les comptes propriétaire et administrateur.

L’espace client « Mes réservations » est accessible et propose un lien de retour vers le catalogue. Depuis cet espace, le client voit les six annonces enrichies de leur tarif, du badge « 8 photo(s) » et de la mention de location avec chauffeur.

Le détail du Kia Sportage affiche la description complète, le tarif quotidien, la caution, le chauffeur inclus et les huit vignettes de galerie. Un clic sur l’image principale ouvre la visionneuse plein écran avec fermeture et navigation précédente/suivante, confirmant le comportement demandé.

Les tests backend passent avec succès, y compris les règles CORS de prévisualisation HTTPS et les calculs de réservation. Le contrôle de typage backend et la compilation de l’interface React ont également réussi.

## Reprise : correctif final de la galerie

Lors de la reprise, un test d’upload révélait que busboy (multer) déclenche la limite dès que la taille du fichier atteint la limite fixée : une photo de 2 Mo exactement était donc refusée alors que la règle « au maximum 2 Mo » doit l’accepter. La limite technique d’upload a été fixée à 2 Mo + 1 octet afin que seules les photos de plus de 2 Mo soient refusées. Les 19 tests backend passent désormais, dont le test de bord « refuse une photo de plus de 2 Mo mais accepte une photo de 2 Mo exactement ».

Le contrôle de typage backend et la compilation de l’interface React (avec galerie et PWA) réussissent. L’archive du correctif de galerie a été régénérée sur le Bureau avec l’ensemble des fichiers à jour (module véhicules, middleware d’upload, galerie frontend, script de synchronisation des 8 photos et les 54 visuels de démonstration), sans dépendances ni secrets locaux.

## Vérifications bout en bout du 17 août (après-midi)

Les deux serveurs ont été démarrés sur leurs ports habituels (API :3000, interface :5173) et le parcours galerie a été contrôlé dans un navigateur réel (Chrome headless piloté par CDP) : le catalogue affiche les six annonces avec le badge « 8 photo(s) », la page détail du Kia Sportage présente la photo principale, les huit miniatures et le compteur « 1 / 8 », la visionneuse plein écran s’ouvre sur la photo 1, la navigation suivante passe à la photo 2, la fermeture fonctionne et un clic sur la huitième miniature affiche « 8 / 8 ». Les tarifs s’affichent en « FG » (« 950 000 FG / jour », « Caution : 1 700 000 FG »), conformément au locale `fr-GN`.

Les règles d’upload des photos côté propriétaire ont été testées de bout en bout (19/19) : 1 à 8 photos par véhicule, refus de la neuvième (« Un véhicule ne peut pas avoir plus de 8 photos. »), refus de 9 fichiers dans une même requête, refus d’une photo de plus de 2 Mo, acceptation d’une photo de 2 Mo exactement, refus du format GIF, acceptation des JPG/PNG/WEBP, refus sans jeton (401) et pour un compte ADMIN (403). Le workflow complet a été validé : brouillon → soumission → approbation → PUBLIEE, puis tout ajout de photo sur un véhicule publié le repasse en `EN_ATTENTE_VALIDATION`. Les photos téléversées sont bien servies par `/uploads`.

Le parcours de réservation client a été vérifié de bout en bout dans le navigateur : inscription d’un compte client, connexion, demande de réservation sur le Kia Sportage du 18 au 20 août avec un total estimé correct de 1 900 000 FG (2 jours × 950 000 FG), suivi dans « Mes réservations » (badge « en attente », bouton « Annuler »), puis annulation confirmée par le passage du statut à `ANNULEE`. Les comptes et données créés pour ces vérifications ont été supprimés ; les six publications de démonstration et leurs huit photos sont intactes.

L’archive de livraison a été régénérée après ces vérifications avec l’état complet et vérifié du projet (sans `node_modules`, `dist`, `.env` ni photos téléversées).
