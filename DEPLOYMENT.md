# Wesiq Backend: Deployment & Architecture Guide

Wesiq is a single Django project (one app, `app`) that serves two clients:
- a server-rendered website (session auth + CSRF)
- a JSON API for the native mobile app at `/native-api/` (JWT bearer tokens)

The repository root holds `docker-compose.yml` and `.env`. The Django project lives in `wesiq/` (`manage.py`, `core/` = settings/urls/asgi/celery, `app/` = the app).

> ⚠️ **Read section 0 first.** It lists the things that are easy to get wrong on a bare VM.

---

## 0. Important Notes Before Production

| # | Note | Where | What to do |
|---|------|-------|------------|
| 1 | **The app is ASGI (WebSockets).** Plain Gunicorn WSGI (`core.wsgi`) breaks chat and notifications. | `core/asgi.py` | Run `core.asgi:application` with Gunicorn + Uvicorn workers (both are in `requirements.txt`) or Daphne. |
| 2 | **Redis is configured with `REDIS_URL`.** The default `redis://redis:6379/0` only resolves inside Docker. | `.env` | On a VM, set `REDIS_URL=redis://127.0.0.1:6379/0`. |
| 3 | **Front-end assets are not committed.** TypeScript `dist/` and all `.css` files are gitignored. | `wesiq/static/`, `wesiq/app/static/` | Build them on deploy with Node.js (see step 4.5). |
| 4 | `GEOS_LIBRARY_PATH` is hard-coded to `/usr/lib/x86_64-linux-gnu/libgeos_c.so`. | `core/settings.py` | Use an **x86_64** VM (or the developer changes the path for ARM). |
| 5 | Android/iOS deep-link files (`/.well-known/assetlinks.json`, `apple-app-site-association`) still contain placeholder values (`"TEST"` fingerprint, empty package name). | `app/api/views.py` | Developer fills in the real package name, SHA-256 cert fingerprint, and Apple Team ID. |

---

## 1. Core Tech Stack & Versions

| Component | Version / Detail |
|-----------|------------------|
| Python | **3.12** (the Dockerfile uses `python:3.12-slim`; Django 6 requires ≥ 3.12) |
| Django | **6.0.3** |
| Interface | **ASGI** via Django Channels (`core.asgi:application`). HTTP and WebSockets go through the same app. |
| Database | **PostgreSQL 17 + PostGIS 3.5** (GeoDjango is used for post locations; engine `postgis://`) |
| Cache / broker / channel layer | **Redis 7** (db 0 = Celery broker and results, db 1 = Django cache, plus the Channels layer) |
| Background jobs | **Celery 5.6** worker + **Celery Beat** (`django_celery_beat` DatabaseScheduler; schedules are managed in Django admin) |
| Monitoring | **Flower** (Celery dashboard, internal only) |
| Media processing | **FFmpeg / ffprobe** (system binaries, called from Celery tasks) for video compression, HLS (`.m3u8` + `.ts`), thumbnails, sprite sheets and VTT. Also MoviePy and Pillow. |
| Geo libs | GDAL, GEOS, PROJ (system packages) |
| File type detection | `python-magic` → needs `libmagic1` |

### Key Python packages
`gunicorn` + `uvicorn[standard]` (production ASGI server), `channels`, `channels-redis`, `daphne`, `celery`, `django-celery-beat`, `django-redis`, `flower`, `djangorestframework`, `djangorestframework-simplejwt` (with token blacklist), `django-cors-headers`, `django-allauth` (Google OAuth), `django-unfold` (admin UI), `django-rosetta` (translation admin at `/rosetta/`), `django-ratelimit`, `django-user-agents`, `django-cleanup`, `django-ranged-response`, `stripe`, `quickchart-io`, `moviepy`, `Pillow`, `argon2-cffi` (password hashing), `psycopg2-binary`, `dj-database-url`.

> `wesiq/requirements.txt` is plain UTF-8 with LF line endings.

### External services (outbound from the server)
| Service | Purpose |
|---------|---------|
| SMTP (Gmail by default) | Verification, password-reset and weekly report emails |
| Stripe API + webhook | Web donations and subscriptions |
| RevenueCat API + webhook | In-app subscriptions (Google Play / App Store) for the native app |
| Google reCAPTCHA v3 | Bot protection on web forms (`www.google.com/recaptcha/api/siteverify`) |
| Google OAuth 2.0 (allauth) | "Sign in with Google". Client ID/secret are stored in the DB (**Django admin → Social applications**), not in `.env`. |
| QuickChart.io | Chart images in weekly report emails |
| ip-api.com | IP → location lookup at login (**plain HTTP, port 80**) |

