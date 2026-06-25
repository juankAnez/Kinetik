from django.db import models
from django.conf import settings
from apps.orders.models import Order


class PaymentMethod(models.Model):
    class MethodType(models.TextChoices):
        CARD = "CARD", "Tarjeta"
        PSE = "PSE", "PSE"
        NEQUI = "NEQUI", "Nequi"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payment_methods")
    method_type = models.CharField(max_length=10, choices=MethodType.choices)
    token = models.CharField("Token", max_length=200)
    last_four = models.CharField("Últimos 4 dígitos", max_length=4, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Método de pago"
        verbose_name_plural = "Métodos de pago"
        ordering = ["-created_at"]


class Transaction(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pendiente"
        COMPLETED = "COMPLETED", "Completado"
        FAILED = "FAILED", "Fallido"
        REFUNDED = "REFUNDED", "Reembolsado"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="transactions")
    amount = models.DecimalField("Monto", max_digits=10, decimal_places=2)
    gateway = models.CharField("Pasarela", max_length=20, default="stripe")
    gateway_transaction_id = models.CharField("ID transacción", max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField("Método", max_length=10)
    fee = models.DecimalField("Comisión pasarela", max_digits=8, decimal_places=2, default=0)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Transacción"
        verbose_name_plural = "Transacciones"
        ordering = ["-created_at"]


class Wallet(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="wallet", limit_choices_to={"user_type": "DOMICILIARIO"}
    )
    balance = models.DecimalField("Saldo", max_digits=10, decimal_places=2, default=0)
    blocked_balance = models.DecimalField("Saldo bloqueado", max_digits=10, decimal_places=2, default=0)
    last_payout_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Billetera"
        verbose_name_plural = "Billeteras"
