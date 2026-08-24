# Registre des Risques — Carguinée

**Dernière mise à jour :** {date}
**Propriétaire :** Product Owner + Tech Lead

---

## Matrice de criticité

| Impact ↓ / Probabilité → | Faible (1) | Moyenne (2) | Élevée (3) |
|--------------------------|-----------|------------|-----------|
| **Critique (4)** | 4 🟡 | 8 🟠 | 12 🔴 |
| **Majeur (3)** | 3 🟢 | 6 🟡 | 9 🟠 |
| **Mineur (2)** | 2 🟢 | 4 🟡 | 6 🟡 |
| **Négligeable (1)** | 1 🟢 | 2 🟢 | 3 🟢 |

**Légende :** 🟢 Acceptable | 🟡 Surveiller | 🟠 Action requise | 🔴 Critique

---

## Registre

| ID | Catégorie | Risque | Impact | Probabilité | Score | Mitigation | Propriétaire | Statut |
|----|-----------|--------|--------|-------------|-------|------------|-------------|--------|
| R01 | Technique | Perte de données en production | Critique (4) | Faible (1) | 4 🟡 | Backup auto quotidien + point-in-time recovery | Tech Lead | Surveillé |
| R02 | Technique | Vulnérabilité de sécurité non détectée | Critique (4) | Moyenne (2) | 8 🟠 | Pentest trimestriel + audit npm + CSP | Tech Lead | Actif |
| R03 | Technique | Performance dégradée sous charge | Majeur (3) | Moyenne (2) | 6 🟡 | k6 load tests + monitoring Prometheus + auto-scaling | Dev Lead | Surveillé |
| R04 | Technique | Dépendance critique abandonnée (React, Prisma...) | Majeur (3) | Faible (1) | 3 🟢 | Veille technologique mensuelle + abstractions | Tech Lead | Surveillé |
| R05 | Technique | Bug critique en production non détecté | Critique (4) | Moyenne (2) | 8 🟠 | Tests E2E + monitoring Sentry + rollback auto | Dev Lead | Actif |
| R06 | Organisationnel | Turnover d'un développeur clé | Majeur (3) | Moyenne (2) | 6 🟡 | Documentation + pair programming + knowledge sharing | PO | Actif |
| R07 | Organisationnel | Scope creep (dérive de périmètre) | Majeur (3) | Élevée (3) | 9 🟠 | Backlog priorisé + sprint planning strict + CoD | PO | Actif |
| R08 | Organisationnel | Retard de livraison | Majeur (3) | Moyenne (2) | 6 🟡 | Estimation en story points + buffer 20% | Scrum Master | Surveillé |
| R09 | Juridique | Non-conformité RGPD | Critique (4) | Faible (1) | 4 🟡 | Audit RGPD + chiffrement + consentement cookie | PO | Surveillé |
| R10 | Juridique | Litige avec un utilisateur | Mineur (2) | Faible (1) | 2 🟢 | CGU claires + logs d'audit + assurance RC | PO | Surveillé |
| R11 | Financier | Coût d'infrastructure qui explose | Mineur (2) | Faible (1) | 2 🟢 | Monitoring coûts + alertes + optimization | Tech Lead | Surveillé |
| R12 | External | Indisponibilité d'un service tiers (Resend, Sentry) | Majeur (3) | Faible (1) | 3 🟢 | Fallback + retry + circuit breaker | Dev Lead | Surveillé |
| R13 | External | Attaque DDoS | Critique (4) | Faible (1) | 4 🟡 | CDN + rate limiting + WAF | Tech Lead | Surveillé |
| R14 | Qualité | Couverture de tests insuffisante | Majeur (3) | Élevée (3) | 9 🟠 | CI gate ≥ 70% + revue de code obligatoire | Dev Lead | Actif |
| R15 | Données | Corruption de données par un script | Critique (4) | Faible (1) | 4 🟡 | Transactions DB + migrations versionnées + backups | Tech Lead | Surveillé |

---

## Actions correctives en cours

| ID Risque | Action | Délai | Responsable | Statut |
|-----------|--------|-------|-------------|--------|
| R02 | Mettre en place pentest trimestriel | Q3 2026 | Tech Lead | 🟡 Planifié |
| R07 | Formaliser le processus de gestion du scope | Sprint 12 | PO | ✅ Terminé |
| R14 | Atteindre 70% de couverture de tests | Sprint 13 | Dev Lead | 🟡 En cours |

---

## Révision

Le registre est revu :
- **Hebdomadairement** en daily standup (vérification des risques actifs)
- **À chaque sprint review** (mise à jour des statuts)
- **Mensuellement** en comité de pilotage (nouveaux risques)
