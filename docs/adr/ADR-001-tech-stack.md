# ADR-001 : Choix du Tech Stack

**Statut** : Accepté  
**Date** : 2025  
**Décideurs** : Équipe CarGuinée

## Contexte

CarGuinée est une plateforme de vente et location de véhicules à Conakry, Guinée. Il faut un stack performant, maintenable et adapté au marché africain (connexions parfois lentes, appareils mobiles variés).

## Décision

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Frontend | React 19 + TypeScript | Écosystème mature, perf, typage fort |
| Styling | Tailwind CSS v4 | Rapidité de développement, design system cohérent |
| Build | Vite | Fast HMR, build optimisé, PWA plugin |
| Backend | Express 5 + TypeScript | Léger, flexibilité, large adoption |
| ORM | Prisma | Type-safe, migrations, bon DX |
| BDD | PostgreSQL | ACID, fiable, JSON support |
| Auth | JWT (cookie + Bearer) | Stateless, cross-origin compatible |
| Email | Resend | Fiable, API simple, bon free tier |
| Monitoring | Sentry | Error tracking, performance |
| i18n | react-i18next | Standard React, lazy loading |

## Alternatives considérées

- **Next.js** : Rejeté — SSR non nécessaire, complexity supérieure
- **NestJS** : Rejeté — Over-engineering pour une API REST
- **MongoDB** : Rejeté — Relations complexes (users↔vehicles↔bookings)
- **Supabase** : Considéré mais Prisma + PostgreSQL offre plus de contrôle

## Conséquences

- ✅ Équipe productive avec un stack familier
- ✅ TypeScript partout = moins de bugs
- ⚠️ Prisma peut être lent pour des requêtes très complexes
- ⚠️ Express nécessite plus de boilerplate qu'un framework batteries-included
