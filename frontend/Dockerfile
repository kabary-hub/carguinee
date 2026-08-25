# ══════════════════════════════════════════════════════════════════════════════
# CarGuinée Frontend — Dockerfile (développement avec HMR)
# ══════════════════════════════════════════════════════════════════════════════

FROM node:20-alpine

WORKDIR /app

# Installer les dépendances
COPY package.json package-lock.json* ./
RUN npm ci

# Copier le code source
COPY . .

# Exposer le port Vite
EXPOSE 5173

# Démarrer Vite en mode dev
CMD ["npx", "vite", "--host", "0.0.0.0"]
