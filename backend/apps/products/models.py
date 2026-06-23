from django.db import models
from apps.stores.models import Store


class ProductCategory(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="product_categories")
    name = models.CharField("Nombre", max_length=100)
    order = models.PositiveIntegerField("Orden", default=0)

    class Meta:
        verbose_name = "Categoría de producto"
        verbose_name_plural = "Categorías de productos"
        ordering = ["order"]

    def __str__(self):
        return f"{self.name} - {self.store.name}"


class Product(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="products")
    category = models.ForeignKey(ProductCategory, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField("Nombre", max_length=200)
    description = models.TextField("Descripción", blank=True)
    price = models.DecimalField("Precio", max_digits=10, decimal_places=2)
    compare_price = models.DecimalField("Precio comparativo", max_digits=10, decimal_places=2, null=True, blank=True)
    image = models.ImageField("Imagen", upload_to="products/", null=True, blank=True)
    is_available = models.BooleanField("Disponible", default=True)
    stock = models.PositiveIntegerField("Stock", default=0)
    preparation_time = models.PositiveIntegerField("Tiempo preparación (min)", default=10)
    sort_order = models.PositiveIntegerField("Orden", default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return f"{self.name} - ${self.price}"


class ProductOption(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="options")
    name = models.CharField("Nombre", max_length=100)
    choices = models.JSONField("Opciones", default=list)
    required = models.BooleanField("Requerido", default=False)
    max_choices = models.PositiveIntegerField("Máximo selecciones", default=1)

    class Meta:
        verbose_name = "Opción de producto"
        verbose_name_plural = "Opciones de productos"


class InventoryLog(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="inventory_logs")
    quantity_change = models.IntegerField("Cambio")
    reason = models.CharField("Razón", max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Log de inventario"
        verbose_name_plural = "Logs de inventario"