---

## 2. Environment Variables (`.env`)

The `.env` file is in the repository root. The template is `.env.example`. Boolean flags must be the strings `True` / `False`.

### General / security
| Variable | Purpose | Production value |
|----------|---------|------------------|
| `DEBUG` | Debug mode | `False` |
| `SECRET_KEY` | Django crypto key. **Startup fails** if `DEBUG=False` and the key is shorter than 32 chars or is the placeholder. | `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DOMAIN_URL` | Absolute base URL used in email links. **Must end with `/`.** | `https://example.com/` |
| `ALLOWED_HOSTS` | Comma-separated host names | `example.com,www.example.com` |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated origins with scheme | `https://example.com,https://www.example.com` |
| `CORS_ALLOWED_ORIGINS` | Browser origins allowed to call `/native-api/`. The native app does **not** need CORS. | empty, unless a browser-based client calls the API |
| `ADMIN_URL` | Secret path of the Django admin (**required**, the app crashes if unset) | e.g. `manage-7f3k9/` (ends with `/`) |
| `BEHIND_PROXY` | Trust `X-Forwarded-Proto/Host` from Nginx | `True` |
| `RATELIMIT_IP_META_KEY` | Header carrying the real client IP for rate limiting | `HTTP_X_REAL_IP` (Nginx must set `X-Real-IP`) |
| `SECURE_SSL_REDIRECT` | Redirect HTTP → HTTPS | `True` |
| `SESSION_COOKIE_SECURE` | HTTPS-only session cookie | `True` |
| `CSRF_COOKIE_SECURE` | HTTPS-only CSRF cookie | `True` |
| `SECURE_HSTS_SECONDS` | HSTS max-age | `31536000` (start lower, e.g. `3600`, while testing) |
| `SECURE_HSTS_INCLUDE_SUBDOMAINS` | HSTS for subdomains | `True` |
| `SECURE_HSTS_PRELOAD` | HSTS preload | `True` |

### Database
| Variable | Purpose |
|----------|---------|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Used by the Postgres container (Docker only) |
| `DATABASE_URL` | **Used by Django.** Must use the `postgis://` scheme: `postgis://USER:PASSWORD@127.0.0.1:5432/DBNAME` |

### Celery / Redis
| Variable | Purpose |
|----------|---------|
| `REDIS_URL` | Redis server for the Django cache (always uses database **1** of this server), the Channels layer and the default Celery broker. VM: `redis://127.0.0.1:6379/0`. With a password: `redis://:PASSWORD@127.0.0.1:6379/0`. Defaults to `redis://redis:6379/0` (Docker). |
| `CELERY_BROKER_URL` | Optional, defaults to `REDIS_URL`. e.g. `redis://127.0.0.1:6379/0` |
| `CELERY_RESULT_BACKEND` | Optional, defaults to `REDIS_URL`. e.g. `redis://127.0.0.1:6379/0` |
| `FLOWER_BASIC_AUTH` | `user:password` for the Flower dashboard |

### Email (SMTP)
| Variable | Purpose |
|----------|---------|
| `EMAIL_BACKEND` | `django.core.mail.backends.smtp.EmailBackend` (**required**) |
| `EMAIL_HOST` | SMTP server (e.g. `smtp.gmail.com`) |
| `EMAIL_PORT` | `587` (STARTTLS) or `465` (SSL) |
| `EMAIL_USE_TLS` | `True` for 587, `False` for 465 |
| `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` | SMTP credentials (for Gmail, use an App Password) |
| `DEFAULT_FROM_EMAIL` | Sender, defaults to `Wesiq <noreply@wesiq.com>` |

### Third-party
| Variable | Purpose |
|----------|---------|
| `RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA v3. Register the production domain in the reCAPTCHA console. |
| `STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` | Stripe API keys (use live keys in production) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the webhook endpoint `https://<domain>/<lang>/stripe/webhook/` (e.g. `/en/stripe/webhook/`) |
| `REVENUECAT_WEBHOOK_AUTH` | Shared secret. Must match the `Authorization` header configured in the RevenueCat dashboard for `https://<domain>/native-api/revenuecat-webhook/` |
| `REVENUECAT_SECRET_KEY` | RevenueCat secret API key (`sk_...`) for reading subscription state |

### Dev only (not needed in production)
`NGROK_AUTHTOKEN`, `NGROK_DOMAIN`

---

## 3. Static & Media Files

**WhiteNoise is not used.** Nginx must serve both static and media files.

