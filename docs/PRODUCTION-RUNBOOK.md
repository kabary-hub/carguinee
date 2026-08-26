# ══════════════════════════════════════════════════════════════════════════════
# CarGuinée — Production Runbook
# ══════════════════════════════════════════════════════════════════════════════
#
# Ce document contient toutes les procédures nécessaires pour déployer,
# monitorer et maintenir CarGuinée en production.
# ══════════════════════════════════════════════════════════════════════════════

## Table des matières

1. [Prérequis serveur](#1-prérequis-serveur)
2. [Premier déploiement](#2-premier-déploiement)
3. [Déploiements suivants](#3-déploiements-suivants)
4. [Monitoring](#4-monitoring)
5. [Backups](#5-backups)
6. [Incidents](#6-incidents)
7. [Rollback](#7-rollback)
8. [Scale](#8-scale)
9. [Secrets](#9-secrets)
10. [Checklist pré-production](#10-checklist-pré-production)

---

## 1. Prérequis serveur

### OS recommandé
- Ubuntu 22.04 LTS ou Debian 12
- Minimum : 2 vCPU, 4 GB RAM, 40 GB SSD

### Services à installer

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL 16
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt-get update && sudo apt-get install -y postgresql-16

# Redis
sudo apt-get install -y redis-server

# Nginx
sudo apt-get install -y nginx

# PM2
sudo npm install -g pm2

# Docker (optionnel, pour conteneurs)
sudo apt-get install -y docker.io docker-compose-v2
```

### Configuration firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 2. Premier déploiement

### 2.1 Cloner le code

```bash
cd /var/www
git clone https://github.com/kabary-hub/carguinee.git
cd carguinee
```

### 2.2 Configurer l'environnement

```bash
cp .env.example .env

# Générer les secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # ENCRYPTION_KEY

# Éditer .env avec les vraies valeurs
nano .env
```

### 2.3 Configurer la base de données

```bash
# Créer la base
sudo -u postgres psql -c "CREATE USER carguinee WITH PASSWORD 'YOUR_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE carguinee OWNER carguinee;"

# Lancer les migrations
cd backend
npx prisma migrate deploy
npx prisma generate

# Seed les données initiales
npx tsx prisma/seed.ts
npx tsx prisma/seed-faq.ts
```

### 2.4 Build et démarrer

```bash
# Backend
cd backend
npm ci --omit=dev
npx tsc
cd ..

# Frontend
cd frontend
npm ci --omit=dev
npx vite build
cd ..

# Démarrer avec PM2
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

### 2.5 Configurer Nginx

```bash
sudo nano /etc/nginx/sites-available/carguinee
```

```nginx
server {
    listen 80;
    server_name carguinee.com www.carguinee.com;

    # Rediriger HTTP → HTTPS (après configuration du certificat)
    # return 301 https://$server_name$request_uri;

    # Frontend
    location / {
        root /var/www/carguinee/frontend/dist;
        try_files $uri $uri/ /index.html;

        # Cache statique
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Uploads
    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Swagger docs
    location /api/docs {
        proxy_pass http://127.0.0.1:3001;
    }

    # Health check
    location /api/health {
        proxy_pass http://127.0.0.1:3001;
        access_log off;
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/carguinee /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 2.6 SSL/TLS (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d carguinee.com -d www.carguinee.com
```

---

## 3. Déploiements suivants

### Via GitHub Actions (recommandé)

1. Aller sur **GitHub → Actions → Deploy Production**
2. Cliquer **"Run workflow"**
3. Optionnel : cocher "Rollback" pour revenir à la version précédente
4. Attendre que le pipeline passe au vert ✅

### Via ligne de commande

```bash
ssh deploy@YOUR_SERVER
cd /var/www/carguinee
git pull origin main

# Backend
cd backend && npm ci --omit=dev && npx prisma migrate deploy && npx tsc

# Frontend
cd ../frontend && npm ci --omit=dev && npx vite build

# Redémarrer
pm2 restart carguinee-blue --update-env
pm2 restart carguinee-green --update-env
```

---

## 4. Monitoring

### 4.1 Health Check

```bash
curl https://carguinee.com/api/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "service": "carguinee-api",
  "version": "1.0.0",
  "checks": {
    "database": "connected",
    "memory": "128MB / 256MB",
    "uptime": "86400s",
    "nodeVersion": "v20.x.x",
    "environment": "production"
  }
}
```

### 4.2 Logs

```bash
# Logs temps réel
pm2 logs carguinee-blue

# Logs erreur
pm2 logs carguinee-blue --err --lines 100

# Logs NGINX
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 4.3 Métriques Prometheus

```bash
curl http://localhost:3001/metrics
```

### 4.4 Sentry

- **Backend** : Configurez `SENTRY_DSN` dans `.env`
- **Frontend** : Configurez `VITE_SENTRY_DSN` dans `.env`
- Dashboard : https://sentry.io

### 4.5 PM2 Monitor

```bash
pm2 monit
```

---

## 5. Backups

### Backup automatique (cron)

```bash
# Ajouter au crontab
crontab -e

# Backup quotidien à 3h du matin, rétention 30 jours
0 3 * * * /var/www/carguinee/scripts/backup-db.sh --cron --retention 30 >> /var/log/carguinee/backup.log 2>&1
```

### Backup manuel

```bash
cd /var/www/carguinee
./scripts/backup-db.sh --retention 30
```

### Restaurer un backup

```bash
# Trouver le backup
ls -la /var/backups/carguinee/

# Restaurer
gunzip -c /var/backups/carguinee/carguinee-YYYYMMDD-HHMMSS.sql.gz | \
  psql "postgresql://carguinee:PASSWORD@localhost:5432/carguinee"
```

---

## 6. Incidents

### 6.1 Le site est inaccessible

```bash
# 1. Vérifier NGINX
sudo nginx -t
sudo systemctl status nginx

# 2. Vérifier le backend
pm2 status
pm2 logs carguinee-blue --lines 50

# 3. Vérifier la base de données
sudo -u postgres psql -c "SELECT 1;"
pg_isready -h localhost

# 4. Vérifier l'espace disque
df -h
```

### 6.2 Erreurs 500

```bash
# Chercher les erreurs dans les logs
pm2 logs carguinee-blue --err --lines 100

# Vérifier Sentry pour les erreurs détaillées
```

### 6.3 Lentueur

```bash
# Vérifier la charge CPU
htop

# Vérifier la mémoire
free -h

# Vérifier les connections DB
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Vérifier les slow queries
sudo -u postgres psql -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds';"
```

### 6.4 Base de données pleine

```bash
# Vérifier la taille
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('carguinee'));"

# Vaccum
sudo -u postgres psql -c "VACUUM VERBOSE ANALYZE;"
```

---

## 7. Rollback

### Via GitHub Actions

1. **GitHub → Actions → Deploy Production**
2. Cocher **"Rollback to previous version"**
3. Cliquer **"Run workflow"**

### Manuellement

```bash
ssh deploy@YOUR_SERVER
cd /var/www/carguinee
./scripts/rollback.sh

# Vérifier
curl https://carguinee.com/api/health
```

---

## 8. Scale

### Ajouter des instances PM2

```bash
# Éditer ecosystem.config.cjs : instances: 4 (au lieu de 2)
pm2 restart ecosystem.config.cjs --update-env
```

### Scale la base de données

```bash
# Passer en connection pooling avec PgBouncer
sudo apt-get install -y pgbouncer
```

---

## 9. Secrets

### Variables critiques à protéger

| Variable | Description | Générer avec |
|----------|-------------|-------------|
| `JWT_SECRET` | Secret JWT | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ENCRYPTION_KEY` | Clé chiffrement | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `DATABASE_URL` | URL PostgreSQL | Manuel |
| `SENTRY_DSN` | DSN Sentry | Sentry dashboard |
| `RESEND_API_KEY` | Clé email | Resend dashboard |
| `OM_APP_KEY` | Clé Orange Money | OM dashboard |

### Rotation des secrets

```bash
# 1. Générer un nouveau secret
NEW_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 2. Mettre à jour .env
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" /var/www/carguinee/.env

# 3. Redémarrer (les anciens tokens seront invalidés)
pm2 restart carguinee-blue --update-env
```

---

## 10. Checklist pré-production

### Sécurité
- [ ] `JWT_SECRET` ≥ 32 caractères, aléatoire
- [ ] `ENCRYPTION_KEY` configurée (pas la valeur par défaut)
- [ ] HTTPS activé (Let's Encrypt)
- [ ] CORS configuré pour le domaine de production
- [ ] Rate limiting actif
- [ ] CSP headers configurés
- [ ] Helmet activé

### Base de données
- [ ] Migrations appliquées (`npx prisma migrate deploy`)
- [ ] Données initiales seedées
- [ ] Backup automatique configuré (cron)
- [ ] Connection pooling (PgBouncer) si > 100 users simultanés

### Monitoring
- [ ] Sentry configuré (backend + frontend)
- [ ] Health check fonctionnel (`/api/health`)
- [ ] Logs structurés (JSON en production)
- [ ] Métriques Prometheus activées

### Performance
- [ ] Frontend buildé en production (`vite build`)
- [ ] Gzip activé dans Nginx
- [ ] Cache static configuré (1 an pour JS/CSS/images)
- [ ] Cache API configuré (stats : 30s TTL)

### CI/CD
- [ ] GitHub Actions CI au vert
- [ ] Docker Build fonctionnel
- [ ] Deploy Production configuré
- [ ] Rollback testé

### Données
- [ ] Comptes de test maintenus :
  - `620980117` / `12345678`
  - `620980118` / `12345678`
  - `620980119` / `12345678`
- [ ] FAQ seedées
- [ ] Données de démo (si applicable)

---

*Dernière mise à jour : 26 août 2026*
*Équipe : CarGuinée*
