from django.db import models
from django.conf import settings
from django.contrib.gis.db import models as gis_models
from apps.orders.models import Order


class TrackingPoint(models.Model):
    courier = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="tracking_points"
    )
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="tracking_points")
    location = gis_models.PointField(srid=4326)
    speed = models.FloatField(null=True, blank=True)
    heading = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Punto de seguimiento"
        verbose_name_plural = "Puntos de seguimiento"
        indexes = [
            models.Index(fields=["order", "-timestamp"]),
        ]


class Route(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="route")
    start_location = gis_models.PointField(srid=4326, verbose_name="Ubicación inicio")
    end_location = gis_models.PointField(srid=4326, verbose_name="Ubicación destino")
    polyline = models.TextField("Polilínea codificada", blank=True)
    distance_km = models.FloatField("Distancia (km)", default=0)
    estimated_duration_min = models.PositiveIntegerField("Duración estimada (min)", default=0)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Ruta"
        verbose_name_plural = "Rutas"
