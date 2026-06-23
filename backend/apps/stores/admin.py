from django.contrib import admin
from .models import Store, StoreCategory, Schedule, Address

@admin.register(StoreCategory)
class StoreCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "order"]

@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "municipio", "plan", "is_active", "is_open", "total_orders"]
    list_filter = ["is_active", "is_open", "plan", "category", "municipio"]
    search_fields = ["name", "address"]
    prepopulated_fields = {"slug": ("name",)}

@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ["store", "get_day_display", "open_time", "close_time", "is_active"]

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ["user", "label", "address", "is_default"]
