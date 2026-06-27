from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = "dev-key-not-for-production"
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
    "apps.maps",
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


class _FakePoint:
    def __init__(self, x, y, srid=None):
        self.x, self.y, self.srid = float(x), float(y), srid
        self.coords = (self.x, self.y)
    def __str__(self):
        return f"POINT ({self.x} {self.y})"
    def __eq__(self, other):
        return isinstance(other, _FakePoint) and self.x == other.x and self.y == other.y
    def __repr__(self):
        return f"Point({self.x}, {self.y})"
    def __len__(self):
        return 2
    def __getitem__(self, i):
        return self.coords[i]
    def __iter__(self):
        return iter(self.coords)
    def tuple(self):
        return self.coords
    def _get_geos_ptr(self):
        return None


def _make_module(name, attrs=None):
    mod = ModuleType(name)
    mod.__package__ = ".".join(name.split(".")[:-1]) if "." in name else ""
    if attrs:
        for k, v in attrs.items():
            setattr(mod, k, v)
    return mod


def _patch_parent(child_path, mod):
    """Set *mod* as an attribute on its parent module if parent exists."""
    parts = child_path.split(".")
    if len(parts) < 2:
        return
    parent_path = ".".join(parts[:-1])
    if parent_path in sys.modules and not hasattr(sys.modules[parent_path], parts[-1]):
        setattr(sys.modules[parent_path], parts[-1], mod)


# --- Mock everything that needs GEOS/GDAL C libraries ---
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

_mock_gis_db_models = _make_module("django.contrib.gis.db.models", {
    "PointField": _FakeSpatialField,
})

_mock_fields = _make_module("django.contrib.gis.db.models.fields", {
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
})
_mock_gis_db_models.fields = _mock_fields

_mock_functions = _make_module("django.contrib.gis.db.models.functions", {
    "Distance": _FakeDistance,
    "Transform": type("Transform", (), {}),
})
_mock_gis_db_models.functions = _mock_functions

_mock_lookups = _make_module("django.contrib.gis.db.models.lookups")
_mock_gis_db_models.lookups = _mock_lookups

_mock_aggregates = _make_module("django.contrib.gis.db.models.aggregates", {"__all__": []})
_mock_gis_db_models.aggregates = _mock_aggregates

# Ensure the full parent chain exists in sys.modules so dotted lookups
# (django.contrib.gis.db.models.fields.PointField) resolve to mocks.
# Force-load django.contrib.gis so Python's submodule-import machinery works.
import django.contrib.gis as _dg
for _parent in ["django.contrib.gis.db", "django.contrib.gis.db.models"]:
    if _parent not in sys.modules:
        sys.modules[_parent] = _make_module(_parent)
sys.modules["django.contrib.gis.db"].models = _mock_gis_db_models
sys.modules["django.contrib.gis.db.models"] = _mock_gis_db_models
setattr(_dg, "db", sys.modules["django.contrib.gis.db"])
for _sub in [_mock_fields, _mock_functions, _mock_lookups, _mock_aggregates]:
    sys.modules[_sub.__name__] = _sub

_geos = _make_module("django.contrib.gis.geos", {"Point": _FakePoint})
sys.modules["django.contrib.gis.geos"] = _geos
_patch_parent("django.contrib.gis.geos", _geos)
_geos.collections = _make_module("django.contrib.gis.geos.collections")
_geos.geometry = _make_module("django.contrib.gis.geos.geometry")
_geos.prototypes = _make_module("django.contrib.gis.geos.prototypes")
_geos.prototypes.io = _make_module("django.contrib.gis.geos.prototypes.io", {
    "ewkb_w": lambda: None, "wkb_r": lambda: None, "wkb_w": lambda: None,
    "wkt_r": lambda: None, "wkt_w": lambda: None,
})
_geos.libgeos = _make_module("django.contrib.gis.geos.libgeos")
_geos.error = type("GEOSException", (Exception,), {})

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "dev.db",
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

GOOGLE_MAPS_API_KEY = ""

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
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
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
