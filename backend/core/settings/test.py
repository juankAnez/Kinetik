from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = "test-key-not-for-production"
DEBUG = True
ALLOWED_HOSTS = ["*"]

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "channels",
    "drf_spectacular",
    "django_filters",
]

LOCAL_APPS = [
    "apps.municipios",
    "apps.users",
    "apps.stores",
    "apps.products",
    "apps.orders",
    "apps.payments",
    "apps.couriers",
    "apps.tracking",
    "apps.notifications",
    "apps.chat",
    "apps.reviews",
    "apps.analytics",
    "apps.tasks",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"
ASGI_APPLICATION = "core.asgi.application"

import sys
from types import ModuleType
from unittest.mock import MagicMock

from django.db import models as _dj_models
from django.template.context import Context as _Context, BaseContext

# Workaround for Python 3.14: Context.__copy__ breaks because
# super().__copy__() returns a bare object without 'dicts'.
if not hasattr(_Context, '_kinetik_patched'):
    _Context._kinetik_patched = True
    def _safe_copy(self):
        duplicate = BaseContext.__new__(_Context)
        duplicate.dicts = self.dicts[:]
        for attr in ('current_app', 'use_l10n', 'use_tz'):
            if hasattr(self, attr):
                setattr(duplicate, attr, getattr(self, attr))
        return duplicate
    _Context.__copy__ = _safe_copy


class _FakeSpatialField(_dj_models.Field):
    description = "Fake spatial field"
    def __init__(self, *args, **kwargs):
        for k in ("srid", "dim", "geography", "spatial_index"):
            kwargs.pop(k, None)
        super().__init__(*args, **kwargs)
    def db_type(self, connection):
        return "text"
    def rel_db_type(self, connection):
        return "text"
    def get_internal_type(self):
        return "TextField"
    def get_db_prep_value(self, value, connection, prepared=False):
        if value is not None and not isinstance(value, (str, int, float)):
            value = str(value)
        return super().get_db_prep_value(value, connection, prepared)
    def get_db_prep_save(self, value, connection):
        if value is not None:
            return str(value)
        return None


class _FakeDistance:
    pass


def _make_module(name, attrs=None):
    mod = ModuleType(name)
    mod.__package__ = ".".join(name.split(".")[:-1]) if "." in name else ""
    if attrs:
        for k, v in attrs.items():
            setattr(mod, k, v)
    return mod


for _mod_name in [
    "django.contrib.gis.gdal",
    "django.contrib.gis.gdal.libgdal",
    "django.contrib.gis.gdal.prototypes",
    "django.contrib.gis.gdal.prototypes.ds",
    "django.contrib.gis.gdal.driver",
    "django.contrib.gis.forms",
    "django.contrib.gis.forms.fields",
]:
    if _mod_name not in sys.modules:
        sys.modules[_mod_name] = MagicMock()

if "django.contrib.gis.db.models.fields" not in sys.modules:
    sys.modules["django.contrib.gis.db.models.fields"] = _make_module(
        "django.contrib.gis.db.models.fields",
        {
            "PointField": _FakeSpatialField,
            "GeometryField": _FakeSpatialField,
            "LineStringField": _FakeSpatialField,
            "PolygonField": _FakeSpatialField,
            "MultiPointField": _FakeSpatialField,
            "MultiLineStringField": _FakeSpatialField,
            "MultiPolygonField": _FakeSpatialField,
            "GeometryCollectionField": _FakeSpatialField,
            "RasterField": _FakeSpatialField,
            "BaseSpatialField": type("BaseSpatialField", (_dj_models.Field,), {}),
        },
    )

if "django.contrib.gis.db.models.functions" not in sys.modules:
    sys.modules["django.contrib.gis.db.models.functions"] = _make_module(
        "django.contrib.gis.db.models.functions",
        {"Distance": _FakeDistance, "Transform": type("Transform", (), {})},
    )

if "django.contrib.gis.db.models.lookups" not in sys.modules:
    sys.modules["django.contrib.gis.db.models.lookups"] = _make_module(
        "django.contrib.gis.db.models.lookups",
    )

if "django.contrib.gis.db.models.aggregates" not in sys.modules:
    sys.modules["django.contrib.gis.db.models.aggregates"] = _make_module(
        "django.contrib.gis.db.models.aggregates",
        {"__all__": []},
    )

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

AUTH_USER_MODEL = "users.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es-co"
TIME_ZONE = "America/Bogota"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "static"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "shared.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_COOKIE": "access_token",
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_SECURE": False,
    "AUTH_COOKIE_SAMESITE": "Lax",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Kinetik API",
    "DESCRIPTION": "Plataforma de domicilios multi-municipio",
    "VERSION": "1.0.0",
}

CHANNEL_LAYERS = {
    "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"},
}

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

CACHES = {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"},
}

SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"
