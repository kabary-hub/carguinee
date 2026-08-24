# ADR-002 : Authentification hybride (Cookie httpOnly + localStorage)

**Statut** : Accepté  
**Date** : 2025  
**Décideurs** : Équipe CarGuinée

## Contexte

Le frontend (localhost:5173) et le backend (localhost:3000) tournent sur des origines différentes en développement. Les cookies `sameSite: "lax"` ne sont pas envoyés par les requêtes `fetch` cross-origin.

## Décision

Le JWT est stocké **deux fois** :
1. **Cookie httpOnly** (`auth_token`) — protection XSS, envoi automatique pour les navigations top-level
2. **localStorage** (`carguinee_access_token`) — fallback pour les `fetch` cross-origin via header `Authorization: Bearer`

Le backend accepte les deux sources dans `extractToken()` :
```typescript
function extractToken(request: Request): string | null {
  // 1. Header Authorization
  const authorization = request.header("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7);
  // 2. Cookie httpOnly
  return request.cookies?.auth_token ?? null;
}
```

## Alternatives considérées

- **Cookie seul** : Cassé en dev cross-origin (sameSite: lax)
- **localStorage seul** : Vulnérable XSS
- **Proxy reverse** : Complexity supplémentaire, pas nécessaire en prod avec même domaine

## Conséquences

- ✅ Fonctionne en dev ET en prod
- ✅ Double protection (cookie + header)
- ⚠️ Le token dans localStorage est accessible au JS (XSS) — mitigé par CSP enforced
- ⚠️ Durée de vie : 24h pour les deux