| | Setting | Value | Nginx |
|--|---------|-------|-------|
| Static | `STATIC_URL` | `/static/` | `alias /srv/wesiq/wesiq/staticfiles/;` |
| Static | `STATIC_ROOT` | `wesiq/staticfiles/` (filled by `collectstatic`, gitignored) | — |
| Static sources | `STATICFILES_DIRS` | `wesiq/static/` + `wesiq/app/static/` | — |
| Media | `MEDIA_URL` | `/media/` | `alias /srv/wesiq/wesiq/media/;` |
| Media | `MEDIA_ROOT` | `wesiq/media/` | must be writable by the app **and** the Celery worker user |

Django serves `/media/` itself only when `DEBUG=True`. In production, **Nginx must serve `/media/`**, because profile pictures, post images, thumbnails, chat attachments and chat backgrounds are linked directly as `/media/...`.

Media subfolders: `images/<user_id>/`, `posts/<user_id>/videos/<media_id>/` (HLS), `chat_attachments/`, `chat_backgrounds/`, `temp/` (upload staging).

**Video streaming:** post videos are HLS (`index.m3u8` + `.ts` segments). They are served **through Django** at `/api/stream-video/...` and `/native-api/stream-video/...`, which check that the viewer is allowed to see the post (followers-only and private accounts). Block direct Nginx access to `.m3u8`/`.ts` files under `/media/posts/`, otherwise that permission check can be bypassed.

**Upload size:** video uploads can be up to **100 MB** (premium users). Set `client_max_body_size 110M;` in Nginx. Keep the proxy read/send timeouts generous for uploads.

**Logs:** the app writes its own log files to `wesiq/logs/` (`error.log`, `login.log`, …). The directory must be writable. Add log rotation.

**Backups:** back up the PostgreSQL database **and** `wesiq/media/`.

---

## 4. Deployment Steps (fresh Ubuntu 24.04 x86_64 VM, no Docker)

> Alternative: the repo already has a `docker-compose.yml` (PostGIS, Redis, web, Celery, Beat, Flower). It is **dev-oriented** (`runserver`, source bind-mounts). If you prefer Docker, change the `web` command to an ASGI server and put Nginx in front. The steps below are for a bare VM.

### 4.1 System packages
```bash
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3.12-dev build-essential \
    libpq-dev gettext binutils libproj-dev gdal-bin libgdal-dev libgeos-dev \
    ffmpeg libmagic1 \
    postgresql postgresql-contrib postgis postgresql-16-postgis-3 \
    redis-server nginx certbot python3-certbot-nginx \
    nodejs npm git
```

### 4.2 PostgreSQL + PostGIS
```bash
sudo -u postgres psql <<'SQL'
CREATE USER wesiq WITH PASSWORD 'CHANGE_ME';
CREATE DATABASE wesiq OWNER wesiq;
\c wesiq
CREATE EXTENSION IF NOT EXISTS postgis;
SQL
```

### 4.3 Redis
```bash
sudo systemctl enable --now redis-server
# Redis listens on 127.0.0.1 by default. Keep it that way.
# In .env: REDIS_URL=redis://127.0.0.1:6379/0
```

### 4.4 App user, code, virtualenv
```bash
sudo adduser --system --group --home /srv/wesiq wesiq
sudo -u wesiq git clone <REPO_URL> /srv/wesiq          # repo root → /srv/wesiq
cd /srv/wesiq
sudo -u wesiq cp .env.example .env && sudo -u wesiq nano .env   # fill in (section 2); set REDIS_URL and DATABASE_URL to 127.0.0.1
sudo chmod 600 .env

cd /srv/wesiq/wesiq
sudo -u wesiq python3.12 -m venv .venv
sudo -u wesiq .venv/bin/pip install --upgrade pip
sudo -u wesiq .venv/bin/pip install -r requirements.txt   # includes gunicorn, uvicorn and daphne
```

### 4.5 Build front-end assets (TypeScript + SCSS)
```bash
cd /srv/wesiq/wesiq
sudo -u wesiq npm ci
sudo -u wesiq npx tsc -p app/static/app/ts/tsconfig.json
sudo -u wesiq npx tsc -p static/ts/tsconfig.json
sudo -u wesiq npx sass --no-source-map --style=compressed static/css:static/css app/static/app/css:app/static/app/css
```

