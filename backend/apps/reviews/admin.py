from django.contrib import admin
from .models import Review, Dispute


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["order", "client", "store", "rating", "courier_rating", "created_at"]
    list_filter = ["rating"]
    search_fields = ["order__id", "client__username"]


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ["order", "client", "reason", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["order__id", "client__username"]
