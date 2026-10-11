"""
Configurações do Django.

Tudo que muda entre desenvolvimento e produção vem de variáveis de ambiente,
lidas do arquivo .env na raiz do repositório (copie o .env.example).
"""

import sys
from datetime import timedelta
from pathlib import Path

import environ
from corsheaders.defaults import default_headers

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR.parent / ".env")

DEBUG = env.bool("DJANGO_DEBUG", default=False)

# Em produção a chave é obrigatória; em desenvolvimento há uma padrão, só para rodar localmente.
SECRET_KEY = env(
    "DJANGO_SECRET_KEY",
    default="dev-inseguro-apenas-para-desenvolvimento-local" if DEBUG else environ.Env.NOTSET,
)

ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])


# ---------- Aplicações ----------

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Terceiros
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    # Projeto
    "accounts",
]

MIDDLEWARE = [
    # Primeiro da lista: mede a requisição inteira e devolve os logs dela ao front-end.
    "config.tracing.RequestTraceMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# ---------- Banco e cache ----------

DATABASES = {"default": env.db("DATABASE_URL")}

REDIS_URL = env("REDIS_URL", default="redis://localhost:6379/0")

# O cache também guarda os contadores do limite de requisições (throttling).
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    }
}


# ---------- Usuários e senhas ----------

# Usuário próprio: login por e-mail, com confirmação por código.
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    # Mínimo de 8 caracteres, igual ao formulário do front-end.
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# ---------- API ----------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework_simplejwt.authentication.JWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    # Registra no log o motivo de cada erro (validação, limite de requisições, permissão...).
    "EXCEPTION_HANDLER": "config.tracing.exception_handler",
    # Limites por IP nos endpoints de autenticação, contra força bruta e abuso de envio de e-mail.
    # Só valem para as views que declaram um `throttle_scope`.
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.ScopedRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {
        "auth_login": "10/min",
        "auth_signup": "5/min",
        "auth_verify": "10/min",
        "auth_resend": "3/min",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    # A cada renovação sai um refresh token novo e o antigo é invalidado.
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
}

# O front-end (Next.js) roda em outra origem.
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:3000"])
# O front-end envia um id por requisição e lê os logs dela (veja config/tracing.py).
CORS_ALLOW_HEADERS = [*default_headers, "x-request-id"]
CORS_EXPOSE_HEADERS = ["X-Request-ID", "X-Trace"]


# ---------- WhatsApp (código de confirmação do cadastro) ----------

# "console": a mensagem aparece no terminal do runserver (padrão, para desenvolvimento).
# "evolution": envio real pela Evolution API v2, com os dados abaixo.
WHATSAPP_BACKEND = env("WHATSAPP_BACKEND", default="console")
# Endereço do servidor da Evolution API (ex.: http://localhost:8080).
EVOLUTION_API_URL = env("EVOLUTION_API_URL", default="")
# Nome da instância conectada ao número do sawa.
EVOLUTION_INSTANCE = env("EVOLUTION_INSTANCE", default="")
# Chave da instância (ou a global), enviada no cabeçalho apikey.
EVOLUTION_API_KEY = env("EVOLUTION_API_KEY", default="")


# ---------- Celery ----------

CELERY_BROKER_URL = REDIS_URL
# Em desenvolvimento, as tarefas rodam na hora, sem precisar subir um worker.
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=DEBUG)
CELERY_TASK_EAGER_PROPAGATES = True


# ---------- Idioma e fuso ----------

LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ---------- Logs ----------

# TRACE mostra o passo a passo do fluxo; em produção, INFO basta.
LOG_LEVEL = env("LOG_LEVEL", default="TRACE" if DEBUG else "INFO").upper()
# Devolve os logs de cada requisição no cabeçalho X-Trace, para o console do navegador.
# Só em desenvolvimento ou demonstração: expõe o funcionamento interno da API.
TRACE_TO_CLIENT = env.bool("TRACE_TO_CLIENT", default=DEBUG)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "app": {"()": "config.tracing.AppFormatter", "tz": TIME_ZONE, "color": sys.stderr.isatty()},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "app"},
        "request_trace": {"class": "config.tracing.RequestTraceHandler"},
    },
    "root": {"handlers": ["console", "request_trace"], "level": "WARNING"},
    "loggers": {
        "accounts": {"level": LOG_LEVEL},
        "config": {"level": LOG_LEVEL},
        "django": {"handlers": [], "level": "INFO"},
        # As requisições já são registradas pelo RequestTraceMiddleware; daqui, só os erros 500.
        "django.server": {"handlers": [], "level": "ERROR"},
        "django.request": {"handlers": [], "level": "ERROR"},
    },
}
