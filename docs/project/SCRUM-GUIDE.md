# Guide Scrum — Carguinée

## Cadre de travail

| Élément | Valeur |
|---------|--------|
| Sprint duration | 2 semaines |
| Sprint start | Lundi |
| Sprint end | Vendredi (2 semaines après) |
| Daily standup | 9h15 — 15 min max |
| Sprint review | Vendredi 15h — 1h |
| Sprint retro | Vendredi 16h — 45 min |
| Backlog refinement | Mercredi 14h — 1h |

## Rôles

| Rôle | Responsabilité |
|------|---------------|
| Product Owner | Priorise le backlog, valide les user stories |
| Scrum Master | Facilite les cérémonies, bloque les obstacles |
| Dev Lead | Guide les choix techniques, review le code |
| Développeurs | Estiment, développent, testent |

## Story Points (Fibonacci modifié)

| Points | Effort | Description |
|--------|--------|-------------|
| 1 | Très petit | Typo, config, < 30 min de dev |
| 2 | Petit | Fix simple, composant isolé, < 2h |
| 3 | Moyen | Fonctionnalité standard, 1-2 jours |
| 5 | Grand | Fonctionnalité complexe, 3-4 jours |
| 8 | Très grand | Feature complete avec backend + frontend + tests |
| 13 | Épique | À découper — trop gros pour un sprint |
| 21 | Breakthrough | Recherche technique, spike nécessaire |

### Criterias of Done (CoD)

- [ ] Code written + peer reviewed
- [ ] Tests unitaires (>70% coverage)
- [ ] TypeScript compile sans erreur
- [ ] Lint passe (0 errors)
- [ ] Documentation mise à jour
- [ ] Fonctionnellement testé en local
- [ ] Déployé sur staging
- [ ] PO a validé

## Templates

### User Story

```markdown
### US-{ID}: {Titre}

**En tant que** {rôle}
**Je veux** {action}
**Afin de** {bénéfice}

**Critères d'acceptation :**
- [ ] {Critère 1}
- [ ] {Critère 2}
- [ ] {Critère 3}

**Estimation :** {X} points
**Priorité :** P0 | P1 | P2 | P3
**Sprint :** #{numéro}
```

### Bug Report

```markdown
### BUG-{ID}: {Titre}

**Description :** {comment reproduire}
**Comportement attendu :** {ce qui devrait se passer}
**Comportement actuel :** {ce qui se passe}
**Environnement :** staging | production
**Sévérité :** Critique | Majeure | Mineure
**Screenshot :** {lien}
```

## Cérémonies

### Daily Standup (15 min)

Chaque membre répond à :
1. Qu'est-ce que j'ai fait hier ?
2. Qu'est-ce que je vais faire aujourd'hui ?
3. Qu'est-ce qui me bloque ?

### Sprint Planning (2h)

1. Review du backlog (30 min)
2. Estimation collective des stories (45 min)
3. Engagement du sprint (30 min)
4. Découpage des tâches (15 min)

### Sprint Review (1h)

1. Démonstration des features livrées (45 min)
2. Feedback du PO (15 min)

### Sprint Retrospective (45 min)

Format "Start / Stop / Continue" :
- **Start** : Quoi commencer à faire ?
- **Stop** : Quoi arrêter de faire ?
- **Continue** : Quoi continuer à faire ?

### Backlog Refinement (1h)

1. Review des stories à venir (30 min)
2. Estimation et découpage (30 min)
