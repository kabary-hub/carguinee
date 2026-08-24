# Guide de Déploiement — CarGuinée

## Prérequis

- Node.js 22+
- PostgreSQL 16+
- Certificat TLS (Let's Encrypt, Cloudflare, etc.)

## Variables d'environnement (production)

```bash
# Base de données
DATABASE_URL=postgresql://user:pass@host:5432/carguinee

# Auth
JWT_SECRET=<hex secret, 64 chars>
ENCRYPTION_KEY=<hex secret, 64 chars>

# Frontend
CORS_ORIGIN=https://carguinee.com
NODE_ENV=production

# Email
RESEND_API_KEY=re_...

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

## HTTPS

Le backend configure automatiquement :
- Cookie `secure: true` en production (HTTPS requis)
- Header `Strict-Transport-Security` (HSTS, 2 ans)
- Redirection HTTP → HTTPS (à configurer au niveau du proxy/load balancer)

### Options de déploiement

| Option | Description |
|--------|-------------|
| **Nginx + Let's Encrypt** | Reverse proxy avec certificat gratuit |
| **Cloudflare** | DNS + CDN + certificat automatique |
| **AWS ALB** | Load balancer avec certificat ACM |
| **Railway / Render** | HTTPS automatique |

### Exemple Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name carguinee.com;

    ssl_certificate /etc/letsencrypt/live/carguinee.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/carguinee.com/privkey.pem;

    # Proxy vers le backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (fichiers statiques)
    location / {
        root /var/www/carguinee/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}

# Redirection HTTP → HTTPS
server {
    listen 80;
    server_name carguinee.com;
    return 301 https://$server_name$request_uri;
}
```

## Démarrage

```bash
# Backend
cd backend
npx prisma generate
npx prisma db push
node dist/server.js

# Frontend (fichiers statiques)
cd frontend
npx vite build
# Servir dist/ avec Nginx ou CDN
```
