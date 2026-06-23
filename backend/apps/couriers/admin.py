from django.contrib import admin
from .models import CourierLocation, CourierStatus, AssignmentLog

@admin.register(CourierLocation)
class CourierLocationAdmin(admin.ModelAdmin):
    list_display = ["courier", "speed", "heading", "battery_level", "timestamp"]
    list_filter = ["timestamp"]

@admin.register(CourierStatus)
class CourierStatusAdmin(admin.ModelAdmin):
    list_display = ["courier", "is_online", "last_ping"]

@admin.register(AssignmentLog)
class AssignmentLogAdmin(admin.ModelAdmin):
    list_display = ["order", "courier", "score", "radius_used", "accepted", "created_at"]
