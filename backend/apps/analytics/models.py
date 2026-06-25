from django.db import models
from apps.stores.models import Store
from apps.municipios.models import Municipio


class DailySalesReport(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="daily_reports")
    date = models.DateField("Fecha")
    total_orders = models.PositiveIntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_commission = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    avg_order_value = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Reporte diario de ventas"
        verbose_name_plural = "Reportes diarios de ventas"
        unique_together = ["store", "date"]
        ordering = ["-date", "store"]


class CourierPerformance(models.Model):
    courier = models.ForeignKey(
        "users.User", on_delete=models.CASCADE,
        related_name="performance_reports"
    )
    date = models.DateField("Fecha")
    total_deliveries = models.PositiveIntegerField(default=0)
    total_earned = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    avg_delivery_time_min = models.FloatField(default=0)
    total_distance_km = models.FloatField(default=0)

    class Meta:
        verbose_name = "Rendimiento de domiciliario"
        verbose_name_plural = "Rendimientos de domiciliarios"
        unique_together = ["courier", "date"]
        ordering = ["-date", "courier"]


class MunicipioStats(models.Model):
    municipio = models.ForeignKey(Municipio, on_delete=models.CASCADE, related_name="stats")
    date = models.DateField("Fecha")
    total_orders = models.PositiveIntegerField(default=0)
    active_stores = models.PositiveIntegerField(default=0)
    active_couriers = models.PositiveIntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Estadísticas del municipio"
        verbose_name_plural = "Estadísticas de municipios"
        unique_together = ["municipio", "date"]
        ordering = ["-date", "municipio"]
