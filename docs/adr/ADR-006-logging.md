# ADR-006 : Logging structuré avec Pino

**Statut** : Accepté  
**Date** : 2025  
**Décideurs** : Équipe CarGuinée

## Contexte

Le logging doit être performant, structuré et prêt pour la production (JSON pour ELK/Datadog).

## Décision

- **Librairie** : Pino (le plus rapide pour Node.js)
- **Dev** : pino-pretty (format lisible, colorisé)
- **Prod** : JSON brut (pour ingestion ELK/Datadog/Grafana)
- **Correlation ID** : Généré par requête (`X-Request-Id`), propagé dans les logs
- **Middleware** : `requestLogger` loggue méthode, URL, status, durée, IP

```typescript
// Configuration
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport: process.env.NODE_ENV !== "production"
    ? { target: "pino-pretty", options: { colorize: true } }
    : undefined,
});
```

## Alternatives considérées

- **Winston** : Plus lent, moins de benchmarks favorables
- **console.log** : Non structuré, pas de levels, pas de correlation ID
- **Bunyan** : Abandonné au profit de Pino

## Conséquences

- ✅ Logs structurés et filtrables
- ✅ Performance : 5x plus rapide que Winston
- ✅ Correlation ID pour tracer les requêtes
- ⚠️ pino-pretty uniquement en dev (pas en prod)
