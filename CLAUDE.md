# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Wesiq is a fitness/community web app (training sessions and plans, activity tracking with XP/streaks, social posts with video, chat, articles/blog, reviews, Stripe donations/subscriptions). It is a single Django project with one app, plus a JSON API used by a separate native mobile app. `README.md` (English) and `README_SK.md` (Slovak) contain long feature-by-feature descriptions.

Repository layout: the repo root holds `docker-compose.yml`, `.env`, and the dev scripts. The Django project lives in `wesiq/`: `core/` is the project package (settings, urls, asgi, celery) and `app/` is the only Django app.

## Commands

Everything runs in Docker. Run compose commands from the repo root and npm/sass commands from `wesiq/`.

```bash
docker compose up -d --build                         # db (PostGIS), redis, web, celery, celery_beat, flower
docker compose exec web python manage.py migrate
docker compose exec web python manage.py makemigrations
docker compose logs -f web
./run_dev.sh                                         # opens terminals for docker, `npm run watch`, and `npx sass --watch .:.`
```

Front-end builds, from `wesiq/`:
- `npm run watch` runs `tsc -w` for both TS projects (`app/static/app/ts/` and `static/ts/`). On Windows the README says to change the `|` in this script so that both compilers run.
- `npx sass --watch .:.` compiles every `.scss` next to its source as `.css`. Compiled `.css` files are gitignored.
- To type-check once: `npx tsc -p app/static/app/ts/tsconfig.json --noEmit` (and `-p static/ts/tsconfig.json`).

Tests (security regression tests in `app/tests.py`; they override the cache to local memory so they don't touch the dev Redis):
```bash
docker compose exec web python manage.py test app
docker compose exec web python manage.py test app.tests.PasswordResetTests.test_api_reset_works_logged_out
```

Translations (commands taken from comments in `run_dev.sh`):
```bash
docker compose exec web python manage.py makemessages -l sk -l cs -l en -l es -l fr -l uk -l ru -l pt_BR -l de
docker compose exec web python manage.py makemessages -d djangojs -l sk -l cs -l en -l es -l fr -l uk -l ru -l pt_BR -l de -e ts -i node_modules
docker compose exec web python manage.py compilemessages
```

After editing translations (run inside `docker compose exec web …`):
```bash
python locale/tools/lint_po.py      # placeholders, HTML tags, line breaks, leading/trailing spaces, leftover Slovak, mixed Latin/Cyrillic
python locale/tools/url_check.py    # e-mail links and JS paths must match each language's translated routes (--fix rewrites them)
python manage.py compilemessages -l sk -l cs -l en -l es -l fr -l uk -l ru -l pt_BR -l de
python locale/tools/build_json.py   # regenerates locale/<lang>/<lang>.json for the mobile app (replaces i18next-conv)
```
Translation conventions: msgids are Slovak, and fixes to Slovak wording go into `locale/sk` msgstrs rather than the source. Address forms: sk/cs/de/fr/ru/uk use the formal form (vy/Sie/vous/вы/ви), es uses tú (Spain), pt_BR uses você. In English, use sentence case and "Log in / Sign up / email". Keep the msgid's leading and trailing spaces, because some strings are concatenated in templates. Route slugs (`app/urls.py`) must be lowercase ASCII and unique per language.

Local stripe webhook testing (from `.env.example`): `docker run --rm -it stripe/stripe-cli listen --forward-to host.docker.internal:8000/stripe/webhook/`

Note: `wesiq/requirements.txt` is UTF-8 with LF line endings (it used to be UTF-16). Keep it that way.

## Architecture

### Two parallel back ends that share models
- **Web (server-rendered)**: `app/views.py` holds camelCase function views such as `communityView` and `homepageView`, which render templates in `app/templates/app/`. A page view usually also serves its own AJAX calls. The front end POSTs to the page's own URL with an `X-Requested-Action` header (see `sendPOST.ts`), and the view dispatches on it, for example `if request.headers.get("X-Requested-Action") == "report-review": return reportReview(request)`. To add an interaction, add a helper and a branch in the page view. Don't add a new URL. Session auth + CSRF.
- **Native app API**: `app/api/views.py` holds snake_case DRF `@api_view` functions with JWT auth (simplejwt), mounted at `/native-api/` (`app/api/urls.py`). Features exist in both places, so a behavior change in a web view usually needs a matching change in the API view (and the reverse). `.well-known/assetlinks.json` and `apple-app-site-association` are served for deep links into the native app.
- A few non-localized JSON endpoints live directly in `core/urls.py` under `/api/`.
- **`app/security.py`** holds the rules both back ends must share: password-reset codes (secure generation, 15-minute expiry, attempt limit, stored in cache), `visible_posts_q()` (followers-only posts and private accounts), the editable post-settings whitelist, server-side XP calculation (`record_activity`), and image/URL validation. Use these helpers instead of re-implementing the checks in a view. Never trust XP, IDs or model field names that come from the client.
- Native API route names are prefixed `native_` where they would otherwise collide with web route names.
- **Posts are identified by `Post.public_id`** (a random string) everywhere outside the database: URLs, `data-post_id` attributes, JSON `id` fields, `saved_posts`, WebSocket payloads. Look posts up with `public_id`, never `id`, and keep post IDs typed as `string` in TypeScript.

### i18n and URLs
- The **source language of msgids is Slovak**. Templates and Python use Slovak strings, e.g. `{% translate 'Popis príspevku' %}`, and URL paths are Slovak strings wrapped in `gettext_lazy` (`_("komunita/")`). These are translated per locale, so routes look like `/en/community/` and `/sk/komunita/`. Always reference routes by `name` (`{% url %}` / `reverse`), never by literal path.
- `app/urls.py` is included under `i18n_patterns`, so every page is language-prefixed. The admin URL comes from the `ADMIN_URL` env var.
- TS uses the global `gettext`/`ngettext`/`interpolate` from Django's `JavaScriptCatalog` (`/jsi18n/`). They are declared in `app/static/app/ts/src/globals.ts`. Rosetta is mounted at `/rosetta/`.

### Front end
- There are two TS projects, each with `src/` compiled to a gitignored `dist/`: `wesiq/static/ts/` (site-wide: navigation, preloader, …) and `wesiq/app/static/app/ts/` (per-page). There is no bundler. Templates load the compiled files directly as ES modules, e.g. `{% static 'app/ts/dist/pages/community/components/post_feed.js' %}` with `type="module"`. TS imports must therefore use the `.js` extension.
- Per-page code is organized as `src/pages/<page>/components/*.ts`, which are the entry points loaded by templates, plus `functions/*.ts` and an optional `state.ts`. Shared code is in `src/components`, `src/utils`, and `src/services`.
- tsconfig is very strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, no unused locals/params).
- `templates/base.html` is the global layout. Page templates are in `app/templates/app/` and partials in `app/templates/partials/`.

