# Audit RGAA 4.1 — Carguinée

**Date d'audit :** {date}
**Auditeur :** {nom}
**Version testée :** {version}
**URL testée :** https://carguinee.com

---

## Score global

| Critère | Conforme | Partiellement | Non conforme | N/A |
|---------|----------|--------------|-------------|-----|
| Total (106 critères) | {n} | {n} | {n} | {n} |
| **Score RGAA** | **{X}/100** | | | |

---

## Critères testés

### 1. Images (1.1 → 1.11)

| Critère | Statut | Détail |
|---------|--------|--------|
| 1.1 Chaque image porteuse d'information a-t-elle une alternative textuelle ? | ✅ | `alt` sur toutes les `<img>` |
| 1.2 Chaque zone d'une image réactive a-t-elle une alternative textuelle ? | ✅ | `alt` sur les `<area>` |
| 1.3 Chaque zone d'une image réactive est-elle redondante ? | ✅ | |
| 1.4 Chaque image vectorielle a-t-elle une alternative textuelle ? | ✅ | SVG avec `<title>` |
| 1.5 Chaque image de décoration est-elle correctement ignorée par les technologies d'assistance ? | ✅ | `alt=""` ou CSS background |
| 1.6 Chaque image porteuse d'information est-elle utilisée de manière pertinente ? | ✅ | |
| 1.7 Chaque image texte porteuse d'information est-elle remplacée par du texte stylé ? | ✅ | Logo = texte stylé |
| 1.8 Chaque image texte est-elle utilisée de manière pertinente ? | ✅ | |
| 1.9 Chaque image complexe a-t-elle une description détaillée ? | ✅ | Pas d'images complexes |
| 1.10 Chaque image texte a-t-elle un mécanisme de remplacement ? | ✅ | |
| 1.11 Chaque image de décoration est-elle pertinente ? | ✅ | |

### 2. Couleurs (2.1 → 2.5)

| Critère | Statut | Détail |
|---------|--------|--------|
| 2.1 Chaque couleur utilisée pour transmettre une information est-elle accompagnée d'un indice visuel ? | ⚠️ | Badge de statut : utiliser icône + texte |
| 2.2 Le contraste entre le texte et l'arrière-plan est-il suffisamment élevé ? | ⚠️ | Vérifier text-sm gray-500 |
| 2.3 L'information ne doit pas être donnée uniquement par la couleur ? | ✅ | |

### 3. Multimédia (3.1 → 3.3)

| Critère | Statut | Détail |
|---------|--------|--------|
| 3.1 Chaque média temporel pré-enregistré a-t-il une audio-description ? | N/A | Pas de vidéos |
| 3.2 Chaque média temporel pré-enregistré a-t-il des sous-titres ? | N/A | |
| 3.3 Chaque média temporel pré-enregistré a-t-il une transcription ? | N/A | |

### 4. Tableaux (4.1 → 4.3)

| Critère | Statut | Détail |
|---------|--------|--------|
| 4.1 Chaque tableau de données complexe a-t-il un résumé ? | N/A | |
| 4.2 Chaque tableau de données a-t-il un titre ? | ✅ | Tables utilisées avec `<caption>` |
| 4.3 Chaque tableau de disposition est-il utilisée de manière pertinente ? | ✅ | Pas de tables de layout |

### 5. Liens (5.1 → 5.7)

| Critère | Statut | Détail |
|---------|--------|--------|
| 5.1 Chaque lien est-il explicite ? | ✅ | |
| 5.2 Chaque lien a-t-il un intitulé explicite ? | ⚠️ | Vérifier liens "En savoir plus" |
| 5.3 Chaque lien interne est-il pertinent ? | ✅ | |
| 5.4 Chaque lien externe est-il explicite ? | ✅ | `target="_blank"` avec `aria-label` |
| 5.5 Chaque lien a-t-il un intitulé ? | ✅ | |
| 5.6 Chaque lien vide est-il évité ? | ✅ | |
| 5.7 Chaque intitulé de lien est-il unique ? | ✅ | |

### 6. Formulaires (6.1 → 6.6)

| Critère | Statut | Détail |
|---------|--------|--------|
| 6.1 Chaque champ de formulaire a-t-il une étiquette ? | ✅ | `<label>` partout |
| 6.2 Chaque étiquette est-elle pertinente ? | ✅ | |
| 6.3 Chaque étiquette est-elle accolée au champ ? | ✅ | |
| 6.4 Chaque champ obligatoire est-il signalé ? | ✅ | `required` attribute |
| 6.5 Chaque erreur de saisie est-elle signalée ? | ✅ | `role="alert"` |
| 6.6 Chaque erreur de saisie est-elle explicite ? | ✅ | Messages traduits FR/EN |

### 7. Navigation (7.1 → 7.6)

| Critère | Statut | Détail |
|---------|--------|--------|
| 7.1 L'ordre de tabulation est-il pertinent ? | ⚠️ | Vérifier z-index modals |
| 7.2 La navigation est-elle cohérente ? | ✅ | Menu fixe dans AppShell |
| 7.3 Chaque zone de regroupement est-elle pertinente ? | ✅ | `<nav>`, `<main>`, `<footer>` |
| 7.4 Chaque titre de regroupement est-il pertinent ? | ✅ | `<h1>` → `<h2>` hiérarchique |
| 7.5 Chaque page a-t-elle un titre ? | ✅ | `<title>` via SEO component |
| 7.6 Les raccourcis clavier uniques sont-ils évités ? | ✅ | |

