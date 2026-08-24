# Audit de Sécurité — CarGuinée

**Date** : Août 2025  
**Auditeur** : Buffy (AI Code Review)  
**Version** : 1.0

---

## 📊 Résumé

| Catégorie | Score | Statut |
|-----------|-------|--------|
| Authentification | 8/10 | ✅ Bon |
| Autorisation | 7/10 | ✅ Bon |
| Validation des entrées | 8/10 | ✅ Bon |
| Sécurité des données | 7/10 | ✅ Bon |
| Sécurité des headers | 9/10 | ✅ Excellent |
| Rate Limiting | 8/10 | ✅ Bon |
| Logging & Monitoring | 7/10 | ✅ Bon |
| Dépendances | 6/10 | ⚠️ À surveiller |
| **Score global** | **7.5/10** | **✅ Acceptable** |

---

## ✅ OWASP Top 10 — Checklist

### A01:2021 — Broken Access Control ✅

| Contrôle | Statut | Détail |
|----------|--------|--------|
| Auth obligatoire sur routes protégées | ✅ | `requireAuth` middleware sur toutes les routes privées |
| Vérification des rôles | ✅ | `requireRoles("ADMIN")` sur les routes admin |
| Possession des ressources | ✅ | `extractUserId` + vérification propriétaire |
| CORS configuré | ✅ | Origines explicites, credentials: true |
| CSRF protection | ✅ | Middleware `setCsrfCookie` + `validateCsrf` |

### A02:2021 — Cryptographic Failures ✅

| Contrôle | Statut | Détail |
|----------|--------|--------|
| Mots de passe hashés | ✅ | bcrypt, 12 rounds |
| JWT signé | ✅ | HS256 avec secret ≥32 chars |
| Chiffrement données sensibles | ✅ | AES-256-GCM via `ENCRYPTION_KEY` |
| HTTPS en production | ⚠️ | HSTS configuré, à activer avec certificat TLS |
| Pas de secrets en dur | ✅ | Variables d'environnement uniquement |

### A03:2021 — Injection ✅

| Contrôle | Statut | Détail |
|----------|--------|--------|
| Requêtes paramétrées | ✅ | Prisma ORM (pas de SQL brut) |
| Validation des entrées | ✅ | Zod sur toutes les routes |
| XSS | ✅ | CSP enforced + React auto-escaping |
| NoSQL injection | N/A | PostgreSQL |

### A04:2021 — Insecure Design ✅

| Contrôle | Statut | Détail |
|----------|--------|--------|
| Architecture modulaire | ✅ | Modules séparés (auth, admin, vehicles...) |
| Séparation frontend/backend | ✅ | Deux applications distinctes |
| ADR documentés | ✅ | 6 ADR dans docs/adr/ |

### A05:2021 — Security Misconfiguration ✅

| Contrôle | Statut | Détail |
|----------|--------|--------|
| Security Headers | ✅ | CSP enforced, HSTS, X-Frame-Options DENY |
| Helmet | ✅ | Configuré avec cross-origin resource policy |
| Error handling | ✅ | Pas de stack traces en prod |
| CORS | ✅ | Origines whitelistées |

### A06:2021 — Vulnerable Components ⚠️

| Contrôle | Statut | Détail |
|----------|--------|--------|
| Frontend | ✅ | 0 vulnérabilités |
| Backend | ⚠️ | 3 vulnérabilités (deepmerge-ts via Prisma) |
| Action | ⚠️ | `npm audit fix --force` ou attendre mise à jour Prisma |

### A07:2021 — Auth Failures ✅

| Contrôle | Statut | Détail |
|----------|--------|--------|
| Rate limiting login | ✅ | 10 tentatives/15min, skipSuccessfulRequests |
| Rate limiting strict | ✅ | 20 req/h pour actions sensibles |
| JWT expiration | ✅ | 24h |
| Cookie httpOnly | ✅ | auth_token inaccessible au JS |
| Account lockout | ✅ | `isBanned` + `isActive` flags |

### A08:2021 — Data Integrity Failures ✅

| Contrôle | Statut | Détail |
|----------|--------|--------|
| Transactions DB | ✅ | Prisma transactions pour opérations atomiques |
| Validation entrées | ✅ | Zod schemas sur toutes les routes |
| Upload validation | ✅ | Type MIME + taille max (2MB) |

### A09:2021 — Logging Failures ✅

| Contrôle | Statut | Détail |
|----------|--------|--------|
| Logs structurés | ✅ | Pino (JSON en prod) |
| Correlation ID | ✅ | X-Request-Id sur chaque requête |
| Erreurs sensibles | ✅ | Logger.error sur erreurs 5xx |
| Monitoring | ✅ | Sentry configuré |
| Métriques | ✅ | Prometheus (/metrics endpoint) |

### A10:2021 — SSRF ✅

| Contrôle | Statut | Détail |
|----------|--------|--------|
| URLs internes contrôlées | ✅ | Pas d'URLs utilisateur dans les appels serveur |
| LibreTranslate | ✅ | URL configurée en env var |

---

## 🔧 Recommandations

### Priorité haute
1. **Mettre à jour Prisma** — corrige les 3 vulnérabilités deepmerge-ts
2. **Activer HTTPS** en production (certificat TLS obligatoire)

### Priorité moyenne
3. **Corriger les 34 erreurs ESLint** (setState dans useEffect)
4. **Ajouter un audit de dépendances** dans le CI (`npm audit`)

### Priorité basse
5. **Ajouter un pentest** externe si budget disponible
6. **Monitoring uptime** (UptimeRobot, etc.)

---

## 📋 Checklist OWASP Top 10 — Score

| # | Vulnérabilité | Score |
|---|--------------|-------|
| A01 | Broken Access Control | ✅ 9/10 |
| A02 | Cryptographic Failures | ✅ 8/10 |
| A03 | Injection | ✅ 9/10 |
| A04 | Insecure Design | ✅ 8/10 |
| A05 | Security Misconfiguration | ✅ 9/10 |
| A06 | Vulnerable Components | ⚠️ 6/10 |
| A07 | Auth Failures | ✅ 8/10 |
| A08 | Data Integrity Failures | ✅ 8/10 |
| A09 | Logging Failures | ✅ 8/10 |
| A10 | SSRF | ✅ 9/10 |
| **Moyenne** | | **✅ 8.2/10** |
