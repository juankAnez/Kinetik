from django.db import models
from django.contrib.gis.db import models as gis_models
from apps.municipios.models import Municipio


class StoreCategory(models.Model):
    name = models.CharField("Nombre", max_length=100)
    icon = models.CharField("Ícono", max_length=50, blank=True)
    order = models.PositiveIntegerField("Orden", default=0)

    class Meta:
        verbose_name = "Categoría de tienda"
        verbose_name_plural = "Categorías de tiendas"
        ordering = ["order"]

    def __str__(self):
        return self.name


class Store(models.Model):
    class Plan(models.TextChoices):
        FREE = "FREE", "Gratis"
        BASIC = "BASIC", "Básico"
        PREMIUM = "PREMIUM", "Premium"

    name = models.CharField("Nombre", max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField("Descripción", blank=True)
    logo = models.ImageField("Logo", upload_to="stores/logos/", null=True, blank=True)
    banner = models.ImageField("Banner", upload_to="stores/banners/", null=True, blank=True)
    category = models.ForeignKey(StoreCategory, on_delete=models.SET_NULL, null=True, verbose_name="Categoría")
    municipio = models.ForeignKey(Municipio, on_delete=models.CASCADE, verbose_name="Municipio")
    location = gis_models.PointField(srid=4326, verbose_name="Ubicación")
    address = models.CharField("Dirección", max_length=300)
    phone = models.CharField("Teléfono", max_length=20)
    plan = models.CharField("Plan", max_length=20, choices=Plan.choices, default=Plan.FREE)
    commission_rate = models.DecimalField("Comisión %", max_digits=5, decimal_places=2, default=20.00)
    is_active = models.BooleanField("Activo", default=True)
    is_open = models.BooleanField("Abierto ahora", default=False)
    avg_rating = models.FloatField("Calificación", default=0.0)
    total_orders = models.PositiveIntegerField(default=0)
    delivery_radius_km = models.FloatField("Radio de entrega (km)", default=5)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Tienda"
        verbose_name_plural = "Tiendas"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Schedule(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="schedules")
    day = models.PositiveIntegerField("Día", choices=[
        (0, "Lunes"), (1, "Martes"), (2, "Miércoles"),
        (3, "Jueves"), (4, "Viernes"), (5, "Sábado"), (6, "Domingo"),
    ])
    open_time = models.TimeField("Apertura")
    close_time = models.TimeField("Cierre")
    is_active = models.BooleanField("Activo", default=True)

    class Meta:
        verbose_name = "Horario"
        verbose_name_plural = "Horarios"
        unique_together = ["store", "day"]


class Address(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="addresses")
    label = models.CharField("Etiqueta", max_length=50, default="Casa")
    address = models.CharField("Dirección", max_length=300)
    location = gis_models.PointField(srid=4326)
    neighborhood = models.CharField("Barrio", max_length=100, blank=True)
    notes = models.CharField("Notas", max_length=200, blank=True)
    is_default = models.BooleanField("Principal", default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Dirección"
        verbose_name_plural = "Direcciones"
