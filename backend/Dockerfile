# ══════════════════════════════════════════════════════════════════════════════
# CarGuinée Backend — Dockerfile (multi-stage optimisé)
# ══════════════════════════════════════════════════════════════════════════════

# ── Étape 1 : Dépendances ──────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copier uniquement package.json + lock pour maximiser le cache Docker
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Générer Prisma client
COPY prisma ./prisma
RUN npx prisma generate

# ── Étape 2 : Build ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les dépendances installées depuis deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./

# Copier le code source
COPY tsconfig.json ./
COPY src ./src

# Compiler TypeScript
RUN npx tsc --outDir dist

# ── Étape 3 : Production ───────────────────────────────────────────────────
FROM node:20-alpine AS production

# Installer wget pour le healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Copier uniquement le nécessaire
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/package.json ./
COPY prisma ./prisma

# Créer les dossiers nécessaires
RUN mkdir -p /app/uploads /var/log/carguinee

# Créer un user non-root pour la sécurité
RUN addgroup -g 1001 -S carguinee && \
    adduser -S carguinee -u 1001 -G carguinee && \
    chown -R carguinee:carguinee /app

USER carguinee

# Port
EXPOSE 3000

# Health check robuste
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Démarrer
CMD ["node", "dist/server.js"]
