# ══════════════════════════════════════════════════════════════════════════════
# CarGuinée Backend — Dockerfile (multi-stage)
# ══════════════════════════════════════════════════════════════════════════════

# ── Étape 1 : Builder ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Installer les dépendances
COPY package.json package-lock.json* ./
RUN npm ci

# Copier le code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Compiler TypeScript
RUN npm run build

# ── Étape 2 : Production ───────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Installer les dépendances de production uniquement
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copier le client Prisma généré
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copier le code compilé
COPY --from=builder /app/dist ./dist

# Copier le schema Prisma (nécessaire pour les migrations)
COPY prisma ./prisma

# Créer le dossier uploads
RUN mkdir -p /app/uploads

# Port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Démarrer
CMD ["node", "dist/server.js"]