### Async, realtime, and data
- **Celery** (`core/celery.py`, tasks in `app/tasks.py`) handles periodic jobs (cleanup of suspended/unverified users, weekly report emails with QuickChart images, streak resets) and media processing (ffmpeg/moviepy image and video compression, HLS/sprite sheets/VTT for posts and chat attachments). Upload views start a task and the client polls progress endpoints. Beat uses `django_celery_beat`'s DatabaseScheduler, so most schedules are managed in the admin. Only `modelsWarmUp` is in `CELERY_BEAT_SCHEDULE`.
- **Channels** (`core/asgi.py`, `app/routing.py`, `app/consumers.py`): WebSockets `ws/chat/<username>/` and `ws/notifications/`, with Redis as the channel layer. Daphne is installed, so `runserver` serves ASGI.
- **Redis** is also the Django cache (db 1). `app/signals.py` invalidates or warms caches on model changes and handles Google OAuth (allauth) user creation.
- **DB** is PostgreSQL + PostGIS (GeoDjango is used for post locations). The custom user model is `app.Users` (`AUTH_USER_MODEL`) with the email field `email_address`. All models are in `app/models.py`. The admin uses django-unfold (`app/admin.py`).
- `wesiq/data/` holds profanity word lists per language and forbidden usernames, which `views.py` uses for validation. Logs are written to `wesiq/logs/`.

### Config
All secrets and environment flags come from the root `.env` (template: `.env.example`), which compose loads into every service. Host names in settings assume compose service names (`db`, `redis`). Read flags with the `env_bool` / `env_int` / `env_list` helpers at the top of `core/settings.py`, never `os.environ.get` directly (the string `"False"` is truthy). With `DEBUG` off, startup fails unless `SECRET_KEY` is a long random value. `BEHIND_PROXY` and `RATELIMIT_IP_META_KEY` decide whether `X-Forwarded-*` headers are trusted. JWT access tokens last 15 minutes, so the native app must refresh them via `/native-api/token/refresh/`.
