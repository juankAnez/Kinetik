from django.contrib import admin
from .models import Order, OrderItem, OrderStatusLog

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    readonly_fields = ["product_name", "product_price", "quantity", "options", "subtotal"]

class OrderStatusLogInline(admin.TabularInline):
    model = OrderStatusLog
    readonly_fields = ["from_status", "to_status", "changed_by", "created_at"]
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "store", "client", "courier", "status", "total", "payment_method", "created_at"]
    list_filter = ["status", "payment_method", "municipio", "created_at"]
    search_fields = ["id", "store__name", "client__phone"]
    inlines = [OrderItemInline, OrderStatusLogInline]
    readonly_fields = ["created_at", "updated_at"]
