from django.db import models
from django.conf import settings
from django.contrib.gis.db import models as gis_models


class CourierLocation(models.Model):
    courier = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="locations", limit_choices_to={"user_type": "DOMICILIARIO"}
    )
    location = gis_models.PointField(srid=4326)
    speed = models.FloatField(null=True, blank=True)
    heading = models.FloatField(null=True, blank=True)
    accuracy = models.FloatField(null=True, blank=True)
    battery_level = models.IntegerField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Ubicación de domiciliario"
        verbose_name_plural = "Ubicaciones de domiciliarios"
        indexes = [
            models.Index(fields=["courier", "-timestamp"]),
        ]


class CourierStatus(models.Model):
    courier = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="status", limit_choices_to={"user_type": "DOMICILIARIO"}
    )
    is_online = models.BooleanField(default=False)
    current_location = gis_models.PointField(srid=4326, null=True, blank=True)
    current_zone_h3 = models.CharField(max_length=20, blank=True)
    last_ping = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Estado del domiciliario"
        verbose_name_plural = "Estados de domiciliarios"


class AssignmentLog(models.Model):
    order = models.ForeignKey("orders.Order", on_delete=models.CASCADE, related_name="assignment_logs")
    courier = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="assignment_logs"
    )
    score = models.FloatField("Puntaje")
    radius_used = models.FloatField("Radio usado (km)")
    accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Log de asignación"
        verbose_name_plural = "Logs de asignación"
