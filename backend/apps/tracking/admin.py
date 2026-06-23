from django.contrib import admin
from .models import TrackingPoint, Route

@admin.register(TrackingPoint)
class TrackingPointAdmin(admin.ModelAdmin):
    list_display = ["courier", "order", "speed", "timestamp"]
    list_filter = ["timestamp"]

@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ["order", "distance_km", "estimated_duration_min", "started_at", "completed_at"]
