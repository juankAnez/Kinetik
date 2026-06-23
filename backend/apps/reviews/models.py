from django.db import models
from django.conf import settings
from apps.orders.models import Order
from apps.stores.models import Store


class Review(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="review")
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="reviews_given"
    )
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveIntegerField("Calificación")
    comment = models.TextField("Comentario", blank=True)
    courier_rating = models.PositiveIntegerField("Calificación domiciliario", null=True, blank=True)
    tip = models.DecimalField("Propina", max_digits=8, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Calificación"
        verbose_name_plural = "Calificaciones"
        unique_together = ["order", "client"]


class Dispute(models.Model):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Abierta"
        RESOLVED = "RESOLVED", "Resuelta"
        REJECTED = "REJECTED", "Rechazada"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="disputes")
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="disputes"
    )
    reason = models.CharField("Razón", max_length=200)
    description = models.TextField("Descripción")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    resolution = models.TextField("Resolución", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Disputa"
        verbose_name_plural = "Disputas"
