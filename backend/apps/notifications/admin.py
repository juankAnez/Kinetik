from django.contrib import admin
from .models import PushToken, Notification


@admin.register(PushToken)
class PushTokenAdmin(admin.ModelAdmin):
    list_display = ["user", "platform", "is_active", "created_at"]
    list_filter = ["platform", "is_active"]
    search_fields = ["user__username", "user__email"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["user", "type", "title", "is_read", "created_at"]
    list_filter = ["type", "is_read"]
    search_fields = ["title", "user__username"]
