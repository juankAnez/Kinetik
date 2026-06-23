from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.gis.db import models as gis_models
from apps.municipios.models import Municipio


class User(AbstractUser):
    class UserType(models.TextChoices):
        CLIENTE = "CLIENTE", "Cliente"
        COMERCIO = "COMERCIO", "Comercio"
        DOMICILIARIO = "DOMICILIARIO", "Domiciliario"
        ADMIN = "ADMIN", "Administrador"

    user_type = models.CharField("Tipo de usuario", max_length=20, choices=UserType.choices)
    phone = models.CharField("Teléfono", max_length=20, unique=True)
    municipio = models.ForeignKey(
        Municipio, on_delete=models.SET_NULL, null=True, verbose_name="Municipio"
    )
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    is_available = models.BooleanField("Disponible", default=False)
    avatar = models.ImageField("Avatar", upload_to="avatars/", null=True, blank=True)

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_user_type_display()})"


class ClientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="client_profile")
    default_address = models.ForeignKey("stores.Address", on_delete=models.SET_NULL, null=True, blank=True)
    total_orders = models.PositiveIntegerField(default=0)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Perfil Cliente"
        verbose_name_plural = "Perfiles Cliente"


class CommerceProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="commerce_profile")
    store = models.OneToOneField("stores.Store", on_delete=models.CASCADE, null=True, blank=True)
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Perfil Comercio"
        verbose_name_plural = "Perfiles Comercio"


class CourierProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="courier_profile")
    last_location = gis_models.PointField(srid=4326, null=True, blank=True)
    current_order_count = models.PositiveIntegerField(default=0)
    avg_rating = models.FloatField(default=0.0)
    completion_rate = models.FloatField(default=1.0)
    idle_minutes = models.PositiveIntegerField(default=0)
    total_deliveries = models.PositiveIntegerField(default=0)
    total_earned = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    rejected_streak = models.PositiveIntegerField(default=0)
    blocked_until = models.DateTimeField(null=True, blank=True)
    license_number = models.CharField(max_length=50, blank=True)
    vehicle_type = models.CharField(max_length=50, blank=True)
    id_document = models.CharField(max_length=20, unique=True)

    class Meta:
        verbose_name = "Perfil Domiciliario"
        verbose_name_plural = "Perfiles Domiciliarios"

    def __str__(self):
        return f"Domiciliario: {self.user.get_full_name()}"
