from django.db import models
from django.conf import settings
from apps.stores.models import Store
from apps.municipios.models import Municipio
from django.contrib.gis.db import models as gis_models


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pendiente"
        ACCEPTED = "ACCEPTED", "Aceptado"
        PREPARING = "PREPARING", "Preparando"
        READY = "READY", "Listo"
        ASSIGNED = "ASSIGNED", "Asignado"
        PICKED_UP = "PICKED_UP", "Recogido"
        DELIVERED = "DELIVERED", "Entregado"
        CANCELLED = "CANCELLED", "Cancelado"

    class PaymentMethod(models.TextChoices):
        CARD = "CARD", "Tarjeta"
        PSE = "PSE", "PSE"
        NEQUI = "NEQUI", "Nequi"
        CASH = "CASH", "Contraentrega"

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="orders", verbose_name="Cliente"
    )
    store = models.ForeignKey(Store, on_delete=models.CASCADE, verbose_name="Tienda")
    courier = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="deliveries", verbose_name="Domiciliario"
    )
    municipio = models.ForeignKey(Municipio, on_delete=models.CASCADE, verbose_name="Municipio")
    status = models.CharField("Estado", max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField("Método de pago", max_length=10, choices=PaymentMethod.choices)

    delivery_address = models.CharField("Dirección entrega", max_length=300)
    delivery_location = gis_models.PointField(srid=4326, verbose_name="Ubicación entrega")
    delivery_notes = models.CharField("Notas de entrega", max_length=300, blank=True)

    subtotal = models.DecimalField("Subtotal", max_digits=10, decimal_places=2)
    delivery_fee = models.DecimalField("Tarifa domicilio", max_digits=8, decimal_places=2, default=0)
    discount = models.DecimalField("Descuento", max_digits=8, decimal_places=2, default=0)
    total = models.DecimalField("Total", max_digits=10, decimal_places=2)
    commission = models.DecimalField("Comisión", max_digits=8, decimal_places=2, default=0)
    courier_earnings = models.DecimalField("Ganancia domiciliario", max_digits=8, decimal_places=2, default=0)

    estimated_prep_time = models.PositiveIntegerField("Tiempo preparación estimado (min)", default=15)
    estimated_delivery_time = models.PositiveIntegerField("Tiempo entrega estimado (min)", default=30)

    accepted_at = models.DateTimeField(null=True, blank=True)
    ready_at = models.DateTimeField(null=True, blank=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancel_reason = models.CharField(max_length=200, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "municipio"]),
            models.Index(fields=["client", "-created_at"]),
            models.Index(fields=["store", "-created_at"]),
            models.Index(fields=["courier", "-created_at"]),
        ]

    def __str__(self):
        return f"Pedido #{self.id} - {self.store.name}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product_name = models.CharField("Producto", max_length=200)
    product_price = models.DecimalField("Precio unitario", max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField("Cantidad", default=1)
    options = models.JSONField("Opciones seleccionadas", default=dict, blank=True)
    subtotal = models.DecimalField("Subtotal", max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = "Item del pedido"
        verbose_name_plural = "Items del pedido"


class OrderStatusLog(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_logs")
    from_status = models.CharField(max_length=20, null=True, blank=True)
    to_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Log de estado"
        verbose_name_plural = "Logs de estado"
        ordering = ["-created_at"]
