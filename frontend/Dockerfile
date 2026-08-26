# ══════════════════════════════════════════════════════════════════════════════
# CarGuinée Frontend — Dockerfile (multi-stage optimisé)
# ══════════════════════════════════════════════════════════════════════════════

# ── Étape 1 : Build ────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copier package.json + lock pour maximiser le cache
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

# Copier le code source
COPY . .

# Build production
RUN npm run build

# ── Étape 2 : Production ───────────────────────────────────────────────────
FROM nginx:1.25-alpine AS production

# Supprimer la config par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Copier la config nginx personnalisée depuis le build stage
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés
COPY --from=build /app/dist /usr/share/nginx/html

# Créer un user non-root
RUN addgroup -g 1001 -S carguinee && \
    adduser -S carguinee -u 1001 -G carguinee && \
    chown -R carguinee:carguinee /usr/share/nginx/html && \
    chown -R carguinee:carguinee /var/cache/nginx && \
    chown -R carguinee:carguinee /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R carguinee:carguinee /var/run/nginx.pid

# Exposer le port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
