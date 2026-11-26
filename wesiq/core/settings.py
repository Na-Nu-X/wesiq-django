from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
import os
import dj_database_url
from celery.schedules import crontab
from datetime import timedelta
from corsheaders.defaults import default_headers
from django.core.exceptions import ImproperlyConfigured

# Environment Helpers (os.environ Values Are Strings, And The String "False" Is Truthy, So Flags Must Be Parsed)
def env_bool(name, default = False):
    value = os.environ.get(name)

    if value is None or value.strip() == "":
        return default

    return value.strip().lower() in ("1", "true", "yes", "on")

def env_int(name, default = 0):
    value = os.environ.get(name, "").strip()
    return int(value) if value else default

def env_list(name, default = ""):
    return [one_item.strip() for one_item in os.environ.get(name, default).split(",") if one_item.strip()]

# Returns The Same Redis URL Pointing To Another Database Number (e.g. redis://host:6379/0 -> redis://host:6379/1)
def redis_url_with_db(url, db):
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, f"/{db}", parts.query, parts.fragment))

# General
DOMAIN_URL = os.environ.get("DOMAIN_URL") # Stores The Domain URL
BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = env_bool("DEBUG", False)
SECRET_KEY = os.environ.get("SECRET_KEY")

# Fails Fast Instead Of Running Production With A Missing Or Placeholder Key
if not DEBUG and (not SECRET_KEY or SECRET_KEY == "SECRET_KEY" or len(SECRET_KEY) < 32):
    raise ImproperlyConfigured("SECRET_KEY must be set to a long random value when DEBUG is False.")

# HTTPS / Production Settings (All Off By Default, Enabled From .env In Production)
SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", False)
SESSION_COOKIE_SECURE = env_bool("SESSION_COOKIE_SECURE", False)
CSRF_COOKIE_SECURE = env_bool("CSRF_COOKIE_SECURE", False)
SECURE_HSTS_SECONDS = env_int("SECURE_HSTS_SECONDS", 0)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", False)
SECURE_HSTS_PRELOAD = env_bool("SECURE_HSTS_PRELOAD", False)
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
X_FRAME_OPTIONS = "DENY"

# CORS (Only Matters For Browsers; The Native App Isn't Restricted By CORS)
# Comma-Separated Origins, e.g. "https://wesiq.com,http://localhost:8081". Everything Is Allowed Only In DEBUG When Unset.
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_ALL_ORIGINS = DEBUG and not CORS_ALLOWED_ORIGINS
CORS_ALLOW_CREDENTIALS = False # Cookies Are Never Sent Cross-Origin; The Native App Uses Bearer Tokens
CORS_URLS_REGEX = r"^/native-api/.*$" # CORS Headers Only On The Native API
CORS_ALLOW_HEADERS = list(default_headers) + ["x-device-id"]

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS") # ALLOWED_HOSTS

# Extra Trusted Origins For CSRF (e.g. "https://wesiq.com,https://your-domain.ngrok-free.dev")
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS")

# Apps
INSTALLED_APPS = [
    # Unfold Admin Page
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",

    "daphne",

    "app",

    # Native App
    "rest_framework",
    "corsheaders",
    "rest_framework_simplejwt.token_blacklist",

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "django.contrib.gis", # GeoDjango
    "django.contrib.postgres", # PostgreSQL

    # Google OAuth 2.0
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",

    "django_celery_beat", # Django Celery Beat (Added Periodic Tasks Section To The Admin Site)

    "rosetta", # Rosetta (Language Admin Site)

    "django_user_agents",

    "django_cleanup.apps.CleanupConfig", # Cleanup Temporary Media

    # Sitemap
    "django.contrib.sites",
    "django.contrib.sitemaps"
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware", # HTTPS Redirect, HSTS, nosniff, Referrer-Policy (Was Disabled)
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",

    # Google OAuth 2.0
    "allauth.account.middleware.AccountMiddleware",

    "django_user_agents.middleware.UserAgentMiddleware"
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",

        "DIRS": [
            BASE_DIR / "templates"
        ],

        "APP_DIRS": True,

        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages"
            ]
        }
    }
]

# Static Files (CSS, JavaScript, Images)
STATIC_URL = "static/"

STATICFILES_DIRS = [
    BASE_DIR / "static"
]

STATIC_ROOT = BASE_DIR / "staticfiles" # collectstatic Target, Served By Nginx In Production

# Default Primary Key Field Type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Media Directories
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media/"

# Database
DATABASES = {
    "default": dj_database_url.parse(os.environ.get("DATABASE_URL"))
}

# Redis (Django Cache, Channels Layer And Default Celery Broker)
# Docker Uses The "redis" Service Name; On A VM Set e.g. "redis://127.0.0.1:6379/0" (Password: "redis://:password@host:6379/0")
REDIS_URL = os.environ.get("REDIS_URL") or "redis://redis:6379/0"

# Channels
ASGI_APPLICATION = "core.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",

        "CONFIG": {
            "hosts": [REDIS_URL]
        }
    }
}

# Password Validation
AUTH_PASSWORD_VALIDATORS = [
    { "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator" },
    { "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator" },
    { "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator" },
    { "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator" }
]

# Password Hashing (Argon2)
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
    "django.contrib.auth.hashers.ScryptPasswordHasher",
]

# Google reCAPTCHA V3
RECAPTCHA_SITE_KEY = os.environ.get("RECAPTCHA_SITE_KEY")
RECAPTCHA_SECRET_KEY = os.environ.get("RECAPTCHA_SECRET_KEY")

# Google OAuth 2.0
AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
    "allauth.account.auth_backends.AuthenticationBackend"
]