### 4.6 Django initialisation
Django does **not** read `.env` itself. Export it into the shell before running `manage.py`:
```bash
cd /srv/wesiq/wesiq
set -a; source /srv/wesiq/.env; set +a

.venv/bin/python manage.py migrate
.venv/bin/python manage.py compilemessages
.venv/bin/python manage.py collectstatic --noinput     # → wesiq/staticfiles/
.venv/bin/python manage.py createsuperuser
.venv/bin/python manage.py check --deploy
```
Then, in Django admin (`https://<domain>/<lang>/<ADMIN_URL>`):
- **Sites**: set the domain of Site #1 to the production domain (used by allauth and the sitemap).
- **Social applications**: add the Google OAuth client ID and secret. Add `https://<domain>/accounts/google/login/callback/` as an authorized redirect URI in Google Cloud Console.
- **Periodic tasks** (django_celery_beat): check or create the schedules (user cleanup, weekly report emails, streak resets).

### 4.7 systemd services
All units use `EnvironmentFile=/srv/wesiq/.env` and `WorkingDirectory=/srv/wesiq/wesiq`.

`/etc/systemd/system/wesiq-web.service`
```ini
[Unit]
Description=Wesiq ASGI (Gunicorn + Uvicorn)
After=network.target postgresql.service redis-server.service

[Service]
User=wesiq
Group=wesiq
WorkingDirectory=/srv/wesiq/wesiq
EnvironmentFile=/srv/wesiq/.env
ExecStart=/srv/wesiq/wesiq/.venv/bin/gunicorn core.asgi:application \
    -k uvicorn.workers.UvicornWorker -w 3 -b 127.0.0.1:8000 --timeout 120
# Alternative: ExecStart=/srv/wesiq/wesiq/.venv/bin/daphne -b 127.0.0.1 -p 8000 core.asgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/wesiq-celery.service`
```ini
[Unit]
Description=Wesiq Celery worker
After=network.target redis-server.service postgresql.service

[Service]
User=wesiq
Group=wesiq
WorkingDirectory=/srv/wesiq/wesiq
EnvironmentFile=/srv/wesiq/.env
ExecStart=/srv/wesiq/wesiq/.venv/bin/celery -A core worker -l INFO
Restart=always

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/wesiq-beat.service` (run **exactly one** instance)
```ini
[Unit]
Description=Wesiq Celery beat
After=network.target redis-server.service postgresql.service

[Service]
User=wesiq
Group=wesiq
WorkingDirectory=/srv/wesiq/wesiq
EnvironmentFile=/srv/wesiq/.env
ExecStart=/srv/wesiq/wesiq/.venv/bin/celery -A core beat -l INFO --scheduler django_celery_beat.schedulers:DatabaseScheduler
Restart=always

[Install]
WantedBy=multi-user.target
```

Optional `wesiq-flower.service`: `celery -A core flower --address=127.0.0.1 --port=5555` (reach it through an SSH tunnel only).

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wesiq-web wesiq-celery wesiq-beat
```

### 4.8 Nginx
`/etc/nginx/sites-available/wesiq`
```nginx
upstream wesiq_app { server 127.0.0.1:8000; }

map $http_upgrade $connection_upgrade { default upgrade; '' close; }

