from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class PushToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="push_tokens")
    token = models.CharField("Token", max_length=500)
    platform = models.CharField("Plataforma", max_length=10, choices=[("ios", "iOS"), ("android", "Android")])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Token push"
        verbose_name_plural = "Tokens push"


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        ORDER_UPDATE = "ORDER_UPDATE", "Actualización de pedido"
        ASSIGNMENT = "ASSIGNMENT", "Asignación de domiciliario"
        PROMO = "PROMO", "Promoción"
        SYSTEM = "SYSTEM", "Sistema"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=20, choices=NotificationType.choices)
    title = models.CharField("Título", max_length=200)
    body = models.TextField("Cuerpo")
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
        ordering = ["-created_at"]
