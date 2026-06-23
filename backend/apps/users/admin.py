from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, ClientProfile, CourierProfile, CommerceProfile

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ["username", "email", "phone", "user_type", "municipio", "is_active"]
    list_filter = ["user_type", "is_active", "municipio"]
    fieldsets = UserAdmin.fieldsets + (
        ("Información adicional", {"fields": ("user_type", "phone", "municipio", "phone_verified", "is_available", "avatar")}),
    )

@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "total_orders", "total_spent"]

@admin.register(CourierProfile)
class CourierProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "avg_rating", "current_order_count", "total_deliveries", "total_earned"]

@admin.register(CommerceProfile)
class CommerceProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "store", "total_sales"]
