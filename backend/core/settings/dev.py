from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]

GOOGLE_MAPS_API_KEY = config("GOOGLE_MAPS_API_KEY", default="")

INSTALLED_APPS += ["django_extensions"]

CORS_ALLOW_ALL_ORIGINS = True

SIMPLE_JWT["AUTH_COOKIE_SECURE"] = False

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