### 8. Structuration de l'information (8.1 → 8.5)

| Critère | Statut | Détail |
|---------|--------|--------|
| 8.1 L'information est-elle structurée par l'utilisation appropriée de titres ? | ✅ | |
| 8.2 La structure du document est-elle pertinente ? | ✅ | `<header>`, `<nav>`, `<main>`, `<footer>` |
| 8.3 Les listes sont-elles correctement utilisées ? | ✅ | `<ul>`, `<ol>` |
| 8.4 Les citations sont-elles correctement utilisées ? | N/A | |
| 8.5 Chaque page peut-elle être lisible au fur et à mesure du chargement ? | ✅ | Lazy loading |

### 9. Présentation de l'information (9.1 → 9.10)

| Critère | Statut | Détail |
|---------|--------|--------|
| 9.1 L'information ne doit pas être donnée uniquement par la forme, taille ou position ? | ✅ | |
| 9.2 Le contenu visible porteur d'information reste-t-il présent lorsque les feuilles de styles sont désactivées ? | ⚠️ | Dark mode à vérifier |
| 9.3 L'information ne doit pas être donnée uniquement par la couleur ? | ✅ | |
| 9.4 Les feuilles de styles sont-elles utilisées de manière pertinente ? | ✅ | TailwindCSS |
| 9.5 Chaque page est-elle affichable en 320px ? | ✅ | Responsive design |
| 9.6 Chaque page peut-elle être imprimée ? | ✅ | Print stylesheet |
| 9.7 Le texte reste-t-il lisible quand la taille des caractères est augmentée ? | ✅ | rem/em units |
| 9.8 Les contenus cachés sont-ils pertinents ? | ✅ | `sr-only` classes |
| 9.9 Le langage par défaut est-il pertinent ? | ✅ | `<html lang="fr">` |
| 9.10 La langue de chaque page est-elle pertinente ? | ✅ | i18n détecte automatiquement |

### 10. JavaScript (10.1 → 10.8)

| Critère | Statut | Détail |
|---------|--------|--------|
| 10.1 Les contenus JavaScript sont-ils contrôlables ? | ✅ | |
| 10.2 Les contenus JavaScript sont-ils utilisables ? | ✅ | |
| 10.3 Les new-windows sont-elles annoncées ? | ✅ | `target="_blank"` avec label |
| 10.4 Le focus est-il géré de manière pertinente ? | ⚠️ | Focus trap dans modals |
| 10.5 Les modifications du DOM sont-elles annoncées ? | ⚠️ | `aria-live` à ajouter |
| 10.6 Les changements de contexte sont-ils pertinents ? | ✅ | |
| 10.7 Les messages de statut sont-ils pertinents ? | ✅ | Toast notifications |
| 10.8 Les messages de statut sont-ils advançés ? | ✅ | |

### 11. Forms (11.1 → 11.13)

| Critère | Statut | Détail |
|---------|--------|--------|
| 11.1 Chaque champ de formulaire a-t-il une étiquette visible ? | ✅ | |
| 11.2 Chaque étiquette de champ de formulaire est-elle pertinente ? | ✅ | |
| 11.3 Chaque étiquette de champ est-elle accolée au champ ? | ✅ | |
| 11.4 Chaque champ obligatoire est-il signalé ? | ✅ | `aria-required="true"` |
| 11.5 Chaque erreur de saisie est-elle signalée ? | ✅ | `role="alert"` |
| 11.6 Chaque erreur de saisie est-elle explicite ? | ✅ | |
| 11.7 Chaque erreur de saisie est-elle perceptible ? | ✅ | |
| 11.8 Chaque champ a-t-il une borne de saisie ? | ⚠️ | `min`, `max` sur number inputs |
| 11.9 Chaque suggestion est-elle pertinente ? | ✅ | |
| 11.10 Les suggestions facilitent-elles la saisie ? | ✅ | |
| 11.11 Chaque champ a-t-il un mécanisme de validation ? | ✅ | Zod backend |
| 11.12 Le mécanisme de validation est-il accessible ? | ✅ | |
| 11.13 Chaque liste de suggestions est-elle navigable ? | N/A | |

---

## Recommandations prioritaires

| Priorité | Recommandation | Critère RGAA |
|----------|---------------|-------------|
| 🔴 P1 | Ajouter `aria-live="polite"` aux toasts et notifications | 10.5 |
| 🔴 P1 | Vérifier le focus trap dans les modals (ConfirmDialog, VehicleStatusModal) | 10.4 |
| 🟡 P2 | Ajouter `aria-label` aux boutons d'action sans texte visible | 5.2 |
| 🟡 P2 | Vérifier le contraste des textes gris sur fond sombre (dark mode) | 2.2 |
| 🟢 P3 | Ajouter des `<h2>` hiérarchiques dans les pages profil | 8.1 |
| 🟢 P3 | Ajouter `aria-describedby` sur les champs avec aide | 11.1 |