server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com www.example.com;
    # ssl_certificate / ssl_certificate_key are added by certbot

    client_max_body_size 110M;

    location /static/ {
        alias /srv/wesiq/wesiq/staticfiles/;
        expires 30d;
        access_log off;
    }

    # Videos must go through Django's permission check (/api/stream-video/)
    location ~ ^/media/posts/.*\.(m3u8|ts)$ { return 404; }

    location /media/ {
        alias /srv/wesiq/wesiq/media/;
        expires 7d;
        add_header X-Content-Type-Options nosniff;
    }

    # WebSockets (chat + notifications)
    location /ws/ {
        proxy_pass http://wesiq_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
    }

    location / {
        proxy_pass http://wesiq_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/wesiq /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d example.com -d www.example.com
```

### 4.9 Updating (each deploy)
```bash
cd /srv/wesiq && sudo -u wesiq git pull
cd wesiq && set -a; source /srv/wesiq/.env; set +a
sudo -u wesiq .venv/bin/pip install -r requirements.txt
# rebuild TS/SCSS (step 4.5)
.venv/bin/python manage.py migrate
.venv/bin/python manage.py compilemessages
.venv/bin/python manage.py collectstatic --noinput
sudo systemctl restart wesiq-web wesiq-celery wesiq-beat
```

---

## 5. Security & Production Checklist

- [ ] `DEBUG=False`
- [ ] `SECRET_KEY`: long random value (≥ 32 chars, otherwise startup fails)
- [ ] `ALLOWED_HOSTS=example.com,www.example.com`
- [ ] `CSRF_TRUSTED_ORIGINS=https://example.com,https://www.example.com`
- [ ] `CORS_ALLOWED_ORIGINS`: leave empty unless a **browser** client calls `/native-api/`. The native mobile app uses JWT bearer tokens and is not affected by CORS. CORS headers are only sent on `/native-api/*`, and credentials (cookies) are never allowed cross-origin.
- [ ] `BEHIND_PROXY=True` and `RATELIMIT_IP_META_KEY=HTTP_X_REAL_IP`, with Nginx **overwriting** `X-Real-IP` / `X-Forwarded-Proto` (as above). Without this, every user shares one rate-limit bucket and Django won't recognise HTTPS.
- [ ] `SECURE_SSL_REDIRECT=True`, `SESSION_COOKIE_SECURE=True`, `CSRF_COOKIE_SECURE=True`
- [ ] HSTS: `SECURE_HSTS_SECONDS=31536000`, `SECURE_HSTS_INCLUDE_SUBDOMAINS=True`, `SECURE_HSTS_PRELOAD=True` (only after HTTPS is confirmed working)
- [ ] `ADMIN_URL` set to a non-guessable path. Rosetta (`/rosetta/`) is also exposed and requires staff login.
- [ ] `DOMAIN_URL=https://example.com/` (trailing slash)
- [ ] Stripe: use live keys and register the webhook `https://<domain>/en/stripe/webhook/` → copy its signing secret to `STRIPE_WEBHOOK_SECRET`
- [ ] RevenueCat: webhook `https://<domain>/native-api/revenuecat-webhook/` with an `Authorization` header equal to `REVENUECAT_WEBHOOK_AUTH`
- [ ] reCAPTCHA and Google OAuth: add the production domain and callback URL
- [ ] Mobile deep links: `/.well-known/assetlinks.json` and `/.well-known/apple-app-site-association` must be served over HTTPS without redirects (note #5 placeholders filled in)
- [ ] `REDIS_URL=redis://127.0.0.1:6379/0` (the default `redis` host only exists inside Docker)
- [ ] JWT: access token lifetime 15 min, refresh 30 days with rotation and blacklist. Nothing to configure, but the mobile app must call `/native-api/token/refresh/`.
- [ ] Postgres, Redis and Flower are bound to `127.0.0.1` only. Redis has no password by default, so never expose it.
- [ ] `.env` is `chmod 600` and owned by the app user
- [ ] `MEDIA_ROOT` and `logs/` are writable by the `wesiq` user. Log rotation is configured for `wesiq/logs/*.log`.
- [ ] Regular backups of PostgreSQL and `wesiq/media/`
- [ ] Run `python manage.py check --deploy` and fix any warnings

---

## 6. Ports & Protocols

### Inbound (open in the firewall / security group)
| Port | Protocol | Purpose |
|------|----------|---------|
| **22** | TCP / SSH | Administration (restrict by IP if possible) |
| **80** | TCP / HTTP | Redirect to HTTPS + Let's Encrypt (certbot) challenge |
| **443** | TCP / HTTPS + WSS | Website, `/native-api/`, Stripe and RevenueCat webhooks, WebSockets (`wss://<domain>/ws/chat/<username>/`, `wss://<domain>/ws/notifications/`) |

### Internal only (bind to 127.0.0.1, do NOT open)
| Port | Service |
|------|---------|
| 8000 | Django ASGI app (Gunicorn/Uvicorn or Daphne), behind Nginx |
| 5432 | PostgreSQL / PostGIS |
| 6379 | Redis (Celery broker db 0, Django cache db 1, Channels layer) |
| 5555 | Flower (Celery dashboard), via SSH tunnel only: `ssh -L 5555:127.0.0.1:5555 user@vm` |

### Outbound (must be allowed from the VM)
| Port | Protocol | Destination / purpose |
|------|----------|-----------------------|
| **587** | SMTP + STARTTLS | Email (`smtp.gmail.com` by default). Use **465** (SMTPS) if `EMAIL_PORT=465` / `EMAIL_USE_TLS=False`. Many cloud providers block outbound SMTP by default, so check with the provider. |
| **443** | HTTPS | `api.stripe.com`, `api.revenuecat.com`, `www.google.com` (reCAPTCHA), Google OAuth endpoints, `quickchart.io`, PyPI/npm during deploys |
| **80** | HTTP | `ip-api.com` (login location lookup, plain HTTP), apt mirrors |
| 53 | DNS (UDP/TCP) | Name resolution |
| 123 | NTP (UDP) | Time sync (JWT expiry and reset-code expiry depend on a correct clock) |