SOCIALACCOUNT_PROVIDERS = {
    "google": {
        "SCOPE": [
            "profile",
            "email"
        ],

        "AUTH_PARAMS": {
            "access_type": "online"
        },

        "OAUTH_PKCE_ENABLED": True
    }
}

ACCOUNT_EMAIL_VERIFICATION = "mandatory"
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_LOGIN_METHODS = { "email" }
ACCOUNT_USER_MODEL_EMAIL_FIELD = "email_address"
ACCOUNT_SIGNUP_FIELDS = ["email*", "username*", "password1*", "password2*"]

ACCOUNT_USERNAME_BLACKLIST = [
    "admin", 
    "administrator", 
    "sysadmin", 
    "root", 
    "api", 
    "security", 
    "webmaster", 
    "profile", 
    "post", 
    "inbox", 
    "help", 
    "accounts", 
    "support"
]

LOGIN_REDIRECT_URL = "/"
LOGOUT_REDIRECT_URL = "/"

# E-mail
EMAIL_HOST = os.environ.get("EMAIL_HOST")
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True").lower() == "true"
EMAIL_BACKEND = os.environ.get("EMAIL_BACKEND")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "Wesiq <noreply@wesiq.com>")

# Celery
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL") or REDIS_URL
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND") or REDIS_URL
CELERY_TIMEZONE = "Europe/Bratislava"
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

CELERY_BEAT_SCHEDULE = {
    "models_warm_up_every_10_minutes": {
        "task": "app.tasks.modelsWarmUp",
        "schedule": crontab(minute="*/10") # Every 10 Minutes
    },

    # Kept In Code (Not Only In The Admin), Because The Privacy Policy Promises Logs Are Deleted After 24 Months
    "cleanup_old_logs_every_day": {
        "task": "app.tasks.cleanupOldLogs",
        "schedule": crontab(hour=3, minute=30) # Every Day At 3:30
    },
}

# Redis Caching
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": redis_url_with_db(REDIS_URL, 1), # Database 1, So The Cache Stays Separate From Celery (Database 0)

        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient"
        }
    }
}

CACHE_TTL = 3600  # 1 Hour Cache

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Translations
from django.utils.translation import gettext_lazy as _

USE_I18N = True

LANGUAGE_CODE = "en" # Default Language (English)

# Supported Languages
LANGUAGES = [
    ("sk", _("Slovak")),
    ("cs", _("Czech")),
    ("en", _("English")),
    ("es", _("Spanish")),
    ("fr", _("French")),
    ("uk", _("Ukrainian")),
    ("ru", _("Russian")),
    ("pt-br", _("Portuguese (Brazil)")),
    # ("zh-hans", _("Simplified Chinese")),
    ("de", _("German")),
]

LOCALE_PATHS = [BASE_DIR / "locale/"] # Translations Directories (.po And .mo Files)

# Logs
LOGS_DIR = BASE_DIR / "logs" # Logs Directory

if not LOGS_DIR.exists():
    LOGS_DIR.mkdir(parents = True, exist_ok = True)

# Reverse Proxy
# Only Trust X-Forwarded-* Headers When A Proxy That Overwrites Them Sits In Front Of Django (Otherwise Clients Can Spoof Them)
BEHIND_PROXY = env_bool("BEHIND_PROXY", False)
USE_X_FORWARDED_HOST = BEHIND_PROXY
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https") if BEHIND_PROXY else None

# Rate Limiting (django-ratelimit)
# Behind A Proxy REMOTE_ADDR Is The Proxy's IP, So Every User Would Share One Bucket. Set This To The Header Your Proxy
# Overwrites With The Real Client IP (e.g. "HTTP_X_REAL_IP"). Defaults To REMOTE_ADDR.
RATELIMIT_IP_META_KEY = os.environ.get("RATELIMIT_IP_META_KEY") or None

# Stripe
STRIPE_PUBLISHABLE_KEY = os.environ.get("STRIPE_PUBLISHABLE_KEY")
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

# RevenueCat (Native App In-App Purchases) - Shared Secret Sent In The Webhook's Authorization Header
REVENUECAT_WEBHOOK_AUTH = os.environ.get("REVENUECAT_WEBHOOK_AUTH")
REVENUECAT_SECRET_KEY = os.environ.get("REVENUECAT_SECRET_KEY") # Secret API Key ("sk_..."), Reads The Current Subscription State

# GeoDjango
possible_gdal_paths = [
    "/usr/lib/x86_64-linux-gnu/libgdal.so",
    "/usr/lib/libgdal.so"
]

for path in possible_gdal_paths:
    if os.path.exists(path):
        GDAL_LIBRARY_PATH = path
        break

GEOS_LIBRARY_PATH = "/usr/lib/x86_64-linux-gnu/libgeos_c.so"

SITE_ID = 1

# Unfold Admin Page
UNFOLD = {
    "SITE_TITLE": "Reštaurácia Admin",
    "SITE_HEADER": "Správa reštaurácie",
    "SITE_URL": "/",
    
    "COLORS": {
        "primary": {
            "50": "250 245 255",
            "100": "243 232 255",
            "500": "168 85 247",
            "600": "147 51 234",
            "700": "126 34 206"
        }
    }
}

# Native APP

AUTH_USER_MODEL = "app.Users"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication", # Native App
        "rest_framework.authentication.SessionAuthentication" # Web App
    )
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes = 15), # Short-Lived, So Revoked / Blacklisted Sessions Stop Working Quickly (Was 90 Days)
    "REFRESH_TOKEN_LIFETIME": timedelta(days = 30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True
}

GOOGLE_WEB_CLIENT_ID = "540480595540-tntaf1q3pdefl5tjcsk445ircs19dtn6.apps.googleusercontent.com"
APPLE_BUNDLE_ID = "com.behul.wesiq"