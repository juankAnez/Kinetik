from django.contrib import admin
from .models import Product, ProductCategory, ProductOption, InventoryLog

class ProductOptionInline(admin.TabularInline):
    model = ProductOption
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "store", "price", "is_available", "stock", "preparation_time"]
    list_filter = ["is_available", "store", "category"]
    search_fields = ["name", "store__name"]
    inlines = [ProductOptionInline]

@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "store", "order"]

@admin.register(InventoryLog)
class InventoryLogAdmin(admin.ModelAdmin):
    list_display = ["product", "quantity_change", "reason", "created_at"]
