# ADR-004 : Content Security Policy (CSP) enforced

**Statut** : Accepté  
**Date** : 2025  
**Décideurs** : Équipe CarGuinée

## Contexte

Le CSP initial était en mode `report-only` pour identifier les violations sans bloquer. Après audit, les violations ont été corrigées.

## Décision

Passage en mode **bloquant** (`Content-Security-Policy`) :

```
default-src 'self'
script-src 'self' 'nonce-{random}'
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob:
font-src 'self'
connect-src 'self'
object-src 'none'
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
```

- **Nonce** : Généré par requête pour les scripts inline (PWA)
- **unsafe-inline pour styles** : Nécessaire pour Tailwind CSS
- **Reporting** : Violations envoyées à `/api/csp-report`

## Alternatives considérées

- **Rester en report-only** : Pas de protection réelle
- **hash au lieu de nonce** : Plus simple mais moins flexible

## Conséquences

- ✅ Protection XSS renforcée
- ✅ Reporting des violations pour debug
- ⚠️ Tout script inline sans nonce est bloqué
- ⚠️ Revert possible : remplacer `Content-Security-Policy` par `Content-Security-Policy-Report-Only`
